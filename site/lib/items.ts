import { getPromptById, getSkill } from "./content";
import type { Item } from "./collections";

// Turns stored items into links; items whose prompt or skill was removed from the library drop out.
export function resolve(items: Item[]) {
  return items.flatMap((i) => {
    if (i.kind === "prompt") { const p = getPromptById(i.ref); return p ? [{ ...i, title: p.t, href: `/prompts/${p.slug}`, summary: p.why || p.use || "" }] : []; }
    const s = getSkill(i.ref); return s ? [{ ...i, title: s.name, href: `/skills/${s.name}`, summary: s.description }] : [];
  });
}
export const installFor = (items: Item[]) => {
  const names = items.filter((i) => i.kind === "skill" && getSkill(i.ref)).map((i) => i.ref);
  return names.length ? `npx skills add AtlasScope/agent-kit ${names.map((n) => `--skill ${n}`).join(" ")}` : null;
};
