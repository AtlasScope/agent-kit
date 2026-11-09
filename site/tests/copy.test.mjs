// Copy composition: what the Copy button puts on the clipboard for each kind of entry.
// Run with `npm test` (builds content first). Node strips the TypeScript types in lib/copy.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { composeCopy, copyFormat, ISO_READ_RULE, MODE_RULE, RECIPE_FALLBACK } from "../lib/copy.ts";

const data = JSON.parse(fs.readFileSync(new URL("../content/generated.json", import.meta.url), "utf8"));
const byId = new Map(data.prompts.map((p) => [p.id, p]));
const get = (id) => { const p = byId.get(id); assert.ok(p, `missing entry ${id}`); return p; };

test("a command copies exactly what you type", () => {
  const e = { sec: "ecmd", t: "Engineer", cmd: "/engineer", p: "/engineer the login is slow" };
  assert.equal(copyFormat(e), "command");
  assert.equal(composeCopy(e), "/engineer");
  const ex = { sec: "dcmd", t: "Shape", cmd: "/impeccable shape", p: "/impeccable shape the billing page" };
  assert.equal(composeCopy(ex), "/impeccable shape the billing page");
});

test("a thinking prompt stays short", () => {
  const e = { sec: "think", t: "Wait", p: "What would have to be true for this to fail?", ev: "ignored", mode: "read" };
  assert.equal(composeCopy(e), "What would have to be true for this to fail?");
});

test("a recipe says what to do when a step's plugin is missing, once", () => {
  const e = { sec: "recipe", t: "Page", p: "Run these in order:\n1. /impeccable init\n2. /hallmark", steps: [["/impeccable init", ""], ["/hallmark", ""]] };
  const out = composeCopy(e);
  assert.ok(out.startsWith("Run these in order:\n1. /impeccable init\n2. /hallmark"));
  assert.ok(out.endsWith(RECIPE_FALLBACK));
  assert.equal(composeCopy({ ...e, p: out }), out);
});

test("an investigation carries mode, evidence and the trap", () => {
  const e = { sec: "inv", t: "T", p: "Find the slow query.", mode: "repro", ev: "The query and its plan", blind: "Agents blame the ORM" };
  assert.equal(composeCopy(e), `Find the slow query.\n\n${MODE_RULE.repro}\nGive me: The query and its plan.\nWatch for: Agents blame the ORM.`);
});

test("missing optional fields add nothing", () => {
  assert.equal(composeCopy({ sec: "inv", t: "T", p: "Only a body." }), "Only a body.");
  assert.equal(composeCopy({ sec: "inv", t: "Title only" }), "Title only");
  assert.equal(composeCopy({ sec: "inv", t: "T", p: "  Body.  ", ev: "   " }), "Body.");
});

test("a copied database investigation keeps its evidence and stays read-only", () => {
  const pg = get("PG01");
  const out = composeCopy(pg);
  assert.ok(out.startsWith(pg.p), "starts with the prompt itself");
  assert.ok(out.includes(MODE_RULE.read), "says read-only");
  assert.ok(out.includes(pg.ev.replace(/\.$/, "")), "includes the evidence to return");
  assert.ok(out.includes(pg.avoid.replace(/\.$/, "")), "includes what to avoid");
});

test("workflows keep their own step rules without a second mode line", () => {
  const flow = data.prompts.find((p) => p.flow);
  assert.ok(flow, "the library has at least one workflow");
  assert.ok(!composeCopy(flow).includes(MODE_RULE.read));
});

test("every entry copies non-empty text that starts with its body", () => {
  for (const p of data.prompts) {
    const out = composeCopy(p);
    assert.ok(out.trim().length > 0, `${p.id} copies nothing`);
    if (copyFormat(p) !== "command") assert.ok(out.startsWith((p.p || p.cmd || p.t).trim()), `${p.id} changes its own prompt text`);
  }
});

test("every read-only investigation says so in the copied text", () => {
  const read = data.prompts.filter((p) => copyFormat(p) === "investigation" && p.mode === "read" && !p.flow && !p.iso);
  assert.ok(read.length > 20);
  for (const p of read) assert.ok(composeCopy(p).includes(MODE_RULE.read), `${p.id} loses its read-only rule`);
});

test("read-only entries that test on a copy may change the copy, not production", () => {
  const iso = data.prompts.filter((p) => copyFormat(p) === "investigation" && p.mode === "read" && p.iso && !p.flow);
  assert.ok(iso.some((p) => p.id === "PG15") && iso.some((p) => p.id === "PG17"));
  for (const p of iso) {
    const out = composeCopy(p);
    assert.ok(out.includes(ISO_READ_RULE), `${p.id} lacks the separate-copy rule`);
    assert.ok(!out.includes(MODE_RULE.read), `${p.id} still forbids changing the separate copy`);
  }
});

test("read-only entries that ask for tests on a copy are marked as isolated", () => {
  const asks = /\bon a copy\b|separate database|before-and-after|replay/i;
  const missed = data.prompts.filter((p) => p.mode === "read" && !p.flow && !p.iso && asks.test(`${p.p || ""} ${p.ev || ""}`));
  assert.deepEqual(missed.map((p) => p.id), []);
});
