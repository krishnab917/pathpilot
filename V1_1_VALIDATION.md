# PathPilot V1.1 Validation Record

## Verified Implementation

The V1.1 migration is applied to the connected Supabase project. It adds a singular `country_code` and `education_system` to `student_profiles`, plus an RLS-protected `roadmap_recommendations` table. Existing student profiles, simulations, goals, and active roadmaps are not rewritten by the migration.

| Capability | Verification | Result |
|---|---|---|
| Simulation handoff | A completed Software Engineer simulation was opened in an authenticated session, and its roadmap CTA navigated to `/app/roadmap?simulation=<owned-id>` with the completed debrief intact. | Passes. |
| Contextual recommendations | Server derives recommendations from the stored simulation, profile, goals, projects, active roadmap, and selected country. | Deterministic recommendation tests pass. |
| Student control | The authenticated walkthrough accepted one recommendation into a real goal and roadmap milestone, skipped another, saved a custom title/priority/deadline on a third, and opened the mentor handoff without auto-sending a message. | Passes. |
| Safe country change | The authenticated walkthrough saved `US`, displayed the explicit keep-versus-refresh choice, and refreshed only pending recommendations. A discovered queue-history defect was repaired so dismissed/skipped rows no longer appear in the active queue. | Passes after repair. |
| National context | Initial `US`, `IN`, and `GB` configuration changes recommendation wording without emitting live opportunities, eligibility claims, or asserted deadlines. | Deterministic national-context tests pass. |
| Data isolation | The real Supabase two-user test includes profile country context and a recommendation row; the second user cannot query either. | Passes. |

## Test and Build Evidence

Strict TypeScript checking passes. The Vitest suite has **14 passing files and 34 passing tests**, including adaptive simulation, the simulation-to-roadmap URL contract, recommendation-queue visibility, career-guidance retry and timeout behavior, onboarding null-query, national-context, service-role boundary, and live Supabase RLS tests. The production build completes successfully. The build reports pre-existing large-code chunk warnings from the Markdown/diagram dependency bundle; the mentor renderer remains lazy-loaded and functionality is unaffected.

## Authenticated Acceptance Walkthrough

The connected authenticated session was used to verify the completed-simulation handoff, simulation debrief, country selection, pending-recommendation refresh, add/skip/edit controls, active-roadmap conversion, mentor handoff, and both light and high-contrast dark themes. A separate 375-pixel-wide authenticated frame confirmed that the mobile header collapses to the hamburger navigation and that the V1.1 roadmap debrief, country control, and recommendation rows remain available at the mobile breakpoint.

An authenticated 375-pixel route sweep then covered the overview, discovery, roadmap, simulation, portfolio, mentor, and goals routes in both light and dark themes. All fourteen route/theme combinations applied the requested theme, exposed the mobile navigation control, and rendered without the workspace error boundary. The user’s dark preference was restored after the sweep. The completed simulation results were separately inspected during the V1.1 handoff walkthrough; no active simulation was intentionally created during acceptance testing to avoid leaving an unnecessary in-progress session in the student account.

To complete the active-state check, a controlled Software Engineer simulation was started in the authenticated test account. A separate 375-pixel frame restored Decision 1 with mobile navigation visible and no error boundary. The temporary session was then completed through all eight decisions, returning to the persisted simulation-results state. This confirms both in-progress resume behavior and the completed-results transition without leaving the test session unfinished.

The live career-discovery action did reach the server but the provider did not complete the five-career structured response within the initial test window. The procedure now bounds model-catalog selection to eight seconds and each structured model completion to 45 seconds, preventing a stalled upstream request from leaving the UI indefinitely in the “Analyzing” state while allowing practical time for a five-match response. A future real-session check should confirm a successful five-match response when the upstream provider is available.

## National-Context Boundary

The United Kingdom configuration uses general course-entry planning language because UCAS states that providers set their own requirements, which may include qualifications, grades, admissions tests, interviews, and other course requirements. [1] The India configuration references JEE Main only as a potentially relevant engineering-pathway context because the official site identifies JEE Main and its B.E./B.Tech examination materials; it does not state that any student must take it. [2]

> PathPilot treats country information as planning context, **not** an eligibility determination, admissions prediction, or live-opportunity directory.

## Remaining Acceptance Items

Supabase’s security advisor reports that leaked-password protection is disabled; this is an account configuration issue outside application code and should be enabled in Supabase Auth settings. [3] The public Supabase email-confirmation redirect remains deferred until a stable public URL is available. The live career-discovery success path also remains an upstream-dependent acceptance check because the tested provider response did not satisfy the required five distinct matches.

## References

[1]: https://www.ucas.com/applying/you-apply/what-and-where-study/entry-requirements "UCAS — University Entry Requirements"
[2]: https://jeemain.nta.nic.in/ "National Testing Agency — Joint Entrance Examination (Main)"
[3]: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection "Supabase — Password Strength and Leaked Password Protection"
