# Staging readiness report

November 4, 2026 (hosted initialization November 5 UTC). Branch `codex/complete-overview-audiences`, HEAD `f67a26329c074d1ab0b5427f9a8d4f4bece73fbc`. The owner-created staging project is now initialized. No commit, push, deployment or production data access/modification occurred.

## Resumed hosted verification — current status

| Check | Status | Actual evidence |
| --- | --- | --- |
| CLI authentication / identity | PASS | Supabase CLI 3.0.0 lists `pathpilot-staging`, ref `qekwtncqujusgkjeabyp`, org `ucxtorsbwsxvfyaemhks` (`krishnab917's Org`), us-west-2. Separate `PathPilot` ref `tivwzzstewybodmwhhxg`; no production queries. |
| Empty-target safety gate | PASS | Before writes: 0 Auth users, 0 public tables, no baseline ledger or nonplatform tables; platform functions and pgcrypto verified. |
| Hosted initialization | PASS | 35-migration baseline applied; 26 public tables; all RLS enabled. Intake included once. Timestamp `2026-11-05 00:32:12.094101+00`. |
| Repeat initialization | PASS | Same generated baseline executed again; ledger checksum/time preserved. |
| Hosted schema/security assertions | PASS (scoped) | Fingerprint, RLS, 5 restrictive policies, queue trigger, 6 required functions, private-table grants, nullable intake and validated constraint checked. Not exhaustive application acceptance. |
| Real A/B Auth and REST isolation | PASS | Both directions: own reads/writes; cross SELECT/PATCH/DELETE return no rows; forged INSERT and reassignment rejected with 42501; anonymous reads rejected. |
| Independent SQL RLS | PASS (scoped) | `authenticated` role and per-account claims in explicit READ ONLY transactions see only their respective rows in both profiles and drafts. Complements real JWT REST tests. |
| Hosted onboarding persistence | PASS (data layer) | Draft stage/payload restored after token refresh. Profile preferences and cleared training pathway restored after logout/new password login; legacy fields retained. |
| Invalid outer intake | PASS | Array, missing version and wrong version rejected with CHECK error 23514 for both accounts. Nested/oversized owner writes remain a known DB validation gap. |
| Synthetic cleanup | PASS | Both test accounts signed out and removed after each run; final database counts checked separately. No real student data used. |
| Security advisor | PASS with warning | No ERROR findings; leaked-password protection disabled (WARN). Owner must evaluate/enable if supported; settings not altered. |
| Browser / deployed tRPC / email flow | BLOCKED | No approved preview serving current uncommitted onboarding code. Data-layer tests do not verify browser rendering, request validation, save retries or callbacks. |
| Vercel Preview | NOT STARTED (hosted) | Preview-only runbook prepared; no Vercel project/env/settings/deployment changed. |

New reusable verifier: `SUPABASE_TEST_PROJECT_REF=qekwtncqujusgkjeabyp SUPABASE_TEST_DISPOSABLE=1 node scripts/verify-hosted-staging.mjs`. Requires authenticated CLI with project/key/database access; captures keys in memory, never logs them. Creates/removes synthetic accounts only. Latest run: **72 hosted assertions plus 2 cleanup checks passed**, exit 0. Initial run failed at CLI rejecting transaction-control statements under `--read-only`; both accounts were cleaned up. Corrected SQL-role check uses PostgreSQL `BEGIN READ ONLY` with explicit CLI confirmation; rerun passed.

This resume also reran 66 isolated SQL assertions, 11 focused tests across 3 suites, all 35 source checksum checks, JS syntax and diff whitespace checks. Source secret scan: 534 files, zero findings (history/build output not rescanned). Final hosted cleanup query: 0 Auth users, 0 profiles, 0 drafts; 26 public tables and 35 policies retained. Full offline suite/type-check/build results below are the previous local checkpoint, **not rerun in this hosted-only pass**. No application or historical migration code changed.

Files changed in this hosted resume only: new `scripts/verify-hosted-staging.mjs`; updates to `docs/STAGING_MIGRATION_AUDIT.md`, `docs/STAGING_READINESS_REPORT.md`, and `docs/DISPOSABLE_STAGING_SETUP.md`. All earlier dirty-tree changes remain intact and unstaged. No credentials, environment files or production settings were edited.

## Prior local checkpoint (historical; hosted blockers superseded above)

| Deliverable | Status | Actual evidence / remaining gate |
| --- | --- | --- |
| Migration inventory | PASS | All 35 source SQL files accounted for exactly once; inventory mismatches fail compilation. |
| Migration dependency graph | PASS | Complete numbered adjacency table and execution order in STAGING_MIGRATION_AUDIT.md; dependencies checked before compilation. |
| Migration conflicts resolved | PASS (local) | Explicit optional-function revoke and actual policy-name adaptations; ordering corrected without editing historical SQL. All 35 execute locally. Hosted behavior remains BLOCKED. |
| Baseline strategy | PASS (local) | Offline compiler, atomic SQL, explicit confirmation, fresh-target guard, private checksum ledger. Not a production upgrade or automatic Supabase CLI replay. |
| Source checksums | PASS | Focused tests independently hash each original file; audit records hashes. Compiler bytes also contribute to the baseline fingerprint. |
| Deterministic generation | PASS | Two independent CLI generations compared equal with `cmp`; SHA-256 `1a325a6c27b7383011cee1d1c90719f1e7b885ec282f7b956876a573094554dc` for the fictional test reference. Real references produce different output. |
| Empty-database initialization | PASS (isolated) | Full baseline executed with in-memory Supabase platform stubs and PGlite 0.5.15. |
| Populated-database rejection | PASS (isolated) | Existing public-table row and existing Auth user tested separately; initialization rejected, existing values retained, no baseline ledger created. |
| Missing prerequisites / confirmation | PASS (isolated) | Missing Auth platform and missing disposable confirmation rejected. |
| Repeat initialization | PASS (isolated) | Same schema snapshot and profile rows after repeat; changed target and stale fingerprint rejected. |
| Onboarding migration validated | PASS (outer schema only) | Nullable legacy rows, object/version rejection, clearing, profile preservation verified. Nested malformed owner writes are still accepted at DB level; see limitations. |
| Security-object retention | PASS (isolated) | All public tables have RLS; five restrictive ownership policies, queue guard trigger and six required security RPC/functions checked. Full historical SQL is executed, not just parsed. |
| Staging configuration prepared | PASS (instructions) | DISPOSABLE_STAGING_SETUP.md specifies separate project, Preview-only variables, exact callback paths and synthetic accounts. No settings applied. |
| Supabase staging provisioned | BLOCKED | No owner-authorized disposable project reference/management access. No staging URL or project has been created. |
| Hosted schema initialized | BLOCKED | Requires confirmed separate disposable project and authorized database connection. |
| Hosted RLS verified | BLOCKED | Local PostgreSQL role tests are not Supabase JWT/PostgREST or live RLS evidence. |
| Two hosted test accounts created | BLOCKED | Requires staging Auth access/owner-controlled synthetic accounts. Local UUID fixtures are not authenticated hosted accounts. |
| Hosted ownership tests executed | BLOCKED | Real A/B login, direct REST, anonymous and forged-ID requests require staging configuration. |
| Local ownership tests | PASS | Cross SELECT/UPDATE/INSERT/DELETE and owner-ID reassignment checked in both directions with both fixture records present; anonymous profile/draft access rejected. |
| Focused staging tests | PASS | 4 tests in 1 suite. |
| SQL verification | PASS | 35 migrations, 66 assertions, exit 0. |
| Full offline regression suite | PASS | Final rerun: 675 tests across 125 suites; zero failures. Live suites remain excluded. |
| Type-check | PASS | Established `pnpm check` completed exit 0. |
| Production build | PASS | Established `pnpm build` completed exit 0; existing >500 kB chunk warning remains. No deployment. |
| Generated public HTML | PASS | 12 public documents plus private shell verified. |
| JS syntax / migration lint | PASS (scoped) | `node --check` both scripts; manifest inventory/dependency validation plus full PostgreSQL execution. No separate SQL-linter package or configured repository lint command. |
| Secret scan | PASS (pattern scan) | 532 source files, 485 built files, history scanned; no findings. Not a guarantee against every possible secret format. |
| Diff whitespace | PASS | `git diff --check` exit 0; historical tracked migration diff empty. |

## Commands and evidence

Run from the marketing-review worktree with the established Node 22 runtime and local pnpm:

```sh
node scripts/verify-staging-migrations.mjs /private/tmp/pathpilot-staging-sql.AYghXN/node_modules/@electric-sql/pglite/dist/index.js
node node_modules/pnpm/bin/pnpm.cjs test tests/staging-migrations.test.ts
node node_modules/pnpm/bin/pnpm.cjs test
node node_modules/pnpm/bin/pnpm.cjs check
node node_modules/pnpm/bin/pnpm.cjs build
node scripts/verify-public-html.mjs
node scripts/security-scan.mjs --history --built
node --check scripts/staging-migrations.mjs
node --check scripts/verify-staging-migrations.mjs
git diff --check
```

Local evidence logs:

- `/private/tmp/pathpilot-staging-sql-verification.log`
- `/private/tmp/pathpilot-staging-regression.log`
- `/private/tmp/pathpilot-staging-build.log`
- `/private/tmp/pathpilot-staging-baseline-a.sql` and `pathpilot-staging-baseline-b.sql` (fictional target; never execute against a host).

Temporary verification tools/logs are not repository dependencies or committed artifacts. PGlite 0.5.15 supplies pgcrypto. The previous attempted 0.3.14 tool lacked that extension; no application package or lockfile was changed to resolve it.

## Defects fixed in this resumed pass

1. The verifier hid the actual local error. It now reports isolated authored/synthetic SQL errors; it never reads credentials or connects to a host.
2. Its final negative test supplied a project reference with invalid length, so the compiler threw before SQL rejection could be tested. The reference now has exactly 20 characters. Final run passes.
3. Cross-account checks originally ran before both records existed. Both records are now inserted under their owner roles first, preventing vacuous cross-account read success.
4. Added real populated-target, missing-platform/confirmation, stale-fingerprint and required-security-object checks.
5. Baseline identity originally covered historical plan only. It now also covers compiler source, including changes to grants and adapters.
6. Explicitly revoke inherited anonymous table privileges before granting only public portfolio reads. Do not rely on a fresh project's default grants.
7. Replace the historical fixed worker verifier during fresh initialization with an unrecoverable random verifier. No inherited scheduler credential is usable; a separate staging-only credential is required for worker tests. Repeat initialization does not rotate it.
8. Escape ledger metadata SQL literals. Source files and source hashes remain unchanged.

The first focused-test attempt encountered sandbox EPERM when Vite needed to write its temporary config. It was rerun through the normal approved execution path and passed; no restriction was bypassed. Initial verifier failures are recorded above and corrected, not counted as passes.

## Remaining limitations / owner actions

- **Remaining live verification:** staging DB and scoped A/B data-layer checks are complete as recorded above. Next prepare a separate Preview deployment of the current source and test actual browser/tRPC onboarding, save failure/retry, email confirmation/recovery and mobile behavior. Do not send secrets in chat or deploy production.
- **Nested validation:** strict application schemas reject invalid nested intake, but direct owner REST writes bypass application validation. The SQL test reproduces acceptance of malformed nested preferences. No database size bound exists for this column. This pass does not claim malformed/oversized direct REST rejection. Decide and review a forward DB validator/bound with compatibility tests before making that guarantee. Reads currently safely reject invalid intake via `readIntake`.
- **Hosted differences:** actual password tokens, GoTrue, PostgREST and scoped ownership/grants now passed hosted tests. Email callbacks, multi-instance quotas, full schema-drift comparison and Vercel Preview remain NOT VERIFIED.
- **Schema drift:** the private ledger prevents replay and source drift, but is not continuous schema-drift detection. Inspect hosted columns/policies/grants/functions/triggers and rerun live ownership checks before enabling test traffic.
- **Migration ledger:** this new-project baseline deliberately does not rewrite Supabase's historical ledger. Future deployments need an agreed forward-only migration workflow; do not run `supabase db push` over duplicate date versions.
- **Worker:** no usable worker token/schedule is provisioned. Owner must generate a distinct staging credential if worker verification is desired. Do not reuse production secrets.
- **Browser tests:** actual UI onboarding, browser refresh/login, save failure/retry, application forged-ID handling and 320px layout remain BLOCKED. Account/data-layer results above do not replace these checks.
- **Vercel-target build:** not rerun in this focused resume; standard production build and generated HTML were verified. Run target build with the approved staging environment before any authorized Preview deployment.

## Files and preservation

This resumed pass changed only:

- `scripts/staging-migrations.mjs`
- `scripts/verify-staging-migrations.mjs`
- `tests/staging-migrations.test.ts`
- `docs/STAGING_MIGRATION_AUDIT.md` (new)
- `docs/STAGING_READINESS_REPORT.md` (new)

All remain untracked/uncommitted alongside the existing accumulated work. The index remains empty. No historical SQL, application code, security/quota implementation, environment secret, package dependency, lockfile, authentication configuration or production data was changed in this pass.
