-- Create orders table
create table public.orders (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users (id),
  plan_id text not null,
  amount numeric not null,
  status text not null default 'pending', -- pending, paid, failed
  provider_trade_no text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  metadata jsonb,
  constraint orders_pkey primary key (id)
);

-- Enable RLS
alter table public.orders enable row level security;

-- Policies
create policy "Users can view their own orders" on public.orders
  for select
  using (auth.uid() = user_id);

create policy "Service role can manage all orders" on public.orders
  for all
  using (true);
