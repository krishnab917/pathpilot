export const landingCopy = {
  hero: {
    titleLead: "Your future isn't a quiz result.",
    titleAccent: "Experience it.",
    description:
      "Choosing a career should not mean picking a title from a list and hoping it fits. PathPilot helps you explore careers worth trying, step into realistic decisions, and build a personal plan from what you learn.",
    cta: "Discover my career path",
  },
  story: {
    eyebrow: "A better place to start",
    title: "You do not need to have your whole future figured out today.",
    description:
      "When the questions pile up—what am I good at, what might I enjoy, and what should I do next?—a quiz can be a useful start, but it does not have to be the whole experience.",
    workflowTitle: "From uncertainty to a next step.",
    workflowDescription:
      "Career exploration is a process: discover possibilities, experience realistic decisions, understand what resonates, then choose an action that feels useful now.",
    rows: [
      { label: "What you may be asking", value: "What am I actually good at?" },
      { label: "What a list alone can miss", value: "What the work could feel like" },
      { label: "A more useful next step", value: "Discover → experience → plan" },
    ],
  },
  closing: {
    title: "You don't need your entire future figured out today.",
    description:
      "You just need a clearer place to start. Explore possibilities, learn what resonates, and decide your next step at your own pace.",
  },
} as const;

export const landingFeatureCards = [
  {
    step: "01",
    title: "Discover yourself",
    copy: "Start with your interests, strengths, skills, subjects, activities, and preferences—then notice career directions worth exploring.",
    result: "Directions",
  },
  {
    step: "02",
    title: "Explore and experience",
    copy: "See career directions, then step into realistic work situations and make the kinds of decisions the role can involve.",
    result: "Perspective",
  },
  {
    step: "03",
    title: "Build direction",
    copy: "Turn what you learn into goals, projects, opportunities, skills, and milestones you can work on next.",
    result: "Next steps",
  },
] as const;

export const prohibitedLandingClaims = [
  "career indecision causes depression",
  "prevents anxiety",
  "improves mental health",
  "treats student anxiety",
  "mental-health solution",
  "perfect career",
] as const;
