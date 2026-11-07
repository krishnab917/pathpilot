-- Expand first: deploy this transaction BEFORE the application uses new actions.
-- Existing action names and RPC signatures remain compatible with older builds.
begin;

alter table public.pathpilot_rate_limit_windows
  drop constraint pathpilot_rate_limit_windows_action_check;
alter table public.pathpilot_rate_limit_windows
  add constraint pathpilot_rate_limit_windows_action_check check (action in (
    'mentor:burst', 'mentor:daily', 'project_guidance:burst', 'project_guidance:daily',
    'roadmap_generation:burst', 'roadmap_generation:daily', 'profile_analysis:burst', 'profile_analysis:daily',
    'ai_global:burst', 'ai_global:daily', 'api:read', 'api:write', 'api:sensitive', 'worker:burst'
  ));

create or replace function public.consume_pathpilot_rate_limit(
  p_key_hash text, p_action text, p_window_seconds integer, p_max_requests integer
)
returns table(allowed boolean, retry_after_seconds integer, remaining integer)
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  now_at timestamptz := clock_timestamp();
  window_at timestamptz;
  current_count integer;
begin
  if p_key_hash is null or p_key_hash !~ '^[a-f0-9]{64}$'
    or p_action is null or p_action not in (
      'mentor:burst', 'mentor:daily', 'project_guidance:burst', 'project_guidance:daily',
      'roadmap_generation:burst', 'roadmap_generation:daily', 'profile_analysis:burst', 'profile_analysis:daily',
      'ai_global:burst', 'ai_global:daily', 'api:read', 'api:write', 'api:sensitive', 'worker:burst'
    ) or p_window_seconds is null or p_window_seconds not in (120, 300, 1800, 86400)
    or p_max_requests is null or p_max_requests < 1 or p_max_requests > 10000 then
    raise exception 'invalid PathPilot rate-limit request';
  end if;

  delete from public.pathpilot_rate_limit_windows where window_started_at < now_at - interval '8 days';
  window_at := to_timestamp(floor(extract(epoch from now_at) / p_window_seconds) * p_window_seconds);
  insert into public.pathpilot_rate_limit_windows (key_hash, action, window_started_at, request_count)
  values (p_key_hash, p_action, window_at, 1)
  on conflict (key_hash, action, window_started_at) do update
    set request_count = public.pathpilot_rate_limit_windows.request_count + 1
    where public.pathpilot_rate_limit_windows.request_count < p_max_requests
  returning request_count into current_count;
  if found then
    return query select true, 0, greatest(p_max_requests - current_count, 0);
    return;
  end if;
  return query select false,
    greatest(1, ceil(extract(epoch from (window_at + make_interval(secs => p_window_seconds)) - now_at))::integer), 0;
end;
$$;

-- Every referenced table is qualified. Builtins resolve only in pg_catalog.
alter function public.acquire_pathpilot_rate_limit_lease(text, integer) set search_path = pg_catalog, pg_temp;
alter function public.release_pathpilot_rate_limit_lease(text) set search_path = pg_catalog, pg_temp;
alter function public.process_next_derived_analysis(text) set search_path = pg_catalog, pg_temp;
revoke all on function public.consume_pathpilot_rate_limit(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.acquire_pathpilot_rate_limit_lease(text, integer) from public, anon, authenticated;
revoke all on function public.release_pathpilot_rate_limit_lease(text) from public, anon, authenticated;
revoke all on function public.process_next_derived_analysis(text) from public, anon, authenticated;
grant execute on function public.consume_pathpilot_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.acquire_pathpilot_rate_limit_lease(text, integer) to service_role;
grant execute on function public.release_pathpilot_rate_limit_lease(text) to service_role;
grant execute on function public.process_next_derived_analysis(text) to service_role;
revoke create on schema public from public, anon, authenticated;
revoke all on table public.pathpilot_rate_limit_windows, public.pathpilot_rate_limit_leases from public, anon, authenticated;

commit;
