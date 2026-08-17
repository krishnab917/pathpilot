import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const Home = lazy(() => import("./pages/Home"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Workspace = lazy(() => import("./pages/Workspace"));
const Auth = lazy(() => import("./pages/Auth"));
const SharedPlanningReport = lazy(() => import("./pages/SharedPlanningReport"));
const PublicPortfolio = lazy(() => import("./pages/PublicPortfolio"));

function RouteLoadingFrame() {
  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-background dark:text-foreground"><header className="flex h-14 items-center border-b border-slate-200 bg-card px-5 dark:border-slate-700"><span className="text-sm font-semibold tracking-[-0.03em]">PathPilot</span></header><main className="mx-auto max-w-[1360px] px-5 py-8"><div className="max-w-xl"><p className="eyebrow">PathPilot</p><div className="mt-3 h-8 w-64 bg-slate-200 dark:bg-slate-800" /><div className="mt-3 h-4 w-full max-w-lg bg-slate-100 dark:bg-slate-900" /></div></main></div>;
}

function Router() {
  return <Suspense fallback={<RouteLoadingFrame />}><Switch><Route path="/" component={Home} /><Route path="/auth" component={Auth} /><Route path="/onboarding" component={Onboarding} /><Route path="/share/:token" component={SharedPlanningReport} /><Route path="/portfolio/:handle" component={PublicPortfolio} /><Route path="/app" component={Workspace} /><Route path="/app/:section" component={Workspace} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></Suspense>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster position="top-right" closeButton /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
