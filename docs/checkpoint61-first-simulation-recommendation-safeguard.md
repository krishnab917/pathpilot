# PathPilot First-Simulation Recommendation Safeguard — Checkpoint 61

## Verified root cause

The recommendation generator itself already supports a completed simulation with no active roadmap: it uses the simulation career whenever a persisted roadmap target is absent. The empty state was introduced in the client composition. `RoadmapExperience` mounted `RoadmapContextForSimulation` only when `roadmap` was truthy. A fresh student who had completed a simulation but had not yet created a roadmap therefore saw the country control but never mounted the context/query/queue that triggers first-time recommendation generation.

## Correction

The render boundary now depends on the actual prerequisite for recommendations: a completed simulation identifier. `RoadmapContextForSimulation` mounts whenever `simulationId` is present and continues to receive the nullable active-roadmap context. For fresh students, the existing repository fallback selects the simulated career. For students with a roadmap, the active roadmap career remains the target. This change does not modify profiles, simulations, active roadmaps, goals, projects, accepted recommendations, or recommendation rows already saved.

## Simulation-wide prevention matrix

The new regression iterates over all fifteen source-controlled simulation careers. For a first completed simulation without a roadmap, each must yield four actionable recommendations: three **Do this next** primary actions and one **Explore** action. Each item must retain a stable requirement ID, student-gap explanation, practical tip, and a rationale bound to that simulated career.

The same regression asserts the client renders the recommendation context from `simulationId`, and explicitly rejects restoration of the prior `roadmap &&` render gate. A codebase scan found no other active-roadmap-only gate around the recommendation context or queue.

## Validation

`pnpm test && pnpm check && pnpm build` passed with **73 test files / 223 tests**, TypeScript validation, and production build success. The existing deferred rich-renderer build advisory remains non-blocking. Authenticated visual confirmation of the particular student’s Environmental Scientist result is still a user-session check; the shared rendering and deterministic-generation contracts are covered for every supported simulation career.
