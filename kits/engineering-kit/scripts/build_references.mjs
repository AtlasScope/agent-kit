#!/usr/bin/env node
// Writes the /engineer router's references from the prompt library, so the prompts live in one place.
// Usage, from the repo root: node kits/engineering-kit/scripts/build_references.mjs
// Reads library/library.json and writes start-here.md and investigations.md in
// kits/engineering-kit/plugins/engineering-kit/skills/engineer/references/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const L = JSON.parse(fs.readFileSync(path.join(root, "library/library.json"), "utf8"));
const out = path.join(root, "kits/engineering-kit/plugins/engineering-kit/skills/engineer/references");
const inv = L.entries.filter((e) => e.sec === "inv");
const INV = new Set(inv.map((e) => e.id));
const think = L.entries.filter((e) => e.sec === "think");
const cmds = L.entries.filter((e) => e.sec === "ecmd");
// Working-style commands ship in their own kit; the router does not pick them.
const ELSEWHERE = ["/harsh-review", "/viewport-proof", "/recommend"];
// Each command group as the router sees it.
const PACK = {
  "Engineering kit": ["Engineering kit", "This plugin's commands. All run only when typed."],
  "Trail of Bits": ["Trail of Bits", "Security plugins from trailofbits/skills, installed one at a time (see the README). Some run multi-agent workflows, which cost more than a single pass."],
  "Experience architecture": ["Experience architecture", "The experience-architecture plugin in AtlasScope/agent-kit (separate install, see its README): how an app's pages, navigation, URLs and state serve its users. Diagnose and Rethink can start on their own when the topic comes up; all three are read-only until the owner picks a change."],
  "Other commands that help": ["Built in", "Claude Code commands and the ci-optimizer plugin."],
};
const cell = (s) => String(s).replace(/\|/g, "/").replace(/\n/g, " ");
const ids = (a) => a.map((x) => `\`${x}\``).join(", ");
const head = "Generated from `library/library.json` by `kits/engineering-kit/scripts/build_references.mjs`; do not edit by hand.\n";

let s = "# Start here\n\n" + head;
s += "\n## Symptoms\n\nWhat the user says, mapped to the investigations that usually explain it, best first.\n\n| Symptom | Investigations |\n|---|---|\n";
for (const [sym, list] of L.symptoms) s += `| ${cell(sym)} | ${ids(list.filter((id) => INV.has(id)))} |\n`;
s += "\n## Skills\n\nEvery skill the router may pick, what it does, and the investigations it can run or follow up. Check it is installed before picking it.\n";
for (const [group, [name, desc]] of Object.entries(PACK)) {
  const rows = cmds.filter((e) => e.group === group && !ELSEWHERE.includes(e.cmd) && e.cmd !== "/engineer");
  if (!rows.length) continue;
  s += `\n### ${name}\n\n${desc}\n\n| Command | What it does | Covers |\n|---|---|---|\n`;
  for (const e of rows) s += `| \`${e.cmd}\` | ${cell(e.why)} | ${ids((e.rel || []).filter((id) => INV.has(id)))} |\n`;
}
for (const e of cmds) if (!PACK[e.group]) throw new Error(`${e.id} is in group "${e.group}", which the router does not know`);
s += "\n## Thinking prompts\n\nShort prompts that change how an agent works on any task. Paste as written.\n";
for (const t of think) s += `\n### ${t.id} ${t.t}\n\n${t.use.replace(/\s*\/pre-compact does the full version\.?/, "")}\n\n\`\`\`text\n${t.p}\n\`\`\`\n`;
s += "\n## Wrapping an investigation prompt\n\nAn investigation prompt is sent as: the prompt, one mode line, an optional scope line, then the footer.\n\nModes:\n\n";
for (const [k, [label, text]] of Object.entries(L.composer.mode)) s += `- \`${k}\` (${label}): ${text}\n`;
s += "\nScopes:\n\n";
for (const [k, [label, text]] of Object.entries(L.composer.scope)) s += `- \`${k}\` (${label}): ${text || "no line added."}\n`;
s += `\nFooter:\n\n\`\`\`text\n${L.composer.footer}\n\`\`\`\n`;
s += "\n## When to run what\n\n| When | Look at | Keep it lean |\n|---|---|---|\n";
for (const [w, look, lean] of L.routines) s += `| ${cell(w)} | ${cell(look)} | ${cell(lean)} |\n`;
fs.writeFileSync(path.join(out, "start-here.md"), s);

let c = "# Investigations\n\n" + head + "\nEach one is a prompt to paste into a fresh agent session. `mode` is the default wrapper from start-here.md (read: read-only; repro: may add a failing test or script). `split` means run it as two passes, find then verify, rather than one long session.\n";
let last = "";
for (const e of inv) {
  if (e.group !== last) { c += `\n## ${e.group}\n\n${L.areaBlurb?.[e.group] || ""}\n`; last = e.group; }
  const kit = (e.kit || []).filter((k) => !ELSEWHERE.includes(k));
  c += `\n### ${e.id} ${e.t}\n\n\`\`\`text\n${e.p}\n\`\`\`\n\n`;
  c += `- Finds: ${e.why}\n- Evidence to ask for: ${e.ev}\n- Skip when: ${e.skip}\n${e.blind ? `- Watch for: ${e.blind}\n` : ""}`;
  c += `- Mode: ${e.mode}, ${e.top === "split" ? "split" : "single pass"}, ${e.scope} scope. Needs: ${e.tools}\n`;
  if (kit.length) c += `- Skills: ${ids(kit)}\n`;
  if (e.rel?.length) c += `- Related: ${ids(e.rel)}\n`;
}
fs.writeFileSync(path.join(out, "investigations.md"), c);
console.log(`${inv.length} investigations, ${think.length} thinking prompts, ${L.symptoms.length} symptoms`);
