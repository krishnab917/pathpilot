# PathPilot — Codex environment Supabase configuration

Goal: point the PathPilot Codex environment at the **existing** Supabase project.
No new project, no migrations, no data changes. Read-only verification only.

## 1. Variables to set in the Codex environment (Secrets)

Set these in the Codex environment's **private secrets** UI (never in `.env.example`,
never committed to git, never with a `VITE_` prefix on the service-role key).

| Variable | Scope | Value |
|---|---|---|
| `VITE_SUPABASE_URL` | Browser (client) | Existing project URL, e.g. `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Browser (client) | Existing project anon/public key |
| `SUPABASE_URL` | Server | Same URL as above (or leave empty — server falls back to `VITE_SUPABASE_URL`) |
| `SUPABASE_ANON_KEY` | Server | Same anon key (or leave empty — falls back to `VITE_SUPABASE_ANON_KEY`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Existing project service-role key — **NEVER** prefix with `VITE_` |

Why the `VITE_` split matters: Vite only inlines `VITE_*` variables into the browser
bundle. The service-role key has no `VITE_` twin, so it can never reach the client. A
production build of this repo was scanned and contains **zero** service-role references.

Additional runtime vars the full app needs (outside Supabase connectivity, set as needed):
`JWT_SECRET`, `LLM_API_KEY`, `LLM_API_BASE_URL`, `LLM_MODEL`.

## 2. Confirm you're pointing at the EXISTING project

The project ref is the subdomain of the URL: `https://<project-ref>.supabase.co`.
Confirm `<project-ref>` matches the existing PathPilot project in the Supabase dashboard.
Do not create a replacement project.

## 3. Read-only connectivity check (safe)

```sh
npx --yes pnpm@10.4.1 db:verify:supabase
```

This performs ONLY: `GET /auth/v1/settings`, a 1-row admin user *list*, and
`select(...).limit(1)` per expected table. It never inserts, updates, deletes,
creates/deletes users, changes schema, or prints secret/row values.

## 4. Read-only schema/RLS inspection (safe)

Run `supabase/read-only-continuity-check.sql` in the existing project's SQL editor.
It is 100% `SELECT`/`WITH` — no DDL/DML. Compare results against
`docs/DATABASE_CONTINUITY_REPORT.md`.

## 5. Do NOT run

- `pnpm db:push` (already hard-disabled in this repo)
- `pnpm db:push:legacy` (targets legacy Drizzle/MySQL)
- `supabase db reset`, replaying `supabase/migrations/*`, drop/truncate
- The RLS integration test suite against production (it creates/deletes temp users)

Only propose a migration if the read-only comparison proves a schema change is
actually required — then report it and wait for explicit approval.

## 6. Auth notes (existing project)

Production Auth URL settings should remain:
- Site URL: `https://pathpilotapp.com`
- Confirmation redirect: `https://pathpilotapp.com/auth`
- Password recovery redirect: `https://pathpilotapp.com/auth/update-password`

Verify auth reachability via the continuity check. Do not create or delete users to test.
