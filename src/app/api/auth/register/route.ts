import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Initialize Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Generate a deterministic shadow password based on user's password
// This allows us to recreate the same password during login
const generateShadowPassword = (userPassword: string, phone: string) => {
    // Create a deterministic "shadow" password by combining phone + user password + salt
    const salt = 'supabase-shadow-auth-salt-2024'
    const combined = phone + userPassword + salt
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 32) + 'Aa1!'
}

export async function POST(request: Request) {
    try {
        const { phone, code, password } = await request.json()

        if (!phone || !code || !password) {
            return NextResponse.json({ error: '请填写完整信息' }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ error: '密码至少6位' }, { status: 400 })
        }

        // 1. Check if phone already registered
        const { data: existingUser } = await supabaseAdmin
            .from('phone_users')
            .select('id')
            .eq('phone', phone)
            .maybeSingle()

        if (existingUser) {
            return NextResponse.json({ error: '该手机号已注册，请直接登录' }, { status: 400 })
        }

        // Also check if shadow user exists in auth.users (data consistency check)
        const shadowEmail = `${phone}@phone.login`
        const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        if (!listError && authUsers) {
            const existingShadowUser = authUsers.users.find(u => u.email === shadowEmail)
            if (existingShadowUser) {
                // Shadow user exists - this means the user is already registered
                // Return an error telling them to login instead of cleaning up
                return NextResponse.json({
                    error: '该手机号已注册，请直接登录',
                    code: 'ALREADY_REGISTERED'
                }, { status: 400 })
            }
        }

        // 2. Verify Code
        const { data: record, error: verifyError } = await supabaseAdmin
            .from('verification_codes')
            .select('*')
            .eq('phone', phone)
            .eq('code', code)
            .eq('verified', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (verifyError || !record) {
            return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 })
        }

        // 3. Mark verification code as used
        await supabaseAdmin
            .from('verification_codes')
            .update({ verified: true })
            .eq('id', record.id)

        // 4. Hash the password
        const passwordHash = await bcrypt.hash(password, 10)

        // 5. Create Supabase shadow user (shadowEmail is already defined above)
        // Generate deterministic shadow password so we can recreate it during login
        const shadowPassword = generateShadowPassword(password, phone)

        let supabaseUserId = ''

        try {
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: shadowEmail,
                password: shadowPassword,
                email_confirm: true,
                user_metadata: { phone_number: phone }
            })

            if (createError) throw createError
            supabaseUserId = newUser.user.id

        } catch (err: unknown) {
            // User might already exist (edge case)
            const error = err as { message?: string; status?: number }
            if (error?.message?.includes('registered') || error?.status === 422 || error?.status === 400) {
                const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                    type: 'magiclink',
                    email: shadowEmail
                })

                if (linkError) throw linkError
                supabaseUserId = linkData.user.id
            } else {
                throw err
            }
        }

        // 6. Save to phone_users table
        const { error: insertError } = await supabaseAdmin
            .from('phone_users')
            .insert({
                phone,
                password_hash: passwordHash,
                supabase_user_id: supabaseUserId
            })

        if (insertError) {
            console.error('Insert phone_users error:', insertError)
            return NextResponse.json({ error: '注册失败，请重试' }, { status: 500 })
        }

        // 7. Sign in the user
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
            email: shadowEmail,
            password: shadowPassword
        })

        if (sessionError) throw sessionError

        return NextResponse.json({
            success: true,
            message: '注册成功',
            session: sessionData.session
        })

    } catch (error) {
        console.error('Register Error:', error)
        return NextResponse.json({ error: '注册失败' }, { status: 500 })
    }
}
