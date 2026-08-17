-- Checkpoint 26: transparent relevance order from explicit profile/catalog fields only.
-- The numeric calculation remains server-side; clients receive short factor explanations, not a personal score.

drop function if exists public.list_discoverable_opportunities(text, text, text, text, boolean, text[], integer, integer);

create function public.list_discoverable_opportunities(
  filter_category text default null,
  filter_search text default null,
  filter_country_code text default null,
  filter_grade text default null,
  require_application_deadline boolean default false,
  filter_domains text[] default null,
  page_number integer default 1,
  page_size integer default 12,
  ranking_country_code text default null,
  ranking_grade text default null,
  ranking_domains text[] default null
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
      (
        case when ranking_domains is not null and opportunity.career_domains && ranking_domains then 4 else 0 end +
        case when ranking_country_code is not null and opportunity.country_codes @> array[ranking_country_code] then 2 else 0 end +
        case when ranking_grade is not null and opportunity.eligible_grades @> array[ranking_grade] then 2 else 0 end
      ) as relevance_order,
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
  select id, title, summary, category, participation_mode, location_label, source_date_label, career_domains, country_codes, eligible_grades, start_at, end_at, registration_opens_at, application_deadline_at, eligibility_summary, application_url, source_url, source_name, verified_at, student_status, total_count
  from filtered
  order by relevance_order desc, verified_at desc, id
  limit greatest(1, least(page_size, 48))
  offset greatest(0, page_number - 1) * greatest(1, least(page_size, 48));
$$;

revoke all on function public.list_discoverable_opportunities(text, text, text, text, boolean, text[], integer, integer, text, text, text[]) from anon;
revoke all on function public.list_discoverable_opportunities(text, text, text, text, boolean, text[], integer, integer, text, text, text[]) from public;
grant execute on function public.list_discoverable_opportunities(text, text, text, text, boolean, text[], integer, integer, text, text, text[]) to authenticated;
