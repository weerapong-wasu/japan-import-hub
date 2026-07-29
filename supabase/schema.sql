-- ============================================================
-- JAPAN IMPORT HUB — Database Schema (Supabase / PostgreSQL)
--
-- HOW TO RUN (one time):
--   Supabase Dashboard → SQL Editor → New query →
--   paste this entire file → Run
--
-- Safe to re-run: uses IF NOT EXISTS everywhere.
-- ============================================================

-- ---------- 1. Newsletter subscribers ----------
create table if not exists public.subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  source      text default 'site',            -- which form captured it
  created_at  timestamptz not null default now()
);

-- ---------- 2. Orders (written by Stripe webhook) ----------
create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  stripe_session_id   text not null unique,   -- Checkout Session id (cs_...)
  stripe_payment_intent text,                 -- pi_... reference
  product             text not null default 'toolkit',
  email               text,                   -- buyer email from Stripe
  amount_total        integer,                -- in smallest currency unit (cents)
  currency            text,
  status              text not null default 'paid',
  created_at          timestamptz not null default now()
);

create index if not exists orders_email_idx on public.orders (email);

-- ---------- 3. Row Level Security ----------
-- Lock both tables down completely for anon/authenticated clients.
-- Our API routes use the SERVICE ROLE key, which bypasses RLS —
-- so the server can write, and nobody else can read anything.
alter table public.subscribers enable row level security;
alter table public.orders      enable row level security;

-- No policies created on purpose = no public access at all.

-- ---------- 4. User accounts & wishlist ----------
-- Supabase Auth manages users (magic-link email login, no passwords
-- to store). These tables hold per-user data, locked by RLS so each
-- user can only ever see and edit their own rows.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at  timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  item_name     text not null,
  shop_url      text,
  target_price  integer,                 -- target landed cost in JPY
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists wishlist_user_idx on public.wishlist_items (user_id);

alter table public.profiles       enable row level security;
alter table public.wishlist_items enable row level security;

-- Each user: full control of their OWN rows, nothing else.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own wishlist" on public.wishlist_items;
create policy "own wishlist" on public.wishlist_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- 5. Helpful view for you (dashboard use) ----------
create or replace view public.daily_stats as
select
  date_trunc('day', o.created_at)::date as day,
  count(*)                              as orders,
  coalesce(sum(o.amount_total), 0)      as revenue_cents
from public.orders o
group by 1
order by 1 desc;
