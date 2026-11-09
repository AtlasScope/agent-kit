#!/usr/bin/env node
// Builds the prompt library from library.json and template.html into two files:
//   prompt-library.html  one self-contained page: upload it as a Claude artifact, or open it in
//                        a browser or the side browser in Codex or Cursor
//   prompt-library.md    the same entries as a plain cheat sheet you can search in an editor
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

const template = fs.readFileSync(path.join(here, "template.html"), "utf8");
if (template.split("__LIBRARY_DATA__").length !== 2) throw new Error("template.html must contain __LIBRARY_DATA__ once");
// Escape "<" so the data can never close its <script> tag early.
const data = JSON.stringify(lib).replace(/</g, "\\u003c");
const html = `<!doctype html>\n<html lang="en">\n${template.replace("__LIBRARY_DATA__", () => data)}</html>\n`;

const SECTION_NAMES = { inv: "Investigations", db: "Database", think: "Thinking prompts", ecmd: "Engineering commands", dcmd: "Design commands", recipe: "Recipes", desk: "Desk only" };
const md = ["# Prompt Library", "", `${lib.entries.length} prompts, commands and recipes for coding and design agents. Open prompt-library.html for search, stars and the prompt composer.`, ""];
for (const [sec, name] of Object.entries(SECTION_NAMES)) {
  const list = lib.entries.filter((e) => e.sec === sec);
  if (!list.length) continue;
  md.push(`## ${name}`, "");
  let group = null;
  for (const e of list) {
    if (e.group && e.group !== group) { group = e.group; md.push(`### ${group}`, ""); }
    md.push(`**${e.id} · ${e.t}**${e.why ? ` ${e.why}` : ""}`, "");
    const text = e.sec === "ecmd" && e.cmd ? e.cmd : e.p;
    if (e.steps) md.push(e.steps.map((s) => (Array.isArray(s) ? s.join(": ") : s)).map((s, i) => `${i + 1}. ${s}`).join("\n"), "");
    else if (text) md.push("```text", text, "```", "");
  }
}

// Inventory for the editorial audit: one row per entry, grouped by section and family. "reviewed" stays
// empty until a person has read and tested the entry; the audit fills it in.
const MODE_LABEL = { read: "Report only", repro: "Adds a test that shows it", change: "Suggests a fix" };
const csv = (v) => (/[",\n]/.test(String(v ?? "")) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ""));
const inv = [["id", "section", "family", "title", "changes", "needs", "source", "purpose", "you_get", "reviewed"]];
for (const e of lib.entries) {
  const changes = e.mode ? (e.iso ? "Tests on a copy" : MODE_LABEL[e.mode]) : e.dmode;
  const needs = e.tools || (e.badge ? e.badge : e.cmd ? "a plugin or skill" : "nothing");
  inv.push([e.id, e.sec, e.group, e.t, changes, needs, e.badge || e.src || "Agent Kit", e.why || e.use || "", e.ev || e.best || "", e.reviewed || ""]);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "inventory.csv"), inv.map((r) => r.map(csv).join(",")).join("\n") + "\n");
fs.writeFileSync(path.join(outDir, "prompt-library.html"), html);
fs.writeFileSync(path.join(outDir, "prompt-library.md"), md.join("\n"));
console.log(`Built ${lib.entries.length} entries into ${outDir}${overlayPath ? " (with private overlay)" : ""}`);
