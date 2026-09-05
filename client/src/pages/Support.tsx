import { LegalLayout } from "@/components/LegalLayout";

export default function Support() {
  return (
    <LegalLayout title="Support">
      <p>We're here to help you navigate your career journey.</p>

      <h2>How to Get Help</h2>
      <p>
        If you encounter any issues or have questions about using PathPilot, please explore the options below.
      </p>

      <h2>Frequently Asked Questions</h2>
      <ul>
        <li><strong>How do I start a simulation?</strong> Go to the Simulate section in your workspace and choose a career path.</li>
        <li><strong>Can I change my roadmap?</strong> Yes, you can update your active career or goals in the Roadmap section.</li>
        <li><strong>Is my data safe?</strong> Yes, we use secure encryption and you can delete your account at any time.</li>
      </ul>

      <h2>Report an Issue</h2>
      <p>
        If you find a bug or something isn't working correctly, please let us know. We are constantly improving PathPilot based on student feedback.
      </p>

      <h2>Contact Us</h2>
      <p>
        For further assistance, you can reach out to our team at:
        <br />
        <strong>Email:</strong> support@pathpilotapp.com
      </p>
      <p className="mt-4 text-sm text-muted-foreground italic">
        Note: This email address is for support inquiries only. We aim to respond to all requests within 48 hours.
      </p>
    </LegalLayout>
  );
}
