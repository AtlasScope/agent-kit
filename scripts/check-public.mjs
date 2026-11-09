#!/usr/bin/env node
// Fails when shipped files carry one person's setup: a first name used as "the user",
// a home-folder path, or a note about one machine. Public skills must work for anyone.
// Usage: node scripts/check-public.mjs   Exits 1 and lists each hit with file and line.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN = ["README.md", "CREDITS.md", "GLOSSARY.md", "CONTRIBUTING.md", "SECURITY.md", "kits", "library/library.json"];
const SKIP = /node_modules|\/fixtures\/|\/tests\/|huevaluechroma|THIRD_PARTY\.md$/;
const EXT = /\.(md|json|ya?ml|txt|sh|mjs|cjs|js)$/;
const RULES = [
  [/\bAustin\b(?<!Texas at Austin)/, "names the author as the user; say \"the user\""],
  [/austinwhitley|austindwhitley/i, "personal account or domain"],
  [/\/Users\/(?!YOU\b)[a-z][\w.-]*\//, "a home-folder path from one machine"],
  [/\b(on this Mac|on my Mac)\b/i, "a note about one machine"],
  [/\b(Pullwise|AltsData|AltsHarbor)\b/, "a private project name"],
];

const files = [];
const walk = (p) => {
  const abs = path.join(root, p);
  if (!fs.existsSync(abs) || SKIP.test(p)) return;
  if (fs.statSync(abs).isDirectory()) for (const n of fs.readdirSync(abs)) walk(path.join(p, n));
  else if (EXT.test(p)) files.push(p);
};
SCAN.forEach(walk);

const hits = [];
for (const f of files) {
  fs.readFileSync(path.join(root, f), "utf8").split("\n").forEach((line, i) => {
    for (const [re, why] of RULES) if (re.test(line)) hits.push(`${f}:${i + 1}  ${why}\n    ${line.trim().slice(0, 140)}`);
  });
}
if (hits.length) {
  console.error(`${hits.length} personal reference(s) in shipped files:\n\n${hits.join("\n")}`);
  process.exit(1);
}
console.log(`No personal references in ${files.length} shipped files.`);
