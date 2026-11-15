import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ProgressiveIntake, initialIntakeProfile } from "../pages/Onboarding";
import { CareerExplorer } from "../components/CareerExplorer";
import { draftProfileSchema, type IntakeProfile } from "@shared/discovery-intake";
import "../index.css";

if (!import.meta.env.DEV) throw new Error("Onboarding review is development-only.");
const key = "pathpilot-synthetic-onboarding-review";
function restored() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
    const parsed = draftProfileSchema.safeParse(saved?.profile);
    return parsed.success ? { profile: parsed.data, step: Number.isInteger(saved.step) ? saved.step : 0, done: saved.done === true } : null;
  } catch { return null; }
}
function Review() {
  const [saved] = useState(restored);
  const [profile, setProfile] = useState<IntakeProfile | null>(saved?.done ? saved.profile : null);
  const [dark, setDark] = useState(false);
  const [fail, setFail] = useState(false);
  const persist = async (step: number, next: IntakeProfile, done = false) => {
    if (fail) throw new Error("Synthetic save failure");
    sessionStorage.setItem(key, JSON.stringify({ step, profile: next, done }));
    if (done) setProfile(next);
  };
  return <><aside className="border-b border-border p-3 text-sm"><p>Synthetic local review only. Use fictional answers. Session storage simulates saves; no student account or API is accessed.</p><button className="min-h-11 px-3 underline" onClick={() => { document.documentElement.classList.toggle("dark", !dark); setDark(!dark); }}>{dark ? "Light theme" : "Dark theme"}</button><label><input type="checkbox" checked={fail} onChange={event => setFail(event.target.checked)} /> Simulate save failure</label></aside>{profile ? <main className="mx-auto max-w-6xl p-3 sm:p-6"><CareerExplorer profile={profile} /></main> : <ProgressiveIntake initial={saved?.profile ?? initialIntakeProfile()} initialStep={saved?.step} countries={[{ code: "US", label: "United States", region: "North America", educationSystem: "US high school" }]} onSave={persist} onComplete={next => persist(4, next, true)} />}</>;
}
const root = createRoot(document.getElementById("root")!);
root.render(<Review />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
