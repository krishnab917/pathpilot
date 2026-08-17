-- Checkpoint 27: student-owned project workspace details and milestones.
-- Existing projects, roadmap handoffs, skills, and project-goal links remain unchanged.

alter table public.projects
  add column if not exists scope_statement text,
  add column if not exists project_notes text;

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 180),
  details text,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  progress smallint not null default 0 check (progress between 0 and 100),
  target_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_milestones_owner_project_sort_idx
  on public.project_milestones (user_id, project_id, sort_order, created_at);

alter table public.project_milestones enable row level security;

create policy "project_milestone_owner" on public.project_milestones
  for all
  using (
    auth.uid() = user_id
    and exists (select 1 from public.projects where public.projects.id = project_milestones.project_id and public.projects.user_id = auth.uid())
  )
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.projects where public.projects.id = project_milestones.project_id and public.projects.user_id = auth.uid())
  );

comment on column public.projects.scope_statement is 'Student-authored scope for a personal project workspace.';
comment on column public.projects.project_notes is 'Student-authored project notes; not behavioral evidence or mentor content.';
comment on table public.project_milestones is 'Student-owned implementation milestones for a personal project workspace.';
