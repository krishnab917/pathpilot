# PathPilot Performance Evolution — Checkpoint 18

## Scope

Checkpoint 18 extends the existing private planning activity history to cover **roadmap milestone progress** and **project progress**. It is an additive operational record, not a behavioral evaluation. Goals, opportunities, simulations, recommendation ranking, and accepted roadmap data keep their existing behavior.

## Bounded Events

The activity-event constraint now accepts the following additional events and subject types. Historical goal and opportunity activity records remain valid; no existing records were changed.

| Student action | Event | Stored metadata |
| --- | --- | --- |
| Update or complete a roadmap milestone | `roadmap_milestone_progress_updated` or `roadmap_milestone_completed` | Numeric progress only. |
| Create a project | `project_created` | Project status and whether it originated from a roadmap milestone. |
| Update or complete project progress | `project_progress_updated` or `project_completed` | Numeric progress only. |

Project names, descriptions, skills, source links, GitHub URLs, live URLs, career directions, mentor text, simulation trait data, and recommendation content are not copied to activity metadata. The student-visible timeline continues to use neutral descriptions and does not make a personality claim, diagnosis, or career prediction.

## Data Boundary

The additive migration only replaces the table’s enumerated event and subject constraints. It preserves the `auth.uid() = user_id` RLS policy, user-and-time index, activity records, and clear-history behavior. New events are recorded only after the corresponding user-owned project or roadmap write succeeds. As with earlier activity events, a supplementary recording failure does not reverse a primary student action.

## Validation

| Check | Result |
| --- | --- |
| Live migration | Applied successfully; live constraints now include the new event and subject values. |
| Focused tests | Nine focused activity tests verify neutral projection, bounded metadata, project/roadmap classification, and an owner-scoped project-progress write. |
| Full regression | `pnpm test` passed: 32 files and 87 tests. |
| TypeScript and build | `pnpm check` and `pnpm build` passed. |
| Security review | No new migration-related finding appeared. The only advisor warning remains the pre-existing leaked-password-protection setting. |
| Route check | Protected Overview, Roadmap, and Portfolio routes resolve through their signed-out access gates in the available browser session. |

## Focused User Acceptance

Sign in, advance a roadmap milestone, create or update a project, and refresh **Overview**. Confirm that Your planning activity records neutral project and roadmap actions without revealing project details or changing a roadmap recommendation. Clear the timeline if desired and confirm that the underlying milestone and project remain unchanged.
