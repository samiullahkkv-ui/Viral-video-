create extension if not exists pgcrypto;

create table if not exists public.x_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  x_user_id text not null,
  username text not null,
  display_name text,
  avatar_url text,
  access_token_enc text not null,
  refresh_token_enc text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, x_user_id)
);

create index if not exists x_accounts_user_id_idx on public.x_accounts(user_id);

create table if not exists public.published_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.x_accounts(id) on delete cascade,
  x_post_id text not null,
  text text not null,
  published_at timestamptz not null default now()
);

create index if not exists published_posts_user_id_idx on public.published_posts(user_id);
create index if not exists published_posts_account_id_idx on public.published_posts(account_id);

alter table public.x_accounts enable row level security;
alter table public.published_posts enable row level security;

-- No client-side table policies are created intentionally.
-- These tables are accessed only by protected Vercel API routes after
-- verifying the user's Supabase session, using the service-role key.
