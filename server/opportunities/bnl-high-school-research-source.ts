const BNL_HSRP_URL = "https://www.bnl.gov/education/programs/program.php?q=219";
const titlePattern = /high school research program/i;
const applicationDeadlinePattern = /mar\s*20\s*(?:friday)?\s*5\s*p\.m\.\s*2026\s*application closes/i;
const gradePattern = /completed\s+11\s*(?:th)?\s+grade/i;
const countryPattern = /u\.s\.\s*citizen\s+or\s+lawful permanent resident/i;

export type VerifiedBnlHighSchoolResearchRecord = {
  source: {
    slug: "bnl-high-school-research";
    name: "Brookhaven National Laboratory High School Research Program";
    sourceUrl: string;
    sourceType: "official_event_page";
    verificationNote: string;
    verifiedAt: Date;
  };
  opportunity: {
    externalId: "hsrp-2026";
    title: "Brookhaven National Laboratory High School Research Program 2026";
    summary: string;
    category: "research";
    participationMode: "in_person";
    locationLabel: string;
    sourceDateLabel: string;
    countryCodes: string[];
    eligibleGrades: string[];
    startAt: Date;
    endAt: Date;
    applicationDeadlineAt: Date;
    eligibilitySummary: string;
    applicationUrl: string;
    sourceUrl: string;
    sourceUpdatedAt: null;
    verifiedAt: Date;
  };
};

export function parseBnlHighSchoolResearchPage(html: string, verifiedAt = new Date()): VerifiedBnlHighSchoolResearchRecord {
  const content = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
  if (!titlePattern.test(content)) throw new Error("BNL source did not confirm the High School Research Program title.");
  if (!applicationDeadlinePattern.test(content)) throw new Error("BNL source did not confirm the published 2026 application deadline.");
  if (!gradePattern.test(content)) throw new Error("BNL source did not confirm the published grade eligibility.");
  if (!countryPattern.test(content)) throw new Error("BNL source did not confirm the published U.S. citizenship or permanent-residency requirement.");
  return {
    source: {
      slug: "bnl-high-school-research",
      name: "Brookhaven National Laboratory High School Research Program",
      sourceUrl: BNL_HSRP_URL,
      sourceType: "official_event_page",
      verificationNote: "Refreshed from the official Brookhaven National Laboratory program page. The listed 2026 application deadline has passed; students must check the organizer page for a current cohort, eligibility, safety, and guardian requirements.",
      verifiedAt,
    },
    opportunity: {
      externalId: "hsrp-2026",
      title: "Brookhaven National Laboratory High School Research Program 2026",
      summary: "A six-week in-person STEM research experience for eligible high-school students at Brookhaven National Laboratory.",
      category: "research",
      participationMode: "in_person",
      locationLabel: "Upton, New York, United States — commuter program",
      sourceDateLabel: "July 6–August 14, 2026",
      countryCodes: ["US"],
      eligibleGrades: ["Grade 11", "Grade 12"],
      startAt: new Date("2026-07-06T12:30:00Z"),
      endAt: new Date("2026-08-14T21:00:00Z"),
      applicationDeadlineAt: new Date("2026-03-20T21:00:00Z"),
      eligibilitySummary: "The organizer recommends students who have completed 11th grade; its page also lists 11th and 12th grade. Participants must be at least 16 by the program start, be a U.S. citizen or U.S. Lawful Permanent Resident, hold active health insurance, and arrange their own transportation and housing. The listed 2026 application deadline has passed; verify current requirements directly with Brookhaven National Laboratory.",
      applicationUrl: BNL_HSRP_URL,
      sourceUrl: BNL_HSRP_URL,
      sourceUpdatedAt: null,
      verifiedAt,
    },
  };
}

export async function fetchBnlHighSchoolResearchRecord(fetcher: typeof fetch = fetch) {
  const response = await fetcher(BNL_HSRP_URL, { headers: { Accept: "text/html,application/xhtml+xml" } });
  if (!response.ok) throw new Error(`BNL source request failed (${response.status}).`);
  return parseBnlHighSchoolResearchPage(await response.text());
}
