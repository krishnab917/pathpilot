# Supabase API Integration

PathPilot is configured against the active Supabase project named **PathPilot**. The project URL and public API credential are stored only in the project secret manager under `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY`; no value is committed to the repository.

The public credential was validated against Supabase Auth’s settings endpoint through `tests/supabase-config.test.ts`. The PathPilot PostgreSQL schema and the follow-up security remediation were applied as managed Supabase migrations. The resulting database contains the ten expected application tables, each with row-level security enabled. Supabase’s security advisor returned no remaining findings after the remediation.

The current frontend and backend service boundaries must continue to use only the public publishable/anon credential for browser-facing behavior. A privileged service-role key is neither configured nor required for the implemented configuration.
