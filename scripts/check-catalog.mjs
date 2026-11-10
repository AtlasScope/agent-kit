// Checks that the two plugin catalogs, each kit's manifests and its skill folders agree, so an
// install command on the site can't point at a plugin or skill that isn't there.
//   node scripts/check-catalog.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const exists = (p) => fs.existsSync(path.join(root, p));
const problems = [];
const fail = (msg) => problems.push(msg);

const claude = read(".claude-plugin/marketplace.json");
const codex = read(".agents/plugins/marketplace.json");
const claudeByName = new Map(claude.plugins.map((p) => [p.name, p]));
const codexByName = new Map(codex.plugins.map((p) => [p.name, p]));
const norm = (p) => path.normalize(p).replace(/\/$/, "");

// Both catalogs list the same plugins at the same paths.
for (const name of new Set([...claudeByName.keys(), ...codexByName.keys()])) {
  const c = claudeByName.get(name), x = codexByName.get(name);
  if (!c) { fail(`${name} is in the Codex catalog but not the Claude Code catalog`); continue; }
  if (!x) { fail(`${name} is in the Claude Code catalog but not the Codex catalog`); continue; }
  if (norm(c.source) !== norm(x.source?.path || "")) fail(`${name}: catalogs point at different folders (${c.source} vs ${x.source?.path})`);
}

// Every kit folder with a plugin is listed in the catalogs.
for (const kit of fs.readdirSync(path.join(root, "kits"))) {
  if (exists(`kits/${kit}/plugins/${kit}`) && !claudeByName.has(kit)) fail(`kits/${kit} has a plugin that no catalog lists`);
}

const frontmatterName = (file) => {
  const m = fs.readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---/);
  const n = m && m[1].match(/^name:\s*["']?([^"'\n]+?)["']?\s*$/m);
  return n ? n[1] : null;
};

let skills = 0;
for (const p of claude.plugins) {
  const dir = norm(p.source);
  if (!exists(dir)) { fail(`${p.name}: folder ${dir} doesn't exist`); continue; }
  // Each catalog has a manifest whose name, version and description match the Claude Code catalog.
  for (const [label, file, cat] of [["Claude Code", ".claude-plugin/plugin.json", p], ["Codex", ".codex-plugin/plugin.json", codexByName.get(p.name)]]) {
    if (!cat) continue;
    const mf = `${dir}/${file}`;
    if (!exists(mf)) { fail(`${p.name}: ${label} lists it, but ${mf} is missing`); continue; }
    const m = read(mf);
    if (m.name !== p.name) fail(`${mf}: name is ${m.name}, catalog says ${p.name}`);
    if (p.version && m.version !== p.version) fail(`${mf}: version ${m.version}, catalog says ${p.version}`);
    if (p.description && m.description !== p.description) fail(`${mf}: description differs from the catalog`);
  }
  // Each skill folder has a SKILL.md whose name matches the folder.
  const sdir = path.join(root, dir, "skills");
  // The plugin directory lists only the plugin folder and blocks one without a README of 40+ words.
  const readme = path.join(root, dir, "README.md");
  if (!fs.existsSync(readme)) fail(`${dir}: no README.md in the plugin folder (the directory requires one)`);
  else if (fs.readFileSync(readme, "utf8").replace(/^```[\s\S]*?^```/gm, "").split(/\s+/).filter(Boolean).length < 40)
    fail(`${dir}/README.md: under 40 words outside code blocks (the directory requires 40)`);
  if (!fs.existsSync(sdir)) { fail(`${p.name}: no skills folder`); continue; }
  for (const s of fs.readdirSync(sdir)) {
    const full = path.join(sdir, s);
    if (!fs.statSync(full).isDirectory()) continue;
    const file = path.join(full, "SKILL.md");
    if (!fs.existsSync(file)) { fail(`${dir}/skills/${s} has no SKILL.md`); continue; }
    const n = frontmatterName(file);
    if (n !== s) fail(`${dir}/skills/${s}/SKILL.md: name is ${n ?? "missing"}, folder is ${s}`);
    skills++;
  }
}

// The same skill name in two kits would make `npx skills add --skill <name>` ambiguous.
const seen = new Map();
for (const p of claude.plugins) {
  const sdir = path.join(root, norm(p.source), "skills");
  if (!fs.existsSync(sdir)) continue;
  for (const s of fs.readdirSync(sdir)) {
    if (seen.has(s)) fail(`skill ${s} is in both ${seen.get(s)} and ${p.name}`);
    else seen.set(s, p.name);
  }
}

if (problems.length) {
  console.error(problems.map((p) => `- ${p}`).join("\n"));
  process.exit(1);
}
console.log(`Catalogs OK: ${claude.plugins.length} plugins, ${skills} skills, both catalogs agree.`);
