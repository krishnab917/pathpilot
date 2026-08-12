"use client";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { onboardingSteps } from "@/lib/features/onboarding/steps";
export function OnboardingScreen() { return <AppShell title="Set your starting point" description="The profile flow keeps its required sequence while its persistence is isolated behind the student profile API."><Card><ol className="space-y-4">{onboardingSteps.map((step, index) => <li key={step.id} className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-full bg-[#3456c7] text-xs font-semibold text-white">{index + 1}</span><span className="text-sm font-medium">{step.label}</span></li>)}</ol></Card></AppShell>; }
