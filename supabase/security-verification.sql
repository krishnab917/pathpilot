-- Read-only deployment verification. Returns catalog metadata, never student rows.
-- Run privately as the database owner, before and after forward migrations.
select n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity,
  pg_get_userbyid(c.relowner) as owner, c.relacl
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','storage') and c.relkind in ('r','v','m') order by 1,2;

select schemaname, tablename, policyname, roles, cmd, permissive, qual, with_check
from pg_policies where schemaname in ('public','storage') order by 1,2,3;

select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_userbyid(p.proowner) as owner, p.prosecdef, p.proconfig, p.proacl,
  has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
  has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute,
  has_function_privilege('service_role',p.oid,'EXECUTE') as service_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' order by p.proname;

select e.extname, n.nspname as extension_schema, pg_get_userbyid(e.extowner) as owner
from pg_extension e join pg_namespace n on n.oid=e.extnamespace;
select nspname, pg_get_userbyid(nspowner) as owner,
  has_schema_privilege('anon',oid,'CREATE') as anon_create,
  has_schema_privilege('authenticated',oid,'CREATE') as authenticated_create
from pg_namespace where nspname in ('public','extensions','auth');
select rolname, rolsuper, rolbypassrls from pg_roles
where rolname in ('anon','authenticated','service_role','postgres','supabase_admin');
select defaclrole::regrole, defaclnamespace::regnamespace, defaclobjtype, defaclacl from pg_default_acl;

select conrelid::regclass as child, confrelid::regclass as parent, conname, confdeltype, convalidated
from pg_constraint where contype='f' and connamespace='public'::regnamespace order by 1,3;
select event_object_schema,event_object_table,trigger_name,action_timing,event_manipulation,action_statement
from information_schema.triggers where event_object_schema in ('public','auth') order by 1,2,3;
select evtname, evtevent, evtenabled, evtfoid::regprocedure from pg_event_trigger;

select table_name, grantee, privilege_type from information_schema.role_table_grants
where table_schema='public' and grantee in ('anon','authenticated','PUBLIC') order by 1,2,3;
-- Inspect the migration ledger separately. Do not replay historical filenames blindly.
