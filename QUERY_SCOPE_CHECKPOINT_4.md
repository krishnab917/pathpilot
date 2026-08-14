# PathPilot Query Scope and Cache — Checkpoint 4 Report

## Delivered Scope

Checkpoint 4 changes only client query behavior. It does not change Supabase schema, RLS, stored student data, AI output, simulations, roadmaps, recommendations, opportunities, or visual design.

| Change | Implementation | Effect |
|---|---|---|
| Explicit query defaults | `staleTime: 60s`, `gcTime: 5m`, one retry, no automatic refetch on window focus, and reconnect refetch enabled. | Stable workspace data is reused across ordinary route changes and tab focus without disabling recovery after a network reconnect. |
| Section-aware dashboard scope | Portfolio and Career mentor no longer activate the broad `dashboard.get` aggregate query. They fetch only the lightweight profile needed for the workspace shell plus their own feature query. | Avoids loading career matches, goals, roadmap, projects, and recent simulation solely to visit Portfolio or Mentor. |
| Targeted project invalidation | Portfolio create/update refreshes `projects.list` only. | Removes a redundant dashboard invalidation after a project-only change; the overview does not display dashboard project data. |
| Query-scope contracts | Focused tests cover cache policy values and which sections require aggregate dashboard data. | Prevents accidental broad aggregate fetches on Portfolio/Mentor in future edits. |

## Baseline and Expected Request Scope

Before this checkpoint, every authenticated workspace section activated `dashboard.get`, which aggregates profile, career matches, goals, active roadmap, projects, and latest completed simulation. Portfolio then separately requested its project list; Mentor separately requested conversation data. The dashboard repository already performs its internal reads concurrently, so this checkpoint preserves that useful behavior while avoiding the aggregate route request where it is not consumed.

| Workspace destination | Before | After |
|---|---|---|
| Overview, Discover, Roadmap, Simulate, Goals | `dashboard.get` | `dashboard.get` (unchanged; each section consumes aggregate data). |
| Portfolio | `dashboard.get` + `profile.get` dependencies + `projects.list` | `profile.get` + `projects.list`. |
| Career mentor | `dashboard.get` + `mentor.get` | `profile.get` + `mentor.get`. |

The 60-second freshness window is intentionally conservative: it lowers redundant remount/focus traffic without pretending user-authored progress is immutable. Successful mutations retain explicit invalidation where their visible aggregate data depends on the change.

## Validation

| Check | Result |
|---|---|
| Strict TypeScript | Passes. |
| Regression suite | **18 passing files, 43 passing tests.** |
| Production build | Passes. |
| Focused tests | Verify cache defaults and dashboard scope for Portfolio, Mentor, Overview, Roadmap, and Simulate. |
| Workspace route | Signed-out workspace route resolves without a client error after the scope change. |

## User Test Scope

Please test only the following before approving Checkpoint 5:

| Scenario | Expected result |
|---|---|
| Navigate Overview → Portfolio → Mentor → Overview | Each page loads its correct saved data; no blank state or stale-profile error. |
| Create or update a project | The Portfolio table updates immediately after save; a later Overview visit remains correct. |
| Send a mentor message or accept a mentor-proposed goal | The conversation/goal behavior remains unchanged; Overview reflects goal changes. |
| Switch tabs and return within a minute | The app should not visibly re-fetch every stable view solely because window focus changed. |
| Refresh or re-login | Existing persistence and loading behavior remains intact. |

Checkpoint 5—mentor first-open asset reduction and progressive renderer work—remains deferred until this isolated cache/data-scope behavior is accepted.
