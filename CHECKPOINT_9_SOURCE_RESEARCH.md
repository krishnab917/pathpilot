# Checkpoint 9 Source Research

## Official Kaggle Sources

| Source | URL | Verified finding relevant to PathPilot |
| --- | --- | --- |
| Kaggle API documentation | https://www.kaggle.com/docs/api | Kaggle documents programmatic interaction with resources including competitions, API-key OAuth/token authentication, and dynamic rate limits that can return HTTP 429. |
| Kaggle competition documentation | https://www.kaggle.com/docs/competitions | Kaggle states that competitions span different stages of machine-learning careers; it identifies Getting Started competitions as the most approachable, and directs participants to inspect each opportunity’s rules, overview, evaluation, timeline, and prizes. |
| Kaggle competitions listing | https://www.kaggle.com/competitions | The official listing exposes ongoing competition and hackathon opportunities, including approachable Knowledge/Getting Started offerings and time-bounded featured events. |

## Controlled Integration Boundary

The first source should preserve Kaggle as the authority for the title, page URL, deadline/timeline information, rules, and eligibility. PathPilot should display the source name, an official outbound URL, a last-verified timestamp, and an explicit instruction to review the official rules and eligibility before joining. It should not claim that a student is eligible, fabricate deadlines, or create entries without a source URL.

## Alternative Official Source Discovery

| Source | URL | Verified finding relevant to PathPilot |
| --- | --- | --- |
| Major League Hacking | https://www.mlh.com/ | MLH describes its programs as student-focused hackathons, developer programs, and global community events. |
| MLH season event listing | https://mlh.com/seasons/2026/events | Search discovery identifies the official event listing as a source for upcoming hackathons. |
| Devpost | https://devpost.com/ | Devpost describes its platform as a place to participate in virtual and in-person hackathons to build products and practice skills. |

The public Kaggle list endpoint probed during this checkpoint returned HTTP 400 with the attempted undocumented query shape. It will not be used as a source integration without a documented request contract or user-supplied credentials. The implementation therefore needs to prefer a source with an accessible official listing and retain the same verification, attribution, and no-eligibility-claim boundary.

## Direct Listing Review and Selection

The official MLH 2026 season page rendered an accessible event-card listing with event title, date range, location, in-person or digital mode, optional high-school or diversity tags, and a source-provided outbound event link. At the time reviewed, its visible 2026 entries were labeled as past events, so any integration must filter past end dates instead of presenting them as current opportunities. The Devpost public listing did not render usable listing content in the available browser session.

**Selected controlled first source: Major League Hacking (MLH) season listing.** The first integration will use a small, source-attributed, manually verified set of currently valid MLH event records rather than unsupported scraping or undocumented endpoints. Each stored record must carry its official source URL and its verification time. A future checkpoint can add a documented refresh endpoint after its source contract is independently verified.

## First Verified Record

The official NASA Space Apps Challenge page states that its 2026 event occurs **November 14–15, 2026**, welcomes participants of all ages and skill levels, and directs users to its own registration flow. This provides a currently future-dated, directly attributable record for the first controlled ingestion. PathPilot will not infer that any individual student is eligible or registered; it will preserve the official page URL and direct the student to review the source’s rules, privacy terms, and age/guardian requirements.
