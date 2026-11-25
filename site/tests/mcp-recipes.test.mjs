// Recipes over MCP: find_recipes and get_recipe are built from lib/recipes.ts on the real built content.
// The existing tools keep their ranking because recipes only filter the library's own search.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { makeSearch } from "../lib/search.ts";
import { composeCopy } from "../lib/copy.ts";
import { isRecipe, recipesFor, recipeListText, recipeDetailMd } from "../lib/recipes.ts";

const data = JSON.parse(fs.readFileSync(new URL("../content/generated.json", import.meta.url), "utf8"));
const listed = data.prompts.filter((p) => !p.replacedBy);
const search = makeSearch(listed, data.skills);
const byId = (id) => data.prompts.find((p) => p.id === id);
const URL_ = "https://example.test";
const deps = {
  siteUrl: URL_, kindLabel: (p) => (p.sec === "plan" ? "Recipe" : "Older recipe"), whatOf: (p) => p.line || p.why || p.use || "",
};
const detail = (p) => recipeDetailMd(p, {
  promptMd: (x) => `# ${x.t}\n\nbody`, copyText: composeCopy, copyLabel: (x) => (x.split ? "Copy step 1" : "Copy recipe"),
  getPrompt: (s) => data.prompts.find((x) => x.slug === s), getSkill: (n) => data.skills.find((s) => s.name === n),
  skillInstall: (n) => `npx skills add AtlasScope/agent-kit --skill ${n}`, siteUrl: URL_,
});

test("with no query every listed recipe comes back, with the ids the library uses", () => {
  const all = recipesFor(listed, search);
  assert.ok(all.length >= 20);
  assert.ok(all.every((p) => ["plan", "recipe"].includes(p.sec)));
  assert.ok(all.some((p) => p.id === "RX06" && p.slug === "a-bug-you-cant-explain"));
  assert.ok(!all.some((p) => p.replacedBy), "retired recipes stay out of lists");
});

test("a query returns recipes in the same relative order as find", () => {
  for (const q of ["slow", "launch", "motion", "bug", "landing page"]) {
    const rs = new Set(recipesFor(listed, search).map((p) => p.slug));
    const want = search(q, listed.length + 100).filter((h) => h.kind === "prompt" && rs.has(h.ref)).map((h) => h.ref);
    assert.deepEqual(recipesFor(listed, search, q).map((p) => p.slug), want, q);
    assert.ok(want.length, `${q} finds a recipe`);
  }
});

test("a query nothing matches says so", () => {
  const hits = recipesFor(listed, search, "zzzznothing");
  assert.deepEqual(hits, []);
  assert.match(recipeListText(hits, "zzzznothing", deps), /No recipe matched/);
});

test("the list names the id, slug, step count and links", () => {
  const p = byId("RX06");
  const t = recipeListText([p], undefined, deps);
  assert.match(t, /Recipe RX06, 5 steps, get_recipe "a-bug-you-cant-explain"/);
  assert.match(t, new RegExp(`${URL_}/prompts/a-bug-you-cant-explain · ${URL_}/prompts/a-bug-you-cant-explain.md`));
});

test("a recipe's detail ends with exactly what the Copy button copies", () => {
  for (const p of data.prompts.filter(isRecipe)) {
    const t = detail(p);
    assert.ok(t.startsWith(`# ${p.t}\n\nbody`));
    assert.ok(t.endsWith("```text\n" + composeCopy(p) + "\n```"), p.id);
    assert.match(t, new RegExp(`Button: Copy ${p.split ? "step 1" : "recipe"}`));
  }
});

test("a one-prompt recipe carries each prompt it refers to; skills come with install commands", () => {
  const p = byId("RX06");
  assert.ok(!p.split);
  const t = detail(p);
  for (const s of p.planSteps.filter((x) => x.slug)) assert.ok(t.includes(`${URL_}/prompts/${s.slug}`), s.slug);
  for (const n of p.skills) assert.ok(t.includes(`--skill ${n}`), n);
});

test("a split recipe does not repeat step text the page already prints", () => {
  assert.ok(!detail(byId("RX01")).includes("## Referenced prompts"));
});

test("a prompt that is not a recipe is not one", () => {
  assert.ok(!isRecipe(byId("PG02")));
});

// find's results, captured from the running server before recipes were added. Recipes only filter this
// ranking, so these must never move.
test("find's top results for existing queries are unchanged", () => {
  const top = (q, n = 5) => search(q, 60).slice(0, n).map((h) => h.ref);
  assert.deepEqual(top("my API is slow"), ["slowest-journeys-end-to-end", "impeccable-optimize", "it-got-slow", "is-our-ingestion-process-more-complicated-than-necessary", "the-apps-own-ai-calls"]);
  assert.deepEqual(top("review typography"), ["review-animations", "steve-jobs-design-review", "web-typography", "harsh-review", "differential-review-diff-review"]);
  assert.deepEqual(top("landing page"), ["new-landing-page", "landing-page-that-converts", "a-landing-page-that-gets-people-to-act", "this-page-kind-of-stinks", "cinematic-launch-page"]);
  assert.deepEqual(top("recipe"), ["design", "new-landing-page", "new-dashboard-or-tool", "this-page-kind-of-stinks", "rethink-it-rules-off"]);
});
