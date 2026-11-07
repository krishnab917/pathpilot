import { load } from "cheerio";
import { safeHttpUrl } from "../../shared/safe-url";
import { fetchSourceHtml } from "./fetch-source";
import { careerDomainsFor } from "./career-alignment";

export type OpportunityCategory = "internship" | "competition" | "research";
export type CuratedOpportunityDraft = {
  sourceSlug: "hack-club" | "pathways-to-science";
  externalId: string;
  title: string;
  summary: string;
  category: OpportunityCategory;
  participationMode: "details_on_source";
  locationLabel: string;
  sourceDateLabel: string | null;
  applicationUrl: string;
  sourceUrl: string;
  careerDomains: string[];
};

export const HACK_CLUB_DIRECTORY_URL = "https://hackathons.hackclub.com/";
export const PATHWAYS_SUMMER_RESEARCH_URL = "https://www.pathwaystoscience.org/programs.aspx?u=&r=&s=&sa=either&p=either&c=either&f=&dd=SummerResearch_Summer%20Research%20Opportunity&ft=&submit=y&dhub=SummerResearch_Summer%20Research%20Opportunity";

const whitespace = (value: string) => value.replace(/\s+/g, " ").trim();
const absolute = (href: string, base: string) => {
  try { return safeHttpUrl(new URL(href, base).toString()); } catch { return undefined; }
};
const compactId = (value: string) => value.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "").slice(0, 180);

export function inferCareerDomains(...values: string[]) {
  const text = values.join(" ");
  const domains = new Set(careerDomainsFor(text));
  // Retain the legacy science subject without assigning it to every career field.
  if (/\b(science|research|physics|chemistry|biology)\b/i.test(text)) domains.add("science");
  return Array.from(domains);
}

export function parseHackClubDirectory(html: string, limit = 70): CuratedOpportunityDraft[] {
  const $ = load(html);
  const records = new Map<string, CuratedOpportunityDraft>();
  $("a[href]").each((_, element) => {
    if (records.size >= limit) return false;
    const anchor = $(element);
    const title = whitespace(anchor.find("h3").first().text());
    const href = anchor.attr("href");
    if (!title || !href || href.startsWith("/") || /hackclub\.com\/?$/.test(href)) return;
    const details = whitespace(anchor.text()).replace(title, "").trim();
    const applicationUrl = absolute(href, HACK_CLUB_DIRECTORY_URL);
    if (!applicationUrl) return;
    const externalId = compactId(applicationUrl);
    records.set(externalId, {
      sourceSlug: "hack-club", externalId, title,
      summary: "A popular high-school hackathon listed by Hack Club. Review the organizer’s page for the current theme, participation rules, and registration details.",
      category: "competition", participationMode: "details_on_source", locationLabel: details || "See organizer page", sourceDateLabel: details || null,
      applicationUrl, sourceUrl: HACK_CLUB_DIRECTORY_URL, careerDomains: inferCareerDomains(title, details),
    });
  });
  return Array.from(records.values());
}

export function parsePathwaysSummerResearch(html: string, limit = 70): CuratedOpportunityDraft[] {
  const $ = load(html);
  const records = new Map<string, CuratedOpportunityDraft>();
  $("a[href*='programhub.aspx?sort=']").each((_, element) => {
    if (records.size >= limit) return false;
    const anchor = $(element);
    const title = whitespace(anchor.text()).replace(/\.\.\.read more$/i, "");
    const href = anchor.attr("href");
    if (!title || !href || /read more/i.test(title)) return;
    const applicationUrl = absolute(href, PATHWAYS_SUMMER_RESEARCH_URL);
    if (!applicationUrl) return;
    const parentText = whitespace(anchor.parent().text()).replace(title, "").replace(/\.\.\.read more/gi, "").trim();
    const externalId = compactId(applicationUrl);
    const category: OpportunityCategory = /internship/i.test(title) ? "internship" : "research";
    records.set(externalId, {
      sourceSlug: "pathways-to-science", externalId, title, category, participationMode: "details_on_source",
      summary: parentText.slice(0, 600) || "A STEM opportunity listed in the PathwaysToScience summer research directory. Review the source and organizer page for current eligibility and deadlines.",
      locationLabel: "See program page", sourceDateLabel: null, applicationUrl, sourceUrl: PATHWAYS_SUMMER_RESEARCH_URL,
      careerDomains: inferCareerDomains(title, parentText),
    });
  });
  return Array.from(records.values());
}

export async function fetchCuratedOpportunityDrafts(fetcher: typeof fetch = fetch) {
  const [hackClubHtml, pathwaysHtml] = await Promise.all([fetchSourceHtml(HACK_CLUB_DIRECTORY_URL, fetcher), fetchSourceHtml(PATHWAYS_SUMMER_RESEARCH_URL, fetcher)]);
  return [...parseHackClubDirectory(hackClubHtml), ...parsePathwaysSummerResearch(pathwaysHtml)];
}
