#!/usr/bin/env node
// Builds the prompt library from library.json and template.html into two files:
//   prompt-library.html  one self-contained page: upload it as a Claude artifact, or open it in
//                        a browser or the side browser in Codex or Cursor
//   prompt-library.md    the same entries, by area, as a plain cheat sheet you can search in an editor
//   inventory.csv        one row per entry for the editorial audit
// It also reads Keen's job list from kits/design-kit (see KEEN below).
//
// Usage: node library/build.mjs [--overlay <private.json>] [--out <dir>]
//   --overlay  merges extra fields into the public data: per-entry fields under "entries",
//              private-only entries under "extraEntries" ({ after, entry }), and any other
//              top-level keys. Use it for a private copy; never commit its output here.
//   --out      output folder, default library/dist
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const outDir = path.resolve(opt("--out") || path.join(here, "dist"));
const overlayPath = opt("--overlay");

const lib = JSON.parse(fs.readFileSync(path.join(here, "library.json"), "utf8"));
if (overlayPath) {
  const ov = JSON.parse(fs.readFileSync(overlayPath, "utf8"));
  const byId = new Map(lib.entries.map((e) => [e.id, e]));
  for (const [id, fields] of Object.entries(ov.entries || {})) {
    const e = byId.get(id);
    if (!e) throw new Error(`Overlay names entry ${id}, which library.json does not have`);
    Object.assign(e, fields);
  }
  for (const { after, entry } of ov.extraEntries || []) {
    const at = lib.entries.findIndex((e) => e.id === after);
    if (at < 0) throw new Error(`Overlay adds ${entry.id} after ${after}, which library.json does not have`);
    lib.entries.splice(at + 1, 0, entry);
  }
  for (const [k, v] of Object.entries(ov)) if (k !== "entries" && k !== "extraEntries") lib[k] = v;
}

const ids = new Set();
for (const e of lib.entries) {
  if (ids.has(e.id)) throw new Error(`Duplicate entry id ${e.id}`);
  ids.add(e.id);
}

// Keen's jobs come from Keen itself, so its menu and this page always agree: the job tables in its
// SKILL.md give the group, when to use it and what kind of job it is; each job file's first line says
// what it does. The full instructions (job file plus Keen's shared rules and report) are the text
// someone without Agent Kit can paste.
const KEEN = path.join(here, "../kits/design-kit/plugins/design-kit/skills/keen");
const keenSkill = fs.readFileSync(path.join(KEEN, "SKILL.md"), "utf8");
const section = (title) => (keenSkill.split(/^## /m).find((x) => x.startsWith(title + "\n")) || "").replace(/^[^\n]*\n/, "").trim();
const keenShared = ["Rules for every job", "The report"].map((t) => `## ${t}\n\n${section(t)}`).join("\n\n");
const keen = [];
let keenGroup = null;
for (const ln of section("Jobs").split("\n")) {
  const g = /^\*\*(.+)\*\*$/.exec(ln.trim());
  if (g) { keenGroup = g[1]; continue; }
  const row = /^\| `([a-z]+)` \| ([^|]+) \| ([^|]+) \| \[jobs\/([a-z]+)\.md\]/.exec(ln);
  if (!row) continue;
  const [, job, use, kind, file] = row;
  const body = fs.readFileSync(path.join(KEEN, "jobs", file + ".md"), "utf8").trim();
  // The page shows plain text, so code marks around job names come off.
  const line = body.split("\n").map((x) => x.trim()).filter((x) => x && !x.startsWith("#"))[0].replace(/`/g, "");
  keen.push({
    id: "K:" + job, sec: "keen", group: keenGroup, t: "/keen " + job, cmd: "/keen " + job, use: use.trim().replace(/`/g, ""), kind: kind.trim(), line,
    full: `You are doing one design job on this project's interface: ${job}. Follow these instructions. Where a step mentions a Keen script or worksheet you do not have, do the same thing by hand and say so in the report.\n\n${body}\n\n${keenShared}`,
  });
}
if (keen.length < 1) throw new Error("No Keen jobs found in " + path.join(KEEN, "SKILL.md"));

const template = fs.readFileSync(path.join(here, "template.html"), "utf8");
if (template.split("__LIBRARY_DATA__").length !== 2) throw new Error("template.html must contain __LIBRARY_DATA__ once");
// Escape "<" so the data can never close its <script> tag early.
const data = JSON.stringify({ ...lib, keen }).replace(/</g, "\\u003c");
const html = `<!doctype html>\n<html lang="en">\n${template.replace("__LIBRARY_DATA__", () => data)}</html>\n`;

// The cheat sheet follows the page: one section per area, then Other tools.
const byId = new Map(lib.entries.map((e) => [e.id, e]));
const md = ["# Prompt Library", "", `Prompts and commands for coding agents, by area. Open prompt-library.html to search and copy.`, ""];
const mdEntry = (e) => {
  const name = e.cmd && e.sec !== "recipe" ? e.cmd : e.t;
  const line = e.line || e.why || e.use || "";
  md.push(`**${e.sec === "keen" ? e.cmd : e.id + " · " + name}**${line ? ` ${line}` : ""}`, "");
  if (e.sec === "keen") return;
  const text = e.sec === "ecmd" && e.cmd ? e.cmd : e.p;
  if (e.steps) md.push(e.steps.map((s) => (Array.isArray(s) ? s.join(": ") : s)).map((s, i) => `${i + 1}. ${s}`).join("\n"), "");
  else if (text) md.push("```text", text, "```", "");
};
const placed = new Set();
for (const a of lib.areas || []) {
  md.push(`## ${a.title}`, "", a.blurb, "");
  for (const [title, ref] of a.groups) {
    const list = typeof ref === "string" ? keen.filter((k) => "K:" + k.group === ref) : ref.map((id) => byId.get(id));
    md.push(`### ${title}`, "");
    for (const e of list) { placed.add(e.id); mdEntry(e); }
  }
}
const others = lib.entries.filter((e) => !placed.has(e.id) && !(lib.notShown || {})[e.id]);
if (others.length) {
  md.push("## Other tools", "", "Commands written by other people. Each names the Agent Kit job that now does the same work, where there is one.", "");
  for (const e of others) {
    mdEntry(e);
    const c = (lib.closest || {})[e.id];
    if (c) md.push(`Agent Kit job: \`${c}\``, "");
  }
}

// Inventory for the editorial audit: one row per entry, grouped by section and family. "reviewed" stays
// empty until a person has read and tested the entry; the audit fills it in.
const MODE_LABEL = { read: "Report only", repro: "Adds a test that shows it", change: "Suggests a fix" };
const auditCols = (id) => {
  const a = audit.entries[id] || { s: "" };
  const flags = [...(a.flags || []), ...(a.dupOf ? ["duplicate of " + a.dupOf] : [])].join("; ");
  const score = a.s ? [...a.s].reduce((t, d) => t + +d, 0) + "/14 (" + a.s + ")" : "";
  return [score, role.get(id) || "", flags, a.note || ""];
};
const csv = (v) => (/[",\n]/.test(String(v ?? "")) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ""));
const audit = JSON.parse(fs.readFileSync(path.join(here, "audit.json"), "utf8"));
const role = new Map();
for (const c of audit.clusters) { role.set(c.primary, `${c.job}: primary`); for (const a of c.alts) role.set(a.id, `${c.job}: alternative`); }
const inv = [["id", "section", "family", "title", "changes", "needs", "source", "purpose", "you_get", "score", "cluster", "flags", "audit_note", "reviewed"]];
for (const e of lib.entries) {
  const changes = e.mode ? (e.iso ? "Tests on a copy" : MODE_LABEL[e.mode]) : e.dmode;
  // Recipes need the skills their steps run; workflows need what their prompts need.
  const stepCmds = (e.steps || []).map(([c]) => c.split(/\s/)[0]).filter((c, i, a) => a.indexOf(c) === i);
  const flowTools = [...new Set((e.flow || []).flatMap(([, ids]) => ids).map((id) => lib.entries.find((x) => x.id === id)?.tools).filter(Boolean))].join(" | ");
  const needs = e.tools || flowTools || (stepCmds.length ? "Installed: " + stepCmds.join(", ") : e.cmd ? "Installed: " + e.cmd.split(/\s/)[0] : "nothing");
  inv.push([e.id, e.sec, e.group, e.t, changes, needs, e.badge ? `${e.group} (${e.badge})` : e.src || "Agent Kit", e.why || e.use || "", e.ev || e.best || "", ...auditCols(e.id), e.reviewed || ""]);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "inventory.csv"), inv.map((r) => r.map(csv).join(",")).join("\n") + "\n");
fs.writeFileSync(path.join(outDir, "prompt-library.html"), html);
fs.writeFileSync(path.join(outDir, "prompt-library.md"), md.join("\n"));
console.log(`Built ${lib.entries.length} entries into ${outDir}${overlayPath ? " (with private overlay)" : ""}`);
