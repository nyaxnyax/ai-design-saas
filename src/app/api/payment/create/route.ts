import { NextResponse } from 'next/server';
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
        // We generate the UUID by DB default, but we need it here.
        // So let's generate it manually or insert then update? 
        // Easier: Let DB generate, get it, then calculate tradeId.

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: user.id,
                plan_id: planId,
                amount: amount,
                status: 'pending',
                metadata: { plan_name: planName }
                // We will update 'trade_id' after insert or just use generated ID?
            })
            .select()
            .single();

        if (orderError) {
            console.error('Order creation failed:', orderError);
            return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
        }

        const tradeOrderId = order.id.replace(/-/g, ''); // 32 chars

        // Update order with trade_id so we can look it up easily in callback
        await supabase.from('orders').update({
            metadata: { ...order.metadata, trade_id: tradeOrderId }
        }).eq('id', order.id);

        // 3. Prepare Xunhu Pay Parameters
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
            total_fee: amount,
            title: `Plan: ${planName}`,
            time: Math.floor(Date.now() / 1000),
            notify_url: XUNHU_CONFIG.notifyUrl,
            return_url: XUNHU_CONFIG.returnUrl,
            callback_url: XUNHU_CONFIG.returnUrl,
            nonce_str: Math.random().toString(36).substring(2, 15),
            type: 'Wap',
            wap_url: process.env.NEXT_PUBLIC_BASE_URL,
        };

        params.hash = generateHash(params, XUNHU_CONFIG.appSecret);

        const formData = new URLSearchParams();
        for (const key in params) {
            formData.append(key, params[key]);
        }

        const response = await fetch(XUNHU_CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        const data = await response.json();

        if (data.openid || data.url || data.url_qrcode) {
            return NextResponse.json({ url: data.url || data.url_qrcode });
        } else {
            console.error('Xunhu Pay Error:', data);
            return NextResponse.json({ error: data.msg || 'Payment initialization failed' }, { status: 500 });
        }

    } catch (err) {
        console.error('Payment Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
