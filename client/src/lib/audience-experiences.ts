export type Audience = "student" | "parent" | "counselor";
export const audienceOrder: Audience[] = ["student", "parent", "counselor"];
export type AudienceSectionId =
  | "discovery"
  | "opportunities"
  | "roadmap"
  | "projects"
  | "goals"
  | "college"
  | "mentor";
export const audienceExperiences = {
  student: {
    sections: [
      "discovery",
      "opportunities",
      "roadmap",
      "projects",
      "goals",
      "college",
      "mentor",
    ] as AudienceSectionId[],
    invitation: "Explore, build, and take a next step.",
    overview:
      "Find directions and opportunities, build projects, and prepare experiences for college applications.",
    label: "Student",
    route: "/students",
    headline: ["Find your direction.", "Make something of it."],
    description:
      "Not sure what to pursue? Try different directions. Already have one? Build a plan, find opportunities, and make experiences you can carry into college.",
    cta: "Start exploring",
    ctaHref: "/auth",
    boundary:
      "A hands-on tour of your student workspace. Examples stay on this page; nothing is saved.",
    opportunities: ["Find something", "worth pursuing."],
    discovery: ["Curiosity is enough.", "Try a direction."],
    roadmap: ["Know where you are.", "See what comes next."],
    work: ["Turn the plan", "into work you're proud of."],
    college: ["Build experiences first.", "Have something real to say."],
    collegeCopy:
      "The work matters before the application. Keep track of what you tried, what changed, and what you learned. Those experiences give you something concrete to reflect on when preparing for college.",
    final: "You don't need the whole plan. Start with a next step.",
    purposes: {
      opportunities: "Find an experience I can investigate.",
      discovery: "Try a direction before committing.",
      roadmap: "See my current focus and next step.",
      projects: "Build and test a manageable first version.",
      goals: "Make a commitment and track the work.",
      mentor: "Ask for help with a specific next step.",
      college: "Connect my experiences to what I learned.",
    },
  },
  parent: {
    sections: [
      "discovery",
      "roadmap",
      "projects",
      "goals",
      "college",
      "opportunities",
      "mentor",
    ] as AudienceSectionId[],
    invitation: "Understand the plan. Support the process.",
    overview:
      "See how interests become next steps and find constructive ways to support your student's preparation.",
    label: "Parent",
    route: "/parents",
    headline: ["Help them find direction.", "Leave room for their own."],
    description:
      "PathPilot helps your student explore careers, build a plan, and turn interests into projects and experiences. Understand the work behind their college preparation, without choosing the path for them.",
    cta: "Explore the student experience",
    ctaHref: "/students",
    boundary:
      "A parent’s view of the student experience, not a parent dashboard. Your student decides what to show or share.",
    opportunities: ["An interest becomes", "something to talk about."],
    discovery: ["Hear more than", "“I don't know yet.”"],
    roadmap: ["See what they're", "working toward."],
    work: ["Less guessing.", "Something they can show you."],
    college: ["See how the pieces", "build toward college."],
    collegeCopy:
      "A direction, a project, an experience, and a little reflection are easier to discuss than an abstract future. Ask your student to show the work they want to share. Support their decisions without turning every interest into an admissions strategy.",
    final: "Start a conversation. Let them take the next step.",
    purposes: {
      opportunities: "Understand an experience and what support it might need.",
      discovery: "Recognize the interests behind a possible direction.",
      roadmap: "Understand completed, current, and upcoming work.",
      projects: "See tangible work, with the student’s permission.",
      goals: "Understand progress without managing their tasks.",
      mentor: "Understand the kind of question a student can work through.",
      college: "Talk about the experiences behind their preparation.",
    },
  },
  counselor: {
    sections: [
      "discovery",
      "opportunities",
      "roadmap",
      "goals",
      "projects",
      "college",
      "mentor",
    ] as AudienceSectionId[],
    invitation: "Turn a conversation into a concrete plan.",
    overview:
      "Connect exploration, experiences, and college planning using examples or work a student chooses to share.",
    label: "Counselor",
    route: "/counselors",
    headline: ["Give the conversation", "a concrete next step."],
    description:
      "Students explore directions, make roadmaps, and find experiences in PathPilot. Bring that work into your conversations so career exploration can become a practical part of college preparation.",
    cta: "Talk about a student introduction",
    ctaHref:
      "mailto:krishna@k12worx.org?subject=PathPilot%20student%20introduction",
    boundary:
      "A guided view of student-owned work, not a counselor management system. No automatic access to private student records.",
    opportunities: ["Turn a direction", "into an option to investigate."],
    discovery: ["Start with their thinking.", "Help them test it."],
    roadmap: ["Find the current priority.", "Make the next step discussable."],
    work: ["Connect the plan", "to evidence of action."],
    college: ["A clearer conversation", "about preparation."],
    collegeCopy:
      "Help a student connect what they explored, what they made, and what they learned. PathPilot gives them a place to do that work; your expertise helps put it in context. It does not replace counseling or predict admissions.",
    final: "Give students a starting point. Keep your guidance at the center.",
    purposes: {
      opportunities: "Identify a relevant option and questions to verify.",
      discovery: "Turn student interests into a useful discussion.",
      roadmap: "Connect current priority to one manageable next action.",
      projects: "See how a project applies a roadmap skill.",
      goals: "Help a student choose one manageable next step.",
      mentor: "Distinguish contextual guidance from a decision.",
      college: "Help students reflect on evidence, not a readiness score.",
    },
  },
} as const;

export const discoveryConversations = [
  {
    quote: "I like making things work.",
    interest: "Building useful tools",
    question:
      "Which part would you want to try: designing the screen or making it work?",
    next: "Try the Software Engineer simulation, then compare what felt interesting with what felt difficult.",
  },
  {
    quote: "I want to know how something went wrong.",
    interest: "Investigating and protecting",
    question:
      "What do you enjoy more: finding clues or explaining what happened?",
    next: "Explore the Cybersecurity Analyst simulation and discuss how you approached the evidence.",
  },
  {
    quote: "I like finding patterns in information.",
    interest: "Working with data",
    question: "What question would you want to answer with a small dataset?",
    next: "Try the Data Scientist simulation before deciding whether to build a data-focused project.",
  },
] as const;

// Tour guidance, not generated advice or additional product capabilities.
export const adultRoadmapChapters = {
  parent: [
    [
      "Start with the direction they chose.",
      "Ask what caught their attention. A saved direction is something to explore, not a final career decision.",
      "What interests you about this kind of work?",
    ],
    [
      "Notice what they've already tried.",
      "A completed skill milestone gives you something concrete to ask about. Completion here is illustrative, not evidence of a learning outcome.",
      "Can you show me something you learned to make?",
    ],
    [
      "Understand an experience before planning for it.",
      "Look at the organizer’s requirements together. Timing, location, eligibility, and the student’s interest matter more than the name of the program.",
      "What would participating involve for you?",
    ],
    [
      "See the work in progress.",
      "A small project makes an interest tangible. Ask to see the version they have, rather than waiting for a finished result.",
      "What works so far, and what are you trying next?",
    ],
    [
      "Support one manageable commitment.",
      "A goal belongs to the student. Help them make room for it without taking over their task list.",
      "Is there something practical I can help with?",
    ],
    [
      "Let their explanation lead.",
      "Projects and notes can help them reflect when preparing for college. Their own account of what changed matters more than a polished story.",
      "What surprised you, and what would you do differently?",
    ],
  ],
  counselor: [
    [
      "Locate the student’s current direction.",
      "Use the student’s explanation of their interests as the starting point. A career match is a conversation starter, not a placement decision.",
      "What evidence would help you test this direction?",
    ],
    [
      "Connect a skill to a use.",
      "Review the skill milestone they choose to show. Help identify a manageable way to apply it rather than adding another abstract requirement.",
      "Where could you put this skill to work?",
    ],
    [
      "Check the opportunity, not just the title.",
      "Discuss the source requirements and the student’s reason for considering it. The listing is not a personalized eligibility decision.",
      "What should you verify before spending time on an application?",
    ],
    [
      "Review the scope of the work.",
      "The project connects to a roadmap milestone. Talk about what a first version needs and what can wait.",
      "What would count as a useful first version?",
    ],
    [
      "Leave with one next action.",
      "Use the student’s chosen goal to make the conversation actionable. The student updates their own plan and progress.",
      "What will you try before your next conversation?",
    ],
    [
      "Turn the experience into reflection.",
      "Help the student explain choices, trade-offs, and learning. PathPilot is not an admissions rubric or a readiness score.",
      "What does this experience tell you about what you want to pursue?",
    ],
  ],
} as const;
