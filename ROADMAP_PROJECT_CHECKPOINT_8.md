# PathPilot Performance Evolution — Checkpoint 8

## Scope

This checkpoint establishes one focused bridge from planning to evidence: an owned **project** roadmap milestone can create one real project workspace record. It does not add opportunities, change AI prompts, alter simulations, or introduce background jobs.

## Implemented Foundation

| Layer | Behavior |
| --- | --- |
| Supabase schema | Added a nullable `projects.roadmap_milestone_id` foreign key with `ON DELETE SET NULL`, plus a partial unique index that permits at most one project per student and roadmap milestone. Existing projects remain unchanged. |
| Ownership | The server resolves the milestone through an inner roadmap ownership join before any project write. A student cannot use a milestone outside their own roadmap. |
| Duplicate handling | Re-selecting **Start project** returns the existing owned project rather than creating a duplicate. |
| Project creation | Only `project`-category milestones qualify. The existing project table and project RLS policy are reused; a project starts at zero progress and remains editable from Portfolio. |
| Roadmap UI | Each project milestone now exposes a compact **Start project** action beside its existing progress action. Success opens Portfolio. |
| Portfolio UI | Projects created from roadmap actions display a compact **Roadmap action** provenance tag. |
| Failure handling | A project-creation failure remains visibly and accessibly reported directly below the roadmap action table. |

## Validation

| Check | Result |
| --- | --- |
| Supabase migration | Applied successfully to the active PathPilot Supabase project. Schema inspection confirms the nullable column and foreign-key relation on `projects`. |
| TypeScript | `pnpm check` passed. |
| Regression suite | `pnpm test` passed: 23 files and 54 tests. New router coverage verifies signed-in identity forwarding; direct repository tests cover the owned-roadmap lookup, non-project rejection, and duplicate return path. |
| Production build | `pnpm build` passed. Existing deferred rich-Markdown chunk-size warnings remain warnings only. |
| Render and console | Public and signed-out workspace route screenshots render normally; the latest browser-console window contains no client-side runtime errors. |
| Security review | Supabase reports the existing unrelated warning that leaked-password protection is disabled. No new RLS warning was introduced by this migration. |

## Focused User Acceptance

After signing in with an account that has an active roadmap, locate a **project** milestone and select **Start project**. Confirm PathPilot opens Portfolio, creates exactly one project with the same title and roadmap description, and displays the **Roadmap action** tag. Return to the same milestone and select **Start project** again; confirm it opens the existing project list without creating a duplicate. Non-project milestones should not show this control.
