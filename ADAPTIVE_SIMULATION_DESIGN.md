# Adaptive Simulation Engine 2.0 Design

## Design Principles

The simulation engine will be a **deterministic server-side domain module**. AI remains available only for bounded, structured explanations elsewhere in PathPilot; it will not choose branches, score decisions, or create behavioral evidence. The React workspace will receive one public node at a time and render it without access to the scenario graph, hidden consequence metadata, trait weights, future nodes, or score calculations.

> PathPilot will report **observed decision patterns in these simulations**, not personality diagnoses or predictions of career success.

| Principle | Implementation decision |
|---|---|
| Adaptivity | A directed graph maps a selected decision and accumulated state to a next node. Branch choice is deterministic, replayable, and validated server-side. |
| Resume | A `simulations` record persists the current node, public history, decision history, state, and completion data after every decision. |
| Hidden evaluation | Static graph definitions and decision metadata live only in `server/simulation/`; stored decision IDs are opaque and do not disclose their evidence weights. |
| Evidence over labels | Each decision contributes bounded observations. Scores emerge only after multiple observations, with a confidence proportional to evidence breadth, consistency, and difficulty. |
| Explainability | Results preserve reason codes and decision-pattern text derived from recorded observations. No generated explanation may claim evidence not present in the record. |
| Career compatibility | Compatibility combines the student’s persisted discovery/profile signals with only sufficiently observed behavioral traits; it is framed as an alignment estimate. |

## Module Boundaries

```text
server/simulation/
  contracts.ts             Public/private node, state, decision, result contracts
  catalog.ts               Career-to-graph resolver and transparent trait profiles
  graphs/software-v1.ts    Initial 10+ node software/data product scenario graph
  engine.ts                Start, render-current-node, validate-and-transition, completion
  behavioral.ts            Evidence, confidence, contextual patterns, contradictions
  compatibility.ts         Career-profile alignment and transparent explanations
  presentation.ts          Student-safe result and resume DTO builders
```

The data-driven graph will support career-specific catalog additions without UI or engine rewrites. The first graph will be a software/data professional scenario because its themes—investigation, testing, communication, delivery trade-offs, fairness, resource constraints, and incident response—support varied evidence contexts. Its resolver will also support adjacent career prompts with an explicit generic technical framing until a dedicated catalog is added.

## Graph and State Contracts

Each `ScenarioNode` has a stable `id`, student-facing title/situation, public decisions, optional state prerequisites, context tags, difficulty, and a terminal flag. Each private decision contains an ID, public text, required state, state patch, evidence signals, and next-node rules. The initial graph includes at least ten meaningful decision nodes, multiple branch paths, three convergence points, and at least two completion nodes. A typical path has eight to ten decisions rather than the prior fixed sequence of three.

`SimulationState` records only operational state: current node, previous node IDs, decision count, time pressure, project health, team trust, risk exposure, information discovered, unresolved events, and a bounded history. Decision selection applies a private state patch, then resolves the next node from explicit mapping plus state prerequisites. No node can be selected solely from a browser-provided index or next-node value.

| Persisted simulation field | Purpose | Browser visibility |
|---|---|---|
| `engine_version`, `scenario_graph_id` | Deterministic replay and future migrations | Returned as identifiers only |
| `current_node_id`, `node_history`, `decision_history` | Resume and audit selected paths | Current node and public history only |
| `state` | Branch prerequisites and operational consequences | Only student-safe state summary |
| `behavioral_evidence` | Aggregated evidence records and context tags | Not returned raw |
| `behavioral_profile` | Final observed trait summaries and confidence | Returned after completion |
| `compatibility_results`, `result_summary` | Stable final results and explanation reasons | Returned after completion |

The existing `simulations` table will be extended additively; no duplicate session table is required. An index on `(user_id, status, updated_at desc)` will support resume and dashboard queries. Existing RLS ownership remains in force.

## Behavioral Evidence and Confidence

An evidence item is recorded as `{ trait, direction, weight, context, difficulty, decisionId }`. Direction is bounded to `-1`, `0`, or `+1`; weight is a documented small integer based on the scenario’s decision consequence and difficulty. Trait observations do not start from an assumed personality baseline. A trait becomes displayable only after at least two independent observations across either different nodes or a sufficiently difficult context.

Confidence is **low**, **moderate**, or **high**. It increases with independent evidence count, context diversity, decision difficulty, and directional consistency. Contradictory evidence reduces confidence rather than being erased. Context-specific analysis compares a trait’s aggregate observations under tags such as `technical`, `uncertainty`, `time_pressure`, `interpersonal`, `ethical`, and `resource_constraint`; it may state an observation such as “you gathered more information under uncertainty” only where the linked records support it.

The initial student-facing profile will focus on a concise subset: analytical thinking, problem solving, systems thinking, attention to detail, collaboration, communication, ownership, adaptability, ethical reasoning, and long-term thinking. The internal contract remains extensible for additional traits.

## Transparent Career Compatibility

Initial career profiles will use **importance tiers** (`core`, `meaningful`, `supportive`) instead of unexplained arbitrary percentages. The tiers are documented with an occupational source note and normalize to weights only at calculation time. Software Developer, Data Scientist, and IT Project Manager profiles are initially grounded in O*NET descriptions of tasks and work activities, including problem solving, analysis, communication, planning, teamwork, and decision-making. [1] [2] [3]

The compatibility engine ranks the student’s existing five persisted career matches. It calculates an **alignment estimate** from available evidence, not an assertion of aptitude: profile/discovery relevance remains the primary signal until behavioral evidence reaches confidence thresholds. The result includes matched observed traits, development areas, confidence, and reason text selected from deterministic evidence-backed templates. Unknown career titles preserve their existing discovery rank and receive a transparent “limited behavioral mapping” explanation rather than an invented profile.

## Integration Rules

The roadmap generator and mentor will receive only the latest persisted, student-safe simulation result summary. They will not receive raw hidden decision metadata. Simulation outcomes can recommend a finite set of next steps; any AI-proposed goal will be returned as a proposal and must be explicitly accepted through a protected goal-creation mutation. The readiness view will label simulation contribution as one of several PathPilot signals rather than objective readiness.

## References

[1]: https://www.onetonline.org/link/details/15-1252.00 "O*NET OnLine: Software Developers"
[2]: https://www.onetonline.org/link/details/15-2051.00 "O*NET OnLine: Data Scientists"
[3]: https://www.onetonline.org/link/details/15-1299.09 "O*NET OnLine: Information Technology Project Managers"
