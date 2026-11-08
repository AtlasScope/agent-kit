#!/usr/bin/env node
// Reads library/library.json, the kits' skill folders, THIRD_PARTY.md and CREDITS.md, and writes
// site/content/generated.json: every prompt, skill, kit, area and fix page the site renders.
// Runs before `next dev` and `next build`. The output is not committed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import YAML from "yaml";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const out = path.resolve(here, "../content/generated.json");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

export const slugify = (s) =>
  s.toLowerCase().replace(/&/g, " and ").replace(/['’]/g, "").replace(/<[^>]*>/g, " ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/, "");

const lib = JSON.parse(read("library/library.json"));

// Sections, in the order the hub shows them. Wording matches the prompt library page.
const SECTIONS = [
  ["inv", "Engineering investigations", "Prompts that send an agent looking for one kind of problem without changing anything. Each says what proof to bring back and when to skip it."],
  ["db", "Database", "Prompts for PostgreSQL databases on any host: proving the data is right, simpler and cheaper writes, a leaner schema, real costs, and changes tested on a copy. All read-only unless you say otherwise."],
  ["think", "Thinking prompts", "Short lines you add to any task to change how the agent works: try to prove itself wrong, keep things simple, check its work, hand off cleanly."],
  ["ecmd", "Engineering commands", "Installed skills you start with a slash command. Each one runs part of an investigation for you."],
  ["dcmd", "Design commands", "Every design skill command, with a ready example prompt."],
  ["recipe", "Design recipes", "Short sequences of design commands for a whole job, from a new landing page to dark mode."],
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
// Prompt pages get the clean slug; an area hub that collides with one takes a suffix.
const used = new Set();
const prompts = lib.entries.map((e) => {
  let slug = slugify(e.t);
  if (!slug || used.has(slug)) slug = slugify(`${e.t} ${e.id}`);
  used.add(slug);
  return { ...e, slug };
});
const areas = [];
const areaBySecGroup = {};
for (const [sec] of SECTIONS) {
  const groups = [...new Set(lib.entries.filter((e) => e.sec === sec).map((e) => e.group))];
  for (const g of groups) {
    let slug = slugify(g);
    if (used.has(slug)) slug = `${slug}-${sec === "dcmd" || sec === "ecmd" ? "commands" : "prompts"}`;
    if (used.has(slug)) throw new Error(`No free slug for area ${g}`);
    used.add(slug);
    const a = { slug, title: g, sec, blurb: lib.areaBlurb[g] || null, prompts: [] };
    areas.push(a);
    areaBySecGroup[sec + "|" + g] = a;
  }
}
const slugById = Object.fromEntries(prompts.map((p) => [p.id, p.slug]));
const cmdSkill = (c) => { const w = c.replace(/^\//, "").split(/[\s:]/)[0]; return skillNames.has(w) ? w : null; };
for (const p of prompts) {
  const area = areaBySecGroup[p.sec + "|" + p.group];
  p.area = area.slug;
  area.prompts.push(p.slug);
  p.related = (p.rel || []).filter((id) => slugById[id]).map((id) => slugById[id]);
  const cmds = [...(p.kit || []), p.cmd, p.sec === "dcmd" ? p.t : null].filter(Boolean);
  p.skills = [...new Set(cmds.map(cmdSkill).filter(Boolean))];
}

// ---- Fix pages (symptoms) ----
const fixes = [];
for (const [list, scope] of [[lib.symptoms, "code"], [lib.dbSymptoms, "database"]]) {
  for (const [title, ids] of list) {
    let slug = slugify(title);
    if (fixes.some((f) => f.slug === slug)) slug = slugify(`${title} ${scope}`);
    fixes.push({ slug, title, scope, prompts: ids.filter((id) => slugById[id]).map((id) => slugById[id]) });
  }
}

for (const s of skills) s.prompts = prompts.filter((p) => p.skills.includes(s.name)).map((p) => p.slug);

const content = {
  sections: SECTIONS.map(([id, title, blurb]) => ({ id, title, blurb })),
  areas,
  prompts,
  skills,
  kits,
  fixes,
  counts: { prompts: prompts.length, skills: skills.length, borrowed: skills.filter((s) => s.credit).length, kits: kits.length },
};

// Every URL segment under /prompts must be unique across prompts and areas.
const seen = new Set();
for (const s of [...areas.map((a) => a.slug), ...prompts.map((p) => p.slug)]) {
  if (seen.has(s)) throw new Error(`Two pages want /prompts/${s}`);
  seen.add(s);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(content));
console.log(`content: ${prompts.length} prompts, ${areas.length} areas, ${skills.length} skills (${content.counts.borrowed} borrowed), ${kits.length} kits, ${fixes.length} fix pages, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
