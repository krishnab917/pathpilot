-- PathPilot production Supabase continuity check.
-- This file is intentionally read-only. Run it in the existing Supabase
-- project's SQL editor before any migration replay or schema change.

with expected_tables(table_name) as (
  values
    ('ai_conversations'),
    ('ai_messages'),
    ('ai_result_cache'),
    ('background_worker_credentials'),
    ('behavioral_activity_events'),
    ('career_matches'),
    ('careers'),
    ('derived_analysis_jobs'),
    ('goals'),
    ('onboarding_drafts'),
    ('opportunities'),
    ('opportunity_sources'),
    ('pathpilot_rate_limit_leases'),
    ('pathpilot_rate_limit_windows'),
    ('planning_report_share_links'),
    ('portfolio_profiles'),
    ('portfolio_projects'),
    ('project_goals'),
    ('project_milestones'),
    ('projects'),
    ('roadmap_milestones'),
    ('roadmap_recommendations'),
    ('roadmaps'),
    ('simulations'),
    ('student_opportunity_states'),
    ('student_profiles')
)
select
  e.table_name,
  case when c.oid is null then 'missing' else 'present' end as table_status,
  coalesce(c.relrowsecurity, false) as rls_enabled,
  coalesce(c.relforcerowsecurity, false) as rls_forced
from expected_tables e
left join pg_class c
  on c.relname = e.table_name
 and c.relnamespace = 'public'::regnamespace
 and c.relkind in ('r', 'p')
order by e.table_name;

select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'ai_conversations',
    'ai_messages',
    'ai_result_cache',
    'background_worker_credentials',
    'behavioral_activity_events',
    'career_matches',
    'careers',
    'derived_analysis_jobs',
    'goals',
    'onboarding_drafts',
    'opportunities',
    'opportunity_sources',
    'pathpilot_rate_limit_leases',
    'pathpilot_rate_limit_windows',
    'planning_report_share_links',
    'portfolio_profiles',
    'portfolio_projects',
    'project_goals',
    'project_milestones',
    'projects',
    'roadmap_milestones',
    'roadmap_recommendations',
    'roadmaps',
    'simulations',
    'student_opportunity_states',
    'student_profiles'
  )
order by table_name, ordinal_position;

select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  array_to_string(p.proacl, ',') as privileges
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'acquire_pathpilot_rate_limit_lease',
    'consume_pathpilot_rate_limit',
    'list_discoverable_opportunities',
    'process_next_derived_analysis',
    'release_pathpilot_rate_limit_lease'
  )
order by p.proname, arguments;

select
  event_object_table as table_name,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;

select
  'auth.users' as source,
  count(*) as record_count
from auth.users;

select
  'application_record_counts' as section,
  jsonb_build_object(
    'student_profiles', (select count(*) from public.student_profiles),
    'career_matches', (select count(*) from public.career_matches),
    'goals', (select count(*) from public.goals),
    'roadmaps', (select count(*) from public.roadmaps),
    'simulations', (select count(*) from public.simulations),
    'ai_conversations', (select count(*) from public.ai_conversations),
    'behavioral_activity_events', (select count(*) from public.behavioral_activity_events),
    'opportunities', (select count(*) from public.opportunities),
    'projects', (select count(*) from public.projects),
    'portfolio_profiles', (select count(*) from public.portfolio_profiles),
    'planning_report_share_links', (select count(*) from public.planning_report_share_links)
  ) as counts;
