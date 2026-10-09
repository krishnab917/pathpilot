// Public, checked-in sample. No student data, live availability, or database access.
// Provenance: existing NASA/BNL adapters + Hack Club directory read October 8, 2026.
export type PreviewCategory = "internship" | "competition" | "research";
export const previewCareers = [
  { name: "Software Engineer", domains: ["technology", "engineering"] },
  { name: "Designer", domains: ["design"] },
  { name: "Biomedical Researcher", domains: ["science"] },
  { name: "Teacher", domains: ["social-impact"] },
] as const;

/** One public-safe adapter for the actual product record presentation. */
export function publicOpportunityDetails(item: PublicOpportunity, alignedCareers: string[] = []) {
  return {
    ...item, participationMode: item.id === "hsrp-2026" ? "in_person" : "details_on_source",
    alignedCareers, savedStatus: null, startAt: null, endAt: null, sourceDateLabel: null,
    eligibleGrades: item.id === "hsrp-2026" ? ["Grade 11", "Grade 12"] : [],
    countryCodes: item.id === "hsrp-2026" ? ["US"] : [],
    applicationDeadlineAt: null, registrationOpensAt: null, relevanceReasons: [],
  };
}

export type PublicOpportunity = {
  id: string;
  title: string;
  summary: string;
  category: PreviewCategory;
  careerDomains: readonly string[];
  locationLabel: string;
  sourceName: string;
  sourceUrl: string;
  applicationUrl: string;
  eligibilitySummary: string;
  recordNote: string;
};
export const opportunityExamples: PublicOpportunity[] = [
  {
    id: "2026-space-apps-challenge",
    title: "NASA Space Apps Challenge 2026",
    summary:
      "A global hackathon where participants work on real-world challenges connected to space and science.",
    category: "competition",
    careerDomains: ["science", "technology", "engineering", "design"],
    locationLabel: "Local and virtual participation details on source",
    sourceName: "NASA Space Apps Challenge",
    sourceUrl: "https://www.spaceappschallenge.org/",
    applicationUrl: "https://www.spaceappschallenge.org/",
    eligibilitySummary:
      "The catalog source welcomes all ages and skill levels. Confirm current registration, local availability, rules, and age or guardian requirements with the organizer.",
    recordNote:
      "2026 catalog record. Check current event details with the organizer.",
  },
  {
    id: "hsrp-2026",
    title: "Brookhaven National Laboratory High School Research Program 2026",
    summary:
      "A six-week in-person STEM research experience for eligible high-school students at Brookhaven National Laboratory.",
    category: "research",
    careerDomains: ["science", "technology", "engineering"],
    locationLabel: "Upton, New York, United States · Commuter program",
    sourceName: "Brookhaven National Laboratory",
    sourceUrl: "https://www.bnl.gov/education/programs/program.php?q=219",
    applicationUrl: "https://www.bnl.gov/education/programs/program.php?q=219",
    eligibilitySummary:
      "The 2026 record lists grades 11–12, age 16 by the program start, U.S. citizenship or lawful permanent residency, health insurance, and independently arranged transportation and housing. Check the organizer for any future cohort.",
    recordNote:
      "Historical 2026 cohort. Its application deadline and program dates have passed.",
  },
  {
    id: "www-hyphen-hacks-com",
    title: "Hyphen-Hacks",
    summary:
      "A high-school hackathon listed by Hack Club. Check the organizer for the theme, participation rules, and registration.",
    category: "competition",
    careerDomains: [
      "technology",
      "engineering",
      "design",
      "business",
      "science",
    ],
    locationLabel: "See organizer page",
    sourceName: "Hack Club High School Hackathons",
    sourceUrl: "https://hackathons.hackclub.com/",
    applicationUrl: "https://www.hyphen-hacks.com/",
    eligibilitySummary:
      "Directory listing, not confirmation of eligibility or an available place. Review the organizer's current rules and any age or guardian requirements.",
    recordNote:
      "Public directory sample captured October 8, 2026. Not a live availability check.",
  },
  {
    id: "hackphs-tech",
    title: "hackPHS",
    summary:
      "A high-school hackathon listed by Hack Club. Review the event details and participation requirements before making plans.",
    category: "competition",
    careerDomains: [
      "technology",
      "engineering",
      "design",
      "business",
      "science",
    ],
    locationLabel: "See organizer page",
    sourceName: "Hack Club High School Hackathons",
    sourceUrl: "https://hackathons.hackclub.com/",
    applicationUrl: "https://hackphs.tech/",
    eligibilitySummary:
      "Directory listing, not confirmation of eligibility or an available place. Review the organizer's current rules and any age or guardian requirements.",
    recordNote:
      "Public directory sample captured October 8, 2026. Not a live availability check.",
  },
];

export function filterOpportunityExamples(
  search: string,
  category: PreviewCategory | "",
  alignedOnly: boolean,
  career: string = previewCareers[0].name
) {
  const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const domains: readonly string[] =
    previewCareers.find(item => item.name === career)?.domains ?? [];
  return opportunityExamples.filter(
    item =>
      (!category || item.category === category) &&
      (!alignedOnly ||
        item.careerDomains.some(domain => domains.includes(domain))) &&
      terms.every(term =>
        `${item.title} ${item.summary}`.toLowerCase().includes(term)
      )
  );
}
