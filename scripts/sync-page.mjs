#!/usr/bin/env node
// The AtlasScope page and its evidence contract live in Keen. Kits install separately, so a skill in another
// kit that publishes to the page carries its own copy of these files rather than importing across plugins.
//
//   node scripts/sync-page.mjs <skill-dir>    copy Keen's page files into that skill (scripts/ and references/)
//
// scripts/check-catalog.mjs fails when any copy differs from Keen's.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const KEEN = "kits/design-kit/plugins/design-kit/skills/keen";
export const FILES = ["scripts/worksheet.mjs", "scripts/evidence.mjs", "references/evidence.md"];

/** Copy Keen's page files into a skill folder. Returns the files written, relative to the skill. */
export function syncPage(skillDir, root = repo) {
  const dir = path.resolve(skillDir);
  if (dir === path.join(root, KEEN)) throw new Error("That is Keen itself: its files are the originals.");
  if (!fs.existsSync(path.join(dir, "SKILL.md"))) throw new Error(`${skillDir} is not a skill folder (it has no SKILL.md).`);
  for (const rel of FILES) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.copyFileSync(path.join(root, KEEN, rel), path.join(dir, rel));
  }
  return FILES;
}

/** Every copy of a page file outside Keen that differs from Keen's, with the command that fixes it. */
export function drift(root = repo) {
  const out = [];
  const kits = path.join(root, "kits");
  const dirs = (p) => (fs.existsSync(p) ? fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : []);
  for (const kit of dirs(kits)) for (const plugin of dirs(path.join(kits, kit, "plugins"))) for (const skill of dirs(path.join(kits, kit, "plugins", plugin, "skills"))) {
    const rel = ["kits", kit, "plugins", plugin, "skills", skill].join("/");
    if (rel === KEEN) continue;
    for (const file of FILES) {
      const copy = path.join(root, rel, file);
      if (fs.existsSync(copy) && !fs.readFileSync(copy).equals(fs.readFileSync(path.join(root, KEEN, file)))) out.push(`${rel}/${file} differs from Keen's copy. Run: node scripts/sync-page.mjs ${rel}`);
    }
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const target = process.argv[2];
  if (!target) { console.error("Usage: node scripts/sync-page.mjs <skill-dir>"); process.exit(2); }
  try { for (const rel of syncPage(target)) console.log(`COPIED: ${rel}`); } catch (error) { console.error(error.message); process.exit(1); }
}
