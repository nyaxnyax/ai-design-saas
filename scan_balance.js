const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nvvinmvhapafxgrgrtnz.supabase.co';
const supabaseKey = 'sb_secret_xMtdQJ4Jf_rUZOjxtqNXxQ_KnMzo6xS';
const supabase = createClient(supabaseUrl, supabaseKey);

async function scan() {
  const { data: credits } = await supabase.from('user_credits').select('user_id, balance').eq('balance', 20);
  console.log('Users with 20 credits:', credits.length);
  if (credits.length > 0) {
      console.log('IDs:', credits.map(c => c.user_id));
  }
}
scan();
