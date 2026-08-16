export const NASA_SPACE_APPS_URL = "https://www.spaceappschallenge.org/";
const datePattern = /november\s+14\s*(?:-|–|to)\s*15\s*,\s*2026/i;
const audiencePattern = /all ages,?\s+skill levels/i;

export type VerifiedNasaSpaceAppsRecord = {
  source: {
    slug: "nasa-space-apps";
    name: "NASA Space Apps Challenge";
    sourceUrl: string;
    sourceType: "official_event_page";
    verificationNote: string;
    verifiedAt: Date;
  };
  opportunity: {
    externalId: "2026-space-apps-challenge";
    title: "NASA Space Apps Challenge 2026";
    summary: string;
    category: "hackathon";
    participationMode: "details_on_source";
    locationLabel: string;
    countryCodes: string[];
    startAt: Date;
    endAt: Date;
    registrationOpensAt: Date;
    eligibilitySummary: string;
    applicationUrl: string;
    sourceUrl: string;
    sourceUpdatedAt: null;
    verifiedAt: Date;
  };
};

export function parseNasaSpaceAppsPage(html: string, verifiedAt = new Date()): VerifiedNasaSpaceAppsRecord {
  const content = html.replace(/\s+/g, " ");
  if (!datePattern.test(content)) throw new Error("NASA Space Apps source did not confirm the 2026 event dates.");
  if (!audiencePattern.test(content)) throw new Error("NASA Space Apps source did not confirm its published audience statement.");
  return {
    source: {
      slug: "nasa-space-apps",
      name: "NASA Space Apps Challenge",
      sourceUrl: NASA_SPACE_APPS_URL,
      sourceType: "official_event_page",
      verificationNote: "Refreshed from the official NASA Space Apps Challenge event page. Students must review the source for rules, registration, privacy, local availability, and age or guardian requirements.",
      verifiedAt,
    },
    opportunity: {
      externalId: "2026-space-apps-challenge",
      title: "NASA Space Apps Challenge 2026",
      summary: "A global hackathon where participants work on real-world challenges connected to space and science.",
      category: "hackathon",
      participationMode: "details_on_source",
      locationLabel: "See the official event page for local and virtual participation details",
      countryCodes: [],
      startAt: new Date("2026-11-14T00:00:00Z"),
      endAt: new Date("2026-11-15T23:59:59Z"),
      registrationOpensAt: new Date("2026-08-26T00:00:00Z"),
      eligibilitySummary: "The official event page welcomes all ages and skill levels. Confirm current registration, local-event availability, rules, and any age or guardian requirements directly with the source before participating.",
      applicationUrl: NASA_SPACE_APPS_URL,
      sourceUrl: NASA_SPACE_APPS_URL,
      sourceUpdatedAt: null,
      verifiedAt,
    },
  };
}

export async function fetchNasaSpaceAppsRecord(fetcher: typeof fetch = fetch) {
  const response = await fetcher(NASA_SPACE_APPS_URL, { headers: { Accept: "text/html,application/xhtml+xml" } });
  if (!response.ok) throw new Error(`NASA Space Apps source request failed (${response.status}).`);
  return parseNasaSpaceAppsPage(await response.text());
}
