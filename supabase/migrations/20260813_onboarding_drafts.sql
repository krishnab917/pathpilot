create table if not exists public.onboarding_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_step smallint not null default 0 check (current_step between 0 and 4),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.onboarding_drafts enable row level security;

create policy "onboarding_draft_owner" on public.onboarding_drafts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
