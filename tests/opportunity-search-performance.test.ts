import { describe, expect, it } from "vitest";
import { OPPORTUNITY_SEARCH_DEBOUNCE_MS } from "../client/src/pages/Opportunities";
import { opportunitySearchQueryOptions, staticMetadataQueryOptions } from "../client/src/lib/query-policies";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const opportunitiesSource = readFileSync(resolve(process.cwd(), "client/src/pages/Opportunities.tsx"), "utf8");

describe("Opportunity search performance contract", () => {
  it("uses a measured debounce before it changes the server-filtered search query", () => {
    expect(OPPORTUNITY_SEARCH_DEBOUNCE_MS).toBe(300);
    expect(opportunitiesSource).toContain("useDebouncedValue(search, OPPORTUNITY_SEARCH_DEBOUNCE_MS)");
    expect(opportunitiesSource).toContain("search: debouncedSearch.trim() || undefined");
  });

  it("keeps personalized search server-side, paginated, and safely abortable when unmounted", () => {
    expect(opportunitiesSource).toContain("pageSize: 12");
    expect(opportunitiesSource).toContain("opportunities.list.useQuery(input, opportunitySearchQueryOptions)");
    expect(opportunitySearchQueryOptions.trpc.abortOnUnmount).toBe(true);
    expect(opportunitySearchQueryOptions.staleTime).toBe(15_000);
  });

  it("allows only immutable country metadata a longer session-scoped cache lifetime", () => {
    expect(staticMetadataQueryOptions.staleTime).toBe(60 * 60_000);
    expect(staticMetadataQueryOptions.gcTime).toBe(24 * 60 * 60_000);
    expect(opportunitiesSource).toContain("countryOptions.useQuery(undefined, staticMetadataQueryOptions)");
  });

  it("reuses only the immutable simulation catalog, not behavioral or resumable simulation data", () => {
    const simulationSource = readFileSync(resolve(process.cwd(), "client/src/components/AdaptiveSimulation.tsx"), "utf8");
    expect(simulationSource).toContain("adaptive.catalog.useQuery(undefined, staticMetadataQueryOptions)");
    expect(simulationSource).toContain("adaptive.resume.useQuery()");
    expect(simulationSource).toContain("adaptive.behaviorSummary.useQuery(undefined, { enabled: hasCompletedSimulation })");
    expect(simulationSource).toContain('if (response.simulation.status === "completed") utils.pathpilot.simulations.adaptive.behaviorSummary.invalidate()');
  });
});
