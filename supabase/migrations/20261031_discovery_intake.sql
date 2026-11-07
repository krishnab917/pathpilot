-- Additive only. Existing student_profile_owner RLS and user_id ownership apply.
-- Deploy this column before application writes; do not run against production automatically.
alter table public.student_profiles
  add column if not exists discovery_intake jsonb;
alter table public.student_profiles
  add constraint student_profiles_discovery_intake_object
  check (discovery_intake is null or
    (jsonb_typeof(discovery_intake) = 'object' and
     (discovery_intake->>'version') is not distinct from 'discovery-intake-v1'));
comment on column public.student_profiles.discovery_intake is
  'Private optional exploration answers; not an aptitude assessment. Validated by the authenticated application.';
