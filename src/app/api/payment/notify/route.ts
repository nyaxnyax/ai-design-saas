import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { XUNHU_CONFIG, generateHash } from '@/lib/payment/xunhu';

export async function POST(request: Request) {
    try {
        const contentType = request.headers.get('content-type') || '';
        let data: Record<string, any> = {};

        if (contentType.includes('application/json')) {
            data = await request.json();
        } else {
            const formData = await request.formData();
            data = Object.fromEntries(formData.entries());
        }

        console.log('Payment Notify Received:', data);

        // 1. Verify Signature
        // 关键：克隆一个不包含 hash 的对象用于校验
        const { hash: receivedHash, ...paramsToVerify } = data;
        const computedHash = generateHash(paramsToVerify, XUNHU_CONFIG.appSecret || '');

        console.log('Signature Check:', { received: receivedHash, computed: computedHash });

        if (receivedHash !== computedHash) {
            console.error('Invalid Signature for Order:', paramsToVerify.trade_order_id);
            return new NextResponse('fail', { status: 400 });
        }

        // 2. Check Payment Status
        if (paramsToVerify.status === 'OD') { // OD means Order Done (Success)

            // 3. Update Order in DB
            const supabase = await createClient(); // Use service role if needed? Wait, 'createClient' uses standard cookie auth or anon?
            // Webhooks don't have user cookies. We need a SERVICE ROLE client to update orders by ID if RLS blocks us.
            // But for now, let's assume we might need the SUPABASE_SERVICE_ROLE_KEY env var

            // Actually, user standard client won't work here. We need Admin access.
            // Assuming we have createAdminClient or similar, or just using the standard client with service key if available.
            // Let's defer to a helper. If 'createClient' only uses cookies, we are in trouble.
            // The user's instructions didn't specify a service client helper.
            // Users often use a separate `createAdminClient` or pass keys directly.

            /* 
               HACK: For now, I will assume basic RLS allows update if we found the order? 
               No, RLS usually restricts. 
               Let's look for @/lib/supabase/admin inside 'src/lib' first? 
               I haven't seen it in file list. I will implement a rudimentary Service Client here if needed, 
               or just try to skip strict RLS check for now? 
               No, security is important.
               
               Let's check if process.env.SUPABASE_SERVICE_ROLE_KEY exists in env.local
            */

            const internalClient = process.env.SUPABASE_SERVICE_ROLE_KEY
                ? require('@supabase/supabase-js').createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                )
                : await createClient(); // Fallback (might fail)

            // Find the order using trade_order_id (which we sent as our UUID without hyphens? or just stripped)
            // Wait, in create route I sent: tradeOrderId = order.id.replace(/-/g, '')
            // So we need to match that.
            // But simpler: just query where 'id' matches (reconstruct UUID? No, hard).
            // Let's store the trade_order_id in DB? No, I didn't add it. 
            // I added 'provider_trade_no'.

            // Better: We sent the order.id (sanitized) as 'trade_order_id'. 
            // When we get it back as 'trade_order_id' (from Xunhu), it corresponds to our order. but it might be consistent.
            // Actually, Xunhu sends back 'trade_order_id' as the one we sent them.

            // So we need to find the order where `replace(id, '-', '')` equals `data.trade_order_id`.
            // Or simpler, just store the sanitized ID in the 'metadata' or 'provider_trade_no'?
            // No, 'provider_trade_no' is THEIRS.

            // FIX: In create route, let's just use the RAW UUID if Xunhu supports 32 chars. 
            // Xunhu doc says "Unique order ID". 
            // If let's say I stripped hyphens, I need to find it effectively.
            // Let's try to query by simplified ID if possible? 
            // Or just let's not strip hyphens in CREATE route? 
            // "trade_order_id" supports up to 32 chars? UUID is 36 chars.
            // So stripping hyphens makes it 32 chars. Perfect.

            // So we need to query based on stripped ID?
            // Supabase/Postgres doesn't easy native "stripped uuid lookup".
            // Better Strategy: Store the `trade_order_id` in the `orders` table when creating!
            // I will update the Create Logic to update the order with the generated trade_order_id before sending.
            // Or just alter table to add `trade_id` column?
            // No, I can put it in metadata.

            const tradeOrderId = paramsToVerify.trade_order_id;

            const { data: orderData, error: findError } = await internalClient
                .from('orders')
                .select('*')
                .eq('metadata->>trade_id', tradeOrderId) // Query generic JSONB
                .single();

            if (findError || !orderData) {
                console.error('Order not found for trade_id:', tradeOrderId);
                // Return success to stop Xunhu from retrying if it's a logic error on our side?
                // Or fail? Let's fail.
                return new NextResponse('fail', { status: 404 });
            }

            // ... (previous code)

            // Update Order
            const { error: updateError } = await internalClient
                .from('orders')
                .update({
                    status: 'paid',
                    provider_trade_no: paramsToVerify.open_order_id, // Xunhu's ID
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderData.id);

            if (updateError) {
                console.error('Update failed', updateError);
                return new NextResponse('fail', { status: 500 });
            }

            // FULFILLMENT LOGIC
            // Determine what to give based on plan_id and amount
            const planId = orderData.plan_id;
            const amount = parseFloat(orderData.amount || '0');

            let creditsToAdd = 0;
            let subTier: string | null = null;
            let subDurationMonths = 0;

            // 积分包与订阅发放逻辑 (漏洞防御版)
            switch (planId) {
                // --- 积分包 (一次性) ---
                case 'gift':
                    creditsToAdd = 30;
                    break;
                case 'starter':
                    creditsToAdd = 100;
                    break;
                case 'popular':
                    creditsToAdd = 650; // 含 50 赠送
                    break;
                case 'expert':
                    creditsToAdd = 4000; // 含 500 赠送
                    break;

                // --- 订阅方案 (按月/按年) ---
                case 'lite':
                    subTier = 'lite';
                    if (amount > 200) { // 年付 (289 > 200)
                        creditsToAdd = 225 * 12; // 一次性发放全年
                        subDurationMonths = 12;
                    } else {
                        creditsToAdd = 225;
                        subDurationMonths = 1;
                    }
                    break;
                case 'pro':
                    subTier = 'pro';
                    if (amount > 500) { // 年付 (890 > 500)
                        creditsToAdd = 750 * 12;
                        subDurationMonths = 12;
                    } else {
                        creditsToAdd = 750;
                        subDurationMonths = 1;
                    }
                    break;
                case 'agency':
                    subTier = 'agency';
                    if (amount > 2000) { // 年付 (2890 > 2000)
                        creditsToAdd = 2250 * 12;
                        subDurationMonths = 12;
                    } else {
                        creditsToAdd = 2250;
                        subDurationMonths = 1;
                    }
                    break;
            }

            if (creditsToAdd > 0 || subTier) {
                // Get current credits logic first or just increment?
                // We need to fetch current record to update subscription date correctly (extend if active?)
                // For MVP: Just set expiry to now + duration from TODAY? 
                // Creating a better UX: If active, extend. If expired, reset.
                // But simplified: Update user_credits.

                // Fetch first
                const { data: userCredit, error: fetchErr } = await internalClient
                    .from('user_credits')
                    .select('*')
                    .eq('user_id', orderData.user_id)
                    .single();

                if (!fetchErr && userCredit) {
                    const updates: any = {
                        balance: (userCredit.balance || 0) + creditsToAdd,
                        updated_at: new Date().toISOString()
                    };

                    if (subTier) {
                        updates.subscription_tier = subTier;

                        const now = new Date();
                        let currentExpiry = userCredit.subscription_expires_at ? new Date(userCredit.subscription_expires_at) : new Date(0);

                        // If already active and same tier? (Simplified: Always extend from MAX(now, currentExpiry))
                        // If user upgrades, we might want to just reset date but keep credits.
                        // Let's implement: New Expiry = Max(Now, CurrentExpiry) + Duration

                        if (currentExpiry < now) currentExpiry = now;

                        const newExpiry = new Date(currentExpiry);
                        newExpiry.setMonth(newExpiry.getMonth() + subDurationMonths);

                        updates.subscription_expires_at = newExpiry.toISOString();
                        updates.subscription_status = 'active';
                    }

                    await internalClient
                        .from('user_credits')
                        .update(updates)
                        .eq('user_id', orderData.user_id);

                } else {
                    // No credit record? Should exist from trigger. But create if missing.
                    const updates: any = {
                        user_id: orderData.user_id,
                        balance: creditsToAdd,
                        daily_generations: 0
                    };
                    if (subTier) {
                        updates.subscription_tier = subTier;
                        const newExpiry = new Date();
                        newExpiry.setMonth(newExpiry.getMonth() + subDurationMonths);
                        updates.subscription_expires_at = newExpiry.toISOString();
                        updates.subscription_status = 'active';
                    }

                    await internalClient.from('user_credits').insert(updates);
                }
            }

        }

        return new NextResponse('success');
    } catch (err) {
        console.error('Webhook Error:', err);
        return new NextResponse('fail', { status: 500 });
    }
}
