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

// Code blocks and tables can scroll sideways; a tab stop lets keyboard users scroll them too (WCAG 2.1.1).
export const scrollersFocusable = (html: string) => html.replace(/<(pre|table)(?=[\s>])/g, '<$1 tabindex="0"');
