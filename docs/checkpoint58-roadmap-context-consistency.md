# PathPilot Roadmap Context Consistency — Checkpoint 58

## Resolved ambiguity

The roadmap now presents four separate persisted concepts instead of allowing a simulation environment to read as an active planning target. The context panel shows the current roadmap career, planning country, latest simulated career with completion date, and the independently derived top preliminary fit. A missing fit reads **Not enough evidence yet** rather than displaying an empty percentage.

The recommendation queue now identifies whether its suggestions support the active roadmap or are exploratory suggestions based on the latest simulation. It also exposes a concise source line, consistent evidence coverage, and the non-mutating relationship among country, goals, projects, accepted recommendations, and roadmap milestones.

## Persistence and confirmation safeguards

The simulation career and preliminary fit do not mutate the active roadmap. A student can deliberately select **Change roadmap career**, review what happens, and confirm the change. Both the UI and the router require this confirmation before a different active roadmap target can be replaced. The user’s existing goals, projects, accepted recommendations, and prior roadmap remain unaffected by the contextual display; creating a confirmed new roadmap retains the repository’s existing archive-and-create behavior.

## Regression coverage

`roadmap-context-consistency.test.ts` covers distinct active-roadmap, simulated-career, and fit combinations; a fit that matches the simulated career; a fit that differs from both; missing-fit rendering; internally consistent evidence coverage; country non-mutation wording; and explicit confirmation. `career-discovery-router.test.ts` now proves that a different active roadmap target is rejected without confirmation and accepted only with it. Existing recommendation, persistence, and simulation-handoff coverage remains green.

## Validation limitation

The protected roadmap route still displays its intentional signed-out gate without errors. An authenticated desktop/mobile visual walk-through requires a student account/session and was not fabricated during this checkpoint. All implemented contexts are covered by automated contracts and the TypeScript/production-build validation below.

## Final validation

`pnpm test && pnpm check && pnpm build` passed with **70 test files / 203 tests**, TypeScript validation, and production build success. The pre-existing deferred rich-renderer chunk advisory remains non-blocking.
