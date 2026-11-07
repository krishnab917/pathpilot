# PathPilot deployment comparison and staging integration

## Integration sprint — final local verification, November 5, 2026

This section supersedes the Opportunities/Mentor gaps in the historical November 4 audit below. Branch remains `codex/complete-overview-audiences`, HEAD `f67a26329c074d1ab0b5427f9a8d4f4bece73fbc`; all accumulated work remains uncommitted, with an empty index. This resume made no further implementation changes: it reviewed the ten integration files, reran verification after the last corrections, and updated this report. No authentication, quota, provider, database, environment or deployment settings were changed.

### Completed integration and file scope

| File | Integration implemented in preceding sprint; reviewed in this resume |
| --- | --- |
| `server/opportunities/career-alignment.ts` (new) | Canonical 108-career IDs/titles and all 12 fields; word-boundary interest matching; explicit legacy tag compatibility; multi-interest union independent of the four recommendations. Uses `Array.from` consistently with the existing TypeScript target. |
| `server/db.ts` | Existing opportunity RPC receives expanded ranking/filter tags. Mentor optionally reads interests, skills, activities and validated intake using the existing request-scoped client and authenticated owner filters. Earlier unrelated security/profile/simulation changes preserved. |
| `server/opportunities/curated-catalog-source.ts` | Future imports derive subject tags rather than assigning technology/engineering/design/business to every listing. Source URLs, external identifiers and fetch protections preserved. No catalogue refresh or stored-record rewrite was executed. |
| `server/opportunities/relevance.ts` | Explains shared subject tags honestly as broad connections, not exact career fit or eligibility. |
| `client/src/pages/Opportunities.tsx` | Defaults and resets to all directions; career-aligned filtering remains optional. Existing search, pagination, filters, empty states and URL safety retained. |
| `server/mentor-context.ts` | Bounded allowlisted self-reports, editable work preferences, motivations, training pathways, exploration goals and four shared-engine starting fields. No new scorer or provider. |
| `tests/career-system-integration.test.ts` (new) | 21 tests: every career ID/title across 12 fields, cross-field interests, less-common fields, unknown/invalid input, legacy tags, source inference, bounded/missing Mentor context and outside-field exploration. |
| `tests/mentor-intake-repository.test.ts` (new) | Two tests assert owner predicates and allowlisted reads for A/B, omit arbitrary private fields, and avoid intake reads for narrow goal questions. These are mocked repository tests, not live RLS tests. |
| `tests/opportunity-repository.test.ts` | Added multi-field onboarding-only alignment, owner-scoped profile/match reads and explicit unfiltered browsing assertions. |
| `tests/mentor-router-context-boundary.test.ts` | Added authenticated endpoint test proving a forged client user ID cannot select another student's onboarding context; outside-field question retained. |

### Compatibility, privacy and limitations

- All 108 career IDs map to their canonical field; existing 25-simulation launch/history regression suites remain passing. No taxonomy IDs, simulation graphs, histories, opportunity IDs or persisted records changed during this sprint.
- Existing `technology`, `engineering`, `science`, `design`, `business` and `social-impact` tags remain usable through explicit compatibility mappings, including Research Scientist/science and Architect/engineering. These connections are broad, not occupation-specific suitability claims. Historical over-tagged records are **not retroactively repaired**. Such a catalogue cleanup needs separate review and authorization.
- Alignment combines explicitly selected intake fields, interests/subjects, career ideas/preferences and existing saved career directions. It does not use the four starting fields as an eligibility boundary. With no recognized interest tags, the existing no-domain-filter behavior remains; all-direction browsing always remains available.
- Search returns only records supplied by the existing authenticated, paginated RPC. No fallback opportunity, deadline, eligibility, personal score or fabricated record is generated. Unknown source text yields no automatic technology tags. English keyword inference and broad legacy tags can still produce imperfect relevance; manual source/tag review remains necessary, and coverage is limited by the real catalogue. Supporting twelve fields does not create twelve fields' worth of live listings.
- Mentor validates `discovery_intake` with `readIntake`, projects only explicit fields, and bounds legacy lists to 12 entries of 80 characters for matching/context. Structured intake has existing schema bounds (12 fields, 11 preference keys, 9 motivations, 12 subjects/career ideas of at most 80 characters, 7 pathways). Four recommendations contain bounded reasons/cautions and no success probabilities. Existing history/goal/project/simulation limits remain.
- Recommendations use the existing matching engine with onboarding inputs, not a second engine or simulation-score inference. Sparse/invalid intake produces exploratory suggestions rather than a diagnosis. The prompt explicitly permits exploration outside suggested fields. History is limited to the supplied current roadmap and optional latest completed simulation summary; no browsing history is invented.
- New context reads retain `.eq("user_id", userId)` and the request-scoped authenticated client. Mentor's protected handler derives identity from `ctx.user.id`; supplied IDs do not override it. Existing RLS, quota enforcement, provider selection and output/goal-reference validation are unchanged. Offline A/B tests verify application boundaries, **not** newly executed hosted RLS or live model compliance.

### Final executed checks

All results below were obtained after the Set-iteration and legacy-tag corrections, not inferred from the interrupted run.

| Check | Result | Evidence |
| --- | --- | --- |
| Focused Opportunities/Mentor tests | PASS: 45 tests, 7 suites, 0 failed | `pnpm test tests/career-system-integration.test.ts tests/opportunity-repository.test.ts tests/opportunity-relevance.test.ts tests/opportunities-router.test.ts tests/mentor-context.test.ts tests/mentor-router-context-boundary.test.ts tests/mentor-intake-repository.test.ts` |
| Full offline regression | PASS: 700 tests, 127 suites, 0 failed | `pnpm test`; includes simulation compatibility, onboarding ownership, security and quota regression tests. Live disposable-Supabase suites remain excluded by the established configuration. |
| Type-check | PASS, exit 0 | `pnpm check` (`tsc --noEmit`). Earlier TS2802 Set iteration failure is corrected; no compiler settings or assertions weakened. |
| Production build | PASS, exit 0 | `pnpm build`; 12 public routes prerendered; existing >500 kB chunk warnings remain. No deployment performed. |
| Generated HTML | PASS | `node scripts/verify-public-html.mjs`: 12 public documents plus private-shell boundaries; content, metadata, JSON-LD, styles and internal links verified. |
| Diff whitespace | PASS | `git diff --check`, including accumulated tracked changes. |
| Live Preview/browser/provider/RLS acceptance of this integration | BLOCKED / NOT RERUN | No authorized READY Preview of this working tree; no synthetic users created and no hosted writes made in this resume. Prior staging data-layer results below remain historical evidence only. |

Logs: `/private/tmp/pathpilot-integration-final-focused.log`, `/private/tmp/pathpilot-integration-final-offline.log`, `/private/tmp/pathpilot-integration-final-build.log`. Commands ran with the established Node 22 runtime and installed pnpm. Compared with the preceding 675-test/125-suite checkpoint, the sprint adds 25 tests and 2 suites; the final count agrees with the interrupted sprint's 700-test report. Negative-case error logs are expected assertions, not suppressed test failures. No configured linter exists.

### Production route root cause and evidence

The preceding sprint fetched `https://www.pathpilotapp.com/resources` and `https://www.pathpilotapp.com/career-simulations` read-only. **Both returned HTTP 200**, title `PathPilot`, and the same SPA asset `/assets/index-DbirnRGn.js`. They are client-rendered Not Found screens, not HTTP-level 404 responses. Inspection of that public entry bundle found route registrations for `/students`, `/onboarding`, `/app`, `/app/:section` and `/404`, but **neither `/resources` nor `/career-simulations`**. Saved public evidence is `/private/tmp/pathpilot-resources-live.html`, `/private/tmp/pathpilot-simulations-live.html`, and `/private/tmp/pathpilot-production-index.js`; this resume rechecked the captured bundle, not a new deployment.

Immediate cause established: the deployed client artifact lacks these routes. Current local `client/src/App.tsx` registers both, `shared/public-seo.ts` lists both, and `vercel.json` rewrites both to generated public HTML. The final build/HTML verifier passes locally. Current HEAD's committed router also lacks both routes; the required SEO routing/content remains in the accumulated uncommitted implementation. This supports an outdated/incomplete deployed artifact, but does not identify its exact source commit or prove which project/build configuration produced it. No speculative production rewrite or domain change was made.

**Steven must identify the deployment actually assigned to `www.pathpilotapp.com` at the time it served `index-DbirnRGn.js`:** owning team/project IDs, deployment ID and immutable URL, source commit SHA/branch, creation/build timestamp, configured root directory and build command, build logs, and domain assignment. Read-only access to that project's deployment/source/domain metadata suffices for attribution. If Production has changed since capture, use deployment history to identify the captured artifact as well as the current deployment. The accessible Krishna-team SEO Preview is not proof of Steven's production identity; do not guess a SHA from local HEAD.

### Remaining Preview gate

Integration work now precedes Preview acceptance. Steven must approve/provide a separate project with Preview deploy/environment permissions (or perform setup), package the **complete reviewed working tree including intended untracked files**, and use the Preview-only configuration below with Supabase `qekwtncqujusgkjeabyp`. The onboarding column already exists in staging; do not reapply the baseline. Verify exact staging Auth callback origins, no production credentials, noindex/protection, and an independently approved staging model key/budget before synthetic browser and Mentor tests. Production promotion remains separately approved. No new Preview was requested or created in this verification pass.

## Historical deployment comparison — November 4, 2026

Review: November 4, 2026 (America/New_York). Repository: `/Users/krishnabalaji/Documents/PathPilot-marketing-review`; branch `codex/complete-overview-audiences`; HEAD `f67a26329c074d1ab0b5427f9a8d4f4bece73fbc`. The accumulated implementation is dirty/uncommitted; HEAD alone does not identify its contents. This pass changes only this report, not application code, environment variables, database records or Vercel configuration.

## Decision

**A dedicated Preview of the current working tree is required.** The public site is accessible, but its deployment ID/commit and Steven's owning Vercel team are not visible through the connected account. The accessible account's SEO Preview is BLOCKED and predates the current uncommitted work. Supabase staging is ready for scoped application testing; it is not itself a frontend deployment.

No Preview was created in this pass. Project-creation/deployment tools being present does not establish permission or a working deployment path. The connected account exposes only `krishnab917's projects`; project/team responses do not expose effective write permissions, and the existing Preview has an account-configuration block. We did not create an orphan project, change protection, activate billing, transfer a domain or use another identity to work around that block. Steven must provide the project/team access below or perform the Preview setup himself. A separately owned staging project in Krishna's team remains an option only after confirming that intended ownership and resolving/verifying its deployment permissions.

## Repository implementation audit

| Capability | Current source implementation | Limitations / hosted evidence |
| --- | --- | --- |
| Career catalogue | `shared/career-taxonomy.ts`: 108 distinct validated IDs/names; 12 fields with exactly 9 entries each. Skills, responsibilities, pathways, editorial provenance and counselor-review status included. | Static application catalogue, not a guarantee that 108 shared database rows have been materialized. Counselor review pending. |
| Redesigned onboarding | `client/src/pages/Onboarding.tsx`: Context, Interests, Ways to work, Experience, Review; optional skipping, conditional career ideas, draft save, edit, retry feedback and duplicate-submit lock. Strict shared schemas; authenticated profile/draft procedures; legacy normalization. | Required grade/location/country precede optional questions. Real deployed UI/save-retry acceptance remains blocked. |
| Starting recommendations | `shared/discovery-intake.ts`, `StartingFields.tsx`, `CareerExplorer.tsx`: four distinct fields aggregated from the canonical matching engine; reasons, uncertainty, missing dimensions and cautions; editable preferences. | Not aptitude probabilities. Motivations saved for reflection, not salary/outcome prediction. Field-level weights and English keyword matching need counselor review. |
| Complete discovery | Search/field controls and pagination retain all 108 careers; selecting a recommended field is an ordinary reversible filter. All 12 fields remain selectable. | Signed-in production implementation/count not inspected. |
| Saved AI career analysis | Server prompt and canonical resolver accept all 108 career names; exactly five validated saved matches remain a separate existing feature. | This is distinct from the four deterministic starting fields. Requires an approved provider configuration; no live model call made. |
| Roadmap | Expanded canonical resolver and deterministic next-step fallback support all discovery careers. Existing target-change and saved-record behavior retained. | Generic exploration actions are not bespoke professional qualification plans; hosted roadmap persistence not tested here. |
| Simulations | Separate 25-career launch allowlist and work graphs; 12 shared exploratory field exercises. Original dedicated and legacy graphs remain registered; saved graph ID controls replay. | Not 108 full simulations. Simulation-result compatibility still ranks the 25 simulation careers, not the full 108-career taxonomy. Live all-25 launch/progress verification remains pending. |
| Opportunities | Existing authenticated full-text search, category/country/grade/deadline filters, saved states and goal creation remain. | **Partial expanded-catalogue integration:** `server/db.ts:careerDomainsFor` uses regexes for six older domains, based on saved career matches—not the four new starting fields. Chef/Baker can yield no domains; broad substring matching can misclassify titles. If aligned-only is requested with no domains, the query passes a null domain filter. No claim of comprehensive non-STEM coverage is justified. |
| AI Mentor | Existing authenticated contextual guidance supports roadmap target text, legacy career preferences, goals, optional projects and limited simulation summaries. Server quota/error/ownership controls remain. | **Partial intake integration:** `getMentorContextData` does not read `discovery_intake` or the new four-field recommendations. It is not a catalogue-wide recommender. Requires a staging-only provider credential/budget; none configured or invoked here. |

Fields, each with 9 careers: technology; healthcare; business; creative; hospitality; trades; education; public-service; human-services; environment; transport; sport. Education metadata distinguishes workplace, apprenticeship, certificate, associate, degree, graduate and portfolio routes.

### Compatibility evidence

Fresh focused tests verify schema/count/uniqueness/distribution, mappings for every existing simulation ID, unchanged authored simulation descriptions, canonical discovery references, all-career roadmap actions, unsupported simulation rejection, selected-career resume behavior and graph-specific saved-session replay. Legacy graphs remain in `simulationGraphCatalog`; no IDs or historical records were rewritten by this review. This is source/offline compatibility evidence, not validation against existing production student histories.

## Deployment identity and availability

### Public production-facing site

- Browser-confirmed URL: **https://www.pathpilotapp.com/**. Homepage and student page render; public Opportunities sample works. Treat this as production-facing, never as a disposable test target.
- Actual Vercel deployment ID, source commit, branch, build timestamp and dashboard READY status: **NOT VERIFIED**. A working page proves availability, not deployment provenance.
- Vercel deployment lookup for `www.pathpilotapp.com` returned 404/not_found to the connected identity. Alias lookup under the only accessible team also returned 404. Those responses do not mean the public site is down or prove the domain has no deployment.
- The accessible project `prj_MQXYwvfV5lxLjY1RgP5ZLpEIANZF` has an **unverified** `pathpilotapp.com` domain record and a `pathpilot-lime.vercel.app` alias redirecting to the apex. No `www` domain was listed. This is not evidence that it owns or serves Steven's live site. DNS verification/settings were not touched.

### Accessible Preview inventory (not Steven's verified hosting project)

Connected team: `krishnab917's projects`, `team_wxjjMNEiI6Id8RQOo6oGNbUR`. Steven's team is absent from the authenticated team listing.

| Preview URL | Branch / commit | Observed status |
| --- | --- | --- |
| https://pathpilot-bbzjj0ecb-krishnab917s-projects.vercel.app | `codex/seo-aeo-review`, `3944a31909c550cf7632119381d1f9e5e24c2cf3` | BLOCKED; created `2026-10-12T21:33:28.366Z`; ID `dpl_4ycYBwqRQWaJGxJgAtpvFXL4ra4N`. Browser reaches Vercel login. |
| https://pathpilot-oiivy71bw-krishnab917s-projects.vercel.app | `develop`, `b6311ab6cc1327283c895a8ff00d3d5c3a2f1a30` | BLOCKED in API inventory; not opened. |
| https://pathpilot-blkubvuq4-krishnab917s-projects.vercel.app | `fix/production-api-routing`, `e83d788ac8ee516855e7fa33d1967cc8d0204d57` | BLOCKED in API inventory; not opened. |

Latest Preview details link to Vercel's account-configuration troubleshooting. The precise account restriction is not returned; do not infer a billing or membership cause without owner inspection. Protection login and deployment BLOCKED are separate issues. No protection bypass/share token was created. No discovered Preview contains the full current uncommitted implementation; inaccessible deployments in Steven's account remain unknown.

## Browser evidence carried forward (not repeated)

Tests used Codex's in-app browser, signed out, with no forms submitted and no production account created.

| URL / screen | Specific observation |
| --- | --- |
| `/` at 1440 × 900 | Warm-neutral/navy product overview and three audience routes. Large sans-serif hero; local source now uses Source Serif 4 editorial headings and `LandingPlanExcerpt`, absent from the observed deployed hero. |
| `/#opportunities` | Research filter changed 4 listings to 1. Searching `culinary` then showed 0 and a useful reset control. Sample explicitly says not live/personalized; Brookhaven 2026 marked historical. This small sample is not evidence of full catalogue coverage. |
| `/students` | Six-step walkthrough works; “Experience a career” presents a read-only Software Engineer opening excerpt, explicitly not a live simulation. Public tour does not prove authenticated simulation implementation. |
| `/auth` | Labelled email/password sign-in form and account/recovery controls render. Nothing entered/submitted. |
| `/onboarding` | “Start with your account” gate; deployed explanation says roadmap/guidance privacy, whereas local code says answers privacy. Current five-stage authenticated intake not inspectable without a test account. |
| `/app/discover`, `/app/simulate`, `/app/opportunities`, `/app/mentor` | Each renders the signed-out workspace gate rather than the working feature. Correct privacy boundary observed; internal behavior NOT VERIFIED. |
| `/resources` | Rendered 404/Page Not Found, despite route/content existing locally. |
| `/career-simulations` | Rendered 404/Page Not Found; pending observation completed in this pass. Route exists locally. |
| Mobile `/` and `/students` at 320px | Document scroll width equals viewport width (320); headings/buttons wrap, walkthrough tabs form two columns. No horizontal overflow observed on these two public screens. Not a mobile audit of authenticated features. |

Captured console warnings/errors were empty during the signed-out route checks. This is limited to the inspected session, not an exhaustive runtime/network audit. Public screenshots were viewed during inspection; no screenshot files or private traces were saved. Specific observations above are the retained evidence. Viewport override was reset. No homepage checks were repeated in this comparison pass.

## Staging database state

Prior completed hosted checkpoint, not rerun unnecessarily:

- `pathpilot-staging`, ref `qekwtncqujusgkjeabyp`, origin `https://qekwtncqujusgkjeabyp.supabase.co`, separate from production.
- 35-migration baseline initialized, onboarding included once; 26 public tables, 35 policies, RLS enabled on every public table. Repeat initialization preserved the ledger.
- 72 live assertions plus 2 synthetic cleanup checks passed: student JWT REST access, A/B cross-read/write/delete/insert/reassignment denial, anonymous denial, independent SQL-role RLS, draft refresh and preference restoration after new login, training-pathway clearing, legacy field retention.
- Synthetic users/profiles/drafts were removed. No durable browser-test accounts currently remain from that suite.
- Known gaps: nested/oversized intake can bypass application Zod validation through direct owner REST writes; outer object/version DB checks pass. Leaked-password protection advisor warning remains. Browser/tRPC, mail confirmation/recovery, all-feature multi-instance quotas and live AI remain unverified.
- Full evidence and fingerprint: `STAGING_READINESS_REPORT.md` and `STAGING_MIGRATION_AUDIT.md`. **Do not reapply intake or replay historical migrations.**

## Minimum permissions / owner actions

Steven should provide access through Vercel membership/integration authorization, never passwords or tokens in chat:

1. Identify the actual team slug/ID and project ID serving both apex and `www`. In that project's Domains/Production deployment, record deployment URL/ID, commit, branch, timestamp and status. Read-only project/domain/deployment/build-log visibility is sufficient for comparison.
2. For staging execution, grant project-scoped permission to create Preview deployments and manage **Preview-only** environment variables in an approved separate staging project. If project creation is restricted, Steven can create that project first. Grant access to protected Preview pages for authorized testers without disabling protection. No production promotion, domain management, database production access or organization-wide admin is needed.
3. If using Krishna's separate account instead, explicitly confirm that as the staging owner, verify create/deploy/env permissions, and resolve its existing account-configuration block. Do not attach or claim the production domain there.
4. Authorize the specific synthetic-account workflow on the staging Preview: two generated test identities or owner-controlled test inboxes, no real student content, no production writes. Admin-created email-confirmed users test login but do not verify public signup/email delivery; registration needs test inboxes and review of any terms acceptance.

## Exact Preview setup for Steven

Use the existing `DISPOSABLE_STAGING_SETUP.md` runbook, with these current values and gates:

1. Create/select a dedicated staging Vercel project in the intended team. Keep the production project, domains, integration auto-sync and Production variables untouched. Do not auto-import production credentials through an existing Supabase integration.
2. Source must include the **current working tree**, including intended untracked files: taxonomy/matching/intake, new UI, security/quota helpers, simulation graphs, fonts, prerender scripts, public SEO definitions and resources. A Git deployment of current HEAD or the SEO branch alone is insufficient. Review upload paths, exclude secrets/caches/fixtures/logs/unrelated files, and record a content manifest/hash. Do not commit/push as part of this task.
3. Preserve `vercel.json`: Vite, install `npx --yes pnpm@10.34.9 install --frozen-lockfile`, build `npx --yes pnpm@10.34.9 build:vercel`, output `dist/public`, API/function routing and preview noindex. Use the existing supported Node configuration and validate its build; do not rewrite application routing for deployment convenience.
4. In the dedicated project's **Preview environment only**, configure:

| Variable | Value/source |
| --- | --- |
| `VITE_SUPABASE_URL`, `SUPABASE_URL` | `https://qekwtncqujusgkjeabyp.supabase.co` |
| `VITE_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY` | Matching staging public anon key; obtain privately from staging only |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging server-only key, never VITE-prefixed |
| `JWT_SECRET` | Separate cryptographically random staging secret, at least 32 bytes, shared by staging instances |

   Do not configure production LLM credentials. For Mentor/AI analysis testing, separately approve a staging-only provider key/model and bounded spending quota using the repository's existing LLM configuration. Otherwise label live AI tests BLOCKED. No analytics, notification or worker credentials need copying. Preserve rate limits and production-mode safeguards.
5. Use authenticated Vercel CLI or Dashboard under that verified team. Inspect the linked project before upload. Deploy with explicit **Preview** target, never `--prod`/promote. Prefer a stable staging Preview alias for auth callbacks. Record deployment ID, source fingerprint, build logs and READY status. If blocked, resolve with the owner rather than bypassing account restrictions.
6. In staging Supabase only, set Site URL to the approved Preview origin and allow exact `/auth` and `/auth/update-password` redirect URLs. Preserve confirmation and security settings; check `getAuthRedirectUrl` behavior. No broad production wildcard or production callback changes.
7. Verify browser and server resolve exclusively to the staging project, Preview retains noindex/protection, and no inherited environment value references production. Only then enable synthetic writes.

## End-to-end acceptance gates

All following Preview checks are **BLOCKED pending a READY authorized staging deployment**, not replaced by offline or direct REST results:

- Signup/confirmation/recovery, authentication and logout; two separate synthetic sessions.
- All five onboarding stages, optional skips, review/edit, draft restoration, save failure/retry and navigation during pending saves.
- Four field recommendations with evidence; browse/search all 108 careers and every field without recommendation-based restrictions.
- All 25 simulation IDs launch the intended graph, resume/save/complete safely, and preserve synthetic legacy history.
- Roadmap target selection, opportunities filters/save/goal creation, and known non-STEM alignment limitations.
- Mentor normal/error/retry behavior with a separate approved provider and quota configuration.
- Forged IDs and cross-account application calls as well as direct REST; no student session uses service role.
- Desktop/320px layouts, keyboard focus, errors and network targets. Do not describe public-page screenshots as verification of these private screens.

## Tests actually run in this comparison pass

Command: `pnpm test tests/career-platform-v2.test.ts tests/discovery-intake.test.ts tests/simulation-catalog-launch.test.ts tests/career-discovery-router.test.ts tests/adaptive-simulation-engine.test.ts` using the repository's installed pnpm and Node 22.

**90 tests passed across 5 suites; 0 failed**: taxonomy/matching 40, intake 23, launch/history 5, router 12, adaptive engine 10. Expected logs from negative provider-validation tests are not failures. No mocked test is counted as hosted evidence. Full suite/type-check/build and hosted DB tests were not rerun for this documentation-only comparison. Prior results remain separately recorded, not reassigned to a new deployment.

## Recommended sequence

Confirm actual Vercel owner/project → grant least-privilege staging access or have Steven perform setup → build current reviewed dirty source with staging-only configuration → READY Preview and exact staging Auth redirects → synthetic browser/API acceptance → address Opportunities/Mentor integration gaps in separately scoped work → counselor review → independent production-release approval.

No deployment, production configuration change, credential export, synthetic account creation, commit or push occurred in this comparison pass. All pre-existing working-tree changes are preserved.
