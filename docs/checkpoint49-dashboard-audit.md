# Checkpoint 49: Dashboard Journey Audit

The authenticated overview currently prioritizes readiness metrics, planning review, a generic deterministic next-best-action panel, goal queues, mentor context, simulation observations, planning activity, sharing, and privacy panels. The current student state has two completed simulations, results available, an active roadmap, and one active goal. The existing simulation-result control is at the end of the overview, so it does not provide the required immediate progression guidance.

The dashboard query already provides all data needed for a UI-only journey projection: the latest completed simulation, active roadmap, active goals, career matches, and current deterministic action. The Checkpoint 49 redesign can therefore remain schema-free and preserve all existing backend, privacy, RLS, and simulation-engine behavior. The overview will place a simulation-first primary panel and a three-step journey before the existing metrics and relocate—not remove—the current secondary panels below this guided layer.

## Implementation and validation

The dashboard now adds its existing resumable simulation projection to the dashboard response; no table, policy, simulation, scoring, or behavior-analysis logic was changed. A pure client-side journey helper derives one dominant action from that existing state: start or continue a simulation before completion, review results after a completed simulation with no roadmap, and open the roadmap once the roadmap exists. The same helper drives the simulation status card and the visible `1 → 2 → 3` progression.

Authenticated desktop inspection confirmed that the guided layer appears directly below the overview header and above readiness metrics, planning review, priority queue, mentor context, activity, sharing, privacy, and simulation-signal panels. The current student state correctly displayed steps 1 and 2 as completed, step 3 as current, and a roadmap CTA as the single dominant action. Existing planning prioritization remains lower in the hierarchy as a contextual panel.

Focused journey-state coverage validates new, in-progress, results-ready, and roadmap-ready students. Full validation passed with **65 test files and 185 tests**, TypeScript, and the production build. The build retains only the existing non-blocking large-chunk advisory.
