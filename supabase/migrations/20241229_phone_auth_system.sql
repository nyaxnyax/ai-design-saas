-- 创建手机号用户表（存储密码哈希）
CREATE TABLE IF NOT EXISTS phone_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建索引加速手机号查询
CREATE INDEX IF NOT EXISTS phone_users_phone_idx ON phone_users (phone);

-- 启用 RLS
ALTER TABLE phone_users ENABLE ROW LEVEL SECURITY;

-- 仅服务端 service_role 可访问（RLS 会被 service_role 绕过）
CREATE POLICY "Deny public access" ON phone_users FOR ALL USING (false);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_phone_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER phone_users_updated_at
    BEFORE UPDATE ON phone_users
    FOR EACH ROW
    EXECUTE FUNCTION update_phone_users_updated_at();
