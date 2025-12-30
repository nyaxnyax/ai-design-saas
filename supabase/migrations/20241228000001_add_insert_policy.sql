-- Allow authenticated users to insert their own orders
create policy "Users can create their own orders" on public.orders
  for insert
  with check (auth.uid() = user_id);
