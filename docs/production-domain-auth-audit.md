# PathPilot Production Domain and Authentication Audit

**Canonical domain under audit:** `https://pathpilotapp.com`  
**Fallback deployment URL:** `https://pathpilot-s64joaqq.manus.space`  
**Status:** In progress; no authentication, Supabase, domain, or source configuration has been changed by this audit entry.

## Initial verified observations

On 2026-08-29, a signed-out browser navigation to `https://pathpilotapp.com/` reached the PathPilot public landing page over HTTPS. After the initial skeleton settled, the rendered page contained the expected current PathPilot landing content, including the existing Sign in and discovery calls to action. The root page was not caught in a visible redirect loop and did not display an in-page mixed-content failure.

This is **not yet evidence** that the TLS certificate chain, DNS ownership, Manus custom-domain assignment, Supabase Auth Site URL, redirect allowlist, signup confirmation, password reset, existing-user continuity, or mobile authentication flow is correctly configured. Those checks remain pending and are recorded separately below as verified, manual, or not applicable findings.

## Canonical-domain network verification

Public DNS resolution returned `104.18.26.246`. A direct HTTPS request to the canonical URL completed with HTTP `200`, zero redirects, and certificate verification status `0`. The endpoint therefore resolves directly to `https://pathpilotapp.com/` rather than looping to an obsolete host. The public certificate presented the subject `CN=pathpilotapp.com`, was issued by Google Trust Services (`WE1`), and was valid from 2026-08-29 through 2026-11-27 at the time of the check.

The application returned `text/html; charset=UTF-8`; browser inspection then confirmed it rendered the expected current PathPilot landing page. These observations verify HTTPS delivery and host routing, but the hosting-platform ownership/assignment state still requires confirmation through the project domain configuration.

## Supabase Auth configuration access

The intended Supabase URL Configuration page is `https://supabase.com/dashboard/project/tivwzzstewybodmwhhxg/auth/url-configuration`. On 2026-08-29, the available browser session was redirected to the Supabase sign-in page before it could read the Site URL or redirect allowlist. Therefore, the audit has **not** viewed, altered, or verified those settings. The Supabase management interface available to this task exposes database structure and migrations but no Auth URL-configuration write operation.

This remains **MANUAL VERIFICATION REQUIRED** until an authorized Supabase dashboard session is used. No credential should be sent through chat; configuration must be entered only in the official Supabase dashboard.

## Audit boundaries

The work is limited to the canonical production URL and existing email/password authentication. It does not introduce Google Sign-In, alter any student identity or data, or change roadmap, simulation, behavioral, recommendation, Mentor, opportunity, or portfolio behavior.

## Browser health check

A further signed-out visit to the canonical landing page rendered the expected public content. The browser console contained no output, including no reported mixed-content, failed-asset, or client runtime error. This check did not submit an authentication form, follow an emailed link, or access private student state.

## Existing email-auth redirect paths

PathPilot’s existing email/password form constructs `emailRedirectTo` and `redirectTo` from the active browser origin. New-account confirmation returns to `/auth`; the signed-in route guard then uses the existing onboarding/workspace routing. Password-reset requests now return to the dedicated `/auth/update-password` page, which requires the recovery-created Supabase session, validates the existing 12-character password minimum, calls `updateUser`, and clears the local session after success. It displays safe generic messages for invalid, expired, or provider-failed links and does not log credentials or tokens.

The narrow canonical production values that must be present in Supabase Auth URL Configuration are:

| Setting | Required value |
| --- | --- |
| Site URL | `https://pathpilotapp.com` |
| Redirect URL — confirmation | `https://pathpilotapp.com/auth` |
| Redirect URL — password recovery | `https://pathpilotapp.com/auth/update-password` |

The existing Manus fallback may retain the corresponding two exact paths only if it remains an intentional deployment fallback. Local development may retain only `http://localhost:3000/auth` and `http://localhost:3000/auth/update-password`. No wildcard or arbitrary external redirect URL is required by the current application.

The redirect helper now rejects a path that would leave the active application origin. It continues to derive normal return URLs from the active host, so hosting the same build at the canonical domain does not create another Supabase identity or any new student-profile record.

## Password-recovery route validation

The new `/auth/update-password` route was visually checked in the active development preview at a 390 × 844 mobile viewport. With no recovery session, it displayed the intended generic invalid-or-expired-link state and a route back to request another reset email; it did not expose tokens, show a raw provider error, or enter the private workspace. The existing `/auth` sign-in screen remained unclipped and functional at the same viewport.

Before this configuration checkpoint is published, the currently deployed canonical host understandably returns the old build’s 404 page for `/auth/update-password`. This is recorded as a pre-publication observation rather than a defect in the local implementation. The route must be rechecked against `https://pathpilotapp.com` after the checkpoint is saved.

## Configuration and test evidence

On 2026-08-29, the project owner reported that the instructed Supabase Auth URL Configuration values had been saved. Because the audit browser has no authenticated Supabase dashboard session, this is owner-reported configuration rather than independently inspected dashboard evidence. The values to retain are the Site URL `https://pathpilotapp.com` and the two narrow canonical redirect URLs listed above.

Focused recovery, redirect, accessibility, sign-out, authenticated-cache, and RLS tests passed: 6 files / 21 tests. The complete application suite passed: 88 files / 288 tests. TypeScript validation and the production build passed, as did `git diff --check`. The build emitted the existing non-blocking rich-renderer chunk-size advisory.

Live email delivery, confirmation-link completion, password-reset link completion, existing-user login/persistence, and the dashboard’s exact current URL Configuration view remain **MANUAL VERIFICATION REQUIRED** because they require an authenticated owner dashboard session and/or a real inbox. No password, reset token, confirmation token, access token, service-role key, or student record was accessed during these checks.

## Post-publication deployment check — follow-up required

After publishing version `8c611e2e`, the canonical host still returned the prior build’s 404 page for both `/auth/update-password` and the same URL with a harmless cache-busting query. This rules out a normal browser-document cache for the observed result. The local development preview renders the new route correctly, and the checkpoint build passed; the remaining evidence instead indicates that the custom domain was not yet serving the new published deployment at the time of the check.

The canonical root continues to serve PathPilot over valid TLS, but the current custom-domain deployment target requires **MANUAL VERIFICATION REQUIRED** in the Manus domain configuration before email recovery should be treated as production-ready. Do not complete a password-reset inbox test until the canonical domain serves `/auth/update-password`’s safe reset state rather than a 404.

The fallback host `https://pathpilot-s64joaqq.manus.space/auth/update-password` was also checked after the same publication and returned the prior route map’s 404 page. Consequently, neither public host provides evidence that version `8c611e2e` has propagated to production, even though the checkpoint was successfully saved and the development preview has the route. The deployment/version assignment must be checked in the Manus project dashboard before proceeding with external email-auth acceptance.

An attempt to read production runtime logs through the managed log interface returned `cloudrun service not found`. That is an infrastructure-observability limitation, not evidence of an application failure or a reason to retry the same unavailable call. The public-host route checks above remain the relevant evidence until the hosting assignment is confirmed.

## Final public-route propagation verification

After the managed deployment-success notification, a fresh cache-busted visit to `https://pathpilotapp.com/auth/update-password` completed the normal loading skeleton and rendered the intended signed-out recovery state: a generic expired-or-invalid-link explanation and a link to request a new reset link. It did not render the prior 404 page, did not reveal any token, and did not enter a private route. This verifies that the canonical production domain now serves the published recovery-route implementation. The earlier 404 observations are retained above as pre-propagation evidence only.

The configured `https://www.pathpilotapp.com/` host completed one HTTPS-verified redirect to `https://pathpilotapp.com/` and returned HTTP 200. The www hostname therefore does not create a competing public application origin or a redirect loop.

## Controlled production email-flow acceptance

On 2026-08-29, the project owner reported a successful controlled production flow on the canonical domain: test-account signup, email confirmation, sign-in, password-reset request, reset-link completion, new-password update, and sign-in with the updated password. This owner-run acceptance also verifies that the previously documented Supabase Auth Site URL and two narrow canonical redirect values were accepted by the hosted project for the existing email/password flow.

No credentials, confirmation links, reset links, tokens, or student data were shared with this task. The owner report is treated as manual acceptance evidence; the automated regression, public-route, TLS, and redirect verification records above remain independently observed evidence.
