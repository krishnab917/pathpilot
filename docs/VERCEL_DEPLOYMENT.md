# Deploying PathPilot to Vercel

PathPilot is a Vite single-page application with an Express/tRPC API. The
checked-in `vercel.json` builds the client into `dist/public`, serves it from
Vercel's CDN, and maps `/api/*` through the `api/index.js` function. The
Vercel build bundles the TypeScript API application into `dist/vercel-api.mjs`,
which that function loads. The legacy `/manus-storage/*` route is forwarded
to the same function. It does not open a port itself.

## Before the first deployment

Do not create or replay the active database from this checkout. Use the
existing owner-controlled Supabase project, or complete the migration-history
reconciliation described in `docs/MANUS_MIGRATION_AUDIT.md` first.

In the Vercel project settings, set these variables for each environment that
will run the application:

| Variable | Vercel environment | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Build and runtime | Browser Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Build and runtime | Browser public Supabase key |
| `SUPABASE_URL` | Runtime | Same project URL, for the API |
| `SUPABASE_ANON_KEY` | Runtime | Same public key, for user-scoped API clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime only | Privileged catalog, RPC, worker, and rate-limit operations |
| `JWT_SECRET` | Runtime only | Strong, stable rate-limit HMAC secret |
| `LLM_API_KEY` | Runtime only | Selected OpenAI-compatible provider credential |
| `LLM_API_BASE_URL` | Runtime only | Provider base URL; optional for OpenAI |
| `LLM_MODEL` | Runtime only | Explicit provider model name |

Set `OWNER_NOTIFICATION_WEBHOOK_URL`,
`OWNER_NOTIFICATION_WEBHOOK_SECRET`, and `STORAGE_PUBLIC_BASE_URL` only when
those retained features are in use. `VITE_ANALYTICS_ENDPOINT` and
`VITE_ANALYTICS_WEBSITE_ID` are public build-time values; configure both or
remove the current Umami integration in a separate change.

Never put `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, or `LLM_API_KEY` in a
`VITE_*` variable. Vite embeds those values into browser assets at build time.

In Supabase Auth, add the Vercel production domain and any preview-domain
pattern that needs authentication to the allowed redirect URLs. Include the
password-recovery route (`/update-password`) in the redirect URL configuration.

## CLI workflow

From the repository root, link the local checkout to the intended Vercel
project and create a preview deployment:

```sh
vercel link
vercel env ls preview
vercel deploy --target=preview
```

After the checks below pass, deploy to production with `vercel deploy --prod`.

For a local Vercel build, first run
`vercel pull --environment=preview --git-branch=develop`, then `vercel build`.
`vercel pull` writes secrets under the ignored `.vercel/` directory. The
repository pins pnpm 10.4.1 through
`vercel.json`; do not change the Vercel build command to the legacy `db:push`
command.

## Required validation and operational follow-up

Use `vercel dev` to exercise the Vercel routing locally, then verify at least:

- a browser load on `/`, a deep-linked client route such as `/auth`, and
  `/robots.txt`;
- authenticated tRPC operations, onboarding, simulations, roadmaps, portfolio
  and report access boundaries;
- one AI workflow using the configured provider; and
- `/api/scheduled/derived-analysis` with a valid private worker token from a
  non-production test account.

Vercel Cron sends `GET` requests, but the derived-analysis worker intentionally
requires a `POST` request whose body carries a private token. Do not add a
Vercel Cron entry that weakens that boundary. Keep or provision an external
scheduler that can send the existing authenticated POST, then store its token
outside the repository. Opportunity-catalog refresh schedules also remain an
external operational responsibility.

The function has a 60-second maximum duration in `vercel.json`. Long AI calls
or background workloads should be monitored; move them to a dedicated worker
only after preserving the current authorization and queue semantics.
