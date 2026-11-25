import data from "@/content/generated.json";
import { makeSearch, whatOf } from "./search";

export type Prompt = {
  id: string; slug: string; sec: string; group: string; area: string; t: string; p?: string;
  why?: string; ev?: string; skip?: string; avoid?: string; tools?: string; plat?: string; blind?: string;
  aka?: string; src?: string; use?: string; cmd?: string; sub?: string; gnote?: string; best?: string; skipw?: string; note?: string;
  badge?: string; dmode?: string; mode?: string; top?: string; scope?: string; iso?: boolean;
  steps?: [string, string][]; flow?: [string, string, string][]; tags?: string;
  line?: string; when?: string; fresh?: boolean; replacedBy?: string; split?: boolean;
  planSteps?: { label: string; note: string; slug: string | null; kind: "command" | "prompt" | "step"; copy: string | null }[];
  // What Copy gives, composed at content build time by library/copy.mjs (the portable library uses the same code).
  payload: string;
  related: string[]; skills: string[];
};
export type Skill = {
  name: string; kit: string; description: string; typedOnly: boolean; bodyMd: string; bodyHtml: string;
  files: string[]; sourcePath: string; license: string | null; prompts: string[];
  credit: { author: string; repo: string; url: string; commit: string; license: string; change: string | null } | null;
};
export type Kit = { name: string; title: string; description: string; version: string; skills: string[]; readmePath: string };
export type Area = { slug: string; title: string; sec: string; blurb: string | null; prompts: string[] };
export type Fix = { slug: string; title: string; scope: "code" | "database"; prompts: string[] };
export type Section = { id: string; title: string; blurb: string };

const C = data as unknown as {
  sections: Section[]; areas: Area[]; prompts: Prompt[]; skills: Skill[]; kits: Kit[]; fixes: Fix[];
  counts: { prompts: number; skills: number; borrowed: number; kits: number };
};

export const sections = C.sections;
export const areas = C.areas;
export const prompts = C.prompts;
// Entries the library replaced keep their page but leave lists, search and the sitemap.
export const listed = prompts.filter((p) => !p.replacedBy);
export const skills = C.skills;
export const kits = C.kits;
export const fixes = C.fixes;
export const counts = C.counts;

const bySlug = new Map(prompts.map((p) => [p.slug, p]));
const areaBySlug = new Map(areas.map((a) => [a.slug, a]));
const skillByName = new Map(skills.map((s) => [s.name, s]));
const kitByName = new Map(kits.map((k) => [k.name, k]));
const fixBySlug = new Map(fixes.map((f) => [f.slug, f]));

export const getPrompt = (slug: string) => bySlug.get(slug);
export const getPromptById = (id: string) => prompts.find((p) => p.id.toLowerCase() === id.toLowerCase());
export const getArea = (slug: string) => areaBySlug.get(slug);
export const getSkill = (name: string) => skillByName.get(name);
export const getKit = (name: string) => kitByName.get(name);
export const getFix = (slug: string) => fixBySlug.get(slug);
export const sectionOf = (id: string) => sections.find((s) => s.id === id)!;

export const authors = () => {
  const m = new Map<string, { author: string; url: string; skills: string[] }>();
  for (const s of skills) if (s.credit) {
    const a = m.get(s.credit.author) || { author: s.credit.author, url: s.credit.url, skills: [] };
    a.skills.push(s.name); m.set(s.credit.author, a);
  }
  return [...m.values()].sort((a, b) => b.skills.length - a.skills.length);
};

// The text a person copies from a prompt page; shown in full on the page so the two always match.
export const copyText = (p: Prompt) => p.payload;
export const isCommand = (p: Prompt) => p.sec === "ecmd" || p.sec === "dcmd";
export const kindLabel = (p: Prompt) =>
  ({ ecmd: "Command", dcmd: "Command", recipe: "Older recipe", plan: "Recipe", think: "Way of working" } as Record<string, string>)[p.sec] || "Investigation";
// What a card or page says the entry does (the same line search and the MCP server give), and when to reach for it.
export { whatOf };
export const whenOf = (p: Prompt) => {
  const w = (p.when || (p.line ? p.use : "") || "").replace(/^Use it (when )?/i, "").trim();
  return w ? w[0].toUpperCase() + w.slice(1).replace(/([^.!?])$/, "$1.") : "";
};
export const copyLabel = (p: Prompt) => (p.sec === "plan" ? (p.split ? "Copy step 1" : "Copy recipe") : p.steps ? "Copy recipe" : p.sec === "ecmd" ? "Copy command" : "Copy prompt");

export const MODES: Record<string, string> = { read: "Changes nothing", repro: "Adds a test that shows it", change: "Suggests a fix" };
export const TOPO: Record<string, string> = { single: "One session", split: "Look first, then fix in a new session" };

export function skillInstall(s: Skill) {
  return {
    any: `npx skills add AtlasScope/agent-kit --skill ${s.name}`,
    claude: `claude plugin install ${s.kit}@agent-kit`,
  };
}

// Ranked search lives in lib/search.ts so tests can run it on the built content.
const ranked = makeSearch(listed, skills);
export const search = (q: string, limit = 10) => ranked(q, limit);
