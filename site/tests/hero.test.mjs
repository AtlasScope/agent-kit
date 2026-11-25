// The homepage shows one real request and the skill its router picks (HERO.example in lib/site.ts). Keep it true:
// it must be a routing case whose first pick is that skill, and the router's own situations row must pick it too.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HERO } from "../lib/site.ts";

const root = new URL("../../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

test("the homepage example is a routing case with the same first pick", () => {
  const ex = HERO.example;
  const c = JSON.parse(read("tests/routing/cases.json")).cases.find((x) => x.id === ex.case);
  assert.ok(c, `tests/routing/cases.json has ${ex.case}`);
  assert.equal(c.router, ex.router);
  assert.equal(c.request, `${ex.router} ${ex.request}`);
  assert.equal(c.expect[0], `/${ex.pick}`);
});

test("the design router's situations table sends a row to that skill first", () => {
  const rows = read("kits/design-kit/plugins/design-kit/skills/design/references/situations.md").split("\n");
  assert.ok(rows.some((l) => l.split("|")[2]?.trim().replaceAll("`", "") === `/${HERO.example.pick}`), `a row's first pick is /${HERO.example.pick}`);
});

test("each extra homepage request is a routing case with the same first pick", () => {
  const cases = JSON.parse(read("tests/routing/cases.json")).cases;
  assert.ok(HERO.more.length > 0);
  for (const m of HERO.more) {
    const c = cases.find((x) => x.id === m.case);
    assert.ok(c, `tests/routing/cases.json has ${m.case}`);
    assert.equal(c.router, m.router);
    assert.equal(c.request, `${m.router} ${m.request}`);
    assert.equal(c.expect[0], m.pick);
  }
});

test("an extra request that goes to a library prompt is shown by that prompt's title", () => {
  const titles = new Map(JSON.parse(read("library/library.json")).entries.map((e) => [e.id, e.t]));
  for (const m of HERO.more) if (!m.pick.startsWith("/")) assert.equal(m.label, titles.get(m.pick), `${m.case} shows the title of ${m.pick}`);
});
