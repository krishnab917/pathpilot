import { Compass } from "lucide-react";
import { Link } from "wouter";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 text-foreground no-underline" aria-label="PathPilot home">
      <span className="grid size-8 place-items-center rounded-[10px] bg-foreground text-background shadow-sm">
        <Compass className="size-4" strokeWidth={2.4} />
      </span>
      {!compact && <span className="text-[17px] font-semibold tracking-[-0.045em]">PathPilot</span>}
    </Link>
  );
}
