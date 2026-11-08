import data from "@/content/generated.json";

export type Prompt = {
  id: string; slug: string; sec: string; group: string; area: string; t: string; p?: string;
  why?: string; ev?: string; skip?: string; avoid?: string; tools?: string; plat?: string; blind?: string;
  aka?: string; use?: string; cmd?: string; sub?: string; gnote?: string; best?: string; skipw?: string; note?: string;
  badge?: string; dmode?: string; mode?: string; top?: string; scope?: string; iso?: boolean;
  steps?: [string, string][]; flow?: [string, string, string][]; tags?: string;
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

// The text a person copies from a prompt page.
export function copyText(p: Prompt) {
  if (p.sec === "ecmd" && p.cmd) return p.cmd;
  return p.p || p.cmd || p.t;
}
export const isCommand = (p: Prompt) => p.sec === "ecmd" || p.sec === "dcmd";
export const kindLabel = (p: Prompt) =>
  ({ ecmd: "Command", dcmd: "Command", recipe: "Recipe", think: "Thinking prompt" } as Record<string, string>)[p.sec] || "Prompt";

export const MODES: Record<string, string> = { read: "Changes nothing", repro: "Adds a test that shows it", change: "Suggests a fix" };
export const TOPO: Record<string, string> = { single: "One session", split: "Look first, then fix in a new session" };

export function skillInstall(s: Skill) {
  return {
    any: `npx skills add AtlasScope/agent-kit --skill ${s.name}`,
    claude: `claude plugin install ${s.kit}@agent-kit`,
  };
}

// Ranked search, the same weights the prompt library page uses: id or command first, then title,
// then other names and tags, then descriptions, then the body.
const lc = (...xs: unknown[]) => xs.flat(2).filter(Boolean).join(" ").toLowerCase();
const STOP = new Set("a an the my our your is are was be to of in on for it its and or with i me we us this that too how what why do does can not no my".split(" "));
const stem = (w: string) => (w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "") : w);
const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
type Doc = { kind: "prompt" | "skill"; ref: string; title: string; summary: string; fields: [string, number][] };
const DOCS: Doc[] = [
  ...prompts.map((e) => ({
    kind: "prompt" as const, ref: e.slug, title: e.t, summary: e.why || e.use || "",
    fields: [
      [lc(e.id), 60], [lc(e.t), 40], [lc(e.aka, e.tags, e.cmd), 25], [lc(e.why, e.use, e.group, e.sub), 10],
      [lc(e.p, e.ev, e.skip, e.avoid, e.tools, (e.steps || []).map((s) => s.join(" "))), 3],
    ] as [string, number][],
  })),
  ...skills.map((s) => ({
    kind: "skill" as const, ref: s.name, title: s.name, summary: s.description,
    fields: [[lc(s.name), 60], [lc(s.name.replace(/-/g, " ")), 40], [lc(s.kit, s.credit?.author), 25], [lc(s.description), 10], [lc(s.bodyMd.slice(0, 1500)), 2]] as [string, number][],
  })),
];
export function search(q: string, limit = 10) {
  const ql = q.toLowerCase().replace(/\s+/g, " ").trim();
  const words = ql.split(" ").filter((w) => w && !STOP.has(w)).map(stem).map((w) => [w, new RegExp("(^|[^a-z0-9])" + escRe(w))] as const);
  if (!words.length) return [];
  const scored = DOCS.map((d, i) => {
    let s = 0, hit = 0;
    if (d.fields[0][0] === ql) s += 1000;
    if (d.fields[1][0] === ql) s += 500; else if (ql.length > 2 && d.fields[1][0].includes(ql)) s += 200;
    for (const [w, start] of words) {
      let best = 0;
      for (const [txt, wt] of d.fields) if (start.test(txt)) best = Math.max(best, wt);
      if (best) { hit++; s += best; }
    }
    return { d, i, s, hit };
  }).filter((x) => x.hit);
  // Matching every word earns a bonus, but a strong title match on most words can still outrank weak body matches.
  const pool = scored.filter((x) => x.hit >= Math.ceil(words.length / 2)).map((x) => ({ ...x, s: x.s + (x.hit === words.length ? 20 : 0) }));
  return pool.sort((a, b) => b.s - a.s || a.i - b.i).slice(0, limit).map(({ d }) => ({ kind: d.kind, ref: d.ref, title: d.title, summary: d.summary }));
}
