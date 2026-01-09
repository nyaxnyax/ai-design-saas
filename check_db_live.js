const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nvvinmvhapafxgrgrtnz.supabase.co';
const supabaseKey = 'sb_secret_xMtdQJ4Jf_rUZOjxtqNXxQ_KnMzo6xS';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: phoneUser } = await supabase.from('phone_users').select('supabase_user_id').eq('phone', '15158821994').single();
  const userId = phoneUser.supabase_user_id;

  const { data: credits } = await supabase.from('user_credits').select('*').eq('user_id', userId).single();
  console.log('DB Balance:', credits.balance);
}
check();
