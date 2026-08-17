# PathPilot — Authentication Redirect Checkpoint 21

## Resolved Issue

Supabase Authentication previously had `http://localhost:3000` as its Site URL. That caused email-confirmation links to return a student to a local development address rather than the live PathPilot application.

The live Supabase configuration has now been updated through the project owner’s authenticated dashboard session:

| Setting | Live value |
| --- | --- |
| Site URL | `https://pathpilot-s64joaqq.manus.space` |
| Redirect URL | `https://pathpilot-s64joaqq.manus.space/auth` |

## Application Boundary

The client’s existing sign-up flow passes `emailRedirectTo` through a shared redirect helper. The password-recovery flow uses that same helper as `redirectTo`. The helper permits HTTPS for deployed domains and allows HTTP only for local development hosts, preventing a remote HTTP callback from being generated.

No service-role key, secret, server-only credential, or Supabase configuration value is exposed in client code, output, test fixtures, or this document.

## Validation

| Check | Result |
| --- | --- |
| Live configuration | The project owner confirmed the Site URL and Redirect URL update in the Supabase dashboard. |
| Focused redirect regression | `tests/auth-redirect.test.ts` passed with the exact live PathPilot domain and callback path. |
| TypeScript | `pnpm check` passed. |
| Full regression | `pnpm test` passed: 34 files and 91 tests. |
| Production build | `pnpm build` passed. Existing deferred rich-renderer chunk-size warnings remain warnings only. |

## Focused User Acceptance

Create a new test account from the live PathPilot site. Open the confirmation email and confirm it returns to `https://pathpilot-s64joaqq.manus.space/auth` rather than localhost. Then request a password-reset email and confirm its link returns to the same HTTPS auth route. Complete the sign-in or reset flow and verify the app redirects into the authenticated workspace normally.
