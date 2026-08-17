# PathPilot Performance Evolution — Checkpoint 15

## Scope

Checkpoint 15 makes the minimal planning activity recorded in Checkpoint 14 visible to the student. The Overview now has a compact **Your planning activity** timeline with up to five recent goal and opportunity actions. It is backed by a separate protected query and does not extend the existing dashboard aggregate.

## Student-Facing Boundary

The timeline reads only the authenticated student’s latest 12 event records and projects no more than the event ID, event type, subject type, and timestamp. It deliberately does not select event metadata, free-text goal content, opportunity eligibility information, mentor messages, simulation evidence, or behavioral trait data.

| Recorded action | Timeline wording |
| --- | --- |
| New, updated, progressed, or completed goal | A plain statement of the student’s goal-planning action. |
| Saved or dismissed opportunity | A plain statement of the student’s opportunity-management action. |
| Opportunity converted to a goal | A plain statement that the student created an editable commitment. |

The panel says directly that it reflects planning actions only; it does not make a personality assessment, career prediction, diagnosis, or recommendation change. The empty state makes the same boundary clear before a student has activity to show.

## Data and Control

The dedicated `pathpilot.activity.list` procedure uses the existing protected context and the live activity-event table’s user-owned RLS policy. The timeline is read-only. It does not create, update, dismiss, rank, or otherwise change any student data, roadmap, opportunity, simulation, or recommendation.

## Validation

| Check | Result |
| --- | --- |
| Focused coverage | Five focused tests verify neutral presentation wording, bounded user-scoped reads, and metadata exclusion. |
| Full regression | `pnpm test` passed: 32 files and 83 tests. |
| TypeScript and build | `pnpm check` and `pnpm build` passed. |
| Route check | The protected Overview route resolves through the signed-out workspace gate in the available browser session. |

## Focused User Acceptance

Sign in, create or edit a goal, and save or dismiss an opportunity. Return to **Overview** and confirm that Your planning activity shows a concise record of those actions. Confirm that the panel never labels behavior, predicts outcomes, exposes goal details, or changes a recommendation because of activity history.
