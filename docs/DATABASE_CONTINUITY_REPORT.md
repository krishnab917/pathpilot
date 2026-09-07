# PathPilot database continuity report

Status date: 2026-09-07.

## Summary

PathPilot is configured in source for the existing Supabase Auth and PostgreSQL architecture. No new Supabase project was created. No database migration was run. No production data was dropped, truncated, recreated, overwritten, seeded, or modified.

The current local environment does not include Supabase credentials, so production database and Auth continuity could not be verified from this checkout. The code-side configuration is ready for the owner-held existing project once its values are supplied outside git.

## DATABASE CONNECTION

- Supabase project detected: not configured locally
- Database reachable: unverified
- Auth reachable: unverified

Required variables for the existing project:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_URL` and `SUPABASE_ANON_KEY` may mirror the public project values. If they are left empty, the server now ignores those empty placeholders and falls back to the matching `VITE_*` values.

## SCHEMA STATUS

The application expects these public tables from the Supabase migration set:

- `student_profiles`
- `onboarding_drafts`
- `careers`
- `career_matches`
- `goals`
- `roadmaps`
- `roadmap_milestones`
- `roadmap_recommendations`
- `simulations`
- `ai_conversations`
- `ai_messages`
- `ai_result_cache`
- `opportunity_sources`
- `opportunities`
- `student_opportunity_states`
- `behavioral_activity_events`
- `planning_report_share_links`
- `projects`
- `project_goals`
- `project_milestones`
- `portfolio_profiles`
- `portfolio_projects`
- `derived_analysis_jobs`
- `background_worker_credentials`
- `pathpilot_rate_limit_windows`
- `pathpilot_rate_limit_leases`

Expected RPCs/functions include:

- `list_discoverable_opportunities`
- `process_next_derived_analysis`
- `consume_pathpilot_rate_limit`
- `acquire_pathpilot_rate_limit_lease`
- `release_pathpilot_rate_limit_lease`

Tables matching: unverified against production.  
Tables missing: unverified against production.  
Columns missing: unverified against production.  
Indexes missing: unverified against production.  
Functions missing: unverified against production.  
Triggers missing: unverified against production.  
RLS policies missing: unverified against production.  
Other discrepancies: migration history/order still requires reconciliation against the existing Supabase migration ledger.

## DATA SAFETY

- Existing users detected: unverified
- Existing application records detected: unverified
- Any destructive operation required: NO

The repository contains live integration tests for Supabase public config, service-role access, and RLS isolation, but the RLS suite creates and deletes temporary users and records. Do not aim it at production.

## CODE CONFIGURED

Yes.

- Browser auth uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `client/src/lib/supabase.ts`.
- tRPC attaches the current Supabase access token from the browser session.
- Server request handling validates bearer tokens through Supabase Auth and creates a request-scoped Supabase client.
- Private product queries use that request-scoped client and preserve RLS.
- Service-role use is server-only and centralized around `SUPABASE_SERVICE_ROLE_KEY`.
- Empty placeholder env values are treated as missing so they do not block public fallback values.
- `db:push` is disabled because it targets legacy Drizzle/MySQL. The old command is available only as `db:push:legacy`.

## DATABASE CONNECTED

No. The local environment has no Supabase URL, anon key, or service-role key configured.

Run the safe REST-based continuity check only after configuring the existing project values outside git:

```sh
npx --yes pnpm@10.4.1 db:verify:supabase
```

For column, policy, index, function, trigger, and record-count metadata, run this read-only SQL file in the existing Supabase project's SQL editor:

```text
supabase/read-only-continuity-check.sql
```

## AUTH VERIFIED

No. Auth settings, existing-user login, session refresh, confirmation URLs, password recovery URLs, and user/profile continuity require access to the existing Supabase project and a controlled owner test account.

Production Auth URL settings that must point at the current production domain:

- Site URL: `https://pathpilotapp.com`
- Redirect URL for confirmation: `https://pathpilotapp.com/auth`
- Redirect URL for password recovery: `https://pathpilotapp.com/auth/update-password`

Local development may use:

- `http://localhost:3000/auth`
- `http://localhost:3000/auth/update-password`

## PRODUCTION DEPLOYMENT VERIFIED

No. No deployment environment variables or Supabase dashboard settings were readable from this checkout.

The production host must set the existing Supabase project's values for:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `LLM_API_KEY`
- `LLM_API_BASE_URL`
- `LLM_MODEL`

Additional optional runtime configuration remains documented in `DEVELOPMENT.md`.

## RECOMMENDATION

Manual reconciliation required before any migration touches production.

Do not run `db:push`. Do not replay the SQL files against the existing Supabase database until the live migration ledger, table metadata, RLS policies, functions, triggers, extensions, and current application data have been compared. If production already matches the expected schema, no migration is required. If anything is missing, prefer safe additive forward migrations after a verified backup and a successful disposable-project rehearsal.
