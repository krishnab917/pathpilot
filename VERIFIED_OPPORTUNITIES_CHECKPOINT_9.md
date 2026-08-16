# PathPilot Performance Evolution — Checkpoint 9

## Scope

Checkpoint 9 introduces a deliberately constrained verified-opportunities foundation. It adds one directly attributable, source-fetched record and a student-controlled save state; it does **not** claim eligibility, create a broad scraped directory, add background polling, or modify career guidance, simulations, roadmaps, or project behavior.

## Implemented Model

| Layer | Behavior |
| --- | --- |
| Source catalog | `opportunity_sources` records a named official source, its URL, source type, verification note, verification timestamp, and active state. |
| Opportunity catalog | `opportunities` stores the official source link, application link, event timing, participation mode, location, country tags, eligibility summary, status, and record verification time. |
| Student state | `student_opportunity_states` records only the signed-in student’s `saved` or `dismissed` decision for an opportunity. |
| Security | Row-level security permits authenticated students to read active sources and opportunities while limiting opportunity-state reads and writes to `auth.uid() = user_id`. |
| Source ingestion | A server-only parser fetches the official NASA page, requires its published 2026 date and all-ages audience statements, then upserts the source and opportunity via the service-role client. A protected refresh procedure is administrator-only; a failed fetch preserves the prior verified record. |
| Workspace | A dedicated Opportunities section loads through its own query scope, avoiding the broad dashboard aggregation. It exposes source attribution, timing, eligibility guidance, a source-page link, Save/Remove state, contextual errors, and the administrator-only source-refresh control. |

## Controlled First Source

The first verified record is **NASA Space Apps Challenge 2026**. The server fetched its official page during validation, checked the page’s published November 14–15, 2026 date and all-ages/skill-level statement, and then persisted the resulting record with the live verification timestamp. It has a clear instruction for students to review official rules, registration, privacy, local availability, and age or guardian requirements. The record is a lead to independently review; it is not a personalized eligibility assessment or registration claim.

## Source Decision

The source review is preserved in `CHECKPOINT_9_SOURCE_RESEARCH.md`. An attempted undocumented Kaggle listing request was rejected rather than integrated. The official MLH listing was accessible but showed past entries at review time, and the available Devpost listing did not yield usable browser-rendered listing data. The official NASA event page provided a direct, future-dated, attributable record, so it was selected for this deliberately small first release.

## Validation

| Check | Result |
| --- | --- |
| Supabase migrations | Applied successfully to the active PathPilot project. The initially empty catalog was refreshed through the new server-only official-source fetch. A bounded database read confirmed the NASA record, its `details_on_source` participation boundary, source name, and fresh verification timestamp. |
| TypeScript | `pnpm check` passed. |
| Regression suite | `pnpm test` passed: 26 files and 63 tests. New tests cover source parsing and fetch behavior, administrator-only refresh authorization, opportunity router identity forwarding, dedicated query scope, source-attributed listing behavior, dismissal filtering, availability checks, user-scoped save persistence, and real Supabase RLS for catalog-versus-student state. |
| Production build | `pnpm build` passed. Existing deferred rich-Markdown chunk-size warnings remain warnings only. |
| Render and console | The new route resolves through the signed-out access gate without client-side runtime errors in the available browser session. |
| Security review | Supabase reports only the existing unrelated leaked-password-protection warning. No opportunity-table RLS warning was introduced. |

## Focused User Acceptance

Sign in and open **Opportunities**. Confirm the NASA Space Apps Challenge record shows its dates, source name, verification date, official page link, and review-the-rules guidance. Use Save and then Remove; refresh and confirm the choice persists. Open the official page separately and confirm that PathPilot did not promise eligibility or registration. As the project administrator, use **Refresh official source** and confirm the record’s verification date refreshes only after the official page is reached; a source failure should leave the previous record in place and show a contextual error.

## References

[1]: https://www.spaceappschallenge.org/ "NASA Space Apps Challenge"
[2]: https://www.kaggle.com/docs/api "Kaggle API documentation"
[3]: https://www.kaggle.com/docs/competitions "Kaggle competition documentation"
[4]: https://www.mlh.com/seasons/2026/events "Major League Hacking 2026 season schedule"
