# Onboarding live verification checkpoint

Review date: November 4, 2026. Branch: `codex/complete-overview-audiences`.
HEAD: `f67a26329c074d1ab0b5427f9a8d4f4bece73fbc`. All accumulated implementation changes remain uncommitted. This review changed only this document.

## Environment evidence and boundary

- Public deployment inspected in a real browser: https://www.pathpilotapp.com/onboarding. It showed “Start with your account” and a sign-in button. Following it displayed email/password sign-in, account creation, and password recovery controls. No credentials were submitted and no accounts were created.
- Connected Vercel project: `pathpilot` in `krishnab917s-projects`. The latest ten deployments returned by the connector were all `BLOCKED`. The latest preview was `codex/seo-aeo-review`, commit `3944a31909c550cf7632119381d1f9e5e24c2cf3`; this is not evidence that the uncommitted onboarding implementation is deployed. This listing does not establish why the public domain remains available or which build it currently serves.
- No populated root `.env` files or `.vercel/project.json` were found in this worktree. Process flags `RUN_SUPABASE_INTEGRATION`, `SUPABASE_TEST_DISPOSABLE`, and `SUPABASE_TEST_PROJECT_REF` were unset. No disposable staging URL, Supabase project identity, database inspection connection, or two authorized test accounts could be established.
- The production Supabase project and hosted authentication settings (confirmation, redirect allowlist, providers) were NOT VERIFIED. Local code uses Supabase password sign-in/sign-up and authenticated request ownership; code inspection is not hosted configuration evidence.
- No deployment, migration execution, hosted configuration change, production database access, or test-account write was performed.

## Migration and ownership review (source only)

`supabase/migrations/20261031_discovery_intake.sql` adds nullable `student_profiles.discovery_intake` JSONB, an object/version CHECK, and a column comment. It contains no deletes, drops, data rewrites, policy relaxation, or credential changes. Existing NULL rows remain valid. Adding the CHECK can validate existing non-NULL values and acquire database locks: inspect staging data before execution. The named constraint is not rerunnable independently; use the migration ledger, not repeated raw execution.

The CHECK validates the outer object and version only, not all nested preference fields. Application writes use strict Zod schemas. Rejection of malformed nested values through direct owner REST writes is not established by this constraint and needs explicit staging verification and policy review.

Source migrations enable owner RLS on profiles and drafts (`auth.uid() = user_id`), with subsequent policy refinements. Profile handlers derive ownership from `ctx.user.id`. These facts do NOT establish which policies/permissions are deployed, nor verify live A/B isolation. No service-role credentials were used to impersonate either account.

## Results

| Test | Result | Evidence |
| --- | --- | --- |
| Deployed browser onboarding | BLOCKED | Public sign-in gate observed; no confirmed disposable staging build/account. All five authenticated steps, completion and editing remain untested live. |
| Live draft persistence | BLOCKED | No authorized disposable Supabase target or test session. |
| Preference persistence | BLOCKED | Column existence/migration ledger unknown; refresh, new-session restoration, clearing and legacy preservation untested live. |
| Account A isolation | BLOCKED | Two independent staging accounts unavailable. |
| Account B isolation | BLOCKED | Two independent staging accounts unavailable. |
| Forged ID protection | BLOCKED (live) | Offline rejection coverage passes; no live forged-payload or cross-account requests sent. |
| Database RLS | BLOCKED | No live policy/grant inspection or anonymous/direct REST tests on a disposable project. |
| Mobile browser onboarding | BLOCKED | Only public sign-in checked at 320px; document width 320px. Authenticated flow untested. |
| Full offline regression suite | PASS | Fresh run: 671 tests, 124 suites, zero failures; `/private/tmp/pathpilot-v3-live-review-offline.log`. |
| Type-check | PASS | `pnpm check`, completed exit 0. |
| Production build | PASS | `pnpm build`, completed exit 0; `/private/tmp/pathpilot-v3-live-review-build.log`. Existing >500 kB chunk warnings remain. |
| Generated HTML | PASS | `node scripts/verify-public-html.mjs`: 12 public documents and private shell verified. |
| Diff whitespace | PASS | `git diff --check` before this documentation addition; rerun at handoff. |

Real-browser limited observations: desktop onboarding gate; sign-in at 320px without horizontal overflow; no captured console warning/error messages. Network failures were not independently exhaustively audited. Save failures, pending navigation, retry, recommendations, unrelated career search, logout/login, and structured-answer writes were NOT tested against a deployed authenticated environment. Prior synthetic fixtures are not substituted for these checks.

## Required next steps

1. Steven/owner must identify an authorized disposable staging application URL serving this exact local implementation, and its separate Supabase project reference. Confirm that neither browser nor server points to production. A preview hostname alone is insufficient.
2. Provision two synthetic student accounts and a secure sign-in/credential mechanism; do not paste passwords, access tokens or service-role keys into chat or reports. Supply authorized read-only schema/policy inspection access separately from student-scoped sessions.
3. Inspect the staging migration ledger, column, constraints, grants, and effective policies. Apply the additive migration only after confirming the project is disposable and authorized. It must precede new application writes. No production execution is authorized.
4. Test the complete workflow with selected/skipped answers, edit/review, save, refresh, logout/login, clearing preferences, and legacy records. Capture sanitized screenshots and assertion results, not auth headers or private response dumps.
5. Use independent A/B user tokens to test own-row reads/updates, cross-row SELECT/PATCH, forged identities, and anonymous requests, both through tRPC and direct Supabase REST. RLS can enforce denial by returning zero rows; verify the other account's stored values remain unchanged. Do not use service-role tokens for student assertions.
6. Test malformed/oversized data at both application and direct database boundaries. Test save failure/retry and navigation during pending saves using a staging-only fault mechanism; do not weaken production protections or disable RLS.
7. Recheck desktop/320px, captured console and failed requests. Keep rollback non-destructive: revert the application release if needed and retain the nullable column and saved answers. Do not drop student data.

Until those gates are satisfied, live persistence, ownership isolation, hosted migration status, and release readiness remain NOT VERIFIED.
