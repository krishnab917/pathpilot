import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
export function SettingsScreen() { return <AppShell title="Settings" description="Account and integration configuration are handled independently from feature modules."><Card><p className="text-sm font-semibold">Authentication provider</p><p className="mt-2 text-sm text-[#687082]">Supabase Auth configuration is supplied through environment secrets and verified by the FastAPI authentication adapter.</p></Card></AppShell>; }
