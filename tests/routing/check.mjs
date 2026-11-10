#!/usr/bin/env node
// Checks that tests/routing/cases.json is well formed and that every route it names exists.
// It does not run an agent: see README.md for how to run the cases and record results.
// Usage, from the repo root: node tests/routing/check.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "../..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const { cases } = JSON.parse(fs.readFileSync(path.join(here, "cases.json"), "utf8"));
const L = JSON.parse(read("library/library.json"));

const errors = [];
const fail = (msg) => errors.push(msg);

// Skills shipped in this repo: /name, or /plugin:name for the plugin's own namespace.
const shipped = new Set();
for (const kit of fs.readdirSync(path.join(root, "kits"))) {
  const plugins = path.join(root, "kits", kit, "plugins");
  if (!fs.existsSync(plugins)) continue;
  for (const plugin of fs.readdirSync(plugins)) {
    const skills = path.join(plugins, plugin, "skills");
    if (!fs.existsSync(skills)) continue;
    for (const s of fs.readdirSync(skills)) {
      if (!fs.existsSync(path.join(skills, s, "SKILL.md"))) continue;
      shipped.add("/" + s);
      shipped.add(`/${plugin}:${s}`);
    }
  }
}
const ids = new Set(L.entries.map((e) => e.id));
const commands = new Set(L.entries.map((e) => e.cmd).filter(Boolean));
const recipes = new Set(
  [...read("kits/design-kit/plugins/design-kit/skills/design/references/recipes.md").matchAll(/^## (.+)$/gm)].map((m) => m[1]),
);
const SPECIAL = new Set(["ask", "none", "say-missing"]);

const resolves = (r) =>
  SPECIAL.has(r) || ids.has(r) || shipped.has(r) || commands.has(r) || (r.startsWith("recipe:") && recipes.has(r.slice(7)));
// "/hallmark <prompt>" is the shipped /hallmark skill; "/impeccable polish" is still Impeccable.
const isShipped = (r) => SPECIAL.has(r) || ids.has(r) || shipped.has(r.split(" ")[0]) || r.startsWith("recipe:");

const ROUTERS = ["/design", "/engineer", "/database", "diagnose", "none"];
const KINDS = ["clear", "ambiguous", "negative", "missing-dep", "cross-kit"];
const seen = new Set();
for (const c of cases) {
  const at = c.id || JSON.stringify(c).slice(0, 40);
  if (!/^[A-Z]{2}\d{2}$/.test(c.id || "")) fail(`${at}: id must be two letters and two digits`);
  if (seen.has(c.id)) fail(`${at}: duplicate id`);
  seen.add(c.id);
  if (!["stable", "heldout"].includes(c.set)) fail(`${at}: set must be stable or heldout`);
  if (!ROUTERS.includes(c.router)) fail(`${at}: unknown router ${c.router}`);
  if (!KINDS.includes(c.kind)) fail(`${at}: unknown kind ${c.kind}`);
  if (!c.request || !c.context) fail(`${at}: needs a request and a context line`);
  if (c.router.startsWith("/") && !c.request.startsWith(c.router + " ")) fail(`${at}: an explicit router case must start with "${c.router} "`);
  if (c.router === "none" && /^\/(design|engineer|database)\b/.test(c.request)) fail(`${at}: a negative case must not type a router`);
  if (!Array.isArray(c.expect) || !c.expect.length) fail(`${at}: expect must list at least one acceptable route`);
  for (const k of ["expect", "without", "disallowed"]) {
    for (const r of c[k] || []) if (!resolves(r)) fail(`${at}: ${k} route ${r} is not a shipped skill, library command, library ID or recipe`);
  }
  const both = (c.expect || []).filter((r) => (c.disallowed || []).includes(r));
  if (both.length) fail(`${at}: ${both.join(", ")} is both expected and disallowed`);
  // A case whose first pick comes from an outside plugin must say what happens without it.
  if (!isShipped(c.expect[0])) {
    if (!c.without?.length) fail(`${at}: ${c.expect[0]} is not shipped here, so the case needs a "without" route`);
    for (const r of c.without || []) if (!isShipped(r)) fail(`${at}: fallback ${r} is not shipped here either`);
  }
  // Negative cases assume the default install: routers wait to be typed unless the person chose automatic start.
  if (c.kind === "negative") {
    for (const r of c.disallowed || []) {
      const name = r.slice(1);
      if (!["design", "engineer", "database"].includes(name)) continue;
      const kit = name === "design" ? "design-kit" : "engineering-kit";
      const base = `kits/${kit}/plugins/${kit}`;
      const skill = read(`${base}/skills/${name}/SKILL.md`);
      const desc = skill.match(/^description: (.*)$/m)?.[1] || "";
      if (!/^disable-model-invocation: true$/m.test(skill) && !/Without that note, ordinary \w+ talk must not activate it/.test(desc))
        fail(`${at}: ${r} can start on its own without the automatic-start note`);
      const start = JSON.parse(read(`${base}/.claude-plugin/plugin.json`)).userConfig?.start_mode;
      if (start && start.default !== "typed") fail(`${at}: ${kit} start_mode must default to "typed"`);
      if (!/allow_implicit_invocation: false/.test(read(`${base}/skills/${name}/agents/openai.yaml`)))
        fail(`${at}: ${r} must stay typed-only in Codex (agents/openai.yaml)`);
    }
  }
}

const count = (f) => cases.filter(f).length;
if (cases.length < 40) fail(`Only ${cases.length} cases; the set needs at least 40`);
if (count((c) => c.set === "heldout") < 8) fail("The held-out set needs at least 8 cases");
for (const k of KINDS) if (count((c) => c.kind === k) < 2) fail(`Needs at least two ${k} cases`);
for (const r of ROUTERS) if (!count((c) => c.router === r)) fail(`No cases for ${r}`);

if (errors.length) {
  for (const e of errors) console.error("- " + e);
  process.exit(1);
}
console.log(`Routing cases OK: ${cases.length} cases (${count((c) => c.set === "stable")} stable, ${count((c) => c.set === "heldout")} held out).`);
