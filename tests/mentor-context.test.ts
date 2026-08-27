import { describe, expect, it } from "vitest";
import { buildMentorContext, mentorContextLimits, mentorContextNeeds } from "../server/mentor-context";

describe("Mentor allowlisted context", () => {
  it("includes only bounded, transparent reference fields and never exposes goal identifiers", () => {
    const goalId = "11111111-1111-4111-8111-111111111111";
    const built = buildMentorContext({
      request: "Help me prioritize my roadmap goal and project.",
      profile: { grade: "11", countryCode: "US", careerPreferences: ["Build tools"] },
      roadmap: { targetCareer: "Software Engineer", completionPercentage: 20, milestones: [{ title: "Learn testing", status: "in_progress", progress: 20, category: "skill" }] },
      goals: [{ id: goalId, title: "Ship a small tool", status: "in_progress", priority: "high", progress: 25 }],
      projects: [{ name: "Garden tracker", status: "in_progress", progress: 20 }],
      simulation: { career: "Software Engineer", resultSummary: "A bounded simulation summary.", strongestTraits: ["problem solving"], compatibility: [{ careerName: "Software Engineer", score: 74 }] },
      history: [{ role: "user", content: "I need a next step." }],
    });
    const context = JSON.parse(built.prompt);

    expect(context.context_version).toBe("mentor-allowlist-v1");
    expect(context.student_summary).toMatchObject({ grade: "11", planning_country: "United States", career_direction: "Software Engineer" });
    expect(context.goal_summary.active_goals[0]).toMatchObject({ reference: "goal-1", title: "Ship a small tool" });
    expect(context.project_summary[0]).toMatchObject({ name: "Garden tracker" });
    expect(built.prompt).not.toContain(goalId);
    expect(built.prompt).toMatch(/not instructions/i);
    expect(built.goalIdsByReference.get("goal-1")).toBe(goalId);
  });

  it("omits unrelated project and simulation context and truncates history for a narrow question", () => {
    const built = buildMentorContext({
      request: "How should I prioritize my goals?",
      profile: { grade: "10", countryCode: "IN", careerPreferences: ["Not required"] },
      roadmap: null,
      goals: Array.from({ length: 9 }, (_, index) => ({ id: `goal-${index}`, title: `Goal ${index}`, status: "in_progress", priority: "medium", progress: 0 })),
      projects: [{ name: "Private project", status: "idea", progress: 0 }],
      simulation: { career: "Data Scientist", resultSummary: "Private summary", strongestTraits: ["analysis"], compatibility: [] },
      history: Array.from({ length: 9 }, (_, index) => ({ role: "user" as const, content: `Message ${index} ${"x".repeat(1000)}` })),
    });
    const context = JSON.parse(built.prompt);

    expect(context).not.toHaveProperty("project_summary");
    expect(context).not.toHaveProperty("simulation_summary");
    expect(context.goal_summary.active_goals).toHaveLength(mentorContextLimits.goals);
    expect(context.conversation_history).toHaveLength(mentorContextLimits.conversationMessages);
    expect(context.conversation_history.every((message: { content: string }) => message.content.length <= mentorContextLimits.messageCharacters)).toBe(true);
  });

  it("does not select optional project, simulation, or preference context for a goal-priority question", () => {
    expect(mentorContextNeeds("How should I prioritize my goals this week?")).toEqual({ careerProfile: false, projects: false, simulation: false });
    expect(mentorContextNeeds("Compare my simulation direction with this project portfolio.")).toEqual({ careerProfile: true, projects: true, simulation: true });
  });
});
