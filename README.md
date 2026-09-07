# PathPilot

Student career discovery, adaptive simulations, roadmaps, projects, opportunities, AI mentoring, and shareable planning reports.

This checkout has been migrated at the source level away from Manus runtime services. The application now uses Supabase directly plus configurable owner-controlled services for AI, notifications and legacy storage compatibility. See [the migration audit and status report](docs/MANUS_MIGRATION_AUDIT.md) for verification limits and remaining deployment work.

## Development

Use Node 22.16 or a compatible newer Node 22 release. Use the repository's pinned pnpm 10.4.1; global pnpm 11 ignores this project's patch/override configuration.

```sh
npx --yes pnpm@10.4.1 install --frozen-lockfile
cp .env.example .env
# Fill the required configuration described in DEVELOPMENT.md.
npx --yes pnpm@10.4.1 dev
```

The default address is http://localhost:3000 (the server tries the next 19 ports when occupied). Supabase public configuration is required for the browser. AI requests use `LLM_API_KEY`, `LLM_API_BASE_URL` and `LLM_MODEL`, with `OPENAI_*` aliases supported for OpenAI-compatible providers.

```sh
npx --yes pnpm@10.4.1 check
npx --yes pnpm@10.4.1 test
npx --yes pnpm@10.4.1 build
npx --yes pnpm@10.4.1 start
```

The default tests include live database tests and fail without configured Supabase credentials. Do not aim them at production: RLS tests create and delete test users and records. Build success alone does not verify login, data access, or AI.

Use `npx --yes pnpm@10.4.1 db:verify:supabase` only after configuring the existing Supabase project in a private environment. The check is read-only and complements `supabase/read-only-continuity-check.sql`; it does not replay migrations.

- [Development and environment reference](DEVELOPMENT.md)
- [Current architecture](ARCHITECTURE.md)
- [Codex guidance](AGENTS.md)
- [Audit, completed source migration, remaining deployment blockers and database plan](docs/MANUS_MIGRATION_AUDIT.md)
- [Database continuity report](docs/DATABASE_CONTINUITY_REPORT.md)
- [Complete tracked-file inventory at the audited commit](docs/REPOSITORY_INVENTORY.md)

`supabase/migrations` contains the active PostgreSQL schema. `drizzle` contains preserved legacy MySQL schema. **`db:push` is disabled because it targets MySQL and must not be used to recreate the active Supabase database.** Historical checkpoint documents describe past environments; current source and the audit take precedence for setup instructions.
