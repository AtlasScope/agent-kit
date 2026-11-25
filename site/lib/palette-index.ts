import "server-only";
import { createHash } from "node:crypto";
import { listed, skills, kits, fixes, areas, copyText, copyLabel, kindLabel, skillInstall } from "./content";
import { promptDoc, skillDoc } from "./search";
import { INSTALL_MESSAGE, kitInstallMessage, authEnabled } from "./site";
import { STEPS } from "./start";
import { LESSONS } from "./lessons";
import type { Entry } from "./search";

const lc = (...xs: unknown[]) => xs.flat(2).filter(Boolean).join(" ").toLowerCase();

// The site's main pages. `aka` holds the other words people type for them.
const PAGES: { ref: string; title: string; href: string; summary: string; aka: string }[] = [
  { ref: "install", title: "Install Agent Kit", href: "/install", summary: "One message to paste into any agent, or the commands for each agent by hand.", aka: "setup add plugin marketplace npx get started download" },
  { ref: "start", title: "Start", href: "/start", summary: "A step-by-step first project with a coding agent, from nothing to a working app.", aka: "beginner tutorial guide new first time onboarding" },
  { ref: "learn", title: "Learn", href: "/learn", summary: "Short lessons on asking a coding agent for good work.", aka: "lessons tutorial guide course" },
  { ref: "prompts", title: "Prompts", href: "/prompts", summary: "The prompt library: commands, investigations, recipes and ways of working.", aka: "library browse all" },
  { ref: "skills", title: "Skills", href: "/skills", summary: "Every skill, grouped by kit, with its source and license.", aka: "library browse all" },
  { ref: "kits", title: "Kits", href: "/kits", summary: "The plugins that bundle the skills, each installable on its own.", aka: "plugins bundles packages" },
  { ref: "fix", title: "Fix a problem", href: "/fix", summary: "Pick the symptom you see and get the prompts to try first, in order.", aka: "symptom broken debug troubleshoot" },
  // Saved lists live on the account page, which exists only when sign-in is configured (see the filter below).
  { ref: "collections", title: "Collections", href: "/account", summary: "Prompts and skills you saved, in your own lists.", aka: "saved starred favorites bookmarks account" },
  { ref: "mcp-setup", title: "Use the library from your agent", href: "/mcp-setup", summary: "Connect the MCP server so your agent can search and fetch prompts itself.", aka: "mcp server connect" },
  { ref: "about", title: "About", href: "/about", summary: "Who makes Agent Kit, where the skills come from, and the credits.", aka: "credits authors license atlasscope" },
];

// Pages, then kits and fixes, then prompts and skills: on a tie the earlier entry wins, so a query that is
// exactly a page's name ("install", "kits") lands on the page. Each entry carries its full Copy text here; the
// index the browser downloads leaves the text out (paletteIndex), and each text is served on its own at
// /search-copy/<kind>/<ref> (paletteCopy), so a phone pays for one prompt's text only when it previews or copies it.
let built: Entry[] | null = null;
let texts: Map<string, string> | null = null;
function entries(): Entry[] {
  if (built) return built;
  const out: Entry[] = [];
  for (const p of PAGES.filter((x) => x.ref !== "collections" || authEnabled())) out.push({
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
    ...promptDoc(p), href: `/prompts/${p.slug}`, sec: p.sec,
    meta: [kindLabel(p), p.cmd && p.cmd !== p.t ? p.cmd : p.id].filter(Boolean).join(" · "),
    copy: { label: copyLabel(p), text: copyText(p), done: `${copyLabel(p).replace(/^Copy /, "")[0].toUpperCase()}${copyLabel(p).replace(/^Copy /, "").slice(1)} copied` },
  });
  for (const s of skills) out.push({
    ...skillDoc(s), href: `/skills/${s.name}`, meta: `Skill · ${s.kit}${s.credit ? ` · by ${s.credit.author}` : ""}`,
    copy: { label: "Copy install command", text: skillInstall(s).any, done: "Install command copied" },
  });
  return (built = out);
}

export function paletteIndex(): Entry[] {
  // `v` is a short hash of the text. It is only a cache key (the route ignores it): a changed text gets a new URL,
  // so a browser never serves a text it cached before the change.
  return entries().map((e) => (e.copy?.text !== undefined
    ? { ...e, copy: { label: e.copy.label, done: e.copy.done, v: createHash("sha1").update(e.copy.text).digest("hex").slice(0, 8) } } : e));
}

// The index with its texts, as builds before v2 fetched it from /search-index.json. Kept for tabs still running
// such a build; remove once a week has passed since v2 shipped (the index's stale-while-revalidate window).
export const paletteIndexWithTexts = (): Entry[] => entries();

export const paletteCopies = (): { kind: string; ref: string }[] => entries().filter((e) => e.copy).map((e) => ({ kind: e.kind, ref: e.ref }));
export function paletteCopy(kind: string, ref: string): string | undefined {
  texts ??= new Map(entries().flatMap((e) => (e.copy?.text !== undefined ? [[`${e.kind}:${e.ref}`, e.copy.text] as const] : [])));
  return texts.get(`${kind}:${ref}`);
}
