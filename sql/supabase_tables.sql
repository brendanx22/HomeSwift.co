-- Run this in Supabase SQL editor to create the properties and inquiries tables.
-- It uses gen_random_uuid() from pgcrypto. Enable extension if needed.

create extension if not exists "pgcrypto";

-- User profiles table to store additional user information
create table if not exists user_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  user_type text not null check (user_type in ('landlord', 'renter')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security on user_profiles
alter table user_profiles enable row level security;

-- Users can view their own profile
create policy "Users can view their own profile"
  on user_profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update their own profile"
  on user_profiles for update
  using (auth.uid() = id);

-- Function to handle new user signups
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.user_profiles (id, email, full_name, user_type)
  values (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'user_type'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create a profile when a new user signs up
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Properties table
create table if not exists properties (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  price numeric,
  location text,
  images text[],
  landlord_id uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists inquiries (
  id uuid default gen_random_uuid() primary key,
  renter_id uuid references auth.users(id),
  landlord_id uuid references auth.users(id),
  property_id uuid references properties(id),
  message text,
  created_at timestamptz default now()
);

-- Row Level Security: allow public selects on properties, but restrict inserts/updates to owners
alter table properties enable row level security;
create policy "public_select" on properties for select using (true);
create policy "insert_by_owner" on properties for insert with check (auth.uid() = landlord_id);
create policy "update_delete_by_owner" on properties for update, delete using (auth.uid() = landlord_id);

alter table inquiries enable row level security;
create policy "insert_inquiry" on inquiries for insert with check (auth.uid() = renter_id);
create policy "select_inquiry_participant" on inquiries for select using (auth.uid() = renter_id or auth.uid() = landlord_id);
