"use client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRoadmapGeneration } from "@/lib/features/roadmap/use-roadmap-generation";
import { useState } from "react";
export function RoadmapScreen() { const [targetCareer, setTargetCareer] = useState(""); const { execute, isPending, error } = useRoadmapGeneration(); return <AppShell title="Roadmap" description="Roadmap generation, validation, and persistence are isolated from this route in the backend roadmap module."><Card><label className="block text-sm font-semibold">Target career<input className="mt-2 block h-10 w-full rounded-xl border border-[#e7e9ee] px-3" value={targetCareer} onChange={event => setTargetCareer(event.target.value)} placeholder="e.g., Product designer" /></label><Button className="mt-5" disabled={targetCareer.trim().length < 2 || isPending} onClick={() => void execute({ targetCareer })}>{isPending ? "Generating…" : "Generate roadmap"}</Button>{error && <p className="mt-4 text-sm text-red-700">{error.message}</p>}</Card></AppShell>; }
