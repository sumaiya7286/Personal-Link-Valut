-- Stash database schema. Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

create extension if not exists pgcrypto;

-- Collections ------------------------------------------------------------
create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  color       text not null default '#C8F560',
  created_at  timestamptz not null default now()
);

create index if not exists collections_user_idx on public.collections (user_id);

-- Links ------------------------------------------------------------------
create table if not exists public.links (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  url            text not null check (char_length(url) <= 2048),
  title          text not null default '' check (char_length(title) <= 300),
  description    text check (char_length(description) <= 1000),
  image_url      text check (char_length(image_url) <= 2048),
  favicon_url    text check (char_length(favicon_url) <= 2048),
  site_name      text check (char_length(site_name) <= 120),
  type           text not null default 'other' check (type in ('video', 'doc', 'article', 'image', 'other')),
  collection_id  uuid references public.collections (id) on delete set null,
  tags           text[] not null default '{}',
  notes          text check (char_length(notes) <= 5000),
  is_favorite    boolean not null default false,
  is_done        boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists links_user_created_idx on public.links (user_id, created_at desc);
create index if not exists links_tags_idx on public.links using gin (tags);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists links_touch on public.links;
create trigger links_touch before update on public.links
  for each row execute function public.touch_updated_at();

-- Row Level Security: every user can only see and change their own rows ----
alter table public.collections enable row level security;
alter table public.links enable row level security;

drop policy if exists "own collections" on public.collections;
create policy "own collections" on public.collections
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own links" on public.links;
create policy "own links" on public.links
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Realtime: push changes to the user's other open devices ------------------
-- Full replica identity lets filtered DELETE events (user_id=eq.…) reach other devices.
alter table public.links replica identity full;
alter table public.collections replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.links;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.collections;
  exception when duplicate_object then null;
  end;
end $$;
