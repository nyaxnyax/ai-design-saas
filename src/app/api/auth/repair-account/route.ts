import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'

// Initialize Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Repair endpoint for data inconsistency
 * When a user exists in auth.users but not in phone_users,
 * this endpoint creates the missing phone_users record
 *
 * Since we don't have the original password, we set a default password
 * and the user needs to use "forgot password" or contact support
 */
export async function POST(request: Request) {
    try {
        const { phone, newPassword } = await request.json()

        if (!phone) {
            return NextResponse.json({ error: '手机号不能为空' }, { status: 400 })
        }

        const shadowEmail = `${phone}@phone.login`

        // Check if phone_users record exists
        const { data: existingPhoneUser, error: findError } = await supabaseAdmin
            .from('phone_users')
            .select('*')
            .eq('phone', phone)
            .maybeSingle()

        console.log('[Repair] Existing phone user query result:', { existingPhoneUser, findError })

        if (existingPhoneUser) {
            console.log('[Repair] Found existing phone user:', existingPhoneUser)
            // Check if password_hash is null - this means the account was partially repaired
            if (!existingPhoneUser.password_hash || newPassword) {
                const defaultPassword = newPassword || 'Aa123456'
                const passwordHash = await bcrypt.hash(defaultPassword, 10)

                console.log('[Repair] Updating password hash for user:', phone)
                const { error: updateError } = await supabaseAdmin
                    .from('phone_users')
                    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
                    .eq('phone', phone)

                if (updateError) {
                    console.error('[Repair] Update password error:', updateError)
                    return NextResponse.json({ error: '重置密码失败' }, { status: 500 })
                }

                // Also update Supabase auth user password
                await supabaseAdmin.auth.admin.updateUserById(existingPhoneUser.supabase_user_id, {
                    password: defaultPassword
                })

                return NextResponse.json({
                    success: true,
                    message: newPassword ? '密码重置成功，请重新登录' : '账号修复成功，请使用密码 Aa123456 登录',
                    defaultPassword: defaultPassword,
                    data: existingPhoneUser
                })
            }

            return NextResponse.json({
                success: true,
                message: '账号数据正常，无需修复',
                data: existingPhoneUser
            })
        }

        // Check if shadow user exists in auth.users
        const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()

        if (listError) {
            console.error('[Repair] List users error:', listError)
            return NextResponse.json({ error: '查询用户失败' }, { status: 500 })
        }

        const shadowUser = authUsers.users.find(u => u.email === shadowEmail)

        if (!shadowUser) {
            return NextResponse.json({
                error: '该手机号未注册',
                code: 'USER_NOT_FOUND'
            }, { status: 404 })
        }

        // Generate a default password or use the provided one
        const defaultPassword = newPassword || 'Aa123456'
        const passwordHash = await bcrypt.hash(defaultPassword, 10)

        // Create missing phone_users record with password hash
        const { data: newPhoneUser, error: insertError } = await supabaseAdmin
            .from('phone_users')
            .insert({
                phone: phone,
                supabase_user_id: shadowUser.id,
                password_hash: passwordHash,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (insertError) {
            console.error('[Repair] Insert phone_users error:', insertError)
            return NextResponse.json({ error: '修复账号失败' }, { status: 500 })
        }

        // Update Supabase auth user password to match
        await supabaseAdmin.auth.admin.updateUserById(shadowUser.id, {
            password: defaultPassword
        })

        // Initialize credits for this user
        const { data: existingCredits } = await supabaseAdmin
            .from('user_credits')
            .select('*')
            .eq('user_id', shadowUser.id)
            .maybeSingle()

        if (!existingCredits) {
            await supabaseAdmin
                .from('user_credits')
                .insert({
                    user_id: shadowUser.id,
                    balance: 15,
                    daily_generations: 0,
                    last_daily_reset: new Date().toISOString()
                })
        }

        return NextResponse.json({
            success: true,
            message: '账号修复成功，请使用密码 Aa123456 登录',
            defaultPassword: defaultPassword,
            data: newPhoneUser
        })

    } catch (error) {
        console.error('[Repair] Error:', error)
        return NextResponse.json({ error: '修复账号失败' }, { status: 500 })
    }
}
