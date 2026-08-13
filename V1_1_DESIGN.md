# PathPilot V1.1 Design: Country-Aware Roadmap Conversion

## Product Contract

The V1.1 loop is **simulation → debrief → roadmap recommendations → student decision → roadmap/goals → progress → mentor context**. A completed simulation’s primary action routes to `/app/roadmap` and includes its owned simulation ID in the URL query string. The roadmap reads this context from the server; it never trusts a client-provided behavioral profile, score, career result, or country snapshot.

## Additive Data Model

| Data | Location | Purpose |
|---|---|---|
| `country_code`, `education_system` | `student_profiles` | Stores exactly one student-selected primary roadmap country and a non-authoritative system label. |
| `roadmap_recommendations` | New RLS-protected table | Stores a recommendation’s simulation source, career, country snapshot, phase, rationale, work estimate, optional suggested deadline, and student-controlled status. |
| `source_simulation_id`, `country_snapshot`, `context_version` | Recommendation row | Makes the recommendation explainable and durable even if the student later changes country. |
| `status`, `accepted_goal_id`, `roadmap_id` | Recommendation row | Records add/skip decisions without silently changing the roadmap; acceptance creates a real owned goal and optionally links the active roadmap. |

Recommendation status is constrained to `pending`, `accepted`, `skipped`, or `dismissed`. Existing active roadmaps are preserved. A country change updates the profile only; it does not archive, regenerate, edit, or delete a roadmap. The user can explicitly request a fresh recommendation set after the change.

## National Context Layer

Country context is server-only configuration, not UI conditionals. The initial supported configurations are deliberately small: `US`, `IN`, and `GB`. Each contains a country label, education-system label, cautious planning signals, and a source note. It contains **no live opportunities**, no claims about eligibility, and no directive to take a specific examination. Unsupported countries receive a general, transparent context rather than fabricated national requirements.

The service constructs recommendations from the intersection of: the authenticated student’s selected country, grade, education context, profile skills and activities, current goals and projects, completed simulation career/behavioral result, and existing roadmap. It filters duplicate or already-completed work before persistence. Country, career, and grade change the recommendation rationale and planning language; recommendation logic never selects or represents live programs, scholarships, internships, or deadlines.

## Student-Controlled Conversion

The recommendation UI exposes **Add**, **Skip**, **Edit**, **Change deadline**, **Change priority**, and **Ask AI**. “Add” creates real persisted student work; the original recommendation remains a record of why it was suggested. “Ask AI” routes a prefilled, bounded question to the existing mentor rather than creating a parallel LLM client. “Build with AI” may invoke the existing roadmap generator only after the student explicitly elects to build a plan; its prompt receives the owned simulation, profile, country context, current goals, and existing roadmap summary.

## Security and Integrity

All recommendation reads and mutations derive `user_id` from the verified request context. Simulation IDs are validated and fetched through an ownership-scoped query before they become recommendation input. The service-role key remains excluded from this feature. RLS policies restrict recommendation rows to their owner, and recommendation acceptance verifies ownership before creating goals or linking a roadmap.
