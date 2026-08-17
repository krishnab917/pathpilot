# PathPilot Performance Evolution — Checkpoint 20

## Scope

Checkpoint 20 gives students a private, on-demand CSV export of their planning activity history. It is available from **Overview → Your planning activity** only when activity records exist. The export is generated in the browser after a separate protected query returns the student’s own bounded data.

## Export Boundary

The server reads at most 100 activity rows, newest first, constrained by the authenticated user ID. It selects only the event type, subject type, and timestamp. The client converts the neutral student-facing title, subject category, and timestamp into CSV.

| Included in CSV | Explicitly excluded |
| --- | --- |
| Neutral activity label, subject category, and timestamp. | Event metadata, goal/project names or details, skills, links, opportunity eligibility, raw simulation evidence, behavioral scores, mentor conversations, recommendations, identifiers, and user data outside planning activity. |

The export does not create, update, clear, share, upload, or otherwise alter student data. It is not a personality assessment, a career prediction, or a recommendation change.

## Student Experience

The activity panel now provides **Export** beside the existing Clear history control. Selecting it downloads `pathpilot-planning-activity.csv` locally. The panel explicitly describes the data boundary. If the student has no records, no export action is presented; if the on-demand query returns no records, the app provides a concise notice instead of generating an empty file.

## Validation

| Check | Result |
| --- | --- |
| Focused tests | Five focused tests verify CSV escaping, neutral-only fields, the authenticated user predicate, the 100-record cap, and metadata exclusion. |
| Full regression | `pnpm test` passed: 34 files and 91 tests. |
| TypeScript and build | `pnpm check` and `pnpm build` passed. Existing deferred rich-renderer chunk-size warnings remain warnings only. |
| Route check | The protected Overview route resolves through its signed-out workspace gate in the available browser session. |

## Focused User Acceptance

Sign in with planning activity present. Open **Overview**, select **Export**, and inspect the downloaded CSV. Confirm that it contains only activity labels, subject categories, and timestamps. Confirm that it does not include goal or project details, mentor text, simulation information, recommendations, or other private metadata. Then confirm that exporting has not changed the timeline or any other workspace data.
