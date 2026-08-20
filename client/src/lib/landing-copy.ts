export const landingCopy = {
  hero: {
    titleLead: "Your future isn't a quiz result.",
    titleAccent: "Experience it.",
    description:
      "You don't need to have your whole future figured out. PathPilot helps you discover careers worth exploring, experience realistic decisions, understand what resonates, and find a clear next step.",
    cta: "Discover my career path",
  },
  story: {
    eyebrow: "When the future feels unclear",
    title: "Feeling stuck about your future?",
    description:
      "Too many choices. Too little clarity. You might know what you like—but not what you should actually do with it. When the future feels uncertain, it can be hard to know where to start.",
    workflowTitle: "Don't guess. Explore.",
    workflowDescription:
      "PathPilot gives you a structured way to move from uncertainty to clarity and action—while you remain the person who decides what comes next.",
    rows: [
      { label: "What you may be feeling", value: "Too many choices. Too little clarity." },
      { label: "What is worth exploring", value: "What could fit your interests and values" },
      { label: "A better place to start", value: "Discover → explore → experience → understand → act" },
    ],
  },
  closing: {
    title: "You don't need all the answers.",
    description:
      "You don't have to choose your entire future today. Turn uncertainty into clarity. Turn curiosity into exploration. Turn exploration into action—at your own pace.",
  },
} as const;

export const landingFeatureCards = [
  {
    step: "01",
    title: "Discover yourself",
    copy: "Understand your interests, strengths, skills, preferences, and experiences.",
    result: "Starting point",
  },
  {
    step: "02",
    title: "Explore careers",
    copy: "Find career directions worth investigating based on your profile.",
    result: "Possibilities",
  },
  {
    step: "03",
    title: "Experience them",
    copy: "Use interactive simulations to see what different work situations can feel like.",
    result: "Perspective",
  },
  {
    step: "04",
    title: "Understand your direction",
    copy: "Reflect on what you enjoyed, how you responded, and what environments may be worth exploring further.",
    result: "Clarity",
  },
  {
    step: "05",
    title: "Take your next step",
    copy: "Turn what you learned into a personal roadmap with goals, projects, opportunities, skills, and milestones.",
    result: "Action",
  },
] as const;

export const prohibitedLandingClaims = [
  "career indecision causes depression",
  "prevents anxiety",
  "improves mental health",
  "treats student anxiety",
  "mental-health solution",
  "perfect career",
  "guaranteed career fit",
  "pathpilot reduces anxiety",
  "pathpilot improves mental health",
  "pathpilot treats anxiety",
  "pathpilot prevents mental-health problems",
] as const;
