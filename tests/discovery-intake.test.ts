import { describe, expect, it } from "vitest";
import { completedProfileSchema, draftProfileSchema, emptyIntake, intakeMatchingInput, readIntake, startingFields } from "../shared/discovery-intake";
import { careerFields, careerTaxonomy } from "../shared/career-taxonomy";
import { MAPPING_VERSION, rankCareers, summarizeSignals, type BehavioralSignal } from "../shared/career-matching";
import { profile } from "../server/db";

const base = { grade: "Grade 10", location: "Example region", countryCode: "US", educationSystem: "General", interests: [], skills: [], activities: [], careerPreferences: [] };
describe("progressive discovery intake", () => {
  it("supports completion with every optional question skipped", () => {
    expect(completedProfileSchema.safeParse({ ...base, discoveryIntake: emptyIntake() }).success).toBe(true);
  });
  it("allows incomplete drafts without weakening completion context", () => {
    const partial = { ...base, grade: "", location: "", countryCode: null };
    expect(draftProfileSchema.safeParse(partial).success).toBe(true);
    expect(completedProfileSchema.safeParse(partial).success).toBe(false);
  });
  it("normalizes legacy missing intake without inventing observations", () => {
    expect(profile({ ...base, created_at: "2026-01-01", updated_at: "2026-01-01" })?.discoveryIntake).toBeNull();
    expect(readIntake({ version: "unknown" })).toBeNull();
    expect(intakeMatchingInput({})).toMatchObject({ interests: [], signals: [], overrides: {} });
  });
  it.each(careerFields)("can recommend %s without hiding other careers", field => {
    const input = intakeMatchingInput({ ...base, discoveryIntake: { ...emptyIntake(), fields: [field] } });
    expect(startingFields(input)[0].field).toBe(field);
    expect(startingFields(input)).toHaveLength(4);
    expect(rankCareers(input)).toHaveLength(108);
    expect(new Set(rankCareers(input).map(item => item.career.field)).size).toBe(12);
  });
  it("keeps mixed and undecided recommendations useful but uncertain", () => {
    const mixed = startingFields(intakeMatchingInput({ discoveryIntake: { ...emptyIntake(), fields: ["creative", "healthcare", "trades"] } }));
    expect(mixed.slice(0,3).map(item => item.field)).toEqual(expect.arrayContaining(["creative", "healthcare", "trades"]));
    expect(startingFields({}).every(item => item.evidence === "Exploratory starting point")).toBe(true);
    expect(mixed.every(item => item.evidence === "Limited information")).toBe(true);
  });
  it("deduplicates repeated answers and updates recommendations after edits", () => {
    const intake = { ...emptyIntake(), fields: ["education", "education"] as const };
    const first = intakeMatchingInput({ discoveryIntake: { ...intake, fields: [...intake.fields] } });
    expect(first.fields).toEqual(["education"]);
    expect(startingFields(first)[0].field).toBe("education");
    expect(startingFields(intakeMatchingInput({ discoveryIntake: { ...emptyIntake(), fields: ["business"] } }))[0].field).toBe("business");
  });
  it("does not manufacture fit from income, work-life balance, or empty experience", () => {
    expect(intakeMatchingInput({ discoveryIntake: { ...emptyIntake(), motivations: ["Financial stability", "Work-life balance"] } })).toEqual(intakeMatchingInput({}));
  });
  it("keeps explicit preferences without inferring their opposite", () => {
    expect(intakeMatchingInput({ discoveryIntake: { ...emptyIntake(), preferences: { independent: 1, collaboration: 1 } } }).overrides).toEqual({ independent: 1, collaboration: 1 });
  });
  it("rejects forged scores, identities, unknown fields and oversized answers", () => {
    for (const extra of [{ userId: "another-student" }, { score: 100 }]) expect(completedProfileSchema.safeParse({ ...base, ...extra }).success).toBe(false);
    expect(readIntake({ ...emptyIntake(), preferences: { practical: 2 } })).toBeNull();
    expect(readIntake({ ...emptyIntake(), fields: ["invented"] })).toBeNull();
    expect(readIntake({ ...emptyIntake(), careers: ["a".repeat(81)] })).toBeNull();
  });
  it("does not change the full simulation boundary", () => {
    expect(careerTaxonomy.filter(career => career.simulationId)).toHaveLength(25);
    expect(careerTaxonomy.find(career => career.id === "chef")?.simulationId).toBeNull();
  });
  it("keeps contradictory observations visible while honoring an explicit intake correction", () => {
    const signals: BehavioralSignal[] = [0, 1].map((value, index) => ({ version: MAPPING_VERSION, id: `sample-${index}`, context: `exercise-${index}`, source: "observed", dimension: "practical", value, evidence: "Synthetic work action", conflicting: false }));
    const plain = intakeMatchingInput({}, signals);
    expect(summarizeSignals(plain).find(item => item.dimension === "practical")).toMatchObject({ conflict: true, confidence: "limited" });
    const corrected = intakeMatchingInput({ discoveryIntake: { ...emptyIntake(), preferences: { practical: 1 } } }, signals);
    expect(summarizeSignals(corrected).find(item => item.dimension === "practical")).toMatchObject({ conflict: true, overridden: true, value: 1, confidence: "self-reported" });
    expect(startingFields({ ...corrected, signals: [...signals, ...signals] })).toEqual(startingFields(corrected));
  });
  it("does not give duplicate self-reports extra weight", () => {
    const profile = { interests: ["drawing", "teaching"], skills: ["writing", "measurement"], careerPreferences: ["design", "education"] };
    expect(intakeMatchingInput({ ...profile, interests: [...profile.interests, ...profile.interests], skills: [...profile.skills, ...profile.skills], careerPreferences: [...profile.careerPreferences, ...profile.careerPreferences] })).toEqual(intakeMatchingInput(profile));
  });
});
