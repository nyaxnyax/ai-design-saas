-- Add subscription columns to user_credits table
alter table public.user_credits 
add column if not exists subscription_tier text,
add column if not exists subscription_status text default 'expired',
add column if not exists subscription_expires_at timestamp with time zone;

-- Optional: Add index for subscription status query performance
create index if not exists idx_user_credits_sub_status on public.user_credits(subscription_status);
