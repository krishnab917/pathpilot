# Development reference

## Toolchain and commands

Use Node 22.16+ and pnpm 10.34.9. The October security pass updates the package-manager pin and its published tarball integrity within pnpm 10, retaining the lockfile and Wouter patch. Use the exact launcher below.

```sh
npx --yes pnpm@10.34.9 install --frozen-lockfile
cp .env.example .env
# Fill configuration privately, then:
npx --yes pnpm@10.34.9 dev
npx --yes pnpm@10.34.9 check
npx --yes pnpm@10.34.9 build
npx --yes pnpm@10.34.9 start
```

Run from the repository root. Express loads `.env` through `dotenv/config`. Vite uses the root env directory. Runtime-only Supabase variables cannot supply missing VITE variables to an already-built browser bundle: rebuild after changing public configuration.

## Environment inventory

`.env.example` contains names with empty assignments, no credentials. Populate needed values privately. Empty Supabase placeholders are treated as missing by the server, so `SUPABASE_URL=` and `SUPABASE_ANON_KEY=` no longer block fallback to `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

| Name                              | Component / purpose                                                                 | Required / source                                                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| VITE_SUPABASE_URL                 | Browser Supabase project URL                                                        | Required; chosen Supabase project settings                                                                               |
| VITE_SUPABASE_ANON_KEY            | Browser public API credential                                                       | Required; same project public anon/publishable credential                                                                |
| SUPABASE_URL                      | Server project URL, first preference                                                | Set to same project, or remove assignment to use VITE fallback                                                           |
| SUPABASE_ANON_KEY                 | Server user-scoped public API credential                                            | Set to same project, or remove assignment to use VITE fallback                                                           |
| NEXT_PUBLIC_SUPABASE_URL          | Server URL compatibility fallback                                                   | Optional; same project; this is not a Next.js application                                                                |
| NEXT_PUBLIC_SUPABASE_ANON_KEY     | Server public-key compatibility fallback                                            | Optional; same project                                                                                                   |
| SUPABASE_SERVICE_ROLE_KEY         | Server catalog persistence, privileged RPCs, rate limits, worker; integration tests | Required for complete feature set; Supabase server-only service-role credential                                          |
| JWT_SECRET                        | Server rate-limiter/quota HMAC secret                                               | Required on production/preview and unclassified runtimes: private random value of at least 32 UTF-8 bytes; identical across replicas; not the Supabase login signing key. Never rotate as part of deployment without coordination. |
| LLM_API_KEY                       | Server-only AI provider credential                                                  | Required for career discovery, roadmap generation, mentor chat and project guidance                                      |
| LLM_API_BASE_URL                  | OpenAI-compatible provider base URL                                                 | Optional; defaults to `https://api.openai.com`; may include or omit `/v1`                                                |
| LLM_MODEL                         | Deterministic model used by AI workflows                                            | Optional; defaults to `gpt-5-mini`; set explicitly for the chosen provider                                               |
| OPENAI_API_KEY                    | Compatibility alias for `LLM_API_KEY`                                               | Optional; useful when using OpenAI-compatible providers that standardize on OpenAI naming                                |
| OPENAI_BASE_URL                   | Compatibility alias for `LLM_API_BASE_URL`                                          | Optional; ignored when `LLM_API_BASE_URL` is set                                                                         |
| OPENAI_MODEL                      | Compatibility alias for `LLM_MODEL`                                                 | Optional; ignored when `LLM_MODEL` is set                                                                                |
| OWNER_NOTIFICATION_WEBHOOK_URL    | Admin owner notification endpoint                                                   | Required only if using `system.notifyOwner`; receives `{ title, content }` as JSON                                       |
| OWNER_NOTIFICATION_WEBHOOK_SECRET | Optional bearer secret for owner notification webhook                               | Server-only; sent as `Authorization: Bearer ...` when configured                                                         |
| STORAGE_PUBLIC_BASE_URL           | Public base URL for migrated historical storage objects                             | Optional; `/manus-storage/{key}` redirects here when configured, otherwise returns 410                                   |
| ALLOWED_HOSTS                     | Server-side Vite development host allowlist                                         | Optional comma-separated list for non-local development hosts                                                            |
| VITE_ALLOWED_HOSTS                | Vite development host allowlist                                                     | Optional comma-separated list; takes precedence over `ALLOWED_HOSTS`                                                     |
| PORT                              | Express listening port                                                              | Optional; defaults to 3000; host configuration                                                                           |
| NODE_ENV                          | Runtime mode / Vite collector switch                                                | Scripts set development or production; leave out unless needed                                                           |
| VITE_ANALYTICS_ENDPOINT           | Browser Umami script base URL                                                       | Optional product integration; analytics administrator; currently missing values cause build warnings                     |
| VITE_ANALYTICS_WEBSITE_ID         | Browser analytics site identifier                                                   | Optional product integration; analytics administrator                                                                    |
| DATABASE_URL                      | Legacy Drizzle MySQL CLI                                                            | Not needed by active Supabase runtime; only for a deliberately retained legacy database                                  |
| VITEST                            | Strict isolated-test marker; hosted environments cannot activate the mock limiter   | Set by Vitest; do not set in development or production servers                                                           |

`SUPABASE_KEY` is not a supported variable. `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY`, `VITE_APP_ID`, `OAUTH_SERVER_URL` and `OWNER_OPEN_ID` are not used by the migrated source. The worker token is a request-body value, not an environment variable in current code; it must be provisioned in a scheduler secret store separately.

## Tests and formatting

```sh
npx --yes pnpm@10.34.9 test
```

This runs offline by default. Three live files are excluded: `supabase-config.test.ts`, `supabase-service-role.test.ts`, `supabase-rls.test.ts`. The RLS suite creates and deletes temporary accounts and application rows. To run live tests, explicitly set `RUN_SUPABASE_INTEGRATION=1` and `SUPABASE_TEST_DISPOSABLE=1`, and use a disposable local origin or matching `SUPABASE_TEST_PROJECT_REF`. Both server/browser origins must match. The two credential checks still require a hosted URL; use a designated disposable hosted project for the complete live suite. Never point these tests at production.

For an offline baseline, use public synthetic values; the explicit exclusions below are redundant but remain supported:

```sh
VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=offline-test-placeholder npx --yes pnpm@10.34.9 exec vitest run --exclude tests/supabase-config.test.ts --exclude tests/supabase-service-role.test.ts --exclude tests/supabase-rls.test.ts
```

These values only allow the imported browser client to initialize; they are not working credentials or database validation. See `docs/security-remediation-report.md` for the optional isolated PostgreSQL verification, local-only benchmark settings, environment classification, unresolved findings and deployment prerequisites.

No lint command/configuration exists. `npx --yes pnpm@10.34.9 exec prettier --check README.md DEVELOPMENT.md ARCHITECTURE.md AGENTS.md docs/MANUS_MIGRATION_AUDIT.md docs/REPOSITORY_INVENTORY.md` checks the new documentation's formatting, not application lint. `pnpm format` modifies all files, so avoid it for scoped migration work.

## Database and deployment

The active database is Supabase PostgreSQL, with 31 SQL migration files, Auth schemas, RLS and service RPCs. There is no safe verified one-command replay yet: duplicate date prefixes and incorrect alphabetical ordering must be reconciled against the actual migration history. `pnpm db:push` is intentionally disabled because it targets legacy Drizzle/MySQL. The preserved command is `pnpm db:push:legacy` and should not be used for the active Supabase database.

After configuring the existing Supabase project values outside git, run the read-only continuity check:

```sh
npx --yes pnpm@10.34.9 db:verify:supabase
```

For full schema metadata, run `supabase/read-only-continuity-check.sql` in the existing Supabase project's SQL editor. It reads tables, columns, policies, indexes, functions, triggers and aggregate record counts without modifying data. Record the outcome in `docs/DATABASE_CONTINUITY_REPORT.md`.

For an application host, use a frozen dependency install, build, then start. The production bundle no longer imports Vite unless development middleware is started. Configure TLS, canonical host and Supabase email/recovery redirects for the new host. Transfer DNS only after authenticated smoke tests. Schedule the derived-analysis endpoint with its private token and restore any required opportunity refresh schedule. Neither a scheduler nor hosted database state is recoverable from this repository alone.
