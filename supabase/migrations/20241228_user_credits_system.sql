-- Create user_credits table if it doesn't exist
create table if not exists public.user_credits (
  user_id uuid references auth.users(id) on delete cascade primary key,
  balance integer default 0 not null,
  daily_generations integer default 0 not null,
  last_daily_reset timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_credits enable row level security;

-- Policies
create policy "Users can view their own credits"
  on public.user_credits for select
  using ( auth.uid() = user_id );

create policy "Service role can manage all credits"
  on public.user_credits for all
  using ( true )
  with check ( true );

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_credits (user_id, balance)
  values (new.id, 15); -- Give 15 credits (approx 5 standard images)
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- If there are existing users without credits, insert rows for them (optional, safe to run)
insert into public.user_credits (user_id, balance)
select id, 15 from auth.users
where id not in (select user_id from public.user_credits)
on conflict (user_id) do nothing;
