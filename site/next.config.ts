import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.atlasscope.dev").replace(/\/$/, "");

// Old links by entry id (/prompts/A01) keep working: each id redirects to its readable slug.
function idRedirects() {
  const file = path.join(process.cwd(), "content", "generated.json");
  if (!fs.existsSync(file)) return [];
  const { prompts } = JSON.parse(fs.readFileSync(file, "utf8")) as { prompts: { id: string; slug: string }[] };
  return prompts.map((p) => ({ source: `/prompts/${p.id}`, destination: `/prompts/${p.slug}`, permanent: true }));
}

// Design commands used to be grouped by author; those pages now point at the design commands index.
function retiredAreaRedirects() {
  const file = path.join(process.cwd(), "content", "generated.json");
  if (!fs.existsSync(file)) return [];
  const { retired = [] } = JSON.parse(fs.readFileSync(file, "utf8")) as { retired?: string[] };
  return retired.map((slug) => ({ source: `/prompts/${slug}`, destination: "/prompts#dcmd", permanent: true }));
}

const config: NextConfig = {
  async redirects() {
    // Clerk's production instance only runs on atlasscope.dev, so account pages on *.vercel.app
    // hosts (production alias and previews) send people to the real site.
    const vercelHost = [{ type: "host" as const, value: "(?<sub>.*)\\.vercel\\.app" }];
    const toSite = ["/sign-in/:path*", "/account", "/collections/:path*"].map((source) => ({
      source, has: vercelHost, destination: `${SITE_URL}${source}`, permanent: false,
    }));
    return [...toSite, ...idRedirects(), ...retiredAreaRedirects()];
  },
  // Preview and *.vercel.app hosts serve the same pages as www.atlasscope.dev; keep them out of search results.
  async headers() {
    return [{ source: "/:path*", has: [{ type: "host", value: "(?<sub>.*)\\.vercel\\.app" }], headers: [{ key: "X-Robots-Tag", value: "noindex" }] }];
  },
  async rewrites() {
    // Every page has a markdown twin at the same URL plus .md, for agents and AI search.
    return {
      beforeFiles: [
        { source: "/index.md", destination: "/md/index" },
        { source: "/:section(prompts|skills|kits|fix).md", destination: "/md/:section" },
        { source: "/:section(prompts|skills|kits|fix)/:slug.md", destination: "/md/:section/:slug" },
      ],
    };
  },
};

export default config;
