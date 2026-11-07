// Explicitly opted-in disposable project only. No credentials are logged or saved.
// Admin access creates/removes synthetic accounts; every data request uses a student JWT.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { buildBaseline } from './staging-migrations.mjs';

const ref = 'qekwtncqujusgkjeabyp';
if (process.env.SUPABASE_TEST_PROJECT_REF !== ref || process.env.SUPABASE_TEST_DISPOSABLE !== '1') {
  throw new Error('Requires explicit disposable staging opt-in for the reviewed project.');
}
const base = `https://${ref}.supabase.co`;
function cli(args) {
  try {
    return JSON.parse(execFileSync('npx', ['--yes', 'supabase@3.0.0', ...args, '--output-format', 'json'], {
      cwd: '/private/tmp', encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000,
    }));
  } catch { throw new Error('Supabase CLI request failed; no credential-bearing output printed.'); }
}
const query = sql => cli(['db', 'query', `--remote=${ref}`, '--read-only', sql]).rows;
let passed = 0;
function check(value, label) { assert.ok(value, label); passed++; console.log(`PASS ${label}`); }
const projects = cli(['projects', 'list']).projects;
check(projects.some(p => p.id === ref && p.name === 'pathpilot-staging' && p.organization_id === 'ucxtorsbwsxvfyaemhks'), 'staging identity');
const ledger = query('select project_ref,checksum,jsonb_array_length(manifest) n from pathpilot_staging.baseline')[0];
check(ledger.project_ref === ref && ledger.n === 35 && buildBaseline(ref).includes(ledger.checksum), 'reviewed 35-migration fingerprint');
check(query("select count(*)::int n from pg_class where relnamespace='public'::regnamespace and relkind in ('r','p') and not relrowsecurity")[0].n === 0, 'all public tables protected by RLS');
check(query("select count(*)::int n from pg_policies where policyname in ('project_goal_target_owner','mentor_conversation_target_owner','guidance_project_target_owner','project_roadmap_target_owner','recommendation_targets_owner') and permissive='RESTRICTIVE'")[0].n === 5, 'five restrictive target-owner policies');
check(query("select count(*)::int n from pg_trigger where tgname='guard_derived_analysis_job' and tgenabled='O'")[0].n === 1, 'queue ownership trigger');
for (const name of ['consume_pathpilot_rate_limit(text,text,integer,integer)', 'acquire_pathpilot_rate_limit_lease(text,integer)', 'release_pathpilot_rate_limit_lease(text)', 'process_next_derived_analysis(text)', 'replace_private_career_matches(jsonb)', 'guard_derived_analysis_job()']) {
  check(query(`select to_regprocedure('public.${name}') is not null as ok`)[0].ok, `required function ${name}`);
}
for (const table of ['background_worker_credentials', 'pathpilot_rate_limit_windows', 'pathpilot_rate_limit_leases']) {
  check(query(`select not has_table_privilege('authenticated','public.${table}','SELECT,INSERT,UPDATE,DELETE') as ok`)[0].ok, `private table grants ${table}`);
}
const keyResult = cli(['projects', 'api-keys', `--remote=${ref}`, '--reveal']);
const keys = Array.isArray(keyResult) ? keyResult : keyResult.api_keys ?? keyResult.keys;
const anon = keys.find(k => k.name === 'anon')?.api_key;
const admin = keys.find(k => k.name === 'service_role')?.api_key;
assert.ok(anon && admin, 'Staging key access required');
async function request(path, token, method = 'GET', body, adminRequest = false) {
  const response = await fetch(base + path, {
    method, headers: { apikey: adminRequest ? admin : anon, Authorization: `Bearer ${token ?? anon}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20000),
  });
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = null; }
  return { status: response.status, ok: response.ok, data };
}
const accounts = [];
try {
  for (const [label, field] of [['A', 'arts'], ['B', 'trades']]) {
    const email = `pathpilot-staging-${randomUUID()}@example.com`;
    const password = randomBytes(32).toString('base64url');
    const created = await request('/auth/v1/admin/users', admin, 'POST', { email, password, email_confirm: true }, true);
    check(created.ok && created.data?.id, `${label} synthetic account creation`);
    const account = { label, field, email, password, id: created.data.id };
    accounts.push(account); // Register cleanup before login can fail.
    const login = await request('/auth/v1/token?grant_type=password', null, 'POST', { email, password });
    check(login.ok && login.data?.user?.id === account.id && login.data.access_token, `${label} actual password authentication`);
    account.token = login.data.access_token;
    account.refresh = login.data.refresh_token;
    account.intake = { version: 'discovery-intake-v1', fields: [field], preferences: { practical: 1 }, motivations: [], subjects: [], pathways: ['apprenticeship'], direction: 'open', careers: [] };
    const profile = await request('/rest/v1/student_profiles', account.token, 'POST', { user_id: account.id, grade: '10', location: 'Synthetic staging', interests: [field], career_preferences: ['Explore'], discovery_intake: account.intake });
    check(profile.ok && profile.data?.[0]?.user_id === account.id, `${label} owner profile write`);
    const draft = await request('/rest/v1/onboarding_drafts', account.token, 'POST', { user_id: account.id, current_step: 2, payload: { interests: [field], discoveryIntake: account.intake } });
    check(draft.ok, `${label} owner draft write`);
  }
  for (const account of accounts) {
    const other = accounts.find(a => a !== account);
    for (const table of ['student_profiles', 'onboarding_drafts']) {
      const path = `/rest/v1/${table}`;
      const own = await request(path, account.token);
      check(own.ok && own.data.length === 1 && own.data[0].user_id === account.id, `${account.label} ${table} own-only SELECT`);
      for (const method of ['GET', 'PATCH', 'DELETE']) {
        const result = await request(`${path}?user_id=eq.${other.id}`, account.token, method, method === 'PATCH' ? { user_id: other.id } : undefined);
        check(result.ok && Array.isArray(result.data) && result.data.length === 0, `${account.label} ${table} cross ${method} affects zero rows`);
      }
      const forged = table === 'student_profiles' ? { user_id: other.id, grade: '10', location: 'Forged synthetic' } : { user_id: other.id, payload: {} };
      const insert = await request(path, account.token, 'POST', forged);
      check(insert.status === 403 && insert.data?.code === '42501', `${account.label} ${table} forged INSERT denied by RLS`);
      const reassign = await request(`${path}?user_id=eq.${account.id}`, account.token, 'PATCH', { user_id: other.id });
      check(reassign.status === 403 && reassign.data?.code === '42501', `${account.label} ${table} owner reassignment denied`);
      // CLI's SELECT-only filter rejects BEGIN/SET. Explicit confirmation permits
      // transaction control; PostgreSQL itself still enforces READ ONLY.
      const sql = `begin read only; set local role authenticated; select set_config('request.jwt.claims','{"sub":"${account.id}","role":"authenticated"}',true); select count(*)::int as visible, count(*) filter(where user_id='${other.id}')::int as foreign_rows from public.${table}; rollback;`;
      const rows = cli(['db', 'query', `--remote=${ref}`, '--yes', sql]).rows;
      check(rows.some(r => r.visible === 1 && r.foreign_rows === 0), `${account.label} ${table} independent SQL-role RLS`);
    }
    const refreshed = await request('/auth/v1/token?grant_type=refresh_token', null, 'POST', { refresh_token: account.refresh });
    check(refreshed.ok && refreshed.data.access_token, `${account.label} session refresh`);
    account.token = refreshed.data.access_token;
    const restored = await request(`/rest/v1/onboarding_drafts?user_id=eq.${account.id}`, account.token);
    check(restored.ok && restored.data[0].current_step === 2 && restored.data[0].payload.discoveryIntake.fields[0] === account.field, `${account.label} draft restored after refresh`);
    const cleared = { ...account.intake, pathways: [] };
    check((await request(`/rest/v1/student_profiles?user_id=eq.${account.id}`, account.token, 'PATCH', { discovery_intake: cleared })).ok, `${account.label} clear training pathway`);
    check((await request('/auth/v1/logout?scope=global', account.token, 'POST')).ok, `${account.label} logout`);
    const login = await request('/auth/v1/token?grant_type=password', null, 'POST', { email: account.email, password: account.password });
    check(login.ok && login.data.access_token, `${account.label} new authenticated session`);
    account.token = login.data.access_token;
    const persisted = await request(`/rest/v1/student_profiles?user_id=eq.${account.id}`, account.token);
    check(persisted.ok && isDeepStrictEqual(persisted.data[0].discovery_intake, cleared), `${account.label} preferences restored and training remains cleared`);
    check(persisted.data[0].interests[0] === account.field && persisted.data[0].grade === '10' && persisted.data[0].career_preferences[0] === 'Explore', `${account.label} legacy fields preserved`);
    for (const invalid of [[], {}, { version: 'invalid' }]) {
      const rejected = await request(`/rest/v1/student_profiles?user_id=eq.${account.id}`, account.token, 'PATCH', { discovery_intake: invalid });
      check(rejected.status === 400 && rejected.data?.code === '23514', `${account.label} invalid intake outer shape/version rejected`);
    }
  }
  for (const table of ['student_profiles', 'onboarding_drafts']) {
    const result = await request(`/rest/v1/${table}`, null);
    check(result.status === 401 && result.data?.code === '42501', `anonymous ${table} denied`);
  }
  console.log(`PASS: ${passed} hosted assertions. Browser/tRPC behavior and nested database validation are NOT verified by this script.`);
} catch (error) {
  // Assertion labels contain no response bodies, tokens, email addresses, or passwords.
  console.error('FAIL:', error instanceof assert.AssertionError ? error.message : 'Hosted request failed; sensitive output withheld.');
  process.exitCode = 1;
} finally {
  for (const account of accounts) {
    try {
      if (account.token) await request('/auth/v1/logout?scope=global', account.token, 'POST');
      const removed = await request(`/auth/v1/admin/users/${account.id}`, admin, 'DELETE', undefined, true);
      check(removed.ok, `${account.label} synthetic account cleanup`);
    } catch { console.error(`FAIL ${account.label} synthetic cleanup; owner review required`); process.exitCode = 1; }
  }
}
