-- Add INSERT policy for authenticated users to create orders
create policy "Users can insert their own orders" on public.orders
  for insert
  with check (auth.uid() = user_id);
