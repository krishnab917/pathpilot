import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it, vi } from "vitest";
import DeleteAccount from "../client/src/pages/DeleteAccount";
import { publicPage, seoHead } from "../shared/public-seo";
vi.mock("../client/src/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false }) }));
vi.stubGlobal("React", React);

describe("public account help boundaries", () => {
  it("renders deletion instructions without loading private account data", () => {
    const html = renderToStaticMarkup(React.createElement(Router, { ssrPath: "/delete-account" }, React.createElement(DeleteAccount)));
    expect(html).toContain('href="/app/settings"');
    expect(html).toContain('href="/auth"');
    expect(html).toContain("retention schedules");
    const emails = html.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g) ?? [];
    expect(new Set(emails)).toEqual(new Set(["krishna@k12worx.org", "vedanth@k12worx.org"]));
  });
  it.each(["/contact", "/delete-account"])("keeps account-help route %s out of the indexable public catalog", path => {
    expect(publicPage(path)).toBeUndefined();
    expect(seoHead(path)).toContain("noindex,follow");
  });
});
