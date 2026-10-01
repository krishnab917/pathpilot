import { LegalLayout } from "@/components/LegalLayout";

export default function Accessibility() {
  return (
    <LegalLayout title="Accessibility Statement">
      <p>Last updated: September 30, 2026</p>

      <h2>Our commitment</h2>
      <p>PathPilot aims to make career exploration usable for as many people as reasonably possible. We are continuing to improve the public site and the student workspace, and we welcome reports of barriers that prevent someone from using a feature.</p>

      <h2>How the site is built</h2>
      <p>The application uses page headings and landmarks, labeled form fields, native links and buttons in many flows, and accessible names or status messages in several interactive components. Pages adapt to smaller screens, and the workspace offers a theme preference. These practices support accessibility but do not mean every interaction has been fully tested with every keyboard or assistive-technology setup.</p>

      <h2>Standards and current limits</h2>
      <p>We use the Web Content Accessibility Guidelines as a reference for ongoing improvements. PathPilot has not completed a formal conformance assessment, so we do not claim WCAG Level A, AA, or AAA conformance. Complex workspace interactions, including branching simulations, generated guidance, and dialogs, have not been comprehensively assessed with assistive technologies. If one of these flows is difficult to use, please tell us which step is affected so we can investigate and discuss another way to get help.</p>

      <h2>Feedback and assistance</h2>
      <p>To report a barrier or request assistance, email <a href="mailto:krishna@k12worx.org">krishna@k12worx.org</a> or <a href="mailto:vedanth@k12worx.org">vedanth@k12worx.org</a>. Please include the page or feature, what you were trying to do, what happened, and your browser and device. If relevant, tell us which assistive technology you use. A screenshot can help, but it is not required. Please remove private student information and credentials before sharing one.</p>
      <p>We will review the report and follow up as we are able. We cannot promise a specific response time or that every issue will have an immediate fix.</p>
    </LegalLayout>
  );
}
