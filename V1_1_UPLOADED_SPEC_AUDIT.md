# PathPilot V1.1 Uploaded Specification Traceability Audit

## Scope and Decision

The uploaded `pasted_content_5.txt` requests a simulation-to-roadmap conversion loop with national personalization. The restored PathPilot implementation already contains this V1.1 scope. This audit therefore verifies the existing implementation rather than rebuilding or replacing the Supabase, adaptive-simulation, or workspace architecture.

> **Audit outcome:** The requested product loop, student-controlled recommendations, country-aware planning architecture, persistence/RLS boundaries, and validation coverage are implemented. Live opportunities remain deliberately out of scope: PathPilot presents general planning guidance rather than fabricated listings, deadlines, eligibility, or admissions claims.

## Requirement Traceability

| Uploaded requirement area | Implemented evidence | Validation evidence | Status |
|---|---|---|---|
| Phases 1–2: forward simulation handoff | `client/src/lib/simulation-roadmap-handoff.ts`, `AdaptiveSimulation.tsx`, and `RoadmapExperience.tsx` send/consume `?simulation=<uuid>` on the canonical `/app/roadmap` route. | `tests/simulation-roadmap-handoff.test.ts`; authenticated completed-simulation walkthrough. | Complete |
| Phases 3–5: intentional roadmap context, AI-assisted plan, starting recommendations | `RoadmapExperience.tsx`, `server/roadmap/recommendations.ts`, `server/roadmap/recommendation-repository.ts`, and the protected roadmap procedures in `server/routers/pathpilot.ts`. | Deterministic recommendation tests and authenticated debrief/recommendation walkthrough. | Complete |
| Phase 4: student ownership | Recommendation rows expose add, skip, edit, priority, deadline, and mentor-handoff paths. Acceptance converts a recommendation into a persisted goal and roadmap milestone. | `tests/recommendation-visibility.test.ts`; authenticated add/skip/edit/mentor acceptance. | Complete |
| Phases 6–10: singular country and extensible national context | `student_profiles.country_code` and `education_system`; `server/roadmap/national-context.ts` provides extensible initial `US`, `IN`, and `GB` context. | `tests/roadmap-recommendations.test.ts`; `tests/supabase-rls.test.ts`. | Complete |
| Safe country update | `updateStudentCountryContext` updates only profile context. Pending recommendations can be explicitly refreshed; active roadmaps are not overwritten. | Authenticated keep-versus-refresh walkthrough; active-queue visibility regression test. | Complete |
| Phases 11–14: career specificity, redundancy filtering, recommendation reasoning, goal metadata | `server/roadmap/recommendations.ts` derives steps from career, behavioral evidence, grade, skills, goals, projects, and existing roadmap; recommendation persistence stores rationale, estimated effort, priority, deadline, and status. | Country differentiation and redundancy-filtering tests. | Complete |
| Phases 15–18: phases, progress, mentor and simulation context | Roadmap phases are represented in recommendation records and roadmap milestones; goals and milestone progress feed the workspace. Mentor context uses the current profile, roadmap, goals, and recent simulation. | Adaptive-engine, router, and authenticated roadmap/mentor checks. | Complete |
| Phases 19–22: adaptive professional simulation and debrief | Independent simulation engine: `server/simulation/engine.ts`, `behavioral.ts`, `compatibility.ts`, and `contracts.ts`; UI: `AdaptiveSimulation.tsx`. The completed result uses behavioral evidence, context/contradiction insight, compatibility, and a forward “Build my roadmap” CTA. | `tests/adaptive-simulation-engine.test.ts`; authenticated active-session, completed-results, desktop, and 375px mobile checks. | Complete |
| Phase 23 and Phase 27: persistence and authorization | Supabase profile, simulation, roadmap, goal, mentor, and recommendation repositories are user-scoped. Recommendation migration adds RLS policies and ownership indexes; service-role use remains confined to the audited server boundary. | Live two-user RLS test; service-role-boundary tests. | Complete |
| Phases 24–25 and Phase 28: testing and UX validation | TypeScript, 34 Vitest tests in 14 files, production build, responsive route sweep, active simulation resume/completion, and simulation-to-roadmap acceptance were run. | `V1_1_VALIDATION.md` records the test/build and authenticated acceptance evidence. | Complete |

## Deliberately Bounded Areas

| Area | Decision | Rationale |
|---|---|---|
| Country coverage | Start with US, India, and United Kingdom; unsupported countries receive transparent general planning context. | The uploaded specification prioritizes extensibility over encoding every national system. |
| Live opportunities, scholarships, and programs | Do not list live opportunities without verified source, eligibility, URL, and deadline data. | Prevents fabricated or stale claims. |
| Admissions and eligibility | Use cautious planning context only; never declare student eligibility, required examinations, admissions odds, or application outcomes. | These are high-stakes claims outside the supported evidence layer. |
| Supabase confirmation redirect | Deferred at the user's instruction until a stable public deployment URL is supplied. | A temporary preview address should not be registered as a permanent confirmation redirect. |

## Follow-ups and Open Gaps

| Open item | Existing tracking | Concrete next step | Completion condition |
|---|---|---|---|
| Supabase email-confirmation redirect | `todo.md` — “Fix the Supabase email-confirmation redirect so Gmail verification does not return to localhost:3000.” | Obtain the stable published PathPilot URL from the user, register the exact callback URL in Supabase Auth, and run a confirmation-email acceptance test. | A confirmation link returns to the stable PathPilot route rather than `localhost:3000`. |
| Leaked-password protection | `V1_1_VALIDATION.md` — Supabase security-advisor item. | Enable leaked-password protection in Supabase Auth settings and re-run the security-advisor check. | Advisor finding is resolved or documented with an approved exception. |
| Country-resource directory | Deliberately out of current V1.1 scope. | Introduce a verified opportunity-source ingestion and review process before presenting live listings. | Every listed resource has a current source URL, eligibility metadata, verification status, and deadline provenance. |

## Regression Record

The restored project passes strict TypeScript checking, **34 Vitest tests across 14 test files**, and a production build. The production build retains known bundle-size warnings from the lazy-loaded Markdown/diagram dependency set; they do not prevent compilation or the verified product flows.

## Conclusion

PathPilot satisfies the uploaded V1.1 product principle: a student can complete an adaptive simulation, understand the behavioral and career-fit debrief, arrive in a roadmap that explains the source of its recommendations, choose which actions to adopt or modify, preserve their plan while changing country context, and continue with goals and mentor support. The implementation remains modular, Supabase-backed, and safe against fabricated opportunity claims.
