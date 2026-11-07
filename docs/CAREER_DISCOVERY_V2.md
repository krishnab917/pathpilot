# Career discovery v2

## Audit and implementation plan (before code changes)

The active React/Vite worktree is `codex/complete-overview-audiences`. It contains 25 source-controlled simulation careers, not 15. The original 15 dedicated graphs and older graph IDs remain readable; new starts use the 25 workbench graphs. `chooseAdaptiveSimulationDecision` validates work, appends decision/evidence/event records and writes results through the existing authenticated Supabase client. Completed runs feed `getBehaviorEvolution` (last five runs), dashboard metrics, and roadmap recommendations. None of those records should be rewritten.

The bottleneck is catalogue coupling: `simulation/catalog.ts` controls both simulation availability and AI discovery's allowlist. `compatibility.ts` compares ten inferred traits only against that catalogue. It does not explicitly model creative, practical, service, or independent-work preferences. Discovery details are private; shared career writes accept authored metadata only. Roadmap requirements have career-specific mappings plus a general fallback. Opportunity domains are a separate taxonomy and must not be invented or silently expanded here.

Migration-compatible plan:

1. Add a validated, authored discovery taxonomy with at least 100 careers across 12 fields, stable IDs, pathway caveats, provenance/review status, and concrete beginner actions. Keep simulation availability separate and retain all 25 IDs.
2. Add a versioned deterministic matching module: distinguish reported preferences, observed actions, and cautiously inferred legacy signals; retain conflicting evidence and missing dimensions. Rank independently of field size and diversify discovery suggestions without disguising diversity as fit.
3. Add short field work samples reusing the existing deterministic artifact checker. Label shared samples honestly; they are not occupation-specific aptitude tests. Store exploration state only in the mounted UI; do not add tracking services or change historical results.
4. Expose the catalogue, explicit preference correction/override, evidence explanations and samples in the existing Discovery screen. Use the existing authenticated history reads for optional legacy evidence. Existing saved analysis, simulations, profile and roadmap persistence remain compatible.
5. Add integrity, synthetic-profile, contradictory/sparse-evidence, stable-ranking and sample-mechanics tests; run offline regressions, type check/build and browser checks where possible.

No schema migration is required for additive authored data and ephemeral comparison preferences. Any future durable v2 evidence storage must be separately versioned and owner-scoped; do not mislabel local samples as saved history.

## Evidence and limitations

Occupational structure references: [BLS Occupational Outlook Handbook](https://www.bls.gov/ooh/occupation-finder.htm), [O*NET Content Model](https://www.onetcenter.org/content.html), and [Apprenticeship.gov](https://www.apprenticeship.gov/). Entries are PathPilot editorial summaries, not imported O*NET measurements. Credential requirements depend on jurisdiction and specialty. Counselor review remains pending; there is no validation against real student outcomes.

Quota remediation, authentication, private-data policies and existing unfinished simulation work remain separate from this change.

## Catalogue and integration contract

There are **108 unique careers, nine in each of 12 fields**: technology; healthcare; business; creative; hospitality; trades; education; public-service; human-services; environment; transport; sport. The taxonomy validation test checks every entry, unique ID/name, field counts, reference resolution and all 25 existing simulation mappings.

`careerSchema` validates stable slug ID, name, field/subfield, responsibilities, skills, environments, work styles, pathways, training caveat, interests, bounded behavioral dimensions, field sample ID, nullable simulation ID, next steps and provenance. Pathways distinguish workplace training, apprenticeship, certificate, associate, degree, graduate and portfolio routes. They are exploratory options, not eligibility rules or substitutes for local licensing advice.

Three different capabilities must remain distinct:

- 108 browsable career records.
- 12 shared, two-stage field exercises, reused across careers in that field. Every stage validates an artifact and allows learning/recovery. They are not 108 authored simulations.
- 25 existing full simulation mappings. Existing IDs, result/history persistence and simulation launch validation remain unchanged.

Discovery's canonical reference resolver is additive. Generated explanations still use the existing private-data boundary; shared catalogue writes accept authored references, not arbitrary model titles. Roadmap selection accepts the expanded canonical taxonomy, with safe exploration actions as fallback and existing career-change confirmation preserved. No database migration is required or executed.

The local comparison does not replace the existing saved five-match AI analysis or legacy simulation scoring. It optionally consumes the existing authenticated behavioral-summary read. Local overrides and field-exercise observations are ephemeral; refresh/remount clears them and does not rewrite profiles or historical runs. Durable v2 evidence storage remains a future owner-scoped design decision.

## Versioned matching and uncertainty

`behavior-mapping-v2.0` accepts only the declared input schema. Signals carry version, stable event ID, context, source (`observed`, `self_report`, `inferred_legacy`), dimension, bounded value, concise evidence and a conflict flag. No protected-characteristic fields are accepted or inferred.

Scoring dimensions are stated interests/selected field (45%), self-reported skills (10%), goals (15%), environment (10%), training routes (10%) and available behavioral evidence (10%). Missing categories are omitted and remaining weights renormalized. Scores are independent of catalogue size; the varied shortlist caps two results per field without changing scores. Ties use stable IDs. Scores are comparisons, not probabilities of success, admission, employment or aptitude.

Keyword matching uses an intentionally small English alias vocabulary and averages support over a multiword term; sharing one generic title word no longer equals an exact specialty match. This is not semantic language understanding.

Signals are deduplicated by ID and aggregated by context. Repeated work in one field sample cannot manufacture independent confidence. Explicit overrides and self-report take priority, while contradictory observations remain inspectable. Mixed observations shrink toward neutral more strongly than consistent evidence. Missing dimensions remain unknown. Confidence is unknown, limited or building; building requires repeated independent observations of a dimension and no unresolved conflict, using the same deduplicated evidence as scoring. Self-reported corrections cannot borrow confidence from the observations they override.

Legacy trait summaries are explicitly inferences, collapsed to one context. They do not invent creative, practical or service preferences. Students can disable inferred evidence, edit preferences, remove a field sample or clear the comparison. Different interests and observed actions remain separate scoring components; the engine does not diagnose a student's personality when these disagree.

## Stabilization pass: confirmed defects and fixes

1. A single behavioral preference previously canceled out in the weighted denominator, giving every career the same behavioral score. Centered preference-by-career interaction now preserves meaningful differences, including a preference for less of a task.
2. The strongest matching word previously dominated a multiword interest. `graphic designer` could rank Game Designer ahead of Graphic Designer. Averaging term support fixes this without changing category weights.
3. Rank-level confidence counted raw contexts even when signal IDs were deduplicated for scoring. It now uses the normalized summary, including override precedence.
4. Restarting the same field exercise on the same stage retained the workbench draft. A generation key now remounts the local workbench on restart.
5. A partial/legacy profile without `careerPreferences` crashed the Discovery render. Optional arrays now initialize safely. The real-screen fixture regression reproduced and verifies this case.
6. Updated the existing workspace source-contract test to require both saved matches and the newly connected profile prop.
7. Changed the UI's unqualified “Typical setting” label to disclose the current broad field-level defaults rather than imply occupation-specific verification.

Files changed in this stabilization pass (separate from the pre-existing implementation):

- `shared/career-matching.ts`
- `client/src/components/CareerExplorer.tsx`
- `tests/career-platform-v2.test.ts`
- `tests/profile-analysis-reliability-ui.test.ts`
- `tests/career-discovery-router.test.ts` (added planning-versus-simulation boundary regression before the interrupted final rerun)
- `client/career-review.html` (new development-only entry)
- `client/src/dev/CareerReview.tsx` (new isolated real-component fixture)
- `docs/CAREER_DISCOVERY_V2.md`

The fixture uses an empty synthetic profile, no authentication or API calls, and a DEV guard. It is not an application route or part of the production build entry points.

## Verification evidence (local, 2026-10-29)

Commands use Node 22 and the repository's installed pnpm. Logs are in `/private/tmp/pathpilot-career-final-*.log`; these temporary logs are not release artifacts.

- `pnpm exec vitest run tests/career-platform-v2.test.ts -t 'career taxonomy v2'`: 7 passed; 27 excluded by the test-name filter at that checkpoint.
- Matching regression reproduction: 2 failed, 14 passed before fixes. Matching rerun: 16 passed after the two ranking fixes; the subsequent confidence test is included in the final full suite.
- Focused integration: `career-platform-v2`, `private-discovery`, `career-discovery-router`, `career-resolver-security`, `career-driven-roadmap-intelligence`, `simulation-work`, `simulation-catalog-launch`: 127 passed at that checkpoint.
- First full offline run: 634 passed, 2 failed (partial-profile crash and outdated prop assertion). Both repaired; focused repair run: 40 passed across 3 suites.
- Full offline rerun: **637 passed across 121 suites**, no failed tests. Includes security/quota, legacy simulation, roadmap, discovery, rendering and public-route regressions. Live Supabase suites are excluded by the established offline configuration, not weakened for this task.
- `pnpm check`: passed after the logic/compatibility fixes. No lint script is configured.
- Production and Vercel-target builds also completed after the compatibility fixes, followed by verification of 12 generated public HTML documents and a secret scan with no findings. The subsequent full-suite command was declined because automatic approval review ran out of workspace credits; it did not execute. The saved 637-test result is a completed earlier run, not evidence for that declined command.

Browser checks used `http://127.0.0.1:3057/career-review.html`, rendering the actual CareerExplorer and SimulationWorkbench with synthetic local state:

- Search, field selection (9 trades results), empty search state, multiword specialty ranking, expanded preferences, explicit override and uncertainty explanation verified.
- Culinary exercise: inspect evidence, incomplete-work feedback, restart clears draft, correct first artifact, changed constraint, second artifact and action-based debrief verified.
- 320px light workbench, 768px dark catalogue and 1440px dark preferences visually reviewed. DOM overflow checks equaled viewport width at 320/768/1440px; expanded preferences also checked at 320px dark.
- Keyboard Tab from search to the native field selector produced a visible solid focus outline. No captured browser warnings/errors during the reviewed interactions.
- Reduced-motion CSS exists and these components introduce no motion framework; OS-level reduced-motion browser emulation was NOT VERIFIED with the available browser controls. Exhaustive screen-reader audit, all 12 exercises manually in browser and all authenticated navigation paths remain NOT VERIFIED.

## Remaining limitations and counselor/staging checklist

- **Occupation-specific mapping quality remains a release review item:** work-setting and behavioral weights still use field-level editorial defaults. For example, research, architecture and hospitality management roles can differ substantially from their field defaults. The UI now discloses this. Do not call these measured occupational profiles or a fully validated recommendation model.
- All 108 summaries and training routes require counselor/local-regulator review; broad BLS group references are not individual verification of every occupation. Check apprenticeship availability, licensing, protected titles and regional credential variation.
- Review non-STEM profiles, mixed interests, low-evidence explanations, tie ordering and the max-two-per-field shortlist with counselors. Equal field counts and deterministic synthetic tests do not establish fairness against real student outcomes.
- Verify authentic account flows in an explicitly approved staging environment: existing history remains readable, all 25 simulation launches, optional history fetch authorization/failure, new career roadmap selection/confirmation, and saved roadmap refresh. No real student records were accessed or written in this pass.
- Verify private discovery ownership/RLS and distributed quotas across actual staging instances under their separate security rollout plan. Offline mocks do not establish hosted multi-instance correctness; production/migrations remain untouched.
- Review keyword-language limitations, field-default accuracy and career-specific source links before representing the catalogue as counselor-reviewed.
- No commit, push or deployment is part of this verification task. Existing visual, SEO, simulation and quota changes remain uncommitted and separate from this pass.

## Resumed final verification — 2026-10-31

Preserved branch `codex/complete-overview-audiences`, HEAD `f67a26329c074d1ab0b5427f9a8d4f4bece73fbc`, and the empty staging index. The existing logs confirm a completed **127-test / 7-suite** integration run and a completed **637-test / 121-suite** offline run. Two boundary tests were added after that offline checkpoint and passed separately; the attempted full rerun was declined, not passed.

This resumption changes only this document and `tests/career-platform-v2.test.ts`. No production source, quota policy, authentication, simulation engine, schema or dependency was changed. The two new test-only invariants verify preference direction/neutrality across all 11 dimensions using otherwise identical synthetic records, and complete-specialty matching using synthetic titles in both catalogue orders. These complement the concrete regression examples without tuning the algorithm to predetermined student outcomes.

Fresh completed checks:

| Check | Actual result |
| --- | --- |
| `pnpm exec vitest run tests/career-platform-v2.test.ts` | 40 passed, 1 suite; 0 failed |
| Focused Discovery integration: `career-discovery-router`, `career-resolver-security`, `private-discovery`, `profile-analysis-reliability-ui`, `palette-preview`, `career-driven-roadmap-intelligence`, `simulation-catalog-launch` | 43 passed, 7 suites; 0 failed |
| `pnpm check` | Passed (`tsc --noEmit`) |
| Lint | Not configured; no lint result claimed |
| `pnpm build` | Passed, including prerender of 12 public routes and server bundle |
| `pnpm test` | **641 passed, 121 suites; 0 failed** |
| `node scripts/verify-public-html.mjs` | Passed: 12 documents, styles, metadata, links and private shell |
| `node scripts/security-scan.mjs --history --built` | 518 source files, history and 486 built files scanned; no findings |
| `git diff --check` | Passed |

Reproduction logs: `/private/tmp/pathpilot-resume-matching.log`, `pathpilot-resume-integration.log`, `pathpilot-resume-typecheck.log`, `pathpilot-resume-build.log`, and `pathpilot-resume-offline.log`. The 641 total equals the previous 637 plus the two previously focused-only boundary tests and the two new invariant tests. No tests were removed or weakened. All approval requests in this resumption succeeded; the earlier review failure was not bypassed.

Compatibility evidence: all 108 entries remain in the browsable ranking (search/field filters and pagination do not apply a score threshold); all 25 full-simulation IDs resolve; legacy history graphs and existing source contracts remain covered by offline regressions. The real-screen fixture exercises an incomplete profile without `careerPreferences`. Replay/override confidence, unknown evidence, contradictions, exact specialty ordering, independent score normalization, private catalogue writes and roadmap-only careers are tested. Quota/security regressions run in the full offline suite; they are not proof of hosted enforcement.

Build warnings remain: large client chunks and third-party Rollup annotation warnings. No warning suppression or unrelated bundle refactoring was performed. No fresh browser pass, live provider test, hosted authentication/RLS test, production migration or multi-instance database test was performed in this resumption. The earlier browser evidence and explicit limitations above remain the scope of visual verification.

**Staging gates remain open:** counselor review of field-level defaults and training pathways; approved staging checks for saved-history reads, roadmap selection/confirmation/persistence, authorization failures, all 25 simulation launches, private discovery migration prerequisites and actual distributed-quota behavior (including direct REST paths). Offline success does not establish career-outcome validity or authorize deployment.
