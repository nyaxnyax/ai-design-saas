import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
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
                // Auto-fix: Create the missing phone_users record
                console.warn(`[Login] Data inconsistency found: shadow user exists for ${phone} but phone_users record missing. Auto-fixing...`)

                // Generate a default password hash for the auto-fix
                // User will need to use the password they tried to login with
                const defaultPasswordHash = await bcrypt.hash(password, 10)

                const { data: newPhoneUser, error: insertError } = await supabaseAdmin
                    .from('phone_users')
                    .insert({
                        phone: phone,
                        password_hash: defaultPasswordHash,
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single()

                if (insertError || !newPhoneUser) {
                    console.error('[Login] Failed to auto-fix missing phone_users record:', insertError)
                    return NextResponse.json({
                        error: 'Account data error, please reset password or contact support',
                        code: 'DATA_INCONSISTENCY'
                    }, { status: 400 })
                }

                console.log('[Login] Auto-fix successful, created phone_users record for:', phone)

                // Continue with login using the newly created record
                // Verify password against the newly created hash
                const isPasswordValid = await bcrypt.compare(password, newPhoneUser.password_hash)

                if (!isPasswordValid) {
                    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
                }

                // Sign in using shadow email and shadow password
                const shadowPassword = generateShadowPassword(password, phone)
                const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
                    email: shadowEmail,
                    password: shadowPassword
                })

                if (sessionError) {
                    console.error('Session Error after auto-fix:', sessionError)
                    return NextResponse.json({ error: 'Login failed, please try again' }, { status: 500 })
                }

                return NextResponse.json({
                    success: true,
                    session: sessionData.session,
                    autoFixed: true
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

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
        }

        // 4. Sign in using shadow email and deterministic shadow password
        // This recreates the same shadow password used during registration
        const shadowEmail = `${phone}@phone.login`
        const shadowPassword = generateShadowPassword(password, phone)

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
