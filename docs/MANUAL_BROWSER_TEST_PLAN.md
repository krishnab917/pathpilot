# PathPilot manual browser test plan

## Superseding authenticated QA results — 2026-11-06

The historical checklist below retains its original audit results. For current results, use [the interactive QA report](COMPREHENSIVE_INTERACTIVE_QA_REPORT.md); its traceability table supersedes earlier login/mobile/interaction limitations. The user is authenticated; do not register another account or log out during continued QA.

| Follow-up steps | Expected | Actual/status |
|---|---|---|
| Open Goals at 320/375/768/1440; Edit then Cancel | Actions readable and reachable | PASS after compact-table breakpoint fix; desktop table retained |
| On QA-only goal, +25 then immediately Edit; save; refresh | Pending progress success does not close editor | PASS; QA goal restored at 75% |
| Select Teacher; hide it with category/search; Start | Explicit selection; correct career launches | PASS; Teacher launched and all three stages completed; earlier history retained |
| Browse all twelve Discovery fields, clear, search unmatched text and Chef | Complete catalogue remains available | PASS; nine careers per field, 108 overall; useful zero-result state |
| Complete culinary field exercise and remove comparison | Required work/feedback; no aptitude claim | PASS for exercised flow |
| Opportunities search/country/grade/deadline/category/alignment/reset | Filters and empty state respond | PASS for controls; populated workflow BLOCKED by zero hosted staging listings |
| Mentor empty send, submit QA question, observe failure and draft | Safe unavailable-provider error, draft retained | PASS; actual response BLOCKED by intentionally unset provider credentials |
| New project form; inspect disabled empty submit; close | No accidental record | PASS; complete project CRUD NOT TESTED |
| Homepage six tour tabs, project progress checkbox, guidance and five FAQs | Content responds | PASS; exhaustive public controls not claimed |
| Open Settings directly and refresh; inspect dark mobile | Contents render independently of dashboard cache | PASS; light theme restored |
| Measure fifteen routes at four widths | No document overflow | PASS for sixty measurements; not proof of every panel's visual quality |
| Edit saved onboarding, replace roadmap, logout/login | Preserve existing data/session | NOT TESTED in this QA; use isolated authorized data later |

Retain the labeled QA goal and Teacher run unless safe cleanup is separately available. No goal-delete API exists; do not use privileged cleanup as a workaround. See the report for exact residual data, files and automated results (710 offline tests across 132 suites).

2026-11-05. Full local app: **http://127.0.0.1:3055/auth**. Staging only: `qekwtncqujusgkjeabyp`. No public Preview/deployment. Keep the existing server process running.

Use an inbox you control and synthetic profile details. Do not send passwords, tokens, email-confirmation links or private screenshots to the agent. Register/confirm personally, then sign in. If callbacks fail, the owner must allow the local `/auth` and `/auth/update-password` URLs in staging Auth. Do not disable confirmation/RLS. AI credentials are absent; an approved secure launcher/config update is needed before live AI tests (see audit). Do not assume production accounts exist in staging.

Status legend: **PASS** = actual browser observation; **NOT TESTED** = no claim of completion; **BLOCKED** = named prerequisite missing. Prior-session observations are explicitly marked. Unit tests never count as a browser pass. Record time, account alias, width/theme, sanitized evidence and actual result for each remaining row.

### Latest authenticated checkpoint

The user independently signed in during the audit. Read-only route rendering now passed for onboarding, Discovery, Roadmap, simulation picker, Opportunities, goals, portfolio/projects, dashboard and Mentor shell. Settings was blank on direct navigation; the isolated render fix passed direct refresh. Search across Chef, Electrician, Registered Nurse and Teacher passed; four starting-field panels and108 total careers were visible. No saved answers were changed, no simulation was started and no Mentor message was sent. Remaining workflow rows below remain NOT TESTED even though login is now available. Mentor page loading can initialize a conversation via the existing application handler.

| Additional check | Expected | Actual/status |
|---|---|---|
| Fresh authenticated Settings route, then refresh |Settings content independent of dashboard cache |Initially FAIL (blank); after fix PASS: heading and3 sections visible |
| Search Chef/Electrician/Registered Nurse/Teacher outside starting fields |Relevant entries still discoverable |PASS:2/1/1/2 matching entries respectively |
| Render four starting fields and full catalogue |Four starting panels;108 careers accessible |PASS for rendering/count and cross-field search; loading every record individually NOT TESTED |
| Authenticated320px attempt |Viewport actually320, no overflow |NOT VERIFIED: override left review tab at1280; do not count as mobile pass |

## Public, account and navigation

| Test / steps | Expected result | Actual / status |
|---|---|---|
| Open homepage and three audience routes; refresh/back/forward |Correct general overview and tailored pages; no stale navigation |Prior home/audience render PASS; refresh/history sequence NOT TESTED |
| Open resources and career-simulations |Useful content, no missing-route screen |Prior render PASS |
| Open schools/privacy/terms/support/accessibility and404 |Readable pages;404 UI |PASS: settled page headings verified in resume; arbitrary unknown URL not separately tested |
| Use sample opportunity search/category/alignment; clear filters |User-driven result changes; useful empty state; honest historical/example labels |PASS: unmatched query0 with useful message, clear4, Research1 Brookhaven listing; alignment unchecked without error |
| Switch product tour tabs and roadmap stages; keyboard arrows/Tab/Enter |Visible focus, correct panel/state, no trap |NOT TESTED |
| Open sign-in then Create an account |Labeled fields, password guidance |PASS: rendered name/email/password and12-character guidance; no submission |
| Register with controlled inbox; confirm email; sign in |Only staging account created; return to local app |BLOCKED pending user registration/confirmation |
| Wrong password/reset flow |Safe error; no account enumeration; reset returns to local origin |NOT TESTED; do not submit guessed credentials |
| Signed-out onboarding/Discovery/Roadmap/Simulations/Opportunities/Mentor |Login boundary, no private content |Prior signed-out gates PASS; authenticated behavior NOT TESTED |
| Open dashboard/goals/projects/settings signed out |Same private boundary |PASS in resume: /app, /app/goals, /app/portfolio, /app/settings show PathPilot workspace sign-in boundary |

## Onboarding: run with authorized test account A

| Test / steps | Expected result | Actual / status |
|---|---|---|
| Step1 choose grade/country and synthetic region; try invalid required fields |Clear validation, usable country search |NOT TESTED: login required |
| Step2 choose multiple fields including non-STEM; switch open/ideas |No single-field restriction; relevant follow-up |NOT TESTED |
| Step3 mix skipped/preferences; multiple motivations and training routes |College not mandatory; skipped means unknown |NOT TESTED |
| Step4 enter short synthetic subjects/skills/activities/goals; also test empty experience |Little experience accepted; list bounds explained |NOT TESTED |
| Step5 review; edit earlier steps; return; finish |Latest answers preserved, four starting fields |NOT TESTED |
| Type final field then immediately Continue |Blur/submit saves latest text, no lost last edit |NOT TESTED |
| Save draft midway; refresh, return, logout/login |Step and answers restore from own draft |NOT TESTED; prior data-layer result is not browser evidence |
| Complete profile after draft; refresh |Draft does not override completed profile |NOT TESTED |
| Clear training preference; save; new session |Cleared value stays cleared |NOT TESTED |
| Temporarily use browser Offline mode; Save then restore network and retry |No false success; answers retained; retry works once |NOT TESTED |
| While save pending: double Continue, Back, Back to Discovery/browser Back |No duplicate writes; warn before unsaved loss |NOT TESTED; navigation-loss risk documented |

## Discovery and simulations

| Test / steps | Expected result | Actual / status |
|---|---|---|
| Inspect four starting fields |Reasons tied to input; uncertainty; no success probability |NOT TESTED authenticated |
| Search Chef, Electrician, Nurse, Teacher, Journalist and Accountant |Relevant careers accessible regardless of recommendations |NOT TESTED authenticated |
| Browse all12 fields, clear filters, Show more |All108 careers available, no recommendation gate |NOT TESTED browser; code/tests are separate evidence |
| Override preferences, disable inference, compare conflicts |Explain changes; mark screen-only edits honestly |NOT TESTED |
| Edit saved preferences through onboarding and return |Saved changes affect starting suggestions |NOT TESTED |
| Run shared field exercise |Work/feedback meaningful; not called a dedicated occupation simulation |NOT TESTED |
| Launch full simulation from25-career catalog |Correct role; unsupported careers do not launch nonexistent simulations |NOT TESTED |
| Inspect evidence, submit incomplete then complete work, revise choice |Required tasks enforced, recovery possible |NOT TESTED |
| Refresh/resume/complete/restart; inspect old history |Progress persists; restart does not overwrite history |NOT TESTED |
| Open one run in two tabs; advance each |Stale second submission rejected without corrupting progression |NOT TESTED browser; optimistic predicate verified in code |
| Toggle optional timing and inspect debrief |Timing opt-in; observations not fixed aptitude |NOT TESTED |

## Roadmap, opportunities, projects, goals

| Test / steps | Expected result | Actual / status |
|---|---|---|
| Select non-STEM roadmap career; generate |Relevant bounded plan and local-requirement caveats |BLOCKED for AI generation until provider configured |
| Change career; cancel then confirm replacement |Explicit confirmation; old work preserved |NOT TESTED; partial-write failure is known issue |
| Update milestone progress; revisit dashboard |Consistent aggregate and next step |NOT TESTED |
| Accept recommendation twice/retry after failure |One owned goal/milestone, consistent status |NOT TESTED; nontransactional duplication risk |
| Opportunity search/category/country/grade/date/alignment |Results from real catalog; all directions remain available |NOT TESTED authenticated |
| Search underserved field and clear filters |Honest empty state; no fabricated listing |NOT TESTED |
| Inspect source/eligibility/date, save listing, refresh, create goal |Links accurate; owned save persists; no duplicate goal |NOT TESTED |
| Create/edit project scope/notes/skills/milestones/goal links |Only owned targets; data persists |NOT TESTED |
| Change goal priority/progress/deadline; refresh |Consistent progress and validation |NOT TESTED |
| Inspect dashboard readiness |Must not imply validated college/career preparedness |Source defect VERIFIED; browser not exercised |

## Mentor, sharing, profile and safety

| Test / steps | Expected result | Actual / status |
|---|---|---|
| Ask Mentor without provider configured |Calm error/retry, not fake live answer |NOT TESTED authenticated |
| With approved staging provider, ask about selected and unrelated fields |Context relevant, bounded; freedom to explore |BLOCKED: provider/login |
| Request goal suggestion and inspect review; request priority change |Correct owned action; no unwanted changes |NOT TESTED |
| Retry network/provider failure; refresh conversation |No duplicate messages/actions or false success |NOT TESTED; partial-write risk |
| Edit settings/profile, refresh and new login |Own saved values restored |NOT TESTED |
| Publish then unpublish synthetic portfolio; share/revoke report |Only deliberate public data; private notes omitted; revoked link unavailable |NOT TESTED; publishing requires explicit test action |
| Delete an explicitly disposable account after deliberate confirmation |Only that account removed; logout; proper errors |NOT TESTED; never delete real account for this checklist |
| Sign out/account switch in one browser |No previous student's cached content |NOT TESTED |

## Two-account isolation (separate authorized browser profiles)

| Test / steps | Expected result | Actual / status |
|---|---|---|
| A/B independently save different synthetic profiles/drafts/preferences |Each sees only own records after refresh/new login |NOT TESTED in this browser audit |
| Approved harness: A reads/updates/inserts/deletes B target, then reverse |Every cross-owner operation denied or returns no target rows |NOT TESTED in resume; prior hosted suite passed, separate evidence |
| Forged owner ID to app and direct REST using A JWT |Server derives identity; RLS prevents reassignment/cross-target writes |NOT TESTED in resume |
| Anonymous private REST access; independent SQL authenticated-role check |No private rows; no service-role bypass in tested identity |NOT TESTED in resume |
| Malformed/oversized nested intake via own REST |Desired: rejected; current DB accepts some malformed nested content |Known validation gap; do not mark PASS |

Never test RLS as service_role, disable RLS, expose tokens, or point a harness at production. Use bounded approved fixtures; not a production penetration test.

## Responsive/accessibility and release

| Test / steps | Expected result | Actual / status |
|---|---|---|
| Home/Auth at320px |No horizontal overflow, legible controls |Prior PASS: scrollWidth320, viewport320, screenshots inspected |
| Authenticated screens at320px, tablet and desktop in both themes |Usable filters/tables/composer/dialogs; no clipped controls |NOT TESTED |
| Keyboard Tab/ShiftTab/arrows/Enter/Escape; dialog focus return |Visible focus, semantic labels, no trap |NOT TESTED comprehensively |
| Reduced motion; loading/empty/error states |Readable static fallback; no information hidden by animation |NOT TESTED comprehensively |
| Inspect console/failed requests without exporting secrets |No uncaught errors; expected unavailable integrations clearly identified |Prior public visits: no captured console errors; authenticated NOT TESTED |
| Repeat full checklist on Steven-approved Preview |Same source snapshot, staging-only settings, callbacks and behavior |BLOCKED pending correct Vercel access/deployment |

Do not infer deployed readiness from local success. See `COMPREHENSIVE_ARCHITECTURE_AUDIT.md` for transaction, validation, quotas and privacy release gates. Update actual-result cells only after performing each test.
