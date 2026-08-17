# PathPilot Performance Evolution — Checkpoint 12

## Purpose

Checkpoint 12 turns the Overview into a more useful representation of the student’s existing workspace state. It adds one **Next best action** and a compact **Observed decision patterns** summary without generating new profile data, changing a saved roadmap, altering career matches, or accepting recommendations on the student’s behalf.

## Deterministic Decision Order

The next-best-action selector uses only already persisted, user-owned records. It does not call an AI model and does not treat behavioral signals as a diagnosis or prediction.

| Priority | Condition | Recommendation |
| --- | --- | --- |
| 1 | Active goal with a saved deadline within 14 days | Advance the nearest deadline. |
| 2 | In-progress project below 100% | Continue the project rather than starting a different one. |
| 3 | Saved opportunity | Review the saved record; never infer an application deadline from source timing. |
| 4 | No career matches | Run career discovery. |
| 5 | Career matches but no completed adaptive simulation | Run a simulation for the strongest current direction. |
| 6 | Completed simulation but no active roadmap | Build an editable roadmap. |
| 7 | Incomplete active roadmap milestone | Advance the first incomplete student-owned milestone. |
| 8 | None of the above | Create a focused next goal. |

Every recommendation includes a **Why this now?** disclosure that names the real data condition behind it. The primary action only navigates to the existing corresponding workspace section. It never mutates state.

## Dashboard Behavior Signals

The Overview makes a separate protected behavior-summary request only when a completed adaptive simulation exists. It shows up to three observed decision-pattern signals with their consistency label. The display retains the boundary that these are learning signals from decisions, **not a personality assessment or career prediction**.

## Data and Security Boundary

The dashboard aggregation remains user-scoped. The only added data read is the most recently saved opportunity state joined to its existing opportunity title and source timing, under the same authenticated access path. No schema, migration, RLS policy, service-role use, or raw behavioral-evidence exposure was added.

## Validation

| Check | Result |
| --- | --- |
| TypeScript | `pnpm check` passed. |
| Focused logic | Three tests verify the discovery → simulation → roadmap progression, imminent real-deadline priority, and no inferred opportunity deadline. |
| Full regression | `pnpm test` passed: 30 files and 75 tests. |
| Production build | `pnpm build` passed. Existing deferred rich-renderer size warnings remain warnings only. |
| Route check | The protected `/app` route rendered its signed-out workspace access gate cleanly in the available browser session. |

## Focused User Acceptance

Sign in to a populated account and open **Overview**. Confirm that Next best action gives a single appropriate, clickable action and that **Why this now?** references a real saved condition. Then create an active goal with a deadline within 14 days and refresh: it should become the priority. Verify that an in-progress project becomes the priority only when no nearer dated goal exists. Finally, complete a simulation and confirm the decision-pattern summary is informative but remains explicitly non-diagnostic.
