-- Checkpoint 37: student-controlled deterministic background-analysis status only.
create table if not exists public.derived_analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_type text not null check (analysis_type in ('simulation_evolution')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  attempt_count smallint not null default 0 check (attempt_count between 0 and 3),
  source_hash text check (source_hash is null or char_length(source_hash) = 64),
  snapshot jsonb,
  error_code text check (error_code is null or error_code in ('processing_failed')),
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz
);

create unique index if not exists derived_analysis_one_active_job_per_user_idx
  on public.derived_analysis_jobs (user_id, analysis_type)
  where status in ('queued', 'running');

create index if not exists derived_analysis_owner_latest_idx
  on public.derived_analysis_jobs (user_id, analysis_type, requested_at desc);

alter table public.derived_analysis_jobs enable row level security;

create policy "derived_analysis_job_owner" on public.derived_analysis_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.derived_analysis_jobs is 'Student-controlled background processing state for bounded deterministic derived summaries. It stores job status and a minimized snapshot only; no raw decisions, response timing, behavioral evidence, AI prompts, or predictive outputs.';
