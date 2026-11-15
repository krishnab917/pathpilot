import { describe, expect, it } from "vitest";
import { careerTaxonomy, careerSchema, careerFields, dimensions, resolveDiscoveryCareer } from "../shared/career-taxonomy";
import { discoverySuggestions, legacySignals, MAPPING_VERSION, matchingInputSchema, rankCareers, summarizeSignals, type BehavioralSignal } from "../shared/career-matching";
import { advanceSample, fieldWorkSamples, sampleSignals, startSample } from "../shared/career-work-samples";
import { simulationCareerCatalog } from "../server/simulation/catalog";
import { resolveDiscoveryReference } from "../server/discovery-catalog";
import { validateCareerCatalogWrite } from "../server/db";
import { getCareerRequirementActions } from "../server/roadmap/career-requirements";

describe("career taxonomy v2", () => {
  it("has 108 validated stable careers across 12 fields, including every previous simulation", () => {
    expect(careerTaxonomy).toHaveLength(108);
    expect(new Set(careerTaxonomy.map(c => c.id)).size).toBe(108);
    expect(new Set(careerTaxonomy.map(c => c.name)).size).toBe(108);
    for (const field of careerFields) expect(careerTaxonomy.filter(c => c.field === field)).toHaveLength(9);
    for (const career of careerTaxonomy) {
      expect(careerSchema.safeParse(career).success).toBe(true);
      expect(fieldWorkSamples[career.sampleId]).toBeDefined();
      expect(resolveDiscoveryReference(career.id)?.name).toBe(career.name);
    }
    for (const old of simulationCareerCatalog) {
      expect(resolveDiscoveryCareer(old.id)?.simulationId).toBe(old.id);
      expect(resolveDiscoveryReference(old.id)?.description).toBe(old.description);
    }
    expect(careerTaxonomy.filter(c => c.simulationId)).toHaveLength(25);
    expect(resolveDiscoveryCareer("chef")?.pathways).toContain("apprenticeship");
    expect(resolveDiscoveryCareer("electrician")?.pathways).not.toContain("degree");
  });
  it.each(["Invented Career", "Chef; DROP TABLE careers", "", null, { name: "Chef" }])("rejects noncanonical shared-catalog identifiers %#", value => {
    expect(resolveDiscoveryReference(value as any)).toBeNull();
  });
  it("retains the authorized authored-only write boundary for expanded discovery", () => {
    const matches = ["chef", "baker", "electrician", "teacher", "social-worker"].map(id => ({ name: resolveDiscoveryReference(id)!.name, description: "Private explanation", salaryRange: "Varies", educationRequirements: "Verify locally", requiredSkills: ["One", "Two", "Three"], dailyResponsibilities: ["One", "Two"], relatedCareers: ["One", "Two"], matchScore: 60, reasoning: "Interest", strengths: ["Practice"], missingSkills: ["Practice"], realityCheck: "General", nextSteps: ["Explore", "Reflect"] }));
    expect(() => validateCareerCatalogWrite("11111111-1111-4111-8111-111111111111", matches)).not.toThrow();
    expect(() => validateCareerCatalogWrite("anonymous", matches)).toThrow();
    expect(() => validateCareerCatalogWrite("11111111-1111-4111-8111-111111111111", [{ ...matches[0], name: "Injected title" }, ...matches.slice(1)])).toThrow();
  });
  it("provides deterministic roadmap actions for every discovery career without expanding simulation availability", () => {
    for (const career of careerTaxonomy) {
      const actions = getCareerRequirementActions(career.name);
      expect(actions.length, career.id).toBeGreaterThan(0);
      expect(new Set(actions.map(action => action.id)).size).toBe(actions.length);
    }
    expect(getCareerRequirementActions("chef").map(action => action.kind)).toEqual(["explore", "explore"]);
    expect(getCareerRequirementActions("Unlisted Career")).toEqual([]);
    expect(simulationCareerCatalog.some(career => career.id === "chef")).toBe(false);
  });
});

const signal = (id: string, context: string, value: number): BehavioralSignal => ({ version: MAPPING_VERSION, id, context, source: "observed", dimension: "investigation", value, evidence: "Checked an artifact", conflicting: false });
describe("transparent matching v2", () => {
  it("applies preference direction consistently across every behavioral dimension", () => {
    for (const dimension of dimensions) {
      const base = careerTaxonomy[0];
      const high = { ...base, id: "fixture-high", dimensions: { ...base.dimensions, [dimension]: 1 } };
      const low = { ...base, id: "fixture-low", dimensions: { ...base.dimensions, [dimension]: 0 } };
      for (const value of [0, 0.5, 1]) {
        const result = rankCareers({ overrides: { [dimension]: value } }, [high, low]);
        const difference = result.find(item => item.career.id === high.id)!.score! - result.find(item => item.career.id === low.id)!.score!;
        expect(Math.sign(difference)).toBe(Math.sign(value - 0.5));
        expect(result.every(item => item.confidence === "limited")).toBe(true);
      }
    }
  });
  it("matches a complete specialty independently of real-career aliases or catalogue order", () => {
    const base = careerTaxonomy[0];
    const exact = { ...base, id: "fixture-exact", name: "Amber Weaver", subfield: "Textile craft" };
    const incidental = { ...base, id: "fixture-incidental", name: "Indigo Weaver", subfield: "Textile craft" };
    for (const catalogue of [[exact, incidental], [incidental, exact]]) {
      const result = rankCareers({ interests: ["Amber Weaver"] }, catalogue);
      expect(result[0].career.id).toBe(exact.id);
      expect(result[0].score).toBeGreaterThan(result[1].score!);
    }
  });
  it("a single corrected preference distinguishes relevant from incidental dimensions", () => {
    const more = rankCareers({ overrides: { practical: 1 } });
    const less = rankCareers({ overrides: { practical: 0 } });
    const score = (list: typeof more, id: string) => list.find(item => item.career.id === id)!.score!;
    expect(score(more, "carpenter")).toBeGreaterThan(score(more, "accountant"));
    expect(score(less, "carpenter")).toBeLessThan(score(less, "accountant"));
  });
  it("specific multiword titles outrank a shared generic title word", () => {
    const ranked = rankCareers({ interests: ["graphic designer"] });
    expect(ranked[0].career.id).toBe("graphic-designer");
    expect(ranked[0].score).toBeGreaterThan(ranked.find(item => item.career.id === "game-designer")!.score!);
  });
  it.each([ ["cooking", "chef"], ["carpenter", "carpenter"], ["graphic design", "graphic-designer"], ["nursing", "registered-nurse"], ["teaching", "teacher"], ["accounting", "accountant"], ["legal", "lawyer"] ])("supports %s interests", (interest, expected) => {
    const ranked = rankCareers({ interests: [interest] });
    expect(ranked.slice(0, 8).map(item => item.career.id)).toContain(expected);
    const match = ranked.find(item => item.career.id === expected)!;
    expect(match.reasons.join(" ")).toContain(interest);
    expect(match.confidence).toBe("limited");
  });
  it("gives undecided students diverse unscored exploration options", () => {
    const ranked = rankCareers({});
    expect(ranked.every(item => item.score === null && item.confidence === "unknown")).toBe(true);
    expect(new Set(discoverySuggestions(ranked).map(item => item.career.field)).size).toBeGreaterThanOrEqual(3);
  });
  it("preserves multiple interests and includes alternatives outside a preferred field", () => {
    const ranked = rankCareers({ interests: ["cooking", "software"], fields: ["hospitality"] });
    expect(ranked.find(item => item.career.id === "software-engineer")!.score).toBeGreaterThan(0);
    expect(discoverySuggestions(ranked).some(item => item.career.field !== "hospitality")).toBe(true);
  });
  it("keeps score normalization independent of catalogue size and ordering", () => {
    const input = { interests: ["cooking"], skills: ["measurement"], goals: ["baking"], pathways: ["apprenticeship" as const] };
    const a = rankCareers(input), b = rankCareers(input, [...careerTaxonomy].reverse());
    expect(a).toEqual(b);
    const chef = careerTaxonomy.find(c => c.id === "chef")!;
    expect(rankCareers(input, [chef])[0].score).toBe(a.find(c => c.career.id === "chef")!.score);
    expect(a.every(item => item.score! >= 0 && item.score! <= 100)).toBe(true);
  });
  it("retains contradictory evidence and caps repetition confidence", () => {
    const signals = [signal("a", "one", 0.1), signal("b", "two", 0.9)];
    const result = summarizeSignals({ signals }).find(item => item.dimension === "investigation")!;
    expect(result.conflict).toBe(true); expect(result.confidence).toBe("limited"); expect(result.value).toBe(0.5);
    expect(summarizeSignals({ signals: Array.from({ length: 50 }, (_, i) => signal(String(i), "one", 0.9)) })[0].confidence).toBe("limited");
    expect(summarizeSignals({ signals: [signals[0], signals[0]] })[0].evidence).toHaveLength(1);
  });
  it("allows explicit correction and ignoring all behavioral inferences", () => {
    const signals = [signal("one", "a", 0.1)];
    expect(summarizeSignals({ signals, overrides: { investigation: 0.9 } })[0].value).toBe(0.9);
    expect(summarizeSignals({ signals, useInferences: false })[0].value).toBeNull();
    expect(rankCareers({ signals, useInferences: false })).toEqual(rankCareers({}));
  });
  it("does not promote confidence from replayed IDs or overridden observations", () => {
    const replay = [signal("same", "one", 0.9), signal("same", "two", 0.9)];
    expect(rankCareers({ signals: replay }).every(item => item.confidence === "limited")).toBe(true);
    const independent = [signal("one", "one", 0.9), signal("two", "two", 0.9)];
    expect(rankCareers({ signals: independent })[0].confidence).toBe("building");
    expect(rankCareers({ signals: independent, overrides: { investigation: 0.1 } })[0].confidence).toBe("limited");
  });
  it("does not invent creative, service or practical preferences from legacy scores", () => {
    const signals = legacySignals({ traits: [{ trait: "analytical_thinking", score: 75, consistency: "varied" }, { trait: "ethical_reasoning", score: 80, consistency: "consistent" }] });
    expect(signals).toHaveLength(1); expect(signals[0].source).toBe("inferred_legacy");
    expect(summarizeSignals({ signals }).find(item => item.dimension === "service")?.value).toBeNull();
    expect(summarizeSignals({ signals })[0].conflict).toBe(true);
    expect(legacySignals(null)).toEqual([]);
  });
  it("rejects sensitive/unrecognized fields and invalid signal values", () => {
    expect(matchingInputSchema.safeParse({ ethnicity: "ignored?" }).success).toBe(false);
    expect(matchingInputSchema.safeParse({ signals: [signal("bad", "one", NaN)] }).success).toBe(false);
    expect(matchingInputSchema.safeParse({ overrides: { investigation: 2 } }).success).toBe(false);
  });
});

describe("field work samples", () => {
  it.each(careerFields)("%s has two valid actionable stages and a recoverable completion", field => {
    let run = startSample(field);
    expect(sampleSignals(run)).toEqual([]);
    for (const [index, task] of fieldWorkSamples[field].tasks.entries()) {
      const values = Object.fromEntries(task.fields.map(item => [item.id, item.expected]));
      const submission = { nodeId: `${field}-${index}`, values, inspected: [task.evidence[0].id], trials: [values] };
      expect(() => advanceSample(run, { ...submission, inspected: [] })).toThrow();
      expect(() => advanceSample(run, { ...submission, nodeId: `${field}-9` })).toThrow();
      run = advanceSample(run, submission);
      expect(run.receipts[index].checks.every(item => item.passed)).toBe(true);
    }
    expect(run.complete).toBe(true); expect(sampleSignals(run)).toHaveLength(2);
    expect(new Set(sampleSignals(run).map(item => item.context)).size).toBe(1);
    expect(() => advanceSample(run, { nodeId: `${field}-1`, values: {}, inspected: [], trials: [] })).toThrow();
    expect(startSample(field).receipts).toEqual([]); expect(run.receipts).toHaveLength(2);
  });
  it("allows a wrong calculation to progress and recover with changed evidence", () => {
    let run = startSample("hospitality");
    run = advanceSample(run, { nodeId: "hospitality-0", inspected: ["brief"], values: { f0: "1", f1: "1", f2: "1" }, trials: [] });
    expect(run.receipts[0].checks.some(item => !item.passed)).toBe(true);
    run = advanceSample(run, { nodeId: "hospitality-1", inspected: ["brief"], values: { f0: "8", f1: "400", f2: "80" }, trials: [{ f0: "1", f1: "1", f2: "1" }] });
    expect(run.complete).toBe(true); expect(run.receipts[1].revised).toBe(true);
    expect(sampleSignals(run).some(signal => signal.dimension === "adaptation")).toBe(true);
  });
});
