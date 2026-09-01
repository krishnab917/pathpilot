# PathPilot Pre-Launch Hardening Audit

**Scope source:** `pasted_content_21.txt`  
**Audit status:** In progress; implementation follows verified findings.  
**Canonical production URL:** `https://pathpilotapp.com`

## Evidence rules

Each requirement is classified as **PASS**, **FAIL**, **PARTIAL**, **MANUAL**, or **N/A**. Parallel source-review findings are hypotheses until confirmed against the current repository or live Supabase catalog. Secret values, tokens, private student rows, and authentication links are excluded from this record.

## Current requirement matrix

| Area | Status | Verified evidence | Required next action |
| --- | --- | --- | --- |
| Public-table RLS | PASS | All 26 current `public` tables report `relrowsecurity=true` in the live PostgreSQL catalog. | Retain and attack-test actual policies. |
| Private-row ownership | PASS | Private-table policies use `auth.uid()` ownership checks in both `USING` and `WITH CHECK`; child tables additionally verify parent ownership where applicable. | Run User A/User B direct attack tests after test-account setup. |
| Public/catalog separation | PASS | `careers` allows read-only public SELECT; active opportunities and sources allow authenticated SELECT only; published portfolio rows have deliberate signed-out SELECT conditions. No public write policy was found. | Preserve behavior; verify public routes. |
| Server-only limiter state | PASS | Rate-limit tables have RLS, no client policies, and only `service_role` table/function privileges. Supabase’s “RLS enabled no policy” items are informational for this intentional deny-by-default design. | Retain; no permissive policy should be added. |
| Database integrity / FK indexes | PASS | Every live public foreign key reports a matching leading index. Every direct `user_id → auth.users` foreign key reports `ON DELETE CASCADE`. | Do not add duplicate indexes; map non-FK deletion behavior before account deletion. |
| Privileged function safety | PARTIAL | Limiter RPCs use `security definer`, `search_path=public, pg_temp`, and service-role-only execution. `process_next_derived_analysis` is service-role-only but has `search_path=public, extensions`. | Qualify extension functions and reduce the derived worker search path in a forward migration if source validation passes. |
| Supabase Storage | N/A | Live `storage.buckets` and storage policy queries returned no rows. | Do not invent file cleanup; re-audit if storage is introduced. |
| Leaked-password protection | MANUAL | Supabase Security Advisor reports the control disabled. Prior project evidence indicates the control requires a paid Supabase plan. | Dashboard: Authentication security/password settings. PASS only when the advisor warning disappears; otherwise retain as documented plan limitation. [1] |
| Account deletion | FAIL | No Settings deletion UI or server/auth deletion operation exists. Live user-owned FKs support cascade from `auth.users`. | Implement a server-authorized, two-step flow and verify with synthetic accounts only. |
| Email authentication | PASS | Canonical signup → confirmation → sign-in → reset → password update → sign-in acceptance was completed by the owner; same-origin redirect and safe recovery-route tests pass. | Preserve. Sender/DNS records remain separate manual checks. |
| Privacy / terms / support / accessibility routes | FAIL | Current `App.tsx` has no `/privacy`, `/terms`, `/support`, `/contact`, `/delete-account`, or `/accessibility` routes. | Add accurate signed-out pages and only functional links. |
| Error boundary | PASS | The React root is wrapped in the existing `ErrorBoundary`. | Audit data captured and production fallback behavior; do not invent a configured provider. |
| Analytics | PARTIAL | The build injects the managed Umami script from `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID`; no verified custom journey-event layer is present. | Inventory actual collection and disclosures before adding events or consent UI. |
| AI abuse / cost controls | PARTIAL | Four authenticated direct model routes use shared Supabase rate limits, short duplicate leases, safe errors, and cache/reuse paths. Background derived analysis and non-AI public/auth surfaces require separate review. | Verify timeout/output bounds per route and complete the deferred abuse-surface audit. |
| Payments / subscriptions | N/A | Stripe and Shopify are not active; no in-app purchase SDK is present. | Do not add fake purchasing infrastructure. |
| Mobile stores | MANUAL / FUTURE | Repository is a web React/Vite app; no Android, iOS, Expo, manifest, signing, TestFlight, or Play configuration was found. | Produce exact future readiness and store-console checklists; do not claim tests occurred. |
| Canonical domain | PASS | `pathpilotapp.com` serves the published build over valid TLS; `www` redirects once to the canonical host. | Preserve and monitor certificate/domain ownership. |

## Rejected unsupported audit claims

The parallel source audit claimed missing indexes on `student_profiles.user_id`, `student_opportunity_states.user_id`, and `simulations.user_id`. The live catalog disproves those claims: all three foreign keys have matching leading indexes. It also recommended adding payment, email, and maps integrations despite the specification’s prohibition on inventing unused services; those recommendations are rejected.

The parallel audit’s statement that no cross-user RLS tests exist is also not accepted without verification. The repository contains RLS contract tests and earlier two-account acceptance evidence; the current hardening run will add or rerun live direct attack tests rather than relying on that claim.

## Live Supabase advisor snapshot

The Security Advisor currently reports two informational “RLS enabled no policy” entries for service-role-only rate-limit tables and one warning for disabled leaked-password protection. The Performance Advisor reports only unused-index informational notices; it reports no missing-foreign-key-index finding. Removing purpose-built opportunity/search/ownership indexes solely because a young database has not yet used them would be premature.

## Manual-control format

Every unresolved manual item in the final report will state: where to check, the expected configuration, the PASS condition, and the response if it fails.

## References

[1]: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection "Supabase password security and leaked-password protection"
