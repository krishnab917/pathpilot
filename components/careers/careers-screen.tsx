"use client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCareerAnalysis } from "@/lib/features/careers/use-career-analysis";
export function CareersScreen() { const { execute, isPending, error } = useCareerAnalysis(); return <AppShell title="Career discovery" description="The careers UI requests a typed result from the FastAPI career service; it does not contain AI prompts or matching rules."><Card><p className="text-sm text-[#687082]">Run a profile-based analysis to receive five validated career matches.</p><Button className="mt-5" onClick={() => void execute(undefined)} disabled={isPending}>{isPending ? "Analyzing…" : "Analyze profile"}</Button>{error && <p className="mt-4 text-sm text-red-700">{error.message}</p>}</Card></AppShell>; }
