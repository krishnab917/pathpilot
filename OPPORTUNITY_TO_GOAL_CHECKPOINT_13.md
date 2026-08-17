# PathPilot Performance Evolution — Checkpoint 13

## Scope

Checkpoint 13 turns a verified opportunity into a student-controlled planning action. A student can select **Set as goal**, read the confirmation boundary, and create an editable goal. PathPilot does not submit an application, infer eligibility, decide that an opportunity is appropriate, or create a roadmap milestone without the student’s choice.

## Verified Metadata Boundary

The server resolves the requested opportunity from the existing active, verified catalog before it creates anything. The resulting goal contains only the opportunity title, supplied summary, organizer eligibility guidance, and the existing application and source URLs.

| Behavior | Checkpoint 13 rule |
| --- | --- |
| Eligibility | Preserve the organizer’s supplied eligibility summary; require the student to confirm it with the organizer. |
| Deadline | Do not set a goal deadline from program dates, registration-open dates, or directory source timing. |
| Ownership | Every read and goal write is constrained to the authenticated student ID. |
| Duplicate prevention | A stable internal resource marker is checked against that student’s existing goals. Repeating the request returns the original goal rather than creating another. |
| Student control | The goal is created as an ordinary editable goal; the student can subsequently review, change, pause, or remove it through existing goal controls. |

## User Experience

The Opportunities workspace now provides a compact **Set as goal** action beside its existing Save and Source page controls. Selecting it opens an inline confirmation that explains exactly what will be copied and that no deadline is inferred. Successful creation invalidates the existing Goals and Overview data, and existing notification styling reports either a newly created goal or an already-linked record.

The existing Goals workspace now provides an **Edit** action for every student-owned goal, including opportunity-created goals. The inline editor permits the student to revise the title, description, priority, deadline, and organizer links. A deadline remains blank after handoff unless the student deliberately enters one, and the existing goal update procedure maintains the authenticated user-ID constraint for every update.

## Validation

| Check | Result |
| --- | --- |
| Focused repository coverage | Five opportunity-repository tests pass, including verified active lookup, authenticated write, no inferred deadline, duplicate return, and owner-scoped edit of an opportunity-created goal. |
| Full regression suite | `pnpm test` passed: 30 files and 78 tests. |
| TypeScript | `pnpm check` passed. |
| Production build | `pnpm build` passed. Existing deferred rich-renderer size warnings remain warnings only. |
| Route check | The protected Opportunities route resolves through its signed-out access gate in the available browser session. |

## Focused User Acceptance

Sign in, open **Opportunities**, and choose a listing. Select **Set as goal**, read the confirmation, and create the goal. In Goals, confirm that the title, organizer links, and eligibility guidance are present but no deadline was added. Select **Edit**, modify the title or priority, optionally set a deadline, and save; refresh to confirm the edit persists. Return to the listing and repeat Set as goal: PathPilot should report that the opportunity is already linked rather than creating a duplicate.
