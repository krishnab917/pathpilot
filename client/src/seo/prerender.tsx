import React from "react";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "@/pages/Home";
import {
  StudentsExperience,
  ParentsExperience,
  CounselorsExperience,
} from "@/pages/AudienceExperience";
import { SchoolsLanding } from "@/pages/AudienceLanding";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Support from "@/pages/Support";
import Accessibility from "@/pages/Accessibility";
import Resources from "@/pages/Resources";
import { publicPage, normalizePagePath } from "@shared/public-seo";
export { publicPages, seoHead, sitemap, robots } from "@shared/public-seo";

const pages: Record<string, React.ComponentType> = {
  "/": Home,
  "/students": StudentsExperience,
  "/parents": ParentsExperience,
  "/counselors": CounselorsExperience,
  "/schools": SchoolsLanding,
  "/privacy": Privacy,
  "/terms": Terms,
  "/support": Support,
  "/accessibility": Accessibility,
};
export function renderPublicPage(path: string) {
  path = normalizePagePath(path);
  if (!publicPage(path)) throw new Error("Cannot prerender a nonpublic route.");
  const Page = pages[path] ?? Resources;
  // Effects/authenticated queries do not run. Only authored public pages are rendered.
  return renderToString(
    <Router ssrPath={path}>
      <ThemeProvider>
        <Page />
      </ThemeProvider>
    </Router>
  );
}
