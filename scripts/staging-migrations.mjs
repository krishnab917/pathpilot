// Offline baseline compiler. Never connects to a database or reads credentials.
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
// Dependencies are entry numbers, not ambiguous historical date prefixes.
export const manifest = [
  ['20260813_pathpilot_core', [], 'Core tables, owner policies; requires Supabase Auth and pgcrypto'],
  ['20260813_pathpilot_security_remediation', [1], 'Catalog/milestone policies; optional dashboard function revoke'],
  ['20260813_onboarding_drafts', [], 'Private drafts; requires auth.users'],
  ['20260813_project_development_metadata', [1], 'Project metadata and project_goals'],
  ['20260813_adaptive_simulation_engine', [1], 'Adaptive simulation columns/index'],
  ['20260813_v11_country_roadmap_recommendations', [1], 'Country columns and recommendations'],
  ['20260815_roadmap_project_foundation', [1], 'Project-to-milestone foreign key/index'],
  ['20260816_verified_opportunities', [], 'Sources, opportunities, student states; requires Auth'],
  ['20260816_curated_opportunity_catalog', [8], 'Category normalization, nullable dates, domain columns'],
  ['20260816_opportunity_source_refresh_contract', [8], 'Participation constraint; deletes NASA source and related saved states'],
  ['20260816_simulation_behavioral_events', [1], 'Simulation behavioral events'],
  ['20260817_checkpoint14_behavioral_activity_events', [], 'Private activity table; requires Auth'],
  ['20260817_checkpoint18_project_roadmap_activity_events', [12], 'Expand activity checks'],
  ['20260817_checkpoint24_planning_report_share_links', [], 'Private share capabilities; requires Auth'],
  ['20260817_checkpoint25_opportunity_discovery', [8,9], 'Search columns/indexes and eight-argument RPC'],
  ['20260817_checkpoint25_opportunity_discovery_function_security', [15], 'Restrict eight-argument RPC'],
  ['20260817_checkpoint25_opportunity_discovery_revoke_anon', [16], 'Revoke explicit anon RPC access'],
  ['20260817_checkpoint26_opportunity_relevance', [17], 'Replace eight-argument RPC with eleven-argument RPC'],
  ['20260817_checkpoint27_project_workspace', [1], 'Project notes/milestones and ownership'],
  ['20260817_checkpoint29_portfolio_publication', [1], 'Portfolio tables and initial policies'],
  ['20260817_checkpoint29_portfolio_profile_visibility', [20], 'Narrow public portfolio visibility'],
  ['20260817_checkpoint31_simulation_response_timing', [1], 'Optional timing columns'],
  ['20260818_checkpoint36_ai_result_cache', [1], 'Private project AI cache'],
  ['20260818_checkpoint37_derived_analysis_jobs', [], 'Private queue; requires Auth'],
  ['20260818_checkpoint37_worker_credential', [], 'Service-only worker verifier; UPSERT overwrites verifier'],
  ['20260818_checkpoint37_worker_processor_rpc', [5,24,25], 'Worker function; requires extensions.pgcrypto'],
  ['20260818_checkpoint37_worker_rpc_private', [26], 'Restrict worker RPC and credential policy'],
  ['20260818_checkpoint39_security_performance', [2,3,4,6,7,8,12,14,19,20,23,24], 'FK indexes and owner-policy alterations; policy-name adaptation'],
  ['20260818_checkpoint39_portfolio_policy_optimization', [21,28], 'Replace portfolio owner policies with command-specific policies'],
  ['20260827_checkpoint65_shared_ai_rate_limits', [], 'Service-only quota state and RPCs'],
  ['20260901_prelaunch_hardening_rpc_safety', [26,27], 'Qualified worker digest; service-only access'],
  ['20261026_security_abuse_budgets', [30,31], 'Quota actions, hardened RPC search paths and grants'],
  ['20261026_security_ownership', [4,6,7,14,19,23,24,29,32], 'Restrictive target policies, queue trigger and worker replacement'],
  ['20261027_private_discovery_details', [32,33], 'Private match details/backfill and owner replacement RPC'],
  ['20261031_discovery_intake', [1,33], 'Nullable versioned intake JSON; application validates nested fields'],
];
const hash = value => createHash('sha256').update(value).digest('hex');
export function loadPlan() {
  const names = readdirSync(resolve(root, 'supabase/migrations')).filter(name => name.endsWith('.sql')).sort();
  const expected = manifest.map(([name]) => `${name}.sql`).sort();
  if (JSON.stringify(names) !== JSON.stringify(expected)) throw new Error('Migration inventory changed: review manifest before compiling.');
  return manifest.map(([name, dependencies, purpose], index) => {
    if (dependencies.some(id => id < 1 || id > index)) throw new Error(`Invalid dependency for ${name}`);
    const source = readFileSync(resolve(root, 'supabase/migrations', `${name}.sql`), 'utf8');
    let sql = source;
    const adaptations = [];
    if (index === 1) {
      const original = 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated;';
      if (!sql.includes(original)) throw new Error('Dashboard revoke changed; review adapter.');
      sql = sql.replace(original, `do $optional_dashboard$ begin
        if to_regprocedure('public.rls_auto_enable()') is not null then
          ${original}
        end if;
      end $optional_dashboard$;`);
      adaptations.push('Guard revoke of optional dashboard-created rls_auto_enable; never manufacture an event trigger');
    }
    if (index === 27) {
      const original = 'alter policy "student_opportunity_states_own"';
      if (!sql.includes(original)) throw new Error('Opportunity policy changed; review adapter.');
      sql = sql.replace(original, 'alter policy "Students manage their own opportunity states"');
      adaptations.push('Alter the actual owner policy created by verified_opportunities; same predicate, no extra policy');
    }
    // Preserve statements; lift top-level transaction wrappers into the single atomic baseline.
    if (/^begin;$/mi.test(sql)) {
      if (!/^commit;$/mi.test(sql)) throw new Error('Unpaired transaction wrapper');
      sql = sql.replace(/^begin;\s*$/mi, '').replace(/^commit;\s*$/mi, '');
      adaptations.push('Lift file transaction into atomic baseline transaction');
    }
    return { id: index + 1, name, dependencies, purpose, sourceHash: hash(source), sql, adaptations };
  });
}

export function buildBaseline(projectRef) {
  if (!/^[a-z]{20}$/.test(projectRef)) throw new Error('Expected owner-confirmed disposable Supabase project reference.');
  const plan = loadPlan();
  // Include compiler policy/grant logic, not just historical sources. A changed
  // compiler must never accept an older ledger as proof of this baseline.
  const checksum = hash(JSON.stringify(plan) + hash(readFileSync(fileURLToPath(import.meta.url))));
  const ledger = JSON.stringify(plan.map(({ sql, ...record }) => record)).replaceAll("'", "''");
  const tables = [...new Set(plan.flatMap(({sql}) => [...sql.matchAll(/create table (?:if not exists )?public\.(\w+)/gi)].map(match => match[1])))];
  return `-- STAGING ONLY. Review docs/STAGING_MIGRATION_AUDIT.md before execution.
-- This project reference is an owner assertion, NOT automatic server identity verification.
begin;
set local lock_timeout = '5s';
select pg_advisory_xact_lock(730113108);
do $baseline$
declare previous_hash text; previous_ref text;
begin
  if current_setting('pathpilot.confirm_disposable', true) is distinct from '${projectRef}' then
    raise exception 'Owner must confirm disposable project using session setting';
  end if;
  if to_regclass('auth.users') is null or to_regprocedure('auth.uid()') is null or to_regprocedure('auth.role()') is null then
    raise exception 'Supabase Auth prerequisites missing';
  end if;
  if to_regclass('pathpilot_staging.baseline') is not null then
    execute 'select checksum, project_ref from pathpilot_staging.baseline where singleton' into previous_hash, previous_ref;
    if previous_hash is distinct from '${checksum}' or previous_ref is distinct from '${projectRef}' then
      raise exception 'Baseline fingerprint/target changed: manual forward reconciliation required';
    end if;
    raise notice 'Matching baseline already initialized; no migrations replayed';
    return;
  end if;
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p'))
    or exists(select 1 from auth.users) then
    raise exception 'Initialization requires an empty disposable project: existing tables/users found';
  end if;
  execute 'create schema if not exists extensions';
  execute 'create extension if not exists pgcrypto with schema extensions';
  if not exists(select 1 from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='pgcrypto' and n.nspname='extensions') then
    raise exception 'pgcrypto must already be in extensions; do not relocate automatically';
  end if;
${plan.map(entry => `  -- ${entry.id}: ${entry.name} source SHA256 ${entry.sourceHash}\n  execute $migration_${entry.id}$${entry.sql}$migration_${entry.id}$;`).join('\n')}
  -- Explicit staging grants; do not depend on dashboard default privileges.
  grant usage on schema public to anon, authenticated, service_role;
  revoke all on ${tables.map(t => `public.${t}`).join(', ')} from public, anon;
  grant select, insert, update, delete on ${tables.map(t => `public.${t}`).join(', ')} to authenticated, service_role;
  revoke all on public.background_worker_credentials, public.pathpilot_rate_limit_windows, public.pathpilot_rate_limit_leases from authenticated, anon;
  revoke insert, update, delete on public.careers, public.opportunities, public.opportunity_sources from authenticated;
  grant select on public.portfolio_profiles, public.portfolio_projects to anon;
  -- Do not reuse the historical production worker verifier. No scheduler token is
  -- provisioned by this baseline; owner must provision a staging-only token later.
  update public.background_worker_credentials set token_hash=encode(extensions.digest(extensions.gen_random_bytes(32),'sha256'),'hex'), rotated_at=now();
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p') and not c.relrowsecurity) then
    raise exception 'Application table without RLS';
  end if;
  create schema pathpilot_staging;
  revoke all on schema pathpilot_staging from public, anon, authenticated, service_role;
  create table pathpilot_staging.baseline (singleton boolean primary key check(singleton), project_ref text not null, checksum text not null, manifest jsonb not null, initialized_at timestamptz not null default now());
  revoke all on pathpilot_staging.baseline from public, anon, authenticated, service_role;
  insert into pathpilot_staging.baseline values (true, '${projectRef}', '${checksum}', '${ledger}'::jsonb, now());
end $baseline$;
commit;
`;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--sql') process.stdout.write(buildBaseline(process.argv[3] || ''));
  else console.log(JSON.stringify(loadPlan().map(({sql, ...entry}) => entry), null, 2));
}
