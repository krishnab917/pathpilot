/** Public editorial routes only. Never derive this list from authenticated routes. */
export const publicOrigin = "https://www.pathpilotapp.com";
export const publicPages = {
  "/": [
    "PathPilot | Career exploration and college planning",
    "Discover career interests, find opportunities, build a roadmap, and turn projects and goals into meaningful preparation for college.",
  ],
  "/students": [
    "Career exploration for high-school students | PathPilot",
    "Explore possible careers, try representative work, find opportunities, and build projects and practical next steps toward college.",
  ],
  "/parents": [
    "Help your teenager explore careers and college | PathPilot",
    "Understand how interests can become plans, projects, and college preparation. Explore constructive ways to support your student's decisions.",
  ],
  "/counselors": [
    "Career and college-planning conversations | PathPilot",
    "Connect student interests with opportunities, goals, and planning milestones. Explore examples for student-led advising conversations.",
  ],
  "/schools": [
    "Student career exploration for schools | PathPilot",
    "See how PathPilot supports independent career exploration and practical planning alongside existing school guidance.",
  ],
  "/privacy": [
    "Privacy Policy | PathPilot",
    "How PathPilot handles account information, saved planning data, AI processing, and privacy requests.",
  ],
  "/terms": [
    "Terms of Service | PathPilot",
    "Terms for using PathPilot, including user responsibilities, AI guidance, simulations, and third-party services.",
  ],
  "/support": [
    "Support | PathPilot",
    "Get help with PathPilot accounts, career discovery, roadmaps, opportunities, projects, and Mentor. Learn what to include in a support request.",
  ],
  "/accessibility": [
    "Accessibility | PathPilot",
    "PathPilot's accessibility practices, current limitations, and ways to request assistance or report an accessibility issue.",
  ],
  "/resources": [
    "Career exploration resources | PathPilot",
    "Practical, public guides for exploring careers and connecting interests with meaningful next steps in high school.",
  ],
  "/resources/explore-careers-in-high-school": [
    "How to start exploring careers in high school | PathPilot",
    "Compare real work activities, try a small project, and reflect on what you learn. A practical guide for students, parents, and counselors.",
  ],
  "/career-simulations": [
    "What are career simulations? | PathPilot",
    "Explore representative career situations before committing to a direction. Learn what PathPilot simulations can and cannot tell you.",
  ],
} as const;
export type PublicPath = keyof typeof publicPages;
export function normalizePagePath(path: string) {
  return path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
}
export function publicPage(path: string) {
  path = normalizePagePath(path);
  return Object.prototype.hasOwnProperty.call(publicPages, path)
    ? publicPages[path as PublicPath]
    : undefined;
}
export function structuredData(path: PublicPath) {
  const [name, description] = publicPages[path];
  const organization = {
    "@type": "Organization",
    "@id": `${publicOrigin}/#organization`,
    name: "PathPilot",
    url: publicOrigin,
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": `${publicOrigin}/#website`,
        name: "PathPilot",
        url: publicOrigin,
        publisher: { "@id": organization["@id"] },
      },
      {
        "@type": "WebPage",
        "@id": `${publicOrigin}${path}`,
        url: `${publicOrigin}${path}`,
        name,
        description,
        isPartOf: { "@id": `${publicOrigin}/#website` },
      },
      ...(path === "/resources/explore-careers-in-high-school"
        ? [
            {
              "@type": "Article",
              "@id": `${publicOrigin}${path}#article`,
              headline: "How to start exploring careers in high school",
              description,
              mainEntityOfPage: `${publicOrigin}${path}`,
              datePublished: "2026-10-12",
              dateModified: "2026-10-12",
              author: { "@id": organization["@id"] },
              publisher: { "@id": organization["@id"] },
            },
          ]
        : []),
    ],
  };
}
export function sitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(
    publicPages
  )
    .map(path => `<url><loc>${publicOrigin}${path}</loc></url>`)
    .join("\n")}</urlset>`;
}
export function robots(preview = false) {
  // No separate GPTBot policy: preserve the existing wildcard training-crawler policy.
  return preview
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\nDisallow: /auth\nDisallow: /onboarding\nDisallow: /app\nDisallow: /share/\nDisallow: /portfolio/\nDisallow: /dev\n\nSitemap: ${publicOrigin}/sitemap.xml\n`;
}
const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
export function seoHead(path: string, preview = false) {
  path = normalizePagePath(path);
  const page = publicPage(path);
  const title = page?.[0] ?? "PathPilot";
  const tags = [
    `<title data-pathpilot-seo>${escape(title)}</title>`,
    `<meta data-pathpilot-seo name="robots" content="${page && !preview ? "index,follow" : "noindex,follow"}">`,
  ];
  if (page) {
    tags.push(
      `<meta data-pathpilot-seo name="description" content="${escape(page[1])}">`,
      `<link data-pathpilot-seo rel="canonical" href="${publicOrigin}${path}">`
    );
    for (const [property, content] of Object.entries({
      "og:type": path === "/resources/explore-careers-in-high-school" ? "article" : "website",
      "og:site_name": "PathPilot",
      "og:title": title,
      "og:description": page[1],
      "og:url": `${publicOrigin}${path}`,
    }))
      tags.push(
        `<meta data-pathpilot-seo property="${property}" content="${escape(content)}">`
      );
    for (const [name, content] of Object.entries({
      "twitter:card": "summary",
      "twitter:title": title,
      "twitter:description": page[1],
    }))
      tags.push(
        `<meta data-pathpilot-seo name="${name}" content="${escape(content)}">`
      );
    tags.push(
      `<script data-pathpilot-seo type="application/ld+json">${JSON.stringify(structuredData(path as PublicPath)).replace(/</g, "\\u003c")}</script>`
    );
  }
  return tags.join("\n");
}
