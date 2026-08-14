# PathPilot Performance Audit — Checkpoint 1

## Scope and Delivery Rule

This is the **first standalone checkpoint** requested in `pasted_content_6.txt`. It measures the current PathPilot application and defines a prioritized improvement sequence. It makes **no functional, database, architectural, or visual changes**. Each later improvement will be a separate checkpoint, followed by a user test window and a concise report.

> The goal is to reduce real bottlenecks without replacing the existing Supabase, tRPC, adaptive-simulation, or utility-first workspace architecture.

## Measurement Method

The audit used a fresh production build, current source inspection, and browser performance timing from the local preview. Build-size figures are emitted by Vite after minification and gzip compression. Browser navigation timing is explicitly treated as a local-development reference rather than a production user-performance claim.

| Measurement | Observed baseline | Interpretation |
|---|---:|---|
| Production build duration | **17.27 s** | Build-time baseline only; it does not represent student wait time. |
| Main production entry | **1,056.17 kB**; **273.96 kB gzip** | Materially above a lean dashboard entry budget and the primary startup optimization target. |
| Global CSS entry | **122.74 kB**; **19.49 kB gzip** | Not the primary bottleneck; retain for a later CSS review only if entry work does not reach the desired result. |
| Generated production assets | **398 files**, **14.00 MiB** total | Most is feature-deferred syntax/diagram support, but it increases deployment and cache footprint. |
| Largest deferred mentor chunk | **935.77 kB**; **283.10 kB gzip** | The mentor is lazy-loaded, which protects initial workspace boot, but its first open remains expensive. |
| Local preview navigation | **369 ms** DOMContentLoaded; **371 ms** load; **368,263 B** document transfer | Useful only as a local development reference; production CDN/device/network testing remains required after implementation. |

## Findings

| Priority | Finding | Evidence | Student impact | Recommended checkpoint |
|---|---|---|---|---|
| P0 | Route modules are eagerly imported. | `client/src/App.tsx` statically imports Home, Auth, Onboarding, Workspace, and NotFound; Vite has no configured chunk strategy. | A student visiting the landing page downloads code for authenticated flows before needing it. | **Checkpoint 2 — Route-level code splitting and shell-first boot.** |
| P0 | The first workspace render waits on session hydration and a full dashboard aggregation. | `client/src/main.tsx` waits for `hydrateSupabaseSession()` before mounting React. `Workspace.tsx` shows a full-page loading state while `dashboard.get` resolves. | Navigation and layout are withheld instead of appearing immediately with progressive data. | **Checkpoint 2 — Render the public/auth shell immediately; retain a stable workspace shell while primary data loads.** |
| P1 | Dashboard data is broad even when a student is on a single section. | `getDashboardData` correctly uses `Promise.all` for six repositories, but always returns profile, matches, goals, roadmap, projects, and simulation data. Portfolio then separately queries `projects.list`; Roadmap country controls separately query profile and country options. | Avoidable data transfer and duplicated Supabase reads on section changes. | **Checkpoint 4 — Query-scope and cache policy audit after shell-first behavior is stable.** |
| P1 | React Query has no explicit cache or refetch policy. | `client/src/main.tsx` creates `new QueryClient()` without `defaultOptions`. | Default stale/refetch behavior can trigger avoidable revalidation during navigation, focus, and remounts. | **Checkpoint 4 — Measured query-cache defaults and targeted invalidation.** |
| P1 | The mentor’s rich renderer pulls a large Markdown/diagram/syntax dependency graph. | `AIChatBox.tsx` imports `streamdown`; emitted assets include a 935.77 kB mentor chunk plus Mermaid, Cytoscape, WASM, and language modules. The mentor component is already lazy-loaded. | Initial boot is protected; first Mentor visit may be heavy, particularly on mobile networks. | **Checkpoint 5 — Mentor progressive renderer and feature-level asset audit.** |
| P1 | AI model catalog selection is repeated. | `preferredModel()` calls `listLLMModels()` for career discovery, AI roadmaps, the legacy generated simulation path, and mentor replies. | Adds avoidable upstream latency to AI actions. | **Checkpoint 6 — Server-side model-catalog caching and operation-status UX.** |
| P2 | Some page states still use generic text/spinner loading. | Portfolio and roadmap recommendation queue use generic loading copy; Workspace can use a full-screen loader. | Perceived latency remains higher than necessary despite valid loading state coverage. | **Checkpoint 3 — Consistent, representative skeleton system.** |

## Confirmed Non-Issues

The dashboard repository already fetches its six top-level datasets concurrently with `Promise.all`; this should not be refactored into a serial sequence. The adaptive simulation engine is deterministic and server-side, so it is not an initial client boot bottleneck. The large mentor-renderer dependency graph is deferred by an existing lazy import; it should be optimized at feature level rather than moved into the startup path.

## Proposed Checkpoint Sequence

| Checkpoint | Narrow scope | User test after checkpoint | Explicitly deferred |
|---|---|---|---|
| 2 | Route-level splitting and shell-first boot. | Landing, sign-in, onboarding, and workspace shell appear without a blank app wait. | Skeleton redesign, AI changes, data-model work. |
| 3 | Reusable content-shaped skeletons for the existing pages. | Slow-load visual states for dashboard, roadmap, simulation, portfolio, and mentor. | Query/data redesign. |
| 4 | Query scope, cache defaults, and targeted invalidation. | Route switching and refresh behavior; persistence must remain correct. | AI flow changes. |
| 5 | Mentor first-open asset reduction and progressive renderer review. | Open Mentor on desktop and mobile; messages must remain formatted correctly. | AI semantics. |
| 6 | AI operation lifecycle status and safe model-catalog caching. | Career discovery and roadmap generation show true start/running/complete states. | Opportunities and simulation redesign. |
| 7 | Global meaningful notifications and page-level CTA audit. | Create/update flows have accessible, non-spammy confirmation. | New database entities. |
| 8 | Roadmap-to-action project workspace foundation. | A meaningful roadmap action can begin a real project flow. | Opportunity ingestion. |
| 9 | Verified opportunities data model and controlled first source integration. | Opportunities render only sourced, attributable, student-relevant data. | Bulk opportunity expansion. |
| 10 | Career-specific simulation expansion, consequence events, and behavioral-event foundation. | Distinct simulations preserve resume, analysis, and roadmap handoff. | Continuous profile recalibration. |

Later parts of the uploaded specification—large-scale opportunity coverage, continuous behavior analysis, recency weighting, recommendation evolution, dashboard intelligence, and scheduled/background work—will be broken into further checkpoints only after the preceding dependencies are tested and accepted.

## Checkpoint 1 Acceptance

No end-user behavior has changed in this checkpoint. The acceptance condition is that this document accurately reflects the current baseline and that the next implementation begins with **Checkpoint 2 only**, not a bundled rewrite.

## References

[1]: https://vite.dev/guide/build "Vite — Build Guide"
[2]: https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults "TanStack Query — Important Defaults"
[3]: https://web.dev/articles/code-splitting-suspense "web.dev — Code Splitting with React Suspense"
