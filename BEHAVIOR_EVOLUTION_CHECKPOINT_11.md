# PathPilot Performance Evolution — Checkpoint 11

## Scope

Checkpoint 11 adds a **bounded learning summary** across completed adaptive simulations. It does not change existing simulation scores, overwrite career matches, replace a roadmap, or claim a stable personality or career outcome. Students retain control over which simulations they complete and whether they act on the resulting learning focus.

## Cross-Simulation Synthesis

The synthesis reads only the student’s completed adaptive simulations through the existing user-scoped access boundary. It includes at most the five most recent completed simulations. The fixed, visible weights are `1.00`, `0.85`, `0.70`, `0.55`, and `0.40`, from newest to oldest. This means recent experiences can inform the summary without erasing earlier observations or presenting an opaque model score.

| Output | Meaning |
| --- | --- |
| Learning signals | Up to six observed traits, with a recency-weighted score and an explicit `consistent` or `varied` label. |
| Evidence count | The number of included simulations in which the trait appeared. |
| Next learning focus | A small, optional practice direction grounded in the leading observed trait. With one simulation, it explicitly says the signal is initial and asks the student to test it in another context. |
| Method note | The UI shows the inclusion cap, every weight, and the non-diagnostic boundary. |

## Recommendation Evolution

The existing country-aware recommendation generator now receives the bounded evolution focus when it exists. Its rationale explains the simulation count and recency boundary. It does not automatically accept, replace, reprioritize, or delete a student’s goals, projects, roadmap milestones, or prior recommendations. New recommendations remain in the existing editable, accept-or-skip queue.

## Student Experience

After the student reviews completed-simulation decisions and selects **See final results**, the results screen adds an **Evolving learning signals** panel. It appears only when at least one completed adaptive simulation exists. The panel is intentionally absent from an active simulation and does not block the existing **Build my roadmap** action.

## Validation

| Check | Result |
| --- | --- |
| Database boundary | No schema migration or policy change was needed. The dedicated query uses the existing authenticated, user-owned `simulations` rows and a bounded read. |
| TypeScript | `pnpm check` passed. |
| Regression suite | `pnpm test` passed: 29 files and 71 tests. New coverage verifies explicit weights, newer-simulation influence, the five-simulation cap, the one-simulation initial-signal boundary, and the student-visible recommendation rationale. |
| Production build | `pnpm build` passed. Existing deferred rich-Markdown chunk-size warnings remain warnings only. |
| Route check | The simulation route resolves through its signed-out access gate without startup errors in the available browser session. |

## Focused User Acceptance

Complete two adaptive simulations with intentionally different choices. After the second review, select **See final results** and confirm the Evolving learning signals panel appears. Verify that it names the included simulation count, method, weights, trait consistency, and a non-binding next focus. Then generate or refresh a recommendation queue and confirm any new rationale references the learning summary without altering existing accepted goals or milestones.
