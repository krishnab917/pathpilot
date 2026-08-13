alter table public.student_profiles
  add column if not exists country_code text,
  add column if not exists education_system text;

alter table public.student_profiles
  drop constraint if exists student_profiles_country_code_format;

alter table public.student_profiles
  add constraint student_profiles_country_code_format
  check (country_code is null or country_code ~ '^[A-Z]{2}$');

create table if not exists public.roadmap_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_simulation_id uuid references public.simulations(id) on delete set null,
  roadmap_id uuid references public.roadmaps(id) on delete set null,
  accepted_goal_id uuid references public.goals(id) on delete set null,
  target_career text not null,
  country_snapshot text not null,
  education_system_snapshot text,
  phase text not null,
  title text not null,
  description text not null,
  rationale text not null,
  category text not null check (category in ('skill', 'project', 'experience')),
  suggested_deadline timestamptz,
  priority text not null check (priority in ('low', 'medium', 'high')),
  estimated_hours integer not null check (estimated_hours between 1 and 1000),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'skipped', 'dismissed')),
  sort_order integer not null default 0,
  context_version text not null default 'v1.1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists roadmap_recommendations_user_status_idx
  on public.roadmap_recommendations(user_id, status, created_at desc);
create index if not exists roadmap_recommendations_simulation_idx
  on public.roadmap_recommendations(source_simulation_id);

alter table public.roadmap_recommendations enable row level security;

drop policy if exists "Students manage their own roadmap recommendations" on public.roadmap_recommendations;
create policy "Students manage their own roadmap recommendations"
  on public.roadmap_recommendations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
