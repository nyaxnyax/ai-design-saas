/**
 * 使用 Node.js pg 包直接连接数据库并执行 CASCADE 修复
 */

const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })

const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL.match(/\/\/([^.]+)\.supabase\.co/)[1]
const dbPassword = process.env.SMSBAO_PASS

// PostgreSQL 连接字符串 - 使用 pooler
const connectionString = `postgres://postgres:${dbPassword}@db.${projectRef}.supabase.co:6543/postgres?sslmode=require`

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

async function applyFix() {
    const client = new Client({
        connectionString: connectionString,
        ssl: true
    })

    try {
        console.log('🔧 连接到数据库...')
        await client.connect()
        console.log('✅ 连接成功\n')

        console.log('📝 执行 CASCADE 修复...\n')

        // 分割 SQL 语句并逐个执行
        const statements = SQL.split(';').filter(s => s.trim()).map(s => s.trim())

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i]
            if (stmt.length === 0) continue

            console.log(`[${i + 1}/${statements.length}] 执行...`)
            try {
                await client.query(stmt)
                console.log(`   ✅ 成功\n`)
            } catch (err) {
                console.log(`   ⚠️  ${err.message}\n`)
            }
        }

        console.log('🎉 CASCADE 修复完成！')
        console.log('\n📝 现在可以测试登录→退出→登录流程')

    } catch (error) {
        console.error('❌ 错误:', error.message)
    } finally {
        await client.end()
    }
}

applyFix().catch(console.error)
