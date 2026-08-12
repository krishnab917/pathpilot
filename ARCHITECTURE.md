# PathPilot Technical Architecture

## Product Scope

PathPilot is implemented as a full-stack student career platform. The MVP protects persistent student data behind authenticated procedures and presents the experience through a responsive React application. The system treats AI output as **advisory guidance**, not a guarantee of career outcomes, and requires structured validation before storing generated recommendations.

## Architectural Decisions

| Area | Decision | Rationale |
| --- | --- | --- |
| Application runtime | React 19 client with an Express/tRPC server | Provides end-to-end TypeScript contracts and a single deployable SaaS application. |
| Authentication | Platform-provided OAuth session and protected tRPC procedures | Avoids custom password handling while providing persistent, secure accounts. |
| Persistence | MySQL-compatible relational database using Drizzle ORM | Supports typed models, relations, migrations, and efficient scoped queries. |
| AI integration | Server-side built-in LLM helper with strict JSON schemas | Keeps credentials private and ensures career discovery results can be validated before persistence. |
| Product navigation | Purpose-built student workspace shell | Supports the roadmap, mentor, simulations, and dashboard without reusing a generic administration UI. |
| Safety posture | Profile-scoped queries, structured AI output, explicit error handling | Prevents cross-user data access and reduces unreliable AI response handling. |

## Domain Model

The system centers on an authenticated user and a one-to-one StudentProfile. A profile owns career matches, goals, roadmaps, simulations, mentor conversations, and portfolio projects. Careers are managed as reusable records so recommendations reference a stable career entity rather than duplicating career metadata across each student.

Roadmaps contain yearly milestones. Each milestone is typed as a skill, project, or experience and records the data needed for a meaningful plan: deadline, priority, estimated hours, resource link, and progress. Simulations persist student choices and three individual assessment dimensions so the fit analysis is auditable and repeatable.

## AI Workflows

The Career Discovery workflow receives a normalized profile, asks the model for structured JSON, validates the shape, and rejects outputs that do not contain **exactly five** unique recommendations. The server then upserts the career records and replaces only the requesting student's previous matches. The mentor workflow sends a bounded, ordered context window consisting of the profile summary, active roadmap, current goals, and prior messages. Conversations are stored by the server, never entrusted to browser-local state as the source of truth.

## Privacy and Product Boundaries

PathPilot stores only the student data necessary for the planned functionality. Every feature procedure scopes reads and writes to the authenticated user. The initial MVP does not process resumes, applicant records, payments, school administrator access, or public opportunity scraping. Those items are intentionally deferred until their data, permission, and safety requirements are separately designed.

## Interface System

The interface uses a warm off-white canvas, graphite text, muted blue surfaces, and a restrained cobalt accent. The visual language focuses on generous spacing, compact data cards, crisp typography, soft shadows, and motion constrained to opacity and transforms. Mobile navigation is designed as a condensed workspace rather than a scaled-down desktop screen.
