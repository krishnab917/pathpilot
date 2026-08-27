# PathPilot Google Sign-In — Configuration and Security Record

## Verified provider model

PathPilot must use the existing Supabase browser client and `signInWithOAuth({ provider: "google" })`; it must not create or store a separate Google credential or authentication system. Supabase’s current documentation specifies that web OAuth uses the project’s **Supabase Auth callback URI** as Google’s Authorized redirect URI, while the PathPilot production origin belongs in Google’s Authorized JavaScript origins and in Supabase’s redirect allowlist.[1]

The connected PathPilot project reference is `tivwzzstewybodmwhhxg`. Therefore, the exact Supabase callback URI to register with Google is:

```
https://tivwzzstewybodmwhhxg.supabase.co/auth/v1/callback
```

This URI is a provider-to-Supabase callback. It is distinct from PathPilot’s browser return URL, which must be an allowlisted application route such as `https://pathpilot-s64joaqq.manus.space/auth/callback` and is passed as `redirectTo` by the existing browser client. The production application origin to enter in Google Cloud is `https://pathpilot-s64joaqq.manus.space` (no path). A local origin must be added only if the user chooses to support that local environment; it is not a production configuration value.

Google’s Client ID and Client Secret belong only in Supabase’s **Authentication → Providers → Google** configuration. They must not be stored in `VITE_` variables, browser code, Git, application logs, or this record. The Supabase documentation identifies `openid`, email, and profile scopes as the baseline provider requirements.[1]

## Identity-linking boundary

Supabase documents automatic linking of a newly authenticated OAuth identity to an existing Supabase user with the same verified email address. This association happens within Supabase Auth, retains the existing Supabase user ID, and therefore retains the existing PathPilot profile and user-owned rows. PathPilot does not query an email address, write a cross-user update, or merge records itself.[2]

Supabase also offers a beta `linkIdentity({ provider: "google" })` flow for a student who is already authenticated and deliberately wants to attach a Google identity with a different email address. It must be enabled in the provider configuration first.[2] This checkpoint does not surface a Settings control for manual linking because the connected dashboard’s manual-linking configuration could not be inspected while signed out. No custom identity merge is implemented.

## Implemented application behavior

The existing Supabase browser client is configured to persist and refresh sessions and to detect sessions in callback URLs. The new authentication-page control calls the same client’s `signInWithOAuth({ provider: "google" })` method and returns to `/auth/callback` on the active HTTPS application origin. The callback accepts only a narrow internal `next` route set (`/app`, `/onboarding`, or one supported `/app/<section>`), establishes/checks the Supabase session, and displays generic non-disclosing failure copy for cancellation, invalid callback, provider, exchange, or session failures.

The callback does not create a student profile. It safely returns to the existing workspace; the workspace sends a user with no student profile to the existing onboarding flow, while a returning user’s stable Supabase user ID loads the same RLS-protected profile, roadmap, goals, projects, portfolio, opportunities, simulations, and Mentor history. Existing Google or email/password identities that Supabase has linked therefore reuse the same PathPilot records. Existing email/password sign-in, confirmation, reset, session restoration, and sign-out controls remain in place.

The established session-change listener drives the existing authenticated React Query boundary. A Google identity transition receives the same user-ID namespace and cancel/clear behavior as an email/password transition, so private cached data is not reused across students or auth methods.

## Manual provider configuration required

The connected Supabase management interface confirms the PathPilot project reference and is healthy, but does not expose Auth provider credentials/settings through its read-only tools. A read-only dashboard visit reached Supabase’s own sign-in page rather than the project configuration because no dashboard session was present. Therefore, **Google is not claimed as enabled or production-tested yet**.

After creating a Google **Web application** OAuth client, configure the following exact values manually:

| Location | Field | Value |
|---|---|---|
| Google Auth Platform → Clients | Authorized JavaScript origins | `https://pathpilot-s64joaqq.manus.space` |
| Google Auth Platform → Clients | Authorized redirect URIs | `https://tivwzzstewybodmwhhxg.supabase.co/auth/v1/callback` |
| Supabase → Authentication → URL Configuration | Site URL | `https://pathpilot-s64joaqq.manus.space` |
| Supabase → Authentication → URL Configuration | Redirect URLs | `https://pathpilot-s64joaqq.manus.space/auth/callback` |
| Supabase → Authentication → Providers → Google | Enable provider / Client ID / Client Secret | Enable Google; paste the Google Web Client ID and Client Secret only into this provider page. |

For intentional local development, add `http://localhost:3000` as an additional Google JavaScript origin and `http://localhost:3000/auth/callback` as an additional Supabase redirect URL. These are development-only and are not production values. When PathPilot receives a permanent custom domain, add that new HTTPS origin and its `/auth/callback` URL before switching the Supabase Site URL; the standard Supabase callback URI above does not change unless the project later adopts a custom Supabase Auth domain.

Google’s `openid`, email, and profile scopes are the baseline documented provider scopes. Do not add unnecessary sensitive scopes. Never place the client secret in an application environment variable, browser source, Git history, issue, or log. The browser-side code uses only the existing Supabase publishable configuration and never reads or persists provider tokens.

## Browser verification

The running PathPilot `/auth` route was inspected while signed out on 2026-08-27. It renders the existing email/password sign-in form, account-creation link, and password-recovery link with the new **Continue with Google** alternative and its explicit “or continue with email” divider. No student data was accessed and the provider flow was not started because the Google provider’s configuration has not yet been verified or enabled.

The callback was also inspected with a synthetic `access_denied` provider result and an external `next` parameter. It remained on PathPilot’s callback screen, showed only the intended generic error message, and exposed a safe path back to sign in; the external URL was not followed.

## References

[1] [Supabase, “Login with Google”](https://supabase.com/docs/guides/auth/social-login/auth-google)

[2] [Supabase, “Identity Linking”](https://supabase.com/docs/guides/auth/auth-identity-linking)
