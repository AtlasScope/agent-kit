#!/usr/bin/env node
// The source side of a Keen workspace: several alternatives for the same files, kept outside the project,
// so the project holds one version at a time and the person's own edits are never lost.
//
//   node workspace.mjs base   <name> <file>...   remember these files exactly as they are now, uncommitted edits included
//   node workspace.mjs keep   <name> <alt>       save the files as alternative <alt>, then put them back as they were
//   node workspace.mjs put    <name> <alt>       write a kept alternative into the project again, to revise it
//   node workspace.mjs status <name>             says whether the files changed since `base`; exit 4 if they did
//   node workspace.mjs apply  <name> <alt>       put the chosen alternative into the project
//
// <name> is the same short name the Keen page uses (worksheet.mjs). Everything is stored beside its pages,
// in this computer's cache folder. Nothing is committed, stashed or reset, and git history is never touched.
//
// `base` may be run again to add files, and may name a file that does not exist yet (an alternative can
// create it). Only files named to `base` are ever written or removed.
//
// `apply` never overwrites work it has not seen. A file that is still as `base` found it gets the
// alternative. A file edited since then is merged line by line (git merge-file) when the edit and the
// alternative touch different lines. If any file cannot be merged cleanly, nothing is written, each such
// file is printed as "SOURCE_CHANGED: <file>" and the exit code is 4.
//
//   node workspace.mjs apply <name> <alt> --set-aside
//
// is for after that refusal, once the person has been told. It first saves each such file, as the person
// left it, outside the project and prints "YOURS: <path of the copy>", then writes the alternative. Whoever
// runs it owes the person their edits back: make the same edits again in the applied file, from the copy.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { bookDir } from "./worksheet.mjs";

const sha = (buf) => (buf === null ? null : crypto.createHash("sha256").update(buf).digest("hex"));
const read = (file) => { try { return fs.readFileSync(file); } catch (error) { if (error.code === "ENOENT") return null; throw error; } };
const store = (dir) => path.join(dir, "source");
const manifestFile = (dir) => path.join(store(dir), "manifest.json");
const blob = (dir, kind, rel) => path.join(store(dir), kind, encodeURIComponent(rel));
const ALT = /^[a-z0-9][a-z0-9-]{0,30}$/;

export function readManifest(dir) {
  try { return JSON.parse(fs.readFileSync(manifestFile(dir), "utf8")); } catch { return null; }
}
const need = (dir) => { const m = readManifest(dir); if (!m) throw new Error("No base yet. Run: base <name> <file>..."); if (m.closed) throw new Error("A choice was already applied here. Run base again to start a new set of alternatives."); return m; };
const save = (dir, m) => { fs.mkdirSync(store(dir), { recursive: true }); fs.writeFileSync(manifestFile(dir), JSON.stringify(m, null, 1)); };
const altName = (alt) => { const id = String(alt ?? "").toLowerCase(); if (!ALT.test(id)) throw new Error("Name the alternative with a short word or letter, such as a, b or quiet."); return id; };

function write(file, buf) {
  if (buf === null) { fs.rmSync(file, { force: true }); return; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
}

/** The project folder a set of files belongs to: the git checkout holding `cwd`, or `cwd` itself. */
export function projectRoot(cwd = process.cwd()) {
  try { return fs.realpathSync(execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()); } catch { return fs.realpathSync(cwd); }
}

/** Remember files as they are now. Returns the paths now tracked, relative to the project. */
export function base(dir, files, { cwd = process.cwd(), root = projectRoot(cwd) } = {}) {
  if (!files.length) throw new Error("Name at least one file.");
  const kept = readManifest(dir);
  if (kept?.closed) fs.rmSync(store(dir), { recursive: true, force: true }); // the last choice was applied: this is a new piece of work
  const m = (kept?.closed ? null : kept) || { root, files: {}, alts: {}, busy: null, applied: null };
  if (m.root !== root) throw new Error(`This piece of work already tracks files in ${m.root}. Use another name for a different project.`);
  if (m.busy) throw new Error(`Alternative ${m.busy} is in the project now. Run: keep <name> ${m.busy}`);
  const real = fs.realpathSync(cwd);
  for (const given of files) {
    const rel = path.relative(root, path.resolve(real, given)).split(path.sep).join("/");
    if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) throw new Error(`${given} is outside the project.`);
    if (rel.split("/").includes(".git")) throw new Error(`${given} is inside .git.`);
    if (m.files[rel]) continue;
    const now = read(path.join(root, rel));
    if (now !== null && !fs.statSync(path.join(root, rel)).isFile()) throw new Error(`${given} is not a file.`);
    if (now !== null) write(blob(dir, "base", rel), now);
    m.files[rel] = { base: sha(now) };
  }
  save(dir, m);
  return Object.keys(m.files);
}

/** Save the files as an alternative and put the project back as `base` found it. */
export function keep(dir, alt) {
  const m = need(dir), id = altName(alt), files = {};
  for (const rel of Object.keys(m.files)) {
    const now = read(path.join(m.root, rel));
    files[rel] = sha(now);
    if (now === null) fs.rmSync(blob(dir, `alt-${id}`, rel), { force: true }); else write(blob(dir, `alt-${id}`, rel), now);
  }
  if (Object.keys(files).every((rel) => files[rel] === m.files[rel].base)) throw new Error(`Nothing differs from the base, so there is no alternative ${id} to keep. Edit the files first.`);
  m.alts[id] = { files, kept: (m.alts[id]?.kept || 0) + 1 };
  for (const rel of Object.keys(m.files)) write(path.join(m.root, rel), read(blob(dir, "base", rel)));
  m.busy = null;
  save(dir, m);
  return { alt: id, revision: m.alts[id].kept, changed: Object.keys(files).filter((rel) => files[rel] !== m.files[rel].base) };
}

/** Which tracked files no longer match what `base` recorded (or the alternative that was applied or put). */
export function status(dir) {
  const m = readManifest(dir);
  if (!m || m.closed) return { tracked: 0, changed: [], busy: null, applied: m?.applied ?? null };
  const expect = m.busy || m.applied;
  const changed = [];
  if (!m.busy) for (const rel of Object.keys(m.files)) {
    const now = sha(read(path.join(m.root, rel)));
    if (now !== m.files[rel].base && !(expect && m.alts[expect] && now === m.alts[expect].files[rel])) changed.push(rel);
  }
  return { tracked: Object.keys(m.files).length, changed, busy: m.busy, applied: m.applied };
}

/** Write a kept alternative into the project so it can be revised. Refuses if the files changed since `base`. */
export function put(dir, alt) {
  const m = need(dir), id = altName(alt);
  if (!m.alts[id]) throw new Error(`There is no alternative ${id}. Kept so far: ${Object.keys(m.alts).join(", ") || "none"}.`);
  if (m.busy && m.busy !== id) throw new Error(`Alternative ${m.busy} is in the project now. Run: keep <name> ${m.busy}`);
  const moved = status(dir).changed;
  if (moved.length) { const error = new Error(`The files changed since the previews were made: ${moved.join(", ")}.`); error.changed = moved; throw error; }
  for (const rel of Object.keys(m.files)) write(path.join(m.root, rel), read(blob(dir, `alt-${id}`, rel)));
  m.busy = id;
  m.applied = null;
  save(dir, m);
  return { alt: id };
}

function merge3(mine, old, theirs) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "keen-merge-"));
  try {
    const [a, o, b] = ["mine", "base", "theirs"].map((n) => path.join(tmp, n));
    fs.writeFileSync(a, mine); fs.writeFileSync(o, old); fs.writeFileSync(b, theirs);
    try { return execFileSync("git", ["merge-file", "-p", a, o, b], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 }); } catch { return null; }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

/**
 * Put the chosen alternative into the project. Returns { ok, written, merged, changed }. When ok is false
 * nothing was written and `changed` lists the files that were edited since `base` in a way that cannot be
 * merged. `alt` may be "base" to keep things as they were.
 */
export function apply(dir, alt, { setAside = false } = {}) {
  const m = need(dir);
  if (m.busy) throw new Error(`Alternative ${m.busy} is in the project now. Run: keep <name> ${m.busy}`);
  const original = String(alt).toLowerCase() === "base";
  const id = original ? null : altName(alt);
  if (!original && !m.alts[id]) throw new Error(`There is no alternative ${id}. Kept so far: ${Object.keys(m.alts).join(", ") || "none"}.`);
  const plan = [], changed = [], merged = [], yours = [];
  for (const rel of Object.keys(m.files)) {
    const file = path.join(m.root, rel);
    const now = read(file), old = read(blob(dir, "base", rel));
    const want = original ? old : read(blob(dir, `alt-${id}`, rel));
    const [nowSha, oldSha, wantSha] = [sha(now), sha(old), sha(want)];
    if (nowSha === wantSha || oldSha === wantSha) continue; // already there, or this alternative leaves the file alone
    if (nowSha === oldSha) { plan.push([file, want]); continue; }
    const out = now !== null && old !== null && want !== null ? merge3(now, old, want) : null;
    if (out !== null) { plan.push([file, out]); merged.push(rel); }
    else if (setAside && now !== null) { const copy = blob(dir, "yours", rel); write(copy, now); yours.push(copy); plan.push([file, want]); merged.push(rel); }
    else changed.push(rel);
  }
  if (changed.length) return { ok: false, written: [], merged: [], changed, yours: [] };
  for (const [file, buf] of plan) write(file, buf);
  m.applied = original ? "base" : id;
  m.closed = true; // the choice is made: later edits to these files are ordinary work, not a changed source
  save(dir, m);
  return { ok: true, written: plan.map(([file]) => path.relative(m.root, file).split(path.sep).join("/")), merged, changed: [], yours };
}

function main(argv) {
  const [verb, name, ...rest] = argv.slice(2);
  const usage = "Usage: node workspace.mjs base <name> <file>... | keep <name> <alt> | put <name> <alt> | status <name> | apply <name> <alt>";
  if (!verb || !name) { console.error(usage); process.exit(2); }
  const dir = bookDir(name);
  if (verb === "base") { for (const rel of base(dir, rest)) console.log(`TRACKED: ${rel}`); return; }
  if (verb === "keep") { const out = keep(dir, rest[0]); console.log(`KEPT: ${out.alt} (revision ${out.revision})`); for (const rel of out.changed) console.log(`DIFFERS: ${rel}`); console.log("The project's files are back as they were."); return; }
  if (verb === "put") { try { put(dir, rest[0]); } catch (error) { if (!error.changed) throw error; for (const rel of error.changed) console.log(`SOURCE_CHANGED: ${rel}`); process.exit(4); } console.log(`IN PROJECT: ${altName(rest[0])}. Revise it, capture it, then run keep again.`); return; }
  if (verb === "status") { const s = status(dir); if (s.busy) console.log(`IN PROJECT: ${s.busy}`); if (s.applied) console.log(`APPLIED: ${s.applied}`); for (const rel of s.changed) console.log(`SOURCE_CHANGED: ${rel}`); if (!s.changed.length) console.log(`UNCHANGED: ${s.tracked} file(s)`); process.exit(s.changed.length ? 4 : 0); }
  if (verb === "apply") {
    const out = apply(dir, rest[0], { setAside: rest.includes("--set-aside") });
    if (!out.ok) { for (const rel of out.changed) console.log(`SOURCE_CHANGED: ${rel}`); console.log("Nothing was written. These files were edited after the previews were made, in the same lines the alternative changes. Tell the person, then see --set-aside."); process.exit(4); }
    for (const copy of out.yours) console.log(`YOURS: ${copy}`);
    for (const rel of out.written) console.log(`${out.merged.includes(rel) ? "MERGED" : "APPLIED"}: ${rel}`);
    if (out.yours.length) console.log("The alternative replaced files the person had edited. Their versions are in the YOURS copies: make their edits again in the applied files now.");
    if (!out.written.length) console.log("ALREADY THERE: nothing to write.");
    return;
  }
  console.error(usage); process.exit(2);
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try { main(process.argv); } catch (error) { console.error(`keen workspace: ${error.message}`); process.exit(1); }
}
