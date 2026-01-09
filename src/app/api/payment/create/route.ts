import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { XUNHU_CONFIG, generateHash, CreatePaymentParams } from '@/lib/payment/xunhu';

export async function POST(request: Request) {
    try {
        const { planId, amount, planName } = await request.json();

        // 1. Check User Auth
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Prepare Trade ID (UUID without hyphens for Xunhu)
        // Use Service Role client to bypass RLS for order creation
        const supabaseAdmin = require('@supabase/supabase-js').createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: user.id,
                plan_id: planId,
                amount: amount,
                status: 'pending',
                metadata: { plan_name: planName }
            })
            .select()
            .single();

        if (orderError) {
            console.error('Order creation failed:', orderError);
            return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
        }

        const tradeOrderId = order.id.replace(/-/g, ''); // 32 chars

        // Update order with trade_id so we can look it up easily in callback
        await supabaseAdmin.from('orders').update({
            metadata: { ...order.metadata, trade_id: tradeOrderId }
        }).eq('id', order.id);

        // 3. Prepare Xunhu Pay Parameters
        console.log('[PAYMENT] XUNHU_CONFIG:', {
            hasAppId: !!XUNHU_CONFIG.appId,
            appId: XUNHU_CONFIG.appId,
            hasAppSecret: !!XUNHU_CONFIG.appSecret,
            apiUrl: XUNHU_CONFIG.apiUrl
        });

        if (!XUNHU_CONFIG.appId || !XUNHU_CONFIG.appSecret) {
            // Graceful fallback for MVP if keys missing
            console.warn('Xunhu API keys missing')
            return NextResponse.json({
                error: 'Payment system configuration missing (APPID/SECRET). Please configure server.'
            }, { status: 503 });
        }

        const params: Record<string, any> = {
            version: '1.1',
            appid: XUNHU_CONFIG.appId,
            trade_order_id: tradeOrderId,
            total_fee: Number(amount).toFixed(2),
            title: planName, // 使用中文标题，不要前缀
            time: Math.floor(Date.now() / 1000),
            notify_url: XUNHU_CONFIG.notifyUrl,
            return_url: XUNHU_CONFIG.returnUrl,
            callback_url: XUNHU_CONFIG.returnUrl,
            nonce_str: Math.random().toString(36).substring(2, 15),
        };

        params.hash = generateHash(params, XUNHU_CONFIG.appSecret);

        const formData = new URLSearchParams();
        for (const key in params) {
            formData.append(key, params[key]);
        }

        console.log('[PAYMENT] Request params:', {
            ...params,
            hash: params.hash.substring(0, 10) + '...'
        });

        const response = await fetch(XUNHU_CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        const data = await response.json();

        console.log('[PAYMENT] Xunhu response:', data);

        // 根据虎皮椒API文档，成功时 errcode=0, errmsg="success!"
        if (data.errcode === 0 && data.errmsg === 'success!') {
            return NextResponse.json({ url: data.url });
        } else {
            console.error('Xunhu Pay Error:', data);
            return NextResponse.json({ error: data.errmsg || '支付初始化失败' }, { status: 500 });
        }

    } catch (err) {
        console.error('Payment Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
