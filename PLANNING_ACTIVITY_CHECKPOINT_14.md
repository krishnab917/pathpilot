# PathPilot Performance Evolution — Checkpoint 14

## Purpose

Checkpoint 14 establishes a small, private history of the student’s **planning activity**. It records only when a student creates, edits, progresses, or completes a goal, or saves, dismisses, or turns a verified opportunity into a goal. This is an operational foundation for future learning summaries; it does **not** change career matches, behavioral evidence from simulations, roadmap recommendations, or accepted student choices.

## Data Boundary

The new `behavioral_activity_events` table stores a user ID, event type, subject type and ID, bounded metadata, and timestamp. It intentionally does not store free-text goal content, mentor conversations, simulation trait signals, a personality score, a diagnosis, or a career-success prediction.

| Activity | Event type | Stored metadata |
| --- | --- | --- |
| New goal | `goal_created` | Goal category, estimated hours, and whether a deadline exists. |
| Goal edit | `goal_updated` | Names of edited fields only, never their values. |
| Goal progress or completion | `goal_progress_updated` or `goal_completed` | Numeric progress only. |
| Opportunity action | `opportunity_saved`, `opportunity_dismissed`, or `opportunity_goal_created` | No additional metadata. |

The new table is additive, uses a user-and-time index, and has RLS enabled. Its live policy requires `auth.uid() = user_id` for all operations. The server records events after the corresponding student action succeeds and treats activity persistence as non-blocking, preserving the existing action if this supplementary history is temporarily unavailable.

## Student Transparency

Goals and Opportunities now explain that PathPilot records a minimal private planning history for future learning summaries. Both disclosures expressly say this history is **not a personality assessment**. No new behavior-based recommendation, ranking, or automatic roadmap change is introduced in this checkpoint.

## Validation

| Check | Result |
| --- | --- |
| Supabase migration | Applied successfully to the active PathPilot project. |
| Live RLS verification | The new table has RLS enabled and its `behavioral_activity_event_owner` policy uses `auth.uid() = user_id` for both access and checks. |
| Focused tests | Three planning-activity tests verify bounded metadata and creation, edit, progress, and completion classification. Opportunity repository tests also assert authenticated event writes. |
| Full regression | `pnpm test` passed: 31 files and 81 tests. |
| TypeScript and build | `pnpm check` and `pnpm build` passed. |
| Security review | No new activity-event warning appeared. The pre-existing, unrelated Supabase leaked-password-protection warning remains open. |
| Route check | Protected Goals and Opportunities routes resolve through their signed-out gate in the available browser session. |

## Focused User Acceptance

Sign in, create a goal, update its progress, and edit its details. Then save an opportunity and create an opportunity-linked goal. Confirm each action behaves exactly as before, while the Goals and Opportunities disclosures remain clear that planning activity is private context rather than a diagnosis. This checkpoint intentionally introduces no new personality label, career prediction, or automatic recommendation change.
