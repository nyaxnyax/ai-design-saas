import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTask } from '@/lib/task-queue';
import type { TaskStatusResponse } from '@/types/generation';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const taskId = searchParams.get('task_id');

        if (!taskId) {
            return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
        }

        const task = await getTask(taskId);

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const response: TaskStatusResponse = {
            task_id: task.id,
            status: task.status,
            result_url: task.result_url || undefined,
            error: task.error || undefined
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('Check Status Error:', error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    }
}
