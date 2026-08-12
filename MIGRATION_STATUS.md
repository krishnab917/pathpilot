# PathPilot Architecture Refactor Status

## Completed

| Area | Result |
| --- | --- |
| Frontend runtime | The primary frontend is now a Next.js App Router project with route composition in `app/`, presentation components in `components/`, client orchestration in `lib/features/`, and shared contracts in `lib/contracts/`. |
| Backend runtime | An independent FastAPI application resides in `backend/app/`, with route handlers, auth dependencies, services, repositories, domain engines, and Pydantic models separated by responsibility. |
| Simulation engine | `backend/app/domain/simulation/engine.py` is deterministic and independent of UI, HTTP, databases, and AI providers. |
| Roadmap engine | `backend/app/domain/roadmap/policy.py` validates the three-year, nine-milestone roadmap composition outside presentation and API layers. |
| AI mentor | The `MentorService` is isolated from components and route composition through a structured AI client protocol. |
| Data layer | A Supabase PostgreSQL migration defines the required models, constraints, and row-level policies. Repository protocols keep service code independent from the Supabase SDK. |
| Legacy source | The former Vite, Express, tRPC, Drizzle, and shared sources are archived in `legacy/vite-trpc/` and removed from the primary TypeScript runtime. |

## Validation Completed

The new application passes `pnpm check` and a clean `NODE_ENV=production pnpm build`. The FastAPI package imports successfully and its simulation-engine test passes. The Next.js dashboard, careers, and roadmap routes were rendered in the browser after the refactor.

## Required Before Live Data Is Enabled

Supabase and AI provider credentials have intentionally not been configured. The exact variable contract appears in `CONFIGURATION.md` and `docs/environment-template.md`. Before enabling production user data, install those secrets through the deployment environment, apply `supabase/migrations/20260812180500_pathpilot_core.sql` in the Supabase project, deploy the FastAPI service separately, and set `PATHPILOT_API_URL` on the Next.js deployment.
