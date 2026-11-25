import { getPromptById, getSkill, whatOf } from "./content";
import { skillLead } from "./search";
import type { Item } from "./collections";

// One key per library entry. Prompt ids match without regard to case (getPromptById does), so a stored "a01" and
// "A01" are the same prompt: shown once, counted once, and removed together (see setItem in collections.ts).
// Skill names match exactly (getSkill does), so their refs are left as they are.
export const itemKey = (i: Item) => `${i.kind}:${i.kind === "prompt" ? i.ref.toLowerCase() : i.ref}`;

// Turns stored items into links, once per library entry and with the library's own ref; items whose prompt or
// skill was removed from the library drop out.
export type ResolvedItem = Item & { title: string; href: string; summary: string };
export function resolve(items: Item[]): ResolvedItem[] {
  const seen = new Set<string>();
  return items.flatMap((i): ResolvedItem[] => {
    let r: ResolvedItem | undefined;
    if (i.kind === "prompt") {
      const p = getPromptById(i.ref);
      if (p) r = { kind: "prompt", ref: p.id, title: p.t, href: `/prompts/${p.slug}`, summary: whatOf(p) };
    } else {
      const s = getSkill(i.ref);
      if (s) r = { kind: "skill", ref: s.name, title: s.name, href: `/skills/${s.name}`, summary: skillLead(s) };
    }
    // Only an entry that is in the library claims its key, so a stale spelling never hides a valid one.
    if (!r || seen.has(itemKey(r))) return [];
    seen.add(itemKey(r));
    return [r];
  });
}
export const installFor = (items: Item[]) => {
  const names = resolve(items).filter((i) => i.kind === "skill").map((i) => i.ref);
  return names.length ? `npx skills add AtlasScope/agent-kit ${names.map((n) => `--skill ${n}`).join(" ")}` : null;
};
