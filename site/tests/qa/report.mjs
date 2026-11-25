// Turns one label's JSON results into a Markdown report grouped by lane owner and severity.
//   node tests/qa/report.mjs --label w4-browse [--out dir]
// Reads parity.json, browser.json, webkit.json and lane-*.json from <out>/<label>/ when present.
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({ options: { label: { type: "string" }, out: { type: "string", default: fileURLToPath(new URL("../../../.artifacts/qa", import.meta.url)) }, title: { type: "string" }, baseline: { type: "string" } } });
const dir = `${args.out}/${args.label}`;
const read = (f) => (existsSync(`${dir}/${f}`) ? JSON.parse(readFileSync(`${dir}/${f}`, "utf8")) : null);
const parity = read("parity.json"), browser = read("browser.json"), webkit = read("webkit.json");
// --baseline <label> re-marks Chromium findings as new or pre-existing against another baseline pass,
// for when the harness changed after the original baseline ran.
if (args.baseline && browser) {
  const stable = (s) => String(s).replace(/\/_next\/static\/[^\s"')]+/g, "/_next/static/…").replace(/\?[^\s"')]*/g, "").replace(/\b[0-9a-f]{8,}\b/g, "…");
  const base = JSON.parse(readFileSync(`${args.out}/${args.baseline}/browser.json`, "utf8"));
  const seen = new Set(base.findings.map((f) => stable(f.key)));
  for (const f of browser.findings) if (f.key) f.status = seen.has(stable(f.key)) ? "pre-existing" : "new";
  const order0 = ["blocker", "serious", "moderate", "minor"];
  browser.summary.counts = Object.fromEntries(["new", "pre-existing"].map((st) => [st, Object.fromEntries(order0.map((v) => [v, browser.findings.filter((f) => f.status === st && f.severity === v).length]))]));
  browser.summary.ref = `baseline ${args.baseline}`;
}
const lanes = readdirSync(dir).filter((f) => /^lane-.*\.json$/.test(f)).map(read);
const order = ["blocker", "serious", "moderate", "minor"];
const L = [];
// Escape backslashes first, then pipes, so a detail can't break out of its table cell.
const cell = (t) => String(t).replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\n/g, " ");

L.push(`# QA report: ${args.title || args.label}`, "");
L.push("All browser results are emulation. Chromium runs use Playwright's iPhone, iPad and MacBook profiles (viewport, pixel ratio, user agent, touch). WebKit runs use WebKitGTK, the Linux port of Safari's engine, at 2x. Neither is Safari on a physical Apple device.", "");

L.push("## Summary", "");
if (parity) L.push(`- URL and SEO parity: ${parity.summary.pages} sitemap pages, ${parity.summary.machineFilesIdentical}/${parity.summary.machineFiles} markdown twins and machine files byte-identical, ${parity.summary.redirectsChecked} old-id redirects. ${parity.findings.length} differences.`);
for (const [name, r] of [["Chromium", browser], ["WebKit", webkit]]) {
  if (!r) continue;
  const c = r.summary.counts;
  L.push(`- ${name} (${r.summary.engine}): new ${order.map((s) => `${c.new[s]} ${s}`).join(", ")}; pre-existing on main ${order.map((s) => c["pre-existing"][s]).reduce((a, b) => a + b, 0)}.`);
}
for (const l of lanes) L.push(`- Lane checks (${l.lane}): ${l.passed} passed, ${l.failed} failed.`);
L.push("");

const blocks = [];
if (parity) blocks.push(...parity.findings.map((f) => ({ ...f, owner: "all", where: "http", status: "new" })));
for (const r of [browser, webkit]) if (r) blocks.push(...r.findings.filter((f) => f.status === "new"));
for (const l of lanes) blocks.push(...l.results.filter((x) => !x.ok).map((x) => ({ owner: `lane:${l.lane}`, severity: x.severity, check: x.check, where: x.where, path: "", detail: x.detail, status: "new" })));

// Collapse repeats of the same check on the same page across devices and appearances.
const groups = new Map();
for (const f of blocks) {
  const k = `${f.owner}|${f.severity}|${f.check}|${f.path}|${f.detail.replace(/\d+px/g, "Npx")}`;
  const g = groups.get(k) || { ...f, wheres: [] };
  g.wheres.push(f.where);
  groups.set(k, g);
}
const owners = [...new Set([...groups.values()].map((g) => g.owner))].sort();
L.push("## New findings by owner", "");
if (!groups.size) L.push("None.", "");
for (const o of owners) {
  L.push(`### ${o}`, "");
  for (const s of order) {
    const gs = [...groups.values()].filter((g) => g.owner === o && g.severity === s);
    if (!gs.length) continue;
    L.push(`**${s}**`, "");
    for (const g of gs.slice(0, 40)) L.push(`- \`${g.check}\` ${g.path} — ${g.detail} _(${[...new Set(g.wheres)].join(", ")})_`);
    if (gs.length > 40) L.push(`- …and ${gs.length - 40} more in the JSON.`);
    L.push("");
  }
}
const pre = [browser, webkit].flatMap((r) => r?.findings.filter((f) => f.status === "pre-existing") || []);
if (pre.length) {
  L.push("## Pre-existing on main (not caused by this branch)", "");
  const byCheck = {};
  for (const f of pre) byCheck[f.check] = (byCheck[f.check] || 0) + 1;
  L.push(Object.entries(byCheck).sort((a, b) => b[1] - a[1]).map(([k, n]) => `\`${k}\` ×${n}`).join(", "), "");
}
for (const l of lanes) {
  L.push(`## Lane checks: ${l.lane}`, "", "| Check | Where | Result |", "|---|---|---|");
  for (const x of l.results) L.push(`| ${cell(x.check)} | ${cell(x.where)} | ${x.ok ? "pass" + (x.note ? `: ${cell(x.note)}` : "") : `**${x.severity}**: ${cell(x.detail)}`} |`);
  L.push("");
}
writeFileSync(`${dir}/report.md`, L.join("\n"));
console.log(`${dir}/report.md`);
