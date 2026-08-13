# PathPilot V1.1 Validation Record

## Verified Implementation

The V1.1 migration is applied to the connected Supabase project. It adds a singular `country_code` and `education_system` to `student_profiles`, plus an RLS-protected `roadmap_recommendations` table. Existing student profiles, simulations, goals, and active roadmaps are not rewritten by the migration.

| Capability | Verification | Result |
|---|---|---|
| Simulation handoff | Completed simulation action now routes to `/app/roadmap?simulation=<owned-id>` rather than clearing the result. | Implemented in the simulation component. |
| Contextual recommendations | Server derives recommendations from the stored simulation, profile, goals, projects, active roadmap, and selected country. | Deterministic recommendation tests pass. |
| Student control | Recommendations support add, skip, edit, priority/deadline changes, and an AI-mentor handoff. | Protected procedures and explicit controls are implemented. |
| Safe country change | A country change updates profile context only. The UI offers to keep the roadmap or refresh pending recommendations; it does not rewrite the active roadmap. | Implemented and type-checked. |
| National context | Initial `US`, `IN`, and `GB` configuration changes recommendation wording without emitting live opportunities, eligibility claims, or asserted deadlines. | Deterministic national-context tests pass. |
| Data isolation | The real Supabase two-user test includes profile country context and a recommendation row; the second user cannot query either. | Passes. |

## Test and Build Evidence

Strict TypeScript checking passes. The Vitest suite has **12 passing files and 30 passing tests**, including adaptive simulation, career-guidance retry, onboarding null-query, national-context, service-role boundary, and live Supabase RLS tests. The production build completes successfully. The build reports pre-existing large-code chunk warnings from the Markdown/diagram dependency bundle; the mentor renderer remains lazy-loaded and functionality is unaffected.

## National-Context Boundary

The United Kingdom configuration uses general course-entry planning language because UCAS states that providers set their own requirements, which may include qualifications, grades, admissions tests, interviews, and other course requirements. [1] The India configuration references JEE Main only as a potentially relevant engineering-pathway context because the official site identifies JEE Main and its B.E./B.Tech examination materials; it does not state that any student must take it. [2]

> PathPilot treats country information as planning context, **not** an eligibility determination, admissions prediction, or live-opportunity directory.

## Remaining Acceptance Items

The sandbox screenshot session is unauthenticated, so it can verify access gates but not a student’s completed simulation handoff, recommendation interaction, country-change choice, or light/dark authenticated workspace layouts. A confirmed student-session walkthrough remains required. Supabase’s security advisor also reports that leaked-password protection is disabled; this is an account configuration issue outside application code and should be enabled in Supabase Auth settings. [3]

## References

[1]: https://www.ucas.com/applying/you-apply/what-and-where-study/entry-requirements "UCAS — University Entry Requirements"
[2]: https://jeemain.nta.nic.in/ "National Testing Agency — Joint Entrance Examination (Main)"
[3]: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection "Supabase — Password Strength and Leaked Password Protection"
