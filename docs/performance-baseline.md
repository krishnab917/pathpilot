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

## Library behavior verified during implementation

Official tRPC React Query guidance states that queries are **not aborted on unmount by default** and supports opting in globally or per query through `abortOnUnmount`; this is relevant for rapidly changing Opportunity searches.[1] The same documentation confirms that v11 streaming queries require an async-generator server contract and `httpBatchStreamLink`.[2] PathPilot’s current foreground AI operations return validated structured JSON from mutations, so changing them to a stream would require a separately designed validation and failure boundary. No streaming change is assumed or implemented in this checkpoint merely because the transport supports it.

## References

[1] [tRPC, “Aborting Procedure Calls”](https://trpc.io/docs/client/react/aborting-procedure-calls)

[2] [tRPC, “useQuery()”](https://trpc.io/docs/client/react/useQuery)

## Checkpoint implementation record

The active performance checkpoint now establishes two client-side defenses for private data. First, the React Query client hashes every query with the current verified Supabase session identity and clears/cancels the entire browser query cache on logout or an identity transition. This is defense in depth for existing server-side ownership and RLS controls: a User B request still has to pass the authenticated server boundary, while a User A response cannot remain available in the in-memory browser cache during the transition. The current regression suite covers stable same-user reuse, logout before User B, and direct A-to-B transition.

Second, the dashboard retains its existing primary aggregate as the critical first request, but starts its planning review, activity timeline, and optional simulation learning-signals queries only after a 50-millisecond post-render delay. Those queries are marked to abort when the overview unmounts. This does not alter dashboard data, simulation logic, or visible section purpose; it allows the primary workspace shell and core action/goal/roadmap content to render before lower-priority reads compete for the initial request window.

Opportunities now uses a 300-millisecond debounced search term, retains its server-side filter/pagination input and 12-item page size, preserves the prior page while the next result is pending, and opts in to query cancellation when the page unmounts. Immutable country metadata receives a one-hour stale interval and 24-hour in-session garbage-collection interval. Personalized opportunity results remain short-lived, user-session-namespaced, and are neither globally cached nor loaded as a full catalog.

The client invalidation review found that PathPilot already invalidates the active dashboard after many state changes, but that secondary planning review and activity queries can remain cached for their 60-second default interval after goal, roadmap, or project changes. The next targeted update will invalidate those derived views only after mutations that can actually affect them. It will also invalidate the personalized Opportunity query after a country or profile-analysis direction change, but will not globally refresh pending recommendation rows when a student elects to preserve them after changing country. Mentor message creation does not alter dashboard state and is a candidate for removing an unnecessary dashboard invalidation.

## Initial optimization hypotheses to validate

| Area | Current baseline observation | Validation needed before change |
|---|---|---|
| Workspace boot | Route and section lazy loading exist; primary query is section-scoped. | Capture route and network timing, then inspect for measurable secondary-query or bundle bottlenecks. |
| Opportunities search | Server filtering and pagination exist; search uses deferred input rather than a measured timed debounce. | Measure request cadence and stale-query behavior before changing search handling. |
| User-state cache | One global policy is present; feature-specific behavior is mostly query-level. | Inventory keys, invalidations, account-switch clearing, and mutable-data freshness. |
| AI generation | Server-side context limits, result reuse, duplicate leases, and rate limits exist. | Measure no-model cache paths and safe response lifecycle feedback; do not incur avoidable model calls. |
| Dashboard data | Server gathers several user-owned data sets concurrently. | Measure payload and response path before considering targeted projection or layered-query changes. |

This document will be updated only with measured before/after values and verified changes. It does not claim a performance improvement at baseline.

## Before/after checkpoint measurements

| Area | Before | After | Evidence and interpretation |
|---|---:|---:|---|
| Production build | Not recorded for this exact source revision | 14.99 seconds | `pnpm build` completed successfully on 2026-08-27. Build timing is environment-sensitive and is reported only as a local validation measurement. |
| Deployed public route | 4.098–4.669 s completed TTFB; 8.866–9.639 s completed transfer | Not remeasured before this checkpoint is published | The deployed site still serves the prior version until checkpoint publication; no comparison is claimed. |
| Production output | ~17 MiB | ~17 MiB | Rounded output size is unchanged. |
| Workspace route chunk | 244.59 KiB | 250.95 KiB | The 6.36 KiB pre-compression increase is the scoped cache/loading logic; it remains independently lazy loaded. |
| Rich Mentor renderer | 890.35 KiB | 911.72 KiB | It remains independently lazy loaded; no Mentor-open initial-load regression is inferred from the global chunk output. |
| Overview first query window | Dashboard aggregate plus review/activity and conditionally behavior summary started together (3–4 queries) | One dashboard aggregate starts first; three lower-priority reads wait 50 ms | Source-contract regression verifies this deliberate sequencing. The eventual total stays 3–4 when the overview remains open, preserving information freshness. |
| Opportunity rapid search | Deferred rendering could change server input during a typing burst | A 300 ms quiet period is required before input changes | The explicit debounce contract bounds a contiguous typing burst to one new server search after the quiet period; server pagination remains 12 rows per page. |
| Same-user private query reuse | Not directly covered | One underlying fetch across two fresh reads | Synthetic QueryClient regression: 1 fetch for User A’s repeated fresh query. |
| A-to-B private query transition | No explicit client cache clear or identity namespace | User A queries are canceled/cleared; User B performs a second independent fetch | Synthetic QueryClient regression: 1 User A fetch, then 1 User B fetch; late A result remains absent. |
| Immutable metadata | General 60 s stale interval | 1-hour stale interval / 24-hour in-session GC | Applied only to canonical country and 15-career catalog metadata. Session transition still clears it. |
| Unchanged active roadmap generation | Repeated same-target generation could reach the AI path | Existing roadmap returns before limiter/model work | Router regression observes zero model calls for valid, unchanged profile/simulation/goal/project state. |
| Project guidance cache hit | Existing behavior | Retained | Existing cache regression confirms validated owner-scoped cache hits bypass the fresh model/limit path. |
| Mentor message dashboard refetch | Dashboard invalidated after a stored message although no dashboard state changed | Removed | Source contract protects removal; Mentor history remains invalidated. |
| Live AI first feedback/completion | Not invoked for this checkpoint | Not changed | Existing truthful in-progress UI is retained. A live provider timing sample was intentionally not incurred. |

### Validation limits

Authenticated browser-network timings for workspace, dashboard, roadmap, Opportunities, and Mentor open remain unmeasured because this checkpoint used data-free synthetic QueryClient and router tests rather than a student account. The test evidence verifies cache scope, cancellation, query ordering, and cache/model reuse semantics; it does not substitute a real-device timing study. The public production page must be remeasured after this checkpoint is live to compare public transfer timing. No recommendation, simulation, security-policy, RLS, or rate-limit behavior was changed.
