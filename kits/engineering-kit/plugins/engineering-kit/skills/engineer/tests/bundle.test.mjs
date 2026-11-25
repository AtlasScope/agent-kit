import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { assemble } from "../scripts/bundle.mjs";
import { SCHEMA } from "../scripts/evidence.mjs";
import { addPage, writePacket } from "../scripts/worksheet.mjs";
import { buildGraph, query, report as structureReport } from "../scripts/structure.mjs";
import { collect, analyze, report as historyReport } from "../scripts/history.mjs";

const run = (dir, ...args) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

function outputs(t) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "engineer-bundle-")));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "a.mjs"), 'export const a = 1;\n');
  fs.writeFileSync(path.join(dir, "b.mjs"), 'import { a } from "./a.mjs";\nexport const b = a;\n');
  run(dir, "init", "-q");
  run(dir, "add", "-A");
  run(dir, "commit", "-qm", "one");
  fs.appendFileSync(path.join(dir, "a.mjs"), "// two\n");
  fs.appendFileSync(path.join(dir, "b.mjs"), "// two\n");
  run(dir, "commit", "-qam", "two");
  const g = buildGraph(dir);
  const s = structureReport(g, query(g, ["a.mjs"]));
  const h = collect(dir);
  const hist = historyReport(dir, h, analyze(h, ["a.mjs"], { minSupport: 1 }), ["a.mjs"], "HEAD");
  return [{ file: path.join(dir, "structure.json"), text: JSON.stringify(s), base: dir }, { file: path.join(dir, "history.json"), text: JSON.stringify(hist), base: dir }];
}

test("instrument output and claims become one valid bundle, with sources hashed and observations namespaced", (t) => {
  const inputs = outputs(t);
  const claims = { claims: [{ id: "b-uses-a", title: "b depends on a", statement: "b.mjs imports a from a.mjs.", status: "supported", limits: "Static imports only.", subjects: ["a.mjs"], links: [{ observation: "structure.o1", relation: "supports" }, { observation: "history.o1", relation: "context" }] }] };
  const b = assemble(inputs, { title: "a and b", claims, now: new Date("2026-11-25T00:00:00Z") });
  assert.equal(b.schema, SCHEMA);
  assert.deepEqual(b.producer, { capability: "engineer", at: "2026-11-25T00:00:00.000Z" });
  assert.match(b.project.revision, /^[a-f0-9]{40}$/);
  assert.deepEqual(b.sources.map((s) => [s.id, s.scope, s.artifact]), [["structure", "repository-snapshot", "structure.json"], ["history", "repository-history", "history.json"]]);
  assert.equal(b.claims[0].scope, "repository-snapshot");
  assert.ok(b.observations.every((o) => /^(structure|history)\.o\d+$/.test(o.id)));
  // history cannot support a claim about the present tree, and support must be about the claim's subject:
  // the refusal names the claim and the observation
  const bad = { claims: [{ ...claims.claims[0], scope: "repository-snapshot", links: [{ observation: "history.o1", relation: "supports" }] }] };
  assert.throws(() => assemble(inputs, { title: "x", claims: bad }), /claim b-uses-a, observation history\.o1: repository-history evidence cannot support a repository-snapshot claim/);
  const elsewhere = { claims: [{ ...claims.claims[0], subjects: ["c.mjs"] }] };
  assert.throws(() => assemble(inputs, { title: "x", claims: elsewhere }), /claim b-uses-a, observation structure\.o1: shares no subject with the claim/);
});

test("a hand-written runtime source goes in beside the instruments; mixed revisions are recorded as the working tree, with a note", (t) => {
  const inputs = outputs(t);
  const { repository } = JSON.parse(inputs[0].text);
  const run = { tool: "checks", repository, revision: "f".repeat(40), title: "Tests run at the change", evidence: { scope: "runtime-observation", method: "npm test in the checkout.", limits: "One run.", subjects: [{ kind: "file", key: "a.mjs", label: "a.mjs" }], observations: [{ id: "o1", locator: "npm test", subjects: ["a.mjs"], kind: "command-run", summary: "3 tests, 3 pass." }] } };
  const notes = [];
  const claims = { claims: [{ id: "passes", title: "The tests pass", statement: "npm test passes.", status: "observed", limits: "One run.", subjects: ["a.mjs"], links: [{ observation: "checks.o1", relation: "supports" }, { observation: "structure.o1", relation: "context" }] }] };
  const b = assemble([...inputs, { file: path.join(path.dirname(inputs[0].file), "checks.json"), text: JSON.stringify(run), base: path.dirname(inputs[0].file) }], { title: "t", claims, warn: (m) => notes.push(m) });
  assert.equal(b.project.revision, "working-tree");
  assert.equal(b.claims[0].scope, "runtime-observation");
  assert.deepEqual(b.sources.at(-1).label, "checks · Tests run at the change");
  assert.equal(notes.length, 1);
  assert.match(notes[0], /different revisions.*structure [a-f0-9]{12}.*checks ffffffffffff/);
});

test("a bundle goes on the engineer's own copy of the page, and a step resting on its claims hands over a packet of them", (t) => {
  const inputs = outputs(t);
  const claims = { claims: [{ id: "b-uses-a", title: "b depends on a", statement: "b.mjs imports a from a.mjs.", status: "supported", limits: "Static imports only.", subjects: ["a.mjs"], links: [{ observation: "structure.o1", relation: "supports" }] }] };
  const evidence = assemble(inputs, { title: "a and b", claims });
  const book = fs.mkdtempSync(path.join(os.tmpdir(), "engineer-page-"));
  t.after(() => fs.rmSync(book, { recursive: true, force: true }));
  const page = { title: "a and b", area: "Engineer", verdict: "b depends on a.", steps: [{ label: "Change a carefully", why: "b reads it.", command: "/engineer change a", claims: ["b-uses-a"] }], evidence };
  assert.equal(addPage(book, page), 1);
  const packet = JSON.parse(fs.readFileSync(writePacket(book, page, ["b-uses-a"]), "utf8"));
  assert.deepEqual([packet.claims.map((c) => c.id), packet.observations.map((o) => o.id), packet.producer.capability], [["b-uses-a"], ["structure.o1"], "engineer"]);
  assert.throws(() => addPage(book, { ...page, steps: [{ ...page.steps[0], claims: ["missing"] }] }), /missing/);
});
