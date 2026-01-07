const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function reloadSchemaCache() {
    console.log('Attempting to reload PostgREST schema cache...');
    
    // Method 1: Use NOTIFY (requires superuser or specific permissions, often restricted in Supabase JS client but worth a try via RPC if available)
    try {
       // We'll try to execute a raw SQL via a known RPC if it exists, otherwise we'll try a benign DDL change.
       // Since we don't know if 'exec_sql' exists, let's try a safe "notify" via a direct SQL call if we had one.
       // Lacking a direct SQL runner, the best way to force a schema cache reload without dashboard access is often to just CREATE and DROP a dummy view or comment.
       
       console.log('Sending NOTIFY pgrst, "reload config"... (via rpc exec_sql if available)');
       
       const { error } = await supabase.rpc('exec_sql', { 
           sql_query: "NOTIFY pgrst, 'reload config';" 
       });

       if (error) {
           console.log('RPC exec_sql failed, trying alternative trigger method...');
           // Alternative: Just fetching the table info might not be enough.
           // Let's try to update the comment on the table, which forces a schema reload.
           const { error: commentError } = await supabase.rpc('exec_sql', {
               sql_query: "COMMENT ON TABLE public.user_credits IS 'User credits system';"
           });
           
           if (commentError) {
               console.error('Failed to reload schema cache via comment update:', commentError);
               console.log('Assuming exec_sql is not available. Please execute the following SQL in the Supabase Dashboard SQL Editor:');
               console.log("NOTIFY pgrst, 'reload config';");
           } else {
               console.log('Schema cache reload triggered via COMMENT update.');
           }
       } else {
           console.log('Schema cache reload triggered via NOTIFY.');
       }

    } catch (e) {
        console.error('Error reloading cache:', e);
    }
}

async function verifyColumn() {
    console.log('Verifying column existence...');
    // We can't select specific columns easily to check existence without generating an error if missing.
    // But we can try to select the column and see if it works.
    const { data, error } = await supabase
        .from('user_credits')
        .select('daily_generations')
        .limit(1);

    if (error) {
        console.error('Verification failed:', error);
        if (error.code === 'PGRST204') {
            console.error('Confirmed: Column still hidden from API cache.');
        }
    } else {
        console.log('Verification successful! Column is accessible.');
    }
}

async function main() {
    await reloadSchemaCache();
    // Wait a moment for propagation
    await new Promise(r => setTimeout(r, 2000));
    await verifyColumn();
}

main();
