-- ============================================
-- 创建异步任务表
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 创建任务表
CREATE TABLE IF NOT EXISTS generation_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    image_url TEXT,
    type TEXT NOT NULL DEFAULT 'text-to-image',
    settings JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    result_url TEXT,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_id ON generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_created_at ON generation_tasks(created_at DESC);

-- 创建 pending 任务的索引（用于 Cron Job 查询）
CREATE INDEX IF NOT EXISTS idx_generation_tasks_pending ON generation_tasks(status, created_at)
    WHERE status = 'pending';

-- 启用行级安全
ALTER TABLE generation_tasks ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的任务
CREATE POLICY "Users can view own tasks"
    ON generation_tasks FOR SELECT
    USING (auth.uid() = user_id);

-- Service role 可以管理所有任务（用于 Cron Job）
-- 注意：service_role_key 会绕过 RLS，所以这个策略主要作为文档说明
CREATE POLICY "Service role bypass for async processing"
    ON generation_tasks FOR ALL
    USING (false);  -- 实际上 service role 会绕过 RLS

-- 创建更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为任务表添加触发器
DROP TRIGGER IF EXISTS update_generation_tasks_updated_at ON generation_tasks;
CREATE TRIGGER update_generation_tasks_updated_at
    BEFORE UPDATE ON generation_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 完成！
-- 你可以运行以下查询验证：
-- SELECT * FROM generation_tasks;
