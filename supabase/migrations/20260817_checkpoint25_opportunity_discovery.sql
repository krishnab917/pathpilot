-- Checkpoint 25: scalable, source-backed opportunity discovery.
-- Unknown country, grade, and application-deadline data remain null/empty and are never inferred.

alter table public.opportunities
  add column if not exists eligible_grades text[] not null default '{}',
  add column if not exists application_deadline_at timestamptz,
  add column if not exists search_document tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(summary, '')), 'B')
  ) stored;

create index if not exists opportunities_discovery_order_idx
  on public.opportunities (status, verified_at desc, id);

create index if not exists opportunities_country_codes_gin_idx
  on public.opportunities using gin (country_codes);

create index if not exists opportunities_eligible_grades_gin_idx
  on public.opportunities using gin (eligible_grades);

create index if not exists opportunities_application_deadline_idx
  on public.opportunities (application_deadline_at)
  where status = 'active' and application_deadline_at is not null;

create index if not exists opportunities_search_document_gin_idx
  on public.opportunities using gin (search_document);

comment on column public.opportunities.eligible_grades is 'Only organizer-published grade labels. Empty means eligibility was not verified or normalized.';
comment on column public.opportunities.application_deadline_at is 'Only organizer-published application deadline. Null means no verified application deadline is available.';

create or replace function public.list_discoverable_opportunities(
  filter_category text default null,
  filter_search text default null,
  filter_country_code text default null,
  filter_grade text default null,
  require_application_deadline boolean default false,
  filter_domains text[] default null,
  page_number integer default 1,
  page_size integer default 12
)
returns table (
  id uuid,
  title text,
  summary text,
  category text,
  participation_mode text,
  location_label text,
  source_date_label text,
  career_domains text[],
  country_codes text[],
  eligible_grades text[],
  start_at timestamptz,
  end_at timestamptz,
  registration_opens_at timestamptz,
  application_deadline_at timestamptz,
  eligibility_summary text,
  application_url text,
  source_url text,
  source_name text,
  verified_at timestamptz,
  student_status text,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with filtered as (
    select
      opportunity.id,
      opportunity.title,
      opportunity.summary,
      opportunity.category,
      opportunity.participation_mode,
      opportunity.location_label,
      opportunity.source_date_label,
      opportunity.career_domains,
      opportunity.country_codes,
      opportunity.eligible_grades,
      opportunity.start_at,
      opportunity.end_at,
      opportunity.registration_opens_at,
      opportunity.application_deadline_at,
      opportunity.eligibility_summary,
      opportunity.application_url,
      opportunity.source_url,
      source.name as source_name,
      opportunity.verified_at,
      student_state.status as student_status,
      count(*) over() as total_count
    from public.opportunities as opportunity
    join public.opportunity_sources as source on source.id = opportunity.source_id
    left join public.student_opportunity_states as student_state
      on student_state.opportunity_id = opportunity.id
      and student_state.user_id = auth.uid()
    where opportunity.status = 'active'
      and source.active = true
      and (filter_category is null or opportunity.category = filter_category)
      and (filter_search is null or opportunity.search_document @@ websearch_to_tsquery('simple', filter_search))
      and (filter_country_code is null or opportunity.country_codes @> array[filter_country_code])
      and (filter_grade is null or opportunity.eligible_grades @> array[filter_grade])
      and (not require_application_deadline or opportunity.application_deadline_at is not null)
      and (filter_domains is null or opportunity.career_domains && filter_domains)
      and coalesce(student_state.status, '') <> 'dismissed'
  )
  select *
  from filtered
  order by verified_at desc, id
  limit greatest(1, least(page_size, 48))
  offset greatest(0, page_number - 1) * greatest(1, least(page_size, 48));
$$;

grant execute on function public.list_discoverable_opportunities(text, text, text, text, boolean, text[], integer, integer) to authenticated;
