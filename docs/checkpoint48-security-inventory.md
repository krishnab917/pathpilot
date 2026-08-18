# Checkpoint 48: Live Supabase Security and Performance Inventory

## Scope and source

This document records the read-only inventory completed against the active PathPilot Supabase project (`tivwzzstewybodmwhhxg`) on 2026-08-18. It is an evidence record for the uploaded post-Checkpoint-38 security and performance requirements. No database definition was changed during this inventory.

## Live database state

The active project is healthy and uses PostgreSQL 17.6. All inspected `public` student-owned tables have RLS enabled. The migration history confirms the two post-Checkpoint-38 hardening migrations already exist: `checkpoint39_security_performance` (`20260818045109`) and `checkpoint39_portfolio_policy_optimization` (`20260818045234`).

The live index inventory confirms relationship and ownership coverage for active query paths, including indexes for goals, roadmaps, roadmap milestones, projects, project milestones, portfolio projects, simulations, career-match relationships, AI conversations/messages, opportunities, report-share lookups, derived-analysis jobs, and recommendation links. No duplicate or unindexed high-priority ownership relationship was identified from the live foreign-key/index inventory, so no speculative index is added in this checkpoint.

The live RLS policy inventory shows user-scoped predicates in query-stable form, equivalent to `(select auth.uid()) = user_id`, for student-owned rows. Portfolio policies are separated by operation and preserve the required semantics: public reads are limited to `is_published = true`; owner reads and mutations require the authenticated owner; and insert/update/delete additionally require the referenced source project to be owned by that same user. The privileged `process_next_derived_analysis(text)` function is security definer with a fixed search path and is executable by `service_role` and `postgres`, but not by `anon` or `authenticated`.

The live inventory contains three public functions: `list_discoverable_opportunities`, `process_next_derived_analysis`, and `rls_auto_enable`. No non-internal public-schema triggers are present. Foreign keys enforce the relevant user, project, goal, portfolio, roadmap, simulation, and derived-analysis relationships, including cascade or set-null behavior as designed.

## Advisor findings

The fresh security advisor reports one warning: **leaked password protection is disabled**. The current Supabase organization is on the **Free** plan. Supabase documents leaked-password protection as available on Pro and higher; therefore it cannot be enabled through the currently eligible project configuration. This remains a documented manual/plan prerequisite, not a completed safeguard. [Supabase Password Security](https://supabase.com/docs/guides/auth/password-security)

The fresh performance advisor reports only informational unused-index notices, primarily on recently added opportunity-discovery indexes and a small number of relationship/public-portfolio lookup indexes. These notices do not demonstrate that removal is safe: the relevant tables are currently small, query statistics may not yet reflect real production traffic, and the indexes support documented filtering/ownership or public-published lookup paths. No index is removed without query-plan or sustained-production evidence.

## Credential-boundary inventory

Repository inspection found service-role access only in server-side code. The career-catalog persistence path is reached from the protected, validated career-discovery procedure. The derived-analysis worker uses a service-only database routine with an opaque worker token. Browser source contains no `SUPABASE_SERVICE_ROLE_KEY`, service-role identifier, provider secret, or built-in server credential reference. The worker now requires `SUPABASE_SERVICE_ROLE_KEY` explicitly and no longer falls back to a generically named credential; source-level regression coverage prevents that fallback from returning.

## Cross-user and application validation

The live `supabase-rls` regression created two temporary authenticated accounts and removed them in cleanup. It verified that the second account could not read the first account's profile, goals, roadmaps, simulations, conversations, messages, projects, roadmap recommendations, opportunity state, or private portfolio item. It also verified that anonymous access returned only the explicitly published portfolio item, the owner could read the private item, a second user could not update or delete that item, and a second user could not create a portfolio entry pointing to the first user's source project.

The same live test verified a fresh authenticated session could restore the first student's persisted profile, onboarding draft, career match, goal, roadmap, simulation, mentor data, project, recommendation, and opportunity state. The full application suite then passed with **64 test files and 181 tests**, followed by TypeScript and a production build. The only build advisory is the existing large client-chunk recommendation; it does not fail the build.

## Final advisor result and manual action

The final security-advisor recheck remains unchanged: **one external warning** for disabled leaked-password protection, with no database RLS, policy, or exposed-secret advisory findings. Because the organization is on the Supabase Free plan and the documented setting requires Pro or higher, this is unresolved by plan eligibility rather than an application-code defect. After upgrading the Supabase organization, enable **Authentication → Providers → Email → Prevent use of leaked passwords** and re-run the security advisor to verify the warning clears. No password, service credential, or production redirect was changed during this checkpoint.

## External evidence sources

| Source | Use in this checkpoint |
| --- | --- |
| Supabase management inventory for PathPilot project `tivwzzstewybodmwhhxg` | Project health, schema, migrations, policies, indexes, functions, triggers, and advisors. |
| [Supabase Password Security](https://supabase.com/docs/guides/auth/password-security) | Confirms leaked-password protection is a Pro-and-higher Auth setting. |
| [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index) | Interprets unused-index findings as candidates requiring evidence, not automatic removal instructions. |
