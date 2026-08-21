# PathPilot Deterministic Roadmap Engine — Checkpoint 60

## Scope

Checkpoint 60 completes the **deterministic requirement-graph coverage** for all fifteen curated simulation careers and turns the previously three-country planning contract into a controlled catalog of fifty canonical planning countries. It preserves the existing student-owned profile, roadmap, goal, project, recommendation, simulation, and opportunity records; no country change or refreshed recommendation is executed automatically.

## All-career requirement graph

Every supported simulation career now has four individually authored deterministic action nodes: three primary, gap-targeted actions and one exploratory action. They are not name-swapped copies. Each node contains a stable career requirement, category, coverage terms, estimate, priority, student-gap explanation, practical tip, and a general-verification label.

| Career group | Covered career pathways |
|---|---|
| Technology | Software Engineer; AI / Machine Learning Engineer; Cybersecurity Analyst; Data Scientist |
| Health, law, and business | Doctor / Physician; Lawyer; Entrepreneur / Startup Founder; Product Manager; Financial Analyst |
| Engineering and built environment | Aerospace Engineer / Astronaut Pathway; Mechanical Engineer; Architect |
| Science and design | UX / Product Designer; Environmental Scientist; Research Scientist |

The active roadmap target is the first input to recommendation selection. The latest simulation continues to provide bounded contextual evidence but cannot replace that active target. Existing skills, activities, goals, projects, and roadmap milestones suppress matching action nodes, so completed or active work is not reintroduced as a generic next step.

## Canonical planning-country contract

The country selector now publishes **50** requested canonical display names, ISO-style two-letter codes, and regional groupings. It preserves one primary planning country and supports searchable native keyboard navigation through a search field and region-grouped option list.

| Country-context state | Behavior |
|---|---|
| Verified general context | United States, India, and United Kingdom retain the existing country-specific general planning language. These are not admissions, exam, or eligibility guarantees. |
| General context | The other canonical countries are valid planning contexts with region/name metadata and cautious generic preparation guidance. The interface does not invent national requirements, providers, exams, programmes, deadlines, or eligibility. |
| Unknown context | Non-canonical values resolve to a transparent unknown state and cannot be saved through the country-update procedure. |

The existing country-change control updates only the student profile context. It then offers an explicit choice to keep the existing roadmap or refresh pending recommendations; accepted goals, projects, archived history, and the active roadmap are not deleted by a country save. The mentor now receives the persisted active career, planning country, and education stage as structured context, so it does not need to infer those facts from a message.

## Verification

The all-career and country foundation regression confirms all fifteen catalog careers have three primary actions plus one exploratory action, requirement metadata, deterministic output, meaningful United States/India/United Kingdom variation for Software Engineer and Doctor / Physician, grade variation, duplicate prevention, and distinct primary-action coverage. It also confirms all fifty country codes and labels are unique, canonical countries are validated server-side, onboarding contains search and region groups, country save is profile-only, and mentor context receives country/grade/active-career fields.

`pnpm test && pnpm check && pnpm build` passed with **72 test files / 220 tests**, TypeScript validation, and a successful production build. The authenticated onboarding country selector and roadmap country-change interaction require a real student session; the signed-out mobile route remains intentional and was not presented as authenticated visual evidence.

## Deferred work

The next checkpoint must add **verified live** course and opportunity records with explicit source URLs, eligibility, current verification status, and no fabricated availability/deadlines. That work remains deliberately separate from this foundation; current deterministic nodes retain the label **General recommendation — verify local availability**.
