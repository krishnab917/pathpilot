# Staging migration audit

November 4, 2026. Scope: working tree on codex/complete-overview-audiences, HEAD f67a26329c074d1ab0b5427f9a8d4f4bece73fbc. All historical SQL files remain unchanged. Hosted staging initialization was completed in the resumed pass (November 5 UTC); see the evidence below. Production was not queried or modified.

## Hosted execution checkpoint

- Authenticated Supabase CLI 3.0.0 verified `qekwtncqujusgkjeabyp`, named `pathpilot-staging`, in `krishnab917's Org` (`ucxtorsbwsxvfyaemhks`), region `us-west-2`. Project listing separately identifies `PathPilot` as `tivwzzstewybodmwhhxg`. No production SQL/API data operations were performed.
- Before writes: hosted queries returned zero Auth users, zero public tables, no private baseline schema, and no nonplatform tables. `auth.uid()`, `auth.role()` and `extensions.pgcrypto` exist. The user explicitly designated this project disposable.
- Generated SQL SHA-256: `419e641b64487f8d5c084404f0a096c62a3b409442a16e3295ade75ac1585214`. All 35 source hashes match the inventory below. No historical migrations or compiler changes were needed.
- Baseline applied atomically through `supabase db query --remote=qekwtncqujusgkjeabyp --file <reviewed-file> --yes`, with the session confirmation included. Ledger fingerprint: `9d6ac949d97345d533e2cbbf50e35020501f6582c7eea5b63fd0c15c0117d003`; initialized at `2026-11-05 00:32:12.094101+00`. All 35 entries recorded, 26 public tables, zero tables without RLS.
- Identical repeat execution succeeded without changing ledger time/fingerprint. Onboarding has exactly one nullable JSONB column and one validated named constraint. It was not separately reapplied.
- `scripts/verify-hosted-staging.mjs`: 72 hosted assertions passed, plus two successful synthetic-account cleanup checks. Uses real password logins, student JWT PostgREST requests and independent PostgreSQL `authenticated` role checks. Service role is used only for synthetic account creation/deletion, never for ownership-test data requests. No credentials are logged/saved.
- CLI `--read-only` rejects BEGIN/SET syntactically. SQL-role verification instead uses explicitly confirmed `BEGIN READ ONLY ... ROLLBACK`; PostgreSQL enforces read-only execution. An initial verifier run stopped at this mismatch, cleaned both accounts, and was corrected before the passing rerun.
- Supabase security advisor: no ERROR findings; WARN for disabled leaked-password protection. No Auth configuration was changed. Browser/tRPC, email-confirmation flow, nested JSON/size constraints, and full application acceptance remain unverified.

The CLI calls the standalone staging project's main database “production.” This is a Supabase branch label, not permission to target PathPilot production. Every hosted command explicitly targets the staging reference above.

## Strategy and safety boundary

Chosen approach: a **generated, atomic, staging-only baseline** retaining all 35 historical files in explicit dependency order. Raw alphabetical replay fails; a new forward-only migration alone cannot repair a bootstrap that fails before it reaches that migration. Renaming historical timestamps would misrepresent existing migration history. Existing installations need separately reviewed forward reconciliation, not this baseline.

scripts/staging-migrations.mjs is an offline compiler, NOT a database client. It refuses an unreviewed file inventory, invalid dependency order, or malformed project reference. Each original file has a SHA-256 fingerprint. The complete plan AND compiler source form the baseline fingerprint. A private pathpilot_staging.baseline ledger records filenames, dependencies, adaptations, source hashes and project assertion. It does not modify supabase_migrations.schema_migrations or pretend duplicate historical versions were applied by the Supabase CLI.

The SQL requires an explicit session confirmation, existing Supabase Auth functions/table and roles, and pgcrypto in extensions. It never fabricates hosted Auth infrastructure. A first initialization rejects any existing public table or Auth user. A matching ledger makes subsequent initialization a no-op, including after synthetic profiles exist; a changed ledger fingerprint or target fails. A matching ledger is NOT proof against out-of-band schema drift: run schema consistency and ownership tests again before use. Owner confirmation is an assertion, not cryptographic target detection. Independently verify the connection's project in Dashboard before setting it.

The full replay runs under one transaction and advisory lock. File-level BEGIN/COMMIT wrappers are lifted into that transaction. Failure rolls back initialization. Explicit table grants avoid depending on dashboard defaults; anonymous access is removed except for portfolio SELECT governed by publication RLS. Authenticated catalog writes remain revoked. Every public table must have RLS before completion. No service-role credential is read by the compiler.

## Inventory and dependency graph

This table is also the recommended topological execution order. Each predecessor number is a directed edge predecessor → row; transitively satisfied prerequisites are not all repeated. Rows without predecessors still require the platform baseline described below. Exact filenames are the identifiers; duplicate date prefixes are NOT unique migration IDs.

| ID | Historical file | Required predecessor IDs | Purpose |
| --- | --- | --- | --- |
| 1 | 20260813_pathpilot_core.sql | Platform | Core tables, owner policies; requires Supabase Auth and pgcrypto |
| 2 | 20260813_pathpilot_security_remediation.sql | 1 | Catalog/milestone policies; optional dashboard function revoke |
| 3 | 20260813_onboarding_drafts.sql | Platform | Private drafts; requires auth.users |
| 4 | 20260813_project_development_metadata.sql | 1 | Project metadata and project_goals |
| 5 | 20260813_adaptive_simulation_engine.sql | 1 | Adaptive simulation columns/index |
| 6 | 20260813_v11_country_roadmap_recommendations.sql | 1 | Country columns and recommendations |
| 7 | 20260815_roadmap_project_foundation.sql | 1 | Project-to-milestone foreign key/index |
| 8 | 20260816_verified_opportunities.sql | Platform | Sources, opportunities, student states; requires Auth |
| 9 | 20260816_curated_opportunity_catalog.sql | 8 | Category normalization, nullable dates, domain columns |
| 10 | 20260816_opportunity_source_refresh_contract.sql | 8 | Participation constraint; deletes NASA source and related saved states |
| 11 | 20260816_simulation_behavioral_events.sql | 1 | Simulation behavioral events |
| 12 | 20260817_checkpoint14_behavioral_activity_events.sql | Platform | Private activity table; requires Auth |
| 13 | 20260817_checkpoint18_project_roadmap_activity_events.sql | 12 | Expand activity checks |
| 14 | 20260817_checkpoint24_planning_report_share_links.sql | Platform | Private share capabilities; requires Auth |
| 15 | 20260817_checkpoint25_opportunity_discovery.sql | 8, 9 | Search columns/indexes and eight-argument RPC |
| 16 | 20260817_checkpoint25_opportunity_discovery_function_security.sql | 15 | Restrict eight-argument RPC |
| 17 | 20260817_checkpoint25_opportunity_discovery_revoke_anon.sql | 16 | Revoke explicit anon RPC access |
| 18 | 20260817_checkpoint26_opportunity_relevance.sql | 17 | Replace eight-argument RPC with eleven-argument RPC |
| 19 | 20260817_checkpoint27_project_workspace.sql | 1 | Project notes/milestones and ownership |
| 20 | 20260817_checkpoint29_portfolio_publication.sql | 1 | Portfolio tables and initial policies |
| 21 | 20260817_checkpoint29_portfolio_profile_visibility.sql | 20 | Narrow public portfolio visibility |
| 22 | 20260817_checkpoint31_simulation_response_timing.sql | 1 | Optional timing columns |
| 23 | 20260818_checkpoint36_ai_result_cache.sql | 1 | Private project AI cache |
| 24 | 20260818_checkpoint37_derived_analysis_jobs.sql | Platform | Private queue; requires Auth |
| 25 | 20260818_checkpoint37_worker_credential.sql | Platform | Service-only worker verifier; UPSERT overwrites verifier |
| 26 | 20260818_checkpoint37_worker_processor_rpc.sql | 5, 24, 25 | Worker function; requires extensions.pgcrypto |
| 27 | 20260818_checkpoint37_worker_rpc_private.sql | 26 | Restrict worker RPC and credential policy |
| 28 | 20260818_checkpoint39_security_performance.sql | 2, 3, 4, 6, 7, 8, 12, 14, 19, 20, 23, 24 | FK indexes and owner-policy alterations; policy-name adaptation |
| 29 | 20260818_checkpoint39_portfolio_policy_optimization.sql | 21, 28 | Replace portfolio owner policies with command-specific policies |
| 30 | 20260827_checkpoint65_shared_ai_rate_limits.sql | Platform | Service-only quota state and RPCs |
| 31 | 20260901_prelaunch_hardening_rpc_safety.sql | 26, 27 | Qualified worker digest; service-only access |
| 32 | 20261026_security_abuse_budgets.sql | 30, 31 | Quota actions, hardened RPC search paths and grants |
| 33 | 20261026_security_ownership.sql | 4, 6, 7, 14, 19, 23, 24, 29, 32 | Restrictive target policies, queue trigger and worker replacement |
| 34 | 20261027_private_discovery_details.sql | 32, 33 | Private match details/backfill and owner replacement RPC |
| 35 | 20261031_discovery_intake.sql | 1, 33 | Nullable versioned intake JSON; application validates nested fields |

## Conflicts and resolutions

Duplicate version prefixes: 20260813 (6 files); 20260816 (4 files); 20260817 (11 files); 20260818 (7 files); 20261026 (2 files). All full filenames are distinct. Do not run ordinary CLI db push on this history or manually mark date-only versions applied.

- Adaptive simulation ALTER precedes core CREATE alphabetically: core first (1 → 5).
- Opportunity category/date/filter/RPC changes require verified opportunity tables and curated columns (8 → 9 → 15). Both eight-argument grant fixes must run before checkpoint26 removes that function (15 → 16 → 17 → 18).
- Portfolio visibility sorts before portfolio creation (20 → 21). Security-performance ALTER POLICY must run before portfolio optimization drops the old policy names (28 → 29).
- Historical security-remediation revokes public.rls_auto_enable(), which source never creates. The compiler guards only that revoke with to_regprocedure. If present it is still revoked; if absent there is no function permission to revoke. It does not invent a dummy function or trigger. RLS is explicitly enabled by the historical table migrations and October ownership remediation.
- Security-performance refers to student_opportunity_states_own, but the actual policy is named Students manage their own opportunity states. Compiler adapts that single ALTER target, retaining the same ownership predicate. It creates no competing policy and silently drops none.
- Worker RPC requires adaptive columns, jobs, credential table and extensions.digest. Both successive hardened replacements are retained. Security budget and ownership changes run after their referenced tables/RPCs.
- Profile country fields precede application use; private career details follows ownership/security; intake follows profile creation. Intake alone cannot initialize an empty database.
- Required policies/functions/triggers execute as authored, except the two explicit name/existence adaptations above. Missing remaining dependencies abort. Locally verified security objects include five restrictive target-owner policies, the queue guard trigger, worker RPC, quota RPCs and private-match replacement RPC.

## Destructive/data-changing operations and production assumptions

- Opportunity refresh contract deletes the nasa-space-apps source, its opportunities and student saved states. It is included, not skipped. Fresh-target guards ensure no existing student data reaches this replay. Never use this baseline to upgrade a populated installation.
- Curated catalog rewrites category values and replaces constraints. Country/activity/participation/quota migrations replace CHECK constraints; their compatibility matters on existing data.
- Portfolio and ownership migrations replace policies. They are applied atomically before any staging access; do not expose a half-replayed schema.
- Checkpoint26 drops the old discovery RPC signature. Clients must use the current eleven-argument contract.
- Worker credential UPSERT contains a historical fixed verifier. After replay, the compiler replaces it with a hash of fresh random bytes whose raw value is not retained. No scheduler token is provisioned. This disables reuse of that historical verifier; an owner must separately provision a staging-only worker credential if worker testing is needed. Reinitialization does not rotate it.
- Private-discovery backfill copies existing career display fields into private matches and may fail its bounds on legacy data; no such records exist during fresh initialization. Its runtime replacement RPC deletes only the authenticated owner's matches transactionally.
- Quota RPCs prune expired windows/leases at runtime. Auth foreign keys cascade on deleting a user. These runtime operations are not invoked by baseline compilation.
- No historical migration drops application tables/columns. No production ledger, token, records, default privileges or hosted Auth settings are copied.
- Generated SQL is deterministic; fresh database timestamps/random worker verifier intentionally are not identical across distinct databases. Repeated initialization of the same baseline preserves existing rows.

## Platform prerequisites and owner-run initialization

1. Owner creates a new empty disposable Supabase project, confirms its reference differs from production, and provides authorized database access privately. Existing project permissions cannot be inferred from source. Auth roles/functions and extension support come from Supabase, not our fixtures.
2. Independently inspect project identity, zero Auth users and zero public application tables. The compiler also rejects existing public tables even if empty. Unexpected tables/extensions require review, not deletion.
3. Generate and review the baseline locally: node scripts/staging-migrations.mjs --sql <confirmed-20-letter-project-ref>. Capture output outside Git; record its SHA-256. Generation does not execute SQL. Never enter a database password as this argument.
4. Use an owner-authorized SQL connection to that staging project only. Enable ON_ERROR_STOP when using psql. In the same connection set pathpilot.confirm_disposable to the confirmed project reference, then execute the reviewed generated SQL. Never guess the target from an environment-variable name. Hosted application of this plan is recorded above.
5. Inspect the private ledger and all public tables, columns, constraints, indexes, pg_policies, pg_proc grants/search paths and pg_trigger definitions; compare with the local baseline. Confirm RLS, test A/B ownership through real student JWTs and direct REST, and execute the same reviewed SQL again to verify no changes.
6. Do not run raw intake SQL again after baseline initialization: it is already included and its named constraint is not independently rerunnable. Future changes require an approved forward migration and ledger reconciliation, not regenerating a changed baseline over existing data.

Separate Preview environment names, redirects and owner permissions are documented in DISPOSABLE_STAGING_SETUP.md. No Vercel project/configuration was modified here. Keep production credentials out of staging, preserve confirmation settings, and use synthetic accounts only. Authenticated CLI management access now works for the approved disposable project; no direct PostgreSQL password was required for Management API SQL execution.

## Onboarding validation and trade-offs

The additive nullable JSONB column accepts legacy NULL rows. Isolated SQL verifies byte-equivalent pre-existing profile fields before/after adding the column, valid versioned objects, clearing to NULL, and rejection of arrays/scalars/missing or wrong versions. There is no data rewrite or ownership-policy change in the intake migration.

The CHECK does NOT validate nested preferences or bound payload size. The local verifier deliberately reproduces acceptance of a versioned object with malformed preferences. Strict Zod schemas in shared/discovery-intake.ts validate authenticated application writes, and readIntake rejects invalid shapes on reads. Owner RLS prevents cross-student changes, but does not make direct owner REST writes pass through Zod. Therefore application validation is sufficient only for the application path, not a promise of database-wide nested validity. To require malformed/oversized direct REST rejection, a separately reviewed forward constraint/validator with parity tests and preflight of existing values is needed, or a coordinated write-contract change. This pass does not silently restrict owner REST grants or alter historical validation. This is an open staging acceptance item, not a verified security guarantee.

## Verification and limits

Run node scripts/verify-staging-migrations.mjs /absolute/path/to/@electric-sql/pglite/dist/index.js. Verification tool tested: PGlite 0.5.15 installed only in /private/tmp/pathpilot-staging-sql.AYghXN; no app dependency or lockfile change. The local harness stubs Supabase Auth in memory and switches PostgreSQL roles. It is not JWT, GoTrue, PostgREST, browser, hosted-grant or cross-instance verification. See STAGING_READINESS_REPORT.md for actual results and blockers.

Rollback: compilation creates no database state. Failed initialization rolls back; with psql ON_ERROR_STOP, close or ROLLBACK an aborted session. A successful disposable initialization can be retained for diagnosis; do not drop columns/tables or run reverse migrations to recover production. Resource deletion requires separate owner authorization.

## Source checksums

These hashes identify the reviewed source bytes, not hosted migration state. Recompute with node scripts/staging-migrations.mjs before execution. Compiler changes also change the combined baseline fingerprint.

| ID | Source SHA-256 |
| --- | --- |
| 1 | 1f1299d77f84608e4aeddba65cd0339a698041d9b31c8a4a4b3db4bfbe6c5f59 |
| 2 | 44019f3ea337b116de720ecab54a9b1250272534f9c4cf70fbca44c1b850fc0a |
| 3 | 5baaaf8cb0c03010c226d2f35118baf92f88e5afe25598b1dbf74690169f1f1a |
| 4 | 7a2f40d1268720fdff0344ff7d696bcc372d40c51d684537d927c8aa5c049be5 |
| 5 | a730723faa73ffad52d5dd8fe8d1c889ed194178c4762ed9f7d0d4fd1564c643 |
| 6 | 3a7acd424dcddc9a68d8ce265b032eaec27f5259e678fd28e6fbadefe5b33815 |
| 7 | d940b185149a3f2ee36b07eb32594c5cf97b0aa871b6e37530e82c0bc8bd6d87 |
| 8 | a4dcf358c44938edad33cd2cd286239520be841813968d99c88143d8abe5fb8f |
| 9 | f716aab35f2d2369e4f7f67eb6e49c483c329c57c703c4d2fc863e9cbb2181a1 |
| 10 | 940972bb1f0bfee9ff15aef505af462109a7a115331d53696f09ecfbc5a64e58 |
| 11 | 75123450ee61cf4b81a2de5e990bb29acf663986acae7c326942e840277bdb24 |
| 12 | 9e613a99f77441f7c8ebe8689ec5d41249b1112ed45dcee84d7637c8842ada1a |
| 13 | 528a8f69d83f17a126676e519a01427aa4ed604861f006fc3cb96329a71f9074 |
| 14 | 043bbdf509196fa21f9ce43a2118dcf51c4c896ff12499e96efcb9c87770cc72 |
| 15 | 036feb0ff8c8d26cc00eafeb76d93f3db0b090b8c583753189c524b9b3398e63 |
| 16 | db19b70e0baf13e2a3653cb37c0e25dd3d31fe3ac599cdd2784a2c9e3877fbc0 |
| 17 | 14446159ae596c0f9ddb0cac8f07a2bacea4c85bf80fd0dcd95b95b1daac50c8 |
| 18 | 161682fef7703e1a3f9edab30e9db6d1326f173b0584b21c3aa39c5bd841cef1 |
| 19 | 9d99d453d6c330e46108eff7fd4190b9afa066839c3772dfc78512e27dbda095 |
| 20 | 52e459d8ded32e3c642a6197d604dee1af02b3cf929c25a98b4957fdab99d93e |
| 21 | 2c695cca0fe6407c5ec2d75e665825c49ed44253026167da84cc8b32fe64385d |
| 22 | 0807b48aa1121be32273184ffa6e729ef86d309562e48351173d7e38a5db7f0e |
| 23 | 55bd3b07917b655d43f788707b699636d0c84777e68c1696e3365be386f4d3bf |
| 24 | 7719a5ffc293c92c713d2b293367ccc17f1ff5b4e85a81cbe046b6d49821c3e9 |
| 25 | 2528c0c5df447fdcc8a397115e3e9cb4b4b1a88dfd3ac9b915523708ec2cd2c6 |
| 26 | c46325d4eb247d792cda227850c343c1a9b18bd2d0d4411054e35e56f7ab5c63 |
| 27 | e744a373f4f5431273d671807da7d3bded4be08cae66265541f35b3ef8832dab |
| 28 | ae6bf72fbafa818ec91fc4f0aa62d7a7313bfc7235bd77c4d8d0377394ac793d |
| 29 | 24e342d93762264ecbb4c265b50ac2d0a5651576bed815322d61b998c05322f0 |
| 30 | 195e4b1ab5be3ab52397b9afe7815dc40521bcc38255a870e372acb3817967fc |
| 31 | c9d0bb24ea5c8b72529a4720a00de337084baf4302cafb97845fda6613845cc9 |
| 32 | c2bc22924be8ce5c6c6961e9290baab918cd6836a4ad9392ebd8f7b06c937569 |
| 33 | 01b05eb86068314a65a29e401d1eca65149b97dda831eccaea029bbb98842931 |
| 34 | 46fc340dbef84be0061a918a41a26edd19d2ab663ec15eb3511025b8b90454a4 |
| 35 | 9691549b47b9d046ea1eb22247ac7362809f9ebd423da3b1f2ad47f51474d6c9 |
