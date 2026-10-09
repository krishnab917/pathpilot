// Explicitly illustrative, local-only interactions. Never saved as student data.
export const roadmapStorySteps = [
  {
    id: "learn",
    kind: "Skill",
    status: "Completed in this example",
    progress: 100,
    title: "Learn the foundations of a web interface",
    description:
      "Practice making a page respond to input before starting a larger project.",
    rationale:
      "A small exercise gives you something to apply. Notice which parts of the work you want to explore further.",
    output: "A working page and notes on what you learned.",
  },
  {
    id: "build",
    kind: "Project",
    status: "Current focus in this example",
    progress: 20,
    title: "Build a study planner",
    description:
      "Start with one useful task, test it, and record what you learn.",
    rationale:
      "This connects an interest in software to a manageable first project. Your own roadmap uses your chosen career and saved context.",
    output: "A first version, feedback, and one improvement to try.",
  },
  {
    id: "experience",
    kind: "Experience",
    status: "Upcoming in this example",
    progress: 0,
    title: "Try your skills in a new setting",
    description:
      "Explore a competition or internship and check its published requirements.",
    rationale:
      "Use Opportunities to look for a setting that fits your interests. Check eligibility and dates with the organizer before making plans.",
    output: "An opportunity to investigate and a clear next action.",
  },
] as const;

export const projectExampleTasks = [
  "Sketch the task screen",
  "Build a first version",
  "Test with a classmate",
] as const;

export const preparationChapters = [
  {
    id: "project",
    label: "Build",
    record: "A project you can explain",
    detail: "Study planner · Scope, milestones, notes",
  },
  {
    id: "goal",
    label: "Act",
    record: "A next step you can take",
    detail: "Test with a classmate · A manageable commitment",
  },
  {
    id: "guidance",
    label: "Get support",
    record: "A question you worked through",
    detail: "Mentor · Guidance in the context of your plan",
  },
  {
    id: "reflection",
    label: "Reflect",
    record: "An experience you can draw on",
    detail: "What you tried, what changed, what you learned",
  },
] as const;

export function exampleProjectProgress(completed: readonly boolean[]) {
  return completed.length
    ? Math.round((completed.filter(Boolean).length / completed.length) * 100)
    : 0;
}
