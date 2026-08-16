alter table public.projects
  add column if not exists roadmap_milestone_id uuid references public.roadmap_milestones(id) on delete set null;

create unique index if not exists projects_user_roadmap_milestone_unique
  on public.projects (user_id, roadmap_milestone_id)
  where roadmap_milestone_id is not null;
