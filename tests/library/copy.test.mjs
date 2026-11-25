// One composer for every Copy. library/copy.mjs builds each payload from library.json; the portable page (its own
// script, run here) and its Markdown cheat sheet must give exactly that text, and what an investigation may change
// must come only from library.json's composer.   node --test tests/library/copy.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeCopy, authority, PLAIN_REPORT, RECIPE_FALLBACK } from "../../library/copy.mjs";
import { runPage } from "./page.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const lib = JSON.parse(fs.readFileSync(path.join(root, "library/library.json"), "utf8"));
const MODES = Object.entries(lib.composer.mode).map(([k, [, line]]) => [k, line]);

test("the portable page and its cheat sheet copy exactly what the library composes", () => {
  const page = runPage(path.join(root, "library/dist/prompt-library.html"));
  const copy = makeCopy(lib, page.data.keen);
  const items = new Map([...lib.entries, ...page.data.keen, ...lib.v3.recipes].map((e) => [e.id, e]));
  const shown = page.run("E.map((e) => [e.id, copyText(e)])");
  assert.ok(shown.length > 250, `the page lists only ${shown.length} items`);
  for (const [id, text] of shown) assert.equal(text, copy.text(items.get(id)), `the page's Copy for ${id} differs from library/copy.mjs`);
  // Each step of a recipe, copied on its own.
  const steps = page.run("V.recipes.flatMap((r) => r.steps.map(([ref]) => { const e = stepEntry(ref); return [r.id, ref, e ? stepText(e) : null]; }))");
  for (const [id, ref, text] of steps) if (text !== null) assert.equal(text, copy.step(ref), `${id} step ${ref}`);
  const md = fs.readFileSync(path.join(root, "library/dist/prompt-library.md"), "utf8");
  const blocks = [...md.matchAll(/^\*\*([A-Z]+\d+) · [^\n]*\n\n```text\n([\s\S]*?)\n```$/gm)];
  assert.ok(blocks.length > 250, `the cheat sheet has only ${blocks.length} copy blocks`);
  for (const [, id, text] of blocks) assert.equal(text, copy.text(items.get(id)), `the cheat sheet's text for ${id} differs from library/copy.mjs`);
});

test("an investigation may change only what its mode in library.json allows", () => {
  const copy = makeCopy(lib);
  const inv = lib.entries.filter((e) => (e.sec === "inv" || e.sec === "db") && !e.flow);
  assert.ok(inv.length > 90);
  for (const e of inv) {
    const out = copy.text(e);
    const own = (line) => (e.p || "").includes(line);
    assert.deepEqual(authority(e, lib.composer), [lib.composer.mode[e.mode][1], ...(e.iso ? [lib.composer.iso] : [])], e.id);
    for (const [k, line] of MODES) assert.equal(out.includes(line), k === e.mode, `${e.id} (${e.mode}) ${k === e.mode ? "lacks" : "carries"} the ${k} line`);
    assert.equal(out.includes(lib.composer.iso), !!e.iso || own(lib.composer.iso), `${e.id} separate-database line`);
    assert.ok(out.startsWith(e.p.trim()) && out.endsWith(PLAIN_REPORT), `${e.id} changes its own text or loses the report line`);
  }
  // Everything else adds no permission of its own: whatever it says about changes is in its own text.
  for (const e of [...lib.entries.filter((x) => !inv.includes(x)), ...lib.v3.recipes]) {
    const out = copy.text(e);
    const own = (line) => [e.p, e.copy, ...(e.steps || []).map(([ref]) => copy.step(ref))].some((t) => t?.includes(line));
    for (const line of [...MODES.map(([, l]) => l), lib.composer.iso]) if (out.includes(line)) assert.ok(own(line), `${e.id} gains "${line.slice(0, 40)}..."`);
  }
});

test("a recipe copied as one prompt says which of its steps only read", () => {
  const copy = makeCopy(lib);
  const one = lib.v3.recipes.filter((r) => !copy.split(r));
  assert.ok(one.length >= 5);
  for (const r of one) assert.match(copy.text(r), /read-only/i, `${r.id} copies without its read-only rule`);
});

test("read-only entries that ask for tests on a copy are marked as testing on a separate database", () => {
  const asks = /\bon a copy\b|separate database|before-and-after|replay/i;
  const missed = lib.entries.filter((e) => e.mode === "read" && !e.flow && !e.iso && asks.test(`${e.p || ""} ${e.ev || ""}`));
  assert.deepEqual(missed.map((e) => e.id), []);
});

test("each kind of item copies its own format", () => {
  const composer = lib.composer;
  const one = (e) => makeCopy({ entries: [e], composer }).text(e);
  assert.equal(one({ id: "C", sec: "ecmd", t: "Engineer", cmd: "/engineer", p: "/engineer the login is slow" }), "/engineer");
  assert.equal(one({ id: "D", sec: "dcmd", t: "Shape", cmd: "/impeccable shape", p: "/impeccable shape the billing page" }), "/impeccable shape the billing page");
  assert.equal(one({ id: "W", sec: "think", t: "Wait", p: "What would have to be true for this to fail?", ev: "ignored", mode: "read" }), "What would have to be true for this to fail?");
  const r = one({ id: "R", sec: "recipe", t: "Page", p: "Run these in order:\n1. /impeccable init", steps: [["/impeccable init", ""]] });
  assert.equal(r, `Run these in order:\n1. /impeccable init\n\n${RECIPE_FALLBACK}`);
  assert.equal(one({ id: "R", sec: "recipe", t: "Page", p: r, steps: [["/impeccable init", ""]] }), r, "the fallback is added once");
  assert.equal(one({ id: "F", sec: "db", t: "Flow", p: "Step 1. Step 2.", flow: [] }), `Step 1. Step 2.\n\n${PLAIN_REPORT}`, "a workflow keeps its own rules");
  assert.equal(one({ id: "I", sec: "inv", t: "T", p: "Only a body." }), `Only a body.\n\n${composer.mode.read[1]}\n${PLAIN_REPORT}`, "an investigation without a mode is read-only");
  assert.equal(one({ id: "I", sec: "inv", t: "T", p: "Find it.", mode: "repro", ev: "The query", blind: "Agents blame the ORM", avoid: "Guessing", skip: "Fast pages" }),
    `Find it.\n\n${composer.mode.repro[1]}\nGive me: The query.\nAvoid: Guessing.\nWatch for: Agents blame the ORM.\nIf this describes the project, say so and stop instead: Fast pages.\n${PLAIN_REPORT}`);
  assert.throws(() => one({ id: "X", sec: "inv", t: "T", p: "x", mode: "anything" }), /mode "anything"/);
  assert.throws(() => makeCopy({ entries: [], composer: { mode: composer.mode } }).text({ id: "Y", sec: "db", t: "T", p: "x", mode: "read", iso: true }), /no iso line/);
});
