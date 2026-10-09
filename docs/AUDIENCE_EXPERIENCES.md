# Audience product tours

Implementation and review record, October 8–9, 2026. Earlier local-only checkpoints below are historical; the final overview/audience release is described next. No backend or deployment-configuration changes.

## Final overview and audience release — October 9

The existing homepage hero is now the prominent **Product overview**, not a student-only entry point: “Discover your career. Build the path to reach it.” It connects exploration, opportunities, roadmaps, projects, goals, Mentor, and preparation for college applications without promising admissions results. The primary action focuses the nearby audience choices; each choice navigates to a dedicated route. The overview and product demonstrations remain usable without choosing a role.

One shared page renders an audience-configured DOM order, with matching chapter numbers and a tour link to its first section:

- **Student:** Discovery/simulations → Opportunities → Roadmap → Projects → Goals → College preparation → Mentor. Hands-on local examples, with an action into the existing student account flow.
- **Parent:** Discovery → Roadmap → Projects → Goals → College preparation → Opportunities → Mentor. Interpret example work and discussion prompts, then explore the student experience. No parent monitoring or private-account access.
- **Counselor:** Discovery → Opportunities → Roadmap → Goals → Projects → College preparation → Mentor. Investigate options, select discussion priorities, and relate milestones to student-owned work. Contact the team about a student introduction, not an invented institutional dashboard.

All seven capabilities remain. Roadmap highlighting follows the active record rather than its filtered position, and student Goals actions still wrap at 320px. Public samples remain distinct from live personalized results. Parent/counselor references to shared information mean only what a student deliberately chooses to share.

The release includes the complete accumulated Direction C, shared UX system, product presentation, public tours, tests, fixtures, and documentation. The remote deployment-trigger commit `9db832f` was integrated by fast-forward before release validation. The original dirty API-routing checkout was not modified.

Release validation: type-check and production build passed; **395 offline tests across 101 suites passed**, including 13 audience tests. The focused six-suite UI run passed 33 tests. Three live Supabase suites are excluded to protect real student data. Browser reviews include the four entry routes at 320/820/1440px in both themes with no horizontal overflow. Historical checkpoint results below are not substituted for these release checks.

Final release browser checks also passed:

- Homepage choices, audience switching, direct refresh, back/forward, hero focus destination, and tour-start anchors.
- Search, category and career alignment, empty results, counselor discussion priority, parent project inspection, student goal update/reset, college evidence selection, and written Mentor reveal.
- Keyboard walkthrough tabs and audience navigation with visible focus. Reduced-motion Roadmap fallback retains all six chapters; filtered counselor records still highlight the active project.
- Parent CTA and lower-homepage experience links open dedicated audience pages. Student account actions retain the existing authentication path. The Opportunities action reaches the signed-out workspace gate without changing access behavior.
- School referral, sign-in, Privacy, Terms, Accessibility, Support, and footer routes render. No uncaught runtime errors were recorded.

All final source changes were included in the repeated type-check, focused tests, full offline suite, production build, and whitespace checks. Generated screenshots/build output and ignored local dependencies are not release source.

Existing optional analytics-placeholder and large-bundle warnings remain. Public tours and isolated product fixtures do not verify live authenticated persistence or production. Steven should perform a test-account acceptance check after deployment. No Vercel deployment is performed by this task.

## Structure and intent

The general homepage remains a neutral product overview. Its near-hero audience choices now open `/students`, `/parents`, and `/counselors`. `/schools` remains the existing referral page. Each audience route starts at its own hero, includes all seven product chapters, and has a role switcher near the top. Route changes reset demonstration state and focus the new heading.

`audience-experiences.ts` is the audience contract: routes, voice, primary actions, seven feature purposes, and roadmap discussion chapters. `AudienceExperience` owns one shared page shell. `AudienceProductTours` contains audience-aware showcases, not three copied pages. The existing shared Roadmap tour accepts an optional audience; the homepage retains its default behavior.

## What changes for each viewer

| Product surface | Student: what I can do | Parent: what I can understand | Counselor: what I can discuss |
| --- | --- | --- | --- |
| Opportunities | Search, filter category, choose career alignment, inspect product rows | Choose a direction and experience; inspect one listing and practical support questions | Begin with research; search/filter options and inspect requirements before discussing a recommendation |
| Discovery and simulation | Choose an interest, explore the real career selector, navigate the existing six-step walkthrough | Choose an illustrative student response; see possible interests and a conversation question | Begin with an investigative interest; reveal a concrete next experiment and simulation context |
| Roadmap | Follow direction, milestone, experience, project, goal, reflection | Read completed/current/upcoming groupings, with a question at each chapter | Emphasize unfinished priorities and how each connects to one next action |
| Projects | Update local example milestone checkboxes and see progress | Inspect existing example work without changing completion | Inspect the skill → project → roadmap → goal relationship; start with testing/feedback |
| Goals | Try bounded progress updates, completion, and reset | Inspect commitments and support needs; start with opportunity requirements | Select a discussion priority, keeping responsibility with the student |
| Mentor | Reveal a written example answer beside the context it draws on | Switch between the student's question and the parent's supporting role | Begin with human judgment; inspect context and evaluate guidance |
| College preparation | Start with an experience, then project and reflection | Start with tangible project work and questions to ask | Start with reflection and evidence for a discussion, not a readiness score |

All three tours connect direction → opportunities → projects → goals → experiences → reflection. None promises admission or implies that clicking through a demonstration completes real work.

## Product authenticity and privacy

- Reused actual `OpportunityRecord`, career selector/walkthrough, `MentorMessageContent`, progress, buttons, inputs, tabs, and brand components. The public opportunity adapter is shared rather than copied between tours.
- Public examples derive from existing NASA/BNL source structures and the public Hack Club directory, as documented in `LANDING_RESEARCH.md`. Brookhaven's 2026 cohort is explicitly historical. No fabricated deadline, open status, or eligibility decision is supplied.
- Project, goal, roadmap, and conversation records are clearly illustrative. Mentor is a written example, never a simulated provider request or fake streaming response.
- Public demonstration controls are local React state. They do not call authenticated procedures, persist progress, or load student records.
- PathPilot's report-share payload contains limited counts/current focus, not full private goals, project notes, or Mentor history. Published portfolio details are a separate opt-in view. Parent/counselor pages explicitly distinguish a guided tour from a role-specific management dashboard.
- Contact actions use only `krishna@k12worx.org`; existing site policies may also use the approved `vedanth@k12worx.org`.

## Research and adaptations

Category references: [BigFuture planning](https://bigfuture.collegeboard.org/plan-for-college), [Forage](https://www.theforage.com/), [Scoir students and families](https://www.scoir.com/students-families), [Scoir counselor planning guide](https://www.scoir.com/high-schools/college-career-planning-guide-counselors-advisors), and [Xello family guidance](https://xello.world/en/resources/families-student-career-planning/). Principles: show the student's work, give adults a supporting role, and make the next action concrete. Competitors' parent dashboards and institutional tools are not treated as PathPilot capabilities.

Technical sources inspected:

- [React Bits Animated List source](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/AnimatedList/AnimatedList.jsx): restrained item transitions and visible selection. Kept native keyboard behavior instead of copying window-level key interception.
- [React Bits Stepper source](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/Stepper/Stepper.jsx): coordinate selected stage with content. Tour selection is separate from completion.
- [React Bits Fade Content source](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/FadeContent/FadeContent.jsx): threshold-based entrance; implemented with existing Motion, without GSAP or content hidden until scroll.
- [Aceternity Sticky Scroll implementation](https://ui.aceternity.com/registry/sticky-scroll-reveal.json) and [Timeline](https://ui.aceternity.com/components/timeline): pair narrative chapters with a persistent product surface. Adapted to document scrolling, no nested scroll trap or copied template.
- [Motion scroll](https://motion.dev/docs/react-scroll-animations) and [layout](https://motion.dev/docs/react-layout-animations): viewport chapter activation, transform-only tour line, user-driven list movement, and reduced-motion fallbacks.

Motion is deliberately limited to selection, results, short content transitions, and the Roadmap story. No continuous ambient effects, fake loading, new dependency, or external template. Direction C remains unchanged: warm neutral foundation, ink/navy actions, teal selection, restrained green progress. Short laptop windows and mobile use inline roadmap records rather than a clipped sticky panel.

## Files for this audience pass

New:

- `client/src/lib/audience-experiences.ts`
- `client/src/components/AudienceProductTours.tsx`
- `client/src/pages/AudienceExperience.tsx`
- `client/src/pages/audience-experience.css`
- `tests/audience-experiences.test.ts`
- `docs/AUDIENCE_EXPERIENCES.md`

Updated, preserving earlier uncommitted landing/design work:

- `client/src/App.tsx` — dedicated lazy-loaded audience routes.
- `client/src/pages/Home.tsx` — near-hero audience navigation goes to full pages.
- `client/src/pages/AudienceLanding.tsx` — school referral's student link targets `/students`.
- `client/src/components/LandingRoadmapJourney.tsx` — audience-aware chapters, record emphasis, and actions.
- `client/src/components/LandingActionJourney.tsx` — export the existing project example for reuse.
- `client/src/components/LandingOpportunitiesPreview.tsx` — reuse the shared public-record adapter.
- `client/src/lib/landing-opportunities.ts` — shared public-safe record adapter.

Earlier uncommitted palette, design-system, and landing work is not replaced. Backend, routing infrastructure, authentication, Supabase, and AI behavior are outside this pass.

## Validation

- TypeScript: passed.
- Production frontend and server bundle: passed. Existing analytics-placeholder and large-chunk warnings remain; no environment configuration changed.
- Offline suite: 391 tests across 101 suites passed, including 9 audience tests. Three live Supabase suites deliberately excluded.
- Audience tests cover route preservation, seven chapters per role, differing controls, unique IDs, primary CTA styling, privacy boundaries, public data adaptation, and no private-service calls in the demonstrations.
- Browser review is local/public. It does not validate live authenticated student data, production deployment, or a formal accessibility conformance level.

Preview: `http://localhost:3003/`, `/students`, `/parents`, `/counselors`, and `/schools`.

## Final review — October 9, 2026

Resumed the existing detached `ac89407` marketing-review worktree without resetting, rebuilding the design, staging, or changing branches. The earlier audience pages, Color Direction C, and unrelated UI work were already present and preserved.

Two targeted corrections:

1. The counselor tour omits completed milestones. A positional `nth-child(2)` border therefore highlighted the upcoming experience instead of the active project. The shared tour now marks the in-progress record with `data-current`; CSS follows that state, regardless of audience filtering.
2. At 320px, the student Goals demo's progress/reset action row overflowed. The row now wraps. No progress logic changed.

Added two regression tests for these cases. Files touched during this finish pass: `LandingRoadmapJourney.tsx`, `landing-page.css`, `AudienceProductTours.tsx`, `tests/audience-experiences.test.ts`, and this document. No token values, product behavior, backend, authentication, private data, dependencies, or environment configuration changed.

Fresh post-fix validation with Node 22 and pnpm 10.4.1:

```sh
pnpm check
pnpm build
VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=offline-test-placeholder pnpm test --silent --exclude tests/supabase-config.test.ts --exclude tests/supabase-service-role.test.ts --exclude tests/supabase-rls.test.ts
git diff --check
```

Type-check and build passed. **393 tests / 101 offline suites passed**, including 11 audience tests and the palette-contrast checks. The three live Supabase suites were intentionally not run. Existing build warnings remain for unset optional analytics placeholders/the analytics script and large chunks; changing analytics or bundling is outside this final UI pass.

Browser evidence:

- All audience pages: category changes and empty states, visible keyboard focus, role routing, primary CTA destinations, back/forward, and refresh. The counselor mailto destination was inspected without sending a message.
- Verified the corrected counselor milestone border and 320px student Goals layout. Parent and counselor pages also have no document overflow at 320px. Earlier 390/820/1440px light/dark checks remain valid; no layout redesign was made.
- Finished dark-theme product chapter review and preserved prominent college-preparation sections. Public examples and written Mentor responses remain labeled; no additional student visibility is claimed.
- Core Roadmap, Opportunities, Goals, Projects, Mentor, and sign-in reviewed in both themes using actual components with isolated read-only fixtures. Generated fixtures were refreshed from the current build. Shared interactive controls are a separate no-network harness, not an authenticated live test.
- Local runtime checks found no uncaught browser errors. Palette token tests check specified text/control contrast pairs; they are not a full WCAG certification.
- Shared-control checks passed: dialog autofocus, Escape dismissal/focus restoration, and keyboard tab selection. Reduced motion shows inline Roadmap records instead of the sticky animation. Support, school referral, Privacy, Terms, and Accessibility destinations render correctly.
- The Opportunities CTA intentionally opens `/app/opportunities`, which displays the existing signed-out workspace gate. It does not automatically redirect to `/auth`; the gate's Sign in button is the next action. This was inspected without changing authentication.

Final Git state: detached HEAD at `ac89407`; 22 tracked files modified and 28 untracked files, all preserved as local work. Nothing staged. A before/after file-hash inventory confirms only the five finish-pass files listed above changed; no files were removed.

The real preview remains on port 3003. Local screenshots from this pass use `/private/tmp/pathpilot-final-*`. No production verification, live account submission, provider request, database write, commit, push, or deployment was performed.
