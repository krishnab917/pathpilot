import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useSupabaseAuth } from "@/_core/hooks/useSupabaseAuth";

const PASSWORD_MIN_LENGTH = 12;

export default function UpdatePassword() {
  const { session, loading } = useSupabaseAuth();
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setComplete(true);
    } catch {
      setError("We couldn’t update your password. Request a new reset link and try again.");
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#e5ebff,transparent_42%),#fcfcfd] px-5 py-10"><p className="text-sm text-muted-foreground">Checking your secure reset link…</p></main>;
  }

  if (complete) {
    return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#e5ebff,transparent_42%),#fcfcfd] px-5 py-10"><section className="surface-panel w-full max-w-md p-7 sm:p-9"><Brand /><h1 className="mt-10 text-3xl font-semibold tracking-[-0.055em]">Password updated.</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in with your new password to continue building your career path.</p><Button className="mt-8 h-11 w-full" onClick={() => navigate("/auth")}>Go to sign in</Button></section></main>;
  }

  if (!session) {
    return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#e5ebff,transparent_42%),#fcfcfd] px-5 py-10"><section className="surface-panel w-full max-w-md p-7 sm:p-9"><Brand /><h1 className="mt-10 text-3xl font-semibold tracking-[-0.055em]">This reset link is no longer available.</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">It may be invalid or expired. Request a new reset link to choose a password.</p><Button className="mt-8 h-11 w-full" asChild><Link href="/auth">Request a new reset link</Link></Button></section></main>;
  }

  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#e5ebff,transparent_42%),#fcfcfd] px-5 py-10"><section className="surface-panel w-full max-w-md p-7 sm:p-9"><Brand /><h1 className="mt-10 text-3xl font-semibold tracking-[-0.055em]">Choose a new password.</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Use at least {PASSWORD_MIN_LENGTH} characters. This secure page is available only from a valid reset link.</p><form className="mt-8 space-y-4" onSubmit={submit}><label className="field-label">New password<Input className="mt-2 h-11 rounded-xl" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} required /></label><label className="field-label">Confirm new password<Input className="mt-2 h-11 rounded-xl" type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} required /></label><Button className="mt-2 h-11 w-full" type="submit" disabled={pending}>{pending ? <Loader2 className="size-4" /> : "Update password"}</Button></form>{error && <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</p>}</section></main>;
}
