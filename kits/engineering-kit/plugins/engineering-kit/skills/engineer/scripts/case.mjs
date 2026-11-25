#!/usr/bin/env node
// A controlled comparison: run the same steps against a baseline and a candidate, each in its own throwaway
// copy of the repository, and record what each run did: exit code, output, which project files it wrote
// (even with identical bytes), changed, added or deleted, and which programs it started.
//
//   node case.mjs <case.json> [--json] [--keep]
//
// case.json:
//   {
//     "title": "The library check leaves stale files stale",
//     "baseline": "HEAD",                 a revision, or "working-tree" (HEAD plus uncommitted and untracked, unignored files)
//     "candidate": "working-tree",        optional; omit to run the baseline alone
//     "link": ["site/node_modules"],      optional: ignored folders to link in from the checkout (shared, not copied);
//                                         { "path": "site/node_modules", "from": "<folder>" } links one from elsewhere
//     "copy": ["site/node_modules"],      optional: the same two forms, copied into each clone instead of linked. Use it
//                                         when a tool refuses files outside its project: Next.js with Turbopack fails
//                                         on a linked node_modules, because the link leads out of the clone
//     "env": "inherit",                   or "minimal" (PATH, HOME, temp and locale only)
//     "timeout": 120,                     seconds per step
//     "steps": [
//       { "id": "fresh", "run": ["node", "library/check.mjs"], "expect": { "exit": 0, "unchanged": true, "writes": 0 } },
//       { "id": "stale", "change": [{ "append": "path/in/repo.md", "text": "STALE\n" }], "run": ["node", "library/check.mjs"],
//         "expect": { "exit": 1, "unchanged": true } }
//     ]
//   }
// Steps run in order in the same copy, so a step sees what the steps before it left behind. "change" edits the
// copy before the step (write, append or delete), and refuses a path that leads through a symbolic link, which
// could point out of the copy; "run" is an argument list, or a string for the shell (on Windows a .cmd program
// such as npm needs the string form); "cwd" runs it in a folder of the copy.
// "expect" is optional: exit (a number), unchanged (no project file changed, added or deleted), writes (most
// project files written, identical bytes included), output (text that must appear in stdout or stderr). It
// applies to both variants, or give each its own, as in a mutation run where the candidate breaks the code on
// purpose and the check should catch it: "expect": { "baseline": { "exit": 0 }, "candidate": { "exit": 1 } }.
//
// The copies live in the system temp folder and are deleted afterwards (--keep leaves them). Nothing is written
// to the checkout itself, except through folders named in "link". This is isolation of files, not a sandbox:
// commands keep network access, credentials in the environment and anything else the user's account allows.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const TRACER = path.join(here, "case-trace.cjs");
const OUTPUT_MAX = 4000;
const WINDOWS = process.platform === "win32";
const EXPECTATIONS = ["exit", "unchanged", "writes", "output"];
const VARIANTS = ["baseline", "candidate"];

/** What a step expects of one variant: its own expectations when it gives them per variant, else the shared ones. */
export function expectationsFor(step, variant) {
  const e = step.expect || {};
  return Object.keys(e).some((k) => VARIANTS.includes(k)) ? e[variant] || {} : e;
}

const git = (cwd, args, input) => execFileSync("git", ["-c", "core.quotepath=false", ...args], { cwd, encoding: "utf8", input, maxBuffer: 256 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const posix = (p) => p.split(path.sep).join("/");

function repoName(root) {
  try {
    const m = /[/:]([\w.-]+\/[\w.-]+?)(\.git)?$/.exec(git(root, ["remote", "get-url", "origin"]).trim());
    if (m) return m[1];
  } catch { /* no remote */ }
  return path.basename(root);
}

/** A path inside the copy, refusing absolute paths and anything that climbs out of it. */
function inside(base, rel) {
  if (typeof rel !== "string" || !rel || path.isAbsolute(rel) || /^[a-z]:/i.test(rel) || rel.split(/[\\/]/).includes("..")) throw new Error(`Not a path inside the repository: ${rel}`);
  return path.join(base, ...rel.split("/"));
}

/**
 * Refuse a path in the copy that leads through a symbolic link or a Windows junction. The repository's own files,
 * or a link a step left behind, can point anywhere, so a change, copy or link made through one could land outside
 * the copy. Every part of the path that exists is checked, the last one included.
 */
function refuseLinks(base, rel, what) {
  let at = base;
  for (const part of rel.split(WINDOWS ? /[\\/]/ : "/")) {
    at = path.join(at, part);
    let st;
    try { st = fs.lstatSync(at); } catch (e) { if (e.code === "ENOENT" || e.code === "ENOTDIR") return; throw e; }
    if (st.isSymbolicLink()) throw new Error(`${what}: refused, because ${posix(path.relative(base, at))} is a symbolic link in the copy and following it could lead out of the copy. Nothing was changed through it.`);
  }
}

export function validate(spec) {
  const fail = (m) => { throw new Error(`case.json: ${m}`); };
  if (!spec || typeof spec !== "object") fail("not a JSON object");
  if (typeof spec.title !== "string" || !spec.title.trim()) fail("needs a title");
  if (typeof spec.baseline !== "string" || !spec.baseline) fail('needs "baseline": a revision or "working-tree"');
  if (spec.candidate !== undefined && (typeof spec.candidate !== "string" || !spec.candidate)) fail('"candidate" must be a revision or "working-tree"');
  if (!Array.isArray(spec.steps) || !spec.steps.length || spec.steps.length > 50) fail("needs 1 to 50 steps");
  const ids = new Set();
  for (const s of spec.steps) {
    if (!s || typeof s.id !== "string" || !/^[A-Za-z0-9][\w.-]{0,40}$/.test(s.id) || ids.has(s.id)) fail(`each step needs a unique short id (letters, digits, . _ -): ${JSON.stringify(s?.id)}`);
    ids.add(s.id);
    const okRun = typeof s.run === "string" ? s.run.trim() : Array.isArray(s.run) && s.run.length && s.run.every((x) => typeof x === "string");
    if (!okRun) fail(`step ${s.id}: "run" must be an argument list or a command string`);
    for (const c of s.change || []) {
      const keys = ["write", "append", "delete"].filter((k) => k in c);
      if (keys.length !== 1) fail(`step ${s.id}: each change is one of write, append or delete`);
      if (keys[0] !== "delete" && typeof c.text !== "string") fail(`step ${s.id}: ${keys[0]} needs "text"`);
      inside("/x", c[keys[0]]);
    }
    if (s.cwd !== undefined) inside("/x", s.cwd);
    const e = s.expect ?? {};
    const known = (x, where) => {
      if (!x || typeof x !== "object" || Array.isArray(x)) fail(`${where}: "expect" is an object such as { "exit": 0 }`);
      for (const k of Object.keys(x)) if (!EXPECTATIONS.includes(k)) fail(`${where}: unknown expectation ${k}`);
    };
    const own = e && typeof e === "object" ? Object.keys(e).filter((k) => VARIANTS.includes(k)) : [];
    if (!own.length) known(e, `step ${s.id}`);
    else {
      const shared = Object.keys(e).filter((k) => !VARIANTS.includes(k));
      if (shared.length) fail(`step ${s.id}: "expect" is either for both variants ({ "exit": 0 }) or for each ({ "baseline": {...}, "candidate": {...} }), not a mix (${shared.join(", ")})`);
      for (const v of own) known(e[v], `step ${s.id}, ${v}`);
      if (e.candidate && !spec.candidate) fail(`step ${s.id}: expects something of the candidate, but the case has no "candidate"`);
    }
  }
  const placed = new Set();
  for (const how of ["link", "copy"]) for (const l of spec[how] || []) {
    const rel = typeof l === "string" ? l : l?.path;
    if (typeof l !== "string" && !(l && typeof l.path === "string" && typeof l.from === "string")) fail(`each ${how} is a path, or { "path": ..., "from": <folder elsewhere, such as the main checkout's node_modules> }`);
    inside("/x", rel);
    if (placed.has(rel)) fail(`${rel} is named twice in link and copy`);
    placed.add(rel);
  }
  if (spec.env !== undefined && !["inherit", "minimal"].includes(spec.env)) fail('"env" is "inherit" or "minimal"');
  if (spec.timeout !== undefined && !(Number.isFinite(spec.timeout) && spec.timeout > 0 && spec.timeout <= 3600)) fail('"timeout" is 1 to 3600 seconds');
  return spec;
}

/** A throwaway copy of the repository at a revision, or at the checkout's current working tree. */
function makeCopy(root, ref, dir) {
  const head = git(root, ["rev-parse", "HEAD"]).trim();
  const working = ref === "working-tree";
  const revision = working ? head : git(root, ["rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`]).trim();
  execFileSync("git", ["clone", "--quiet", "--shared", "--no-checkout", root, dir], { stdio: "pipe" });
  git(dir, ["remote", "remove", "origin"]); // nothing in the copy can push back to the checkout
  git(dir, ["-c", "advice.detachedHead=false", "checkout", "--quiet", "--detach", revision]);
  let changed = 0;
  if (working) {
    const diff = git(root, ["diff", "--binary", "HEAD"]);
    if (diff.trim()) { git(dir, ["apply", "--binary", "--whitespace=nowarn", "-"], diff); changed += diff.split("\ndiff --git ").length; }
    for (const f of git(root, ["ls-files", "-z", "--others", "--exclude-standard"]).split("\0").filter(Boolean)) {
      const src = inside(root, f), dst = inside(dir, f);
      refuseLinks(dir, f, `untracked file ${f}`);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      // a link stays a link to the same target; copyFileSync would follow it and copy what it points to
      if (fs.lstatSync(src).isSymbolicLink()) fs.symlinkSync(fs.readlinkSync(src), dst);
      else fs.copyFileSync(src, dst);
      changed++;
    }
    if (changed) {
      git(dir, ["add", "-A"]);
      git(dir, ["-c", "user.name=engineer case", "-c", "user.email=case@localhost", "-c", "commit.gpgsign=false", "commit", "--quiet", "--no-verify", "-m", "working tree"]);
    }
  }
  return { revision, working, changed };
}

/** Every project file (tracked or untracked and not ignored) with the hash of its bytes. */
function snapshot(dir) {
  const out = new Map();
  for (const f of git(dir, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]).split("\0").filter(Boolean)) {
    try { out.set(f, sha256(fs.readFileSync(inside(dir, f)))); } catch { out.set(f, null); }
  }
  return out;
}

function environment(kind, home) {
  const base = kind === "minimal"
    ? Object.fromEntries(["PATH", "Path", "SystemRoot", "SYSTEMROOT", "ComSpec", "PATHEXT", "TEMP", "TMP", "TMPDIR", "LANG"].filter((k) => process.env[k] !== undefined).map((k) => [k, process.env[k]]))
    : { ...process.env };
  if (kind === "minimal") { base.HOME = home; base.USERPROFILE = home; }
  delete base.NODE_OPTIONS;
  return base;
}

function runStep(dir, spec, step, variant, logFile, home) {
  const where = `step ${step.id} (${variant})`;
  for (const c of step.change || []) { const verb = ["write", "append", "delete"].find((k) => k in c); refuseLinks(dir, c[verb], `${where}: ${verb} ${c[verb]}`); }
  if (step.cwd) refuseLinks(dir, step.cwd, `${where}: cwd ${step.cwd}`);
  for (const c of step.change || []) {
    if ("delete" in c) fs.rmSync(inside(dir, c.delete), { force: true, recursive: true });
    else {
      const p = inside(dir, c.write ?? c.append);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      if ("write" in c) fs.writeFileSync(p, c.text);
      else fs.appendFileSync(p, c.text);
    }
  }
  const before = snapshot(dir);
  fs.writeFileSync(logFile, "");
  const env = { ...environment(spec.env || "inherit", home), ENGINEER_CASE_LOG: logFile, NODE_OPTIONS: `--require=${JSON.stringify(TRACER)}` };
  const cwd = step.cwd ? inside(dir, step.cwd) : dir;
  const timeout = (spec.timeout || 120) * 1000;
  const started = process.hrtime.bigint();
  const res = typeof step.run === "string"
    ? spawnSync(step.run, { cwd, env, shell: true, encoding: "utf8", timeout, maxBuffer: 64 * 1024 * 1024 })
    : spawnSync(step.run[0], step.run.slice(1), { cwd, env, encoding: "utf8", timeout, maxBuffer: 64 * 1024 * 1024 });
  const ms = Number((process.hrtime.bigint() - started) / 1000000n);
  const after = snapshot(dir);
  const modified = [], deleted = [], added = [];
  for (const [f, h] of before) { if (!after.has(f)) deleted.push(f); else if (after.get(f) !== h) modified.push(f); }
  for (const f of after.keys()) if (!before.has(f)) added.push(f);
  // what the Node programs said they wrote
  const events = fs.readFileSync(logFile, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const realDir = fs.realpathSync(dir);
  const rel = (abs) => {
    for (const base of [realDir, dir]) { const r = path.relative(base, abs); if (r && !r.startsWith("..") && !path.isAbsolute(r)) return posix(r); }
    return null;
  };
  const written = new Map(), outside = new Set();
  const processes = new Set(events.map((e) => e.pid)).size;
  const children = [];
  // A started program as it was started: arguments as given, an absolute path inside the copy as a repository
  // path, any other absolute path by its last part. A program given as a command line keeps its words.
  const copyPaths = (s) => [realDir, dir].reduce((t, from) => t.split(from).join("<copy>"), s);
  const shown = (a) => (path.isAbsolute(a) ? rel(a) ?? path.basename(a) : copyPaths(a));
  for (const e of events) {
    if (e.kind === "spawn") { if (children.length < 30) children.push([/\s/.test(e.program) ? copyPaths(e.program) : path.basename(e.program), ...e.args.map(shown)].join(" ").slice(0, 160)); continue; }
    if (!["write", "delete", "rename"].includes(e.kind)) continue;
    const r = rel(e.path);
    if (r === null) { outside.add(e.path); continue; }
    if (!written.has(r)) written.set(r, new Set());
    written.get(r).add(e.kind);
  }
  const project = [...written.keys()].filter((f) => before.has(f) || after.has(f));
  const trackedWrites = project.filter((f) => before.has(f));
  const sameBytes = trackedWrites.filter((f) => after.has(f) && before.get(f) === after.get(f));
  const clean = (s) => {
    let t = String(s ?? "");
    for (const [from, to] of [[realDir, "<copy>"], [dir, "<copy>"], [os.homedir(), "~"]]) if (from) t = t.split(from).join(to);
    // keep the start and the end: errors come first, summaries last
    return t.length > OUTPUT_MAX ? `${t.slice(0, 1000)}\n... (${t.length - OUTPUT_MAX} characters left out) ...\n${t.slice(-(OUTPUT_MAX - 1000))}` : t;
  };
  const result = {
    exit: res.status,
    signal: res.signal || null,
    error: res.error ? (res.error.code === "ETIMEDOUT" ? `timed out after ${timeout / 1000}s` : String(res.error.message)) : null,
    ms,
    stdout: clean(res.stdout),
    stderr: clean(res.stderr),
    modified, added, deleted,
    // ignored: inside the copy but not a project file (build output, node_modules); outside: temp folders and the like
    writes: { project: project.length, tracked: trackedWrites.length, sameBytes: sameBytes.length, files: project.slice(0, 50), ignored: written.size - project.length, outside: outside.size },
    nodeProcesses: processes,
    children,
  };
  const e = expectationsFor(step, variant);
  const met = {};
  if ("exit" in e) met.exit = result.exit === e.exit;
  if ("unchanged" in e) met.unchanged = e.unchanged === (!modified.length && !added.length && !deleted.length);
  if ("writes" in e) met.writes = result.writes.project <= e.writes;
  if ("output" in e) met.output = (result.stdout + result.stderr).includes(e.output);
  result.expect = met;
  result.pass = Object.keys(met).length ? Object.values(met).every(Boolean) : null;
  return result;
}

export function runCase(root, spec, { keep = false } = {}) {
  validate(spec);
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "engineer-case-"));
  const variants = [["baseline", spec.baseline], ...(spec.candidate ? [["candidate", spec.candidate]] : [])];
  const out = { variants: {}, steps: spec.steps.map((s) => ({ id: s.id, run: s.run, change: s.change || [], expect: s.expect || {}, results: {} })) };
  try {
    for (const [name, ref] of variants) {
      const dir = path.join(base, name);
      const copy = makeCopy(root, ref, dir);
      for (const how of ["link", "copy"]) for (const l of spec[how] || []) {
        const rel = typeof l === "string" ? l : l.path;
        const src = typeof l === "string" ? inside(root, l) : path.resolve(root, l.from);
        if (!fs.existsSync(src)) throw new Error(`${how} ${rel}: ${typeof l === "string" ? "not in the checkout" : `${l.from} does not exist`}`);
        const dst = inside(dir, rel);
        refuseLinks(dir, rel, `${how} ${rel}`);
        if (fs.existsSync(dst)) throw new Error(`${how} ${rel}: the copy already has it; ${how} only ignored folders such as node_modules`);
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        if (how === "link") fs.symlinkSync(src, dst, process.platform === "win32" ? "junction" : "dir");
        // Links inside the folder (node_modules/.bin) keep their own targets, so they stay inside the clone too.
        else fs.cpSync(src, dst, { recursive: true, verbatimSymlinks: true, mode: fs.constants.COPYFILE_FICLONE });
      }
      out.variants[name] = { ref, revision: copy.revision, workingTree: copy.working, uncommittedFiles: copy.changed, ...(keep ? { copy: dir } : {}) };
      const home = path.join(base, `${name}-home`);
      fs.mkdirSync(home);
      spec.steps.forEach((step, i) => { out.steps[i].results[name] = runStep(dir, spec, step, name, path.join(base, `${name}-${step.id}.log`), home); });
    }
  } finally {
    if (!keep) fs.rmSync(base, { recursive: true, force: true, maxRetries: 3 });
  }
  return out;
}

const short = (s) => (s ? s.slice(0, 7) : "?");
const describe = (v) => (v.workingTree ? `working tree (HEAD ${short(v.revision)}${v.uncommittedFiles ? ` + ${v.uncommittedFiles} uncommitted file(s)` : ", nothing uncommitted"})` : `${v.ref} (${short(v.revision)})`);
const runText = (r) => (Array.isArray(r) ? r.join(" ") : r);

function summarize(step, name, r) {
  const parts = [`exit ${r.exit ?? r.signal ?? "none"}`];
  if (r.error) parts.push(r.error);
  parts.push(`${r.writes.tracked} project file(s) written${r.writes.sameBytes ? ` (${r.writes.sameBytes} with identical bytes)` : ""}`);
  if (r.modified.length) parts.push(`${r.modified.length} changed`);
  if (r.added.length) parts.push(`${r.added.length} added`);
  if (r.deleted.length) parts.push(`${r.deleted.length} deleted`);
  return `${name}: ${runText(step.run)} → ${parts.join(", ")}${r.pass === null ? "" : r.pass ? "; met expectations" : `; missed ${Object.entries(r.expect).filter(([, ok]) => !ok).map(([k]) => k).join(", ")}`}`;
}

export function report(root, spec, out) {
  const limits = "Each variant ran in its own temporary clone of the repository (a candidate \"working-tree\" includes uncommitted and untracked, unignored files). File effects are measured two ways: before-and-after hashes of every project file, which see any program, and a write tracer loaded into Node processes, which also sees writes that left the bytes unchanged but misses non-Node programs. Commands kept network access and the environment" + (spec.env === "minimal" ? " minus all but PATH, temp and locale variables" : "") + "; folders named in link were shared with the checkout, and folders named in copy were copied from it. One run per step: timing is not a benchmark, and a flaky command needs repeated runs.";
  const subjects = new Map(), observations = [];
  const subj = (kind, key, label) => { if (!subjects.has(`${kind}:${key}`)) subjects.set(`${kind}:${key}`, { kind, key, label }); return key; };
  for (const step of out.steps) {
    const sid = subj("experiment", `case:${spec.title.slice(0, 60)}:${step.id}`, `${step.id}: ${runText(step.run)}`.slice(0, 200));
    for (const [name, r] of Object.entries(step.results)) {
      const files = [...new Set([...r.modified, ...r.added, ...r.deleted, ...r.writes.files])].slice(0, 20).map((f) => subj("file", f, path.posix.basename(f)));
      r.id = `o${observations.length + 1}`;
      observations.push({ id: r.id, locator: `case "${spec.title}" · step ${step.id} · ${name} (${describe(out.variants[name])})`.slice(0, 1000), subjects: [sid, ...files], kind: `case:${name}`, summary: summarize(step, name, r), details: { variant: name, revision: out.variants[name].revision, run: step.run, change: step.change, exit: r.exit, signal: r.signal, error: r.error, modified: r.modified, added: r.added, deleted: r.deleted, writes: r.writes, expect: r.expect, pass: r.pass, stderrTail: r.stderr.split("\n").filter(Boolean).slice(-5) } });
    }
  }
  // the state the case speaks for: the candidate when there is one
  const current = out.variants.candidate || out.variants.baseline;
  return {
    tool: "case",
    title: spec.title,
    repository: repoName(root),
    revision: current.workingTree && current.uncommittedFiles ? "working-tree" : current.revision,
    variants: out.variants,
    steps: out.steps,
    coverage: limits,
    evidence: {
      scope: "controlled-fixture",
      method: `case.mjs ran ${out.steps.length} step(s) against ${Object.values(out.variants).map(describe).join(" and ")}, each in a temporary clone, recording exit codes, output, project-file hashes before and after, and Node file writes and child processes.`,
      limits,
      subjects: [...subjects.values()],
      observations,
    },
  };
}

export function toText(r) {
  const out = [`Case: ${r.title} · ${r.repository}`];
  for (const [name, v] of Object.entries(r.variants)) out.push(`${name}: ${describe(v)}${v.copy ? ` · kept at ${v.copy}` : ""}`);
  out.push("");
  const rows = [["step", "variant", "exit", "written", "same bytes", "changed", "added", "deleted", "expected"]];
  for (const s of r.steps) for (const [name, x] of Object.entries(s.results)) rows.push([s.id, name, String(x.exit ?? x.signal ?? x.error ?? "-"), String(x.writes.tracked), String(x.writes.sameBytes), String(x.modified.length), String(x.added.length), String(x.deleted.length), x.pass === null ? "-" : x.pass ? "met" : `missed ${Object.entries(x.expect).filter(([, ok]) => !ok).map(([k]) => k).join(", ")}`]);
  const w = rows[0].map((_, i) => Math.max(...rows.map((row) => row[i].length)));
  for (const row of rows) out.push(row.map((c, i) => c.padEnd(w[i])).join("  ").trimEnd());
  for (const s of r.steps) {
    out.push("", `${s.id}: ${runText(s.run)}${s.change.length ? ` (after ${s.change.map((c) => Object.keys(c).find((k) => k !== "text") + " " + (c.write ?? c.append ?? c.delete)).join(", ")})` : ""}`);
    for (const [name, x] of Object.entries(s.results)) {
      out.push(`  [${x.id}] ${name}: exit ${x.exit ?? x.signal ?? "none"} in ${x.ms} ms${x.error ? ` (${x.error})` : ""}; ${x.nodeProcesses} Node process(es)${x.children.length ? `; started ${x.children.slice(0, 4).join(" | ")}${x.children.length > 4 ? " | ..." : ""}` : ""}`);
      if (x.writes.files.length) out.push(`      wrote ${x.writes.files.slice(0, 8).join(", ")}${x.writes.files.length > 8 ? ", ..." : ""}`);
      if (x.writes.ignored || x.writes.outside) out.push(`      also wrote ${x.writes.ignored} ignored file(s) in the copy and ${x.writes.outside} outside it (temp folders and the like)`);
      for (const [label, list] of [["changed", x.modified], ["added", x.added], ["deleted", x.deleted]]) if (list.length) out.push(`      ${label} ${list.slice(0, 8).join(", ")}${list.length > 8 ? `, ... (${list.length})` : ""}`);
      // the line that says what went wrong, when there is one, then the last line
      const lines = (x.stderr.trim() || x.stdout.trim()).split("\n").map((l) => l.trim()).filter(Boolean);
      const key = lines.find((l) => /\b\w*Error\b|\berror:|\bnot ok\b|✖|\bfailed\b/i.test(l) || /\bFAIL\b/.test(l));
      const shown = [...new Set([key, lines.at(-1)].filter(Boolean))].join(" … ");
      if (shown) out.push(`      output: ${shown.slice(0, 300)}`);
    }
  }
  out.push("", `Limits: ${r.coverage}`);
  return out.join("\n");
}

function main(argv) {
  const files = argv.filter((a) => !a.startsWith("--"));
  const unknown = argv.filter((a) => a.startsWith("--") && !["--json", "--keep"].includes(a));
  if (unknown.length) throw new Error(`Unknown option ${unknown[0]}`);
  if (files.length !== 1) throw new Error("Usage: node case.mjs <case.json> [--json] [--keep]");
  const spec = JSON.parse(fs.readFileSync(files[0], "utf8"));
  const root = fs.realpathSync(git(process.cwd(), ["rev-parse", "--show-toplevel"]).trim());
  const out = runCase(root, spec, { keep: argv.includes("--keep") });
  const r = report(root, spec, out);
  process.stdout.write((argv.includes("--json") ? JSON.stringify(r, null, 2) : toText(r)) + "\n");
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); } catch (e) { console.error(String(e.stderr || e.message).trim().split("\n").slice(-3).join("\n")); process.exitCode = 1; }
}
