alter table public.projects
  add column if not exists status text not null default 'in_progress' check (status in ('idea', 'in_progress', 'completed', 'archived')),
  add column if not exists live_url text,
  add column if not exists start_date date,
  add column if not exists completion_date date,
  add column if not exists career_id uuid references public.careers(id) on delete set null;

create table if not exists public.project_goals (
  project_id uuid not null references public.projects(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  primary key (project_id, goal_id)
);

alter table public.project_goals enable row level security;

create policy "project_goal_owner" on public.project_goals
  for all using (exists (
    select 1 from public.projects where public.projects.id = public.project_goals.project_id and public.projects.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.projects where public.projects.id = public.project_goals.project_id and public.projects.user_id = auth.uid()
  ));
