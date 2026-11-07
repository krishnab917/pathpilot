# PathPilot visual refinement — October 18, 2026

## Observed baseline

Reviewed the existing Direction C worktree, preserving its SEO and unfinished simulation changes. Baseline screenshots are stored outside the repository in `/private/tmp/pathpilot-visual-review-20261018`.

- Homepage and audience headings dominate the first screen at up to 91px, with tight tracking and long introductory spacing. Product examples start below a full desktop viewport.
- DM Sans is used for every role. Display titles, workspace titles, and compact labels differ mainly in size and weight; the product has little typographic character.
- Public sections repeatedly fade between neutral surfaces. The palette is strong, but repeated fades and oversized titles flatten section hierarchy.
- Workspace tables, metadata, and action links are often 10–12px while surrounding panels have ample space. Roadmap milestones have nearly identical surface emphasis regardless of state.
- Mentor messages span long lines and occupy a large generic chat panel. Auth uses an error color for its successful notice.
- Direction C already has strong semantic colors, visible selection, reusable product tours, and audience-specific ordering. Preserve these.

## Intended refinement

Keep DM Sans for body and controls; add Source Serif 4 for display and page titles only. Self-host Latin variable WOFF2 subsets under their OFL licenses with `font-display: swap`. Use an explicit hierarchy and comfortable line widths; retain sans-serif section titles inside product records. Reduce marketing title size and section padding, remove repeated decorative fades, and bring a real, clearly labeled planning example into the overview. Keep audience-specific content, all product features, and college preparation visible.

Refine shared headers, labels, tables, timeline states, feedback, controls, and Mentor readability before page-specific work. Do not change authentication, routing, API calls, database behavior, or simulation logic.

## Completed implementation and final review

- Retained Direction C. Source Serif 4 distinguishes display/page headings; DM Sans remains the working font for records, forms, navigation, and body copy. Local font files total approximately 90 KB, with their original OFL notices and `font-display: swap`.
- Public headings and section spacing are more restrained. The homepage now pairs its overview with the existing illustrative roadmap story. Student, Parent, and Counselor tours retain their different content, ordering, interactions, and privacy boundaries. School referral headings use the same type tokens.
- Shared page headers, record titles, table metadata, current/completed roadmap states, Mentor reading width/composer, and sign-in success notices use the refined hierarchy and semantic colors.
- Final browser review found 29px mobile tabs and a 16px dialog close target. Both now have 44px minimum targets. Dialog headings have 1.35 line height and space reserved for the close control. Keyboard arrow selection, Escape closing, and focus return were verified with the real Radix components.

## Verification after the final CSS and school-page edits

- TypeScript check: passed.
- Full offline suite: 492 tests across 106 suites passed. The three live Supabase suites were excluded; no live student data was accessed or mutated.
- Focused visual, audience, landing, contrast, accessibility, and loading checks: 39 tests across nine suites passed. Real-screen fixtures were regenerated from the final build.
- Production build: passed, including prerendering of 12 public routes. Existing large-chunk warnings remain, including the lazy rich Mentor renderer.
- `git diff --check`: passed. Nothing staged, committed, pushed, or deployed.
- Browser review covered representative desktop (1440px), tablet (820px), and phone (320px) layouts, light/dark themes, public tours, school referral, sign-in, and shared controls. Core Workspace, Roadmap, Opportunities, Discovery, Projects, Goals, Mentor, and Settings were inspected with isolated fictional fixtures. Inspected narrow screens had no page-level horizontal overflow.
- Live public interactions checked: audience navigation, Opportunity category/search updates and empty state, project milestone completion, goal progress, Mentor example disclosure, school refresh, and browser back/forward. These demonstrations perform no live writes. Browser error logs were empty for the inspected controls.
- Reduced-motion scrolling has a passing focused test, and CSS disables transitions/animation under the media preference; Motion components retain their reduced-motion branches. OS-level reduced-motion emulation was not available through the current browser interface, so no full visual emulation pass is claimed.

## Review boundaries

Authenticated fixtures are rendered from real components but are deliberately unhydrated and cannot validate authenticated saves, provider requests, or database persistence. Those require a separate disposable test account. The simulation workbench was visually inspected at 320px without editing its engine or data. Its development-only review toolbar compresses the career selector at that width; this is not the production career selector and was left with the ongoing simulation work.

Before/after screenshots are in `/private/tmp/pathpilot-visual-review-20261018`. Final dialog and Roadmap captures supplement the existing full-screen comparison set. All accumulated SEO and unfinished simulation changes remain in the original worktree.

## Follow-up review — October 20, 2026

The existing visual implementation was retained, including both self-hosted font families, Direction C, audience-specific layouts, the planning example, and shared product hierarchy. No new palette, font, dependency, or page redesign was introduced.

Two code-level shared-control issues were corrected:

- The corner dismiss button now has an explicit `data-dialog-dismiss` marker. Its 44px sizing and positioning rules no longer apply to arbitrary consumer-provided `DialogClose` actions.
- Keyboard-focused tab panels now have a visible two-pixel semantic focus outline rather than only `outline-none`. Radix selection and keyboard behavior remain unchanged.

Added three regression tests for these CSS/component contracts and the nonblocking local-font setup. These are source/CSS contract checks, not browser geometry tests.

Fresh verification: 495 offline tests across 107 suites; 42 focused tests across ten suites; TypeScript check; production build; generated-HTML verification of all 12 public pages; and `git diff --check` passed. The three live Supabase suites remained excluded. Existing large-chunk warnings remain.

Fresh browser inspection was blocked by the browser tool's URL security policy on the existing localhost page. No alternate browser surface or workaround was used. The earlier temporary screenshot files were unavailable in this session, so no new before/after or responsive/theme/browser-interaction verification is claimed. Those checks must be repeated when browser access is restored, particularly the tab-panel focus ring and unchanged 44px corner dismiss button.

Only `client/src/components/ui/dialog.tsx`, `client/src/design-system.css`, this review document, and the new `tests/visual-control-contract.test.ts` were changed in this follow-up. Existing SEO, simulation, and other visual work remains unstaged and uncommitted. No production settings, authentication, student data, backend behavior, or deployment settings were changed.
