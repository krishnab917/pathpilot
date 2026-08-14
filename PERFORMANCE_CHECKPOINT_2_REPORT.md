# PathPilot Performance — Checkpoint 2 Report

## Delivered Scope

Checkpoint 2 implements only the first approved improvement from the performance audit: **route-level code splitting and shell-first boot**. It does not change the database, Supabase schema, roadmap logic, simulations, AI behavior, notifications, skeleton design system, or visual language.

| Change | Implementation | Expected effect |
|---|---|---|
| Route-level code splitting | Public, auth, onboarding, workspace, and not-found pages now load with `React.lazy` behind a `Suspense` boundary. | A visitor does not download every route module before the selected route is known. |
| Immediate React mount | The app renders before `hydrateSupabaseSession()` completes; hydration continues in the background. | The route fallback and public shell can appear without a token-hydration blank wait. |
| Workspace startup frame | During auth restoration or the first authenticated dashboard fetch, the current workspace navigation frame and content-shaped placeholders render instead of the full-screen loading state. | The student sees the active section and workspace structure while data is restored. |
| Regression contract | A pure startup-state helper has three focused tests. | Signed-out and fully loaded states remain unmasked; only the intended startup intervals use the shell. |

## Measured Result

| Metric | Checkpoint 1 baseline | Checkpoint 2 | Change |
|---|---:|---:|---:|
| Main production entry | 1,056.17 kB | 838.73 kB | **−217.44 kB (−20.58%)** |
| Main production entry, gzip | 273.96 kB | 244.74 kB | **−29.22 kB (−10.66%)** |
| Test files / tests | 15 / 36 | 16 / 39 | 3 startup-state regression tests added |

The route fallback and public landing route were visually verified after the change with no browser-console errors. The production build still reports pre-existing large deferred chunks for the rich mentor renderer; that is intentionally reserved for Checkpoint 5, not altered here.

## User Test Scope

Please test only the following before approving Checkpoint 3:

| Path | What to verify |
|---|---|
| Landing page | It appears normally and does not flash a blank page during a normal refresh. |
| Sign in and onboarding | Navigation remains intact and the route content appears normally. |
| Authenticated workspace | The workspace chrome appears promptly while the account and dashboard data restore; it must resolve into the same saved data as before. |
| Route changes | Overview, Discover, Roadmap, Simulate, Portfolio, Mentor, and Goals still open normally. |
| Refresh | Data remains persistent and the workspace does not get stuck in the new startup frame. |

## Deferred to Later Checkpoints

The content-shaped placeholders in this change are a limited boot frame, not the full reusable skeleton system. Checkpoint 3 will introduce the consistent page-level skeleton design. Query caching, duplicate data loading, mentor asset reduction, AI lifecycle progress, notifications, opportunities, and simulation evolution remain deferred exactly as agreed.
