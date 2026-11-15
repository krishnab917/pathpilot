import { createServer } from "vite";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { load } from "cheerio";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { publicPages, renderPublicPage, seoHead, sitemap, robots } =
    await server.ssrLoadModule("/src/seo/prerender.tsx");
  const base = await readFile("dist/public/index.html", "utf8");
  const manifest = JSON.parse(
    await readFile("dist/public/.vite/manifest.json", "utf8")
  );
  const publicStyles = new Set();
  const visited = new Set();
  function collectStyles(key) {
    if (visited.has(key)) return;
    visited.add(key);
    const entry = manifest[key];
    for (const css of entry?.css ?? []) publicStyles.add(css);
    for (const dependency of entry?.imports ?? []) collectStyles(dependency);
  }
  for (const key of Object.keys(manifest)) {
    if (
      /src\/pages\/(Home|AudienceExperience|AudienceLanding|Resources|Privacy|Terms|Support|Accessibility)\.tsx$/.test(
        key
      )
    )
      collectStyles(key);
  }
  const preview = process.env.VERCEL_ENV === "preview";
  function documentFor(path, markup = "") {
    const $ = load(base);
    $("title, [data-pathpilot-seo]").remove();
    $("head").append(seoHead(path, preview));
    $("html").attr("data-preview", String(preview));
    $("#root").html(markup);
    if (markup)
      for (const css of publicStyles) {
        if (!$(`link[href="/${css}"]`).length)
          $("head").append(`<link rel="stylesheet" href="/${css}">`);
      }
    // The same public content remains readable without JavaScript. React mounts
    // its existing interactive version; this is not a separate crawler page.
    $("#root [style]").each((_, element) => {
      const style = $(element).attr("style") ?? "";
      if (/opacity:\s*0(?=;|$)/.test(style))
        $(element).attr(
          "style",
          style
            .replace(/opacity:\s*0(?=;|$)/g, "opacity:1")
            .replace(/transform:[^;]+;?/g, "")
        );
    });
    $("script[src]").each((_, element) => {
      if (($(element).attr("src") ?? "").includes("%VITE_"))
        $(element).remove();
    });
    return $.html();
  }
  await writeFile("dist/public/app-shell.html", documentFor("/app"));
  await writeFile(
    "dist/public/404.html",
    documentFor(
      "/404",
      '<main class="mx-auto max-w-3xl px-5 py-20"><h1 class="text-3xl font-semibold">Page not found</h1><p class="mt-4">This address does not match a PathPilot page.</p><a class="mt-6 inline-block underline" href="/">Return to PathPilot</a></main>'
    )
  );
  for (const path of Object.keys(publicPages)) {
    const directory = path === "/" ? "dist/public" : `dist/public${path}`;
    await mkdir(directory, { recursive: true });
    await writeFile(
      `${directory}/index.html`,
      documentFor(path, renderPublicPage(path))
    );
  }
  await writeFile("dist/public/sitemap.xml", sitemap());
  await writeFile("dist/public/robots.txt", robots(preview));
  console.log(
    `Prerendered ${Object.keys(publicPages).length} public routes; private routes excluded.`
  );
} finally {
  await server.close();
}
