// The verifier must detect stale/missing output and generator failure without repairing the checkout.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { generatedOutputs } from "../../library/build.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const design = "kits/design-kit/plugins/design-kit/skills";
const engineering = "kits/engineering-kit/plugins/engineering-kit/skills";
const refs = [
  `${engineering}/engineer/references/start-here.md`,
  `${design}/design/references/catalog.md`,
  `${engineering}/database/references/prompts.md`,
];
const run = (dir, script, ...args) => spawnSync(process.execPath, [path.join(dir, script), ...args], { encoding: "utf8" });
const snapshot = (dir) => Object.fromEntries(generatedOutputs.flatMap(o => o.files.map(f => path.join(o.dir, f))).map((f) => {
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

    // A current inventory is an optional view of the source, not an input to validation.
    const inventory = path.join(dir, "library/dist/inventory.csv");
    fs.rmSync(inventory, { force: true });
    const build = run(dir, "library/build.mjs", "--inventory");
    assert.equal(build.status, 0, build.stderr);
    const csv = fs.readFileSync(inventory, "utf8");
    assert.match(csv, /^id,section,family,title,changes,needs,source,purpose,you_get,replaced_by,closest_job,reviewed\n/);
    assert.ok(csv.includes("A01,"));
    fs.rmSync(inventory);
    const noInventory = run(dir, "library/check.mjs");
    assert.equal(noInventory.status, 0, noInventory.stderr);
    assert.equal(fs.existsSync(inventory), false);

    for (const p of refs) fs.appendFileSync(path.join(dir, p), "STALE\n");
    const stale = snapshot(dir);
    const failed = run(dir, "library/check.mjs");
    assert.notEqual(failed.status, 0);
    for (const p of refs) assert.ok(failed.stderr.includes(path.basename(p)), failed.stderr);
    assert.match(failed.stderr, /run node /);
    assert.deepEqual(snapshot(dir), stale);

    const result = run(dir, "library/build.mjs", "--all");
    assert.equal(result.status, 0, result.stderr);
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
    const failedBuild = run(dir, "library/build.mjs", "--all");
    assert.notEqual(failedBuild.status, 0);
    assert.deepEqual(snapshot(dir), before, "a failed generator must not write tracked outputs");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
