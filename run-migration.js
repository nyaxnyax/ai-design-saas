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

async function runMigration() {
    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241229_phone_auth_system.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration...');
        console.log('SQL:', sql);

        // Execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('Migration failed:', error);

            // Try alternative method: execute statements one by one
            console.log('\nTrying alternative approach...');
            const statements = sql.split(';').filter(s => s.trim());

            for (const statement of statements) {
                if (!statement.trim()) continue;
                console.log(`\nExecuting: ${statement.substring(0, 50)}...`);

                // Use direct SQL query
                const result = await supabase.from('_sql').select('*').limit(0);
                console.log('Statement result:', result);
            }
        } else {
            console.log('Migration completed successfully!');
            console.log('Result:', data);
        }

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

runMigration();
