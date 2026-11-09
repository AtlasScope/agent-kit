// Ranked search over prompts and skills: id or command first, then title, then other names and
// tags, then descriptions, then the body. Pure, so tests can run it on content/generated.json.
type SPrompt = { id: string; slug: string; t: string; why?: string; use?: string; aka?: string; tags?: string; cmd?: string; group: string; sub?: string; p?: string; ev?: string; skip?: string; avoid?: string; tools?: string; steps?: [string, string][] };
type SSkill = { name: string; kit: string; description: string; bodyMd: string; credit: { author: string } | null };
const lc = (...xs: unknown[]) => xs.flat(2).filter(Boolean).join(" ").toLowerCase();
const STOP = new Set("a an the my our your is are was be to of in on for it its and or with i me we us this that too how what why do does can not no my".split(" "));
const stem = (w: string) => (w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "") : w);
const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// A query word matches a whole word in the text, allowing common endings, so "app" finds "apps" but not "apple".
const END = "(?:e|s|es|ed|d|ing|er|ers|est|ly|y|ies|ied|ion|ions|al|ity)?";
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
  [/\btests?\b.*\b(pass|passing|green)\b|\bfalse (comfort|confidence)\b/, ["unit-tests-that-give-false-comfort", "what-the-tests-really-prove", "tests-that-cant-fail"]],
];
const BOOST = 150;
type Doc = { kind: "prompt" | "skill"; ref: string; title: string; summary: string; fields: [string, number][] };
export function makeSearch(prompts: SPrompt[], skills: SSkill[]) {
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
return function search(q: string, limit = 10) {
  const ql = q.toLowerCase().replace(/\s+/g, " ").trim();
  const words = ql.split(" ").filter((w) => w && !STOP.has(w)).map(stem).map((w) => [w, wordRe(w)] as const);
  const boost = new Map<string, number>();
  for (const [re, refs] of INTENTS) if (re.test(ql)) refs.forEach((r, n) => boost.set(r, Math.max(boost.get(r) || 0, BOOST - n * 10)));
  if (!words.length && !boost.size) return [];
  const scored = DOCS.map((d, i) => {
    let s = 0, hit = 0;
    if (d.fields[0][0] === ql) s += 1000;
    if (d.fields[1][0] === ql) s += 500; else if (ql.length > 2 && d.fields[1][0].includes(ql)) s += 200;
    for (const [w, start] of words) {
      let best = 0;
      for (const [txt, wt] of d.fields) if (start.test(txt)) best = Math.max(best, wt);
      if (best) { hit++; s += best; }
    }
    const b = boost.get((d.kind === "skill" ? "s:" : "") + d.ref) || 0;
    return { d, i, s: s + b, hit, b };
  }).filter((x) => x.hit || x.b);
  // Matching every word earns a bonus, but a strong title match on most words can still outrank weak body matches.
  const pool = scored.filter((x) => x.b || x.hit >= Math.ceil(words.length / 2)).map((x) => ({ ...x, s: x.s + (x.hit === words.length ? 20 : 0) }));
  return pool.sort((a, b) => b.s - a.s || a.i - b.i).slice(0, limit).map(({ d }) => ({ kind: d.kind, ref: d.ref, title: d.title, summary: d.summary }));
}
}
