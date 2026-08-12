# PathPilot Configuration Contract

No secret values are committed to this repository. Supply the following variables through the deployment platform’s secret manager.

| Variable | Consumer | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Next.js browser | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Next.js browser | Public anonymous key; row-level security remains mandatory. |
| `PATHPILOT_API_URL` | Next.js server route handler | Base URL for the separately deployed FastAPI service. |
| `SUPABASE_URL` | FastAPI | Supabase project URL used for JWT verification and repositories. |
| `SUPABASE_ANON_KEY` | FastAPI | Supabase key used for authenticated user verification. |
| `PATHPILOT_AI_PROVIDER` | FastAPI | Identifier for the structured-output AI provider adapter. |
| `PATHPILOT_AI_API_KEY` | FastAPI | Provider credential; server-only. |

The frontend may never use server-only values. The FastAPI service refuses authenticated requests until Supabase values are supplied and refuses AI generation until a structured-output AI adapter is installed.
