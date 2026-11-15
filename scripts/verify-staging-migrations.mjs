// In-memory PostgreSQL only. No URL, password, network connection, or hosted writes.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { buildBaseline, loadPlan } from './staging-migrations.mjs';
const moduleUrl = pathToFileURL(process.argv[2] || '');
if (!process.argv[2]?.startsWith('/')) throw new Error('Supply absolute temporary PGlite module path.');
const { PGlite } = await import(moduleUrl.href);
const { pgcrypto } = await import(new URL('contrib/pgcrypto.js', moduleUrl).href);
const db = new PGlite({ extensions: { pgcrypto } });
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
const reject = async (sql, code) => {
  let error;
  try { await db.exec(sql); } catch (caught) { error = caught; }
  check(Boolean(error) && (!code || error.code === code), `Expected rejection ${code || ''}`);
};
const ref = 'abcdefghijklmnopqrst'; // Fictional local marker, not a hosted reference.
const a = '11111111-1111-4111-8111-111111111111';
const b = '22222222-2222-4222-8222-222222222222';
const platform = `create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth; create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  create function auth.role() returns text language sql stable as $$ select current_user::text $$;
  grant usage on schema auth to anon, authenticated, service_role;
  set pathpilot.confirm_disposable='${ref}';`;
const snapshot = async () => JSON.stringify((await db.query(`
  select 'column' kind, table_name || '.' || column_name name, data_type || ':' || is_nullable value from information_schema.columns where table_schema='public'
  union all select 'policy', tablename || '.' || policyname, coalesce(qual,'') || coalesce(with_check,'') from pg_policies where schemaname='public'
  union all select 'index', indexname, indexdef from pg_indexes where schemaname='public'
  union all select 'function', p.oid::regprocedure::text, pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
  union all select 'constraint', conname, pg_get_constraintdef(oid) from pg_constraint where connamespace='public'::regnamespace
  union all select 'trigger', tgname, pg_get_triggerdef(oid) from pg_trigger where not tgisinternal
  order by 1,2,3
`)).rows);
try {
  for (const [setup, expected] of [
    [platform + 'create table public.existing_work(id integer); insert into public.existing_work values(42);', 'existing tables/users found'],
    [platform + `insert into auth.users values('${a}');`, 'existing tables/users found'],
    [platform + "set pathpilot.confirm_disposable='';", 'Owner must confirm'],
    [`set pathpilot.confirm_disposable='${ref}';`, 'Auth prerequisites missing'],
  ]) {
    const guarded = new PGlite({ extensions: { pgcrypto } });
    try {
      await guarded.exec(setup);
      let failure;
      try { await guarded.exec(buildBaseline(ref)); } catch (error) { failure = error; }
      check(failure?.message.includes(expected), `Guard rejects: ${expected}`);
      await guarded.exec('rollback');
      check((await guarded.query("select to_regclass('pathpilot_staging.baseline') marker")).rows[0].marker === null, 'Rejected initialization leaves no ledger');
      if (setup.includes('existing_work')) check((await guarded.query('select id from public.existing_work')).rows[0].id === 42, 'Existing work preserved');
      if (setup.includes('insert into auth.users')) check((await guarded.query('select id from auth.users')).rows[0].id === a, 'Existing auth user preserved');
    } finally { await guarded.close(); }
  }
  // Supabase platform stubs are ONLY in this ephemeral test, never in baseline output.
  await db.exec(platform);
  await db.exec(buildBaseline(ref));
  check((await db.query('select jsonb_array_length(manifest) n from pathpilot_staging.baseline')).rows[0].n === 35, 'All 35 histories recorded');
  const initial = await snapshot();
  await db.exec(buildBaseline(ref));
  check(initial === await snapshot(), 'Repeated initialization leaves schema unchanged');
  const fingerprint = (await db.query('select checksum from pathpilot_staging.baseline')).rows[0].checksum;
  await db.exec("update pathpilot_staging.baseline set checksum='outdated'");
  await reject(buildBaseline(ref), 'P0001');
  await db.exec('rollback');
  await db.query('update pathpilot_staging.baseline set checksum=$1', [fingerprint]);
  check((await db.query("select count(*)::int n from pg_class where relnamespace='public'::regnamespace and relkind='r' and not relrowsecurity")).rows[0].n === 0, 'Every public table has RLS');
  for (const name of ['consume_pathpilot_rate_limit(text,text,integer,integer)', 'acquire_pathpilot_rate_limit_lease(text,integer)', 'release_pathpilot_rate_limit_lease(text)', 'process_next_derived_analysis(text)', 'replace_private_career_matches(jsonb)', 'guard_derived_analysis_job()']) {
    check((await db.query('select to_regprocedure($1) routine', [`public.${name}`])).rows[0].routine !== null, `Required function ${name}`);
  }
  check((await db.query("select count(*)::int n from pg_trigger where tgname='guard_derived_analysis_job' and tgenabled='O'")).rows[0].n === 1, 'Queue guard trigger retained');
  check((await db.query("select count(*)::int n from pg_policies where policyname in ('project_goal_target_owner','mentor_conversation_target_owner','guidance_project_target_owner','project_roadmap_target_owner','recommendation_targets_owner') and permissive='RESTRICTIVE'")).rows[0].n === 5, 'All restrictive ownership policies retained');
  await db.exec(`insert into auth.users values ('${a}'),('${b}');`);
  // Create both records before testing either direction, so empty reads cannot pass vacuously.
  for (const owner of [a,b]) {
    await db.exec(`set role authenticated; set request.jwt.claim.sub='${owner}';
      insert into public.student_profiles(user_id,grade,location,interests) values('${owner}','10','Synthetic','["art"]');
      insert into public.onboarding_drafts(user_id,current_step,payload) values('${owner}',2,'{"interests":["art"]}'); reset role;`);
  }
  for (const [owner, other] of [[a,b],[b,a]]) {
    await db.exec(`set role authenticated; set request.jwt.claim.sub='${owner}';`);
    check((await db.query('select user_id from public.student_profiles')).rows.every(r => r.user_id === owner), 'Owner sees only own profile');
    await reject(`insert into public.student_profiles(user_id,grade,location) values('${other}','10','Forged')`, '42501');
    await reject(`insert into public.onboarding_drafts(user_id,payload) values('${other}','{}')`, '42501');
    for (const table of ['student_profiles','onboarding_drafts']) {
      check((await db.query(`select * from public.${table} where user_id='${other}'`)).rows.length === 0, 'Cross SELECT denied');
      check((await db.query(`update public.${table} set user_id=user_id where user_id='${other}' returning user_id`)).rows.length === 0, 'Cross UPDATE denied');
      check((await db.query(`delete from public.${table} where user_id='${other}' returning user_id`)).rows.length === 0, 'Cross DELETE denied');
      await reject(`update public.${table} set user_id='${other}' where user_id='${owner}'`, '42501');
    }
    await db.exec(`update public.student_profiles set discovery_intake='{"version":"discovery-intake-v1"}' where user_id='${owner}';`);
    check((await db.query('select discovery_intake from public.student_profiles')).rows[0].discovery_intake.version === 'discovery-intake-v1', 'Intake persists under owner RLS');
    for (const invalid of ['[]','"text"','{}','{"version":"invalid"}','{"version":null}']) {
      await reject(`update public.student_profiles set discovery_intake='${invalid}'`, '23514');
    }
    await db.exec('update public.student_profiles set discovery_intake=null');
    check((await db.query('select discovery_intake,interests from public.student_profiles')).rows[0].discovery_intake === null, 'Nullable legacy intake/clearing works');
    check(JSON.stringify((await db.query('select interests from public.student_profiles')).rows[0].interests) === '["art"]', 'Unrelated profile field preserved');
    await db.exec('reset role');
  }
  await db.exec("set role anon; set request.jwt.claim.sub='';");
  await reject('select * from public.student_profiles', '42501');
  await reject('select * from public.onboarding_drafts', '42501');
  await db.exec('reset role');
  // Explicitly record the database-only nested validation gap; do not claim strict Zod runs in REST.
  await db.exec(`update public.student_profiles set discovery_intake='{"version":"discovery-intake-v1","preferences":"invalid"}' where user_id='${a}';`);
  check((await db.query(`select discovery_intake from public.student_profiles where user_id='${a}'`)).rows[0].discovery_intake.preferences === 'invalid', 'Known nested validation gap reproduced');
  await db.exec(`update public.student_profiles set discovery_intake=null where user_id='${a}';`);
  const beforeRows = JSON.stringify((await db.query('select * from public.student_profiles order by user_id')).rows);
  await db.exec(buildBaseline(ref));
  check(beforeRows === JSON.stringify((await db.query('select * from public.student_profiles order by user_id')).rows), 'Repeat does not rewrite profile rows');
  await reject(buildBaseline('b'.repeat(20)));
  await db.exec('rollback');
  // Test the intake source against genuinely pre-existing profiles without dropping a column.
  const legacy = new PGlite({ extensions: { pgcrypto } });
  try {
    await legacy.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql as $$select null::uuid$$;
      create schema extensions; create extension pgcrypto with schema extensions;`);
    await legacy.exec(loadPlan()[0].sql);
    await legacy.exec(`insert into auth.users values('${a}'); insert into public.student_profiles(user_id,grade,location) values('${a}','10','Synthetic');`);
    const before = (await legacy.query("select to_jsonb(p) as row from public.student_profiles p")).rows[0].row;
    await legacy.exec(loadPlan().at(-1).sql);
    const after = (await legacy.query("select to_jsonb(p)-'discovery_intake' as row from public.student_profiles p")).rows[0].row;
    check(JSON.stringify(before) === JSON.stringify(after), 'Onboarding migration preserves legacy rows');
  } finally { await legacy.close(); }
  console.log(`PASS: 35 migrations compiled/executed; ${checks} isolated PostgreSQL assertions. NOT live Supabase/Auth/PostgREST verification.`);
} catch (error) {
  // Only authored SQL and synthetic data enter this isolated process; never accepts credentials.
  console.error('FAIL:', { code: error.code, message: error.message });
  process.exitCode = 1;
} finally { await db.close(); }
