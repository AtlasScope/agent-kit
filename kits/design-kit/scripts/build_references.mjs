#!/usr/bin/env node
// Writes the /design router's references from the prompt library, so the catalog lives in one place.
// Usage, from the repo root: node kits/design-kit/scripts/build_references.mjs
// Reads library/library.json (design commands, recipes, stages and overlaps) and writes catalog.md,
// recipes.md and situations.md in kits/design-kit/plugins/design-kit/skills/design/references/.
// Impeccable's helper agents are not library entries (nobody types them); they come from impeccable-helpers.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const L = JSON.parse(fs.readFileSync(path.join(root, "library/library.json"), "utf8"));
const helpers = JSON.parse(fs.readFileSync(path.join(here, "impeccable-helpers.json"), "utf8"));
const out = path.join(root, "kits/design-kit/plugins/design-kit/skills/design/references");
const head = "Generated from `library/library.json` by `kits/design-kit/scripts/build_references.mjs`; do not edit by hand.";
// Working-style commands ship in their own kit; the router lists only itself in its own pack.
const ELSEWHERE = ["/harsh-review", "/viewport-proof"];
const MODE = { "Changes code": "edits", "Report only": "report", Advice: "advice" };
const cell = (s) => String(s).replace(/\|/g, "/").replace(/\n/g, " ");

const dcmd = L.entries.filter((e) => e.sec === "dcmd");
const groups = [];
for (const e of dcmd) {
  let g = groups.find((x) => x.name === e.group);
  if (!g) groups.push((g = { name: e.group, first: e, rows: [] }));
  if (!ELSEWHERE.includes(e.cmd)) g.rows.push(e);
}
let cat = `# Design skill catalog\n\n${head}\n\nEvery design skill this library knows, by pack. Skills that ship in the design-kit plugin may be namespaced \`design-kit:<name>\`. \`mode\` says what a skill does to files: edits, report (reads only), advice, auto (runs inside another skill, never typed).\n`;
const pack = (name, desc, best, skip, rows) => `\n## ${name}\n\n${desc}\n\n- Best for: ${best}\n- Skip it for: ${skip}\n\n| Command | What it does | Mode |\n|---|---|---|\n` + rows.map(([c, w, m]) => `| \`${c}\` | ${cell(w)} | ${m} |\n`).join("");
for (const g of groups) {
  const router = g.name === "Routers and working-style";
  const rows = g.rows.map((e) => {
    if (!MODE[e.dmode]) throw new Error(`${e.id} has dmode "${e.dmode}", which the design catalog cannot show`);
    return [e.cmd, e.why, MODE[e.dmode]];
  });
  cat += router
    ? pack("Router", "The design-kit router itself.", "Not knowing which design skill fits the job.", "When you already know the skill you want.", rows)
    : pack(g.name, g.first.gnote, g.first.best, g.first.skipw, rows);
  if (g.name === "Impeccable") cat += pack("Impeccable helper agents", helpers.desc, helpers.best, helpers.skip, helpers.rows.map(([c, w]) => [c, w, "auto"]));
}
fs.writeFileSync(path.join(out, "catalog.md"), cat);

let rec = `# Recipes\n\n${head}\n\nNamed chains of skills. Run one step per turn and show the result before the next, unless the user says to run it through.\n`;
for (const e of L.entries.filter((x) => x.sec === "recipe")) rec += `\n## ${e.t}\n\n${e.why}\n\n` + e.steps.map(([c, n], i) => `${i + 1}. \`${c}\`: ${n}`).join("\n") + "\n";
fs.writeFileSync(path.join(out, "recipes.md"), rec);

let sit = `# Situations and overlaps\n\n${head}\n\nWhat the user says, mapped to the usual pick and the alternative. Then how to choose between skills that cover the same job.\n`;
for (const [, nm, blurb, list] of L.stages) sit += `\n## ${nm}\n\n${blurb}\n\n| Situation | Pick | Or |\n|---|---|---|\n` + list.map(([w, a, b]) => `| ${w} | \`${a}\` | ${b ? "`" + b + "`" : ""} |`).join("\n") + "\n";
sit += "\n## Which one, when several fit\n";
for (const [job, opts, when] of L.overlaps) sit += `\n### ${job}\n\n` + opts.map(([c, n]) => `- \`${c}\`: ${n}`).join("\n") + `\n\nPick: ${when}\n`;
fs.writeFileSync(path.join(out, "situations.md"), sit);
console.log(`${groups.length} packs, ${dcmd.length} commands, ${L.stages.length} stages, ${L.overlaps.length} overlaps`);
