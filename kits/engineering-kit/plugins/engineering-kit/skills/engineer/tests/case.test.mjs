import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { runCase, report, validate } from "../scripts/case.mjs";

const run = (dir, ...args) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

// A checker that repairs what it checks (the baseline), and one that only compares (the uncommitted candidate).
const GEN = 'import fs from "node:fs";\nconst out = process.argv[2] || "out.txt";\nfs.writeFileSync(out, fs.readFileSync("src.txt", "utf8").toUpperCase());\n';
const REPAIRS = 'import { execFileSync } from "node:child_process";\nimport fs from "node:fs";\nconst before = fs.readFileSync("out.txt", "utf8");\nexecFileSync(process.execPath, ["gen.mjs"]);\nif (fs.readFileSync("out.txt", "utf8") !== before) { console.error("out.txt was stale and has been rebuilt"); process.exit(1); }\nconsole.log("ok");\n';
const COMPARES = 'import { execFileSync } from "node:child_process";\nimport fs from "node:fs";\nimport os from "node:os";\nimport path from "node:path";\nconst tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "chk-")), "out.txt");\nexecFileSync(process.execPath, ["gen.mjs", tmp]);\nif (fs.readFileSync(tmp, "utf8") !== fs.readFileSync("out.txt", "utf8")) { console.error("out.txt is out of date"); process.exit(1); }\nconsole.log("ok");\n';

function fixture() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "engineer-case-src-")));
  for (const [f, t] of Object.entries({ "src.txt": "hello", "out.txt": "HELLO", "gen.mjs": GEN, "check.mjs": REPAIRS, ".gitignore": "node_modules/\n" })) fs.writeFileSync(path.join(dir, f), t);
  run(dir, "init", "-q");
  run(dir, "add", "-A");
  run(dir, "commit", "-qm", "fixture");
  // the candidate fix is left uncommitted, as it would be mid-work
  fs.writeFileSync(path.join(dir, "check.mjs"), COMPARES);
  fs.writeFileSync(path.join(dir, "notes.txt"), "untracked, not ignored");
  return dir;
}

const spec = {
  title: "The check should not repair what it checks",
  baseline: "HEAD",
  candidate: "working-tree",
  steps: [
    { id: "fresh", run: [process.execPath, "check.mjs"], expect: { exit: 0, unchanged: true, writes: 0 } },
    { id: "stale", change: [{ append: "out.txt", text: "!" }], run: [process.execPath, "check.mjs"], expect: { exit: 1, unchanged: true, output: "out" } },
    { id: "repeat", run: [process.execPath, "check.mjs"], expect: { exit: 1 } },
  ],
};

test("baseline and candidate run the same steps in their own copies; the checkout is untouched", (t) => {
  const dir = fixture();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const before = run(dir, "status", "--porcelain");
  const bytes = fs.readFileSync(path.join(dir, "out.txt"), "utf8");
  const out = runCase(dir, spec);
  const r = (id, v) => out.steps.find((s) => s.id === id).results[v];
  // the baseline rewrites out.txt even when it is right: identical bytes, still a write
  assert.equal(r("fresh", "baseline").exit, 0);
  assert.equal(r("fresh", "baseline").writes.tracked, 1);
  assert.equal(r("fresh", "baseline").writes.sameBytes, 1);
  assert.equal(r("fresh", "baseline").expect.writes, false);
  // stale: it fails, but repairs the file, so the repeat passes and the evidence is gone
  assert.deepEqual([r("stale", "baseline").exit, r("stale", "baseline").modified], [1, ["out.txt"]]);
  assert.equal(r("repeat", "baseline").exit, 0);
  assert.equal(r("repeat", "baseline").pass, false);
  // the candidate compares in a temp folder: no project writes, the stale file stays stale
  for (const id of ["fresh", "stale", "repeat"]) assert.equal(r(id, "candidate").pass, true, id);
  assert.equal(r("stale", "candidate").writes.outside >= 1, true);
  assert.ok(out.variants.candidate.workingTree && out.variants.candidate.uncommittedFiles === 2);
  assert.ok(r("fresh", "candidate").children.some((c) => c.startsWith(path.basename(process.execPath)) && c.includes("gen.mjs")));
  assert.equal(run(dir, "status", "--porcelain"), before);
  assert.equal(fs.readFileSync(path.join(dir, "out.txt"), "utf8"), bytes);
  // the report is evidence of a controlled fixture, one observation per step and variant
  const rep = report(dir, spec, out);
  assert.equal(rep.evidence.scope, "controlled-fixture");
  assert.equal(rep.evidence.observations.length, 6);
  assert.equal(rep.revision, "working-tree");
});

test("a case file must stay inside the repository and say what it expects in known terms", () => {
  assert.throws(() => validate({ ...spec, steps: [{ id: "x", run: ["node"], change: [{ write: "../outside", text: "" }] }] }), /inside the repository/);
  assert.throws(() => validate({ ...spec, steps: [{ id: "x", run: ["node"], expect: { fast: true } }] }), /unknown expectation/);
  assert.throws(() => validate({ ...spec, steps: [{ id: "a", run: ["node"] }, { id: "a", run: ["node"] }] }), /unique/);
  assert.ok(validate(spec));
});
