export type AudienceLandingContent = {
  audience: string;
  title: string;
  description: string;
  metaDescription: string;
  cta: string;
  ctaHref: string;
  followUp: { title: string; description: string; cta: string; href: string };
  sections: Array<{
    eyebrow: string;
    title: string;
    description: string;
    points?: Array<{ title: string; description: string }>;
  }>;
};

export const audienceLandingCopy: Record<"schools" | "counselors" | "parents", AudienceLandingContent> = {
  schools: {
    audience: "For schools",
    title: "Help students discover a career and build a path toward it.",
    description: "PathPilot is a career exploration tool built by students, for students. It brings career discovery, simulations, and personalized roadmaps together so students can explore what interests them and decide what to try next.",
    metaDescription: "Give students a structured way to explore careers, try simulations, and plan next steps with PathPilot, alongside your school's existing guidance.",
    cta: "Bring PathPilot to your school",
    ctaHref: "mailto:support@pathpilotapp.com?subject=PathPilot%20for%20our%20school",
    followUp: {
      title: "See where PathPilot could fit at your school.",
      description: "Tell us who you work with and how your school approaches career exploration. We can discuss a starting point and your questions about student use, privacy, and setup.",
      cta: "Bring PathPilot to your school",
      href: "mailto:support@pathpilotapp.com?subject=PathPilot%20for%20our%20school",
    },
    sections: [
      {
        eyebrow: "A starting point for exploration",
        title: "Give students more than a list of job titles.",
        description: "Schools ask students to plan for life after graduation, but a job title alone does not tell them what the work involves. PathPilot gives them a sequence they can follow at their own pace.",
        points: [
          { title: "Discover", description: "Students describe their interests, skills, and activities, then explore possible career directions." },
          { title: "Try", description: "Career simulations let them make decisions in work scenarios and reflect on the choices they made." },
          { title: "Plan", description: "A personalized roadmap suggests skills to build, projects to try, and milestones to work toward." },
          { title: "Find opportunities", description: "Students browse opportunities and check which experiences fit their interests, location, and eligibility." },
        ],
      },
      {
        eyebrow: "In support of school communities",
        title: "Give counselors and teachers a starting point.",
        description: "A student can bring a career they explored, a simulation decision, or a roadmap step into a conversation with school staff. Counselors and teachers provide the judgment and personal context that help students make sense of what they find.",
      },
      {
        eyebrow: "A flexible way to begin",
        title: "Use it alongside the work already happening.",
        description: "You could introduce PathPilot during an advisory period, pair a simulation with a careers lesson, or invite students to explore before a counseling appointment. Students use their own workspace; your team decides how it fits alongside existing guidance.",
      },
    ],
  },
  counselors: {
    audience: "For counselors and educators",
    title: "Give career conversations a place to start.",
    description: "PathPilot helps students discover careers and build a path toward them through simulations, roadmaps, and practical next steps. They can explore between appointments and bring you questions grounded in something they have tried.",
    metaDescription: "See how PathPilot's career exploration, simulations, and roadmaps can give students something concrete to discuss with their counselor.",
    cta: "See how students explore",
    ctaHref: "#how-it-works",
    followUp: {
      title: "Start with the students you support.",
      description: "Tell us what students tend to ask and where they get stuck. We can walk through the student experience and discuss whether it fits your counseling or classroom work.",
      cta: "Talk to us about PathPilot",
      href: "mailto:support@pathpilotapp.com?subject=PathPilot%20for%20counseling",
    },
    sections: [
      {
        eyebrow: "Independent exploration",
        title: "Students can start where they are.",
        description: "Students begin with their interests, skills, and activities, then review career directions to investigate. They can try a simulation and see how their decisions play out. They do not need a chosen career to begin.",
      },
      {
        eyebrow: "A shared point of reference",
        title: "Turn curiosity into a useful conversation.",
        description: "Before an appointment, you might ask a student to explore one career and bring a question about it. Together, you can discuss a simulation choice, question a roadmap suggestion, or choose a manageable project or goal to follow up on.",
      },
      {
        eyebrow: "Your expertise stays central",
        title: "Your understanding of the student matters.",
        description: "PathPilot complements counseling by giving students material to explore and discuss. Its suggestions need context: you know the student's circumstances, local options, and questions that a tool may miss. A roadmap is something to review together, not a decision made for them.",
      },
    ],
  },
  parents: {
    audience: "For parents and guardians",
    title: "Help them discover a career, one next step at a time.",
    description: "PathPilot is a place for students to explore career interests, try decisions in simulations, and build a personalized roadmap. Your student can find something worth trying while leaving room for their interests to change.",
    metaDescription: "Help your student explore career interests, try simulations, and turn curiosity into practical next steps with a personalized PathPilot roadmap.",
    cta: "Explore PathPilot together",
    ctaHref: "/auth",
    followUp: {
      title: "Start with something they are curious about.",
      description: "Sit down together and invite your student to sign in or create their own account. Let them choose a career to explore, then ask what surprised them and what they would like to try next.",
      cta: "Explore PathPilot together",
      href: "/auth",
    },
    sections: [
      {
        eyebrow: "Start with their curiosity",
        title: "Explore possibilities before narrowing them down.",
        description: "Your student starts by sharing interests, skills, and activities. PathPilot suggests career directions to look into, giving them somewhere to begin even when their answer to ‘What do you want to do?’ is still ‘I don't know.’",
      },
      {
        eyebrow: "Learn by trying",
        title: "Get a feel for the decisions a job can involve.",
        description: "Students make choices in career simulations and see the consequences. You can ask which decisions interested them or felt difficult. These scenarios offer a first look at a type of work, not a prediction of how successful they will be.",
      },
      {
        eyebrow: "One next step at a time",
        title: "Turn a vague interest into something to try.",
        description: "A personalized roadmap suggests skills, projects, and experience milestones. Students can also browse opportunities and track their own goals. You can help them choose a manageable next step while they keep ownership of the direction they explore.",
      },
    ],
  },
};
