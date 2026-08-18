create or replace function public.process_next_derived_analysis(worker_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  claimed_job_id uuid;
  claimed_user_id uuid;
  completed_count integer := 0;
  included_count integer := 0;
  most_recent timestamptz;
  source_rows jsonb := '[]'::jsonb;
  current_source_hash text;
begin
  if worker_token is null
    or worker_token !~ '^[a-f0-9]{64}$'
    or not exists (
      select 1 from public.background_worker_credentials
      where worker_name = 'derived_analysis'
        and token_hash = encode(digest(worker_token, 'sha256'), 'hex')
    ) then
    return jsonb_build_object('authorized', false);
  end if;

  select id, user_id into claimed_job_id, claimed_user_id
  from public.derived_analysis_jobs
  where analysis_type = 'simulation_evolution' and status = 'queued'
  order by requested_at asc
  for update skip locked
  limit 1;

  if claimed_job_id is null then
    return jsonb_build_object('authorized', true, 'processed', false, 'reason', 'empty');
  end if;

  update public.derived_analysis_jobs
  set status = 'running', attempt_count = attempt_count + 1, started_at = now()
  where id = claimed_job_id and status = 'queued';

  begin
    select count(*) into completed_count
    from public.simulations
    where user_id = claimed_user_id and engine_version = 'adaptive-v2' and status = 'completed';

    with latest as (
      select id, completed_at, updated_at
      from public.simulations
      where user_id = claimed_user_id and engine_version = 'adaptive-v2' and status = 'completed'
      order by completed_at desc nulls last
      limit 5
    )
    select count(*), max(completed_at), coalesce(jsonb_agg(jsonb_build_object('id', id, 'completedAt', completed_at, 'updatedAt', updated_at) order by id), '[]'::jsonb)
    into included_count, most_recent, source_rows
    from latest;

    current_source_hash := encode(digest(source_rows::text, 'sha256'), 'hex');

    update public.derived_analysis_jobs
    set status = 'completed',
        source_hash = current_source_hash,
        snapshot = jsonb_build_object(
          'version', 'simulation-evolution-v1',
          'completedSimulationCount', completed_count,
          'includedSimulationCount', included_count,
          'mostRecentCompletedAt', most_recent,
          'hasEvolvingFocus', false
        ),
        error_code = null,
        completed_at = now()
    where id = claimed_job_id and status = 'running';

    return jsonb_build_object('authorized', true, 'processed', true, 'jobId', claimed_job_id, 'status', 'completed');
  exception when others then
    update public.derived_analysis_jobs
    set status = 'failed', error_code = 'processing_failed', completed_at = now()
    where id = claimed_job_id and status = 'running';
    return jsonb_build_object('authorized', true, 'processed', true, 'jobId', claimed_job_id, 'status', 'failed');
  end;
end;
$$;

revoke all on function public.process_next_derived_analysis(text) from public;
grant execute on function public.process_next_derived_analysis(text) to anon, authenticated, service_role;

comment on function public.process_next_derived_analysis(text) is 'Processes at most one bounded queued derived-analysis job after verifying a server-supplied opaque token against its SHA-256 verifier. Returns only job status metadata.';
