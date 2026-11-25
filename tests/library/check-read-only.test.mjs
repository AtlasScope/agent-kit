// The verifier must detect stale/missing output and generator failure without repairing the checkout.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const design = "kits/design-kit/plugins/design-kit/skills";
const engineering = "kits/engineering-kit/plugins/engineering-kit/skills";
const refs = [
  `${engineering}/engineer/references/start-here.md`,
  `${design}/design/references/catalog.md`,
  `${engineering}/database/references/prompts.md`,
];
const run = (dir, script) => spawnSync(process.execPath, [path.join(dir, script)], { encoding: "utf8" });
const snapshot = (dir) => Object.fromEntries([...refs, "library/dist/prompt-library.md"].map((f) => {
  const file = path.join(dir, f);
  return [f, fs.existsSync(file) ? fs.readFileSync(file) : null];
}));

test("library verifier is read-only on stale outputs, missing files and generator failure", () => {
  const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "check-ro-"));
  try {
    // Copy the generator inputs and generated outputs, not the entire plugin/fixture collection.
    for (const p of ["library", "kits/design-kit/scripts", "kits/engineering-kit/scripts",
      `${design}/keen/SKILL.md`, `${design}/keen/jobs`, `${design}/design/references`,
      `${engineering}/engineer/references`, `${engineering}/database/references`]) {
      const target = path.join(dir, p);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.cpSync(path.join(repo, p), target, { recursive: true });
    }

    const good = run(dir, "library/check.mjs");
    assert.equal(good.status, 0, good.stderr);

    // An unscored note is valid; the inventory must render a blank score, not crash or invent one.
    const auditPath = path.join(dir, "library/audit.json");
    const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
    const id = Object.keys(audit.entries)[0];
    const previous = audit.entries[id];
    audit.entries[id] = { note: "A useful observation without a numeric score" };
    fs.writeFileSync(auditPath, JSON.stringify(audit));
    const build = run(dir, "library/build.mjs");
    assert.equal(build.status, 0, build.stderr);
    const row = fs.readFileSync(path.join(dir, "library/dist/inventory.csv"), "utf8").split("\n").find((line) => line.startsWith(id + ","));
    assert.ok(row?.includes("A useful observation without a numeric score"));
    assert.doesNotMatch(row, /0\/14 \(\)/);
    const unscored = run(dir, "library/check.mjs");
    assert.equal(unscored.status, 0, unscored.stderr);
    audit.entries[id] = previous;
    fs.copyFileSync(path.join(repo, "library/audit.json"), auditPath);
    fs.copyFileSync(path.join(repo, "library/dist/inventory.csv"), path.join(dir, "library/dist/inventory.csv"));

    for (const p of refs) fs.appendFileSync(path.join(dir, p), "STALE\n");
    const stale = snapshot(dir);
    const failed = run(dir, "library/check.mjs");
    assert.notEqual(failed.status, 0);
    for (const p of refs) assert.ok(failed.stderr.includes(path.basename(p)), failed.stderr);
    assert.match(failed.stderr, /run node /);
    assert.deepEqual(snapshot(dir), stale);

    // Explicit rebuilds are the only repair path.
    for (const script of ["kits/design-kit/scripts/build_references.mjs", "kits/engineering-kit/scripts/build_references.mjs",
      "kits/engineering-kit/scripts/build_database_references.mjs"]) {
      const result = run(dir, script);
      assert.equal(result.status, 0, result.stderr);
    }
    const rebuilt = run(dir, "library/check.mjs");
    assert.equal(rebuilt.status, 0, rebuilt.stderr);

    fs.rmSync(path.join(dir, refs[2]));
    const missing = snapshot(dir);
    const missingResult = run(dir, "library/check.mjs");
    assert.notEqual(missingResult.status, 0);
    assert.match(missingResult.stderr, /prompts\.md is missing/);
    assert.deepEqual(snapshot(dir), missing);

    fs.copyFileSync(path.join(repo, refs[2]), path.join(dir, refs[2]));
    fs.writeFileSync(path.join(dir, "kits/design-kit/scripts/build_references.mjs"), "throw new Error('boom');\n");
    const before = snapshot(dir);
    const error = run(dir, "library/check.mjs");
    assert.notEqual(error.status, 0);
    assert.match(error.stderr, /build_references\.mjs failed/);
    assert.deepEqual(snapshot(dir), before);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
