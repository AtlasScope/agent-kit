#!/usr/bin/env node
// Checks the prompt library's source before a build: IDs, links, the database section and the built files.
// Usage: node library/check.mjs [--overlay <private.json>]   Exits 1 and lists every problem it finds.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const lib = JSON.parse(fs.readFileSync(path.join(here, "library.json"), "utf8"));
const E = lib.entries;
const BY = new Map(E.map((e) => [e.id, e]));
const problems = [];
const fail = (m) => problems.push(m);

// IDs are unique and every link points at a real entry.
const seen = new Set();
for (const e of E) { if (seen.has(e.id)) fail(`Duplicate ID ${e.id}`); seen.add(e.id); }
for (const e of E) for (const r of e.rel || []) if (!BY.has(r)) fail(`${e.id} links to missing ${r}`);
for (const [txt, ids] of [...lib.symptoms, ...(lib.dbSymptoms || [])]) for (const id of ids) if (!BY.has(id)) fail(`Symptom "${txt}" names missing ${id}`);

// The page's structure: areas list each entry at most once, the front door and the "Agent Kit job"
// names point at real things, and Keen's groups exist in Keen's own job list.
const keenSkill = fs.readFileSync(path.join(here, "../kits/design-kit/plugins/design-kit/skills/keen/SKILL.md"), "utf8");
const keenJobs = new Set([...keenSkill.matchAll(/^\| `([a-z]+)` \|/gm)].map((m) => "K:" + m[1]));
const keenGroups = new Set([...keenSkill.matchAll(/^\*\*(.+)\*\*$/gm)].map((m) => "K:" + m[1]));
const known = (id) => BY.has(id) || keenJobs.has(id) || (lib.v3?.recipes || []).some((r) => r.id === id);
const inArea = new Map();
for (const a of lib.areas || []) {
  if (!a.key || !a.title || !a.blurb || !a.groups?.length) fail(`Area "${a.title || a.key}" needs a key, title, blurb and groups`);
  for (const [title, ref] of a.groups) {
    if (typeof ref === "string") { if (!keenGroups.has(ref)) fail(`Area "${a.title}" group "${title}" names Keen group ${ref}, which Keen's SKILL.md does not have`); continue; }
    for (const id of ref) {
      if (!BY.has(id)) fail(`Area "${a.title}" names missing ${id}`);
      if (inArea.has(id)) fail(`${id} is in two areas: "${inArea.get(id)}" and "${a.title}"`);
      inArea.set(id, a.title);
    }
  }
}
for (const [txt, ids] of lib.front || []) {
  if (ids.length > 3) fail(`Front door "${txt}" lists ${ids.length} entries; three at most`);
  for (const id of ids) if (!known(id)) fail(`Front door "${txt}" names missing ${id}`);
}
const knownCmds = new Set([...E.map((e) => e.cmd).filter(Boolean), ...[...keenJobs].map((k) => "/keen " + k.slice(2)), "/keen"]);
for (const [id, cmd] of Object.entries(lib.closest || {})) {
  if (!BY.has(id)) fail(`closest names missing ${id}`);
  if (inArea.has(id)) fail(`${id} is in an area and also names a closest Agent Kit job; only Other tools entries do`);
  if (!knownCmds.has(cmd)) fail(`${id} names ${cmd} as its Agent Kit job, which is not a command in the library or Keen`);
}
// A hidden entry points at what replaces it on the page: another entry or one of the page's recipes.
const pageRecipes = new Set((lib.v3?.recipes || []).map((r) => r.id));
for (const [id, same] of Object.entries(lib.notShown || {})) if (!BY.has(id) || !(BY.has(same) || pageRecipes.has(same))) fail(`notShown ${id} -> ${same} names a missing entry`);
// The page's categories, skill groups and recipes name real things, each prompt in one category.
const V3 = lib.v3;
if (V3) {
  const inCat = new Map();
  for (const c of V3.promptCats) for (const id of c.ids) { if (!BY.has(id)) fail(`Prompt category "${c.title}" names missing ${id}`); if (inCat.has(id)) fail(`${id} is in two prompt categories`); inCat.set(id, c.title); }
  for (const g of V3.skillGroups) for (const id of g.ids) if (!BY.has(id)) fail(`Skill group "${g.title}" names missing ${id}`);
  for (const g of V3.recipeGroups) for (const id of g.ids) if (!pageRecipes.has(id) && !BY.has(id)) fail(`Recipe group "${g.title}" names missing ${id}`);
  for (const r of V3.recipes) for (const [ref] of r.steps) if (/^[A-Z]+\d+$/.test(ref) && !BY.has(ref)) fail(`Recipe "${r.t}" names missing step ${ref}`); else if (ref.startsWith("K:") && !keenJobs.has(ref)) fail(`Recipe "${r.t}" names Keen job ${ref}, which Keen does not have`);
  for (const id of Object.keys(V3.when)) if (!BY.has(id) && !pageRecipes.has(id)) fail(`A "Use it when" line names missing ${id}`);
}
for (const id of Object.keys(lib.tried || {})) if (!known(id)) fail(`tried names missing ${id}`);

// The database section: PG00 to PG17 in order, each complete, plus workflows whose steps resolve.
const db = E.filter((e) => e.sec === "db");
const pg = db.filter((e) => !e.flow).map((e) => e.id);
const want = Array.from({ length: 18 }, (_, i) => "PG" + String(i).padStart(2, "0"));
if (pg[0] !== "PG00") fail("PG00 must come first in the database section");
if ([...pg].sort().join() !== want.join()) fail(`Database prompts should be exactly PG00 to PG17, found ${pg.join(", ")}`);
for (const e of db.filter((x) => !x.flow)) {
  for (const k of ["t", "p", "why", "ev", "skip", "avoid", "tools", "plat", "tags", "mode"]) if (!e[k]) fail(`${e.id} is missing ${k}`);
  if (e.mode !== "read") fail(`${e.id} should default to read-only`);
  for (const k of e.refs || []) if (!lib.dbTools?.[k]) fail(`${e.id} names unknown tool ${k}`);
}
for (const e of db.filter((x) => x.flow)) {
  for (const [label, ids] of e.flow) for (const id of ids) if (!BY.has(id)) fail(`${e.id} step "${label}" names missing ${id}`);
  for (const [, ids] of e.flow) for (const id of ids) if (!e.p.includes(BY.get(id)?.p || "\u0000")) fail(`${e.id} copy text leaves out the full prompt for ${id}`);
}
// Links the database brief asks to work both ways.
const both = { PG01: ["D02"], PG03: ["D05"], PG04: ["D03"], PG05: ["A04", "R05"], PG06: ["P04"], PG08: ["R01"], PG10: ["A03"], PG13: ["P03"], PG15: ["I02"], PG16: ["M05", "M07"], PG17: ["G02"] };
for (const [a, list] of Object.entries(both)) for (const b of list) {
  if (!(BY.get(a)?.rel || []).includes(b)) fail(`${a} should link to ${b}`);
  if (!(BY.get(b)?.rel || []).includes(a)) fail(`${b} should link back to ${a}`);
}
// Every entry says whether it changes code: investigations and database prompts with mode,
// everything else with dmode from a fixed list, so cards and filters can answer "Changes code?".
const MODES = ["read", "repro", "change"];
const DMODES = ["Changes code", "Report only", "Advice", "Asks before changing", "Writes notes only", "Depends on the task"];
for (const e of E) {
  if (e.mode ? !MODES.includes(e.mode) : !DMODES.includes(e.dmode)) fail(`${e.id} needs mode (${MODES.join("/")}) or dmode (${DMODES.join(" / ")})`);
}
// The editorial audit (library/audit.json) scores every entry and groups overlapping ones.
const audit = JSON.parse(fs.readFileSync(path.join(here, "audit.json"), "utf8"));
const FLAGS = ["personal", "rewrite", "hide"];
for (const e of E) {
  const a = audit.entries[e.id];
  if (!a) { fail(`${e.id} has no editorial audit row in library/audit.json`); continue; }
  if (!/^[012]{7}$/.test(a.s)) fail(`${e.id} audit score must be 7 digits from 0 to 2 (${audit.criteria.join(", ")})`);
  else if ((a.s.includes("0") || [...a.s].reduce((t, d) => t + +d, 0) <= 10) && !a.note) fail(`${e.id} has a 0 or a total of 10 or less and needs a note saying why`);
  for (const f of a.flags || []) if (!FLAGS.includes(f)) fail(`${e.id} has unknown audit flag ${f}`);
  if (a.dupOf && !BY.has(a.dupOf)) fail(`${e.id} is marked a duplicate of missing ${a.dupOf}`);
}
for (const id of Object.keys(audit.entries)) if (!BY.has(id)) fail(`library/audit.json scores missing entry ${id}`);
const inCluster = new Map();
for (const c of audit.clusters) {
  for (const id of [c.primary, ...c.alts.map((x) => x.id)]) {
    if (!BY.has(id)) fail(`Cluster "${c.job}" names missing ${id}`);
    if (inCluster.has(id)) fail(`${id} is in two clusters: "${inCluster.get(id)}" and "${c.job}"`);
    inCluster.set(id, c.job);
  }
  for (const x of c.alts) if (!x.when) fail(`Cluster "${c.job}" lists ${x.id} without saying when to choose it`);
  if ((audit.entries[c.primary]?.flags || []).includes("hide")) fail(`Cluster "${c.job}" recommends ${c.primary}, which is hidden`);
}
// Design overlaps in library.json name commands; each must be a real entry.
const first = (c) => String(c).split(/\s/)[0];
const CMDS = new Set(E.map((e) => first(e.cmd || e.t)));
for (const [job, opts] of lib.overlaps || []) for (const [cmd] of opts) if (!CMDS.has(first(cmd))) fail(`Overlap "${job}" names ${cmd}, which is not an entry`);

// Portable entries must not carry one person's setup.
for (const e of E) {
  const text = JSON.stringify(e);
  if (/this Mac|on my Mac|austinwhitley|claude\.ai\/artifact/i.test(text)) fail(`${e.id} carries personal setup: move it to the private overlay`);
}

// The built files match the source. Everything is generated into scratch folders and compared;
// nothing here writes to a tracked path, so a stale file fails the check and stays stale.
const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || process.env.TEMP || "/tmp"), "plcheck-"));
const gen = (script, ...args) => {
  try { execFileSync(process.execPath, [script, ...args], { stdio: "pipe" }); return true; }
  catch (err) { fail(`${path.relative(path.join(here, ".."), script)} failed: ${String(err.stderr || err.message).trim().split("\n").slice(-1)[0]}`); return false; }
};
const compare = (dir, files, tracked, rebuild) => {
  for (const f of files) {
    const fresh = path.join(dir, f), have = path.join(tracked, f);
    const rel = path.relative(path.join(here, ".."), have);
    if (!fs.existsSync(have)) fail(`${rel} is missing: run ${rebuild}`);
    else if (!fs.existsSync(fresh)) fail(`${rel} was not generated: run ${rebuild}`);
    else if (!fs.readFileSync(fresh).equals(fs.readFileSync(have))) fail(`${rel} is out of date: run ${rebuild}`);
  }
};
const kits = path.join(here, "../kits");
try {
  const dist = path.join(tmp, "dist");
  if (gen(path.join(here, "build.mjs"), "--out", dist)) compare(dist, ["prompt-library.html", "prompt-library.md", "inventory.csv"], path.join(here, "dist"), "node library/build.mjs");
  // The /engineer router's references come from this library too.
  const eng = path.join(tmp, "engineer");
  if (gen(path.join(kits, "engineering-kit/scripts/build_references.mjs"), "--out", eng)) compare(eng, ["start-here.md", "investigations.md"], path.join(kits, "engineering-kit/plugins/engineering-kit/skills/engineer/references"), "node kits/engineering-kit/scripts/build_references.mjs");
  // And the /design router's.
  const des = path.join(tmp, "design");
  if (gen(path.join(kits, "design-kit/scripts/build_references.mjs"), "--out", des)) compare(des, ["catalog.md", "recipes.md", "situations.md"], path.join(kits, "design-kit/plugins/design-kit/skills/design/references"), "node kits/design-kit/scripts/build_references.mjs");
  // And the /database router's.
  const dbr = path.join(tmp, "database");
  if (gen(path.join(kits, "engineering-kit/scripts/build_database_references.mjs"), "--out", dbr)) compare(dbr, ["prompts.md"], path.join(kits, "engineering-kit/plugins/engineering-kit/skills/database/references"), "node kits/engineering-kit/scripts/build_database_references.mjs");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

// An overlay, if given, must still apply cleanly.
const i = process.argv.indexOf("--overlay");
if (i > 0) {
  const ovOut = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || process.env.TEMP || "/tmp"), "plcheck-ov-"));
  try { execFileSync(process.execPath, [path.join(here, "build.mjs"), "--overlay", process.argv[i + 1], "--out", ovOut], { stdio: "pipe" }); }
  catch (err) { fail("Overlay does not apply: " + String(err.stderr || err.message).split("\n").find((l) => l.includes("Error"))); }
  fs.rmSync(ovOut, { recursive: true, force: true });
}

if (problems.length) { console.error(problems.map((p) => "- " + p).join("\n")); process.exit(1); }
console.log(`Library OK: ${E.length} entries, ${pg.length} database prompts, ${db.length - pg.length} database workflows.`);
