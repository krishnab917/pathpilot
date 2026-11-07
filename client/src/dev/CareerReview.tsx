import { useState } from "react";
import { createRoot } from "react-dom/client";
import { CareerExplorer } from "../components/CareerExplorer";
import "../index.css";

if (!import.meta.env.DEV) throw new Error("Career review is development-only.");
function Review() {
  const [dark, setDark] = useState(false);
  return <main className="mx-auto max-w-6xl p-3 sm:p-6"><h1 className="text-xl font-semibold">Career Discovery v2 · Local review</h1><p className="my-3 text-sm">Synthetic, empty profile. No authentication, API requests or saved student data.</p><button className="min-h-11 border border-input px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" onClick={() => { document.documentElement.classList.toggle("dark", !dark); setDark(!dark); }}>{dark ? "Light theme" : "Dark theme"}</button><CareerExplorer /></main>;
}
createRoot(document.getElementById("root")!).render(<Review />);
