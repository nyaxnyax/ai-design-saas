-- Create a table for storing verification codes
create table if not exists verification_codes (
  id uuid default gen_random_uuid() primary key,
  phone text not null,
  code text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null,
  verified boolean default false
);

-- Add an index on phone for faster lookups
create index if not exists verification_codes_phone_idx on verification_codes (phone);

-- Enable RLS (though only server will access it, good practice)
alter table verification_codes enable row level security;

-- Only strictly allow specific service_role operations if needed, 
-- but since we use service_role client in API, RLS is bypassed by default for that client.
-- So we can strictly deny all public access.
create policy "Deny public access" on verification_codes for all using (false);
