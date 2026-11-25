import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { runCase, report, toText, validate } from "../scripts/case.mjs";

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

test("baseline and candidate run the same steps in their own copies; the checkout is untouched", async (t) => {
  const dir = fixture();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const before = run(dir, "status", "--porcelain");
  const bytes = fs.readFileSync(path.join(dir, "out.txt"), "utf8");
  const out = await runCase(dir, spec);
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
  assert.throws(() => validate({ ...spec, steps: [{ id: "x", run: ["node"], expect: { candidate: { fast: true } } }] }), /unknown expectation/);
  assert.throws(() => validate({ ...spec, steps: [{ id: "x", run: ["node"], expect: { exit: 0, candidate: { exit: 1 } } }] }), /not a mix/);
  assert.throws(() => validate({ ...spec, candidate: undefined, steps: [{ id: "x", run: ["node"], expect: { candidate: { exit: 1 } } }] }), /no "candidate"/);
  assert.throws(() => validate({ ...spec, steps: [{ id: "a", run: ["node"] }, { id: "a", run: ["node"] }] }), /unique/);
  assert.throws(() => validate({ ...spec, link: ["deps"], copy: ["deps"] }), /named twice/);
  assert.throws(() => validate({ ...spec, copy: ["../deps"] }), /inside the repository/);
  assert.ok(validate(spec));
});

test("each variant can expect its own result, so a mutation run can expect the candidate to fail", async (t) => {
  const dir = fixture();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  // the repairing baseline passes on the repeat; the comparing candidate keeps failing, as it should
  const out = await runCase(dir, { ...spec, steps: [spec.steps[1], { id: "repeat", run: [process.execPath, "check.mjs"], expect: { baseline: { exit: 0 }, candidate: { exit: 1, writes: 0 } } }] });
  const repeat = out.steps.find((s) => s.id === "repeat").results;
  assert.deepEqual([repeat.baseline.pass, repeat.baseline.expect], [true, { exit: true }]);
  assert.deepEqual([repeat.candidate.pass, repeat.candidate.expect], [true, { exit: true, writes: true }]);
  // an expectation given once still applies to both
  const stale = out.steps.find((s) => s.id === "stale").results;
  assert.deepEqual([stale.baseline.expect.unchanged, stale.candidate.expect.unchanged], [false, true]);
});

test("a copied folder is a real folder inside each clone, unlike a link; started programs show the arguments they were given", async (t) => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "engineer-case-copy-")));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  // the step runs in app/, reads ../deps the way a bundler reads node_modules, and starts a program with flags
  const probe = 'import fs from "node:fs";\nimport path from "node:path";\nimport { execFileSync } from "node:child_process";\nexecFileSync(process.execPath, ["-e", "0"]);\nconst real = fs.realpathSync("../deps/lib.txt");\nif (path.relative(fs.realpathSync(".."), real).startsWith("..")) { console.error("deps leads out of the project: " + real); process.exit(3); }\nconsole.log(fs.readFileSync(real, "utf8"));\n';
  fs.mkdirSync(path.join(dir, "app"));
  fs.writeFileSync(path.join(dir, "app/probe.mjs"), probe);
  fs.writeFileSync(path.join(dir, ".gitignore"), "deps/\n");
  run(dir, "init", "-q");
  run(dir, "add", "-A");
  run(dir, "commit", "-qm", "fixture");
  fs.mkdirSync(path.join(dir, "deps"));
  fs.writeFileSync(path.join(dir, "deps/lib.txt"), "from deps");
  const step = { id: "probe", cwd: "app", run: [process.execPath, "probe.mjs"] };
  const copied = (await runCase(dir, { title: "copy", baseline: "HEAD", copy: ["deps"], steps: [{ ...step, expect: { exit: 0, output: "from deps" } }] })).steps[0].results.baseline;
  const linked = (await runCase(dir, { title: "link", baseline: "HEAD", link: ["deps"], steps: [{ ...step, expect: { exit: 3, output: "leads out" } }] })).steps[0].results.baseline;
  assert.equal(copied.pass, true, copied.stderr);
  assert.equal(linked.pass, true, linked.stderr);
  assert.deepEqual(copied.children, [`${path.basename(process.execPath)} -e 0`]);
  assert.equal(fs.readFileSync(path.join(dir, "deps/lib.txt"), "utf8"), "from deps");
});

function repo(t, files) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "engineer-case-repo-")));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const [f, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, f), text);
  return dir;
}
const commit = (dir) => { run(dir, "init", "-q"); run(dir, "add", "-A"); run(dir, "commit", "-qm", "fixture"); return dir; };
const scratch = (t) => { const d = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "engineer-case-outside-"))); t.after(() => fs.rmSync(d, { recursive: true, force: true })); return d; };
const node = process.execPath;

test("a change, copy or link through a symbolic link in the repository is refused, and nothing outside the copy changes", { skip: process.platform === "win32" && "creating symbolic links needs privileges on Windows" }, async (t) => {
  const outside = scratch(t);
  fs.writeFileSync(path.join(outside, "victim.txt"), "original");
  const dir = repo(t, { ".gitignore": "deps/\n" });
  fs.symlinkSync(outside, path.join(dir, "linked"));
  commit(dir);
  fs.mkdirSync(path.join(dir, "deps"));
  const attempts = [
    ...[{ write: "linked/victim.txt", text: "x" }, { append: "linked/victim.txt", text: "x" }, { delete: "linked/victim.txt" }].map((change) => ({ steps: [{ id: "s", change: [change], run: [node, "-e", "0"] }] })),
    { copy: [{ path: "linked/deps", from: "deps" }] },
    { link: [{ path: "linked/deps", from: "deps" }] },
    { steps: [{ id: "s", cwd: "linked", run: [node, "-e", "0"] }] },
  ];
  for (const a of attempts) await assert.rejects(async () => runCase(dir, { title: "links", baseline: "HEAD", steps: [{ id: "s", run: [node, "-e", "0"] }], ...a }), /linked is a symbolic link in the copy/);
  assert.deepEqual(fs.readdirSync(outside), ["victim.txt"]);
  assert.equal(fs.readFileSync(path.join(outside, "victim.txt"), "utf8"), "original");
});

test("an untracked link stays a link in the working-tree copy, even one that leads nowhere", { skip: process.platform === "win32" && "creating symbolic links needs privileges on Windows" }, async (t) => {
  const dir = commit(repo(t, { "src.txt": "hello" }));
  fs.symlinkSync("src.txt", path.join(dir, "alias.txt"));
  fs.symlinkSync("missing.txt", path.join(dir, "dangling.txt"));
  const probe = 'const fs = require("fs"); console.log(["alias.txt", "dangling.txt"].map((f) => f + " " + fs.lstatSync(f).isSymbolicLink() + " " + fs.readlinkSync(f)).join(", "))';
  const r = (await runCase(dir, { title: "links", baseline: "working-tree", steps: [{ id: "s", run: [node, "-e", probe], expect: { output: "alias.txt true src.txt, dangling.txt true missing.txt" } }] })).steps[0].results.baseline;
  assert.equal(r.pass, true, r.stdout);
});

test("a deleted file is reported as deleted, and expected output is found anywhere in long output", async (t) => {
  const dir = commit(repo(t, { "src.txt": "hello", "keep.txt": "keep" }));
  const out = await runCase(dir, { title: "delete", baseline: "HEAD", steps: [
    { id: "delete", run: [node, "-e", 'require("fs").unlinkSync("src.txt")'] },
    { id: "long", run: [node, "-e", 'console.log("A".repeat(3000) + "NEEDLE" + "B".repeat(3000))'], expect: { output: "NEEDLE" } },
  ] });
  const [del, long] = out.steps.map((s) => s.results.baseline);
  assert.deepEqual([del.modified, del.deleted], [[], ["src.txt"]]);
  assert.equal(long.pass, true);
  assert.ok(!long.stdout.includes("NEEDLE"), "the report keeps only the start and the end");
});

test("whatever a step leaves running is stopped before the files are compared, at a timeout or after a normal exit", { skip: process.platform === "win32" && "Windows stops only a timed-out program's tree" }, async (t) => {
  const markers = scratch(t);
  const dir = commit(repo(t, { "src.txt": "hello" }));
  // a worker that writes a marker outside the copy and then a project file, unless it is stopped first
  const worker = (name) => JSON.stringify(`setTimeout(() => { require("fs").writeFileSync(${JSON.stringify(path.join(markers, name))}, "x"); require("fs").appendFileSync("src.txt", "late"); }, 800)`);
  const start = (name, detached) => `require("child_process").spawn(process.execPath, ["-e", ${worker(name)}], { detached: ${detached}, stdio: "ignore" }).unref();`;
  const out = await runCase(dir, { title: "leftovers", baseline: "HEAD", timeout: 0.5, steps: [
    { id: "hang", run: [node, "-e", `${start("detached-at-timeout", true)} ${start("child-at-timeout", false)} setInterval(() => {}, 1000)`] },
    { id: "exit", run: [node, "-e", start("detached-after-exit", true)] },
    { id: "quiet", run: [node, "-e", "setTimeout(() => {}, 400)"], expect: { unchanged: true } },
  ] });
  const [hang, exit, quiet] = out.steps.map((s) => s.results.baseline);
  assert.equal(hang.error, "timed out after 0.5s");
  assert.equal(exit.leftRunning, 1);
  assert.equal(quiet.pass, true, `src.txt changed during a later step: ${quiet.modified}`);
  await new Promise((r) => setTimeout(r, 900));
  assert.deepEqual(fs.readdirSync(markers), []);
});

test("thousands of scratch writes neither hide a project-file write nor let an incomplete trace pass writes: 0", async (t) => {
  const dir = commit(repo(t, { "out.txt": "same", ".gitignore": "*.tmp\n" }));
  const same = 'const fs = require("fs"); for (let i = 0; i < 6000; i++) fs.writeFileSync("scratch.tmp", String(i)); fs.writeFileSync("out.txt", "same")';
  const many = 'const fs = require("fs"); for (let i = 0; i < 6000; i++) fs.writeFileSync("s" + i + ".tmp", ""); fs.writeFileSync("out.txt", "same")';
  const out = await runCase(dir, { title: "trace", baseline: "HEAD", steps: [{ id: "same", run: [node, "-e", same], expect: { writes: 0, unchanged: true } }, { id: "many", run: [node, "-e", many], expect: { writes: 0 } }] });
  const [repeat, distinct] = out.steps.map((s) => s.results.baseline);
  assert.deepEqual([repeat.writes.tracked, repeat.writes.sameBytes, repeat.writes.complete, repeat.expect], [1, 1, true, { writes: false, unchanged: true }]);
  assert.deepEqual([distinct.writes.complete, distinct.expect.writes], [false, false]);
  assert.match(toText(report(dir, { title: "trace" }, out)), /write trace overflowed/);
});
