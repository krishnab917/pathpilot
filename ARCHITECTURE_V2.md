# PathPilot Production Architecture

## Decision

PathPilot will move from its original single-project Vite, Express, tRPC, and MySQL template to a modular architecture with a **Next.js App Router frontend**, an independently deployable **FastAPI backend**, and **Supabase PostgreSQL/Auth** as external infrastructure. The migration does not add user-facing capabilities; it reorganizes existing career intelligence functionality behind explicit contracts and isolated feature boundaries.

## System Boundaries

| Layer | Responsibility | Must not contain |
| --- | --- | --- |
| `app/` | Next.js route composition, layouts, metadata, and route-level loading/error states | Business rules, database access, or AI prompts |
| `components/` | Reusable presentational and feature UI composed from shadcn/ui primitives | Direct API calls or domain scoring logic |
| `lib/features/` | Client-facing feature hooks, API clients, and view models | React page markup |
| `lib/contracts/` | Shared request, response, and domain schemas | Framework-specific dependencies |
| `backend/app/api/` | FastAPI request handling and dependency injection | Database implementation details |
| `backend/app/services/` | AI mentor orchestration and application use cases | HTTP and React concerns |
| `backend/app/domain/` | Deterministic simulation and roadmap engines | Database, auth-provider, or UI imports |
| `backend/app/repositories/` | Supabase PostgreSQL persistence adapters | Business decisions or prompt construction |
| `backend/app/auth/` | Authentication verification abstraction | Feature-specific authorization rules |
| `supabase/` | PostgreSQL migrations, row-level security, and auth policy definitions | Application logic |

## Target Repository Layout

```text
pathpilot/
├── app/                         # Next.js App Router routes
│   ├── (marketing)/
│   ├── dashboard/
│   ├── onboarding/
│   ├── careers/
│   ├── roadmap/
│   ├── simulations/
│   ├── settings/
│   └── api/                     # Thin BFF/proxy route handlers only
├── components/
│   ├── dashboard/
│   ├── roadmap/
│   ├── simulation/
│   ├── careers/
│   └── ui/
├── lib/
│   ├── ai/
│   ├── auth/
│   ├── contracts/
│   ├── features/
│   ├── simulation/
│   └── roadmap/
├── backend/
│   └── app/
│       ├── api/
│       ├── auth/
│       ├── core/
│       ├── domain/
│       ├── models/
│       ├── repositories/
│       └── services/
├── supabase/
│   └── migrations/
├── styles/
├── types/
└── package.json
```

## Runtime Topology

The Next.js frontend and FastAPI backend are separate deployables. Next.js uses server-side route handlers only as a thin backend-for-frontend boundary; it does not duplicate domain logic. FastAPI owns the career analysis, mentor, roadmap, and simulation APIs. Supabase owns authentication, PostgreSQL storage, and row-level policies. This separation allows the simulation engine to scale to a large scenario library without any dependency on dashboard UI code.

## Migration Rules

Existing Vite/tRPC implementation files are treated as source material only and will not remain on the primary runtime path. All feature behavior is represented through typed contracts before it is rebuilt behind new module boundaries. Supabase credentials are deliberately absent from the repository; integration requires project-provided environment values during the final configuration phase.
