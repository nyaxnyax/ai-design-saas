/**
 * 使用 Supabase REST API 执行 CASCADE 修复
 */

const https = require('https')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// 提取 project ref
const projectRef = SUPABASE_URL.match(/\/\/([^.]+)\.supabase\.co/)[1]

const SQL = `
-- Step 1: 删除 CASCADE 约束
ALTER TABLE phone_users DROP CONSTRAINT IF EXISTS phone_users_supabase_user_id_fkey;

-- Step 2: 添加新的约束（使用 SET NULL）
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

-- Step 4: 删除旧触发器
DROP TRIGGER IF EXISTS on_auth_user_delete ON auth.users;

-- Step 5: 创建新触发器
CREATE TRIGGER on_auth_user_delete
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_auth_user_delete();
`

console.log('🔧 尝试通过 REST API 执行修复...')
console.log('Project Ref:', projectRef)
console.log('')

// Supabase 不支持通过 REST API 直接执行 DDL
// 必须使用 SQL Editor 或 psql

console.log('❌ Supabase REST API 不支持直接执行 DDL 语句')
console.log('')
console.log('📋 请使用以下方法之一执行修复:')
console.log('')
console.log('方法 1: 访问 Supabase Dashboard')
console.log(`  URL: https://app.supabase.com/project/${projectRef}/sql`)
console.log('')
console.log('方法 2: 使用 psql 命令')
console.log(`  psql postgresql://postgres:${process.env.SMSBAO_PASS}@db.${projectRef}.supabase.co:5432/postgres -f scripts/fix-cascade.sql`)
console.log('')
console.log('📝 要执行的 SQL:')
console.log('---')
console.log(SQL.trim())
console.log('---')
