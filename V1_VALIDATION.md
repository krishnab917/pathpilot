# PathPilot V1.0 Validation Record

## Automated Verification

The current V1.0 validation run completed successfully with **8 test files and 20 tests**. Strict TypeScript checking and the production build also completed successfully. The production build now defers the mentor’s heavy Markdown renderer to the Mentor route, reducing the main application bundle and retaining the existing chat behavior.

| Area | Verified behavior | Evidence |
|---|---|---|
| Adaptive graph | Starts at a public node, branches by decision, updates state, rejects invalid decisions, and prevents choices after completion. | Deterministic engine tests. |
| Interrupted simulation | Serialized state, history, and evidence restore at the same next public scenario and continue through the graph. | Adaptive engine resume test. |
| Behavioral analysis | Evidence accumulates across decisions; confidence, contextual observations, and contradictions are retained rather than flattened into a label. | Adaptive engine tests. |
| Career compatibility | Different observed evidence can yield different compatibility orderings. | Adaptive engine tests. |
| Persistence and RLS | A fresh authenticated session restores adaptive state, behavioral profile, compatibility results, and other workspace records. A second user cannot read them. | Live Supabase two-user test. |
| Service role | Browser modules contain no service-role reference; the catalog write requires validated user-scoped discovery input. | Service-role boundary test. |
| Redirect helper | Browser redirects use the active HTTPS origin and reject insecure non-local origins. | Redirect helper test. |

## Production-Module State Review

| Module | Loading and failure behavior reviewed | Persistence and authorization boundary |
|---|---|---|
| Career discovery | Button pending state and inline user-safe error message; invalid model output is rejected server-side. | Verified user context and exactly-five validation before user-scoped match replacement. |
| Roadmap | Generation pending state and inline error message; malformed output is rejected before creation. | Protected request uses stored profile and bounded latest simulation summary. |
| Mentor | Chat busy state, generic user-safe service failure, and explicit proposal acceptance state. | Conversation, goals, dashboard context, and latest simulation summary are user-scoped; suggested goals are not persisted until accepted. |
| Portfolio | Query loading state and inline creation error state; update controls disable while pending. | Protected list/create/update procedures scope every operation to the authenticated user. |
| Adaptive simulation | Restore loading, start/choice pending states, and inline choice errors; public result reloads after refresh. | Current node, history, state, evidence, results, and compatibility are persisted per owned session. Hidden graph metadata is not returned to the browser. |
| Dashboard | Authenticated dashboard uses live profile, match, goal, roadmap, project, and recent simulation summary queries. | Readiness is presented as a PathPilot signal rather than objective truth. |

## Manual Acceptance Boundary

The following validation remains intentionally open because it requires a real confirmed student session and a stable public URL: mobile walkthrough of every authenticated route; Gmail confirmation return from Supabase; and final email-reset confirmation. The current local/preview authentication gate and mobile sign-in page were visually checked. No private student data, service-role credential, or AI credential was exposed in that verification.
