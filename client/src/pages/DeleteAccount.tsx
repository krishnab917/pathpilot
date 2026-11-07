import { Link } from "wouter";
import { LegalLayout } from "@/components/LegalLayout";

export default function DeleteAccount() {
  return <LegalLayout title="Delete your PathPilot account">
    <p>You can delete your own account from <Link href="/app/settings">Workspace Settings</Link>. If you are signed out, <Link href="/auth">sign in</Link> first.</p>
    <h2>Before you delete</h2>
    <p>Deletion removes your account and its associated PathPilot records, including your profile, private plans, projects, saved opportunities, simulations, and Mentor history. Published portfolio entries and planning-report links associated with the account are also removed through database relationships. Save any work you want to keep first.</p>
    <h2>Confirm the action in Settings</h2>
    <p>Choose Delete Account and type DELETE in the confirmation dialog. PathPilot checks your signed-in identity on the server. Deletion cannot be undone through the application.</p>
    <h2>Retention and help</h2>
    <p>Backups, infrastructure logs, and information already processed by providers follow separate retention schedules. See the <Link href="/privacy">Privacy Policy</Link>. If you cannot access your account or need help with a deletion request, contact <a href="mailto:krishna@k12worx.org">krishna@k12worx.org</a> or <a href="mailto:vedanth@k12worx.org">vedanth@k12worx.org</a>. Do not send passwords, tokens, or sign-in links. A support request may require verification of account ownership.</p>
  </LegalLayout>;
}
