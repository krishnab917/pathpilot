-- Expand/read/write rollout: apply after both 20261026 security migrations,
-- verify RLS + RPC in disposable staging, then deploy application readers/writers.
-- Nullable additive field preserves historical matches; no records are removed.
begin;
alter table public.career_matches add column career_details jsonb;
alter table public.career_matches add constraint career_matches_details_bound check (
  career_details is null or (jsonb_typeof(career_details) = 'object' and octet_length(career_details::text) <= 65536)
);
-- Preserve each existing match's current display data BEFORE new application
-- writes replace shared descriptions with authored reference text. If a legacy
-- record exceeds the bound, abort transactionally for owner review; never truncate.
update public.career_matches m set career_details = jsonb_build_object(
  'description', c.description,
  'salaryRange', coalesce(c.salary_range, 'Location-dependent'),
  'educationRequirements', coalesce(c.education_requirements, 'Varies by pathway'),
  'requiredSkills', c.required_skills,
  'dailyResponsibilities', c.daily_responsibilities,
  'relatedCareers', c.related_careers
) from public.careers c where c.id = m.career_id and m.career_details is null;
create or replace function public.replace_private_career_matches(p_matches jsonb)
returns void language plpgsql security invoker
set search_path = pg_catalog, pg_temp
as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null or auth.role() <> 'authenticated' then raise exception 'authenticated owner required'; end if;
  if p_matches is null or jsonb_typeof(p_matches) <> 'array' or jsonb_array_length(p_matches) <> 5 or octet_length(p_matches::text) > 327680 then
    raise exception 'invalid career matches';
  end if;
  if (select count(distinct item->>'career_id') from jsonb_array_elements(p_matches) item) <> 5
    or exists (select 1 from jsonb_array_elements(p_matches) item where item ? 'user_id' or jsonb_typeof(item) <> 'object') then
    raise exception 'invalid career matches';
  end if;
  -- Serialize replacements for one owner; RLS remains authoritative. Invalid
  -- inserts roll back this delete as part of the same RPC transaction.
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text, 0));
  delete from public.career_matches where user_id = owner_id;
  insert into public.career_matches (user_id,career_id,rank,match_score,reasoning,strengths,missing_skills,reality_check,next_steps,career_details)
  select owner_id,(item->>'career_id')::uuid,position::smallint,(item->>'match_score')::smallint,
    item->>'reasoning',item->'strengths',item->'missing_skills',item->>'reality_check',item->'next_steps',item->'career_details'
  from jsonb_array_elements(p_matches) with ordinality as entries(item,position);
end;
$$;
revoke all on function public.replace_private_career_matches(jsonb) from public, anon, service_role;
grant execute on function public.replace_private_career_matches(jsonb) to authenticated;
commit;
