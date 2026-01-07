import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get user settings
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const { data: userData, error } = await supabaseAdmin
            .from('phone_users')
            .select('*')
            .eq('supabase_user_id', user.id)
            .single()

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
        }

        return NextResponse.json({
            phone: userData.phone,
            inviteCode: userData.invite_code,
            createdAt: userData.created_at
        })

    } catch (error) {
        console.error('Settings API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT - Update user settings
export async function PUT(request: Request) {
    try {
        const { currentPassword, newPassword } = await request.json()

        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // Get current password hash
        const { data: userData, error: fetchError } = await supabaseAdmin
            .from('phone_users')
            .select('password_hash')
            .eq('supabase_user_id', user.id)
            .single()

        if (fetchError || !userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, userData.password_hash)
        if (!isValidPassword) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10)

        // Update password in phone_users
        const { error: updateError } = await supabaseAdmin
            .from('phone_users')
            .update({ password_hash: newPasswordHash })
            .eq('supabase_user_id', user.id)

        if (updateError) {
            console.error('Password update error:', updateError)
            return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'Password updated successfully'
        })

    } catch (error) {
        console.error('Settings API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
