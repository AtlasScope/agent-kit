// A copy of Keen's page files in another skill that drifts from Keen's is caught, and the sync fixes it.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FILES, KEEN, drift, syncPage } from "../scripts/sync-page.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("a drifted copy of the page is reported with the command that fixes it, and the sync fixes it", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sync-page-"));
  for (const rel of FILES) fs.cpSync(path.join(repo, KEEN, rel), path.join(root, KEEN, rel));
  const skill = "kits/other-kit/plugins/other-kit/skills/probe";
  fs.mkdirSync(path.join(root, skill), { recursive: true });
  fs.writeFileSync(path.join(root, skill, "SKILL.md"), "---\nname: probe\n---\n");
  assert.deepEqual(drift(root), [], "a skill with no copy is fine");

  assert.deepEqual(syncPage(path.join(root, skill), root), FILES);
  assert.deepEqual(drift(root), []);
  fs.appendFileSync(path.join(root, skill, "scripts/evidence.mjs"), "\n// edited by hand\n");
  fs.writeFileSync(path.join(root, skill, "references/evidence.md"), "old guidance\n");
  assert.deepEqual(drift(root), [
    `${skill}/scripts/evidence.mjs differs from Keen's copy. Run: node scripts/sync-page.mjs ${skill}`,
    `${skill}/references/evidence.md differs from Keen's copy. Run: node scripts/sync-page.mjs ${skill}`,
  ]);
  syncPage(path.join(root, skill), root);
  assert.deepEqual(drift(root), []);
  assert.throws(() => syncPage(path.join(root, KEEN), root), /Keen itself/);
  assert.throws(() => syncPage(path.join(root, "kits"), root), /not a skill folder/);
});
