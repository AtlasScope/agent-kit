const fs = require("fs");
// Usage: node build_references.cjs <guide.html or extracted script.js> <references-dir> [--public]
// --public drops per-machine notes and the owner's private skills, for the shared design-kit plugin.
let src = fs.readFileSync(process.argv[2], "utf8");
if (src.includes("<script>")) src = src.slice(src.indexOf("<script>") + 8, src.lastIndexOf("</script>"));
const cut = src.indexOf("function psList");
const data = src.slice(0, src.indexOf("// Where each pack is installed"));
const { PACKS, STAGES, FLOWS, OVERLAPS, MODES } = new Function(data.replace(/const tint =[^\n]*\n/, "") + "; return { PACKS, STAGES, FLOWS, OVERLAPS, MODES };")();
const out = process.argv[3];
const PUBLIC = process.argv.includes("--public");
const PRIVATE_ROWS = ["/harsh-review", "/image", "/viewport-proof", "/page-design-studio", "/style-studio"];
const name = (c) => c.replace(/\s*<.*$/, "").trim();
let cat = "# Design skill catalog\n\nEvery design skill this library knows, by pack. Generated from the Design Skills Field Guide; update both together. Skills that ship in the design-kit plugin may be namespaced `design-kit:<name>`. `mode` says what a skill does to files: edits, report (reads only), advice, auto (runs inside another skill, never typed).\n";
for (const p of PACKS) {
  const pname = PUBLIC && p.id === "yours" ? "Router" : p.name;
  const pdesc = PUBLIC && p.id === "yours" ? "The design-kit router itself." : p.desc;
  cat += `\n## ${pname}\n\n${pdesc}\n\n- Best for: ${PUBLIC && p.id === "yours" ? "Not knowing which design skill fits the job." : p.best}\n- Skip it for: ${PUBLIC && p.id === "yours" ? "When you already know the skill you want." : p.skip}\n` + (p.note && !PUBLIC ? `- Note: ${p.note}\n` : "") + "\n| Command | What it does | Mode |\n|---|---|---|\n";
  const SKIP = ["example-skills:mcp-builder", "example-skills:skill-creator", "example-skills:doc-coauthoring", "example-skills:internal-comms", "example-skills:pptx"];
  for (const [g, rows] of p.groups) for (const [c, w, , m] of rows) if (!SKIP.includes(c) && !(PUBLIC && PRIVATE_ROWS.includes(c))) cat += `| \`${c}\` | ${w.replace(/\|/g, "/")} | ${m} |\n`;
}
fs.writeFileSync(out + "/catalog.md", cat);
let rec = "# Recipes\n\nNamed chains of skills. Run one step per turn and show the result before the next, unless the user says to run it through. Generated from the Design Skills Field Guide.\n";
for (const [t, why, steps] of FLOWS) {
  rec += `\n## ${t}\n\n${why}\n\n` + steps.map(([c, n], i) => `${i + 1}. \`${c}\`: ${n}`).join("\n") + "\n";
}
fs.writeFileSync(out + "/recipes.md", rec);
let sit = "# Situations and overlaps\n\nWhat the user says, mapped to the usual pick and the alternative. Then how to choose between skills that cover the same job. Generated from the Design Skills Field Guide.\n";
for (const [, nm, blurb, list] of STAGES) {
  sit += `\n## ${nm}\n\n${blurb}\n\n| Situation | Pick | Or |\n|---|---|---|\n` + list.map(([w, a, b]) => `| ${w} | \`${a}\` | ${b ? "`" + b + "`" : ""} |`).join("\n") + "\n";
}
sit += "\n## Which one, when several fit\n";
for (const [job, opts, when] of OVERLAPS) sit += `\n### ${job}\n\n` + opts.map(([c, n]) => `- \`${c}\`: ${n}`).join("\n") + `\n\nPick: ${when}\n`;
fs.writeFileSync(out + "/situations.md", sit);
console.log(PACKS.length, "packs", FLOWS.length, "recipes", STAGES.length, "stages", OVERLAPS.length, "overlaps");
