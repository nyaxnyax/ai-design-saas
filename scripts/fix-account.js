/**
 * 紧急修复脚本 - 修复账号数据和CASCADE删除问题
 * 运行: node scripts/fix-account.js
 */

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PHONE = '15158821994'
const PASSWORD = 'ny5566521'

async function fixAccount() {
    console.log('🔧 开始修复账号...')

    // 1. 检查 shadow user 是否存在
    const shadowEmail = `${PHONE}@phone.login`
    console.log(`\n1️⃣ 检查影子用户: ${shadowEmail}`)

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    let existingAuthUser = null

    if (!listError && users) {
        existingAuthUser = users.find(u => u.email === shadowEmail)
        console.log(`   影子用户 ${existingAuthUser ? '存在' : '不存在'}`)
    }

    if (!existingAuthUser) {
        console.log('❌ 影子用户不存在，需要先注册')
        return
    }

    // 2. 检查 phone_users 记录
    console.log(`\n2️⃣ 检查 phone_users 记录...`)
    const { data: phoneUser, error: findError } = await supabaseAdmin
        .from('phone_users')
        .select('*')
        .eq('phone', PHONE)
        .maybeSingle()

    if (phoneUser) {
        console.log(`   ✅ phone_users 记录存在`)
        console.log(`   更新密码...`)

        // 更新密码
        const passwordHash = await bcrypt.hash(PASSWORD, 10)
        const { error: updateError } = await supabaseAdmin
            .from('phone_users')
            .update({ password_hash: passwordHash })
            .eq('phone', PHONE)

        if (updateError) {
            console.log(`   ❌ 更新失败:`, updateError.message)
        } else {
            console.log(`   ✅ 密码已更新`)
        }
    } else {
        console.log(`   ❌ phone_users 记录不存在，需要重建...`)

        // 创建 phone_users 记录
        const passwordHash = await bcrypt.hash(PASSWORD, 10)

        const { data: newPhoneUser, error: createError } = await supabaseAdmin
            .from('phone_users')
            .insert({
                phone: PHONE,
                password_hash: passwordHash,
                supabase_user_id: existingAuthUser.id
            })
            .select()
            .single()

        if (createError) {
            console.log(`   ❌ 创建失败:`, createError.message)
        } else {
            console.log(`   ✅ phone_users 记录已创建`)
            console.log(`   ID: ${newPhoneUser.id}`)
        }
    }

    // 3. 应用 CASCADE 修复
    console.log(`\n3️⃣ 应用 CASCADE 修复...`)
    console.log(`   ⚠️  需要手动在 Supabase SQL Editor 中执行以下 SQL:`)
    console.log(`   https://nvvinmvhapafxgrgrtnz.supabase.co/project/sql\n`)

    const sqlFix = `
-- Step 1: 删除 CASCADE 约束
ALTER TABLE phone_users DROP CONSTRAINT IF EXISTS phone_users_supabase_user_id_fkey;

-- Step 2: 添加新的约束（使用 SET NULL 而不是 CASCADE）
ALTER TABLE phone_users
ADD CONSTRAINT phone_users_supabase_user_id_fkey
FOREIGN KEY (supabase_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 3: 创建删除触发器
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
`.trim()

    console.log(sqlFix)
    console.log('\n✅ 账号修复完成！')
    console.log(`\n📝 登录信息:`)
    console.log(`   手机号: ${PHONE}`)
    console.log(`   密码: ${PASSWORD}`)
}

fixAccount().catch(console.error)
