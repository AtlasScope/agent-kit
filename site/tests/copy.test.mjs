// A prompt carries the same text, and so the same permissions, wherever it is copied from. library/copy.mjs
// composes each payload from library.json. The portable page (its own Copy, run here), its Markdown cheat sheet and
// this site's content, which the pages, cards, palette, Markdown twins and MCP server copy from, must all give exactly
// that text. tests/smoke/delivery.smoke.mjs checks what the running site's twins and MCP server return.
// Run with `npm test` (builds content first).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { makeCopy } from "../../library/copy.mjs";
import { runPage } from "../../tests/library/page.mjs";

const read = (rel) => fs.readFileSync(new URL(rel, import.meta.url), "utf8");
const lib = JSON.parse(read("../../library/library.json"));
const data = JSON.parse(read("../content/generated.json"));
const page = runPage(new URL("../../library/dist/prompt-library.html", import.meta.url));
const copy = makeCopy(lib, page.data.keen);
const items = new Map([...lib.entries, ...lib.v3.recipes].map((e) => [e.id, e]));
// The lines that say what a prompt may change.
const PERMISSIONS = [...Object.values(lib.composer.mode).map(([, line]) => line), lib.composer.iso];
const permissions = (t) => PERMISSIONS.filter((line) => t.includes(line));

test("the site copies exactly what the library composes, for every prompt, recipe and recipe step", () => {
  assert.equal(data.prompts.length, items.size, "every library entry and recipe has a page");
  for (const p of data.prompts) {
    assert.ok(p.payload?.trim(), `${p.id} copies nothing`);
    assert.equal(p.payload, copy.text(items.get(p.id)), p.id);
    for (const [i, s] of (p.planSteps || []).entries()) assert.equal(s.copy, copy.step(items.get(p.id).steps[i][0]), `${p.id} step ${i + 1}`);
  }
});

test("the portable page, its cheat sheet and the site give the same text and permissions", () => {
  const surfaces = {
    "portable page": new Map(page.run("E.map((e) => [e.id, copyText(e)])")),
    "cheat sheet": new Map([...read("../../library/dist/prompt-library.md").matchAll(/^\*\*([A-Z]+\d+) · [^\n]*\n\n```text\n([\s\S]*?)\n```$/gm)].map((m) => [m[1], m[2]])),
  };
  let compared = 0;
  for (const p of data.prompts) {
    for (const [name, texts] of Object.entries(surfaces)) {
      if (!texts.has(p.id)) continue;
      const t = texts.get(p.id);
      assert.deepEqual(permissions(t), permissions(p.payload), `${p.id}: the ${name} and the site say different things about what it may change`);
      assert.equal(t, p.payload, `${p.id}: the ${name} copies different text from the site`);
      compared++;
    }
  }
  assert.ok(compared > 500, `only ${compared} comparisons`);
});
