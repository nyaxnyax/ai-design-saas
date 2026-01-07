import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

        // Get current balance
        const { data: creditsData } = await supabaseAdmin
            .from('user_credits')
            .select('balance')
            .eq('user_id', user.id)
            .eq('user_id', user.id)
            .single()

        let currentBalance = creditsData?.balance || 0
        let lastReset = creditsData?.last_daily_reset || new Date(0).toISOString()

        // Check if user is a paid user
        // Check if user is a paid user
        const { count: paidOrdersCount, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'paid');
        
        if (orderError) {
             console.error('[CREDITS] Failed to check paid status:', orderError);
             return NextResponse.json({ error: 'System busy checking account status' }, { status: 500 });
        }

        const isPaidUser = (paidOrdersCount || 0) > 0;

        // Check for Daily Reset
        const now = new Date()
        const lastResetDate = new Date(lastReset)
        const isSameDay = now.getUTCFullYear() === lastResetDate.getUTCFullYear() &&
            now.getUTCMonth() === lastResetDate.getUTCMonth() &&
            now.getUTCDate() === lastResetDate.getUTCDate()

        let shouldUpdate = false;
        let newBalance = 10;

        if (isPaidUser) {
            // PAID USERS: Only top up if below 10 on a new day. DO NOT CAP.
            if (!isSameDay && currentBalance < 10) {
                shouldUpdate = true;
                newBalance = 10;
                console.log(`[Credits] Paid User Daily Top-up for ${user.email}. ${currentBalance} -> 10`);
            }
        } else {
            // FREE USERS: Strict Rule - Daily Limit is 10.
            // If it's a new day, RESET to 10 (even if they had 15).
            // If they somehow have > 10 (e.g. legacy bug), FORCE RESET to 10.
            if (!isSameDay || currentBalance > 10) {
                shouldUpdate = true;
                newBalance = 10;
                console.log(`[Credits] Free User Strict Reset for ${user.email}. ${currentBalance} -> 10`);
            } else if (currentBalance < 10 && !isSameDay) {
                // Standard top-up (Duplicate of !isSameDay above, but explicit for clarity)
                shouldUpdate = true;
                newBalance = 10;
            }
        }

        if (shouldUpdate) {
            const { error: updateError } = await supabaseAdmin
                .from('user_credits')
                .update({ 
                    balance: newBalance,
                    daily_generations: 0, 
                    last_daily_reset: now.toISOString()
                })
                .eq('user_id', user.id)

            if (!updateError) {
                // Log transaction
                const diff = newBalance - currentBalance;
                if (diff !== 0) {
                    await supabaseAdmin.from('credit_transactions').insert({
                        user_id: user.id,
                        amount: diff,
                        balance_after: newBalance,
                        type: 'system', // 'system' reset
                        description: isPaidUser ? '每日积分补给 (Daily Top-up)' : '每日积分重置 (Daily Reset)'
                    })
                }
                currentBalance = newBalance
            }
        }

        // Get transaction history
        const { data: transactions, error } = await supabaseAdmin
            .from('credit_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Error fetching transactions:', error)
            return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
        }

        return NextResponse.json({
            balance: currentBalance,
            transactions: transactions || []
        })

    } catch (error) {
        console.error('Credits API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
