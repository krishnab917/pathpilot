-- Shared, server-only limiter state for PathPilot's expensive authenticated AI operations.
-- Keys are server-generated HMAC values; no raw student identifiers or request text are stored.

create table if not exists public.pathpilot_rate_limit_windows (
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$'),
  action text not null check (action in (
    'mentor:burst', 'mentor:daily',
    'project_guidance:burst', 'project_guidance:daily',
    'roadmap_generation:burst', 'roadmap_generation:daily',
    'profile_analysis:burst', 'profile_analysis:daily'
  )),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (key_hash, action, window_started_at)
);

create index if not exists pathpilot_rate_limit_windows_expiry_idx
  on public.pathpilot_rate_limit_windows (window_started_at);

alter table public.pathpilot_rate_limit_windows enable row level security;
revoke all on table public.pathpilot_rate_limit_windows from public, anon, authenticated;

create table if not exists public.pathpilot_rate_limit_leases (
  lease_hash text primary key check (lease_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null
);

create index if not exists pathpilot_rate_limit_leases_expiry_idx
  on public.pathpilot_rate_limit_leases (expires_at);

alter table public.pathpilot_rate_limit_leases enable row level security;
revoke all on table public.pathpilot_rate_limit_leases from public, anon, authenticated;

create or replace function public.consume_pathpilot_rate_limit(
  p_key_hash text,
  p_action text,
  p_window_seconds integer,
  p_max_requests integer
)
returns table(allowed boolean, retry_after_seconds integer, remaining integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  now_at timestamptz := clock_timestamp();
  window_at timestamptz;
  current_count integer;
begin
  if p_key_hash !~ '^[a-f0-9]{64}$' or p_action not in (
    'mentor:burst', 'mentor:daily',
    'project_guidance:burst', 'project_guidance:daily',
    'roadmap_generation:burst', 'roadmap_generation:daily',
    'profile_analysis:burst', 'profile_analysis:daily'
  ) or p_window_seconds not in (120, 300, 1800, 86400) or p_max_requests < 1 or p_max_requests > 100 then
    raise exception 'invalid PathPilot rate-limit request';
  end if;

  delete from public.pathpilot_rate_limit_windows
    where window_started_at < now_at - interval '8 days';
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

  select request_count into current_count
    from public.pathpilot_rate_limit_windows
    where key_hash = p_key_hash and action = p_action and window_started_at = window_at;
  return query select false,
    greatest(1, ceil(extract(epoch from (window_at + make_interval(secs => p_window_seconds)) - now_at))::integer),
    0;
end;
$$;

create or replace function public.acquire_pathpilot_rate_limit_lease(
  p_lease_hash text,
  p_ttl_seconds integer
)
returns table(acquired boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  now_at timestamptz := clock_timestamp();
  existing_expiry timestamptz;
begin
  if p_lease_hash !~ '^[a-f0-9]{64}$' or p_ttl_seconds < 30 or p_ttl_seconds > 300 then
    raise exception 'invalid PathPilot rate-limit lease';
  end if;

  delete from public.pathpilot_rate_limit_leases where expires_at <= now_at;
  insert into public.pathpilot_rate_limit_leases (lease_hash, expires_at)
  values (p_lease_hash, now_at + make_interval(secs => p_ttl_seconds))
  on conflict (lease_hash) do nothing;

  if found then
    return query select true, 0;
    return;
  end if;

  select expires_at into existing_expiry from public.pathpilot_rate_limit_leases where lease_hash = p_lease_hash;
  return query select false, greatest(1, ceil(extract(epoch from existing_expiry - now_at))::integer);
end;
$$;

create or replace function public.release_pathpilot_rate_limit_lease(p_lease_hash text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.pathpilot_rate_limit_leases where lease_hash = p_lease_hash;
$$;

revoke all on function public.consume_pathpilot_rate_limit(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.acquire_pathpilot_rate_limit_lease(text, integer) from public, anon, authenticated;
revoke all on function public.release_pathpilot_rate_limit_lease(text) from public, anon, authenticated;
grant execute on function public.consume_pathpilot_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.acquire_pathpilot_rate_limit_lease(text, integer) to service_role;
grant execute on function public.release_pathpilot_rate_limit_lease(text) to service_role;
