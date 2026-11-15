# Full product deployment audit and handoff

Audit date: November 15, 2026. Repository: `krishnab917/pathpilot`.

## Decision

The completed platform implementation is on GitHub main, not just SEO. PR #2 merged all 182 paths from `5a4be248e2ab24693e00636441c74ea70908c796` through merge commit `398960463fa20bec37ca0b6784f1e39535e4f8c8`. SEO handoff commit `7355637709912e1819c4e4c135cce9299cf3a6c5` follows it. Tree comparison proves the merge retained the entire feature tree; the only subsequent difference before this audit was the SEO handoff document.

**Source integration and local verification pass. Whole-product production readiness remains conditional, not certified.** Important integration, reliability, hosted configuration and privacy gates below remain open. No deployment, production database access, migration execution, credential change or email was performed.

## Git completeness audit

- Main and the feature branch were fetched and compared; the platform commit is an ancestor of main. No open PRs were returned at audit time.
- Remote `develop`, `dev/stevel`, and `fix/production-api-routing` have no commits outside main's history.
- `codex/seo-aeo-review` has an unmerged historical commit, but its substantive SEO files are already preserved in main, with subsequent fixes. Reapplying its older tree would regress later changes.
- The release worktree `/Users/krishnabalaji/Documents/PathPilot-marketing-review` was clean on main before this document.
- The separate `/Users/krishnabalaji/Documents/PathPilot` checkout contains 20 tracked modifications and 15 untracked files. Every one of the 35 file contents was hashed and matched to a version already committed in main's history (including `ac89407`, `323d8dc`, `a3a7cb8`, `4f780cc`, `a7d4c42`). These are historical working copies, not 35 missing product implementations. They were preserved untouched, not restaged or overwritten. Some differ from current main because main has newer changes.
- The two temporary SEO/main worktree registrations point to nonexistent directories; their branch commits remain preserved. No cleanup was performed.

The preserved older checkout's paths are: `client/src/App.tsx`; components `AIChatBox`, `LegalLayout`, `RoadmapExperience`, `UtilityWorkspaceSections`, `AiPendingStatus`, `LandingWalkthrough`; libraries `landing-copy`, `ai-error-message`, `ai-request-deadline`, `landing-product-examples`; `client/src/main.tsx`; pages `Accessibility`, `Home`, `Privacy`, `Support`, `Terms`, `AudienceLanding`, `audience-landing-copy`; `server/_core/context.ts`, `llm.ts`, `trpc.ts`; `server/rate-limit.ts`, `server/routers/pathpilot.ts`, `server/ai/provider-request.ts`, `request-timing.ts`; tests `landing-copy`, `mentor-router-context-boundary`, `planning-cache-invalidation`, `ai-latency`, `ai-loading-contract`, `ai-request-deadline`, `ai-request-timing`, `llm-response-boundary`, `provider-request`. Component/page files use `.tsx`; libraries and tests use `.ts`/`.test.ts` respectively.

No missing completed product code was identified for cherry-picking. This audit adds only this handoff; it does not manufacture another feature commit or overwrite earlier work. The final agent report supplies the documentation commit and remotely verified main SHA.

## Feature-by-feature source and test evidence

| Feature | Actual implementation | Verification and limitation |
| --- | --- | --- |
| Catalogue | `shared/career-taxonomy.ts`: 108 unique schema-valid authored rows | Executed runtime validation: 9 each in technology, healthcare, business, creative, hospitality, trades, education, public-service, human-services, environment, transport, sport. Editorial provenance explicitly says counselor review pending. This is not a credential-accuracy certification. |
| Onboarding | `client/src/pages/Onboarding.tsx`: Your context, Your interests, Ways to work, Experience, Review | Draft and completed schemas in `shared/discovery-intake.ts`; optional skipping, review/edit and save states exist. Offline persistence tests pass. No fresh authenticated browser session exercised here. |
| Ownership/persistence | `server/routers/pathpilot.ts:347-348`, `server/db.ts:70-80` | Protected procedures derive owner from `ctx.user.id`; strict payload schemas, request-scoped client and nullable legacy intake parsing. Offline round trips, failure retention and owner-boundary checks pass. Real production persistence NOT VERIFIED. |
| Recommendations | `shared/career-matching.ts`, `shared/discovery-intake.ts`, `CareerExplorer.tsx`, `StartingFields.tsx` | Shared ranker consumes intake, offers four fields, preserves full searchable catalogue, deduplicates evidence and allows overrides. Sparse/conflicting and cross-field synthetic profiles tested. Field-level behavior weights are coarse; not validated against real student outcomes. |
| Simulations | `server/simulation/catalog.ts`, `work-assignments.ts`, `work-graphs.ts`, engine and `SimulationWorkbench.tsx` | 25 unique assignments and valid taxonomy associations. Tests execute all 25 through completion and recovery; old 15 graph IDs remain resolvable. Full simulations are NOT available for all 108 careers; others have field exercises. No fresh browser/hosted history writes in this audit. |
| Roadmaps | `server/roadmap/career-requirements.ts:144-160` | Existing detailed career profiles retained; all additional catalogue careers resolve to authored beginner artifact/training exploration steps. These are not 108 bespoke professional qualification roadmaps. Tests cover every catalogue name and historical handoffs. |
| Opportunities | `server/opportunities/career-alignment.ts`, source adapters, relevance and profile repository | All 12 fields/stable IDs resolve; multiple interests and saved directions feed alignment, not only four starting fields. Legacy tags retained; unknown source text has no forced default tag. Matching coverage does not establish adequate real listings in every field. |
| Mentor | `server/mentor-context.ts:140-170`, `server/db.ts:226`, protected Mentor route | Bounded structured answers, starting fields, and approved history summary; tests verify malformed/missing values and owner-scoped reads. Prompts permit exploration outside recommendations. Actual provider responses NOT VERIFIED. |
| Auth/RLS | `server/_core/context.ts`, `trpc.ts`, `server/supabase.ts`, ownership migrations | Token validated by Supabase getUser; administrative role from app_metadata; protected reads use request-scoped session client. Local SQL tests exercise ownership policies. This is not proof of current hosted grants/settings. |
| UI/SEO | Product/audience pages, goal editor/tablet fixes, simulation selection feedback, shared tokens and public prerender | Included in the merged platform commit; offline regressions and both builds pass. SEO remains unchanged by this audit. |

## Fresh checks executed

| Check | Result |
| --- | --- |
| `pnpm test` | PASS: 710 tests across 132 suites; default offline exclusions retained |
| 13 focused product suites | PASS: 184 tests (career-platform-v2, discovery-intake, onboarding-persistence, onboarding-ownership, career-system-integration, simulation-work, simulation-work-repository, simulation-catalog-launch, career-driven-roadmap-intelligence, mentor-intake-repository, mentor-router-context-boundary, authenticated-query-cache, security-boundaries) |
| Runtime catalogue/schema/association check | PASS: 108 unique valid careers, 12 fields x 9, 25 simulations, 25 assignments, every simulation association correct |
| `pnpm check` | PASS |
| `pnpm build` and `pnpm build:vercel` | PASS; existing large-chunk warnings remain |
| Generated HTML verifier after each build | PASS: 12 public documents plus private shell boundaries |
| `verify-staging-migrations.mjs` with isolated PGlite 0.4.1 | PASS: 35 migrations and 66 assertions, including repeat initialization and ownership policies |
| `verify-security-migrations.mjs` with isolated PGlite | PASS: 50 assertions, 20 historical definitions; ownership migration tested |
| Source/history/browser-build secret scan | PASS: no findings; scanner is not an exhaustive security certification |
| Lint | NOT AVAILABLE: no configured linter; no whole-tree formatting performed |
| Hosted auth/email, two-account RLS and production data compatibility | NOT VERIFIED in this pass; local SQL stubs and offline transport are not hosted Supabase |
| Full live student workflow, real AI and opportunity inventory | NOT VERIFIED in this pass |

Initial read-only tsx inspection hit a sandbox IPC permission error; it was rerun with approved execution and completed. No test assertion was suppressed. SQL dependencies were installed only in a disposable temporary directory; repository dependencies and lockfile were unchanged.

## Important unresolved release gates

1. **Structured intake is not used by every recommendation path.** The deterministic ranker and Mentor consume it, but `server/routers/pathpilot.ts:320-331` builds `profileContext` only from legacy grade/location/interests/skills/activities/careerPreferences. `discovery.analyze` supplies that to the provider even though its allowlist includes all 108 names. Structured field selections, work preferences and pathways can therefore be absent from AI-generated guidance. Extend the bounded context and regression-test cache invalidation/provider input before claiming uniformly personalized analysis. No speculative prompt change was made during this audit.
2. **Roadmap replacement is nontransactional.** `tests/roadmap-failure-audit.test.ts` deliberately characterizes residual archived plans/empty replacements after intermediate failure. Passing those tests does not mean this defect is fixed. A reviewed transaction/RPC rollout is needed.
3. **Database intake validation is weaker than API validation.** `20261031_discovery_intake.sql` checks nullable object and version only. Direct owner-authorized REST writes can bypass nested list/size restrictions; RLS isolation alone does not validate content. Design a forward constraint/validation migration after reviewing existing rows. Onboarding profile upsert and draft deletion are also separate writes; a deletion error can follow a committed profile save.
4. **Hosted readiness is unproven for this main commit.** Production schema, settings, quotas across instances, authentication redirects/email, current RLS grants and migration ledger need owner verification. Previous staging reports are historical evidence, not a fresh production check.
5. **Product/counselor review remains necessary.** Catalogue work-style/environment weights inherit broad field defaults; rankings are exploration fit, not aptitude or readiness probabilities. Dashboard readiness partly derives from match scores. Legacy opportunity mappings are broad, and adequate real listings across all fields have not been demonstrated. Review educational requirements locally and avoid implying all careers have full simulations.
6. **External and privacy gates:** staged AI provider/live response coverage, listing workflow fixtures, Mentor mutation idempotency/confirmation, leaked-password protection setting, school consent/retention/provider review and COPPA/FERPA applicability remain owner decisions/verification. No legal compliance claim is made.

These gaps must not be hidden behind green CI. Source integration is complete; a blanket full-product release approval is not warranted until the responsible owners resolve or explicitly accept the remaining risks.

## Migration and configuration handoff

No migration was applied to a hosted database. SEO itself has no schema dependency; the platform does. Compare production schema and ledger against `docs/STAGING_MIGRATION_AUDIT.md` and `docs/STAGING_READINESS_REPORT.md`. In particular reconcile the forward security ownership/abuse-budget migrations, private discovery details, and `20261031_discovery_intake.sql` before shipping code that requires them. Preserve earlier simulation/profile/roadmap/opportunity schema contracts. Do not blindly replay duplicate historical identifiers or apply the disposable staging baseline to a populated database. The intake constraint is not repeat-add idempotent; inspect the ledger/schema rather than applying twice.

Use a verified backup and a rehearsed disposable staging run. Validate grants, restrictive cross-reference policies, service-role-only quota RPC permissions, owner RLS and legacy rows before enabling application writes. Retaining additive schema on an application rollback is safer than destructive down-migrations, but security fixes must not be rolled back casually.

Vercel configuration: Vite; Node 22.16+ in Node 22; install `npx --yes pnpm@10.34.9 install --frozen-lockfile`; build `npx --yes pnpm@10.34.9 build:vercel`; output `dist/public`. Preserve API-first rewrites and generated public/private HTML routing.

Required environment names: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `NODE_ENV`. For AI use `LLM_API_KEY`, `LLM_API_BASE_URL`, `LLM_MODEL` or supported `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL` aliases. Optional integrations use `STORAGE_PUBLIC_BASE_URL`, `OWNER_NOTIFICATION_WEBHOOK_URL`, `OWNER_NOTIFICATION_WEBHOOK_SECRET`, `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID`. Never expose private keys through VITE variables. Production signing protection needs the existing validated random secret shared across instances.

Keep staging `qekwtncqujusgkjeabyp` and its credentials isolated from Production. Steven must verify callbacks, email confirmation, provider limits, worker scheduling and project/domain configuration. No production values were read or changed here.

## Steven's acceptance checklist

- [ ] Review the final main SHA and CI; confirm the complete 182-path platform commit is an ancestor, not merely the SEO document.
- [ ] Resolve or explicitly gate the six issues above; review schema compatibility before application rollout.
- [ ] In authorized disposable staging, run two-account auth/RLS tests and complete draft save, edit, refresh, confirmation, logout/login and preference-clearing workflows.
- [ ] Confirm all 108 careers/12 fields remain browsable independent of ranking; exercise non-STEM and undecided profiles.
- [ ] Validate all 25 launch IDs, legacy history restoration, concurrent submission guards and representative complete browser simulations.
- [ ] Test roadmap creation/replacement failure recovery without risking existing student plans.
- [ ] Test real-source opportunity search/save/unsave and approved Mentor responses/context; do not fabricate listings or use real student data.
- [ ] Check desktop/mobile accessibility and network errors on the exact deployment candidate.
- [ ] Recheck private-route noindex/auth protection and public SEO using `SEO_DEPLOYMENT_HANDOFF.md`.
- [ ] Independently verify the Vercel deployment and production health after Steven's approved rollout. Main pushes may trigger configured integrations; this task does not invoke or certify deployment.
