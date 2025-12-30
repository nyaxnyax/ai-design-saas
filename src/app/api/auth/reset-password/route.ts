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
        const { phone, newPassword } = await request.json()

        if (!phone || !newPassword) {
            return NextResponse.json({ error: 'Phone and new password required' }, { status: 400 })
        }

        const shadowEmail = `${phone}@phone.login`

        // 1. Hash the new password for phone_users table
        const passwordHash = await bcrypt.hash(newPassword, 10)

        // 2. Update the password in phone_users
        const { data: phoneUserData, error: phoneUserError } = await supabaseAdmin
            .from('phone_users')
            .update({ password_hash: passwordHash })
            .eq('phone', phone)
            .select()

        if (phoneUserError) {
            console.error('[Reset Password] Error updating phone_users:', phoneUserError)
            return NextResponse.json({ error: phoneUserError.message }, { status: 500 })
        }

        console.log('[Reset Password] phone_users password updated for:', phone)

        // 3. Update the Supabase Auth user password
        // Generate the shadow password that will be used for Supabase Auth
        const shadowPassword = generateShadowPassword(newPassword, phone)

        // First, find the user by email
        const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        let authUserId = null

        if (!listError && authUsers) {
            const targetUser = authUsers.users.find(u => u.email === shadowEmail)
            if (targetUser) {
                authUserId = targetUser.id
            }
        }

        if (!authUserId) {
            console.error('[Reset Password] Auth user not found for:', shadowEmail)
            return NextResponse.json({ error: 'Auth user not found' }, { status: 404 })
        }

        // Update the user's password using admin API
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            authUserId,
            { password: shadowPassword }
        )

        if (updateError) {
            console.error('[Reset Password] Error updating auth user:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        console.log('[Reset Password] Auth password updated for:', phone)

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully'
        })

    } catch (error) {
        console.error('[Reset Password] Error:', error)
        return NextResponse.json({ error: 'Password reset failed' }, { status: 500 })
    }
}
