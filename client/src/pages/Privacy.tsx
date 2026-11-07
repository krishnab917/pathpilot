import { LegalLayout } from "@/components/LegalLayout";

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>Last updated: October 26, 2026</p>

      <h2>About this policy</h2>
      <p>PathPilot helps students explore careers, try work scenarios, and plan next steps. This policy explains the information involved when you visit the site or use an account, how it is used, and the choices available to you.</p>

      <h2>Information you provide and create</h2>
      <ul>
        <li><strong>Account details.</strong> Registration uses your name, email address, and password. Supabase handles authentication and password-related account services; PathPilot uses your account identity to connect saved work to you.</li>
        <li><strong>Profile and onboarding.</strong> You can provide your grade, location, planning country and education system, interests, skills, activities, and career preferences. Onboarding drafts may be saved before you finish.</li>
        <li><strong>Exploration and plans.</strong> We save career matches, simulation choices and results, roadmaps and milestones, goals, opportunity activity, projects and project notes, and related progress so you can return to them. Simulation response times are recorded only if you turn on that optional setting.</li>
        <li><strong>AI interactions.</strong> We save the questions and replies in your Career Mentor conversation. Project Guidance uses the selected project and your request; a validated response may be cached with a versioned input hash. Career discovery and roadmap generation use relevant saved context.</li>
        <li><strong>Information you choose to share.</strong> You can publish selected portfolio profile and project details. You can also create a time-limited link to a planning report. Anyone with a working public link may be able to view the information it exposes until it expires or you revoke it.</li>
      </ul>
      <p>PathPilot does not currently offer a résumé or CV upload feature. Please avoid putting sensitive information into free-text fields unless it is needed for your use of PathPilot.</p>

      <h2>Technical information and browser storage</h2>
      <p>Our application and hosting services may process information needed to serve requests and diagnose failures, such as request times, response status, and browser or network details. Application diagnostics may record operation names, timing, and error categories. Supabase stores your browser authentication session so you can stay signed in. The site also uses browser storage for preferences such as theme and sidebar width, and a sidebar-state cookie. A configurable analytics script may receive page-use and technical information if analytics is enabled in the deployment.</p>

      <h2>How we use information</h2>
      <p>We use this information to authenticate accounts, save and display your work, tailor career discovery and roadmaps, run simulations, show relevant opportunities, provide Mentor and Project Guidance, support the sharing options you choose, protect AI requests from abuse, investigate errors, and respond when you contact us. Supabase may also send account confirmation or password-reset messages when you request them.</p>

      <h2>AI processing</h2>
      <p>When you request career analysis, a roadmap, Mentor help, or Project Guidance, PathPilot's server sends the information needed for that request to a configured AI provider through an OpenAI-compatible API. This can include profile answers, selected simulation insights, relevant goals or projects, and the text you submit. The provider processes that information to produce a response. AI output is checked before it is saved or shown, but it can still be inaccurate or incomplete. Provider retention and use of submitted information depend on the provider and its terms; we do not promise that submissions are excluded from provider training.</p>

      <h2>Services and sharing</h2>
      <p>Supabase provides account authentication and application data storage. The configured AI provider processes requests to AI features. Our hosting provider serves the site and API. A configured analytics service may process site usage if enabled. Fonts are served with the website. Opportunity listings can link to outside organizers; their sites have their own practices. We do not make your private workspace public through those links. Information you intentionally publish through a portfolio or report link is visible according to that feature's sharing controls.</p>

      <h2>Retention and deletion</h2>
      <p>Saved account information generally remains while your account is active and until you edit, unpublish, revoke, or delete it, depending on the feature. Some short-lived features, such as project-guidance cache entries and report links, have expiry controls. Retention periods can differ for account records, infrastructure logs, backups, and information processed by service providers; we do not currently publish one period that applies to all of them. In Workspace Settings, you can request account deletion; the application deletes the Supabase auth user and uses database relationships to remove associated PathPilot records. Copies held in backups, logs, or by providers may follow separate retention schedules.</p>

      <h2>Security</h2>
      <p>PathPilot uses authenticated requests, user-scoped database access, and restricted server-side credentials for privileged operations. We work to limit access and diagnose abuse, but no online service can guarantee absolute security. Keep your password and sign-in links private, and tell us if you believe your account has been compromised.</p>

      <h2>Your choices</h2>
      <p>You can review your saved work in the workspace, update supported profile and planning settings, control optional simulation timing, unpublish portfolio projects, revoke report links, and delete your account in Settings. For access, correction, deletion, or other privacy requests that are not available in the product, contact us. Additional rights may apply depending on where you live; we will review requests under applicable law.</p>

      <h2>Students and school use</h2>
      <p>PathPilot is designed for student career exploration, including possible use alongside school or counselor guidance. Sign-up does not ask for a date of birth or provide an in-app parent-consent process. Parents, guardians, and schools should consider whether and how a student should use the service. A school-related introduction or use does not by itself give school staff access to an individual student's private workspace. Contact us if you have a concern about a student's information.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy as the service changes. We will post the revised text here with a new last-updated date. Please review it when returning to PathPilot.</p>

      <h2>Contact</h2>
      <p>For privacy questions or requests, email <a href="mailto:krishna@k12worx.org">krishna@k12worx.org</a> or <a href="mailto:vedanth@k12worx.org">vedanth@k12worx.org</a>. Please do not send passwords, session tokens, or other secrets.</p>
    </LegalLayout>
  );
}
