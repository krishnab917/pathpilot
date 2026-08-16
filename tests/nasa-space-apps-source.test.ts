import { describe, expect, it, vi } from "vitest";
import { fetchNasaSpaceAppsRecord, parseNasaSpaceAppsPage } from "../server/opportunities/nasa-space-apps-source";

const officialPage = "JOIN NASA SPACE APPS CHALLENGE NOVEMBER 14-15, 2026. All ages, skill levels, and professional backgrounds are welcome.";

describe("NASA Space Apps source ingestion", () => {
  it("accepts the official page only when its required event date and audience assertions are present", () => {
    const record = parseNasaSpaceAppsPage(officialPage, new Date("2026-08-16T00:00:00Z"));
    expect(record.source.sourceUrl).toBe("https://www.spaceappschallenge.org/");
    expect(record.opportunity).toMatchObject({ title: "NASA Space Apps Challenge 2026", externalId: "2026-space-apps-challenge", participationMode: "details_on_source" });
    expect(record.opportunity.startAt.toISOString()).toBe("2026-11-14T00:00:00.000Z");
  });

  it("rejects a page that no longer confirms the event contract", () => {
    expect(() => parseNasaSpaceAppsPage("NASA Space Apps Challenge information."))
      .toThrow("NASA Space Apps source did not confirm the 2026 event dates.");
  });

  it("fetches the official page before parsing source facts", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(officialPage, { status: 200 }));
    await expect(fetchNasaSpaceAppsRecord(fetcher)).resolves.toMatchObject({ source: { name: "NASA Space Apps Challenge" } });
    expect(fetcher).toHaveBeenCalledWith("https://www.spaceappschallenge.org/", expect.objectContaining({ headers: expect.any(Object) }));
  });
});
