require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getPhones() {
    console.log('正在查询已注册手机号...');
    const { data, error } = await supabase
        .from('phone_users')
        .select('phone, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('查询出错:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('目前还没有手机号注册。');
    } else {
        console.log(`统计：共有 ${data.length} 个注册用户。`);
        console.table(data);
    }
}

getPhones();
