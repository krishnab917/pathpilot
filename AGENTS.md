# PathPilot agent guide

## Architecture and stack

React 19 / TypeScript / Vite 7 / Tailwind 4 / Wouter client; Express + tRPC 11 server; Supabase Auth and PostgreSQL with RLS. AI uses a configured OpenAI-compatible provider through `server/_core/llm.ts`. Read ARCHITECTURE.md and docs/MANUS_MIGRATION_AUDIT.md first.

Important paths: `client/src/pages`, `client/src/lib`, `server/routers/pathpilot.ts`, `server/db.ts`, `server/supabase.ts`, `server/simulation`, `server/roadmap`, `supabase/migrations`, `tests`. `drizzle` is legacy MySQL, not the active store.

## Commands

Use Node 22.16+ within the Node 22 line and `npx --yes pnpm@10.34.9` (lockfile and Wouter patch must be preserved).

- Install: `npx --yes pnpm@10.34.9 install --frozen-lockfile`
- Dev: `npx --yes pnpm@10.34.9 dev`
- Build/start: `npx --yes pnpm@10.34.9 build` / `npx --yes pnpm@10.34.9 start`
- Type check: `npx --yes pnpm@10.34.9 check`
- Tests: `npx --yes pnpm@10.34.9 test` (offline by default; live Supabase tests require explicit disposable-environment opt-in)
- Lint: no lint script/config exists. Prettier check is formatting only; `format` rewrites the entire repository.
- Database: no verified Supabase replay command yet. Do not use `db:push` for Supabase; it is disabled because the preserved legacy command generates and migrates MySQL. Use `db:verify:supabase` only for read-only continuity checks after existing project credentials are configured privately.

## Conventions and boundaries

Preserve user-scoped Supabase clients, RLS, admin-role derivation, narrow service-role RPCs, structured AI validation, query-cache isolation, and simulation graph compatibility. Keep existing routes, public report token guards, portfolio publication rules, and recovery redirects. Use aliases `@` and `@shared` consistently. Do not rewrite UI or swap frameworks during migration.

Copy `.env.example` to ignored `.env` and use DEVELOPMENT.md for required values. Never print credentials or put service-role keys in VITE variables. Vite variables are public build-time values. Never connect mutating RLS tests to production. Do not edit historical migrations, remove Drizzle files, or assume lexicographic SQL order is valid. Use forward-only migration changes after replay verification.

The current branch contains the approved source-level migration away from Manus runtime services. Do not reintroduce Forge, Manus Vite runtime, platform debug collectors, or browser-visible server secrets. Preserve historical checkpoint records, Wouter patch, lockfile, and database files. Review the diff and secret exclusions before any commit; never force-push or rewrite history. GitHub push access was not available to the account used for the initial audit.
