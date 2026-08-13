# PathPilot Supabase Persistence Implementation

## Implemented Boundaries

PathPilot now uses Supabase Auth for email/password sign-up, sign-in, reset-password requests, persistent browser sessions, and sign-out. The existing Vite interface remains intact; the prior Manus OAuth launcher is no longer mounted in the active server runtime. The browser sends the current Supabase access token with existing tRPC requests, while the server verifies the token and binds a request-scoped Supabase client to each protected procedure.

All private application reads and writes run through user-scoped Supabase clients, which operate under the authenticated user’s row-level-security identity. The data layer persists profiles, per-step onboarding drafts, goals, roadmaps and milestones, simulation sessions and decisions, mentor conversations/messages, and project portfolios. The dashboard query derives its values from these persisted records rather than client mock state. AI calls remain server-side and retain only a bounded history window when assembling mentor context.

The workspace now includes a Portfolio view backed by `pathpilot.projects.list`, `create`, and `update`. It reads the signed-in user’s saved projects on entry, creates only user-owned records, and revalidates its query after updates. The retired Manus OAuth route and SDK have been removed from the active server runtime; Supabase Auth is now the sole browser session path.

## Security and Validation

The Supabase public URL and anon/publishable key are configured only for Vite browser use. The service-role credential is present only in the server environment and is used solely for shared career-catalog writes after authenticated AI career analysis. It is not referenced in any client module.

Automated tests confirm the public Supabase connection, server-only credential access, five-career and simulation helper behavior, and actual two-user row-level-security isolation across profiles, goals, roadmaps, simulations, conversations, messages, and projects. A fresh signed-in session is also used to reload the profile, onboarding draft, career match, goals, roadmap, simulation, mentor history, and projects. The temporary test accounts and their records are removed by the test teardown. The active GitHub remote was confirmed as the dedicated private repository, `krishnab917/pathpilot`.

## Remaining Manual Acceptance Check

Supabase Auth email delivery and a fully interactive browser journey require the owner to sign up through `/auth` in the running PathPilot preview, because email confirmation and mailbox interaction cannot be completed by the sandbox. After that one live check, the expected journey is: sign up, complete onboarding, generate career results, create a roadmap and goal, complete a simulation, use the mentor, refresh, sign out, and sign back in.
