-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create user_roles table to store multiple roles per user
create table if not exists user_roles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('landlord', 'renter')),
  is_primary boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, role)
);

-- Enable Row Level Security on user_roles
alter table user_roles enable row level security;

-- Users can view their own roles
create policy "Users can view their own roles"
  on user_roles for select
  using (auth.uid() = user_id);

-- Users can insert their own roles
create policy "Users can insert their own roles"
  on user_roles for insert
  with check (auth.uid() = user_id);

-- Users can update their own roles
create policy "Users can update their own roles"
  on user_roles for update
  using (auth.uid() = user_id);

-- Function to migrate existing user roles to the new table
create or replace function public.migrate_user_roles()
returns void as $$
declare
  user_record record;
  has_roles boolean;
begin
  -- Check if migration has already been run
  select exists (select 1 from information_schema.tables where table_name = 'user_roles') into has_roles;
  
  if not has_roles then
    -- Create the user_roles table
    execute '
      create table user_roles (
        id uuid default uuid_generate_v4() primary key,
        user_id uuid references auth.users(id) on delete cascade,
        role text not null check (role in (''landlord'', ''renter'')),
        is_primary boolean default false,
        created_at timestamptz default now(),
        updated_at timestamptz default now(),
        unique(user_id, role)
      )';
  end if;
  
  -- Migrate existing user profiles to user_roles
  for user_record in select id, user_type from user_profiles loop
    -- Insert the existing role as a primary role
    insert into user_roles (user_id, role, is_primary, created_at, updated_at)
    values (user_record.id, user_record.user_type, true, now(), now())
    on conflict (user_id, role) do nothing;
  end loop;
  
  -- Add partial unique index to ensure only one primary role per user
  if not exists (
    select 1 from pg_indexes 
    where indexname = 'one_primary_role_per_user'
  ) then
    execute 'CREATE UNIQUE INDEX one_primary_role_per_user ON user_roles (user_id) WHERE is_primary';
  end if;
  
  -- Create index for faster lookups
  if not exists (
    select 1 from pg_indexes 
    where indexname = 'idx_user_roles_user_id'
  ) then
    create index idx_user_roles_user_id on user_roles(user_id);
  end if;
end;
$$ language plpgsql security definer;

-- Function to add a role to a user
create or replace function public.add_user_role(
  p_user_id uuid,
  p_role text,
  p_is_primary boolean default false
) returns void as $$
begin
  -- If setting as primary, unset any existing primary role
  if p_is_primary then
    update user_roles 
    set is_primary = false 
    where user_id = p_user_id and is_primary = true;
  end if;
  
  -- Insert the new role
  insert into user_roles (user_id, role, is_primary)
  values (p_user_id, p_role, p_is_primary)
  on conflict (user_id, role) 
  do update set 
    is_primary = excluded.is_primary,
    updated_at = now();
    
  -- Ensure there's always exactly one primary role
  if p_is_primary = false and not exists (
    select 1 from user_roles 
    where user_id = p_user_id and is_primary = true
  ) then
    -- If no primary role exists, set the first role as primary
    update user_roles 
    set is_primary = true 
    where user_id = p_user_id 
    and role = (
      select role 
      from user_roles 
      where user_id = p_user_id 
      order by created_at 
      limit 1
    );
  end if;
end;
$$ language plpgsql security definer;

-- Function to get user's current role
create or replace function public.get_user_role(p_user_id uuid)
returns text as $$
declare
  user_role text;
begin
  -- First try to get the user's current role from their session
  select current_setting('app.current_user_role', true) into user_role;
  
  -- If not set in session, get their primary role
  if user_role is null then
    select role into user_role
    from user_roles
    where user_id = p_user_id and is_primary = true
    limit 1;
    
    -- If still null, get any role they have
    if user_role is null then
      select role into user_role
      from user_roles
      where user_id = p_user_id
      limit 1;
    end if;
  end if;
  
  return user_role;
end;
$$ language plpgsql security definer;

-- Function to set user's current role in session
create or replace function public.set_user_role(
  p_user_id uuid,
  p_role text
) returns void as $$
begin
  -- Verify the user has this role
  if exists (
    select 1 from user_roles 
    where user_id = p_user_id and role = p_role
  ) then
    -- Set the role in the session
    execute format('set local app.current_user_role to %L', p_role);
    
    -- Update the primary role if needed
    if not exists (
      select 1 from user_roles 
      where user_id = p_user_id and role = p_role and is_primary = true
    ) then
      perform public.add_user_role(p_user_id, p_role, true);
    end if;
  else
    raise exception 'User does not have the specified role';
  end if;
end;
$$ language plpgsql security definer;

-- Create a view for user profiles that includes the primary role
create or replace view public.user_profiles_view as
select 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  (select role from user_roles ur where ur.user_id = u.id and ur.is_primary = true) as user_type,
  u.created_at,
  u.updated_at
from auth.users u;

-- Update the existing user_profiles table to work with the new role system
-- First, add a user_id column if it doesn't exist
alter table public.user_profiles 
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Update existing records to set the user_id
update public.user_profiles up
set user_id = u.id
from auth.users u
where up.id = u.id;

-- Make the user_id column not null after populating it
alter table public.user_profiles alter column user_id set not null;

-- Create a function to update the user's primary role when their profile is updated
create or replace function public.update_user_primary_role()
returns trigger as $$
begin
  -- Update the primary role if user_type changed
  if new.user_type is distinct from old.user_type then
    perform public.add_user_role(new.user_id, new.user_type, true);
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to update the primary role when user_type changes
create or replace trigger update_user_primary_role_trigger
  after update of user_type on public.user_profiles
  for each row
  when (new.user_type is distinct from old.user_type)
  execute function public.update_user_primary_role();

-- Create a function to handle new user signups with the new schema
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  -- Insert the user's initial role
  insert into user_roles (user_id, role, is_primary)
  values (
    new.id,
    new.raw_user_meta_data->>'user_type',
    true
  );
  
  -- Update the user's full name in raw_user_meta_data if not set
  if new.raw_user_meta_data->>'full_name' is null then
    update auth.users 
    set raw_user_meta_data = jsonb_set(
      coalesce(raw_user_meta_data, '{}'::jsonb),
      '{full_name}',
      to_jsonb(split_part(new.email, '@', 1))
    )
    where id = new.id;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create a function to get all roles for the current user
create or replace function public.get_current_user_roles()
returns table (role text, is_primary boolean) as $$
begin
  return query
  select ur.role, ur.is_primary
  from user_roles ur
  where ur.user_id = auth.uid()
  order by ur.is_primary desc, ur.updated_at desc;
end;
$$ language plpgsql security definer;

-- Create a function to check if the current user has a specific role
create or replace function public.has_role(p_role text)
returns boolean as $$
begin
  return exists (
    select 1 
    from user_roles 
    where user_id = auth.uid() and role = p_role
  );
end;
$$ language plpgsql security definer;

-- Run the migration
SELECT public.migrate_user_roles();

-- Log a message to the console
SELECT 'Multi-role support has been enabled. Please update your application code to use the new role system.' AS message;
