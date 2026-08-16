# PathPilot Curated Opportunities Expansion

## Delivered Scope

PathPilot now provides a **101-record** popular opportunity catalog. Records are source-attributed, category-filterable, and career-aligned without presenting either directory inclusion or a matching tag as an eligibility determination.

| Requirement | Delivered behavior |
| --- | --- |
| Career alignment | The opportunities page starts in a career-aligned view. It compares each listing’s source-derived career domains with the student’s stored career directions and shows the matching career names on the record. Students can switch to all directions at any time. |
| Categories | Compact filters are available for **Internships**, **Competitions**, and **Research**, plus an All view. |
| Catalog size | Live database verification confirmed **101 active records**. |
| Source transparency | Every item identifies its directory source, verification time, and participation page. The page explicitly tells students to check the organizer’s rules, dates, eligibility, location, privacy terms, and age or guardian requirements. |
| Avoiding fabrication | Records are normalized from live source-page content. Unknown structured dates are displayed as “Dates on source page” rather than invented. |

## Live Catalog Composition

| Category | Active records | Curation basis |
| --- | ---: | --- |
| Competitions | 71 | NASA Space Apps Challenge plus Hack Club’s published high-school hackathon directory. |
| Research | 25 | Public PathwaysToScience summer-research directory entries. |
| Internships | 5 | PathwaysToScience entries whose published title identifies an internship. |
| **Total** | **101** | Source-fetched and upserted during validation. |

## Source and Refresh Boundary

An administrator-only **Refresh popular catalog** control executes server-side source adapters. The adapters fetch the Hack Club high-school hackathon directory and the PathwaysToScience public summer-research results page, then normalize only source-present titles, organizer/program links, date text, location text, and summary material. Existing listings stay in place if a directory cannot be reached. NASA Space Apps Challenge remains separately source-validated from its official event page.

Hack Club and PathwaysToScience are identified in the product as **directory sources**, not as individual event or program organizers. Each imported record links students onward to the listed organizer or program page. This distinction is intentional: a directory listing is useful for discovery but is not a guarantee that a student can participate.

## Schema and Security

The catalog now records the requested category vocabulary, a source-date label for unstructured dates, and multi-valued career domains. The shared opportunity catalog remains readable to authenticated students, while each student’s Save/Remove state remains user-scoped through the existing RLS policy. The refresh procedure is server-only and administrator-gated.

## Validation

| Check | Result |
| --- | --- |
| Live source refresh | Completed successfully: 100 directory-derived records imported, alongside the existing NASA record. |
| Live database count | Verified 71 competition, 25 research, and 5 internship records—101 total. |
| TypeScript | `pnpm check` passed. |
| Regression suite | `pnpm test` passed: 27 files and 66 tests, including source-parser and filter-forwarding coverage. |
| Production build | `pnpm build` passed. Existing deferred rich-Markdown bundle warnings remain warnings only. |
| Route check | The updated route resolves through the expected signed-out access gate in the available browser session. Authenticated filtering and Save/Remove remain the user acceptance step. |
| Security advisor | No opportunity-catalog RLS warning was introduced. The existing Supabase leaked-password-protection warning remains open. |

## Focused Acceptance

Sign in with a student who has completed career discovery, then open **Opportunities**. Confirm that the default view shows alignment tags for the student’s career directions. Select each category filter and confirm the category tag changes accordingly. Use **Showing all directions** to see catalog records outside the student’s matches. Open several source pages, verify they are clearly labeled as external discovery leads, and Save then Remove at least one record to confirm student-specific persistence.

## References

[1]: https://hackathons.hackclub.com/ "Hack Club High School Hackathons"
[2]: https://www.pathwaystoscience.org/programs.aspx?u=&r=&s=&sa=either&p=either&c=either&f=&dd=SummerResearch_Summer%20Research%20Opportunity&ft=&submit=y&dhub=SummerResearch_Summer%20Research%20Opportunity "PathwaysToScience Summer Research Results"
[3]: https://www.spaceappschallenge.org/ "NASA Space Apps Challenge"
