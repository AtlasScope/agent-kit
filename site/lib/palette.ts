// What the command palette searches: the same documents and ranking as /api/search (lib/search.ts), plus kits,
// fix pages, prompt groups, the Start and Learn guides and the site's main pages, each with where it goes and
// what its Copy action sends. Pure and free of content imports, so the browser bundle stays small and tests
// can run it with plain Node. lib/palette-index.ts builds the entries on the server.
import { rank, parseQuery, END, type Doc, type Kind } from "./search.ts";

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
