# PathPilot V1.0 Current-State Audit

## Scope and Active Architecture

PathPilot’s active runtime is a **React 19 + Vite** single-page application with Wouter routes, a React Query/tRPC client, and an **Express + tRPC** server. Supabase Auth provides browser sessions; a verified bearer token creates a request-scoped, user-authenticated Supabase client for protected server procedures. The `app/`, `components/`, `lib/`, and `backend/` Next.js/FastAPI structure remains an inactive refactor skeleton and is not the running product.

Student-owned data is persisted in Supabase PostgreSQL with RLS for profiles, onboarding drafts, career matches, goals, roadmaps, simulations, mentor conversations, projects, and project-goal links. The active browser uses only the public Supabase URL and anon/publishable key. The only service-role path is shared career-catalog upserts after a protected, validated career-discovery request; all user-specific match deletion and creation runs through the request-scoped RLS client.

| Area | Current implementation | V1.0 assessment |
|---|---|---|
| Authentication | Email/password sign-up, sign-in, reset, session hydration, and server JWT verification are implemented. Sign-up now requests an explicit safe return URL. | The Supabase Site URL/redirect allow list must be set once a stable public URL exists. |
| Onboarding and profile | Exact five-step sequence with per-step drafts and final profile persistence. | Retain; validate in end-to-end regression coverage. |
| Career discovery | Protected server procedure validates exactly five unique AI recommendations, persists matches, and reads them under RLS. | Retain; behavioral compatibility must become an additional signal, not replace profile-based discovery. |
| Roadmap and goals | Persisted roadmap milestones, goal creation/progress, and AI mentor suggestions exist. | Mentor-created goals currently persist automatically; V1.0 should require explicit student acceptance for newly suggested goals. |
| Mentor | Uses stored profile, roadmap, goals, and recent conversation context. | Add deterministic simulation insights and compatibility summaries to its context. |
| Portfolio | Project list/create/update is persisted and available in the workspace. | Retain; include it in readiness/recommendation context where relevant. |
| Dashboard | Uses persisted profile, goals, roadmap, matches, and projects. | Add recent simulation and behavioral insight summaries; contextualize readiness rather than presenting it as objective truth. |
| Opportunities | No live opportunities model or source is active. | Do not fabricate listings. Defer UI/data ingestion unless a trusted data source is supplied. |
| Simulation engine | An LLM generates exactly three sequential scenarios. The UI keeps choice state locally and submits all three choices at completion. Scores are simple averages across three fixed impacts. | Replace with a deterministic, data-driven adaptive graph, persisted node state, decision history, behavioral evidence, resumability, and results. |
| Behavioral analysis | No dedicated trait, evidence, confidence, contradiction, or context model exists. | Implement as an independent deterministic module; present observations rather than personality claims. |
| Testing | 12 regression tests cover auth logout, helpers, public config, RLS isolation, fresh-session persistence, service-role isolation, and redirect construction. | Add graph branching, state transition, evidence, trait confidence, context, contradictions, compatibility, persistence, and resume tests. |

## Adaptive Simulation Gap Analysis

The current `simulations` table already provides a safe base for extension: it has a user owner, career, scenario JSON, user choices, status, completion timestamp, scores, and feedback. However, it lacks `current_node`, decision history, adaptive state, behavioral evidence, result profile, compatibility data, and any durable resume checkpoint. Current flow is deliberately simple: a single LLM call produces three scenarios and the browser advances by array index. That approach cannot provide non-obvious branching, deterministic replay, or evidence-based conclusions.

The V1.0 implementation should keep the simulation UI as a renderer only. A new server-side domain module must own the scenario graph, state transition rules, hidden decision metadata, behavioral evidence accumulation, trait scoring, confidence estimation, contradiction detection, and career compatibility calculation. The browser should receive only the current scenario’s student-facing content and permitted decisions, never hidden impact weights or future branching metadata.

## Security and Reliability Findings

Protected procedures derive user identity from the verified Supabase session rather than accepting a client-supplied user ID. Repository reads and writes constrain queries by that verified ID and execute through RLS. Current two-user tests cover profile, goals, roadmaps, simulations, conversations, messages, and projects; adaptive simulation records and derived analysis must be added to this same verification suite.

The service-role credential is not present in browser modules. Its code path has been narrowed to the shared `careers` catalog and no longer falls back to a public/anon key. Before this key is used, the discovery procedure requires a verified user, a persisted profile, strictly validated structured output, exactly five unique entries, and a server-derived user ID. The service-role client must remain unable to write user-specific simulation or behavioral records.

The public marketing page contains illustrative static content. It is not used as authenticated student state. No application-level `localStorage` or `sessionStorage` persistence is used for core product data; Supabase session storage is the browser authentication mechanism.

## Mock and Local-State Audit

The active application source was searched for `localStorage`, `sessionStorage`, `mock`, `fake`, `placeholder`, `demo`, and `hardcoded`, excluding test fixtures. No browser-local persistence was found in authenticated product paths. The only static scenario content is the server-only, documented adaptive simulation graph; it is real deterministic product content rather than placeholder user data. The public landing page retains illustrative marketing values, but authenticated workspace values are supplied through protected, user-scoped tRPC queries. Test data remains confined to Vitest/Supabase integration fixtures.

## Validation Boundary

The V1.0 build, strict TypeScript check, and 18-test Vitest suite pass. The suite includes real Supabase two-user RLS assertions and fresh-session restoration of adaptive simulation state, behavioral profile, and compatibility results. Mobile screenshots verify the public sign-in page and unauthenticated protected-route gate. A final browser acceptance pass under a real confirmed student account remains necessary for all authenticated mobile sections because this environment cannot enter a user’s credentials or complete the pending public email redirect configuration.

## Delivery Order

The implementation will extend the current `simulations` record rather than create duplicate concepts. First, define the graph and evidence contracts; next, apply one additive Supabase migration with RLS-compatible indexes; then implement the independent server engine, persistence transitions, compatibility output, and UI. Each stage will have deterministic unit coverage before it is wired to the existing workspace.
