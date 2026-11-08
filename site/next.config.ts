import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

// Old links by entry id (/prompts/A01) keep working: each id redirects to its readable slug.
function idRedirects() {
  const file = path.join(process.cwd(), "content", "generated.json");
  if (!fs.existsSync(file)) return [];
  const { prompts } = JSON.parse(fs.readFileSync(file, "utf8")) as { prompts: { id: string; slug: string }[] };
  return prompts.map((p) => ({ source: `/prompts/${p.id}`, destination: `/prompts/${p.slug}`, permanent: true }));
}

const config: NextConfig = {
  async redirects() {
    return idRedirects();
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
