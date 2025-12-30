/**
 * Apply CASCADE fix to remote Supabase database
 * This script directly executes SQL to remove the ON DELETE CASCADE constraint
 */

const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyCascadeFix() {
    console.log('🔧 Applying CASCADE fix migration...')

    // SQL statements from the migration file
    const sqlStatements = [
        // Step 1: Drop the foreign key constraint with CASCADE
        `ALTER TABLE phone_users DROP CONSTRAINT IF EXISTS phone_users_supabase_user_id_fkey;`,

        // Step 2: Add back the foreign key WITHOUT CASCADE delete
        `ALTER TABLE phone_users
        ADD CONSTRAINT phone_users_supabase_user_id_fkey
        FOREIGN KEY (supabase_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;`,

        // Step 3: Create trigger function
        `CREATE OR REPLACE FUNCTION handle_auth_user_delete()
        RETURNS TRIGGER AS $$
        BEGIN
            DELETE FROM public.phone_users WHERE supabase_user_id = OLD.id;
            DELETE FROM public.user_credits WHERE user_id = OLD.id;
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;`,

        // Step 4: Drop existing trigger if any
        `DROP TRIGGER IF EXISTS on_auth_user_delete ON auth.users;`,

        // Step 5: Create the trigger
        `CREATE TRIGGER on_auth_user_delete
            BEFORE DELETE ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION handle_auth_user_delete();`,

        // Step 6: Add comment
        `COMMENT ON CONSTRAINT phone_users_supabase_user_id_fkey ON phone_users IS
        'Foreign key to auth.users without cascade delete - deletion handled by trigger';`
    ]

    for (let i = 0; i < sqlStatements.length; i++) {
        const sql = sqlStatements[i]
        console.log(`\n[${i + 1}/${sqlStatements.length}] Executing:`)
        console.log(sql.substring(0, 100) + (sql.length > 100 ? '...' : ''))

        try {
            // Use RPC to execute SQL (requires a PostgreSQL function)
            const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql })

            if (error) {
                // If exec_sql doesn't exist, we need to use the SQL editor
                console.error(`❌ Failed to execute SQL statement ${i + 1}:`, error.message)
                console.log('\n⚠️  Automatic execution not supported.')
                console.log('📋 Please manually run the SQL in Supabase SQL Editor:')
                console.log('   https://nvvinmvhapafxgrgrtnz.supabase.co/project/sql')
                console.log('\n📄 SQL to execute:')
                console.log('---')
                sqlStatements.forEach((s, idx) => {
                    console.log(`-- Step ${idx + 1}`)
                    console.log(s)
                    console.log()
                })
                console.log('---')
                return
            }

            console.log(`✅ Step ${i + 1} completed`)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err)
            console.error(`❌ Exception at step ${i + 1}:`, errorMessage)
            return
        }
    }

    console.log('\n✅ CASCADE fix applied successfully!')
    console.log('🔄 Please test the login → logout → login flow.')
}

applyCascadeFix().catch(console.error)
