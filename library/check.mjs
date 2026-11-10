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

// The built files match the source.
const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || process.env.TEMP || "/tmp"), "plcheck-"));
execFileSync(process.execPath, [path.join(here, "build.mjs"), "--out", tmp], { stdio: "ignore" });
for (const f of ["prompt-library.html", "prompt-library.md", "inventory.csv"]) {
  const built = fs.readFileSync(path.join(tmp, f), "utf8");
  const dist = fs.readFileSync(path.join(here, "dist", f), "utf8");
  if (built !== dist) fail(`library/dist/${f} is out of date: run node library/build.mjs`);
}
// The /engineer router's references come from this library too.
const engRefs = ["start-here.md", "investigations.md"].map((f) => path.join(here, "../kits/engineering-kit/plugins/engineering-kit/skills/engineer/references", f));
const engBefore = engRefs.map((f) => fs.readFileSync(f, "utf8"));
execFileSync(process.execPath, [path.join(here, "../kits/engineering-kit/scripts/build_references.mjs")], { stdio: "ignore" });
engRefs.forEach((f, i) => { if (fs.readFileSync(f, "utf8") !== engBefore[i]) fail(`The /engineer reference ${path.basename(f)} was out of date and has been rebuilt: commit the change`); });
const ref = path.join(here, "../kits/engineering-kit/plugins/engineering-kit/skills/database/references/prompts.md");
const before = fs.readFileSync(ref, "utf8");
execFileSync(process.execPath, [path.join(here, "../kits/engineering-kit/scripts/build_database_references.mjs")], { stdio: "ignore" });
if (fs.readFileSync(ref, "utf8") !== before) fail("The /database reference was out of date and has been rebuilt: commit the change");
fs.rmSync(tmp, { recursive: true, force: true });

// An overlay, if given, must still apply cleanly.
const i = process.argv.indexOf("--overlay");
if (i > 0) {
  const ovOut = fs.mkdtempSync(tmp + "-ov");
  try { execFileSync(process.execPath, [path.join(here, "build.mjs"), "--overlay", process.argv[i + 1], "--out", ovOut], { stdio: "pipe" }); }
  catch (err) { fail("Overlay does not apply: " + String(err.stderr || err.message).split("\n").find((l) => l.includes("Error"))); }
  fs.rmSync(ovOut, { recursive: true, force: true });
}

if (problems.length) { console.error(problems.map((p) => "- " + p).join("\n")); process.exit(1); }
console.log(`Library OK: ${E.length} entries, ${pg.length} database prompts, ${db.length - pg.length} database workflows.`);
