// Server-side helpers for rendering a skill's SKILL.md on its page.

// The skill's own text starts at h1; shift its headings down one level so the page keeps a single h1.
export const demote = (html: string) =>
  html.replace(/<(\/?)h([1-5])(?=[\s>])/g, (_, slash: string, n: string) => `<${slash}h${Number(n) + 1}`);

// Plain text of a heading, for the section list (rendered as React text, so escaped again there) and its anchor.
// Tags are removed until none remain, then entities decoded with &amp; last so nothing is unescaped twice.
const decode = (html: string) => {
  let s = html;
  for (let prev = ""; prev !== s; ) { prev = s; s = s.replace(/<[^<>]*>/g, ""); }
  return s.replace(/[<>]/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").trim();
};

// Ids the page itself uses; a heading never takes one of these.
const RESERVED = new Set(["install", "main", "contents", "source", "prompts", "skill-doc", "toc", "site-menu", "search-results"]);
// Prefixes the page and its components build ids from (the install panel's tabs, section headings, Save menus).
const RESERVED_PREFIX = /^(install-|sd-|kd-|save-|site-|search-)/;
export const isReserved = (id: string) => RESERVED.has(id) || RESERVED_PREFIX.test(id);

export type TocItem = { id: string; text: string };

// Gives every h2/h3 in the (already demoted) body a stable id, and returns the h3s (the skill's own sections) as
// a table of contents. Anchors are additive: no text changes.
export function withAnchors(html: string): { html: string; toc: TocItem[] } {
  const used = new Set<string>();
  const toc: TocItem[] = [];
  const out = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level: string, inner: string) => {
    const text = decode(inner);
    const base = text.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "section";
    // A heading that would take a page id (or an id prefix the page builds from) gets "s-" in front.
    const safe = isReserved(base) ? `s-${base}` : base;
    let id = safe;
    for (let n = 2; used.has(id); n++) id = `${safe}-${n}`;
    used.add(id);
    if (level === "3") toc.push({ id, text });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  return { html: out, toc };
}

// Skill descriptions are written for the agent that loads them, and many carry trigger rules ("Use only when the
// user explicitly invokes /keen", "Also trigger when…"). Those make a poor page lead. describe() sorts the
// description's sentences, keeping every one and their order within each group:
//   lead   the first sentence written for a person (a short one takes the next with it),
//   more   the rest of those sentences,
//   agent  the trigger rules, shown on the page behind a disclosure.
// When no sentence fits as a lead, lead is empty and the page shows a neutral line instead.
const SENTENCE = /(?<=[.!?])\s+(?=[A-Z/"'(`])/;
const ABBR = /\b(e\.g|i\.e|vs|etc|cf|approx|incl)\.$/i;
const AGENT = [
  /^(also )?use (this skill )?(only )?(when|whenever|if)\b[^.]*\b(the user|explicitly|invokes?|invoked)\b/i,
  /^(only use|use only)\b/i,
  /^(also )?when the user\b/i,
  /^(also )?trigger(s|ed)?\b/i,
  /\bmust not activate\b/i,
  /^only runs when explicitly invoked\b/i,
  /^called by\b/i,
  /^(never|don't|do not) (use|invoke|trigger)\b/i,
];
const CROSSREF = /^for [^.]*,\s*(see|use)\b/i;
export const isAgentSentence = (x: string) => AGENT.some((r) => r.test(x.trim()));

function sentences(d: string): string[] {
  const out: string[] = [];
  for (const part of d.split(SENTENCE)) {
    // Rejoin a split made after an abbreviation ("e.g. React").
    if (out.length && ABBR.test(out[out.length - 1])) out[out.length - 1] += ` ${part}`;
    else out.push(part);
  }
  return out;
}

export type Described = { lead: string; more: string; agent: string };

export function describe(d: string): Described {
  const all = sentences(d.trim());
  const agent = all.filter(isAgentSentence);
  const human = all.filter((x) => !isAgentSentence(x));
  let i = human.findIndex((x) => !CROSSREF.test(x));
  if (i < 0) return { lead: "", more: human.join(" "), agent: agent.join(" ") };
  let lead = human[i];
  const rest = human.filter((_, j) => j !== i);
  if (lead.length < 30 && rest[i] && !CROSSREF.test(rest[i])) { lead = `${lead} ${rest[i]}`; rest.splice(i, 1); }
  return { lead, more: rest.join(" "), agent: agent.join(" ") };
}

// Code blocks and tables can scroll sideways; a tab stop lets keyboard users scroll them too (WCAG 2.1.1).
export const scrollersFocusable = (html: string) => html.replace(/<(pre|table)(?=[\s>])/g, '<$1 tabindex="0"');
