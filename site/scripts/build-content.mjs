#!/usr/bin/env node
// Reads library/library.json, the kits' skill folders, THIRD_PARTY.md and CREDITS.md, and writes
// site/content/generated.json: every prompt, skill, kit, area and fix page the site renders.
// Runs before `next dev` and `next build`. The output is not committed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import YAML from "yaml";
import { DESIGN_JOBS } from "./design-jobs.mjs";
import { composeCopy } from "../lib/copy.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const out = path.resolve(here, "../content/generated.json");
// Skill text comes from other authors, so raw HTML in a SKILL.md is shown as text, never rendered,
// and links keep only http(s), mailto and relative targets.
const escHtml = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
marked.use({
  renderer: {
    html({ text }) { return escHtml(text); },
    link({ href, title, tokens }) {
      const label = this.parser.parseInline(tokens);
      if (!/^(https?:|mailto:|#|\/|\.{0,2}\/?[\w-])/i.test(href) || /^\s*(javascript|data|vbscript):/i.test(href)) return label;
      return `<a href="${escHtml(href)}"${title ? ` title="${escHtml(title)}"` : ""} rel="nofollow noopener">${label}</a>`;
    },
    image({ href, text }) { return /^https:/i.test(href) ? `<img src="${escHtml(href)}" alt="${escHtml(text)}" loading="lazy">` : escHtml(text); },
  },
});
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

export const slugify = (s) =>
  s.toLowerCase().replace(/&/g, " and ").replace(/['’]/g, "").replace(/<[^>]*>/g, " ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/, "");

const lib = JSON.parse(read("library/library.json"));

// Sections, in the order the hub shows them. Wording matches the prompt library page.
const V3 = lib.v3;
const SECTIONS = [
  ["work", "Ways of working", "Add one to the end of any request. They change how the agent works, not what it works on."],
  ["inv", "Investigations", "Paste one to ask a careful question about your project. Each reports first and changes nothing."],
  ["plan", "Recipes", "A bigger job as prompts and commands in order. Some copy as one prompt for a single chat; the rest run one step per message."],
  ["ecmd", "Engineering commands", "Installed skills you start with a slash command. Each one runs part of an investigation for you."],
  ["dcmd", "Design commands", "Every design skill command, with a ready example prompt."],
  ["recipe", "Older design recipes", "Sequences of design commands by other authors. Kept until the recipes above cover the same jobs."],
];

// ---- Kits and skills ----
const kitDirs = fs.readdirSync(path.join(root, "kits")).filter((k) => fs.existsSync(path.join(root, "kits", k, "plugins", k)));
const authorByRepo = {};
for (const line of read("CREDITS.md").split("\n")) {
  const m = line.match(/^\| ([^|]+?) \|.*\[([^\]]+)\]\(https:\/\/github\.com\/[^)]+\) \| ([^|]+?) \|$/);
  if (m && !m[1].startsWith("Author")) authorByRepo[m[2].toLowerCase()] = m[1].trim();
}

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return [{}, text];
  return [YAML.parse(m[1]) || {}, text.slice(m[0].length)];
}

const kits = [];
const skills = [];
for (const kit of kitDirs) {
  const pdir = path.join("kits", kit, "plugins", kit);
  const manifest = JSON.parse(read(path.join(pdir, ".claude-plugin", "plugin.json")));
  const third = {};
  const tpPath = path.join("kits", kit, "THIRD_PARTY.md");
  let changeLines = [];
  if (fs.existsSync(path.join(root, tpPath))) {
    const tp = read(tpPath);
    for (const line of tp.split("\n")) {
      const m = line.match(/^\| `([^`]+)` \| \[([^\]]+)\]\(([^)]+)\) \| `([^`]+)`[^|]*\| ([^|]+?) \|$/);
      if (m) third[m[1]] = { repo: m[2], url: m[3], commit: m[4], license: m[5].trim() };
    }
    const changes = tp.split(/^##? .*Changes from upstream.*$|^Changes from upstream:/m)[1] || "";
    changeLines = changes.split(/\n(?=## )/)[0].split("\n").map((l) => l.replace(/^- /, "").trim()).filter(Boolean);
  }
  const skillRoot = path.join(pdir, "skills");
  const names = fs.readdirSync(path.join(root, skillRoot)).filter((n) => fs.existsSync(path.join(root, skillRoot, n, "SKILL.md"))).sort();
  for (const name of names) {
    const dir = path.join(skillRoot, name);
    const [fm, body] = frontmatter(read(path.join(dir, "SKILL.md")));
    const t = third[name];
    const licPath = path.join(root, dir, "LICENSE");
    const change = t ? changeLines.find((l) => l.includes("`" + name + "`")) : null;
    skills.push({
      name,
      kit,
      description: String(fm.description || "").replace(/\s+/g, " ").trim(),
      typedOnly: fm["disable-model-invocation"] === true || fm["disable-model-invocation"] === "true",
      bodyMd: body.trim(),
      bodyHtml: marked.parse(body.trim(), { gfm: true }),
      files: fs.readdirSync(path.join(root, dir)).filter((f) => f !== "SKILL.md").sort(),
      sourcePath: dir.split(path.sep).join("/"),
      license: fs.existsSync(licPath) ? fs.readFileSync(licPath, "utf8").trim() : null,
      credit: t
        ? { author: authorByRepo[t.repo.toLowerCase()] || t.repo.split("/")[0], repo: t.repo, url: t.url, commit: t.commit, license: t.license, change: change || null }
        : null,
    });
  }
  kits.push({
    name: kit,
    title: manifest.displayName || kit,
    description: manifest.description,
    version: manifest.version,
    skills: names,
    readmePath: `kits/${kit}/README.md`,
  });
}
const skillNames = new Set(skills.map((s) => s.name));

// ---- Prompts (every library entry gets a page) ----
// The page's recipes (v3.recipes) become entries too. Entries the library hides behind a replacement
// keep their page, marked replaced, and leave the lists, search and sitemap.
const HIDDEN = lib.notShown || {};
const WHEN = V3.when || {};
const entries = [...lib.entries, ...V3.recipes.map((r) => ({ ...r, sec: "plan", group: "Recipes", dmode: "Depends on the task" }))];
const used = new Set();
const prompts = entries.map((e) => {
  let slug = slugify(e.t);
  if (!slug || used.has(slug)) slug = slugify(`${e.t} ${e.id}`);
  used.add(slug);
  const out = { ...e, slug };
  if (WHEN[e.id] || e.when) out.when = WHEN[e.id] || e.when;
  return out;
});
const byId = Object.fromEntries(prompts.map((p) => [p.id, p]));
const slugById = Object.fromEntries(prompts.map((p) => [p.id, p.slug]));
// Design commands are grouped by job (scripts/design-jobs.mjs).
const jobOf = {};
for (const [title, , ids] of DESIGN_JOBS) for (const id of ids) {
  if (jobOf[id]) throw new Error(`${id} is listed under two design jobs`);
  jobOf[id] = title;
}
for (const e of lib.entries) if (e.sec === "dcmd" && !jobOf[e.id]) throw new Error(`Design command ${e.id} (${e.t}) has no job in site/scripts/design-jobs.mjs`);
for (const id of Object.keys(jobOf)) if (!lib.entries.some((e) => e.id === id && e.sec === "dcmd")) throw new Error(`design-jobs.mjs lists ${id}, which is not a design command`);
const jobBlurb = Object.fromEntries(DESIGN_JOBS.map(([t, b]) => [t, b]));
const areas = [];
const areaOf = {};
function addArea(title, sec, blurb, ids) {
  let slug = slugify(title);
  if (used.has(slug)) slug = `${slug}-${sec === "dcmd" || sec === "ecmd" ? "commands" : sec === "plan" ? "recipes" : "prompts"}`;
  if (used.has(slug)) throw new Error(`No free slug for area ${title}`);
  used.add(slug);
  const a = { slug, title, sec, blurb: blurb || null, prompts: [] };
  for (const id of ids) {
    const p = byId[id];
    if (!p) throw new Error(`Area ${title} names missing ${id}`);
    if (areaOf[id]) throw new Error(`${id} is in two areas: ${areaOf[id].title} and ${title}`);
    areaOf[id] = a;
    if (!HIDDEN[id]) a.prompts.push(p.slug);
  }
  areas.push(a);
}
for (const c of V3.promptCats) addArea(c.title, c.kind === "work" ? "work" : "inv", c.blurb, c.ids);
for (const g of V3.recipeGroups) addArea(g.title, "plan", g.blurb, g.ids);
for (const g of [...new Set(lib.entries.filter((e) => e.sec === "ecmd").map((e) => e.group))]) addArea(g, "ecmd", lib.areaBlurb[g], lib.entries.filter((e) => e.sec === "ecmd" && e.group === g).map((e) => e.id));
for (const [title, , ids] of DESIGN_JOBS) addArea(title, "dcmd", jobBlurb[title], ids);
for (const g of [...new Set(lib.entries.filter((e) => e.sec === "recipe").map((e) => e.group))]) addArea(g, "recipe", lib.areaBlurb[g], lib.entries.filter((e) => e.sec === "recipe" && e.group === g).map((e) => e.id));
// Hidden entries sit under what replaces them; anything still without an area is a mistake.
for (const p of prompts) {
  if (HIDDEN[p.id]) {
    const to = byId[HIDDEN[p.id]];
    p.replacedBy = to.slug;
    areaOf[p.id] = areaOf[p.id] || areaOf[to.id];
  }
  if (!areaOf[p.id]) throw new Error(`${p.id} (${p.t}) has no area: add it to a category in library.json v3`);
  p.area = areaOf[p.id].slug;
}
const cmdSkill = (c) => { const w = c.replace(/^\//, "").split(/[\s:]/)[0]; return skillNames.has(w) ? w : null; };
const keenCmd = (ref) => (ref.startsWith("K:") ? "/keen " + ref.slice(2) : null);
for (const p of prompts) {
  p.related = (p.rel || []).filter((id) => slugById[id] && !HIDDEN[id]).map((id) => slugById[id]);
  const cmds = [...(p.kit || []), p.cmd, p.sec === "dcmd" ? p.t : null, ...(p.sec === "plan" ? p.steps.map(([r]) => keenCmd(r) || byId[r]?.cmd) : [])].filter(Boolean);
  p.skills = [...new Set(cmds.map(cmdSkill).filter(Boolean))];
}
// A page recipe's steps: each names a prompt (linked), a command, or plain words.
for (const p of prompts.filter((x) => x.sec === "plan")) {
  p.planSteps = p.steps.map(([ref, note]) => {
    const e = byId[ref];
    if (e && !HIDDEN[ref]) return { label: e.cmd && (e.sec === "ecmd" || e.sec === "dcmd") ? e.cmd : e.t, note, slug: e.slug, kind: e.sec === "ecmd" || e.sec === "dcmd" ? "command" : "prompt" };
    if (keenCmd(ref)) return { label: keenCmd(ref), note, slug: null, kind: "command" };
    return { label: ref, note, slug: null, kind: ref.startsWith("/") ? "command" : "step" };
  });
  p.split = p.split || p.planSteps.some((s) => s.kind === "command");
  // Each step's own Copy: a command as typed, a prompt with all its rules.
  p.planSteps.forEach((s, i) => { const e = byId[p.steps[i][0]]; s.copy = s.kind === "command" ? s.label : e && s.slug ? composeCopy(e) : null; });
  // One chat: the recipe's own text, or each step's full prompt in order. Step by step: the first step.
  p.p = p.copy || (p.split ? p.planSteps[0].copy || p.planSteps[0].label : [
    `${p.t}. ${p.line}`,
    "Run these steps one at a time. After each one, tell me what you found or changed and wait for my yes before starting the next. Steps that only investigate must not change anything.",
    ...p.planSteps.map((s, i) => `Step ${i + 1} (${s.note}):\n` + (s.copy ? s.copy.replace(/\n*Start your report in plain English[^\n]*$/, "") : s.label + ".")),
    "Start your report in plain English: what you found, what it means, and whether I need to do anything. Put files, lines and commands underneath.",
  ].join("\n\n"));
  delete p.steps; delete p.copy;
}

// Old area pages (one per library group) redirect to the category holding most of their entries.
const oldAreaRedirects = [];
for (const sec of ["inv", "db", "think"]) for (const g of new Set(lib.entries.filter((e) => e.sec === sec).map((e) => e.group))) {
  const tally = {};
  for (const e of lib.entries.filter((x) => x.sec === sec && x.group === g)) { const a = areaOf[e.id]; if (a) tally[a.slug] = (tally[a.slug] || 0) + 1; }
  const best = Object.entries(tally).sort((x, y) => y[1] - x[1])[0];
  for (const slug of [slugify(g), `${slugify(g)}-prompts`]) if (best && !used.has(slug) && !oldAreaRedirects.some((r) => r.from === slug)) oldAreaRedirects.push({ from: slug, to: best[0] });
}

// A design job lists its commands in the order design-jobs.mjs gives, most useful first.
// (addArea keeps the order design-jobs.mjs gives.)

// ---- Fix pages (symptoms) ----
const fixes = [];
for (const [list, scope] of [[lib.symptoms, "code"], [lib.dbSymptoms, "database"]]) {
  for (const [title, ids] of list) {
    let slug = slugify(title);
    if (fixes.some((f) => f.slug === slug)) slug = slugify(`${title} ${scope}`);
    fixes.push({ slug, title, scope, prompts: ids.map((id) => (HIDDEN[id] ? HIDDEN[id] : id)).filter((id, i, a) => slugById[id] && a.indexOf(id) === i).map((id) => slugById[id]) });
  }
}

for (const s of skills) s.prompts = prompts.filter((p) => p.skills.includes(s.name)).map((p) => p.slug);

// The old by-author design pages (/prompts/impeccable-commands and so on) now redirect to the design commands index.
const retired = [...new Set(lib.entries.filter((e) => e.sec === "dcmd").map((e) => e.group))]
  .flatMap((g) => [slugify(g), `${slugify(g)}-commands`])
  .filter((s) => !used.has(s));
const listed = prompts.filter((p) => !p.replacedBy);

const content = {
  retired,
  oldAreas: oldAreaRedirects,
  sections: SECTIONS.map(([id, title, blurb]) => ({ id, title, blurb })),
  areas,
  prompts,
  skills,
  kits,
  fixes,
  counts: { prompts: listed.length, skills: skills.length, borrowed: skills.filter((s) => s.credit).length, kits: kits.length },
};

// Every URL segment under /prompts must be unique across prompts and areas.
const seen = new Set();
for (const s of [...areas.map((a) => a.slug), ...prompts.map((p) => p.slug)]) {
  if (seen.has(s)) throw new Error(`Two pages want /prompts/${s}`);
  seen.add(s);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(content));
console.log(`content: ${listed.length} listed prompts (${prompts.length} pages), ${areas.length} areas, ${skills.length} skills (${content.counts.borrowed} borrowed), ${kits.length} kits, ${fixes.length} fix pages, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
