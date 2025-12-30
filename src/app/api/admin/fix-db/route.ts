import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 仅用于紧急修复 - 生产环境应该删除此端点或添加严格的安全验证
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
    try {
        // 使用 Supabase 的 RPC 功能执行 SQL
        // 注意：这需要先在数据库中创建一个执行 SQL 的函数

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

        // 由于 Supabase JS 客户端不支持直接执行 DDL
        // 我们返回需要执行的 SQL，用户可以通过 Supabase Dashboard 执行

        return NextResponse.json({
            success: false,
            message: '需要手动执行 SQL',
            sql: sqlStatements.join('\n'),
            url: 'https://nvvinmvhapafxgrgrtnz.supabase.co/project/sql'
        })

    } catch (error: any) {
        console.error('DB Fix Error:', error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
