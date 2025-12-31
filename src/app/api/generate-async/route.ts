import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateCreditCost } from '@/lib/credit-calculator';
import { createTask } from '@/lib/task-queue';
import type { AsyncGenerateResponse } from '@/types/generation';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DAILY_FREE_LIMIT = 3;

export async function POST(req: Request) {
    try {
        // 1. Authenticate User
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized: Missing Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
        }

        const { prompt, image_url, type, settings } = await req.json();

        // 2. Validate Inputs
        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // 3. Calculate cost
        const cost = calculateCreditCost(type, settings);

        // 4. Check Credits & Daily Limit
        const { data: creditRecord } = await supabaseAdmin
            .from('user_credits')
            .select('*')
            .eq('user_id', user.id)
            .single();

        let currentCredits = 0;
        let dailyCount = 0;
        let lastReset = new Date(0).toISOString();

        if (!creditRecord) {
            await supabaseAdmin
                .from('user_credits')
                .insert({ user_id: user.id, balance: 15, daily_generations: 0 });
            currentCredits = 15;
            dailyCount = 0;
        } else {
            currentCredits = creditRecord.balance;
            dailyCount = creditRecord.daily_generations;
            lastReset = creditRecord.last_daily_reset;
        }

        const now = new Date();
        const lastResetDate = new Date(lastReset);
        const isSameDay = now.getUTCFullYear() === lastResetDate.getUTCFullYear() &&
            now.getUTCMonth() === lastResetDate.getUTCMonth() &&
            now.getUTCDate() === lastResetDate.getUTCDate();

        if (!isSameDay) {
            dailyCount = 0;
        }

        let isFreeUsage = dailyCount < DAILY_FREE_LIMIT;

        if (!isFreeUsage && currentCredits < cost) {
            return NextResponse.json({ error: '积分不足 (Insufficient Credits)' }, { status: 402 });
        }

        // 5. Create task
        const task = await createTask(
            user.id,
            prompt,
            image_url || '',
            type,
            settings || {}
        );

        // 6. Deduct credits (upfront for async tasks)
        if (isFreeUsage) {
            await supabaseAdmin.from('user_credits').update({
                daily_generations: dailyCount + 1,
                last_daily_reset: new Date().toISOString()
            }).eq('user_id', user.id);
        } else {
            await supabaseAdmin.from('user_credits').update({
                balance: currentCredits - cost
            }).eq('user_id', user.id);
        }

        // 7. Return task ID
        const response: AsyncGenerateResponse = {
            task_id: task.id,
            status: 'pending',
            message: settings?.resolution === '4K'
                ? '4K 图片已加入队列，预计等待 2-3 分钟'
                : '图片已加入队列，请稍候'
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('Generate Async Route Error:', error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    }
}
