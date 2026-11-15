# Production-readiness fixes — November 15, 2026

Scope: three fixes on `main`, starting at `a9550b7b20a3f6167f7325e1dc411f702a70fc62`. No hosted database, real student record, environment variable, deployment or provider request was changed. Local verification is not production certification.

## Root causes and implementation

### 1. Discovery intake consistency

The AI discovery prompt previously serialized only legacy profile fields. Structured fields, preferences, motivations, subjects, pathways and exploration intent were absent. A five-result timestamp cache could continue serving that older prompt's output.

`server/discovery-intake-context.ts` validates intake with the existing schema, bounds legacy lists, omits identity and exact location, and supplies the existing ranker's four starting fields with reasons, cautions and evidence strength. The provider contract, retry loop, quotas and canonical career allowlist remain intact. Alternatives outside starting fields receive an explicit, bounded explanation using actual ranker evidence; this does not prohibit cross-field exploration or claim aptitude. Explanations remain within the 1,000-character response contract.

Private `career_details` JSON now includes `contextVersion: structured-intake-v1`; this uses the existing private storage contract, not a shared catalogue field. Legacy results remain readable. An explicit analysis request regenerates older unversioned results under existing quotas. Current versioned results reuse the existing profile timestamp check. No bulk deletion or forced model calls occur during deployment.

| Collected information | Deterministic recommendations | AI discovery after fix | Mentor (unchanged) |
| --- | --- | --- | --- |
| Legacy interests, skills, career preferences | Existing ranker inputs | Bounded declared answers and reference ranking | Bounded declared answers |
| Activities | Not treated as inferred skill | Self-reported context | Self-reported context |
| Selected fields, work preferences, subjects, training pathways | Existing field/override/interest/pathway inputs | Validated answers and same ranking | Validated answers and same ranking |
| Careers in mind and open/ideas direction | Existing goals adapter | Both explicit answers | Both explicit answers |
| Motivations | Not a salary/lifestyle predictor | Context only, explicitly qualified | Context only |
| Grade, country, education system | Not occupational aptitude | Bounded educational context | Grade/country planning context |
| Exact location, account identity, timestamps | Not ranking dimensions | Not sent | Existing bounded context policy unchanged |

Provider text can still be inaccurate or prompt-injected. Typed references, system instructions and deterministic explanatory notes are safeguards, not a semantic truth guarantee. Real model quality and counselor review remain NOT VERIFIED.

### 2. Atomic roadmap replacement

Previously `createRoadmap` archived plans, inserted a replacement and inserted milestones through separate requests. A milestone failure could leave the old plan archived and a partial new plan active.

The new `replace_roadmap_atomic` RPC performs all three writes in one PostgreSQL transaction and returns its own transaction receipt. It uses `SECURITY INVOKER`, fixed search path, authenticated owner equality and existing RLS. An owner-scoped transaction advisory lock covers both initial creation and replacement; a unique partial index permits only one active plan per owner. The expected active ID is captured before generation/confirmation. A concurrent replacement becomes SQLSTATE `40001`, mapped to a safe refresh/review conflict rather than silently replacing a newer plan. Previous plans and their relationships are archived, not deleted. There is no sequential-request fallback if the RPC is absent.

### 3. Database intake validation

Previously the database checked only JSON object/version. Direct owner-authorized REST writes could persist malformed nested preferences and oversized lists.

Migration `20261115232537_production_readiness.sql` adds immutable validators and three `NOT VALID` checks: structured intake, legacy profile intake fields, and draft payload. Checks enforce known keys, all 12 field IDs, all 11 preference dimensions with values 0/0.5/1, enum lists, array lengths, string types and lengths, optional/null rules, and payload bounds. UTF-16 length counting and ECMAScript trimming match application text lists; grade/location/education draft lengths are untrimmed as in the application schema. SQL NULL intake, version-only partial intake, legacy empty draft `{}`, and nullable country/education remain supported. Drafts permit incomplete answers; application completion still requires the complete-profile schema. Existing user foreign keys and RLS continue enforcing ownership.

The structured payload ceiling is 16,000 bytes and draft ceiling 65,536 bytes, above normalized schema maxima. `NOT VALID` preserves historical rows but checks all new/updated rows. It does **not** guarantee every old record is compatible: an invalid old row must be reviewed before unrelated updates can succeed. No existing records are rewritten. The migration aborts atomically on duplicate active plans, with no automatic archive/delete cleanup.

## Verification evidence

| Check | Actual result |
| --- | --- |
| Full `pnpm test` | PASS: 720 tests, 133 suites; offline configuration retains existing live-test exclusions |
| Focused intake/router/private-persistence/roadmap/baseline suites | PASS: 35 tests across five suites |
| `pnpm check` | PASS |
| `pnpm build`, `pnpm build:vercel` | PASS; existing large-bundle and upstream annotation warnings remain |
| `node scripts/verify-public-html.mjs` after both builds | PASS: 12 public documents and private shell |
| `verify-production-readiness.mjs` / PGlite 0.4.1 | PASS: 64 SQL assertions, including malformed writes, Unicode bounds, rollback after an intermediate insert, owner/anonymous denial, old rows preserved, duplicate-plan preflight and DDL rollback |
| `verify-staging-migrations.mjs` / PGlite | PASS: 36 files, 66 assertions; hashes, deterministic baseline, empty/populated guards, RLS and repeat behavior |
| `verify-security-migrations.mjs` / PGlite | PASS: 50 security assertions, 20 historical definitions |
| `verify-roadmap-concurrency.mjs` / fresh local PostgreSQL 18.6 | PASS: 6 assertions on independent backend connections. Actual advisory-lock wait observed for simultaneous initial creation and replacement; loser receives conflict; one active plan |
| Source/history/browser-build secret scan | PASS: zero findings (not exhaustive security certification) |
| Lint | NOT AVAILABLE: repository has no configured lint command |
| `pnpm audit --prod --audit-level high` | PASS at high threshold; two low-severity advisories remain, no high/critical findings |
| Hosted Supabase/PostgREST/JWT, real AI, production row compatibility | NOT VERIFIED; no hosted writes or credentials used |

SQL tooling is installed outside the repository. CI now runs the three SQL verifiers and real independent-connection test. Reproduce locally with temporary `@electric-sql/pglite@0.4.1` and `embedded-postgres@18.6.0-beta.19`; supply the PGlite module's absolute path to SQL verifiers and the temporary dependency prefix to the concurrency verifier. The latter creates a fresh local cluster bound only to 127.0.0.1:55439, stops it afterward, and retains synthetic files in the OS temporary directory. It never accepts an external database URL.

## Staging and production rollout — owner approval required

1. Confirm target identity, backup/recovery procedures, schema prerequisites (core, drafts, country columns, ownership hardening, intake), and permissions. Do not apply an empty-database baseline to an existing database.
2. On an authorized staging copy, inventory duplicate active plans with `select user_id,count(*) from public.roadmaps where status='active' group by user_id having count(*)>1`. Review any duplicates with the owner; do not discard them to satisfy the index.
3. Apply **only** the new migration to an existing initialized schema, before deploying the new RPC caller. Fresh disposable initialization uses the new deterministic 36-file baseline and already includes this migration.
4. Review incompatible row counts using `not public.discovery_intake_valid(discovery_intake)` and `not public.onboarding_payload_valid(payload)`. For legacy profile fields use the exact `jsonb_build_object` expression from `profile_intake_fields_valid`. Review results privately; do not export student responses into logs.
5. After approved, user-preserving correction of any incompatible records, run `ALTER TABLE public.student_profiles VALIDATE CONSTRAINT discovery_intake_nested_valid`, `... VALIDATE CONSTRAINT profile_intake_fields_valid`, and `ALTER TABLE public.onboarding_drafts VALIDATE CONSTRAINT onboarding_payload_nested_valid`. Do not validate blindly or disable RLS/checks.
6. Execute actual staging JWT/PostgREST ownership, valid/invalid intake and two-browser roadmap concurrency tests. Confirm function grants and schema cache visibility. Test both full and partial onboarding and profile edit restoration.
7. Steven deploys application only after staging passes. No new environment variables. Existing Supabase and AI credentials remain server-side. Verify old results display, explicit analysis regenerates old context versions, and all unrelated features/SEO remain available.

The hosted verifier currently requires a fresh 36-file baseline fingerprint. An existing 35-file staging ledger must not be overwritten to pretend it was initialized with 36 files. Apply the forward migration under authorization and perform independent schema/ownership verification; a reviewed forward-ledger reconciliation or fresh disposable project is required before that full hosted verifier can certify its baseline fingerprint.

### Rollback

No migration deletes or rewrites student rows. Retain additive validators/index/RPC if reverting application code. **Do not restore the old sequential roadmap writer:** the unique index does not make it transactional. If rollout fails, gate roadmap replacement temporarily or forward-fix the caller/RPC; reads remain available. Owner-approved corrective forward migrations can replace validator functions after compatibility analysis. Do not drop constraints, rewrite history, or unarchive plans automatically. No production rollback executed.

## Changed files

- `server/discovery-intake-context.ts`: bounded validated reference context and alternative explanations.
- `server/routers/pathpilot.ts`: provider context, cache version check and captured roadmap expected ID.
- `server/db.ts`: private context-version persistence and single atomic roadmap RPC.
- `supabase/migrations/20261115232537_production_readiness.sql`: validators, constraints, unique index and transaction function.
- `scripts/staging-migrations.mjs`: dependency-aware 36th migration; historical files untouched.
- `scripts/verify-staging-migrations.mjs`: valid draft fixtures, nested rejection, explicit legacy intake migration selection.
- `scripts/verify-hosted-staging.mjs`: fresh-baseline fingerprint, valid taxonomy/draft fixtures, nested rejection checks; NOT executed hosted.
- `scripts/verify-production-readiness.mjs`: local SQL behavior/compatibility/security assertions.
- `scripts/verify-roadmap-concurrency.mjs`: real local independent-connection lock test.
- `tests/discovery-intake-context.test.ts`, `tests/career-discovery-router.test.ts`: complete/partial/missing context, retry privacy, deterministic consistency, alternative bounds and cache versions.
- `tests/private-discovery.test.ts`: private version metadata round trip and readable legacy results.
- `tests/roadmap-failure-audit.test.ts`: RPC transport, safe error/conflict handling and owner session.
- `tests/staging-migrations.test.ts`: complete manifest count and source checksums.
- `.github/workflows/security.yml`: reproducible SQL and concurrency regression gates.
- This document, `docs/PRODUCT_DEPLOYMENT_HANDOFF.md`, `docs/STAGING_MIGRATION_AUDIT.md`, `docs/STAGING_READINESS_REPORT.md`: current evidence, migration strategy and hosted gates.

Remaining unrelated release gates: provider credentials/configuration, production data compatibility, exact hosted PostgreSQL/PostgREST behavior, real opportunity inventory, counselor review, privacy/legal review, and the previously documented dashboard-readiness labeling issue. No claim of FERPA/COPPA compliance or production readiness certification.
