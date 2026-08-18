# Career-Specific Adaptive Simulation Audit

## Scope and preserved contracts

The uploaded specification requires a **controlled catalog of exactly fifteen dedicated simulations**, not an arbitrary career string that is silently routed into a broad work-family graph. The implementation must retain the existing adaptive engine, Supabase session persistence, student ownership, behavioral-evidence safeguards, consent-gated response timing, completed-simulation roadmap handoff, and existing workspace shell.

## Current-state findings

| Area | Current implementation | Required change |
|---|---|---|
| Career selection | `AdaptiveSimulation` accepts a freeform `Input`; the adaptive start procedure accepts any trimmed 2–180-character career. | Replace the freeform launch path with a searchable selector limited to the supported catalog. |
| Unsupported input | `getSimulationGraph` uses substring matching and falls back to the software graph. | Remove fallback substitution for new simulations; show an explicit unsupported-career state with nearby supported careers and an Explore Career option. |
| Catalog shape | Ten graph families are registered. Several are built from one shared wording template. | Register fifteen dedicated careers with stable IDs, metadata, behavioral requirements, and individual graph modules. |
| Branching engine | The generic engine already transitions deterministically from decision state and persists state, evidence, decision history, and consequences. | Preserve it; extend graph metadata and state representation only where career-specific data needs it. |
| Scenario identity | The existing software graph is dedicated, while several other career-family graphs share a template structure. | Replace template variants with materially distinct professional scenarios, decisions, consequences, and branch logic. |
| Compatibility | Only a small set of coarse, alias-based profiles exist; other careers can fall back to discovery-only matching. | Create first-class compatibility requirements for each supported catalog career so simulation evidence has a material, transparent role. |
| Result and roadmap | Completed adaptive results, decision review, compatibility presentation, and Build My Roadmap routing already exist. | Preserve the result shell; rename/framing adjustments must remain preliminary, evidence-based, and non-diagnostic. |
| History | Sessions are persisted individually, but the adaptive route exposes resumable/latest state rather than a dedicated history query. | Add an owned multi-session history projection after catalog/graph migration work is stable. |

## Implementation sequence

| Checkpoint | Scope | Independent acceptance condition |
|---|---|---|
| **40** | Introduce the exact fifteen-career catalog, stable career metadata, curated selector contract, and unsupported-career behavior. | Only a supported catalog ID can start a new adaptive simulation; search/filter and unsupported state are testable. |
| **41** | Replace broad/template graph routing with fifteen modular, dedicated career graphs. | Each supported career has at least ten connected nodes and a materially different scenario/decision/consequence set. |
| **42** | Connect catalog selection and individual graph loading into the current student simulation workflow; add session history. | A student can browse, select, run, resume, review, and distinguish multiple supported careers without data overwrite. |
| **43** | Final acceptance, graph-distinctness, privacy, persistence, performance, RLS, and mobile validation. | All uploaded-specification acceptance checks and full regression/type/build pass. |

## Design decisions

The catalog will use stable IDs rather than career-name regexes. New adaptive sessions will persist the selected catalog ID through the existing `scenario_graph_id` path, so future rename or display-copy changes do not remap a saved simulation. Existing saved sessions remain replayable by their saved graph IDs; no saved student session will be rewritten.

The generic engine will remain deterministic. The catalog configuration—not React components or LLM output—will control career description, category, scenario graph, state labels, decision categories, behavioral dimensions, compatibility requirements, and scenario pressure presentation. AI remains outside next-node selection, validity, scoring, and completion decisions.

Every new result will continue to use non-diagnostic language such as **observed decision patterns**, **simulation evidence**, and **preliminary career fit**. Timing remains opt-in, private, bounded, and excluded from score, behavioral evidence, compatibility, roadmap recommendations, public projections, and automatic outcomes.
