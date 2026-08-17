# PathPilot Performance Evolution — Checkpoint 16

## Scope

Checkpoint 16 gives students direct control over the private planning activity history introduced in Checkpoints 14 and 15. The Overview timeline now has a **Clear history** action only when activity records exist.

## Guarded Deletion Boundary

The action requires two distinct safeguards. The server accepts the mutation only with an explicit `confirmed: true` value, and the client presents an accessible confirmation dialog that names exactly what will and will not be removed. Cancelling the dialog produces no request and no data change.

| Data category | Result of clearing activity history |
| --- | --- |
| Private `behavioral_activity_events` rows owned by the student | Permanently removed. |
| Goals, goal links, opportunity state, opportunities | Unchanged. |
| Simulations, behavioral evidence, and behavioral profiles | Unchanged. |
| Roadmaps, recommendations, projects, and mentor history | Unchanged. |

The repository deletes only from `behavioral_activity_events` and always applies `user_id = authenticated student ID`. The existing RLS policy independently enforces the same ownership condition at the database layer.

## Student Experience

The confirmation says that clearing removes only the timeline history and does not alter goals, opportunities, simulations, roadmap, or recommendations. After success, the dedicated timeline query is invalidated and the student sees the normal empty state. New planning actions may begin a new private timeline later; the operation does not disable ordinary product use.

## Validation

| Check | Result |
| --- | --- |
| Focused repository test | Confirms deletion targets only the authenticated student’s activity rows. |
| Full regression | `pnpm test` passed: 32 files and 84 tests. |
| TypeScript and build | `pnpm check` and `pnpm build` passed. |
| Route check | The protected Overview route resolves through its signed-out access gate in the available browser session. |

## Focused User Acceptance

Sign in with planning activity visible on Overview. Open **Clear history**, confirm that the dialog describes only timeline history, then choose **Cancel** and verify nothing changes. Repeat and confirm clearing. The timeline should move to its empty state, while Goals, Opportunities, simulations, roadmap, and recommendations remain unchanged after refresh.
