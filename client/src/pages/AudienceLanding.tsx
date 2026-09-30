import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { audienceLandingCopy, type AudienceLandingContent } from "./audience-landing-copy";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

function audienceAction(href: string, label: string) {
  const children = <>{label}<ArrowRight aria-hidden="true" className="ml-2 size-4 shrink-0" /></>;
  return href.startsWith("/") ? <Link href={href}>{children}</Link> : <a href={href}>{children}</a>;
}

function AudienceLandingPage({ content }: { content: AudienceLandingContent }) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `PathPilot | ${content.audience}`;
    let description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.getAttribute("content");
    const createdDescription = !description;
    if (!description) {
      description = document.createElement("meta");
      description.setAttribute("name", "description");
      document.head.appendChild(description);
    }
    description.setAttribute("content", content.metaDescription);
    return () => {
      document.title = previousTitle;
      if (createdDescription) description.remove();
      else if (previousDescription !== null && previousDescription !== undefined) description.setAttribute("content", previousDescription);
      else description.removeAttribute("content");
    };
  }, [content]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#fcfcfd]">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Brand />
        <div className="flex items-center gap-3">
          <Link href="/" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex">For students</Link>
          <Button variant="ghost" className="rounded-xl" asChild><Link href="/auth">Sign in</Link></Button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="eyebrow">{content.audience}</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.075em] sm:text-6xl">{content.title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">{content.description}</p>
          <Button size="lg" className="mt-8 h-auto min-h-12 max-w-full whitespace-normal rounded-xl px-6 py-3" asChild>{audienceAction(content.ctaHref, content.cta)}</Button>
        </div>
      </section>

      <section id="how-it-works" tabIndex={-1} className="border-y border-border/70 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl space-y-12 px-5 sm:px-8">
          {content.sections.map((section, index) => (
            <article key={section.eyebrow} className={index > 0 ? "border-t border-slate-200 pt-10" : ""}>
              <div className="max-w-2xl">
                <p className="eyebrow">{section.eyebrow}</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] sm:text-4xl">{section.title}</h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">{section.description}</p>
              </div>
              {section.points && (
                <dl className="mt-8 grid border border-slate-200 bg-white sm:grid-cols-2">
                  {section.points.map((point, pointIndex) => (
                    <div key={point.title} className={`border-slate-200 p-5 sm:p-6 ${pointIndex > 0 ? "border-t" : ""} ${pointIndex === 1 ? "sm:border-t-0" : ""} ${pointIndex % 2 === 1 ? "sm:border-l" : ""}`}>
                      <dt className="text-sm font-semibold">{point.title}</dt>
                      <dd className="mt-2 text-sm leading-6 text-muted-foreground">{point.description}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="border border-slate-200 bg-white px-6 py-8 sm:px-10 sm:py-10">
          <div className="max-w-2xl">
            <p className="eyebrow">A next step, when you are ready</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">{content.followUp.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{content.followUp.description}</p>
            <Button className="mt-6 h-auto min-h-10 max-w-full whitespace-normal rounded-xl px-4 py-2" asChild>{audienceAction(content.followUp.href, content.followUp.cta)}</Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 sm:flex-row sm:px-8">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <Brand compact />
            <p className="text-xs text-muted-foreground">Discover your career and build the path to reach it.</p>
          </div>
          <nav aria-label="Audience pages" className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs font-medium text-muted-foreground">
            <Link href="/schools" className="hover:text-foreground">Schools</Link>
            <Link href="/counselors" className="hover:text-foreground">Counselors</Link>
            <Link href="/parents" className="hover:text-foreground">Parents</Link>
          </nav>
          <nav aria-label="Policies and support" className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs font-medium text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/support" className="hover:text-foreground">Support</Link>
            <Link href="/accessibility" className="hover:text-foreground">Accessibility</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

export function SchoolsLanding() { return <AudienceLandingPage content={audienceLandingCopy.schools} />; }
export function CounselorsLanding() { return <AudienceLandingPage content={audienceLandingCopy.counselors} />; }
export function ParentsLanding() { return <AudienceLandingPage content={audienceLandingCopy.parents} />; }
