import { describe, expect, it } from "vitest";
import { discoveryIntakeContext, discoveryAlternativeNote, discoveryReasoning } from "../server/discovery-intake-context";
import { emptyIntake, intakeMatchingInput, startingFields } from "../shared/discovery-intake";
import { rankCareers } from "../shared/career-matching";
describe("AI discovery structured reference context", () => {
  it("retains every collected field and uses the same starting-field engine", () => {
    const intake = { ...emptyIntake(), fields: ["hospitality" as const], preferences: { practical: 1 as const }, motivations: ["Creativity" as const], subjects: ["Food science"], pathways: ["apprenticeship" as const], direction: "ideas" as const, careers: ["Chef"] };
    const profile = { discoveryIntake: intake, interests: ["Cooking"], skills: ["Baking"], activities: ["Cooking club"], careerPreferences: [], location: "PRIVATE_ADDRESS", userId: "PRIVATE_OWNER" };
    const result = discoveryIntakeContext(profile);
    expect(result.answers.discoveryIntake).toEqual(intake);
    expect(result.startingFields.map(x => x.field)).toEqual(startingFields(intakeMatchingInput(profile)).map(x => x.field));
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE_ADDRESS|PRIVATE_OWNER/);
  });
  it.each([{}, { discoveryIntake: { version: "discovery-intake-v1" } }, { discoveryIntake: null }, { discoveryIntake: { version: "invalid", secrets: "PRIVATE" } }])("handles legacy, partial and malformed responses %#", profile => {
    const result = discoveryIntakeContext(profile);
    expect(result.startingFields).toHaveLength(4);
    expect(result.answers.interests).toEqual([]);
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
  });
  it("bounds legacy data and identifies alternatives", () => {
    const profile = { interests: Array(40).fill("x".repeat(500)), discoveryIntake: { ...emptyIntake(), fields: ["hospitality"] } };
    expect(discoveryIntakeContext(profile).answers.interests).toHaveLength(12);
    expect(discoveryIntakeContext(profile).answers.interests[0]).toHaveLength(80);
    const selected = discoveryIntakeContext(profile).startingFields.map(item => item.field);
    const alternative = rankCareers(intakeMatchingInput({ discoveryIntake: emptyIntake() })).find(item => !selected.includes(item.career.field))!;
    expect(discoveryAlternativeNote(profile, alternative.career.name)).toContain("Exploratory alternative");
    const reasoning = discoveryReasoning(profile, alternative.career.name, "x".repeat(1000));
    expect(reasoning.length).toBeLessThanOrEqual(1000);
    expect(reasoning).toContain("Exploratory alternative");
    expect(discoveryAlternativeNote(profile, "Chef")).toBe("");
  });
});
