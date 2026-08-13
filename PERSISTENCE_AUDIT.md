# PathPilot Persistence Audit

## Current Runtime

PathPilot currently runs as a React 19 and Vite application backed by Express and tRPC. The public marketing page, onboarding, workspace, roadmaps, goals, simulations, and mentor views are already implemented in the existing UI. The application uses React state only for temporary interface interactions; its durable product operations are routed through `server/routers/pathpilot.ts`.

## Current Gaps

| Area | Existing behavior | Required integration change |
| --- | --- | --- |
| Authentication | Manus OAuth cookie and a legacy `users` table | Replace browser session handling with Supabase Auth and verify its access token in the tRPC context. |
| Persistence | Drizzle with a MySQL/TiDB schema in `server/db.ts` | Replace repository functions with user-token-scoped Supabase PostgreSQL calls. |
| Profile setup | Onboarding saves only on its final step | Restore a saved draft and persist progress after each valid step. |
| Data ownership | Procedures scope by numeric template user id | Scope all Supabase calls to the authenticated Supabase UUID and rely on RLS as the enforcement layer. |
| AI boundaries | Built-in LLM calls occur server-side already | Retain server-only AI calls, but source profile, roadmap, goals, matches, simulations, and mentor history from Supabase. |

## Integration Strategy

The existing Vite, tRPC, React Query, pages, and visual design remain in place. A reusable Supabase browser client will own sign-up, sign-in, sign-out, reset-password, and session restoration. A server Supabase client will be created from the verified bearer token for each tRPC request. Its queries will execute under the student’s RLS identity; no service-role credential is required or exposed.

The current PathPilot router procedures remain the browser API boundary. Their repository functions will be swapped from Drizzle/MySQL to Supabase PostgreSQL, preserving current inputs and outputs wherever possible so the existing UI continues to work. The simulation scorer remains independent in `server/pathpilot.helpers.ts`, while simulation state, roadmap records, goals, career matches, and mentor messages are persisted in the configured Supabase tables.
