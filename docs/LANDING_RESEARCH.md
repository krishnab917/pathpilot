# PathPilot landing page research and decisions

October 8, 2026 research; October 9 release positioning update. These are editorial judgments, not results from student interviews or conversion testing.

## Final product-overview positioning

The final brief makes the homepage a role-neutral introduction, with dedicated Student, Parent, and Counselor routes near the hero. The selected release headline is **“Discover your career. Build the path to reach it.”** The subhead explains how students turn exploration into a plan, opportunities, projects, and experiences for college applications. Parents and counselors receive their own interpretation-oriented tours rather than being sent through student tasks.

The hero primary CTA now focuses the nearby audience selector. Every audience choice opens its dedicated route. “Try Opportunities” still opens the public demonstration on the same page. The earlier candidate evaluation below is retained as research history, not the final copy contract.

## Messaging references

Official pages reviewed: [YouScience](https://www.youscience.com/), [Xello](https://xello.world/en/), [BigFuture](https://bigfuture.collegeboard.org/), [Scoir](https://www.scoir.com/), [Forage](https://www.theforage.com/), [MaiaLearning](https://www.maialearning.com/), [CareerExplorer](https://www.careerexplorer.com/), [Todoist](https://www.todoist.com/), [Notion](https://www.notion.com/product), and [Linear](https://linear.app/).

BigFuture makes the next action concrete through distinct planning categories. Forage makes trying work tangible. Xello connects exploration to planning, although its institutional buyer language is not a good student voice. Scoir distinguishes audiences rather than treating parents as students. Todoist pairs a short emotional promise with visible software. The useful principle is a simple promise followed immediately by product evidence, not borrowing another product's claims, statistics, partnerships, or wording.

PathPilot is not a college search engine, admissions predictor, job-placement service, or counselor replacement. Its defensible distinction is the connection between discovery, simulations, a saved roadmap, opportunities, projects, goals, and contextual guidance. College preparation means building experiences to reflect on, not improving acceptance odds.

## Headline candidates

Each candidate is assessed for student language, parent clarity, memorability, both entry points, college relevance, and visual strength. Category clichés avoided include certainty about a perfect career, vague potential, institutional readiness jargon, and admissions guarantees.

| Candidate | Why it works and student problem | Difference from category language and limitation |
| --- | --- | --- |
| Find what fits. Build toward it. | Short, balanced, easy to say. Covers choosing and doing. Strong two-line composition. | Connects fit to action instead of stopping at a quiz. Needs concrete subhead for college and existing direction. Selected. |
| Figure out what you want. Then build toward it. | Existing voice, clear to both students and parents. | Good action sequence, but longer and implies discovery must come first. |
| Have a direction. Have a next step. | Names two useful outputs, calm and readable. | Avoids destiny language, but sounds more certain than exploration warrants. |
| Not sure yet? Start with something worth trying. | Honest about uncertainty; lowers pressure. | Emphasizes simulations and action but leaves out students with a plan. |
| Know what interests you. Know what to try next. | Concrete interests and action, easy for parents. | More specific than potential; repeated certainty overpromises knowledge. |
| An interest is a starting point. Build from there. | Makes the already-interested student feel included. | Moves beyond assessment, but weak for someone without an interest. |
| Explore a direction. Make it your next project. | Strong concrete action with visual possibilities. | Too narrow: not every path needs a project first. |
| Find your direction. Make your next move. | Memorable rhythm, encompasses both entry points. | “Next move” is less concrete than building and could fit any planning app. |
| See what fits. See what comes next. | Gentle and approachable, emphasizes visible outputs. | Passive; underplays the work students actually do. |
| Less guessing. More to go on. | Recognizable feeling without fear, strong visual headline. | Product and college relevance unclear without substantial explanation. |
| Build a plan around what interests you. | Direct, believable promise parents understand. | Doesn't convey discovery or simulations; less memorable. |
| Try a path. Build a body of work. | Connects career exploration to college preparation. | “Body of work” is adult language and sounds art-specific. |
| Your interests. A plan. Something to show for it. | Emphasizes outputs and experiences rather than AI. | Too many fragments and may imply automatic outcomes. |
| You don't need it all figured out to begin. | Humane and emotionally accurate. | Common category reassurance; ignores students who know their direction. |

## Subhead candidates

1. **Explore careers if you're unsure. Start with your direction if you're not. Turn it into a plan, opportunities, and projects you can build on for college.** Selected: explicitly includes both students, names outputs, connects college without promising admissions. Longer than a slogan, but carries necessary product explanation.
2. Try different careers, make a roadmap, and find your next experience. Build toward college with work that reflects what interests you. Concrete, but assumes everyone starts with exploration.
3. From your first career question to a project you can explain, PathPilot gives you a way to keep moving. Human but omits opportunities and makes college implicit.
4. Discover directions worth exploring. Or bring one with you. Find the next step, then put it into practice. Strong inclusion and action, but lacks college context and visible product nouns.
5. Explore before you commit. Build when you're ready. Keep your plan, projects, goals, and guidance together. Clear system promise but sounds like a feature inventory and makes planning feel gated.

Primary CTA: Start exploring → existing authenticated workspace or sign-in. Secondary: Try Opportunities → same-page public demonstration. Neither promises a free trial, a particular result, or instant generation.

## Product evidence and data boundaries

The public preview uses a small checked-in sample, never private student records or anonymous access to authenticated catalog RPCs. NASA and Brookhaven records derive from existing server source adapters. Hack Club records come from its public directory through the repository's existing parser. Career-domain tags reflect the current catalog rules; they are broad alignment signals, not eligibility or personalized recommendations. Historical Brookhaven data is explicitly historical. No application-open status or current deadline is inferred.

The Hack Club parser currently includes inline CSS/schema metadata in its location text. The public sample omits that contaminated field; this task does not change the ingestion backend. Some PathwaysToScience listings target undergraduates, so they are not used to imply availability for high-school students. Empty internship results in this small sample are intentional, not a claim that the full catalog lacks internships.

## Interaction references

- [React Bits Animated List source](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/AnimatedList/AnimatedList.jsx): bounded item entrances. Keep native keyboard behavior; do not copy its window-level Tab interception.
- [React Bits Stepper source](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/Stepper/Stepper.jsx): coordinated active-step and content changes. Use semantic controls; tour position is not completed work.
- [React Bits Fade Content source](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/FadeContent/FadeContent.jsx): threshold-based reveal and cleanup. Use installed Motion instead of adding GSAP, blur, or disappearing content.
- [Aceternity Sticky Scroll source](https://ui.aceternity.com/registry/sticky-scroll-reveal.json) and [Timeline](https://ui.aceternity.com/components/timeline): pair a sticky product panel with document-scroll chapters. Avoid nested scroll traps and template gradients.
- [Motion scroll](https://motion.dev/docs/react-scroll-animations) and [layout](https://motion.dev/docs/react-layout-animations): viewport-based activation, transform-only path progression, user-driven result transitions, reduced-motion fallback.

No external template, new animation dependency, WebGL, or continuously moving decoration is required. Existing product components remain authoritative.

## Palette direction

The initial landing-only review retained the original palette. The subsequent, explicitly requested product-wide comparison supersedes that decision: Direction C is now the shared default after rendering A/B/C on real product screens. See [the color review](COLOR_REVIEW.md) for exact tokens, evidence, preview instructions, and limitations. There is no landing-only replacement palette.
