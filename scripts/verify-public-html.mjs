import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { load } from "cheerio";

const sitemap = load(await readFile("dist/public/sitemap.xml", "utf8"), {
  xmlMode: true,
});
const urls = sitemap("loc")
  .map((_, node) => sitemap(node).text())
  .get();
const paths = new Set(urls.map(url => new URL(url).pathname));
const preview = process.argv.includes("--preview");
assert.equal(new Set(urls).size, urls.length, "No duplicate sitemap URLs");
const titles = new Set();
const descriptions = new Set();
for (const url of urls) {
  assert.equal(new URL(url).origin, "https://www.pathpilotapp.com");
  assert.equal(new URL(url).search, "");
  assert.equal(new URL(url).hash, "");
  const path = new URL(url).pathname;
  assert.ok(!/^\/(auth|onboarding|app|share|portfolio|dev)(\/|$)/.test(path));
  const $ = load(
    await readFile(`dist/public${path === "/" ? "" : path}/index.html`, "utf8")
  );
  assert.equal($("h1").length, 1, `${path}: one primary heading`);
  assert.ok(
    $("main").text().trim().length > 300,
    `${path}: meaningful raw HTML`
  );
  assert.equal($('link[rel="canonical"]').length, 1);
  assert.equal($('link[rel="canonical"]').attr("href"), url);
  assert.equal($("title").length, 1);
  assert.equal($('meta[name="description"]').length, 1);
  assert.equal(
    $('meta[name="robots"]').attr("content"),
    preview ? "noindex,follow" : "index,follow"
  );
  assert.equal($("html").attr("data-preview"), String(preview));
  assert.equal($('meta[property="og:url"]').attr("content"), url);
  assert.equal(
    $('meta[property="og:title"]').attr("content"),
    $("title").text()
  );
  assert.equal(
    $('meta[name="twitter:description"]').attr("content"),
    $('meta[name="description"]').attr("content")
  );
  titles.add($("title").text());
  descriptions.add($('meta[name="description"]').attr("content"));
  const schema = JSON.parse($('script[type="application/ld+json"]').text());
  assert.equal(schema["@context"], "https://schema.org");
  assert.equal(
    schema["@graph"].find(item => item["@type"] === "WebPage")?.url,
    url
  );
  assert.ok($('link[rel="stylesheet"]').length >= 1);
  assert.ok(!$('script[src*="%VITE_"]').length);
  for (const stylesheet of $('link[rel="stylesheet"]').toArray()) {
    const href = $(stylesheet).attr("href");
    if (href?.startsWith("https://fonts.googleapis.com/")) continue;
    assert.ok(href?.startsWith("/assets/"));
    await readFile(`dist/public${href}`);
  }
  for (const link of $("a[href]").toArray()) {
    const href = $(link).attr("href");
    if (href?.startsWith("/") && !href.startsWith("//")) {
      const target = href.split(/[?#]/)[0];
      assert.ok(
        paths.has(target) || target === "/auth" || target.startsWith("/app"),
        `${path}: unknown link ${href}`
      );
    }
  }
}
assert.equal(titles.size, urls.length, "Distinct titles");
assert.equal(descriptions.size, urls.length, "Distinct descriptions");
const crawlerRules = await readFile("dist/public/robots.txt", "utf8");
assert.ok(
  !crawlerRules.includes("GPTBot"),
  "Existing wildcard training policy unchanged"
);
assert.ok(crawlerRules.includes(preview ? "Disallow: /\n" : "Allow: /\n"));
if (!preview)
  assert.ok(
    crawlerRules.includes("Sitemap: https://www.pathpilotapp.com/sitemap.xml")
  );
const shell = load(await readFile("dist/public/app-shell.html", "utf8"));
assert.equal(shell('meta[name="robots"]').attr("content"), "noindex,follow");
assert.equal(shell('link[rel="canonical"]').length, 0);
assert.equal(shell("#root").text(), "");
const notFound = load(await readFile("dist/public/404.html", "utf8"));
assert.equal(notFound('meta[name="robots"]').attr("content"), "noindex,follow");
assert.equal(notFound('link[rel="canonical"]').length, 0);
assert.equal(notFound("h1").length, 1);
console.log(
  `Verified ${urls.length} public HTML documents: headings, content, metadata, JSON-LD, styles, internal links, and private shell.`
);
