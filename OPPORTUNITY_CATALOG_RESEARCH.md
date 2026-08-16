# Career-Aligned Opportunity Catalog Research

## Source Assessment

| Source | Category coverage | Scale signal | Technical boundary | Current decision |
| --- | --- | --- | --- | --- |
| USAJOBS | Internships and public-sector entry pathways | The official search API supports paginated job results and searchable occupation and hiring-path fields. | The API requires an access key obtained through the official request process. | Strong internship source after a project-owned API credential is approved. |
| NASA STEM Gateway | Internships, research-adjacent programs, experiences, and challenges | The official page rendered a count of 172 opportunities at review time. | The interactive listing is browser-rendered; a documented bulk export or API contract still needs confirmation before it can be automated. | Strong candidate for a controlled source adapter, subject to an approved access contract. |
| NASA Space Apps Challenge | Competition | One directly attributable, future-dated official event page has already been source-fetched and validated. | Small, event-specific source; not sufficient by itself for catalog scale. | Retain as the first verified competition record. |
| PathwaysToScience | Research and STEM programs | Its public search page reports 1,051 programs and exposes discipline, student-level, geography, and deadline-oriented search dimensions. | The visible public page does not establish a bulk-export, API, or redistribution license. | High-value research discovery partner; request written data-use permission or an official export before copying records into PathPilot. |
| Hack Club High School Hackathons | Competitions | The public directory currently reports 894 high-school hackathons across 30 states and 26 countries; rendered entries include title, participation mode, date text, optional location, and an outbound organizer URL. | A curated directory rather than an individual organizer; use the displayed organizer link as the participation destination and label Hack Club as the directory source. | Suitable for a popular-competition catalog with explicit source-directory attribution and organizer links. |
| PathwaysToScience Summer Research | Research | The public directory exposes a "Browse all Summer Research programs" route whose output can be reviewed from the directory itself. | Individual record fields and a reuse boundary still require record-level inspection. | Evaluate the public result view before deciding whether to import any individual program records. |

## Non-Negotiable Catalog Standard

Every catalog record must retain an official source URL, source name, last-verified timestamp, category, career-domain tags, end or application date when the source provides one, and an explicit reminder that eligibility and deadlines must be checked on the official page. PathPilot must not create synthetic listings, infer a student’s eligibility, or represent a stale record as current.

## Product Implication

Career alignment should be model-driven from the student’s stored career-match directions and opportunity domain tags; a listing can match more than one career direction. The student-facing filter contract should be limited to **Internships**, **Competitions**, and **Research**, with a separate aligned/all scope rather than silently hiding otherwise valid verified opportunities.

## References

[1]: https://developer.usajobs.gov/api-reference/ "USAJOBS API Reference"
[2]: https://developer.usajobs.gov/apirequest/ "USAJOBS API Access Request"
[3]: https://stemgateway.nasa.gov/s/explore-opportunities?opportunitytype=internships "NASA STEM Gateway — Explore Opportunities"
[4]: https://www.spaceappschallenge.org/ "NASA Space Apps Challenge"
[5]: https://www.pathwaystoscience.org/programs.aspx "PathwaysToScience Programs Search"
[6]: https://hackathons.hackclub.com/ "Hack Club High School Hackathons"
[7]: https://www.pathwaystoscience.org/programs.aspx?u=&r=&s=&sa=either&p=either&c=either&f=&dd=SummerResearch_Summer%20Research%20Opportunity&ft=&submit=y&dhub=SummerResearch_Summer%20Research%20Opportunity "PathwaysToScience Summer Research Results"
