// Server-side helpers for rendering a skill's SKILL.md on its page.

// The skill's own text starts at h1; shift its headings down one level so the page keeps a single h1.
export const demote = (html: string) =>
  html.replace(/<(\/?)h([1-5])(?=[\s>])/g, (_, slash: string, n: string) => `<${slash}h${Number(n) + 1}`);

const decode = (s: string) =>
  s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

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

// Splits a description into its first sentence and the rest, keeping every character of the original. A boundary is
// [.!?] then whitespace then a capital, slash, quote or bracket; abbreviations don't count, and a first sentence under
// 30 characters takes the next one with it.
const ABBR = /\b(e\.g|i\.e|vs|etc|cf|approx|incl|e\.x)\.$/i;
export function splitLead(d: string): [string, string] {
  const re = /[.!?](\s+)(?=[A-Z/"(])/g;
  for (let m = re.exec(d); m; m = re.exec(d)) {
    const lead = d.slice(0, m.index + 1);
    if (ABBR.test(lead) || lead.length < 30) continue;
    return [lead, d.slice(m.index + 1 + m[1].length)];
  }
  return [d, ""];
}

// Code blocks and tables can scroll sideways; a tab stop lets keyboard users scroll them too (WCAG 2.1.1).
export const scrollersFocusable = (html: string) => html.replace(/<(pre|table)(?=[\s>])/g, '<$1 tabindex="0"');
