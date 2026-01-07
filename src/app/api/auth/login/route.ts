import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Generate the same deterministic shadow password used during registration
const generateShadowPassword = (userPassword: string, phone: string) => {
    const salt = 'supabase-shadow-auth-salt-2024'
    const combined = phone + userPassword + salt
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 32) + 'Aa1!'
}

// Initialize Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
    try {
        const { phone, password } = await request.json()

        if (!phone || !password) {
            return NextResponse.json({ error: 'Please fill in phone and password' }, { status: 400 })
        }

        // 1. Find user by phone in phone_users table
        const { data: phoneUser, error: findError } = await supabaseAdmin
            .from('phone_users')
            .select('*')
            .eq('phone', phone)
            .maybeSingle()

        console.log('[Login] Phone user query result:', { phone, phoneUser: phoneUser ? { id: phoneUser.id, phone: phoneUser.phone } : null, findError })

        // 2. If not found, check for data inconsistency
        if (!phoneUser) {
            const shadowEmail = `${phone}@phone.login`

            // Check if user exists by email (shadow email)
            const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
            let existingAuthUser = null;

            if (!listError && authUsers) {
                existingAuthUser = authUsers.users.find(u => u.email === shadowEmail)
            }

            if (existingAuthUser) {
                // Shadow user exists but phone_users record is missing
                // Strategy: First update auth password, then try auth login, then create phone_users record
                console.warn(`[Login] Data inconsistency: shadow user exists for ${phone} but phone_users missing. Attempting repair...`)

                // Step 1: Update auth user's password
                const shadowPassword = generateShadowPassword(password, phone)
                const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                    existingAuthUser.id,
                    { password: shadowPassword }
                )

                if (updateError) {
                    console.warn('[Login] Failed to update auth password:', updateError)
                }

                // Step 2: Try to sign in with Supabase Auth (bypasses RLS)
                const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
                    email: shadowEmail,
                    password: shadowPassword
                })

                if (sessionError || !sessionData.session) {
                    console.error('[Login] Auth failed after repair attempt:', sessionError)
                    return NextResponse.json({
                        error: '密码错误或账号异常，请使用重置密码功能',
                        code: 'AUTH_FAILED'
                    }, { status: 401 })
                }

                console.log('[Login] Auth successful! Now creating phone_users record...')

                // Step 3: Create phone_users record AFTER successful auth
                const passwordHash = await bcrypt.hash(password, 10)
                const { error: insertError } = await supabaseAdmin
                    .from('phone_users')
                    .insert({
                        phone: phone,
                        password_hash: passwordHash,
                        supabase_user_id: existingAuthUser.id,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })

                if (insertError) {
                    console.warn('[Login] Warning: Could not create phone_users record after auth:', insertError)
                    // Continue anyway - user is authenticated
                } else {
                    console.log('[Login] phone_users record created successfully')
                }

                // Step 4: Initialize credits if needed
                const { data: existingCredits } = await supabaseAdmin
                    .from('user_credits')
                    .select('*')
                    .eq('user_id', existingAuthUser.id)
                    .maybeSingle()

                if (!existingCredits) {
                    await supabaseAdmin
                        .from('user_credits')
                        .insert({
                            user_id: existingAuthUser.id,
                            balance: 10,
                            daily_generations: 0,
                            last_daily_reset: new Date().toISOString()
                        })
                    console.log('[Login] Credits initialized for user')
                }

                return NextResponse.json({
                    success: true,
                    session: sessionData.session,
                    autoFixed: true,
                    message: '登录成功，账号数据已自动修复'
                })
            }

            // No user found anywhere
            return NextResponse.json({
                error: 'Phone number not registered',
                registered: false
            }, { status: 400 })
        }

        // 3. Verify password against phone_users.password_hash
        const isPasswordValid = await bcrypt.compare(password, phoneUser.password_hash)

        const shadowEmail = `${phone}@phone.login`
        const shadowPassword = generateShadowPassword(password, phone)

        // If phone_users password doesn't match, try Supabase Auth as fallback
        // This handles the case where passwords are out of sync
        if (!isPasswordValid) {
            console.warn('[Login] phone_users password mismatch, trying Supabase Auth fallback...')

            // Try to sign in with Supabase Auth
            const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
                email: shadowEmail,
                password: shadowPassword
            })

            if (sessionError || !sessionData.session) {
                // Both auth methods failed - password is really wrong
                console.error('[Login] Password verification failed')
                return NextResponse.json({
                    error: '密码错误，如忘记密码请使用重置密码功能',
                    code: 'INVALID_PASSWORD'
                }, { status: 401 })
            }

            // Supabase Auth succeeded! Update phone_users password to sync
            console.log('[Login] Supabase Auth successful, syncing phone_users password...')
            const newPasswordHash = await bcrypt.hash(password, 10)
            await supabaseAdmin
                .from('phone_users')
                .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
                .eq('id', phoneUser.id)

            console.log('[Login] Password synced successfully')

            return NextResponse.json({
                success: true,
                session: sessionData.session,
                message: '登录成功，密码已自动同步'
            })
        }

        // 4. Sign in using shadow email and deterministic shadow password
        // This recreates the same shadow password used during registration

        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
            email: shadowEmail,
            password: shadowPassword
        })

        if (sessionError) {
            console.error('Session Error:', sessionError)
            return NextResponse.json({ error: 'Login failed, please try again' }, { status: 500 })
        }

        // 5. Update last login time (only phone_users table, safe!)
        await supabaseAdmin
            .from('phone_users')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', phoneUser.id)

        return NextResponse.json({
            success: true,
            session: sessionData.session
        })

    } catch (error) {
        console.error('Login Error:', error)
        return NextResponse.json({ error: 'Login failed' }, { status: 500 })
    }
}
