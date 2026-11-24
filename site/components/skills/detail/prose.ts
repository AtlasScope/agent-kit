// Server-side helpers for rendering a skill's SKILL.md on its page.

// The skill's own text starts at h1; shift its headings down one level so the page keeps a single h1.
export const demote = (html: string) =>
  html.replace(/<(\/?)h([1-5])(?=[\s>])/g, (_, slash: string, n: string) => `<${slash}h${Number(n) + 1}`);

const decode = (s: string) =>
  s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

// Ids the page itself uses; a heading never takes one of these.
const RESERVED = new Set(["install", "main", "contents", "source", "prompts", "skill-doc", "toc"]);

export type TocItem = { id: string; text: string };

// Gives every h2/h3 in the (already demoted) body a stable id, and returns the h3s (the skill's own sections) as
// a table of contents. Anchors are additive: no text changes.
export function withAnchors(html: string): { html: string; toc: TocItem[] } {
  const used = new Set(RESERVED);
  const toc: TocItem[] = [];
  const out = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level: string, inner: string) => {
    const text = decode(inner);
    const base = text.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "section";
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    if (level === "3") toc.push({ id, text });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  return { html: out, toc };
}

// Splits a description into its first sentence and the rest, keeping every character of the original.
export function splitLead(d: string): [string, string] {
  const m = d.match(/^([\s\S]+?[.!?])\s+(?=[A-Z/"(])/);
  if (!m || m[1].length < 30) return [d, ""];
  return [m[1], d.slice(m[0].length)];
}

// Code blocks and tables can scroll sideways; a tab stop lets keyboard users scroll them too (WCAG 2.1.1).
export const scrollersFocusable = (html: string) => html.replace(/<(pre|table)(?=[\s>])/g, '<$1 tabindex="0"');
