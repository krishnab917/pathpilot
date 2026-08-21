export const landingCopy = {
  hero: {
    titleLead: "Your future isn't a quiz result.",
    titleAccent: "Experience it.",
    proof: "4 in 5 students want more career exploration opportunities in high school.",
    proofSource: "College Board / Morning Consult",
    description:
      "PathPilot helps you discover careers worth exploring, experience realistic decisions, and turn what you learn into a clear next step.",
    cta: "Discover my career path",
  },
  story: {
    eyebrow: "When the future feels unclear",
    title: "You shouldn't have to figure out your whole future from a quiz.",
    description:
      "There are hundreds of career paths. You may know what interests you, but still not know where it could lead—or what you should do next. PathPilot gives you a way to explore before you commit.",
    workflowTitle: "Don't just choose a career. Experience it.",
    workflowDescription:
      "Discover directions, step into realistic scenarios, reflect on what you learn, and plan what to explore next—while you remain the person who decides what comes next.",
    stageCta: "Start your journey",
    rows: [
      { label: "Traditional approach", value: "Take a quiz → get a list → figure it out yourself" },
      { label: "PathPilot", value: "Discover → explore → experience → understand → plan" },
      { label: "What changes", value: "From “I have no idea” to “I know what to explore next.”" },
    ],
  },
  closing: {
    title: "From “Maybe” to “What's next.”",
    description:
      "You don't need all the answers or a final career decision today. Turn curiosity into exploration, and what you learn into skills to build, projects to try, opportunities to explore, and goals to work toward—at your own pace.",
  },
} as const;

export const landingProofPoints = [
  {
    value: "4 in 5",
    label: "students want more career exploration opportunities in high school.",
    source: "College Board / Morning Consult",
    href: "https://research.collegeboard.org/reports/connecting-students-colleges-careers/postsecondary-pathways",
  },
  {
    value: "66%",
    label: "of surveyed young people ages 16–24 did not know exactly what career they wanted.",
    source: "Jobs for the Future, reported by Inside Higher Ed",
    href: "https://www.insidehighered.com/news/student-success/life-after-college/2024/09/23/career-learning-improves-high-schoolers-hope",
  },
  {
    value: "49%",
    label: "of surveyed youth ages 13–19 had little to no idea how to prepare for a career.",
    source: "DeBruce Foundation / TeenVoice 2024",
    href: "https://debruce.org/insights/2024-teenvoice-survey/",
  },
] as const;

export const landingExperientialEvidence = {
  text: "In a Gallup study of New Hampshire students, 57% of high school students who participated in an internship or externship said career-connected learning informed their plans after high school.",
  source: "Gallup / New Hampshire Learning Initiative, reported by Inside Higher Ed",
  href: "https://www.insidehighered.com/news/student-success/life-after-college/2024/09/23/career-learning-improves-high-schoolers-hope",
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
    copy: "Step into interactive career scenarios, make decisions, and reflect on what different work situations can feel like.",
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
  "determine your perfect career",
  "predict your career",
  "career prediction",
  "pathpilot reduces anxiety",
  "pathpilot improves mental health",
  "pathpilot treats anxiety",
  "pathpilot prevents mental-health problems",
] as const;
