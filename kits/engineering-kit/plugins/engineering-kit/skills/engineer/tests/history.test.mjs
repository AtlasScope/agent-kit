import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { collect, analyze, report } from "../scripts/history.mjs";

const run = (dir, ...args) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const write = (dir, f, text) => { fs.mkdirSync(path.join(dir, path.dirname(f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), text); };
const commit = (dir, msg, files) => { for (const [f, t] of Object.entries(files)) write(dir, f, t); run(dir, "add", "-A"); run(dir, "commit", "-qm", msg); };

/**
 * Six first-parent change sets, oldest first:
 *   1 a.ts b.ts          2 a.ts b.ts c.md      3 c.md
 *   4 merge of a branch that changed a.ts and "odd\nname.ts" (first parent sees both)
 *   5 a broad commit touching 4 files (left out at --max-files 3)   6 an empty commit
 */
function fixture() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "engineer-history-")));
  run(dir, "init", "-q", "-b", "main");
  commit(dir, "one", { "a.ts": "1", "b.ts": "1" });
  commit(dir, "two", { "a.ts": "2", "b.ts": "2", "c.md": "2" });
  commit(dir, "three", { "c.md": "3" });
  run(dir, "checkout", "-q", "-b", "side");
  commit(dir, "side", { "a.ts": "4", "odd\nname.ts": "4" });
  run(dir, "checkout", "-q", "main");
  run(dir, "merge", "-q", "--no-ff", "side", "-m", "merge side");
  commit(dir, "broad", { "a.ts": "5", "b.ts": "5", "c.md": "5", "d.ts": "5" });
  run(dir, "commit", "-q", "--allow-empty", "-m", "empty");
  return dir;
}

test("first-parent change sets, merges seen against their first parent, odd names intact, nothing written", (t) => {
  const dir = fixture();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  write(dir, "c.md", "uncommitted");
  const before = run(dir, "status", "--porcelain");
  const h = collect(dir, { limit: 50 });
  assert.equal(h.commits.length, 6);
  assert.equal(h.commits[0].files.length, 0); // the empty commit
  assert.deepEqual(h.commits[2].files.map((f) => f.path).sort(), ["a.ts", "odd\nname.ts"]); // the merge
  assert.equal(h.totalFirstParent, 6);
  assert.equal(run(dir, "status", "--porcelain"), before);
  assert.equal(fs.readFileSync(path.join(dir, "c.md"), "utf8"), "uncommitted");
});

test("co-change is counted against a base rate, broad commits are left out, and pairs are reported", (t) => {
  const dir = fixture();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const h = collect(dir, { limit: 50 });
  const a = analyze(h, ["a.ts"], { maxFiles: 3, minSupport: 1 });
  assert.equal(a.eligible, 5);
  assert.equal(a.excluded.length, 1);
  assert.equal(a.perTarget[0].commits, 3);
  assert.equal(a.perTarget[0].inBroadCommits, 1);
  const b = a.related.find((r) => r.path === "b.ts");
  assert.deepEqual([b.support, b.targetCommits, b.otherCommits, b.eligible], [2, 3, 2, 5]);
  assert.equal(b.lift, (2 / 3) / (2 / 5));
  // a minimum support of 2 drops the files seen with a.ts only once
  assert.deepEqual(analyze(h, ["a.ts"], { maxFiles: 3 }).related.map((r) => r.path), ["b.ts"]);
  // generated files are left out unless asked for, and counted
  const gen = analyze(h, ["a.ts"], { maxFiles: 3, generated: new Set(["b.ts"]) });
  assert.equal(gen.related.length, 0);
  assert.equal(gen.hiddenGenerated, 1);
  const pair = analyze(h, ["a.ts", "c.md"], { maxFiles: 3 }).pairs[0];
  assert.deepEqual([pair.both, pair.aCommits, pair.bCommits], [1, 3, 2]);
});

test("the report's evidence is history-scoped and every observation names known subjects", (t) => {
  const dir = fixture();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const h = collect(dir, { limit: 50 });
  const r = report(dir, h, analyze(h, ["a.ts"], { maxFiles: 3, minSupport: 1 }), ["a.ts"], "HEAD");
  assert.equal(r.evidence.scope, "repository-history");
  assert.match(r.revision, /^[a-f0-9]{40}$/);
  const keys = new Set(r.evidence.subjects.map((s) => s.key));
  for (const o of r.evidence.observations) for (const s of o.subjects) assert.ok(keys.has(s));
  assert.match(r.coverage, /does not show cause/);
});
