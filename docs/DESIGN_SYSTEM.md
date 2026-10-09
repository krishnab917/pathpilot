# PathPilot product UI

## Audit and active architecture

The active shell is `pages/Workspace.tsx`, not the older `DashboardLayout` template.
The same file retains older local Discovery/Roadmap/Mentor/Goals implementations;
the live route map uses ReliableProfileAnalysis, RoadmapExperience, CompactMentor,
CompactGoals, Opportunities, and Portfolio. Those are the upgrade targets. Legacy
implementations are not deleted as part of a visual change.

Existing Radix/shadcn primitives already cover buttons, input/textarea, selects,
tabs, dialogs, drawers, menus, tooltips, badges, alerts, skeletons, and progress.
Keep their keyboard, composition, and focus-management behavior. Avoid a second
component library. No dependencies were added.

Repeated patterns found: three page-header implementations; raw percentage cells
in roadmap/goals/projects; unrelated empty/error treatments; desktop-only wide
tables; global motion suppression and workspace-wide radius/shadow overrides.

## Foundation

`client/src/design-system.css` is imported by index.css. Existing semantic colors
and DM Sans remain authoritative. The foundation defines control heights, panel
radius, elevation, layout width, sidebar width, title scale, motion, and focus.
Tailwind's existing quarter-rem spacing scale is retained. Breakpoints remain
640 / 768 / 1024 / 1280 px; no independent JavaScript breakpoint system is added.

Surface hierarchy: background → card → secondary/inset → selected primary tint →
portal overlay. Color values flow from the existing light/dark variables.
Use surface-panel for sections, not arbitrary border/radius/shadow combinations.
Control motion is 140ms, progress/content motion 220ms, page motion 320ms. Animate
state changes, never fake completion. Reduced motion removes transitions and
reduces animations to a single immediate frame. Do not animate layout on hover.

## Shared product patterns

- PageHeader: page-level title, eyebrow, useful description, wrapping action area.
- FeedbackState: empty/loading/error semantics and caller-owned recovery actions.
- ProgressIndicator: finite bounded saved progress, visible text, accessible value.
- PathTimeline: numbered saved milestones; complete/current/upcoming states; caller
  supplies existing actions. First incomplete is a reading aid, not a prediction.
- pp-nav-item: quiet navigation with an explicit current-page marker.
- pp-action-row: consistent opportunity/list density and hover feedback.
- pp-responsive-table: existing Goals/Projects tables become labeled records on
  mobile without duplicating mutations or rendering two interactive copies.
- pp-guidance: contextual assistance without introducing a separate AI aesthetic.

The product roadmap uses PathTimeline; the public roadmap tour shares the same
saved-state vocabulary and progress primitives with clearly labeled examples.
The Opportunity demonstration immediately after the overview remains interactive
and public-safe, never live personalized data.
Landing fades use theme surfaces rather than hardcoded white backgrounds.

## Interaction boundaries

Backend, authorization, AI contracts, persistence, rate limits, and configuration
are unchanged. Existing pending flags and invalidations remain. Mentor draft
preservation and deadlines remain; IME composition cannot inadvertently submit.
No optimistic persistence or fabricated loading stages are introduced.

References: React Bits Stepper (state markers and connectors) and Animated List
(quiet item feedback), adapted with native semantics and CSS rather than copied
effects or global keyboard handlers. Radix accessibility guidance informs the
retained dialog/menu/tab focus patterns.

## Review requirements

Check actual authenticated data flows separately from fixture-rendered UI. Never
call offline or synthetic checks production verification. Test narrow screens,
dark theme, reduced motion, keyboard focus, long text, empty/error/pending states,
and confirmation dialogs. Live Supabase mutation suites require a disposable
test project, not existing student data.

## Change inventory for this product-system pass

New files:

- client/src/design-system.css
- client/src/components/ProductPrimitives.tsx
- client/src/components/PathTimeline.tsx
- tests/product-primitives.test.ts
- docs/DESIGN_SYSTEM.md

Existing files updated:

- client/src/index.css
- client/src/components/ui/button.tsx
- client/src/components/ui/progress.tsx
- client/src/pages/Workspace.tsx
- client/src/components/RoadmapExperience.tsx
- client/src/components/UtilityWorkspaceSections.tsx
- client/src/pages/Opportunities.tsx
- client/src/pages/Portfolio.tsx
- client/src/components/ReliableProfileAnalysis.tsx
- client/src/components/AIChatBox.tsx
- client/src/components/AiPendingStatus.tsx
- client/src/components/WorkspaceSkeletons.tsx
- client/src/pages/Auth.tsx
- client/src/pages/UpdatePassword.tsx
- client/src/pages/Onboarding.tsx
- client/src/pages/Home.tsx
- client/src/pages/AudienceLanding.tsx
- client/src/components/LegalLayout.tsx
- client/src/components/LandingActionJourney.tsx
- client/src/components/LandingOpportunitiesPreview.tsx
- client/src/components/LandingWalkthrough.tsx
- client/src/pages/landing-page.css

Earlier uncommitted landing copy, example data, and landing tests remain in the
worktree. They were not overwritten or committed. The temporary isolated browser
harness was removed after review. No backend, API, configuration, dependency,
schema, or credential files were changed.

## Validation record

TypeScript and production build passed. Full offline regression: 97 suites,
370 tests passed, including 9 landing tests and 3 new presentation-contract tests.
Excluded only the three documented live Supabase integration suites. Build still
reports existing analytics placeholders and large chunks.

Public/authentication entry pages were reviewed in the browser. Actual Roadmap,
Goals, Projects, Opportunities, Discovery, and Mentor components were exercised
with synthetic data in a temporary isolated harness with no backend link.
Verified milestone update, goal editing, project opening, opportunity filtering,
Mentor pending → failure → preserved draft → retry → successful response, dialog
Escape, keyboard-accessible controls, mobile/tablet/desktop layout, dark theme,
and reduced-motion styles. No horizontal overflow or runtime errors observed in
these checks. This does not verify authenticated sessions or live persistence.
The signed-in end-to-end flow, real account settings, and production/provider
behavior still need a test-account acceptance pass before release.
