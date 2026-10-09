export const landingCopy = {
  hero: {
    titleLead: "Discover your career.",
    titleAccent: "Build the path to reach it.",
    description:
      "PathPilot connects career exploration with a plan students can act on. Discover directions, find opportunities, and build projects and experiences to carry into college applications.",
    cta: "Start exploring",
  },
  problem: {
    title: "A job title doesn't tell you what the work feels like.",
    description:
      "Choose your classes. Think about college. Find an internship. Those are big decisions when you haven't had a chance to explore the work they could lead to.",
    response:
      "What if you could try a work situation before deciding whether to pursue it? In PathPilot, you explore a direction, make decisions in a career simulation, and use what you notice to plan your next step.",
  },
  closing: {
    title: "You don't need the whole plan. Just a place to begin.",
    description:
      "Start with what interests you. Try a career, ask a question, and find one thing you want to do next. Your path can change as you learn.",
  },
} as const;

export const landingOutcomes = [
  [
    "A clearer direction",
    "Career suggestions with reasons to investigate them, plus simulations that help you consider what the work feels like.",
  ],
  [
    "A plan you can return to",
    "A saved roadmap of skills, projects, and experience milestones. Choose what fits and turn the next step into a goal.",
  ],
  [
    "Experiences to pursue",
    "Project ideas and guidance to help you move from being interested in a field to trying something in it.",
  ],
  [
    "Opportunities worth checking",
    "Internship, competition, and research listings to explore. Review the organizer's eligibility and dates before applying.",
  ],
  [
    "A starting point for college preparation",
    "Build projects and record your work so you have concrete experiences to reflect on when explaining your interests.",
  ],
  [
    "Progress you can keep track of",
    "Goals, project milestones, and saved notes keep the next action in view. Ask Mentor for help thinking through a step when you get stuck.",
  ],
] as const;

export const landingAudiences = [
  {
    id: "students",
    label: "Student",
    invitation: "Explore your future",
    reason: "You're figuring out what comes next.",
    title: "You don't need to know your future yet.",
    description:
      "Leave with a few directions worth exploring and a reason to explore each one. Try the work in a simulation, then choose a skill, project, or experience from your roadmap to pursue at your own pace.",
    points: [
      "See career suggestions with reasons tied to your interests and experience.",
      "Return to your simulation choices and compare what you found interesting or difficult.",
      "Build around that direction with a roadmap, projects, opportunities, goals, and Mentor support. Keep work you can reflect on as you prepare for college.",
    ],
    storyTitle: "Maya likes technology. But what kind of work?",
    story:
      "Imagine Maya, a high school sophomore who enjoys technology but isn't sure whether software engineering, cybersecurity, or data science interests her most. She reviews those careers, tries different simulations, and compares what she enjoyed and found difficult.",
    next: "She chooses one direction to explore further, reviews a roadmap, and looks for a small project and relevant opportunities. Her next question is more concrete: ‘What could I try this month?’",
    cta: "Start exploring",
    href: "/auth",
  },
  {
    id: "parents",
    label: "Parent",
    invitation: "Help your student find direction",
    reason: "You're helping a student figure out what comes next.",
    title: "Help them explore without choosing for them.",
    description:
      "When your student shows you a career they explored or a project they want to try, you have something concrete to discuss. Look at their workspace together and help turn an interest into an experience without choosing their direction for them.",
    points: [
      "Understand the directions they are considering and what caught their attention.",
      "Discuss a skill to practice, a project to build, or an opportunity to check. See how those steps can become experiences to reflect on for college.",
      "Review what they choose to show you. PathPilot does not provide a separate parent monitoring account.",
    ],
    storyTitle: "From ‘I don't know’ to a conversation you can have.",
    story:
      "Imagine a parent whose student keeps saying they don't know what they want to do. They sit down together to look at PathPilot. The student chooses a career to explore on their own, then shows their parent a simulation decision that made them stop and think.",
    next: "Instead of asking for a final career choice, the parent asks what the student would like to learn next. They look at a roadmap suggestion together and discuss whether it fits the student's time and interests.",
    cta: "See how it works for students",
    href: "/students",
  },
  {
    id: "educators",
    label: "School / Counselor",
    invitation: "Give students a place to start",
    reason: "You're helping students navigate what's next.",
    title: "Give students a place to start. And a next step to discuss.",
    description:
      "Introduce a repeatable sequence for advisory, a careers lesson, or preparation for an appointment: explore a direction, try a scenario, review a plan, and choose an experience. Students can work independently while your guidance connects their plans to real school and local options.",
    points: [
      "Use career suggestions and simulation reflections as a starting point for discussion.",
      "Help students turn personalized milestones and opportunity listings into manageable next steps.",
      "Students can share a revocable, seven-day report of planning counts and current focus. It does not give staff access to their private workspace.",
    ],
    storyTitle: "One starting point. Different student conversations.",
    story:
      "Imagine a counselor preparing to meet students with a wide range of interests. Before their appointments, they invite each student to explore one career in PathPilot and bring a question. One student wants to discuss a difficult simulation choice; another wants help making a project idea realistic.",
    next: "The counselor uses those starting points to guide the conversation. PathPilot provides exploration material; the counselor helps students interpret it in the context of their circumstances and school options.",
    cta: "Bring PathPilot to your students",
    href: "/schools",
  },
] as const;

export const landingJourneySteps = [
  {
    id: "discover",
    label: "Discover yourself",
    title: "Start with what makes you curious.",
    description:
      "Share your interests, skills, activities, and the kind of work you might enjoy. Your context helps make the guidance relevant; you do not need to arrive with a chosen career.",
    next: "Use those starting points to explore possible careers.",
  },
  {
    id: "explore",
    label: "Explore careers",
    title: "Put a few possibilities side by side.",
    description:
      "Career discovery suggests directions to investigate. Then explore the simulation catalog to find a work situation you want to try. These are possibilities to question, not decisions made for you.",
    next: "Choose a career and experience some of its decisions.",
  },
  {
    id: "experience",
    label: "Experience a career",
    title: "What would you do in this situation?",
    description:
      "Make decisions in a branching career simulation and see how the situation changes. Your saved decision history and learning metrics give you something concrete to reflect on when you return.",
    next: "Turn what you noticed into something you can learn or practice.",
  },
  {
    id: "roadmap",
    label: "Build your roadmap",
    title: "Give an interest a next step.",
    description:
      "A personalized roadmap connects a career direction to skills, projects, and experience milestones. Review the suggestions and choose what fits your circumstances.",
    next: "Look for experiences that could help you take that step.",
  },
  {
    id: "opportunities",
    label: "Find opportunities",
    title: "Find something you could actually try.",
    description:
      "Browse internships, competitions, and research opportunities. Check published eligibility and organizer details, save an interesting listing, or turn it into a goal.",
    next: "Bring the opportunity into your own plan.",
  },
  {
    id: "continue",
    label: "Keep moving forward",
    title: "Come back to a path that keeps moving.",
    description:
      "Return to saved simulations, update your goals, and work on project milestones. Ask the career mentor about a decision or the project assistant about the next step in a project.",
    next: "Keep exploring as your interests and experience grow.",
  },
] as const;

export const landingQuestions = [
  {
    question: "Do I need to know what career I want already?",
    answer:
      "No. Start with your interests, activities, and things you would like to learn. Career discovery gives you directions to investigate, and simulations help you explore them before committing.",
  },
  {
    question: "Is this just a career quiz?",
    answer:
      "Your profile is a starting point. PathPilot also includes career simulations, saved progress, personalized roadmaps, opportunities, goals, and guidance for the steps you choose to take.",
  },
  {
    question: "Does PathPilot replace a counselor?",
    answer:
      "No. It supports independent exploration and gives students material to discuss with a counselor, teacher, or parent. Those people bring personal context and judgment that a tool cannot replace.",
  },
  {
    question: "What can I do with what I discover?",
    answer:
      "Review a roadmap, choose a skill or project to work on, browse opportunities, and track a goal. You decide which suggestions to act on, and you can revisit your direction as you learn.",
  },
  {
    question: "Does a simulation tell me which career I should choose?",
    answer:
      "No. Its metrics describe decisions within a particular scenario. They are learning signals to reflect on, not a measure of your ability or a prediction of career success.",
  },
] as const;
