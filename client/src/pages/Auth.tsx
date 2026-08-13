import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

type Mode = "sign-in" | "sign-up" | "reset";

export default function Auth() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!loading && isAuthenticated) navigate("/app"); }, [isAuthenticated, loading, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null); setNotice(null); setPending(true);
    try {
      if (mode === "sign-in") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        navigate("/app");
      } else if (mode === "sign-up") {
        const { error: authError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: displayName.trim() } } });
        if (authError) throw authError;
        setNotice("Check your email to confirm your account, then return to sign in.");
      } else {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
        if (authError) throw authError;
        setNotice("If an account exists for that email, a reset link is on its way.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not complete that request. Please try again.");
    } finally { setPending(false); }
  };

  const copy = mode === "sign-in" ? { title: "Welcome back.", description: "Continue building your career path.", action: "Sign in" } : mode === "sign-up" ? { title: "Start your path.", description: "Your profile, plans, and progress stay private to your account.", action: "Create account" } : { title: "Reset your password.", description: "We’ll send a secure reset link to your inbox.", action: "Send reset link" };
  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#e5ebff,transparent_42%),#fcfcfd] px-5 py-10"><section className="surface-panel w-full max-w-md p-7 sm:p-9"><div className="flex items-center justify-between"><Brand />{mode !== "sign-in" && <button className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground" onClick={() => { setMode("sign-in"); setError(null); setNotice(null); }}><ArrowLeft className="size-3.5" />Sign in</button>}</div><h1 className="mt-10 text-3xl font-semibold tracking-[-0.055em]">{copy.title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.description}</p><form className="mt-8 space-y-4" onSubmit={submit}>{mode === "sign-up" && <label className="field-label">Your name<Input className="mt-2 h-11 rounded-xl" value={displayName} onChange={event => setDisplayName(event.target.value)} autoComplete="name" required /></label>}<label className="field-label">Email<Input className="mt-2 h-11 rounded-xl" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required /></label>{mode !== "reset" && <label className="field-label">Password<Input className="mt-2 h-11 rounded-xl" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={8} required /></label>}<Button className="mt-2 h-11 w-full" type="submit" disabled={pending}>{pending ? <Loader2 className="size-4" /> : copy.action}</Button></form>{error && <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</p>}{notice && <p className="mt-4 rounded-xl bg-primary/10 px-3 py-2.5 text-sm text-primary">{notice}</p>}<div className="mt-6 border-t pt-5 text-center text-xs text-muted-foreground">{mode === "sign-in" ? <><button className="font-semibold text-primary" onClick={() => setMode("sign-up")}>Create an account</button><span className="px-2">·</span><button className="font-semibold text-primary" onClick={() => setMode("reset")}>Forgot password?</button></> : <>Already have an account? <button className="font-semibold text-primary" onClick={() => setMode("sign-in")}>Sign in</button></>}<div className="mt-4"><Link href="/" className="hover:text-foreground">Back to PathPilot</Link></div></div></section></main>;
}
