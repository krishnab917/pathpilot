import { describe, expect, it } from "vitest";
import { load } from "cheerio";
import {
  publicPages,
  publicOrigin,
  publicPage,
  seoHead,
  sitemap,
  robots,
  structuredData,
  normalizePagePath,
  type PublicPath,
} from "../shared/public-seo";
import { readFileSync } from "node:fs";

describe("public SEO boundaries", () => {
  it("normalizes trailing slashes and queries to one canonical public page", () => {
    for (const path of Object.keys(publicPages)) {
      const alias = `${path === "/" ? "" : path}/?source=referral#introduction`;
      expect(normalizePagePath(alias)).toBe(path);
      expect(publicPage(alias)).toEqual(publicPages[path as PublicPath]);
      expect(load(seoHead(alias))('link[rel="canonical"]').attr("href")).toBe(publicOrigin + path);
    }
  });
  it("uses unique titles and descriptions for real public routes", () => {
    expect(new Set(Object.values(publicPages).map(page => page[0])).size).toBe(
      Object.keys(publicPages).length
    );
    expect(new Set(Object.values(publicPages).map(page => page[1])).size).toBe(
      Object.keys(publicPages).length
    );
  });
  it.each(Object.keys(publicPages) as PublicPath[])(
    "generates consistent metadata and valid JSON-LD for %s",
    path => {
      const $ = load(seoHead(path));
      expect($("title").text()).toBe(publicPages[path][0]);
      expect($('link[rel="canonical"]').attr("href")).toBe(publicOrigin + path);
      expect($('meta[property="og:url"]').attr("content")).toBe(
        publicOrigin + path
      );
      expect(
        JSON.parse($('script[type="application/ld+json"]').text())
      ).toEqual(structuredData(path));
      expect($('meta[name="robots"]').attr("content")).toBe("index,follow");
      expect(seoHead(path, true)).toContain("noindex,follow");
    }
  );
  it.each([
    "/auth",
    "/app",
    "/app/roadmap",
    "/share/private-token",
    "/portfolio/student",
    "/404",
    "/missing",
  ])("never indexes %s", path => {
    expect(publicPage(path)).toBeUndefined();
    expect(seoHead(path)).toContain("noindex,follow");
    expect(seoHead(path)).not.toContain('rel="canonical"');
    expect(sitemap()).not.toContain(`<loc>${publicOrigin}${path}</loc>`);
  });
  it("lists exactly the public registry in the sitemap", () => {
    const $ = load(sitemap(), { xmlMode: true });
    expect(
      $("loc")
        .map((_, node) => $(node).text())
        .get()
    ).toEqual(Object.keys(publicPages).map(path => publicOrigin + path));
  });
  it("preserves wildcard crawler policy without adding a GPTBot policy", () => {
    expect(robots()).toContain("User-agent: *\nAllow: /");
    expect(robots()).not.toContain("GPTBot");
    expect(robots()).toContain(`Sitemap: ${publicOrigin}/sitemap.xml`);
    expect(robots(true)).toBe("User-agent: *\nDisallow: /\n");
  });
  it("keeps API rewrites ahead of public rendering and maps all public paths", () => {
    const config = JSON.parse(readFileSync("vercel.json", "utf8"));
    expect(config.rewrites[0]).toEqual({
      source: "/api(/.*)?",
      destination: "/api/index",
    });
    for (const path of Object.keys(publicPages)) {
      for (const alias of path === "/" ? [path] : [path, path + "/"]) {
        const route = config.rewrites.find((r: { source: string }) =>
          new RegExp(`^${r.source}$`).test(alias)
        );
        expect(
          alias.replace(new RegExp(`^${route.source}$`), route.destination)
        ).toBe(path === "/" ? "/index.html" : `${path}/index.html`);
      }
    }
  });
});
