# Disposable onboarding staging setup

November 4, 2026. Updated checkpoint: owner-created Supabase project `pathpilot-staging` (`qekwtncqujusgkjeabyp`, `https://qekwtncqujusgkjeabyp.supabase.co`) is initialized and scoped live ownership/persistence tests pass. See STAGING_READINESS_REPORT.md for evidence. Vercel Preview has NOT been created or configured. Historical findings below describe the original access blocker, now resolved by authenticated CLI access.

**Do not apply the standalone intake SQL below to this initialized project.** The verified 35-migration baseline already includes it. That example is only for a separately reviewed legacy-schema upgrade. For fresh disposable initialization, follow STAGING_MIGRATION_AUDIT.md; never replay historical files alphabetically.

For the pending dedicated Vercel project, both Preview URL variables must be `https://qekwtncqujusgkjeabyp.supabase.co`; keys must come only from this staging project. All Production variables and the existing `pathpilot` Vercel project remain untouched. No credentials have been written into repository files.

## Findings and blockers

- Worktree: `/Users/krishnabalaji/Documents/PathPilot-marketing-review`, branch `codex/complete-overview-audiences`. Preserve all tracked/untracked changes. The requested onboarding code is uncommitted; deploying GitHub main or the existing SEO preview will not deploy it.
- Existing Vercel project: `pathpilot`, ID `prj_MQXYwvfV5lxLjY1RgP5ZLpEIANZF`, team `krishnab917s-projects`. Vite, Node 24.x, latest deployment `BLOCKED`. Preview protection uses Vercel SSO. Do not alter this project or its integration/environment settings.
- The connected external Supabase integration reports `provisioning: false`, `mcp: false`, and selection of all projects. Do not automatically attach it to the new staging project: it could inject an existing database's credentials.
- No installed `supabase`, `vercel`, or `psql` commands were found on PATH. No Supabase management token, test project reference, or disposable flag is configured in the current process. Supabase Dashboard displays sign-in, not an authenticated organization. Vercel connector read access works; provisioning permission was not tested by creating an orphan resource.
- No authenticated Supabase provisioning/database channel is available. Owner sign-in/project provisioning is required before safe automation can continue. Do not send credentials in chat.
- Existing migration filenames are not a replay contract. `DEVELOPMENT.md` explicitly documents duplicate date prefixes and dependency-order issues. Do not run `supabase db push`, alphabetical SQL replay, `pnpm db:push`, or the legacy MySQL migration command against this project.

## 1. Create the disposable database (owner action)

1. Sign into Supabase Dashboard in the intended organization. Create a **new empty project**, suggested name `pathpilot-onboarding-staging`. Choose the organization, region and acceptable plan explicitly; stop for owner approval if a purchase or extra charge is required.
2. Record its project reference and HTTPS project origin. Confirm that reference is different from production with the owner. Do not clone production records, auth users, storage, secrets, backups, or integrations.
3. Store its database password and staging API credentials in an approved password manager. Supply scoped access through a secure local credential mechanism or authenticated dashboard, not pasted logs/chat.
4. Mark it disposable in the environment inventory. Only synthetic accounts/data may be created. No production service-role key, provider key, worker scheduler, analytics endpoint or notification webhook may be reused.

## 2. Establish the schema before applying the intake migration

**Schema reconciliation is a required gate, not an automatic command in this runbook.** A reviewer must assemble a dependency-ordered schema baseline from the repository SQL and validate it on the new project. The isolated fixture ordering in `scripts/verify-security-migrations.mjs` is useful evidence, but is deliberately incomplete and mocks Supabase internals; do not run that fixture bootstrap against hosted Supabase.

At minimum, inspect `student_profiles`, `onboarding_drafts`, country-context columns, owner RLS, grants, and the distributed quota tables/RPCs required by the current server middleware. The complete application also requires its roadmap, simulation, discovery, project and other migrations; do not mark the deployment fully functional with only two tables. Preserve historical source filenames; record the reconciled baseline and applied migrations explicitly instead of blindly repairing a migration ledger.

Use the staging SQL editor/read-only connection to run `supabase/read-only-continuity-check.sql` and inspect:

```sql
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('student_profiles', 'onboarding_drafts')
order by table_name, ordinal_position;
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('student_profiles', 'onboarding_drafts');
select relname, relrowsecurity
from pg_class where oid in
  ('public.student_profiles'::regclass, 'public.onboarding_drafts'::regclass);
```

Stop if tables/policies are missing or project identity is uncertain. Never disable RLS. Check the migration ledger as well as actual schema: absent local tracking does not prove SQL was never applied.

### Apply only the additive intake migration

Once the baseline is reviewed and project confirmed disposable, check whether `discovery_intake` and `student_profiles_discovery_intake_object` already exist. Do not rerun the named CHECK blindly. Existing non-NULL intake values, if any, must satisfy it; inspect synthetic data before execution.

For an authorized **staging-only** psql session using securely configured connection credentials, the following transaction verifies preservation. This is not a shell command containing a password. Use `ON_ERROR_STOP` and stop on any error.

```sql
\set ON_ERROR_STOP on
begin;
set local lock_timeout = '5s';
create temporary table intake_before on commit drop as
select id, to_jsonb(p) - 'discovery_intake' as original
from public.student_profiles p;
\i /Users/krishnabalaji/Documents/PathPilot-marketing-review/supabase/migrations/20261031_discovery_intake.sql
do $$ begin
  if exists (
    select 1 from intake_before b
    full join public.student_profiles p on p.id = b.id
    where b.id is null or p.id is null
      or b.original is distinct from (to_jsonb(p) - 'discovery_intake')
  ) then raise exception 'Existing profile data changed'; end if;
end $$;
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'student_profiles'
  and column_name = 'discovery_intake';
select conname, convalidated, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.student_profiles'::regclass
  and conname = 'student_profiles_discovery_intake_object';
-- Expected: jsonb, YES; validated object/version CHECK.
-- Inspect results before committing. If unexpected, ROLLBACK instead.
commit;
```

Create synthetic legacy profiles before this test to make preservation meaningful; a fresh empty table only proves an empty-table migration. The CHECK validates outer object/version, not every nested preference field. Strict application schemas are a separate boundary; direct REST malformed-input behavior remains a staging security test.

## 3. Create a separate Vercel project and Preview configuration

After database setup, create a new Vercel project, suggested `pathpilot-onboarding-staging`, under the approved team. Do not reuse or edit `pathpilot`. Do not connect Git auto-deployment, production domains, or existing Supabase integration auto-sync. Verify no team/shared integration variables inject production values.

Use repository settings: Vite; Node 24.x; install `npx --yes pnpm@10.34.9 install --frozen-lockfile`; build `npx --yes pnpm@10.34.9 build:vercel`; output `dist/public`. Retain `vercel.json` API rewrites, function settings and security headers. Keep preview deployment protection enabled; authorized reviewers must sign in through it.

Configure **Preview only** in this dedicated project:

| Variable | Staging value/source |
| --- | --- |
| `VITE_SUPABASE_URL` | New staging project HTTPS origin |
| `SUPABASE_URL` | Exactly the same staging origin |
| `VITE_SUPABASE_ANON_KEY` | Staging public anon credential, intentionally browser-visible |
| `SUPABASE_ANON_KEY` | Same staging public credential for user-scoped server requests |
| `SUPABASE_SERVICE_ROLE_KEY` | New staging server-only service credential; never VITE-prefixed |
| `JWT_SECRET` | Independently generated random secret of at least 32 bytes, shared across staging instances; never copied from production |

Leave `NEXT_PUBLIC_SUPABASE_*` unset to avoid competing fallback origins. Do not add production LLM credentials. This onboarding/ranking flow is deterministic and does not require a model call. Leave analytics, notification webhooks and external worker schedules unconfigured. Do not set `VITEST=true` or force `NODE_ENV=development` on the hosted app to bypass protections.

Environment distinction is configuration-driven: Vite embeds `VITE_*` at build time; server Supabase resolution prefers `SUPABASE_*`, then legacy `NEXT_PUBLIC_*`, then Vite names. Vercel Preview sets `VERCEL_ENV=preview`, which prerendering uses for noindex. Production-mode server safeguards still apply on Preview. There is no automatic database isolation merely because a deployment URL says preview.

## 4. Upload the current reviewed worktree as Preview

Install an approved pinned Vercel CLI, authenticate, then explicitly link only the dedicated staging project. No Git commit/push is necessary for a local-source deployment. First review the complete upload set: include intended untracked source and migrations; exclude `.env*` credentials, caches, auth state, local fixtures/review assets, logs and unrelated files. Record a source manifest/hash because HEAD alone does not identify uncommitted code. Do not run broad Git cleanup commands.

From the current worktree, after provisioning and reviewing targets:

```sh
vercel link --scope krishnab917s-projects --project pathpilot-onboarding-staging
vercel project inspect --non-interactive
# STOP unless the resolved project is the new disposable staging project.
vercel deploy --target=preview --scope krishnab917s-projects
```

Do not use `--prod`, `promote`, or a Git-backed deployment of an old commit. Do not copy the previous local build: it predates staging environment injection. Record the returned deployment ID/URL, confirm READY and Preview target, and verify browser/server database origins independently before testing writes. If the deployment is BLOCKED, investigate with the owner rather than disabling protection or modifying production settings.

## 5. Staging authentication and test accounts

In the **new Supabase project only**, configure Site URL to the exact approved preview origin. Add exact `/auth` and `/auth/update-password` redirect URLs on that origin. The app derives these paths from the current browser origin. Update the staging allowlist when the preview hostname changes; do not allow production URLs or broad unrelated wildcards.

Keep email/password authentication and confirmation/security settings intact. Create two synthetic users through authorized staging admin provisioning, or use two owner-controlled test inboxes for normal signup/confirmation. Do not disable confirmation merely to make tests pass. Store passwords securely and use separate browser sessions. Test student requests with anon/public keys plus each user's own access token; never with service-role tokens.

For local live-test processes only, privately configure `RUN_SUPABASE_INTEGRATION=1`, `SUPABASE_TEST_DISPOSABLE=1`, and the exact `SUPABASE_TEST_PROJECT_REF`, with both Supabase URL variables pointing at that project. Do not set these flags on production. Existing live suites can create/delete test records; review their scope before running.

## Acceptance and rollback

Record staging URL, deployment ID, project ref, schema/migration result, auth redirect configuration, and A/B isolation evidence in `docs/ONBOARDING_LIVE_VERIFICATION.md`. Verify saves, refresh/new login, clearing preferences, malformed payloads, anonymous access, cross-account reads/writes, and direct REST RLS. Check network origins and preview noindex. Do not declare isolation from configuration alone.

If application validation fails, stop test traffic and retain the staging data/nullable column for diagnosis. Do not drop production columns, change production keys, or reset production. Cleanup of the disposable resources is a separate explicit action.

Official references: [Vercel deployment CLI](https://vercel.com/docs/cli/deploy), [Vercel environment scoping](https://vercel.com/docs/environment-variables), [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [Supabase migration workflow](https://supabase.com/docs/guides/deployment/database-migrations).
