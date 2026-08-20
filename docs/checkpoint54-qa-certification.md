# PathPilot Production QA and Release Certification

## Scope and evidence standard

This is a certification audit, not a feature-development release. All findings below are marked **verified**, **unverified**, or **not applicable** based on current code, current database configuration, controlled tests, and rendered route inspections. No conclusion is inferred merely because a historical checkpoint passed.

## Phase 0 baseline

| Area | Evidence | Baseline result |
|---|---|---|
| Repository | Local Git | `main` at `5fcd5a1`; the only pre-audit working-tree change is the tracked QA checklist in `todo.md`. |
| Deployed public release before this audit | Managed project metadata | Checkpoint 53, `5fcd5a1e`. |
| Build validation | Fresh `pnpm test && pnpm check && pnpm build` | **67 test files / 191 tests passed**; TypeScript passed; production build passed. |
| Local runtime log baseline | Recent development and browser-console logs | One historical 2026-08-18 derived-analysis worker failure is present; it predates this audit and needs separate source/worker verification. |
| Production runtime log baseline | Latest 100 deployment log entries | Four normal server-start entries; no production error entry returned. |
| Active database | Live Supabase project inventory | `PathPilot` / `tivwzzstewybodmwhhxg`, status `ACTIVE_HEALTHY`, PostgreSQL 17. |
| Schema ownership baseline | Live schema inventory | User-owned student profiles, goals, roadmaps, simulations, AI conversations/messages, projects, portfolios, recommendations, and opportunity states are present with RLS enabled. |
| Runtime configuration presence | Server-side environment presence check (values withheld) | Supabase URL, explicit service-role key, public Supabase URL/key, JWT secret, and Forge URL/key are all set. |

## Public route review

The public landing page, authentication page, invalid planning-report share route, unavailable public-portfolio route, and unknown route were rendered at desktop width. The landing route, auth form, unavailable states, and intentional 404 each render an understandable page. The invalid share state explains that a link may be expired, revoked, or malformed without revealing student data. The unknown route presents an intentional 404 with a return-home control.

The public authentication form exposes labelled email and password inputs plus account creation and password-recovery controls. Valid sign-up, email delivery/confirmation, password reset, duplicate-account behavior, and real credential changes were deliberately **not exercised** in this audit because they require personal account and email actions; they remain **unverified** pending a user-authorized test account/email pass.

The signed-out `/app` route was rendered directly in the browser and returned an intentional workspace sign-in gate rather than protected data. Focused auth, onboarding-null, sign-out, workspace startup/skeleton, and accessibility regressions passed **6 files / 13 tests**. This provides code and signed-out route evidence for session gating, logout contract, initial loading, and landmark/focus behavior; an end-to-end authenticated browser session remains separately unverified because no credential or account state was changed during certification.

### Verified low-risk accessibility repair

The authentication form displayed successful account-creation and password-reset messages without a live-region role. This is a confirmed accessibility defect because a screen-reader user may not be notified when asynchronous work completes. The form now exposes those non-error notices through `role="status"` and `aria-live="polite"`; error alerts remain assertive through their existing `role="alert"`. Focused authentication accessibility and redirect regressions passed **2 files / 3 tests**, and TypeScript passed. This fix does not alter any authentication request, redirect, storage, or account state.

## Database and security baseline

The fresh live RLS policy inventory shows restrictive ownership predicates for student-owned rows; active opportunity and career catalog reads are intentionally limited; public portfolio reads are constrained to published items; and the background worker credential table has an explicit client-deny policy. The controlled two-user live RLS regression passed all four cases: cross-user private record reads were blocked, cross-user portfolio writes/source-project references were rejected, public portfolio visibility was limited to published items, and a fresh authenticated session restored the owner’s records.

The fresh Supabase Security Advisor reports one unresolved warning: **Leaked Password Protection Disabled**. This is not marked fixed. The advisor points to the Supabase password-security configuration documentation. The fresh performance advisor reports informational unused-index notices, largely for opportunities and user-owned tables; no index is removed during this audit because zero observed usage in the current low-traffic database is insufficient evidence that a production index is unnecessary.

The browser TypeScript/TSX source scan found no privileged service-role, database, or AI credential identifier. A broader built-client candidate filename scan produced minified-bundle candidates, but no browser-source privileged-credential reference was found; this needs a targeted bundle-content review before final certification.

That targeted review is now complete: non-disclosing comparisons found **no** service-role key, Forge API key, or JWT secret value in generated client assets, and no generated client asset contains the `SUPABASE_SERVICE_ROLE_KEY` identifier. The earlier broad candidate filenames are therefore recorded as false-positive pattern matches rather than an exposed secret finding.

The historical local worker error has not been treated as a current production error. The current worker code requires an explicit server-only `SUPABASE_SERVICE_ROLE_KEY`, creates a non-persistent service client only for its constrained processing RPC, and rejects malformed worker tokens before that call. Focused worker behavior remains subject to the dedicated QA pass; no attempt was made to invoke the production worker without its opaque scheduler credential.

### Live isolation and integrity verification

The controlled live RLS test created two temporary confirmed users, exercised cross-user reads and writes, and removed the temporary users afterward. Its results confirm that private profile, goal, roadmap, simulation, AI conversation/message, project, roadmap-recommendation, opportunity-state, and private-portfolio reads are blocked across users. Public portfolio data is readable only when published, and foreign source-project ownership is required for portfolio writes. A fresh authenticated session restored the original owner’s records.

The separate read-only aggregate integrity query found **zero** orphaned goals, roadmaps, simulations, projects, portfolio records, milestones, project-goal links, or student opportunity states across the checked production relationships. Focused Supabase configuration, service-role boundary, performance-migration, live RLS, and service-role client checks passed **5 files / 11 tests**.

The active security advisor warning remains the plan-dependent leaked-password-protection setting. No advisor P0 data-leak or missing-RLS finding is present. Performance advisor results are informational unused-index notices only and are retained for post-beta traffic review rather than changed speculatively during certification.

## Public-route result summary

| Route/state | Result |
|---|---|
| `/` landing page | Verified rendered and responsive at desktop. |
| `/auth` authentication form | Verified rendered with labelled controls; account-changing paths unverified. |
| `/share/invalid-qa-token` | Verified intentional unavailable state. |
| `/portfolio/no-such-qa-handle` | Verified intentional unavailable state. |
| Unknown route | Verified intentional 404 state. |

### Production boot observation

The live `pathpilot-s64joaqq.manus.space` landing route initially displayed the designed route-loading skeleton and then resolved to the full PathPilot landing content on a follow-up browser observation. The final public page exposed the primary discovery CTA, the five-stage journey, the Act-stage conversion CTA, and the closing invitation. No production console/runtime error was surfaced during that check.

### Public responsive evidence

Full-page renders of the landing and authentication routes were inspected at **375 px**, **390 px**, **768 px**, and desktop width. The public views retain readable copy, labelled inputs, visible primary controls, and no observed horizontal clipping or overflow. This covers only unauthenticated views; authenticated dashboard, simulation, roadmap, project, portfolio, opportunities, and mentor mobile workflows remain **unverified** because the audit did not create or alter a user session.

## Performance and release-risk observations

Direct production `curl` measurements returned HTTP 200 for the landing and authentication pages, but the sandbox-observed public landing response was slow: **7.06–12.95 seconds total** across three later requests, with **2.39–4.72 seconds TTFB**; the first observed landing request was **13.55 seconds total / 2.59 seconds TTFB**. Local preview TTFB was approximately **0.08 seconds**. These measurements are environment-sensitive and do not isolate client parsing, but they are sufficiently high to record as a **P2 performance concern** for a public student beta.

The production build succeeds but retains the existing bundle-size advisory for chunks exceeding 500 kB. No speculative code splitting or hosting change is applied in this QA-only pass. The managed deployment uses Autoscale hosting, for which cold starts may occur; Reserved Hosting removes cold starts but would be a usage-billed operational decision rather than a verified code defect. AI first-token/completion latency and authenticated boot timing remain unverified because no provider-backed or user-owned request was run.

## Country, discovery, and simulation QA

Focused country, discovery, curated-catalog, graph, terminal-state, response-timing, behavioral-evolution, recommendation, and roadmap-handoff regressions passed **13 files / 52 tests**. These checks establish the following implementation contracts:

| Contract | Verified evidence |
|---|---|
| Country-aware guidance | US, India, and UK roadmap contexts are differentiated in the recommendation rules; unsupported contexts use transparent guidance rather than invented national requirements. |
| Discovery reliability | Invalid guidance responses are retried to a bounded budget and return a typed gateway error rather than accepting malformed career matches. |
| Controlled simulation catalog | The selector has exactly 15 supported catalog IDs, complete selection metadata, unique icons, and strict unsupported-ID rejection. |
| Career-specific environments | Dedicated graph sets cover all 15 careers with distinct professional contexts, ten authored decision stages, three safe terminal branches, reachability, and divergent opening paths. |
| Deterministic branching | Choice routing is reproducible and distinct decisions lead to meaningfully different scenarios. |
| Simulation versus recommendation independence | Completion compares observed behavioral evidence against all supported careers; the selected simulated environment does not constrain the rankable recommendation set. |
| Student safeguards | Terminal outcomes remain reviewable/non-shaming; optional response timing is consent-gated and excluded from scoring and recommendation contracts. |
| Roadmap handoff | Completed simulation results retain a tested handoff into the roadmap flow. |

The discovery test intentionally logs a mocked malformed-model-response failure while asserting the bounded error path; that expected test fixture output is not a production failure.

## Roadmap, workspace, portfolio, opportunities, mentor, and notification QA

Focused product-flow coverage passed **20 files / 59 tests**. The validation covers country-aware editable roadmap recommendations, roadmap-to-project foundations and persistence, user-scoped project-workspace repositories/procedures, public/private portfolio publication and owner/source-project enforcement, opportunity search/filter/pagination and relevance explanations grounded only in saved direction plus organizer-published fields, student opportunity states, mentor context/rendering, notifications, share-report privacy, dashboard next-action transitions, and user-scoped AI-result caching.

Project-guidance tests deliberately emit a mocked malformed JSON failure while confirming that malformed AI output is rejected rather than converted into fabricated guidance. This is expected fixture output, not a live provider incident. Live AI latency, token streaming, and external-provider failure/retry UX remain **unverified** because no user-owned project, mentor conversation, or provider-backed request was modified during certification.

The live RLS regression independently verifies portfolio public/private behavior and cross-user source-project enforcement. No unsupported claim about an opportunity’s eligibility, deadline, or behavioral fit is introduced by the tested relevance contract.

## Final validation

The post-fix release command, `pnpm test && pnpm check && pnpm build`, completed successfully. The final automated suite result is **68 test files / 192 tests passed**. TypeScript validation and the production build both passed. The only build message is the pre-existing chunk-size advisory described above; it is not a build failure.

## Finding classification

| Priority | Finding | Status | Release treatment |
|---|---|---|---|
| P0 | Cross-user data exposure, missing RLS, client secret exposure, broken protected-route gate, or production build failure | **Not found** | No P0 release blocker is open. |
| P1 | Core functional regression across roadmap, simulation, persistence, portfolio, discovery, or authenticated session contracts | **Not found in controlled checks** | Code and live RLS evidence passed; full authenticated browser journey remains manual evidence, not a confirmed defect. |
| P2 | Public production TTFB/total response time is materially slow in the sandbox measurements | **Open** | Monitor early-beta telemetry; assess request warming, bundle splitting, and/or a hosting-mode change only with production traffic evidence. |
| P3 | Auth success/recovery notices lacked a polite screen-reader announcement | **Fixed** | Fixed with `role="status" aria-live="polite"` and protected by `tests/auth-accessibility.test.ts`. |
| P3 | Supabase leaked-password protection is disabled on the current Free-plan organization | **Open, plan-dependent** | Enable when the organization is on a Supabase plan that exposes the setting; this is not remediable in application code. |
| P3 | Performance advisor identifies currently unused indexes | **Open, informational** | Retain indexes during low traffic; revisit with representative production query data rather than removing them speculatively. |

## Explicitly unverified evidence

The following operations were intentionally not performed because they would alter an account, consume AI-provider capacity, or require an authenticated user/browser session. Their absence is documented as an evidence gap, not represented as a passing result.

| Item | Why it remains unverified | Required acceptance action |
|---|---|---|
| Email confirmation delivery and callback | Requires access to a real mailbox and confirmation link. | Create a disposable test account, complete the email confirmation link, and confirm arrival at the deployed domain. |
| Password-reset email delivery and recovery | Requires a real mailbox and password mutation. | Request reset, complete the link, sign in with the new password, and confirm the prior password is rejected. |
| Duplicate-account UX | Requires a test registration attempt. | Attempt a second registration with the same address and confirm the error is clear and non-enumerating. |
| Full authenticated browser journey | Audit did not create or modify a persistent student session. | Complete onboarding, a simulation, results-to-roadmap handoff, goal/project changes, refresh, sign-out/sign-in, and restore verification on desktop and mobile. |
| Live AI operations | Requires a provider-backed request with user-owned data. | Exercise discovery, roadmap generation, project assistant, and mentor; record error, timeout, and loading behavior. |
| Production worker schedule | Requires observing the opaque production scheduler invoking the constrained worker. | Trigger an eligible derived-analysis job and verify worker completion/recovery in managed schedule logs. |

## Certification decision

**Release status: READY WITH MINOR ISSUES — conditional beta release.** The application has passed its final automated regression, static type, and production-build gates; live database integrity and two-user RLS isolation checks pass; public routes and signed-out protection states render intentionally; and the only confirmed application defect found in this audit has been fixed and regression-tested. No P0 data-isolation, exposed-secret, or build-blocking defect is open.

The recommendation is conditional because production response timing is a P2 user-experience risk, leaked-password protection is a P3 organization-plan configuration gap, and email/account, authenticated end-to-end, live AI, and worker-scheduler operations require the explicitly listed manual acceptance evidence. This certification does **not** claim those unexecuted flows passed. The next release should not expand product scope until the manual acceptance table is completed and early-beta performance telemetry is reviewed.
