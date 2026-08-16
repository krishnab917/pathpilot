create table if not exists public.opportunity_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  source_url text not null,
  source_type text not null check (source_type in ('official_listing', 'official_event_page')),
  verification_note text not null,
  last_verified_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.opportunity_sources(id) on delete restrict,
  external_id text not null,
  title text not null,
  summary text not null,
  category text not null check (category in ('hackathon', 'competition', 'program', 'event')),
  participation_mode text not null check (participation_mode in ('digital', 'in_person', 'hybrid')),
  location_label text not null,
  country_codes text[] not null default '{}',
  start_at timestamptz not null,
  end_at timestamptz not null,
  registration_opens_at timestamptz,
  eligibility_summary text not null,
  application_url text not null,
  source_url text not null,
  source_updated_at timestamptz,
  verified_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_id),
  check (end_at >= start_at)
);

create index if not exists opportunities_active_dates_idx on public.opportunities(status, end_at, start_at);
create index if not exists opportunities_source_idx on public.opportunities(source_id);

create table if not exists public.student_opportunity_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  status text not null check (status in ('saved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

alter table public.opportunity_sources enable row level security;
alter table public.opportunities enable row level security;
alter table public.student_opportunity_states enable row level security;

drop policy if exists "Authenticated students can read verified opportunity sources" on public.opportunity_sources;
create policy "Authenticated students can read verified opportunity sources" on public.opportunity_sources for select to authenticated using (active = true);

drop policy if exists "Authenticated students can read active verified opportunities" on public.opportunities;
create policy "Authenticated students can read active verified opportunities" on public.opportunities for select to authenticated using (status = 'active');

drop policy if exists "Students manage their own opportunity states" on public.student_opportunity_states;
create policy "Students manage their own opportunity states"
  on public.student_opportunity_states for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
