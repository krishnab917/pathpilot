# PathPilot V1.1 Audit: Simulation-to-Roadmap Conversion

## Current Product Boundary

PathPilot’s active runtime is the Vite, React, tRPC, Express, and Supabase application under `client/` and `server/`. The canonical student workspace route is `/app`, with the existing roadmap experience under `/app/roadmap`. V1.1 must extend these active modules; it must not introduce a parallel roadmap application or replace the adaptive simulation engine.

## Confirmed Conversion Defect

The completed adaptive simulation result view presents a primary **Review next steps** action. Its handler currently clears local result state and the simulation ID, which returns the student to the simulation start state instead of moving them forward. The replacement behavior must navigate to `/app/roadmap`, retain the completed simulation identifier as handoff context, and make the roadmap explain why the student arrived there.

## Reusable V1.0 Foundations

| Foundation | Current state | V1.1 use |
|---|---|---|
| Adaptive simulation | Persists branching state, decision history, behavioral evidence, compatibility results, and debrief summary. | Produce student-safe simulation context for roadmap recommendations. |
| Roadmap | Persists one active roadmap with milestones, deadlines, priority, effort, status, and progress. | Continue using the active roadmap as the durable execution plan. |
| Goals, projects, and mentor | User-scoped through Supabase RLS and already available to dashboard/mentor prompts. | Prevent redundant suggestions and keep mentoring roadmap-aware. |
| Profile | Stores grade, freeform location, interests, skills, activities, and preferences. | Extend additively with one primary roadmap country and education context. |
| Auth and RLS | Browser uses public Supabase credentials; user records are accessed with request-scoped authenticated clients. | Apply the same ownership boundary to recommendations and country-change state. |

## Gaps to Address

The application lacks a persisted recommendation queue, recommendation decision history, recommendation phase metadata, a singular country field, an education-context layer, and a country-change workflow. The existing AI roadmap generation uses profile and latest simulation summary, but it creates a fixed nine-milestone plan immediately; it does not first show the student controlled recommendations that the V1.1 conversion loop requires.

## V1.1 Design Direction

The completed simulation will hand off a durable simulation ID to `/app/roadmap`. That section will read the owned completed simulation, display a short debrief derived from stored career, compatibility, and behavioral signals, and offer a student-controlled set of persisted recommendations. Recommendations will be generated from profile, current goals/projects, simulation context, and a server-side national education-context configuration. They will be general guidance unless a separately verified opportunity source is available; no live opportunities will be fabricated.

The student must explicitly add, skip, edit, or request AI help for each recommendation. Adding converts a recommendation into a real roadmap milestone or goal rather than silently overwriting an existing plan. Changing a country will save the new country but will not change or delete the active roadmap until the student explicitly asks for refreshed recommendations.

## Initial National-Context Evidence

The initial configuration will support broad, non-prescriptive education context for the United States, India, and the United Kingdom. For the United Kingdom, UCAS explains that course providers set their own entry requirements and that these can include qualifications, subjects, grades, admissions tests, interviews, and course-specific requirements. For India, the official JEE Main site identifies the Joint Entrance Examination (Main), includes B.E./B.Tech pathways, and is administered within the Ministry of Education/National Testing Agency ecosystem. These facts justify contextual phrasing only; PathPilot will not state that a student must take a particular examination or present any examination, scholarship, internship, or program as a live opportunity without separately verified source data.

### Sources

- [UCAS: University Entry Requirements](https://www.ucas.com/applying/you-apply/what-and-where-study/entry-requirements)
- [National Testing Agency: JEE Main](https://jeemain.nta.nic.in/)
