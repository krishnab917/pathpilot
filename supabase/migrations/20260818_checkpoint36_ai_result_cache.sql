-- Checkpoint 36: cache only validated AI outputs; never store prompts or source context.
create table if not exists public.ai_result_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null check (operation in ('project_guidance')),
  subject_id uuid not null references public.projects(id) on delete cascade,
  cache_version text not null check (char_length(cache_version) between 1 and 80),
  input_hash text not null check (char_length(input_hash) = 64),
  result jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, operation, subject_id, cache_version, input_hash)
);

create index if not exists ai_result_cache_owner_lookup_idx
  on public.ai_result_cache (user_id, operation, subject_id, cache_version, expires_at desc);

alter table public.ai_result_cache enable row level security;

create policy "ai_result_cache_owner" on public.ai_result_cache
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.ai_result_cache is 'Private validated AI-output cache. Stores only a versioned input hash and the validated result; prompts, source context, raw student records, and tokens are never persisted.';
