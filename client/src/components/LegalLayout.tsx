import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft } from "lucide-react";

export function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <header className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5 sm:px-8">
        <Brand />
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="size-4" /> Back to home
          </Button>
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-20 pt-10 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{title}</h1>
        <div className="prose prose-slate mt-10 max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary">
          {children}
        </div>
      </main>

      <footer className="border-t border-border/70 py-10">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Brand compact />
            <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-medium text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
              <Link href="/support" className="hover:text-foreground">Support</Link>
              <Link href="/accessibility" className="hover:text-foreground">Accessibility</Link>
            </nav>
          </div>
          <p className="mt-8 text-center text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} PathPilot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
