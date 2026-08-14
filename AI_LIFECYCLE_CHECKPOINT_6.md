# PathPilot Performance Evolution — Checkpoint 6

## Scope

This checkpoint is deliberately limited to two performance-and-feedback improvements. It does not modify AI prompts, simulation behavior, roadmap persistence, Supabase schema, or the existing utility-first visual language.

| Area | Implemented behavior |
| --- | --- |
| Model selection | The built-in LLM catalog is now cached in the server process for five minutes. Concurrent callers share one in-flight catalog request, preventing duplicate upstream calls during simultaneous AI operations. |
| Failure safety | Only successful model-catalog responses enter the cache. A failed request clears its in-flight state and the next operation attempts a fresh catalog lookup. |
| Server lifecycle boundary | New protected preflight procedures confirm that the signed-in student has completed a profile before the client begins the existing long-running discovery or roadmap AI mutation. They do not change prompts, model choice, validation, or persistence. |
| Career discovery | The discovery section presents **Analyzing your profile** during the protected preflight, **Matching career directions** during the existing AI analysis, and **Ready** only after the mutation returns successfully. |
| Roadmap generation | The roadmap section presents **Building your roadmap** as the operation heading, **Analyzing your profile** during the protected preflight, **Generating milestones** during the existing AI mutation, and **Roadmap ready** only after a successful response. |
| Mentor reply | The mentor chat now replaces its unlabeled spinner with an accessible operation-status row while the submitted question is in progress. |

## Truthful Lifecycle Boundary

The multi-stage UI intentionally corresponds to real procedure boundaries. The first phase is driven by a protected server preflight that verifies profile availability. The second phase begins only when the existing long-running AI mutation is sent. The final phase appears only after that mutation succeeds. The UI does not estimate percentages or claim hidden provider work, and an upstream failure retains the existing retryable error state rather than presenting false completion. Completion remains visible at the section header after a successful discovery or roadmap mutation, so the student does not need to scroll to find the result.

## Validation

| Check | Result |
| --- | --- |
| TypeScript | `pnpm check` passed. |
| Regression suite | `pnpm test` passed: 20 files and 49 tests. The two cache tests cover shared concurrent loading, TTL expiry, and post-error recovery; two router tests cover the discovery and roadmap preflight boundaries. |
| Production build | `pnpm build` passed. Existing large rich-Markdown chunks remain build warnings only; no new build error was introduced. |
| Route rendering | `/app`, `/app/discover`, and `/app/roadmap` rendered their expected signed-out access gate without client errors in the available browser session. |

## Focused User Acceptance

Sign in with a student account, then run one career analysis and one roadmap generation. Confirm that the in-progress lifecycle appears directly below the section header, transitions from the server-backed profile preflight to the existing AI request, and retains a check-mark completion row at the top when results return. Send one mentor message and confirm the labeled in-progress row is visible until the assistant response arrives. A temporary AI provider failure should still surface the existing retryable error state rather than a false completion state.
