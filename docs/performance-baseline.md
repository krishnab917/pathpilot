# PathPilot Performance Baseline — Checkpoint 66

## Verified architecture baseline

PathPilot is a React 19 and TypeScript application built with Vite. The browser uses Wouter routes, React Query plus tRPC for data access, and a Supabase-backed Express server. Persistent student data remains authoritatively stored in Supabase under existing authenticated ownership and RLS boundaries; client caches are not a source of truth.

The application already uses route-level lazy loading for public, authentication, onboarding, workspace, shared-report, public-portfolio, and not-found routes. Within the authenticated workspace, the simulation, roadmap, portfolio, opportunities, and rich Mentor renderer are independently lazy loaded. The workspace requests either the dashboard aggregate for dashboard-dependent sections or the profile for lightweight sections; it does not request both at boot. Its background derived-analysis status and secondary overview panels mount only after primary dashboard data is present.

React Query currently applies a 60-second stale time, 5-minute garbage-collection time, one retry, no window-focus refetch, and reconnect refetch. Project AI guidance already has a seven-day, owner-scoped, versioned cache. Career Discovery returns five valid matches newer than the student profile before generating again. The current limiter checkpoint protects fresh AI calls with shared Supabase limits and short duplicate leases; cache hits bypass model work but not authorization.

## AI and data-access baseline

The direct foreground model operations are Profile Analysis/Career Discovery, roadmap generation, Career Mentor, and project guidance. They use server-side structured responses and the model catalog has a five-minute timed cache. Mentor context is request-aware, allowlisted, and bounded; project guidance reads only the selected user-owned project. Current server data access already parallelizes the dashboard aggregate and uses server-side filtering and pagination for opportunities.

No live student records, prompts, model calls, or credentials will be used to establish timing. The following measurements are therefore pending controlled public-route, bundle, synthetic cache/limiter, and non-mutating server measurements: initial route load, workspace startup, dashboard/roadmap/opportunity request timing, simulation launch, Mentor open, AI feedback, and AI completion.

## Initial measurements

The production public route was requested three times on 2026-08-27 without authentication or model work. The complete HTML response was 369,998 bytes in the two completed samples. Time-to-first-byte measured 4.669 seconds and 4.098 seconds; total transfer measured 8.866 seconds and 9.639 seconds. The second sample began transferring at 3.087 seconds but did not complete inside a 20-second observation limit, receiving 235,360 bytes before timing out. These measurements establish a variable public-route baseline only; they do not identify the cause and must not be compared directly to authenticated API calls.

The existing production build occupies approximately 17 MiB. The current workspace route chunk is 244.59 KiB before compression, while the rich Mentor renderer is 890.35 KiB and remains independently lazy loaded. Additional large language/rendering chunks are also deferred from initial route code. This establishes a concrete opportunity to inspect public-page payload composition and confirms that the previously introduced workspace section splitting is still present.

The production route response currently returns `cache-control: no-cache, no-store, must-revalidate`. The observed entry module transferred approximately 184 KiB in the three sampled requests (TTFB 1.577–4.242 seconds; total 4.722–7.372 seconds), and the stylesheet approximately 21 KiB (TTFB 2.473–3.284 seconds; total 2.884–3.650 seconds). The unauthenticated `/auth` and protected `/app` documents each transferred about 106 KiB. The static public page, however, transferred substantially more decoded HTML than these app-route documents. The transfer results are variable and must be remeasured after any bundle or static-response change.

## Confirmed client data and interaction findings

The client renders its root before asynchronous Supabase session hydration completes. It maintains one QueryClient and the current cache defaults apply a 60-second stale interval and 5-minute garbage-collection interval to all queries. The existing workspace start-up frame maintains navigation and a content-shaped skeleton while authentication or the section’s primary query is loading. The dashboard aggregate is deliberately not requested for Portfolio, Opportunities, or Mentor routes; these mount their own route code and primary data instead.

The opportunities page uses server-side pagination and filtering with a page size of 12. Its search input uses React’s deferred value rather than a timed debounce, so this checkpoint must measure its request cadence and replace it only if it causes avoidable requests. The Mentor chat shell loads before a response and immediately displays a real in-progress acknowledgement after a send. AI responses are not currently streamed: the server validates complete structured JSON before returning it. Streaming a structured result without a validated completion boundary would change failure semantics, so it is not assumed to be an optimization until a safe design and measurement support it.

Server-side, dashboard retrieval already begins profile, career matches, goals, active roadmap, projects, simulations, and saved opportunity reads concurrently. The Mentor context path makes bounded, explicit projections and conditionally fetches project/simulation data. Project guidance reads only a selected user-owned project. In contrast, the dashboard and project-list aggregates presently request complete nested records for several collections; the next phase will measure payload/round-trip impact before considering narrower projections.

One cache-correctness candidate requires direct regression coverage before any broader stale-time increase: protected tRPC query keys do not include the authenticated user ID at the call site, and the long-lived global QueryClient is not explicitly cleared by the visible sign-out helper. Existing RLS prevents a new server read from returning another student’s records, but the client should not temporarily render stale in-memory data during account transitions. This is an audit hypothesis, not a reported leakage; it will be tested with User A/User B cache behavior before remediation.

## Initial optimization hypotheses to validate

| Area | Current baseline observation | Validation needed before change |
|---|---|---|
| Workspace boot | Route and section lazy loading exist; primary query is section-scoped. | Capture route and network timing, then inspect for measurable secondary-query or bundle bottlenecks. |
| Opportunities search | Server filtering and pagination exist; search uses deferred input rather than a measured timed debounce. | Measure request cadence and stale-query behavior before changing search handling. |
| User-state cache | One global policy is present; feature-specific behavior is mostly query-level. | Inventory keys, invalidations, account-switch clearing, and mutable-data freshness. |
| AI generation | Server-side context limits, result reuse, duplicate leases, and rate limits exist. | Measure no-model cache paths and safe response lifecycle feedback; do not incur avoidable model calls. |
| Dashboard data | Server gathers several user-owned data sets concurrently. | Measure payload and response path before considering targeted projection or layered-query changes. |

This document will be updated only with measured before/after values and verified changes. It does not claim a performance improvement at baseline.
