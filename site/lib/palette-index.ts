import "server-only";
import { listed, skills, kits, fixes, areas, copyText, copyLabel, kindLabel, whatOf, skillInstall } from "./content";
import { promptDoc, skillDoc } from "./search";
import { INSTALL_MESSAGE, kitInstallMessage } from "./site";
import { STEPS } from "./start";
import { LESSONS } from "./lessons";
import type { Entry } from "./search";

const lc = (...xs: unknown[]) => xs.flat(2).filter(Boolean).join(" ").toLowerCase();

// The site's main pages. `aka` holds the other words people type for them.
const PAGES: { ref: string; title: string; href: string; summary: string; aka: string }[] = [
  { ref: "install", title: "Install Agent Kit", href: "/install", summary: "One message to paste into any agent, or the commands for each agent by hand.", aka: "setup add plugin marketplace npx get started download" },
  { ref: "start", title: "Start", href: "/start", summary: "A step-by-step first project with a coding agent, from nothing to a working app.", aka: "beginner tutorial guide new first time onboarding" },
  { ref: "learn", title: "Learn", href: "/learn", summary: "Five short lessons on asking a coding agent for good work.", aka: "lessons tutorial guide course" },
  { ref: "prompts", title: "Prompts", href: "/prompts", summary: "The prompt library: commands, investigations, recipes and ways of working.", aka: "library browse all" },
  { ref: "skills", title: "Skills", href: "/skills", summary: "Every skill, grouped by kit, with its source and license.", aka: "library browse all" },
  { ref: "kits", title: "Kits", href: "/kits", summary: "The plugins that bundle the skills, each installable on its own.", aka: "plugins bundles packages" },
  { ref: "fix", title: "Fix a problem", href: "/fix", summary: "Pick the symptom you see and get the prompts to try first, in order.", aka: "symptom broken debug troubleshoot" },
  { ref: "collections", title: "Collections", href: "/collections", summary: "Prompts and skills you saved, in your own lists.", aka: "saved starred favorites bookmarks account" },
  { ref: "mcp-setup", title: "Use the library from your agent", href: "/mcp-setup", summary: "Connect the MCP server so your agent can search and fetch prompts itself.", aka: "mcp server connect" },
  { ref: "about", title: "About", href: "/about", summary: "Who makes Agent Kit, where the skills come from, and the credits.", aka: "credits authors license atlasscope" },
];

// Pages, then kits and fixes, then prompts and skills: on a tie the earlier entry wins, so a query that is
// exactly a page's name ("install", "kits") lands on the page.
export function paletteIndex(): Entry[] {
  const out: Entry[] = [];
  for (const p of PAGES) out.push({
    kind: "page", ref: p.ref, title: p.title, summary: p.summary, href: p.href, meta: "Page",
    fields: [[lc(p.ref), 60], [lc(p.title), 40], [lc(p.aka), 25], [lc(p.summary), 10]],
    ...(p.ref === "install" ? { copy: { label: "Copy install message", text: INSTALL_MESSAGE, done: "Install message copied" } } : {}),
  });
  for (const k of kits) out.push({
    kind: "kit", ref: k.name, title: k.title, summary: k.description, href: `/kits/${k.name}`,
    meta: `Kit · v${k.version} · ${k.skills.length} ${k.skills.length === 1 ? "skill" : "skills"}`,
    fields: [[lc(k.name), 60], [lc(k.name.replace(/-/g, " ")), 40], [lc("kit plugin"), 25], [lc(k.description), 10], [lc(k.skills), 3]],
    copy: { label: "Copy install message", text: kitInstallMessage(k.name), done: `${k.name} install message copied` },
  });
  for (const f of fixes) out.push({
    kind: "fix", ref: f.slug, title: f.title, summary: `${f.prompts.length} prompts to try, in order.`, href: `/fix/${f.slug}`,
    meta: f.scope === "code" ? "Fix · In your app" : "Fix · In your database",
    fields: [[lc(f.slug), 60], [lc(f.title), 40], [lc(f.scope === "database" ? "database postgresql postgres" : "app"), 25], [lc("fix problem symptom"), 3]],
  });
  for (const s of STEPS) out.push({
    kind: "guide", ref: `start/${s.slug}`, title: s.title, summary: s.goal, href: `/start/${s.slug}`, meta: "Start guide",
    fields: [[lc(s.slug), 60], [lc(s.title), 40], [lc("start guide"), 10], [lc(s.goal), 10], [lc(s.body), 2]],
  });
  for (const l of LESSONS) out.push({
    kind: "guide", ref: `learn/${l.slug}`, title: l.title, summary: l.idea[0] || "", href: `/learn/${l.slug}`, meta: "Lesson",
    fields: [[lc(l.slug), 60], [lc(l.title), 40], [lc("lesson learn"), 10], [lc(l.idea), 3]],
  });
  for (const a of areas) out.push({
    kind: "area", ref: a.slug, title: a.title, summary: a.blurb || `${a.prompts.length} prompts.`, href: `/prompts/${a.slug}`,
    meta: `Prompt group · ${a.prompts.length} prompts`,
    fields: [[lc(a.slug), 60], [lc(a.title), 40], [lc(""), 25], [lc(a.blurb), 10]],
  });
  for (const p of listed) out.push({
    ...promptDoc(p), summary: whatOf(p), href: `/prompts/${p.slug}`, sec: p.sec,
    meta: [kindLabel(p), p.cmd && p.cmd !== p.t ? p.cmd : p.id].filter(Boolean).join(" · "),
    copy: { label: copyLabel(p), text: copyText(p), done: `${copyLabel(p).replace(/^Copy /, "")[0].toUpperCase()}${copyLabel(p).replace(/^Copy /, "").slice(1)} copied` },
  });
  for (const s of skills) out.push({
    ...skillDoc(s), href: `/skills/${s.name}`, meta: `Skill · ${s.kit}${s.credit ? ` · by ${s.credit.author}` : ""}`,
    copy: { label: "Copy install command", text: skillInstall(s).any, done: "Install command copied" },
  });
  return out;
}
