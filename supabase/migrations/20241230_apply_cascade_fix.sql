-- CASCADE 修复迁移 - 直接执行所有修复步骤

-- Step 1: 删除 CASCADE 约束
ALTER TABLE phone_users DROP CONSTRAINT IF EXISTS phone_users_supabase_user_id_fkey;

-- Step 2: 添加新的约束（使用 SET NULL 而不是 CASCADE）
ALTER TABLE phone_users
ADD CONSTRAINT phone_users_supabase_user_id_fkey
FOREIGN KEY (supabase_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 3: 创建删除触发器函数
CREATE OR REPLACE FUNCTION handle_auth_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.phone_users WHERE supabase_user_id = OLD.id;
    DELETE FROM public.user_credits WHERE user_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_delete ON auth.users;

-- Step 5: 创建新触发器
CREATE TRIGGER on_auth_user_delete
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_auth_user_delete();
