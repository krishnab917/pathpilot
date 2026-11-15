import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PageMetadata } from "./components/PageMetadata";
const Resources = lazy(() => import("./pages/Resources"));

const Home = lazy(() => import("./pages/Home"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Workspace = lazy(() => import("./pages/Workspace"));
const Auth = lazy(() => import("./pages/Auth"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const SharedPlanningReport = lazy(() => import("./pages/SharedPlanningReport"));
const PublicPortfolio = lazy(() => import("./pages/PublicPortfolio"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Support = lazy(() => import("./pages/Support"));
const DeleteAccount = lazy(() => import("./pages/DeleteAccount"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const SchoolsLanding = lazy(() =>
  import("./pages/AudienceLanding").then(module => ({ default: module.SchoolsLanding }))
);
const CounselorsLanding = lazy(() =>
  import("./pages/AudienceExperience").then(module => ({ default: module.CounselorsExperience }))
);
const ParentsLanding = lazy(() =>
  import("./pages/AudienceExperience").then(module => ({ default: module.ParentsExperience }))
);

const StudentsLanding = lazy(() => import("./pages/AudienceExperience").then(module => ({ default: module.StudentsExperience })));

function RouteLoadingFrame() {
  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-background dark:text-foreground"><header className="flex h-14 items-center border-b border-slate-200 bg-card px-5 dark:border-slate-700"><span className="text-sm font-semibold tracking-[-0.03em]">PathPilot</span></header><main className="mx-auto max-w-[1360px] px-5 py-8"><div className="max-w-xl"><p className="eyebrow">PathPilot</p><div className="mt-3 h-8 w-64 bg-slate-200 dark:bg-slate-800" /><div className="mt-3 h-4 w-full max-w-lg bg-slate-100 dark:bg-slate-900" /></div></main></div>;
}

function Router() {
  return (
    <Suspense fallback={<RouteLoadingFrame />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/resources" component={Resources} />
        <Route path="/resources/explore-careers-in-high-school" component={Resources} />
        <Route path="/career-simulations" component={Resources} />
        <Route path="/students" component={StudentsLanding} />
        <Route path="/schools" component={SchoolsLanding} />
        <Route path="/counselors" component={CounselorsLanding} />
        <Route path="/parents" component={ParentsLanding} />
        <Route path="/auth/update-password" component={UpdatePassword} />
        <Route path="/auth" component={Auth} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/support" component={Support} />
        <Route path="/contact" component={Support} />
        <Route path="/delete-account" component={DeleteAccount} />
        <Route path="/accessibility" component={Accessibility} />
        <Route path="/share/:token" component={SharedPlanningReport} />
        <Route path="/portfolio/:handle" component={PublicPortfolio} />
        <Route path="/app" component={Workspace} />
        <Route path="/app/:section" component={Workspace} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><PageMetadata /><Toaster position="top-right" closeButton /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
