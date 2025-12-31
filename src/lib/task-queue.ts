import { createClient } from '@supabase/supabase-js';
import type { GenerationTask, TaskStatus } from '@/types/generation';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Create a new generation task
 */
export async function createTask(
    userId: string,
    prompt: string,
    imageUrl: string,
    type: string,
    settings: any
): Promise<GenerationTask> {
    const { data, error } = await supabaseAdmin
        .from('generation_tasks')
        .insert({
            user_id: userId,
            prompt,
            image_url: imageUrl,
            type,
            settings,
            status: 'pending'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get a task by ID
 */
export async function getTask(taskId: string): Promise<GenerationTask | null> {
    const { data, error } = await supabaseAdmin
        .from('generation_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

    if (error) return null;
    return data;
}

/**
 * Update task status
 */
export async function updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    resultUrl?: string,
    error?: string
): Promise<void> {
    const updateData: any = {
        status,
        updated_at: new Date().toISOString()
    };

    if (resultUrl) updateData.result_url = resultUrl;
    if (error) updateData.error = error;

    const { error } = await supabaseAdmin
        .from('generation_tasks')
        .update(updateData)
        .eq('id', taskId);

    if (error) throw error;
}

/**
 * Get pending tasks (for Cron Job)
 */
export async function getPendingTasks(limit: number = 5): Promise<GenerationTask[]> {
    const { data, error } = await supabaseAdmin
        .from('generation_tasks')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

/**
 * Get user's recent tasks
 */
export async function getUserTasks(userId: string, limit: number = 10): Promise<GenerationTask[]> {
    const { data, error } = await supabaseAdmin
        .from('generation_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}
