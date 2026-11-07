const fs = require("fs");
// Usage: node scripts/build_references.cjs <agent-engineering-field-guide.html> plugins/engineering-kit/skills/engineer/references
// Reads the guide's <script type="application/json" id="library"> block and writes the /engineer router's references.
// Leaves out per-project notes, private run links and the owner's private commands, because this plugin is public.
const html = fs.readFileSync(process.argv[2], "utf8");
const m = html.match(/<script type="application\/json" id="library">([\s\S]*?)<\/script>/);
if (!m) throw new Error("No library JSON block in " + process.argv[2]);
const L = JSON.parse(m[1]);
const out = process.argv[3];
const PRIVATE = ["/harsh-review", "/viewport-proof", "/pre-compact", "/recommend"];
const PACK = {
  ek: ["Engineering kit", "This plugin's commands. All run only when typed."],
  tob: ["Trail of Bits", "Security plugins from trailofbits/skills, installed one at a time (see the README). Some run multi-agent workflows, which cost more than a single pass."],
  have: ["Built in", "Claude Code commands and the ci-optimizer plugin."],
  xa: ["Experience architecture", "The experience-architecture plugin in AtlasScope/agent-kit (separate install, see its README): how an app's pages, navigation, URLs and state serve its users. Diagnose and Rethink can start on their own when the topic comes up; all three are read-only until the owner picks a change."],
};
const DESC = { "/code-review": "Correctness review of a diff or PR at an effort level." };
const cell = (s) => String(s).replace(/\|/g, "/").replace(/\n/g, " ");
const ids = (a) => a.map((x) => `\`${x}\``).join(", ");
const pub = (a) => a.filter((c) => !PRIVATE.includes(c));
const area = Object.fromEntries(L.areas.map(([id, name, blurb]) => [id, [name, blurb]]));
const head = "Generated from the Agent Engineering Field Guide by `scripts/build_references.cjs`; do not edit by hand.\n";

let s = "# Start here\n\n" + head;
s += "\n## Symptoms\n\nWhat the user says, mapped to the investigations that usually explain it, best first.\n\n| Symptom | Investigations |\n|---|---|\n";
for (const [sym, list] of L.symptoms) s += `| ${cell(sym)} | ${ids(list)} |\n`;
s += "\n## Skills\n\nEvery skill the router may pick, what it does, and the investigations it can run or follow up. Check it is installed before picking it.\n";
for (const p of L.packs) {
  const [name, desc] = PACK[p.id] || [p.name, p.desc];
  s += `\n### ${name}\n\n${desc}\n\n| Command | What it does | Covers |\n|---|---|---|\n`;
  for (const [cmd, what, cov] of p.rows) if (!PRIVATE.includes(cmd)) s += `| \`${cmd}\` | ${cell(DESC[cmd] || what)} | ${ids(cov)} |\n`;
}
s += "\n## Thinking prompts\n\nShort prompts that change how an agent works on any task. Paste as written.\n";
for (const t of L.meta) s += `\n### ${t.id} ${t.t}\n\nUse: ${t.use.replace(/\s*\/pre-compact does the full version\.?/, "")}\n\n\`\`\`text\n${t.p}\n\`\`\`\n`;
s += "\n## Wrapping an investigation prompt\n\nAn investigation prompt is sent as: the prompt, one mode line, an optional scope line, then the footer.\n\nModes:\n\n";
for (const [k, [label, text]] of Object.entries(L.composer.mode)) s += `- \`${k}\` (${label}): ${text}\n`;
s += "\nScopes:\n\n";
for (const [k, [label, text]] of Object.entries(L.composer.scope)) s += `- \`${k}\` (${label}): ${text || "no line added."}\n`;
s += `\nFooter:\n\n\`\`\`text\n${L.composer.footer}\n\`\`\`\n`;
s += "\n## When to run what\n\n| When | Look at | Keep it lean |\n|---|---|---|\n";
for (const [w, look, lean] of L.routines) s += `| ${cell(w)} | ${cell(look)} | ${cell(lean)} |\n`;
fs.writeFileSync(out + "/start-here.md", s);

let c = "# Investigations\n\n" + head + "\nEach one is a prompt to paste into a fresh agent session. `mode` is the default wrapper from start-here.md (read: read-only; repro: may add a failing test or script). `split` means run it as two passes, find then verify, rather than one long session.\n";
let last = "";
for (const e of L.entries) {
  const a = e.area === "S" ? "T" : e.area;
  if (a !== last) { c += `\n## ${area[a][0]}\n\n${area[a][1]}\n`; last = a; }
  const kit = pub(e.kit);
  c += `\n### ${e.id} ${e.t}\n\n\`\`\`text\n${e.p}\n\`\`\`\n\n`;
  c += `- Finds: ${e.why}\n- Evidence to ask for: ${e.ev}\n- Skip when: ${e.skip}\n${e.blind ? `- Watch for: ${e.blind}\n` : ""}`;
  c += `- Mode: ${e.mode}, ${e.top === "split" ? "split" : "single pass"}, ${e.scope} scope. Needs: ${e.tools}\n`;
  if (kit.length) c += `- Skills: ${ids(kit)}\n`;
  if (e.rel && e.rel.length) c += `- Related: ${ids(e.rel)}\n`;
}
fs.writeFileSync(out + "/investigations.md", c);
console.log(L.entries.length, "investigations", L.meta.length, "thinking prompts", L.symptoms.length, "symptoms", L.packs.length, "packs");
