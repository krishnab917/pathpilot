-- Opt-in private share capabilities for the already minimized planning review.
-- Raw tokens and report payloads are never stored.
create table public.planning_report_share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash) = 64),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index planning_report_share_links_user_created_idx on public.planning_report_share_links (user_id, created_at desc);
create index planning_report_share_links_active_lookup_idx on public.planning_report_share_links (token_hash, expires_at) where revoked_at is null;

alter table public.planning_report_share_links enable row level security;

create policy "planning_report_share_link_owner" on public.planning_report_share_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.planning_report_share_links is 'Student-controlled report-share capabilities. Stores only a hashed token and expiry; raw tokens and report content are never persisted.';
