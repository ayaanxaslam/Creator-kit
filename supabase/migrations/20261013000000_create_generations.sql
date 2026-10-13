-- CreatorKit: saved generations (ideas, scripts, shot lists) per user.
-- Run this once in the Supabase dashboard → SQL Editor → New query → Run.

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tool text not null check (tool in ('ideas', 'script', 'shots')),
  title text not null default '',
  input jsonb not null,
  output jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists generations_user_tool_created_idx
  on public.generations (user_id, tool, created_at desc);

-- Row Level Security: every user can only see and change their own rows.
alter table public.generations enable row level security;

drop policy if exists "Users can read their own generations" on public.generations;
create policy "Users can read their own generations"
  on public.generations for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own generations" on public.generations;
create policy "Users can create their own generations"
  on public.generations for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own generations" on public.generations;
create policy "Users can update their own generations"
  on public.generations for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own generations" on public.generations;
create policy "Users can delete their own generations"
  on public.generations for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Keep updated_at current on edits.
create or replace function public.set_generations_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists generations_set_updated_at on public.generations;
create trigger generations_set_updated_at
  before update on public.generations
  for each row execute function public.set_generations_updated_at();
