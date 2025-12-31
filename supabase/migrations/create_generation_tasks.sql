-- Create generation_tasks table for async image generation
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_id ON generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_created_at ON generation_tasks(created_at DESC);

-- Create index for pending tasks query
CREATE INDEX IF NOT EXISTS idx_generation_tasks_pending ON generation_tasks(status, created_at)
    WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE generation_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own tasks
CREATE POLICY "Users can view own tasks"
    ON generation_tasks FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can manage all tasks (for Cron Job)
CREATE POLICY "Service role can manage all tasks"
    ON generation_tasks FOR ALL
    USING (role() = 'service_role');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_generation_tasks_updated_at
    BEFORE UPDATE ON generation_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
