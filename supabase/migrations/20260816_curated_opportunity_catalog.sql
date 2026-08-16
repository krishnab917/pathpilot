alter table public.opportunity_sources
  drop constraint if exists opportunity_sources_source_type_check;

alter table public.opportunity_sources
  add constraint opportunity_sources_source_type_check
  check (source_type in ('official_listing', 'official_event_page', 'curated_directory'));

alter table public.opportunities
  drop constraint if exists opportunities_category_check;

update public.opportunities
set category = case
  when category in ('hackathon', 'competition') then 'competition'
  when category in ('program', 'event') then 'research'
  else category
end;

alter table public.opportunities
  add constraint opportunities_category_check
  check (category in ('internship', 'competition', 'research'));

alter table public.opportunities
  alter column start_at drop not null,
  alter column end_at drop not null,
  add column if not exists source_date_label text,
  add column if not exists career_domains text[] not null default '{}';

create index if not exists opportunities_category_domains_idx
  on public.opportunities(category, status);
