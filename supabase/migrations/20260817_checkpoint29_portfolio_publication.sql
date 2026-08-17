-- Checkpoint 29: explicit student-approved project portfolio publication.
-- Project workspaces remain private; only copied, selected portfolio fields may be published.

create table if not exists public.portfolio_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9][a-z0-9-]{2,47}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  introduction text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 180),
  summary text not null check (char_length(summary) between 10 and 4000),
  technologies jsonb not null default '[]'::jsonb,
  repository_url text,
  live_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, project_id),
  check ((is_published and published_at is not null) or (not is_published and published_at is null))
);

create index if not exists portfolio_projects_public_idx
  on public.portfolio_projects (user_id, published_at desc)
  where is_published = true;

alter table public.portfolio_profiles enable row level security;
alter table public.portfolio_projects enable row level security;

create policy "portfolio_profile_owner" on public.portfolio_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "portfolio_profile_public_read" on public.portfolio_profiles
  for select using (true);

create policy "portfolio_project_owner" on public.portfolio_projects
  for all using (
    auth.uid() = user_id
    and exists (select 1 from public.projects where public.projects.id = portfolio_projects.project_id and public.projects.user_id = auth.uid())
  ) with check (
    auth.uid() = user_id
    and exists (select 1 from public.projects where public.projects.id = portfolio_projects.project_id and public.projects.user_id = auth.uid())
  );
create policy "portfolio_project_public_read" on public.portfolio_projects
  for select using (is_published = true);

comment on table public.portfolio_profiles is 'Student-controlled public portfolio profile. Creating or editing a profile does not publish a project.';
comment on table public.portfolio_projects is 'Student-edited portfolio copies. Private project scope, notes, milestones, and progress are never published from this table.';
