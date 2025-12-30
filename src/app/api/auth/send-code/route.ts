import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { SmsBaoClient } from '@/lib/smsbao'

// Initialize Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const smsClient = new SmsBaoClient(
    process.env.SMSBAO_USER || '',
    process.env.SMSBAO_PASS || ''
)

export async function POST(request: Request) {
    try {
        const { phone } = await request.json()

        if (!phone) {
            return NextResponse.json({ error: '请提供手机号' }, { status: 400 })
        }

        // 1. Check if phone is already registered
        const { data: existingUser } = await supabaseAdmin
            .from('phone_users')
            .select('id')
            .eq('phone', phone)
            .single()

        if (existingUser) {
            return NextResponse.json({
                error: '该手机号已注册，请直接登录',
                registered: true
            }, { status: 400 })
        }

        // 2. Check Rate Limit (1 code per 60s)
        const { data: existing } = await supabaseAdmin
            .from('verification_codes')
            .select('created_at')
            .eq('phone', phone)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (existing) {
            const lastTime = new Date(existing.created_at).getTime()
            const now = new Date().getTime()
            if (now - lastTime < 60000) {
                return NextResponse.json({ error: '发送太频繁，请稍后再试' }, { status: 429 })
            }
        }

        // 3. Generate Code
        const code = Math.floor(100000 + Math.random() * 900000).toString()

        // 4. Store in DB
        const { error: dbError } = await supabaseAdmin
            .from('verification_codes')
            .insert({
                phone,
                code,
                expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min expiry
            })

        if (dbError) {
            console.error('DB Error:', dbError)
            return NextResponse.json({
                error: '验证码生成失败',
                details: dbError.message || JSON.stringify(dbError)
            }, { status: 500 })
        }

        // 5. Send SMS
        // Note: Generic signature to improve delivery rate. Real signature requires carrier registration.
        const content = `【验证码】您的验证码是${code}。如非本人操作，请忽略。`

        let sendStatus = '0'

        // Only send if configured
        if (process.env.SMSBAO_USER) {
            console.log(`[SMS] Sending to ${phone} via SmsBao...`)
            // ALWAYS LOG THE CODE FOR DEBUGGING
            console.log(`[DEBUG] 🔑 Verification Code for ${phone}: ${code}`)

            sendStatus = await smsClient.send(phone, content)
            console.log(`[SMS] SmsBao Response: ${sendStatus}`)
        } else {
            console.log(`[DEV MODE] SMS to ${phone}: ${content}`)
        }

        if (sendStatus !== '0') {
            const errorMsg = SmsBaoClient.getErrorMessage(sendStatus)
            console.error(`[SMS] Failed: ${errorMsg} (Code: ${sendStatus})`)
            return NextResponse.json({
                error: `短信发送失败: ${errorMsg}`
            }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: '验证码已发送' })

    } catch (error) {
        console.error('Send Code Error:', error)
        return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
    }
}

