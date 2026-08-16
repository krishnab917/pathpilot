# PathPilot Simulation Review Screen

## Delivered Behavior

When a student completes an adaptive simulation, PathPilot now opens a **Simulation review** stage before the existing final results screen. The stage lists every recorded decision in order, including the decision context, selected action, and its persisted consequence message. A student must choose **See final results** before entering behavioral analysis, compatibility signals, and the existing roadmap handoff.

## Privacy Boundary

The review is generated server-side from the student’s saved decision history and behavioral-event records. It returns only display-safe node titles, selected decision labels, and consequence messages. Trait signals, weights, score adjustments, internal state, and hidden graph metadata are not included in the client response.

## Persistence and Resume

The review does not create a parallel record or alter simulation completion. Reloading a completed simulation returns the review again before results, because the decision trail and consequences are already stored on the student-owned simulation. The prior final-results analysis and **Build my roadmap** action remain unchanged after the student continues.

## Validation

| Check | Result |
| --- | --- |
| TypeScript | `pnpm check` passed. |
| Regression suite | `pnpm test` passed: 28 files and 69 tests. New coverage verifies the review projection contains decision/consequence data while excluding trait signals and weights. |
| Production build | `pnpm build` passed. Existing deferred rich-Markdown chunk-size warnings remain warnings only. |
| Route check | The updated simulation route resolves through the expected signed-out access gate in the available browser session. |

## Focused User Acceptance

Sign in, finish an adaptive simulation, and confirm that the review stage appears before results. Check that every decision is in chronological order, each item has the matching **What changed** text, and **See final results** opens the unchanged final analysis. Refresh on the review screen and confirm the same history returns. Then continue to final results and confirm **Build my roadmap** still routes to the existing roadmap flow.
