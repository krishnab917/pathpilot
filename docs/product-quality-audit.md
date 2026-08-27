# PathPilot Product-Quality Baseline

**Audit date:** 2026-08-27  
**Scope:** Pre-launch journey clarity, action usefulness, progress adaptation, return signals, AI boundaries, analytics, accessibility, and performance preservation.  
**Method:** Source and regression review; signed-out public, authentication, and workspace-shell inspection. No student record, private Mentor context, live AI request, simulation decision, or externally sourced opportunity was accessed or altered.

## Verified current foundation

| Journey concern | Existing, verified behavior | Evidence boundary |
|---|---|---|
| Orientation and primary action | The dashboard renders a current three-step journey panel with one primary CTA, stage labels, and a deterministic route target. | `dashboard-journey.ts`, `DashboardJourneyPanel.tsx` |
| Next Best Action | Server-side priority presently favors a near-due active goal, in-progress project, saved opportunity, missing discovery, missing simulation, missing roadmap, then the first incomplete roadmap milestone. | `server/dashboard/intelligence.ts` |
| Student control | Simulation results link to roadmap creation; roadmap career change requires explicit confirmation; a later simulation never silently changes an active roadmap. | `AdaptiveSimulation.tsx`, `RoadmapExperience.tsx` |
| Roadmap action connection | Recommendation records include career requirement ID/label, student gap, practical tip, country context, verification status, and source label. | `server/roadmap/career-requirements.ts`, `RoadmapExperience.tsx` |
| Country and grade | The deterministic recommendation library uses country planning context and grade-sensitive wording; the roadmap visibly labels current country. | `career-requirements.ts`, `RoadmapExperience.tsx` |
| Actionable project flow | A project-category roadmap milestone can create/open the existing project workspace; editable portfolio drafting remains a separate student-controlled handoff. | `RoadmapExperience.tsx`, `Portfolio.tsx` |
| AI safety | Profile analysis, roadmap generation, Mentor, and project guidance retain protected procedures, bounded context, cache reuse, duplicate prevention, and shared limits from preceding checkpoints. | Existing server contracts and rate-limit regressions |
| Performance and cache safety | Route splitting, skeletons, identity-namespaced React Query state, targeted invalidation, and deferred secondary dashboard requests remain in place. | Previous performance checkpoint and existing tests |

## Confirmed product-quality gaps

| Priority | Gap | Why it matters | Smallest safe change candidate |
|---|---|---|---|
| P0 journey clarity | Discovery is currently a five-row direction table. Its top direction is not elevated into an obvious **recommended career** outcome with a single Build My Roadmap action and a secondary explore action. | A student can understand the data but not immediately understand the next decision. | Reuse the existing first ranked match, language safeguards, and roadmap handoff; add a small result-summary panel without changing recommendation calculation. |
| P0 handoff clarity | Simulation results display five preliminary fits and only generic `Explore another` / `Build my roadmap` actions. | The simulation-to-plan transition does not clearly identify the most relevant default roadmap starting point and why it is provisional. | Reuse current top-fit selection and existing roadmap query-string handoff, with non-predictive language and an explicit alternate-career path. |
| P1 actionable planning | The roadmap already shows requirement, gap, why, tip, country, source, and Add/Skip/Edit. It is not visibly grouped into `Do this next`, `Build your profile`, `Opportunities`, and `Explore`. | High-value primary actions and optional exploration can appear as an undifferentiated queue. | Present the existing `primary` / `explore` metadata in small sections; retain stored order and student controls. |
| P1 Next Best Action | Current priority is deterministic but lacks an explicit concise daily layer and does not inspect open incomplete goals before all roadmap milestones. | Students need a concrete return target that reflects unfinished committed work. | Extend the existing pure server selector with real owned goal/milestone facts only; show its existing rationale and target destination. |
| P1 progress adaptation | Requirement coverage suppresses already evidenced recommendations, but the student-facing roadmap does not explicitly explain the next progression after an action is completed. | Completion should visibly advance the plan instead of feeling like a dead end. | Add reasoned “what changed” copy based on current deterministic recommendation output; do not auto-add, replace, or fabricate new work. |
| P2 notifications and return | Current feedback uses inline lifecycle status and transient success/error toasts. No student-return or persistent actionable notification system was found in the audited client path. | Long AI work and meaningful milestones should have a clear, useful completion signal. | First audit existing notification schema/service and owner-only restriction before adding any student notification or scheduling behavior. |
| P2 analytics | No dedicated client student-product event emitter was identified in the audited client source; the deployment includes generic site analytics configuration. | A pre-launch funnel cannot be assessed without privacy-minimized activation events. | Define a minimal owner-only, aggregate event model only after a separate privacy/RLS design review; never record raw behavioral evidence or Mentor content. |
| P2 verified external actions | The current action library is structured and practical but labels its external availability as general; it does not invent named programs, deadlines, URLs, eligibility, or school offerings. | Real resource enrichment requires source verification and availability maintenance, not placeholder content. | Keep the existing safe general language until a research-and-verification checkpoint is explicitly scoped. |

## Visual baseline

Signed-out desktop inspection confirms that the public landing page offers a clear `Discover my career path` primary CTA, the authentication page is compact and focused on the retained email/password flow, and the protected workspace presents a direct sign-in gate. No horizontal overflow or visible regression appeared in these inspected states. Authenticated dashboard, roadmap, simulation, project, Mentor, and mobile visual acceptance cannot be inferred from signed-out inspection and require a controlled test session.

## Proposed first implementation checkpoint

The highest-confidence first product-quality change is **journey clarity only**: elevate the existing highest-ranked discovery direction, clarify the existing simulation-result roadmap starting point, and organize already-generated recommendation cards by their existing primary/explore metadata. It requires no schema change, external research, notification scheduling, analytics data collection, AI model change, or change to career matching, simulation, roadmap ownership, RLS, caching, or rate-limit policies.

The daily action layer, notification lifecycle, privacy-minimized analytics, verified external resources, and broader retention metrics should each remain separately approved follow-on checkpoints because they introduce different data, scheduling, operational, or consent obligations.
