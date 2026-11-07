-- Forward remediation after reconciling the historical schema. No data removed.
begin;
alter table public.careers enable row level security;
alter table public.roadmap_milestones enable row level security;
drop policy if exists career_catalog_read on public.careers;
create policy career_catalog_read on public.careers for select using (true);
drop policy if exists roadmap_milestone_owner on public.roadmap_milestones;
create policy roadmap_milestone_owner on public.roadmap_milestones for all
  using (exists (select 1 from public.roadmaps r where r.id = roadmap_milestones.roadmap_id and r.user_id = (select auth.uid())))
  with check (exists (select 1 from public.roadmaps r where r.id = roadmap_milestones.roadmap_id and r.user_id = (select auth.uid())));
revoke insert, update, delete, truncate, references, trigger on public.careers from public, anon, authenticated;

-- RLS does not restrict TRUNCATE, REFERENCES, or TRIGGER privileges.
revoke truncate, references, trigger on table
  public.student_profiles, public.career_matches, public.goals, public.roadmaps,
  public.roadmap_milestones, public.simulations, public.ai_conversations, public.ai_messages,
  public.projects, public.project_goals, public.project_milestones, public.onboarding_drafts,
  public.roadmap_recommendations, public.behavioral_activity_events, public.student_opportunity_states,
  public.planning_report_share_links, public.ai_result_cache, public.derived_analysis_jobs,
  public.portfolio_profiles, public.portfolio_projects, public.opportunity_sources, public.opportunities
  from public, anon, authenticated;

create policy project_goal_target_owner on public.project_goals as restrictive for all to authenticated
  using (exists (select 1 from public.goals g where g.id = project_goals.goal_id and g.user_id = (select auth.uid())))
  with check (exists (select 1 from public.goals g where g.id = project_goals.goal_id and g.user_id = (select auth.uid())));
create policy mentor_conversation_target_owner on public.ai_messages as restrictive for all to authenticated
  using (exists (select 1 from public.ai_conversations c where c.id = ai_messages.conversation_id and c.user_id = (select auth.uid())))
  with check (exists (select 1 from public.ai_conversations c where c.id = ai_messages.conversation_id and c.user_id = (select auth.uid())));
create policy guidance_project_target_owner on public.ai_result_cache as restrictive for all to authenticated
  using (exists (select 1 from public.projects p where p.id = ai_result_cache.subject_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.projects p where p.id = ai_result_cache.subject_id and p.user_id = (select auth.uid())));
create policy project_roadmap_target_owner on public.projects as restrictive for all to authenticated
  using (roadmap_milestone_id is null or exists (select 1 from public.roadmap_milestones m join public.roadmaps r on r.id = m.roadmap_id where m.id = projects.roadmap_milestone_id and r.user_id = (select auth.uid())))
  with check (roadmap_milestone_id is null or exists (select 1 from public.roadmap_milestones m join public.roadmaps r on r.id = m.roadmap_id where m.id = projects.roadmap_milestone_id and r.user_id = (select auth.uid())));
create policy recommendation_targets_owner on public.roadmap_recommendations as restrictive for all to authenticated
  using (
    (source_simulation_id is null or exists (select 1 from public.simulations s where s.id = roadmap_recommendations.source_simulation_id and s.user_id = (select auth.uid()))) and
    (roadmap_id is null or exists (select 1 from public.roadmaps r where r.id = roadmap_recommendations.roadmap_id and r.user_id = (select auth.uid()))) and
    (accepted_goal_id is null or exists (select 1 from public.goals g where g.id = roadmap_recommendations.accepted_goal_id and g.user_id = (select auth.uid())))
  ) with check (
    (source_simulation_id is null or exists (select 1 from public.simulations s where s.id = roadmap_recommendations.source_simulation_id and s.user_id = (select auth.uid()))) and
    (roadmap_id is null or exists (select 1 from public.roadmaps r where r.id = roadmap_recommendations.roadmap_id and r.user_id = (select auth.uid()))) and
    (accepted_goal_id is null or exists (select 1 from public.goals g where g.id = roadmap_recommendations.accepted_goal_id and g.user_id = (select auth.uid())))
  );

-- Existing exhausted jobs remain untouched; the worker skips them below.
alter table public.derived_analysis_jobs add constraint derived_analysis_queued_attempt_budget
  check (status <> 'queued' or attempt_count < 3) not valid;
create function public.guard_derived_analysis_job() returns trigger
language plpgsql security invoker set search_path = pg_catalog, auth, pg_temp as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or (select auth.role()) = 'service_role' then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'queued'; new.attempt_count := 0; new.requested_at := now();
  elsif old.status = 'queued' and new.status = 'cancelled' then
    new := old; new.status := 'cancelled'; new.cancelled_at := now(); return new;
  elsif old.status in ('failed', 'cancelled') and new.status = 'queued' then
    new := old; new.status := 'queued'; new.attempt_count := 0; new.requested_at := now();
  else
    raise exception 'Unsupported analysis transition' using errcode = '42501';
  end if;
  new.source_hash := null; new.snapshot := null; new.error_code := null;
  new.started_at := null; new.completed_at := null; new.cancelled_at := null;
  return new;
end $$;
revoke all on function public.guard_derived_analysis_job() from public, anon, authenticated;
create trigger guard_derived_analysis_job before insert or update on public.derived_analysis_jobs
  for each row execute function public.guard_derived_analysis_job();

create or replace function public.process_next_derived_analysis(worker_token text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, pg_temp as $$
declare
  claimed_job_id uuid; claimed_user_id uuid; completed_count integer := 0;
  included_count integer := 0; most_recent timestamptz; source_rows jsonb := '[]'::jsonb;
  current_source_hash text;
begin
  if worker_token is null or worker_token !~ '^[a-f0-9]{64}$' or not exists (
    select 1 from public.background_worker_credentials where worker_name = 'derived_analysis'
      and token_hash = encode(extensions.digest(worker_token, 'sha256'), 'hex')
  ) then return jsonb_build_object('authorized', false); end if;
  select id, user_id into claimed_job_id, claimed_user_id from public.derived_analysis_jobs
    where analysis_type = 'simulation_evolution' and status = 'queued' and attempt_count < 3
    order by requested_at asc for update skip locked limit 1;
  if claimed_job_id is null then return jsonb_build_object('authorized', true, 'processed', false, 'reason', 'empty'); end if;
  begin
    update public.derived_analysis_jobs set status = 'running', attempt_count = attempt_count + 1, started_at = now()
      where id = claimed_job_id and status = 'queued';
    select count(*) into completed_count from public.simulations
      where user_id = claimed_user_id and engine_version = 'adaptive-v2' and status = 'completed';
    with latest as (
      select id, completed_at, updated_at from public.simulations
      where user_id = claimed_user_id and engine_version = 'adaptive-v2' and status = 'completed'
      order by completed_at desc nulls last limit 5
    ) select count(*), max(completed_at), coalesce(jsonb_agg(jsonb_build_object('id', id, 'completedAt', completed_at, 'updatedAt', updated_at) order by id), '[]'::jsonb)
      into included_count, most_recent, source_rows from latest;
    current_source_hash := encode(extensions.digest(source_rows::text, 'sha256'), 'hex');
    update public.derived_analysis_jobs set status = 'completed', source_hash = current_source_hash,
      snapshot = jsonb_build_object('version', 'simulation-evolution-v1', 'completedSimulationCount', completed_count,
        'includedSimulationCount', included_count, 'mostRecentCompletedAt', most_recent, 'hasEvolvingFocus', false),
      error_code = null, completed_at = now() where id = claimed_job_id and status = 'running';
    return jsonb_build_object('authorized', true, 'processed', true, 'jobId', claimed_job_id, 'status', 'completed');
  exception when others then
    update public.derived_analysis_jobs set status = 'failed', error_code = 'processing_failed', completed_at = now() where id = claimed_job_id;
    return jsonb_build_object('authorized', true, 'processed', true, 'jobId', claimed_job_id, 'status', 'failed');
  end;
end $$;
revoke all on function public.process_next_derived_analysis(text) from public, anon, authenticated;
grant execute on function public.process_next_derived_analysis(text) to service_role;
commit;
