# PathPilot Career-Driven Roadmap Intelligence V2 — Checkpoint 59

## Purpose and scope

This checkpoint replaces the previous broad recommendation templates for four initial, explicit acceptance pathways: **Software Engineer**, **Doctor / Physician**, **Entrepreneur / Startup Founder**, and **Environmental Scientist**. It establishes the reusable deterministic foundation for the larger V2 roadmap upgrade without fabricating live opportunities, school offerings, course availability, or student records.

## What changed

| Area | Delivered behavior |
|---|---|
| Career requirement graph | A source-controlled requirement/action graph defines three primary actions and one secondary exploration action for each initial pathway. Each action includes a stable requirement ID, category, effort estimate, coverage terms, student-gap explanation, practical tip, country context, and general-verification label. |
| Deterministic selection | The generator uses the **active roadmap career** when it exists, then filters its action graph against recorded skills, activities, goals, projects, and roadmap milestones. The latest simulation remains contextual evidence and cannot replace the active target. |
| Country and grade context | United States, India, and United Kingdom contexts produce different preparation language. Grade 11 and above receive a more advanced software-project expectation than lower grades. Unavailable local information remains a check-with-your-school/provider instruction. |
| Primary versus exploration | Up to three gap-targeted **Do this next** actions are ordered before one optional **Explore** action. Actions marked as already evidenced are not repeated. |
| Student control | Nothing is created automatically. When a student selects **Add**, the resulting goal and milestone retain the recommendation’s requirement, gap, tip, planning country, and general-source context. |
| Persistence | `roadmap_recommendations` received additive, nullable structured-metadata columns through the authorized Supabase migration channel. Existing rows remain valid and unchanged. |

## Safety and data-verification boundaries

All delivered actions are labeled **General recommendation — verify local availability**. No item is presented as a live, current opportunity; no school course, club, deadline, eligibility criterion, or external URL is invented. The new deterministic graph does not use response-time data, does not make psychological claims, and does not infer a career decision from simulation behavior.

## Validation

The Supabase table inventory confirms all eight additive metadata columns: `action_kind`, `requirement_id`, `requirement_label`, `student_gap`, `tip`, `country_context`, `verification_status`, and `source_label`.

Focused regression coverage proves career binding, country and grade variation, evidence-based duplicate prevention, distinct medical/startup/environmental pathways, primary-before-exploration order, structured metadata completeness, unsupported-career non-generation, active-roadmap preservation, and Add-to-Roadmap context preservation. The final command `pnpm test && pnpm check && pnpm build` passed with **71 test files / 211 tests**, TypeScript validation, and production build success.

The protected roadmap route remains stable and presents its intentional sign-in gate at 390px mobile. An authenticated visual walkthrough of newly generated recommendation cards requires a student session and is not claimed as complete.

## Deliberately deferred

The remaining eleven curated careers, verified live opportunity ingestion/ranking, source-linked online courses, broader grade-stage coverage, dashboard next-best-action selection, richer project-assistant context, and all-career final acceptance matrix remain separate work. They should be implemented in further independently testable checkpoints; this checkpoint does not claim the full V2 specification is complete.
