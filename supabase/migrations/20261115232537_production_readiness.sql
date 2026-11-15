begin;
-- Additive, no data rewrite. NOT VALID retains old rows for owner-led preflight;
-- all new/updated rows must satisfy these checks. Validate after compatibility review.
create function public.intake_text_valid(v jsonb, minimum integer, maximum integer, trim_text boolean default true)
returns boolean language sql immutable parallel safe set search_path = pg_catalog as $$
  select coalesce(jsonb_typeof(v) = 'string' and
    (select coalesce(sum(case when c = '' then 0 when octet_length(c) = 4 then 2 else 1 end), 0)
     from regexp_split_to_table(case when trim_text then btrim(v #>> '{}', E' \t\n\r\f' || chr(11) || U&'\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF') else v #>> '{}' end, '') c) between minimum and maximum, false)
$$;
create function public.intake_list_valid(v jsonb, maximum integer, allowed text[] default null)
returns boolean language plpgsql immutable set search_path = pg_catalog as $$
declare item jsonb;
begin
  if jsonb_typeof(v) is distinct from 'array' then return false; end if;
  if jsonb_array_length(v) > maximum then return false; end if;
  for item in select value from jsonb_array_elements(v) loop
    if not public.intake_text_valid(item, 1, 80) then return false; end if;
    if allowed is not null and not ((item #>> '{}') = any(allowed)) then return false; end if;
  end loop;
  return true;
end $$;
create function public.discovery_intake_valid(v jsonb)
returns boolean language plpgsql immutable set search_path = pg_catalog as $$
declare k text; item jsonb;
begin
  if v is null then return true; end if;
  if jsonb_typeof(v) is distinct from 'object' or octet_length(v::text) > 16000 then return false; end if;
  if (v->>'version') is distinct from 'discovery-intake-v1' then return false; end if;
  for k in select jsonb_object_keys(v) loop
    if k <> all(array['version','fields','preferences','motivations','subjects','pathways','direction','careers']) then return false; end if;
  end loop;
  if not public.intake_list_valid(coalesce(v->'fields','[]'),12,array['technology','healthcare','business','creative','hospitality','trades','education','public-service','human-services','environment','transport','sport']) then return false; end if;
  if not public.intake_list_valid(coalesce(v->'motivations','[]'),9,array['Financial stability','Creativity','Helping others','Intellectual challenge','Leadership','Independence','Work-life balance','Innovation','Building tangible things']) then return false; end if;
  if not public.intake_list_valid(coalesce(v->'pathways','[]'),7,array['workplace','apprenticeship','certificate','associate','degree','graduate','portfolio']) then return false; end if;
  if not public.intake_list_valid(coalesce(v->'subjects','[]'),12) or not public.intake_list_valid(coalesce(v->'careers','[]'),12) then return false; end if;
  if v ? 'direction' and (jsonb_typeof(v->'direction') <> 'string' or (v->>'direction') <> all(array['open','ideas'])) then return false; end if;
  if v ? 'preferences' then
    if jsonb_typeof(v->'preferences') is distinct from 'object' then return false; end if;
    for k,item in select * from jsonb_each(v->'preferences') loop
      if k <> all(array['investigation','practical','abstract','creative','collaboration','independent','constraints','planning','adaptation','service','communication']) or
         jsonb_typeof(item) <> 'number' then return false; end if;
      if (item #>> '{}')::numeric not in (0,0.5,1) then return false; end if;
    end loop;
  end if;
  return true;
end $$;
create function public.onboarding_payload_valid(v jsonb)
returns boolean language plpgsql immutable set search_path = pg_catalog as $$
declare k text;
begin
  if jsonb_typeof(v) is distinct from 'object' or octet_length(v::text) > 65536 then return false; end if;
  -- Historical empty draft default is harmless and remains readable.
  if v = '{}'::jsonb then return true; end if;
  for k in select jsonb_object_keys(v) loop
    if k <> all(array['grade','location','countryCode','educationSystem','interests','skills','activities','careerPreferences','discoveryIntake']) then return false; end if;
  end loop;
  if not public.intake_text_valid(v->'grade',0,16,false) or not public.intake_text_valid(v->'location',0,160,false) then return false; end if;
  foreach k in array array['interests','skills','activities','careerPreferences'] loop
    if not public.intake_list_valid(v->k,12) then return false; end if;
  end loop;
  if v ? 'countryCode' and v->'countryCode' <> 'null'::jsonb and
    (jsonb_typeof(v->'countryCode') <> 'string' or (v->>'countryCode') !~ '^[A-Z]{2}$') then return false; end if;
  if v ? 'educationSystem' and v->'educationSystem' <> 'null'::jsonb and not public.intake_text_valid(v->'educationSystem',0,180,false) then return false; end if;
  if v ? 'discoveryIntake' and not public.discovery_intake_valid(v->'discoveryIntake') then return false; end if;
  return true;
end $$;
alter table public.student_profiles add constraint discovery_intake_nested_valid
  check (public.discovery_intake_valid(discovery_intake)) not valid;
alter table public.student_profiles add constraint profile_intake_fields_valid
  check (public.onboarding_payload_valid(jsonb_build_object(
    'grade',grade,'location',location,'interests',interests,'skills',skills,
    'activities',activities,'careerPreferences',career_preferences,
    'countryCode',country_code,'educationSystem',education_system))) not valid;
alter table public.onboarding_drafts add constraint onboarding_payload_nested_valid
  check (public.onboarding_payload_valid(payload)) not valid;

-- Abort on pre-existing duplicate active plans; never archive user data to make an index pass.
do $$ begin
  if exists(select 1 from public.roadmaps where status='active' group by user_id having count(*) > 1) then
    raise exception 'Multiple active roadmaps exist. Owner review required before migration.';
  end if;
end $$;
create unique index roadmaps_one_active_owner on public.roadmaps(user_id) where status='active';

create function public.replace_roadmap_atomic(p_user_id uuid, p_expected_id uuid, p_target text, p_items jsonb)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare owner_id uuid := auth.uid(); current_id uuid; new_plan public.roadmaps; item jsonb;
begin
  if owner_id is null or owner_id is distinct from p_user_id then
    raise exception 'Unauthorized roadmap replacement' using errcode='42501';
  end if;
  if p_target is null or length(btrim(p_target)) not between 2 and 180 or
     jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Invalid roadmap input' using errcode='22023';
  end if;
  if jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Invalid milestone count' using errcode='22023'; end if;
  -- Per-owner lock covers the no-existing-roadmap case as well. RLS stays active.
  perform pg_advisory_xact_lock(hashtextextended('pathpilot:roadmap:' || owner_id::text, 0));
  select id into current_id from public.roadmaps where user_id=owner_id and status='active' for update;
  if current_id is distinct from p_expected_id then
    raise exception 'Roadmap changed. Refresh before replacing it.' using errcode='40001';
  end if;
  update public.roadmaps set status='archived', updated_at=now() where user_id=owner_id and status='active';
  insert into public.roadmaps(user_id,target_career) values(owner_id,p_target) returning * into new_plan;
  for item in select value from jsonb_array_elements(p_items) loop
    insert into public.roadmap_milestones(roadmap_id,year,title,description,category,deadline,priority,estimated_hours,resources,progress,status,sort_order)
    values(new_plan.id,(item->>'year')::smallint,item->>'title',item->>'description',item->>'category',
      (item->>'deadline')::timestamptz,item->>'priority',(item->>'estimated_hours')::integer,
      coalesce(item->'resources','[]'),coalesce((item->>'progress')::smallint,0),coalesce(item->>'status','not_started'),(item->>'sort_order')::integer);
  end loop;
  return to_jsonb(new_plan) || jsonb_build_object('milestones',
    (select jsonb_agg(to_jsonb(m) order by year,sort_order) from public.roadmap_milestones m where roadmap_id=new_plan.id));
end $$;
revoke all on function public.replace_roadmap_atomic(uuid,uuid,text,jsonb) from public,anon;
grant execute on function public.replace_roadmap_atomic(uuid,uuid,text,jsonb) to authenticated;
-- Pure immutable validators disclose no records; their execute permission is needed by CHECKs.
commit;
