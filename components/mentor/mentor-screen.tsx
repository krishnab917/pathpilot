import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
export function MentorScreen() { return <AppShell title="Career mentor" description="Mentor orchestration, private context assembly, and provider calls are owned by the independent backend MentorService."><Card><p className="text-sm font-semibold">AI service boundary</p><p className="mt-2 text-sm leading-6 text-[#687082]">This presentation layer never constructs prompts or accesses conversation persistence directly.</p></Card></AppShell>; }
