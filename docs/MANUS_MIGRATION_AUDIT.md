# Manus independence audit and proposed migration

Audit date: 2026-09-07. Repository: `krishnab917/pathpilot`. Source commit: `a5104b1`. Migration branch: `codex/manus-migration-audit`.

## Status and scope

Audit, local preparation and the approved source-level migration are complete. Manus runtime services were removed from active source, package dependencies and setup documentation. No production database, hosted dashboard, storage contents, scheduler, email flow or live AI provider was accessed. The complete original 401-path inventory is in REPOSITORY_INVENTORY.md. Source inspection covered runtime entry points, routes, auth/data boundaries, integration call sites, config, migration structure, test configuration, static assets and historical setup records. This is not an exhaustive security certification or verification of historical deployment claims.

The available GitHub CLI identity `aayushgrover7` can read this public repository but has no push permission. The GitHub connector reports disconnected. Changes currently exist locally; no remote branch, commit or PR has been published.

## Migration implementation update

Approved source changes now in this branch:

- Removed `vite-plugin-manus-runtime`, the Manus Vite debug collector, `.manus` public debug asset, Manus-specific Vite allowed hosts and unused Forge template wrappers.
- Replaced Forge chat/model calls with a configured OpenAI-compatible chat adapter using `LLM_API_KEY`, `LLM_API_BASE_URL`, `LLM_MODEL` and `OPENAI_*` aliases.
- Replaced owner notifications with an owner-controlled webhook configured by `OWNER_NOTIFICATION_WEBHOOK_URL` and optional `OWNER_NOTIFICATION_WEBHOOK_SECRET`.
- Preserved the historical `/manus-storage/*` URL shape as a compatibility route. It redirects to `STORAGE_PUBLIC_BASE_URL` when migrated objects are hosted there and returns 410 when no compatibility backend is configured.
- Removed stale template snapshot files and unused storage/audio/image/map/data/heartbeat wrappers.
- Moved production startup away from static Vite imports; development middleware loads Vite dynamically.
- Updated README, DEVELOPMENT, ARCHITECTURE, AGENTS and `.env.example` to remove active Forge setup requirements.

Remaining deployment work still requires owner-held accounts and secrets: configure Supabase, choose the live LLM model/provider, provide a notification webhook if that admin endpoint is retained, migrate any historical storage objects, provision scheduler tokens, reconcile Supabase migration history and run live acceptance tests.

## Architecture and repository audit

| Area                   | Verified source findings                                                                                                                                                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend               | React 19, TypeScript, Vite 7, Tailwind 4, Radix/shadcn, Wouter, TanStack Query/tRPC. Lazy routes in App.tsx; workflow pages and domain UI in client/src.                                                                                                  |
| API/backend            | Express 4, tRPC 11, Zod, SuperJSON. Product procedures in server/routers/pathpilot.ts; auth and system routers composed in server/routers.ts.                                                                                                             |
| Middleware/routing     | 50 MB body parsers; Supabase bearer context; protected/admin tRPC middleware; worker POST; storage redirect GET; SPA fallback. Development Vite middleware explicitly allows all hosts.                                                                   |
| Authentication         | Supabase browser sessions and server getUser(token); recovery route and same-origin redirect checks. Legacy cookie logout remains alongside Supabase sign-out. No active Manus OAuth path found.                                                          |
| Authorization          | Request-local user-token client, RLS and ownership filters; app_metadata admin role; bounded service-role catalog/RPC operations. Preserve public portfolio/report and account-deletion boundaries.                                                       |
| Database/schema        | Active Supabase PostgreSQL: 31 SQL files with application tables, policy/grant changes, catalog data, indexes and RPCs. Legacy MySQL Drizzle files remain.                                                                                                |
| Package/build          | ESM package; frozen pnpm lock; Wouter 3.7.1 patch and nanoid override. Vite frontend plus esbuild backend with external packages. Full dependencies currently required for production startup.                                                            |
| Development/production | dev runs tsx watch; start runs built Node entry; PORT defaults to 3000 with fallback scanning. No runtime engines declaration; local Node 22.16 passed checks.                                                                                            |
| Tests                  | 89 files: two in server and 87 in tests. Node Vitest, mostly mocked/unit/source-boundary tests plus three live Supabase files. TypeScript excludes test files. No lint script/config.                                                                     |
| Static assets          | client/public robots and sitemap. Google Fonts external request. No uploaded binary assets checked in; attached_assets alias target absent.                                                                                                               |
| Storage                | Registered `/manus-storage/*` compatibility route now redirects to `STORAGE_PUBLIC_BASE_URL` when configured. No product upload caller or Supabase bucket provisioning found. Existing remote/data URLs require a separate inventory.                     |
| External APIs          | Configured OpenAI-compatible AI provider; optional owner notification webhook; Supabase Auth/data/RPC; opportunity source fetches in server/opportunities and refresh scripts; Google Fonts; configurable Umami analytics.                                |
| Jobs/cron              | Derived-analysis database queue with POST worker and token-hash verification. Heartbeat API helper exists but no caller found. No checked-in trigger/cron deployment definition. Four scripts include three catalog refreshes and a rate-limit benchmark. |
| Error/logging          | UI ErrorBoundary; tRPC errors and repository error normalization; console logging. Worker/storage/provider logs can include raw upstream errors and still need redaction review.                                                                          |
| Deployment/Docker/CI   | No Dockerfile, compose file, CI workflow, hosting manifest or supabase/config.toml. Existing production-domain notes are historical evidence, not live verification. No Python runtime/config.                                                            |
| Git/config             | Clean upstream checkout; branch created locally. No tracked .env files. Existing ignore rules missed arbitrary .env variants; expanded exclusions and explicitly allowed .env.example.                                                                    |
| Documentation          | ARCHITECTURE.md incorrectly described OAuth/MySQL. SUPABASE_INTEGRATION.md incorrectly says service-role credentials are not required; marked historical. Checkpoint files retained as evidence.                                                          |

## Every identified Manus integration group

| Dependency / location                                                                  | Purpose and current reachability                                                | Required? Can remove? Replacement and migration         |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| vite-plugin-manus-runtime; package.json, lockfile, vite.config.ts                      | Platform build/runtime integration, loaded in Vite config                       | Removed after approval                                  | Dependency, import and lockfile entries removed; dev and production builds must verify no injected platform code remains.                                                                                    |
| vitePluginManusDebugCollector; client/public/**manus**/debug-collector.js; .manus-logs | Dev browser console/network/session collection                                  | Removed after approval                                  | Collector plugin and public asset removed. `.manus-logs` remains ignored so old local artifacts are not committed.                                                                                           |
| Manus allowedHosts in vite.config.ts; allowedHosts:true in server/\_core/vite.ts       | Sandbox host assumptions                                                        | Replaced after approval                                 | Development host allowlist now defaults to localhost/127.0.0.1 and can be configured with `VITE_ALLOWED_HOSTS` or `ALLOWED_HOSTS`.                                                                           |
| server/\_core/llm.ts, ENV Forge variables, server/routers/pathpilot.ts                 | Chat/model discovery for career analysis, roadmaps, mentor and project guidance | Replaced after approval                                 | Direct OpenAI-compatible adapter configured by `LLM_*` / `OPENAI_*`; structured validation, retries, caching and rate limits remain. Live provider contract testing is still required with real credentials. |
| server/\_core/notification.ts and systemRouter.notifyOwner                             | Admin-only owner notifications through Forge                                    | Replaced after approval                                 | Endpoint now posts `{ title, content }` to `OWNER_NOTIFICATION_WEBHOOK_URL`; without configuration it errors instead of pretending success.                                                                  |
| server/storage.ts and server/\_core/storageProxy.ts                                    | Forge presigned upload helpers and /manus-storage redirects                     | Replaced after approval                                 | Unused upload helper removed. Compatibility route redirects old keys to `STORAGE_PUBLIC_BASE_URL` after object migration, or returns 410 when not configured.                                                |
| server/\_core/heartbeat.ts                                                             | Forge job CRUD, x-manus-user-session header                                     | Removed after approval                                  | Unused helper removed. Actual external worker schedule still must be recreated on the chosen host.                                                                                                           |
| server/\_core/dataApi.ts, map.ts, voiceTranscription.ts, imageGeneration.ts            | Forge data/maps/audio/image wrappers                                            | Removed after approval                                  | Unused template wrappers removed. Add direct integrations later only if a real feature needs them.                                                                                                           |
| client/src/components/Map.tsx                                                          | Browser Forge map proxy, butterfly-effect.dev fallback                          | Removed after approval                                  | Unused template component removed.                                                                                                                                                                           |
| client/src/components/ManusDialog.tsx, server/\_core/types/manusTypes.ts               | Template login prompt and types                                                 | Removed after approval                                  | Supabase authentication remains the current auth boundary.                                                                                                                                                   |
| ENV VITE_APP_ID, OAUTH_SERVER_URL, OWNER_OPEN_ID; legacy MySQL tooling                 | Historical Manus app/OAuth/owner configuration and original persistence         | ENV removed from active source; MySQL preserved         | Legacy ENV fields are no longer in `.env.example` or server runtime config. Drizzle/MySQL files are retained as historical database material. JWT_SECRET remains active for rate limits.                     |
| client/index.html VITE*ANALYTICS*\*                                                    | Injected Umami script; endpoint deployment-provided                             | Optional analytics, not proof of a Manus-owned endpoint | Confirm analytics ownership; make script conditional and configure independent analytics if retained.                                                                                                        |
| Historical \*.md links, template.json, .gitignore references                           | Past Manus hosts, checkpoint links and scaffold metadata                        | Documentary only                                        | Preserve history, mark superseded setup instructions. Update active setup docs; do not blindly replace every occurrence of “Manus”.                                                                          |

## Concrete migration plan for approval

### MUST CHANGE

1. Retain React/Express/tRPC and the existing Supabase project where the owner has access. Confirm independent access to Supabase and export/backup before any hosting change. A new database is only needed if ownership/access requires it.
2. Replace active Forge AI with a configured direct provider; propose an OpenAI-compatible adapter with an explicitly selected model, preserving existing schemas and four AI workflows. Current model discovery prefers gpt-5-mini then takes the first listed model; this fallback needs deterministic replacement. The final provider/model must support the actual request/response contracts, not just the same endpoint path.
3. Completed: removed Manus Vite runtime/debug integration, replaced host restrictions and separated development Vite imports from production serving.
4. Completed source change: owner notifications use a webhook and historical asset URLs use `STORAGE_PUBLIC_BASE_URL`; live delivery/object migration still requires owner configuration.
5. Establish a reproducible Supabase bootstrap and migration history reconciliation. Keep all original migrations unchanged; verify a fresh disposable instance before touching existing data.
6. Make tests reproducible: explicit offline defaults/mocks and a separately invoked live Supabase suite. Do not hide integration failures or silently report skipped tests as success.
7. Configure independent Node hosting, public build-time and private runtime environment, TLS, domain routing, Supabase redirect URLs, and the derived-analysis trigger. Confirm the worker credential matches its stored hash and rotate it when transferring scheduler ownership.
8. Perform acceptance tests: sign-up/confirmation/recovery, existing-user data continuity, onboarding, five career matches, simulations, roadmap/project/mentor flows, opportunities, portfolio/report access controls, queue completion, and account deletion on disposable test accounts.

### SHOULD CHANGE

- Pin/document supported Node, resolve duplicate pnpm version declarations, add CI for offline tests/typecheck/build, and introduce a deliberate lint command separately from whole-repository formatting.
- Make analytics optional; verify canonical sitemap/robots links for the retained production domain.
- Redact upstream error logs, bound collector removal scope, and add a meaningful readiness check. Current auth.me HTTP success alone is not readiness.
- Configure catalog refresh operations and verify external source availability. Document actual schedule/cadence rather than guessing one from the repository.

### OPTIONAL

- Remove unused template wrappers and obsolete packages only after import/reference verification and approval.
- Add Docker or alternative deployment packaging if the selected host benefits from it.
- Consolidate checkpoint documents without losing historical evidence. No UI redesign, framework swap, or schema rewrite is needed for this migration.

## Database recreation and continuity

The active store is PostgreSQL managed through Supabase, not Drizzle/MySQL. Application tables cover student profiles, careers/matches, goals, roadmaps/milestones/recommendations, simulations, conversations/messages, projects/goals/milestones, onboarding drafts, opportunities/sources/student states, behavioral activity, shared reports, public portfolios, AI cache, derived jobs, worker credentials and rate-limit windows/leases. Catalog seed data is embedded in SQL migrations; no standalone seed runner is present. No Supabase storage bucket provisioning is present.

Recreation currently has concrete blockers:

- Multiple SQL files have the same eight-digit date prefix. Do not assume they form a valid uniquely versioned CLI migration history.
- Alphabetical order is incorrect: adaptive_simulation_engine alters simulations before pathpilot_core creates it; portfolio_profile_visibility accesses tables before portfolio_publication creates them; opportunity updates also require earlier table creation.
- Auth schemas/roles and pgcrypto must exist. The latest worker SQL calls extensions.digest, so extension placement matters.
- The worker migration stores a verifier, not its raw scheduler token; a source clone cannot recover the matching token. Create and store a new token privately and update its verifier deliberately.
- Source files do not include hosted Auth/email settings, existing user records, uploaded objects, or external scheduler registration.

Recommended next patch: read the deployed migration ledger and schema with owner access; build an explicit dependency-ordered bootstrap manifest or reconciled baseline for new instances while preserving originals; verify replay in a disposable Supabase project with RLS/integration tests; document forward-only changes for existing instances. If keeping the existing owner-controlled Supabase project, migrate application hosting independently and verify data continuity without replaying migrations. If moving projects, separately migrate Auth users, application data and any objects using a rehearsed backup/restore procedure.

**No verified Supabase migration command exists in this checkout yet.** The existing `npx --yes pnpm@10.4.1 db:push` generates and migrates MySQL and is not a substitute. No database migration or live connectivity claim is made by this audit.

## Verification results

- Frozen install: passed with pnpm 10.4.1; 777 packages. pnpm reported ignored esbuild/oxide build scripts, but available platform packages built successfully without changing lifecycle approvals.
- Type checking: `npx --yes pnpm@10.4.1 check` passed.
- Production build: passed. Warnings include missing VITE_ANALYTICS_ENDPOINT / VITE_ANALYTICS_WEBSITE_ID, non-module analytics script, and large chunks.
- Default tests: 85 files passed, 4 failed; 281 assertions passed and 2 failed. Two suites could not collect. Failures: public Supabase config, service-role config, RLS client initialization, and opportunity-search-performance importing an unconfigured browser client.
- Isolated offline run: 86 files / 285 tests passed using the exact DEVELOPMENT.md command with synthetic public values, excluding the three live Supabase integration files. This verifies offline behavior, not live database or AI.
- Dev and production servers: both started on dedicated local ports. `/`, `/auth`, `/robots.txt`, and `/api/trpc/auth.me` returned HTTP 200. Browser application functionality was not verified: real public Supabase configuration is absent, and the browser client throws without it.
- Lint: not available; repository has no lint command/config. Documentation formatting and git diff whitespace are checked separately.
- Database, real authentication/email, provider calls, storage content, scheduler completion and remote deployment: unverified because credentials/host access were not available.

## Files and Git safety

Created: README.md, DEVELOPMENT.md, AGENTS.md, .env.example, docs/MANUS_MIGRATION_AUDIT.md, docs/REPOSITORY_INVENTORY.md.

Modified: ARCHITECTURE.md (current auth/database and migrated architecture), SUPABASE_INTEGRATION.md (historical notice), .gitignore (exclude environment variants, old Manus logs, private-key files and local Supabase state), package metadata, Vite config, server runtime config, LLM adapter, notification helper, storage compatibility route, development Vite loader, and a few tests/comments with stale sample host or login-method text.

Deleted: unused Manus/Forge template helpers and static collector files: client/public/**manus**/debug-collector.js, client/src/components/ManusDialog.tsx, client/src/components/Map.tsx, server/storage.ts, server/\_core/dataApi.ts, server/\_core/heartbeat.ts, server/\_core/imageGeneration.ts, server/\_core/map.ts, server/\_core/types/manusTypes.ts, server/\_core/voiceTranscription.ts and template.json. Original migrations, checkpoint records, Drizzle/MySQL history and Supabase SQL files are preserved.

No credential values were added. A targeted scan of tracked files found no private-key blocks, GitHub tokens, provider-key patterns or JWT-shaped credentials; no .env file was tracked. This pattern scan is not a complete repository/history secret audit. Before committing or pushing, review staged paths/diff and recheck secret exclusions; do not force-push or delete branches.

## Required owner actions and remaining risks

Provide repository write access through an authorized GitHub identity, plus independent access to Supabase and chosen provider/hosting accounts. Enter secrets privately in the local/host environment, not in a chat or commit. Configure notification delivery if retaining that endpoint and confirm whether existing storage objects/URLs need preservation. Confirm the current database project and external scheduler configuration.

Required active configuration names are VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, LLM_API_KEY and the selected LLM model/base URL configuration. SUPABASE_URL / SUPABASE_ANON_KEY may explicitly mirror the public project values; remove empty aliases if relying on fallback. Configure OWNER_NOTIFICATION_WEBHOOK_URL if retaining admin owner notifications, and STORAGE_PUBLIC_BASE_URL after migrating historical objects. The complete variable inventory and exact current install/dev/build/test/typecheck commands are in DEVELOPMENT.md.

Remaining risks: provider protocol/schema differences, lost historical asset links, missing worker schedule/token, invalid migration ordering, hosted Auth redirect/email settings, service-role access, public variables omitted at build time, and incomplete live acceptance tests. The application is source-migrated but not certified for hosted cutover.
