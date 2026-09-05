import { LegalLayout } from "@/components/LegalLayout";

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>Last updated: September 2026</p>

      <h2>Introduction</h2>
      <p>
        At PathPilot, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information when you use our career exploration platform.
      </p>

      <h2>Information We Collect</h2>
      <p>
        We collect information that you provide directly to us, including:
      </p>
      <ul>
        <li><strong>Account Information:</strong> Name, email address, and password when you register.</li>
        <li><strong>Profile Data:</strong> Your grade level, country, and career interests.</li>
        <li><strong>Activity Data:</strong> Your decisions in career simulations, roadmap progress, and goals.</li>
        <li><strong>Mentor Conversations:</strong> Messages you exchange with our AI career mentor.</li>
      </ul>

      <h2>How We Use Your Information</h2>
      <p>
        We use the collected data to:
      </p>
      <ul>
        <li>Provide personalized career recommendations and roadmaps.</li>
        <li>Power the AI career mentor with relevant context.</li>
        <li>Improve our simulations and platform experience.</li>
        <li>Communicate with you about your account and progress.</li>
      </ul>

      <h2>Data Protection</h2>
      <p>
        Your data is stored securely using industry-standard encryption. We do not sell your personal information to third parties. We use Supabase for secure authentication and data persistence.
      </p>

      <h2>Your Rights</h2>
      <p>
        You have the right to access, correct, or delete your personal data. You can delete your account at any time through the Settings section in your workspace, which will permanently remove all your data from our systems.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us through our Support page.
      </p>
    </LegalLayout>
  );
}
