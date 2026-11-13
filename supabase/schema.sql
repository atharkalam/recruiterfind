-- Run this in your Supabase SQL editor to set up the database schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Orders table
create table if not exists public.orders (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  company         text not null,
  country         text not null default 'United States',
  requested_count integer not null default 50,
  actual_count    integer not null default 0,
  status          text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  results         jsonb,
  error           text,
  query_text      text,
  role_type       text,
  activity_window text not null default '30d',
  user_name       text,
  user_title      text,
  user_email_domain text
);

alter table public.orders enable row level security;

create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own orders"
  on public.orders for update
  using (auth.uid() = user_id);

-- Configurations table
create table if not exists public.configurations (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid unique not null references auth.users(id) on delete cascade,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  apify_api_key       text,
  anthropic_api_key   text,
  openai_api_key      text,
  google_ai_studio_key text,
  custom_email_prompt text,
  user_resume         text
);

alter table public.configurations enable row level security;

create policy "Users can manage their own configuration"
  on public.configurations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast order lookups
create index if not exists orders_user_id_created_at_idx
  on public.orders (user_id, created_at desc);
