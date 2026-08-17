import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { notify } from "@/lib/notifications";
import { Copy, Link2, Loader2, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

export function PlanningReportShareControls() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [latestLink, setLatestLink] = useState<string | null>(null);
  const shares = trpc.pathpilot.reportShares.list.useQuery();
  const create = trpc.pathpilot.reportShares.create.useMutation({
    onSuccess: result => {
      setLatestLink(`${window.location.origin}/share/${result.token}`);
      setOpen(false);
      utils.pathpilot.reportShares.list.invalidate();
      notify.success("Your seven-day planning report link is ready to copy.");
    },
  });
  const revoke = trpc.pathpilot.reportShares.revoke.useMutation({
    onSuccess: () => {
      setLatestLink(null);
      utils.pathpilot.reportShares.list.invalidate();
      notify.success("The planning report link was revoked.");
    },
  });
  const copy = async () => {
    if (!latestLink) return;
    try {
      await navigator.clipboard.writeText(latestLink);
      notify.success("Share link copied.");
    } catch {
      notify.error("We could not copy the link. Select and copy it manually.");
    }
  };
  const active = shares.data?.filter(share => !share.revokedAt && new Date(share.expiresAt).getTime() > Date.now()) ?? [];
  return <section className="surface-panel mt-4 overflow-hidden"><div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center dark:border-slate-700"><div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 text-primary" /><div><p className="text-sm font-semibold">Private counselor share link</p><p className="text-xs leading-5 text-muted-foreground">Optional, seven-day access to planning counts and focus only. You can revoke it anytime.</p></div></div><AlertDialog open={open} onOpenChange={setOpen}><AlertDialogTrigger asChild><Button size="sm" variant="outline" className="gap-2"><Link2 className="size-3.5" />Create link</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Create a seven-day report link?</AlertDialogTitle><AlertDialogDescription>Anyone with this link can view only your planning counts and current focus for seven days. It does not include goal or project details, links, simulations, mentor messages, behavioral content, predictions, or recommendations. You can revoke it at any time.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={create.isPending}>Cancel</AlertDialogCancel><Button disabled={create.isPending} onClick={() => create.mutate()}>{create.isPending ? <Loader2 className="size-3.5" /> : "Create private link"}</Button></AlertDialogFooter>{create.error && <p role="alert" className="text-xs text-destructive">{create.error.message}</p>}</AlertDialogContent></AlertDialog></div>{latestLink && <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"><p className="text-xs font-medium">Copy this new link now. For security, PathPilot cannot show the token again after you leave this page.</p><div className="mt-2 flex gap-2"><Input className="h-9 font-mono text-xs" readOnly value={latestLink} aria-label="New private planning report link" /><Button size="sm" variant="outline" className="shrink-0 gap-2" onClick={copy}><Copy className="size-3.5" />Copy</Button></div></div>}<div className="divide-y divide-slate-200 dark:divide-slate-700">{shares.isLoading ? <p className="px-4 py-3 text-xs text-muted-foreground">Checking your active report links…</p> : active.length ? active.map(share => <div key={share.id} className="flex items-center justify-between gap-3 px-4 py-3"><div><p className="text-xs font-medium">Active report link</p><p className="mt-0.5 text-xs text-muted-foreground">Expires {new Date(share.expiresAt).toLocaleString()}</p></div><Button size="sm" variant="outline" disabled={revoke.isPending} className="gap-2" onClick={() => revoke.mutate({ id: share.id })}><X className="size-3.5" />Revoke</Button></div>) : <p className="px-4 py-3 text-xs text-muted-foreground">No active share links. Creating a link never shares your report automatically.</p>}</div></section>;
}
