import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { assemble } from "../scripts/bundle.mjs";
import { validateBundle, SCHEMA } from "../scripts/evidence.mjs";
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
  // history cannot support a claim about the present tree: support must come from the claim's own scope
  const bad = { claims: [{ ...claims.claims[0], scope: "repository-snapshot", links: [{ observation: "history.o1", relation: "supports" }] }] };
  assert.throws(() => assemble(inputs, { title: "x", claims: bad }), /Cross-scope/);
});

test("the contract accepts the additions (scopes, relation subjects, working-tree, producer) and nothing unknown", () => {
  const base = {
    schema: SCHEMA, id: "t", title: "t", project: { repository: "o/r", revision: "working-tree" },
    subjects: [{ id: "s1", kind: "relation", key: "public.orders.total_cents", label: "orders.total_cents" }],
    sources: [{ id: "db", label: "db", scope: "database-snapshot", artifact: "db.json", sha256: "a".repeat(64), method: "read-only queries", limits: "one time" }],
    observations: [{ id: "o1", source: "db", locator: "q1", subjects: ["s1"], kind: "count", summary: "12 rows", details: {} }],
    claims: [], decisions: [], cases: [],
  };
  assert.ok(validateBundle(base));
  assert.ok(validateBundle({ ...base, producer: { capability: "database", at: "2026-11-25T08:00:00Z" } }));
  assert.ok(validateBundle({ ...base, sources: [{ ...base.sources[0], scope: "runtime-observation" }] }));
  assert.throws(() => validateBundle({ ...base, producer: { capability: "database", at: "yesterday" } }), /producer/);
  assert.throws(() => validateBundle({ ...base, producer: { capability: "database", at: "2026-11-25T08:00:00Z", extra: 1 } }), /producer/);
  assert.throws(() => validateBundle({ ...base, extra: true }), /shape/);
  assert.throws(() => validateBundle({ ...base, project: { repository: "o/r", revision: "main" } }), /snapshot/);
});
