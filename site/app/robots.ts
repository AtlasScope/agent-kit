import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Every crawler is welcome, AI search and training bots included (decided 2026-11-08, ADR 0001).
const AI_BOTS = [
  "OAI-SearchBot", "ChatGPT-User", "GPTBot", "PerplexityBot", "Perplexity-User", "Claude-SearchBot", "Claude-User",
  "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot", "meta-externalagent", "Bingbot", "Googlebot",
];

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/account", "/api/", "/sign-in", "/md/"];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow }, ...AI_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow }))],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
