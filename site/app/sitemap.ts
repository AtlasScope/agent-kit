import type { MetadataRoute } from "next";
import { execSync } from "node:child_process";
import { SITE } from "@/lib/site";
import { prompts, areas, skills, kits, fixes } from "@/lib/content";
import { STEPS } from "@/lib/start";
import { LESSONS } from "@/lib/lessons";

// Last-changed dates come from git when the build has history; otherwise the build time.
function gitDate(p: string) {
  try { const d = execSync(`git log -1 --format=%cI -- ${p}`, { cwd: "..", stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); return d ? new Date(d) : undefined; }
  catch { return undefined; }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const lib = gitDate("library/library.json") || now;
  const u = (p: string) => `${SITE.url}${p}`;
  return [
    { url: u("/"), lastModified: now, priority: 1 },
    { url: u("/install"), lastModified: now, priority: 0.9 },
    ...["/prompts", "/skills", "/kits", "/fix"].map((p) => ({ url: u(p), lastModified: lib, priority: 0.8 })),
    { url: u("/start"), lastModified: now, priority: 0.9 },
    ...STEPS.map((s) => ({ url: u(`/start/${s.slug}`), lastModified: now, priority: 0.7 })),
    { url: u("/learn"), lastModified: now, priority: 0.8 },
    ...LESSONS.map((l) => ({ url: u(`/learn/${l.slug}`), lastModified: now, priority: 0.6 })),
    ...fixes.map((f) => ({ url: u(`/fix/${f.slug}`), lastModified: lib, priority: 0.8 })),
    ...kits.map((k) => ({ url: u(`/kits/${k.name}`), lastModified: gitDate(`kits/${k.name}`) || now, priority: 0.7 })),
    ...areas.map((a) => ({ url: u(`/prompts/${a.slug}`), lastModified: lib, priority: 0.6 })),
    ...prompts.map((p) => ({ url: u(`/prompts/${p.slug}`), lastModified: lib, priority: 0.6 })),
    ...skills.map((s) => ({ url: u(`/skills/${s.name}`), lastModified: gitDate(s.sourcePath) || now, priority: 0.6 })),
  ];
}
