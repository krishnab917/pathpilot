import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { completeGoogleOAuthCallback } from "@/lib/google-auth";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

type CallbackState = "pending" | "failed";

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const [state, setState] = useState<CallbackState>("pending");

  useEffect(() => {
    let active = true;
    void completeGoogleOAuthCallback(supabase.auth).then(result => {
      if (!active) return;
      if (result.ok) navigate(result.next);
      else setState("failed");
    }).catch(() => {
      if (active) setState("failed");
    });
    return () => { active = false; };
  }, [navigate]);

  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#e5ebff,transparent_42%),#fcfcfd] px-5 py-10"><section className="surface-panel w-full max-w-md p-7 text-center sm:p-9"><Brand /><h1 className="mt-10 text-3xl font-semibold tracking-[-0.055em]">{state === "pending" ? "Completing sign-in…" : "Google sign-in couldn’t be completed."}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{state === "pending" ? "Please wait while PathPilot securely establishes your session." : "Please try again, or continue with email if the problem continues."}</p>{state === "pending" ? <Loader2 className="mx-auto mt-6 size-5 animate-spin text-primary" aria-label="Completing sign-in" /> : <Button className="mt-7 w-full" onClick={() => navigate("/auth")}>Back to sign in</Button>}</section></main>;
}
