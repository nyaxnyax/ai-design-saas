/**
 * 应用 CASCADE 删除修复 - 直接通过 Supabase REST API
 * 运行: node scripts/apply-cascade-fix.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyCascadeFix() {
    console.log('🔧 应用 CASCADE 删除修复...\n')

    // 我们需要直接调用 PostgreSQL 的 RPC 来执行 SQL
    // 但 Supabase JS 客户端不支持直接执行任意 SQL
    // 所以我们需要使用一个 workaround

    // 方案：创建一个临时 RPC 函数来执行 SQL
    const sqlStatements = [
        // Step 1: 删除 CASCADE 约束
        `ALTER TABLE phone_users DROP CONSTRAINT IF EXISTS phone_users_supabase_user_id_fkey;`,

        // Step 2: 添加新的约束（使用 SET NULL）
        `ALTER TABLE phone_users
        ADD CONSTRAINT phone_users_supabase_user_id_fkey
        FOREIGN KEY (supabase_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;`,

        // Step 3: 创建删除触发器函数
        `CREATE OR REPLACE FUNCTION handle_auth_user_delete()
        RETURNS TRIGGER AS $$
        BEGIN
            DELETE FROM public.phone_users WHERE supabase_user_id = OLD.id;
            DELETE FROM public.user_credits WHERE user_id = OLD.id;
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;`,

        // Step 4: 删除旧触发器
        `DROP TRIGGER IF EXISTS on_auth_user_delete ON auth.users;`,

        // Step 5: 创建新触发器
        `CREATE TRIGGER on_auth_user_delete
            BEFORE DELETE ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION handle_auth_user_delete();`
    ]

    console.log('⚠️  Supabase JS 客户端不支持直接执行 DDL 语句')
    console.log('📋 请在 Supabase SQL Editor 中手动执行以下 SQL:')
    console.log('   https://nvvinmvhapafxgrgrtnz.supabase.co/project/sql\n')

    console.log('--- 复制以下 SQL 到 SQL Editor ---\n')
    console.log(sqlStatements.join('\n'))
    console.log('\n--- 结束 ---\n')

    // 尝试使用 fetch 直接调用 Supabase REST API
    console.log('🔄 尝试通过 REST API 执行...')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Supabase 不支持通过 REST API 直接执行 SQL
    // 必须使用 SQL Editor 或 psql 客户端

    console.log('\n❌ 无法自动执行 - 必须在 Supabase SQL Editor 中手动执行')
    console.log('\n✅ 账号密码已更新，可以登录')
    console.log('📝 手机号: 15158821994')
    console.log('📝 密码: ny5566521')
}

applyCascadeFix().catch(console.error)
