// library/check.mjs must fail on a stale generated reference and leave every tracked file alone.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REFS = {
  engineer: "kits/engineering-kit/plugins/engineering-kit/skills/engineer/references/start-here.md",
  design: "kits/design-kit/plugins/design-kit/skills/design/references/catalog.md",
  database: "kits/engineering-kit/plugins/engineering-kit/skills/database/references/prompts.md",
};

// A temp copy of just what the check reads, so the real tree is never touched.
function copyRepo() {
  const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "check-ro-"));
  for (const d of ["library", "kits", "scripts"]) {
    fs.cpSync(path.join(repo, d), path.join(dir, d), { recursive: true, filter: (s) => !s.includes("node_modules") });
  }
  return dir;
}
const run = (dir, script, ...args) => spawnSync(process.execPath, [path.join(dir, script), ...args], { encoding: "utf8" });
const snapshot = (dir) => Object.fromEntries(Object.values(REFS).concat("library/dist/prompt-library.md").map((f) => [f, fs.readFileSync(path.join(dir, f))]));

for (const [name, rel, rebuild] of [
  ["engineer", REFS.engineer, "kits/engineering-kit/scripts/build_references.mjs"],
  ["design", REFS.design, "kits/design-kit/scripts/build_references.mjs"],
  ["database", REFS.database, "kits/engineering-kit/scripts/build_database_references.mjs"],
]) {
  test(`stale ${name} reference fails the check, stays stale, and a build repairs it`, () => {
    const dir = copyRepo();
    try {
      assert.equal(run(dir, "library/check.mjs").status, 0, "fresh copy passes");
      const file = path.join(dir, rel);
      fs.appendFileSync(file, "STALE\n");
      const stale = snapshot(dir);
      for (let i = 0; i < 2; i++) {
        const r = run(dir, "library/check.mjs");
        assert.notEqual(r.status, 0, `run ${i + 1} fails`);
        assert.match(r.stderr, new RegExp(path.basename(rel).replace(".", "\\.")));
        assert.match(r.stderr, /run node /);
        assert.deepEqual(snapshot(dir), stale, "tracked files unchanged");
      }
      assert.equal(run(dir, rebuild).status, 0);
      assert.equal(run(dir, "library/check.mjs").status, 0, "passes after an explicit build");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}

test("a missing reference fails without being created", () => {
  const dir = copyRepo();
  try {
    fs.rmSync(path.join(dir, REFS.database));
    const r = run(dir, "library/check.mjs");
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /prompts\.md is missing/);
    assert.equal(fs.existsSync(path.join(dir, REFS.database)), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("a generator error is a failure and leaves tracked files alone", () => {
  const dir = copyRepo();
  try {
    fs.writeFileSync(path.join(dir, "kits/design-kit/scripts/build_references.mjs"), "throw new Error('boom');\n");
    const before = snapshot(dir);
    const r = run(dir, "library/check.mjs");
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /build_references\.mjs failed/);
    assert.deepEqual(snapshot(dir), before);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
