# PathPilot Performance Evolution — Checkpoint 10

## Scope

Checkpoint 10 expands the existing deterministic adaptive-simulation engine without replacing its resume, behavioral analysis, or roadmap handoff contracts. It introduces distinct work situations for several career families and persists a short, student-visible consequence record after each decision. It does not claim to diagnose personality or predict career success.

## Career-Specific Simulation Coverage

| Career-family match | Simulation graph | Work situation |
| --- | --- | --- |
| Software, data, and technical careers | Existing software systems graph | Evidence, reliability, user impact, and release trade-offs. |
| Health and care careers | Health & care coordination graph | A supervised care-team planning exercise, handoff safety, and support-plan trade-offs. |
| Design and creative careers | Design & creative systems graph | Conflicting user feedback, prototype review, and a user-centered decision. |
| Business, entrepreneurship, and commercial careers | Business & entrepreneurship graph | A market signal, launch assumptions, customer impact, and a pitch-review decision. |

Each new graph contains a distinct opening, career-appropriate language, multiple branches, and an eight-decision path to a debrief. Existing software paths remain unchanged, preserving active and completed sessions.

## Consequence and Behavioral-Event Foundation

Every selected decision now creates one bounded consequence event. The event records the decision, node context, timestamp, message, and neutral type (`learning`, `caution`, `team`, or `progress`). The client receives only the latest event as **What changed**; private trait signals, weights, and state patches remain server-side.

The new `simulations.behavioral_events` JSONB column is additive, defaults safely to an empty array, and remains inside the existing user-owned simulation record and RLS boundary. Behavioral evidence and completed analysis continue to use the prior deterministic logic; the event timeline is a foundation for later, explicitly scoped longitudinal analysis rather than a new profile claim.

## Validation

| Check | Result |
| --- | --- |
| Supabase migration | Applied successfully. Schema inspection confirms `public.simulations.behavioral_events` is a JSONB column with an empty-array default; simulation RLS remains enabled. |
| TypeScript | `pnpm check` passed. |
| Regression suite | `pnpm test` passed: 27 files and 68 tests. New coverage verifies health/design/business graph selection and student-visible consequence-event generation without public signal leakage. |
| Production build | `pnpm build` passed. Existing deferred rich-Markdown chunk-size warnings remain warnings only. |
| Route and console check | The simulation route resolves through its signed-out access gate in the available browser session. The latest console window contains no client runtime errors. |

## Focused User Acceptance

Sign in and start four short simulations using **Software Engineer**, **Registered Nurse**, **UX Designer**, and **Entrepreneur**. Confirm the opening situations differ appropriately. After each decision, confirm the next situation changes and the compact **What changed** panel reports a direct consequence without showing scoring or trait internals. Refresh after a decision to confirm the same next scenario and consequence remain available. Finish one simulation and confirm the existing results screen and **Build my roadmap** handoff remain intact.
