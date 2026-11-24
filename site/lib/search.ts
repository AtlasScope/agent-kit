// Ranked search over prompts and skills: id or command first, then title, then other names and
// tags, then descriptions, then the body. Pure, so tests can run it on content/generated.json.
type SPrompt = { id: string; slug: string; t: string; why?: string; use?: string; aka?: string; tags?: string; cmd?: string; group: string; sub?: string; p?: string; ev?: string; skip?: string; avoid?: string; tools?: string; steps?: [string, string][] };
type SSkill = { name: string; kit: string; description: string; bodyMd: string; credit: { author: string } | null };
const lc = (...xs: unknown[]) => xs.flat(2).filter(Boolean).join(" ").toLowerCase();
const STOP = new Set("a an the my our your is are was be to of in on for it its and or with i me we us this that too how what why do does can not no my".split(" "));
const stem = (w: string) => (w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "") : w);
const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// A query word matches a whole word in the text, allowing common endings, so "app" finds "apps" but not "apple".
export const END = "(?:e|s|es|ed|d|ing|er|ers|est|ly|y|ies|ied|ion|ions|al|ity)?";
const wordRe = (w: string) => new RegExp("(^|[^a-z0-9])" + escRe(w) + END + "(?=$|[^a-z0-9])");

// Synonyms for jobs people describe in their own words. When a query matches, these results get a boost
// in the order listed, so a plain-language or vague query lands on the right starting point or router.
// Checked by tests/search.test.mjs; add a benchmark query before adding a row.
export const INTENTS: [RegExp, string[]][] = [
  [/\b(cramped|phone|mobile|small screen)\b/, ["feels-right-on-a-phone", "impeccable-adapt"]],
  [/\b(plan|spec)\b|\bnew feature\b/, ["spec-without-the-interview", "grill-me"]],
  [/\b(ai|slop|generic|ai-generated)\b/, ["it-looks-ai-generated", "write-prose-that-doesnt-sound-like-ai", "s:stop-slop"]],
  [/\b(doesn.?t|does not|isn.?t|won.?t) work\b|\bbroken\b|\bbug(s|gy)?\b|^fix$/, ["engineer", "diagnosing-bugs"]],
  [/^(make it|improve it) better$|^improve$/, ["design", "engineer", "this-page-kind-of-stinks"]],
  [/^help$|where (do|should) i start|not sure (what|where)/, ["engineer", "design", "recommend"]],
  [/\bdata\b.*\b(off|wrong|weird|bad)\b|\b(off|wrong|weird|bad)\b.*\bdata\b/, ["is-the-data-actually-right", "find-data-that-is-internally-consistent-but-wrong"]],
  [/\b(fast|faster|slow|slower|speed|performance|laggy)\b/, ["slowest-journeys-end-to-end", "one-slow-step-that-blocks-the-rest", "impeccable-optimize"]],
  [/\b(leave|leaving|churn|drift|drop off|retention)\b/, ["people-sign-up-and-drift-away", "improve-retention"]],
  [/\b(bad|ugly|stinks?|meh)\b.*\b(design|page|screen|ui)\b|\b(design|page|screen|ui)\b.*\b(bad|ugly|stinks?)\b/, ["this-page-kind-of-stinks", "design", "impeccable-critique"]],
  [/accessib|a11y|screen reader|contrast/, ["web-design-guidelines", "impeccable-audit"]],
  [/\b(error messages?|wording|copy|labels?|microcopy)\b|\bbuttons?\b.*\bclear/, ["ux-writing", "s:ux-writing", "impeccable-clarify"]],
  [/\b(pull request|pr|diff)\b|\breview (my|the|this) (code|change|changes)\b/, ["code-review", "differential-review-diff-review"]],
  [/\b(deploy|release|production|prod)\b.*\b(broke|broken|down|failed|failing)\b|\b(broke|broken)\b.*\b(production|prod)\b/, ["ship-or-recover-safely", "why-production-might-not-match-main"]],
  [/\b(complicated|complex|messy|tangled|spaghetti|hard to change)\b/, ["improve-codebase-architecture", "s:improve-codebase-architecture", "layers-that-dont-earn-their-keep"]],
  [/\b(database|db|postgres\w*)\b.*\b(expensive|costs?|bill)\b|\b(expensive|costs?|bill)\b.*\b(database|db|postgres\w*)\b/, ["find-the-true-sources-of-database-waste", "reduce-postgresql-resource-cost-rdbr04"]],
  [/\b(duplicated?|duplicates|duplication)\b.*\b(data|records?|rows?)\b|\bsame (truth|data|record)\b/, ["two-systems-that-disagree", "find-where-records-silently-change-identity"]],
  [/\btests?\b.*\b(pass|passing|green)\b|\bfalse (comfort|confidence)\b/, ["unit-tests-that-give-false-comfort", "what-the-tests-really-prove", "tests-that-cant-fail"]],
];
const BOOST = 150;

// A searchable document. `fields` are lowercased text with a weight each; fields[0] is the id (an exact match
// wins outright) and fields[1] the title. The command palette ships these to the browser, so ranking there
// is the same code as /api/search and the MCP server.
export type Kind = "prompt" | "skill" | "kit" | "fix" | "area" | "guide" | "page";
export type Doc = { kind: Kind; ref: string; title: string; summary: string; fields: [string, number][] };

export const promptDoc = (e: SPrompt): Doc => ({
  kind: "prompt", ref: e.slug, title: e.t, summary: e.why || e.use || "",
  fields: [
    [lc(e.id), 60], [lc(e.t), 40], [lc(e.aka, e.tags, e.cmd), 25], [lc(e.why, e.use, e.group, e.sub), 10],
    [lc(e.p, e.ev, e.skip, e.avoid, e.tools, (e.steps || []).map((s) => s.join(" "))), 3],
  ],
});
export const skillDoc = (s: SSkill): Doc => ({
  kind: "skill", ref: s.name, title: s.name, summary: s.description,
  fields: [[lc(s.name), 60], [lc(s.name.replace(/-/g, " ")), 40], [lc(s.kit, s.credit?.author), 25], [lc(s.description), 10], [lc(s.bodyMd.slice(0, 1500)), 2]],
});

// Turns a query into what rank() needs. Exported so the palette can highlight the same words it ranked on.
export function parseQuery(q: string) {
  const ql = q.toLowerCase().replace(/\s+/g, " ").trim();
  const words = ql.split(" ").filter((w) => w && !STOP.has(w)).map(stem);
  return { ql, words };
}

export function rank<D extends Doc>(docs: D[], q: string, limit = 10): D[] {
  const { ql, words: ws } = parseQuery(q);
  const words = ws.map((w) => [w, wordRe(w)] as const);
  const boost = new Map<string, number>();
  for (const [re, refs] of INTENTS) if (re.test(ql)) refs.forEach((r, n) => boost.set(r, Math.max(boost.get(r) || 0, BOOST - n * 10)));
  if (!words.length && !boost.size) return [];
  const scored = docs.map((d, i) => {
    let s = 0, hit = 0;
    if (d.fields[0][0] === ql) s += 1000;
    if (d.fields[1][0] === ql) s += 500; else if (ql.length > 2 && d.fields[1][0].includes(ql)) s += 200;
    for (const [w, start] of words) {
      let best = 0;
      for (const [txt, wt] of d.fields) if (start.test(txt)) best = Math.max(best, wt);
      if (best) { hit++; s += best; }
    }
    const b = d.kind === "prompt" || d.kind === "skill" ? boost.get((d.kind === "skill" ? "s:" : "") + d.ref) || 0 : 0;
    return { d, i, s: s + b, hit, b };
  }).filter((x) => x.hit || x.b);
  // Matching every word earns a bonus, but a strong title match on most words can still outrank weak body matches.
  const pool = scored.filter((x) => x.b || x.hit >= Math.ceil(words.length / 2)).map((x) => ({ ...x, s: x.s + (x.hit === words.length ? 20 : 0) }));
  return pool.sort((a, b) => b.s - a.s || a.i - b.i).slice(0, limit).map(({ d }) => d);
}

export function makeSearch(prompts: SPrompt[], skills: SSkill[]) {
  const DOCS: Doc[] = [...prompts.map(promptDoc), ...skills.map(skillDoc)];
  return (q: string, limit = 10) =>
    rank(DOCS, q, limit).map((d) => ({ kind: d.kind as "prompt" | "skill", ref: d.ref, title: d.title, summary: d.summary }));
}

// Command palette helpers: entries with where they go and what Copy sends, scopes, title marks and the Recent
// list. They live here, not in their own module, so Node tests and the browser bundle import one file.
// lib/palette-index.ts builds the entries on the server.
export type Entry = Doc & {
  href: string;
  meta: string;                 // one short line under the title: kind, id, kit, version
  sec?: string;                 // prompt section, for its color
  copy?: { label: string; text: string; done: string };
};
export type Scope = "all" | "prompt" | "skill" | "kit" | "fix";
export const SCOPES: [Scope, string][] = [["all", "All"], ["prompt", "Prompts"], ["skill", "Skills"], ["kit", "Kits"], ["fix", "Fix"]];
const IN_SCOPE: Record<Scope, Kind[] | null> = { all: null, prompt: ["prompt", "area"], skill: ["skill"], kit: ["kit"], fix: ["fix"] };
export const KIND_LABEL: Record<Kind, string> = { prompt: "Prompt", skill: "Skill", kit: "Kit", fix: "Fix", area: "Group", guide: "Guide", page: "Page" };

export function find(entries: Entry[], q: string, scope: Scope = "all", limit = 24): Entry[] {
  const kinds = IN_SCOPE[scope];
  return rank(kinds ? entries.filter((e) => kinds.includes(e.kind)) : entries, q, limit);
}

// Ranges of `text` that match a query word the way ranking does (a whole word, allowing common endings), for
// marking in a result title.
export function marks(text: string, q: string): [number, number][] {
  const { words } = parseQuery(q);
  if (!words.length) return [];
  const lower = text.toLowerCase(), out: [number, number][] = [];
  for (const w of words) {
    const re = new RegExp("(^|[^a-z0-9])(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + END + ")(?=$|[^a-z0-9])", "g");
    for (let m; (m = re.exec(lower)); ) { const s = m.index + m[1].length; out.push([s, s + m[2].length]); if (re.lastIndex === m.index) re.lastIndex++; }
  }
  out.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of out) { const last = merged[merged.length - 1]; if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else merged.push([...r]); }
  return merged;
}

// Recently opened or copied entries, newest first, kept in this browser only.
export const RECENT_KEY = "agent-kit:recent";
export const RECENT_MAX = 6;
export type Recent = { kind: Kind; ref: string };
export const keyOf = (e: { kind: Kind; ref: string }) => `${e.kind}:${e.ref}`;
export function pushRecent(list: Recent[], e: Recent): Recent[] {
  return [{ kind: e.kind, ref: e.ref }, ...list.filter((r) => keyOf(r) !== keyOf(e))].slice(0, RECENT_MAX);
}
export function readRecent(): Recent[] {
  try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); return Array.isArray(v) ? v.filter((r) => r && r.kind && r.ref).slice(0, RECENT_MAX) : []; } catch { return []; }
}
export function writeRecent(list: Recent[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch {}
}
