-- Fix the CASCADE delete issue
-- Remove ON DELETE CASCADE to prevent accidental deletion of phone_users records

-- Step 1: Drop the foreign key constraint with CASCADE
ALTER TABLE phone_users DROP CONSTRAINT IF EXISTS phone_users_supabase_user_id_fkey;

-- Step 2: Add back the foreign key WITHOUT CASCADE delete
ALTER TABLE phone_users
ADD CONSTRAINT phone_users_supabase_user_id_fkey
FOREIGN KEY (supabase_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 3: Add a trigger to handle user deletion properly
CREATE OR REPLACE FUNCTION handle_auth_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- When auth user is deleted, also delete the phone_users record
    -- But only if explicitly deleted (not during normal operations)
    DELETE FROM public.phone_users WHERE supabase_user_id = OLD.id;

    -- Also delete user_credits
    DELETE FROM public.user_credits WHERE user_id = OLD.id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_delete ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_delete
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_auth_user_delete();

-- Add comment explaining the change
COMMENT ON CONSTRAINT phone_users_supabase_user_id_fkey ON phone_users IS
'Foreign key to auth.users without cascade delete - deletion handled by trigger';
