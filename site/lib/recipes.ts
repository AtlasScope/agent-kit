// Recipes for the MCP server. A recipe is a library entry in the "plan" section (Recipes) or the older
// "recipe" section (Older recipes); it keeps the id and slug it has everywhere else. Everything here is
// pure and takes the library's own functions as arguments, so tests can run it on the built content and
// the existing tools (find, get_prompt, ...) never depend on it.
export const RECIPE_SECS = ["plan", "recipe"];

type R = { id: string; slug: string; sec: string; t: string; split?: boolean; skills: string[]; planSteps?: { label: string; note: string; slug: string | null; kind: string; copy: string | null }[]; steps?: [string, string][] };
type Ranked = { kind: string; ref: string };

export const isRecipe = (p: { sec: string }) => RECIPE_SECS.includes(p.sec);

// Same ranking as find: the library's search, narrowed to recipes. Without a query, every recipe in library order.
export function recipesFor<P extends R>(listed: P[], search: (q: string, limit: number) => Ranked[], query?: string): P[] {
  // Recipes first, then the older ones; each group keeps library order.
  const all = RECIPE_SECS.flatMap((sec) => listed.filter((p) => p.sec === sec));
  if (!query?.trim()) return all;
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  return search(query, listed.length + 100).flatMap((h) => (h.kind === "prompt" && bySlug.has(h.ref) ? [bySlug.get(h.ref)!] : []));
}

export function recipeListText<P extends R>(
  hits: P[], query: string | undefined,
  d: { siteUrl: string; kindLabel: (p: P) => string; whatOf: (p: P) => string },
): string {
  if (!hits.length) return `No recipe matched "${query}". Try fewer or plainer words, or call find_recipes with no query to list them all.`;
  return hits.map((p, i) => {
    const n = (p.planSteps || p.steps || []).length;
    return `${i + 1}. ${p.t} (${d.kindLabel(p)} ${p.id}, ${n} steps, get_recipe "${p.slug}")\n   ${d.siteUrl}/prompts/${p.slug} · ${d.siteUrl}/prompts/${p.slug}.md\n   ${d.whatOf(p)}`;
  }).join("\n");
}

export function recipeDetailMd<P extends R>(p: P, d: {
  promptMd: (p: P) => string; copyText: (p: P) => string; copyLabel: (p: P) => string;
  getPrompt: (slug: string) => (P & { t: string }) | undefined; getSkill: (name: string) => { name: string; description: string } | undefined;
  skillInstall: (name: string) => string; siteUrl: string;
}): string {
  const fence = (t: string) => "```text\n" + t + "\n```";
  const out = [d.promptMd(p), ""];
  // A split recipe's page already prints each prompt step in full; a one-prompt recipe shows only the combined text.
  const refs = (p.planSteps || []).filter((s) => s.slug && !p.split);
  if (refs.length) {
    out.push("## Referenced prompts", "");
    for (const s of refs) {
      const r = d.getPrompt(s.slug!);
      out.push(`### ${r ? `${r.t} (${r.id})` : s.label}`, "", `${d.siteUrl}/prompts/${s.slug}`, "", ...(s.copy ? [fence(s.copy), ""] : []));
    }
  }
  const skills = p.skills.flatMap((n) => { const s = d.getSkill(n); return s ? [s] : []; });
  if (skills.length) {
    out.push("## Skills to install", "");
    for (const s of skills) out.push(`- ${s.name}: ${s.description.split(/(?<=\.)\s/)[0]}`, `  \`${d.skillInstall(s.name)}\``);
    out.push("");
  }
  out.push("## What the Copy button copies", "", `Button: ${d.copyLabel(p)}`, "", fence(d.copyText(p)));
  return out.join("\n");
}
