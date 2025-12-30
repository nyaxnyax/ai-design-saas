import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
    try {
        const { phone } = await request.json()

        if (!phone) {
            return NextResponse.json({ error: '请提供手机号' }, { status: 400 })
        }

        // Check if phone exists in phone_users table
        const { data: existingUser, error } = await supabaseAdmin
            .from('phone_users')
            .select('id')
            .eq('phone', phone)
            .single()

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows returned (not found)
            console.error('Check phone error:', error)
            return NextResponse.json({ error: '查询失败' }, { status: 500 })
        }

        return NextResponse.json({
            registered: !!existingUser,
            phone
        })

    } catch (error) {
        console.error('Check Phone Error:', error)
        return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
    }
}
