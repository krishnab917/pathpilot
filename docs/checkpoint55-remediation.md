# PathPilot Remediation Checkpoint 55

## Scope

This checkpoint addresses only verified release findings from Checkpoint 54. It does not add product features, change student-data models, alter simulation logic, or weaken existing authorization boundaries.

## Remediations completed

| Area | Verified change | Evidence |
|---|---|---|
| Workspace loading | Portfolio, opportunities, roadmap, and adaptive-simulation modules now load only after a student opens the related workspace section. The existing section-shaped loading skeleton remains the fallback. | Initial `Workspace` route chunk reduced from **456.77 kB** to **248.05 kB**, a **40.0%** reduction. `workspace-section-lazy-loading.test.ts` protects the dynamic-import and skeleton contract. |
| Registration password policy | The user saved a **12-character** minimum password policy in Supabase Auth. The PathPilot registration form now communicates and enforces that policy before submission, while sign-in remains unconstrained by a client-side minimum so existing users can authenticate with their saved password. | `auth-accessibility.test.ts` asserts the shared 12-character policy constant, registration-only `minLength`, and visible guidance. Browser inspection confirmed the registration view exposes “Use at least 12 characters.” |
| Existing Auth hardening | The user-provided configuration view confirms that secure email change and secure password change remain enabled. | Supabase Auth Email Provider configuration, user-confirmed 2026-08-21. |

## Supabase leaked-password protection

The current Supabase organization was independently confirmed as **Free**. The refreshed Security Advisor continues to report only `auth_leaked_password_protection`: **Leaked Password Protection Disabled**. Supabase documents this control as available on Pro and higher plans, so it cannot be enabled through application code or the current plan. No workaround that substitutes for Have I Been Pwned screening was added. [1]

## Performance outcome and retained limitation

The bundle-splitting change reduces the JavaScript required for the initial authenticated workspace route. It does **not** eliminate the earlier Autoscale server cold-start observation because that is a hosting lifecycle characteristic rather than a browser bundle defect. The user chose to retain Autoscale hosting rather than switch to a persistent Reserved instance. The existing rich-mentor renderer remains a deferred large chunk; it is not requested by the initial workspace route and no speculative renderer rewrite was made during this narrow remediation.

## Validation

The complete post-remediation command, `pnpm test && pnpm check && pnpm build`, passed with **69 test files / 194 tests**, TypeScript validation, and production build success. The build retains a non-blocking large-chunk advisory for deferred rich-rendering dependencies; no application build error was reported.

## Remaining manual acceptance evidence

The following remains unexecuted by design: email confirmation and password-reset delivery, duplicate-registration UX, a full authenticated student journey on desktop and mobile, live AI-operation latency/error behavior, and managed worker-scheduler execution. These are not recorded as passing. They require a user-authorized test account/mailbox or production-side scheduler observation.

## References

[1]: https://supabase.com/docs/guides/auth/password-security "Supabase Auth password security"
