import { getPromptById, getSkill } from "./content";
import type { Item } from "./collections";

// One key per library entry. Refs match without regard to case (getPromptById does), so a stored "a01" and "A01"
// are the same prompt: shown once, counted once, and removed together (see setItem in collections.ts).
export const itemKey = (i: Item) => `${i.kind}:${i.ref.toLowerCase()}`;

// Turns stored items into links, once per library entry and with the library's own ref; items whose prompt or
// skill was removed from the library drop out.
export type ResolvedItem = Item & { title: string; href: string; summary: string };
export function resolve(items: Item[]): ResolvedItem[] {
  const seen = new Set<string>();
  return items.flatMap((i): ResolvedItem[] => {
    const key = itemKey(i);
    if (seen.has(key)) return [];
    seen.add(key);
    if (i.kind === "prompt") { const p = getPromptById(i.ref); return p ? [{ kind: i.kind, ref: p.id, title: p.t, href: `/prompts/${p.slug}`, summary: p.why || p.use || "" }] : []; }
    const s = getSkill(i.ref); return s ? [{ kind: i.kind, ref: s.name, title: s.name, href: `/skills/${s.name}`, summary: s.description }] : [];
  });
}
export const installFor = (items: Item[]) => {
  const names = resolve(items).filter((i) => i.kind === "skill").map((i) => i.ref);
  return names.length ? `npx skills add AtlasScope/agent-kit ${names.map((n) => `--skill ${n}`).join(" ")}` : null;
};
