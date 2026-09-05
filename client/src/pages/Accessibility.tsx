import { LegalLayout } from "@/components/LegalLayout";

export default function Accessibility() {
  return (
    <LegalLayout title="Accessibility Statement">
      <p>Last updated: September 2026</p>

      <h2>Our Commitment</h2>
      <p>
        PathPilot is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
      </p>

      <h2>Measures to Support Accessibility</h2>
      <p>
        PathPilot takes the following measures to ensure accessibility:
      </p>
      <ul>
        <li>Include accessibility as part of our mission statement.</li>
        <li>Integrate accessibility into our procurement practices.</li>
        <li>Provide continual accessibility training for our staff.</li>
        <li>Employ formal accessibility quality assurance methods.</li>
      </ul>

      <h2>Conformance Status</h2>
      <p>
        The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. PathPilot is partially conformant with WCAG 2.1 level AA.
      </p>

      <h2>Feedback</h2>
      <p>
        We welcome your feedback on the accessibility of PathPilot. Please let us know if you encounter accessibility barriers:
      </p>
      <ul>
        <li><strong>Email:</strong> accessibility@pathpilotapp.com</li>
      </ul>

      <h2>Technical Specifications</h2>
      <p>
        Accessibility of PathPilot relies on the following technologies to work with the particular combination of web browser and any assistive technologies or plugins installed on your computer:
      </p>
      <ul>
        <li>HTML</li>
        <li>WAI-ARIA</li>
        <li>CSS</li>
        <li>JavaScript</li>
      </ul>
    </LegalLayout>
  );
}
