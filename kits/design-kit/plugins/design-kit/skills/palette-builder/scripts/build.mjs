#!/usr/bin/env node
// Checks a palette config and builds the workbook page from it.
//   node build.mjs <palette.config.json> <out.html>     writes the page
//   node build.mjs <palette.config.json> --check        checks only
//   node build.mjs <palette.config.json> --picks <file> turns the user's picks into token changes; edits nothing
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as P from "./palette.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
export const FINISHES = [["built", "As built"], ["matte", "Matte"], ["depth", "Depth"], ["glass", "Glass"], ["glow", "Glow"]];
const ID = /^[a-z][a-z0-9-]{0,39}$/;
const RESERVED = new Set(["constructor", "prototype"]);
const text = (v) => typeof v === "string" && v.trim() !== "";
const range = (r) => Array.isArray(r) && r.length === 2 && r.every((x) => typeof x === "number" && x >= 0 && x <= 1) && r[0] < r[1];

const NAMED = /(?<![\w-])(white|black|red|blue|green|gr[ae]y|yellow|orange|purple|pink|brown|navy|teal|silver|gold|cyan|magenta|lime|maroon|olive|indigo|violet|crimson|tomato|coral|salmon|turquoise|beige|ivory)(?![\w-])/gi;

function checkScene(name, html, roles, fixed, problems) {
  const at = `scene "${name}"`;
  if (/<\s*(script|iframe|object|embed|link|meta|base|form)\b/i.test(html)) problems.push(`${at}: scripts, frames, forms, links to files and meta tags don't belong in a preview`);
  if (/<[^>]*[\s"'/]on[a-z]+\s*=/i.test(html) || /(java|vb)script:|data:text\/html/i.test(html)) problems.push(`${at}: remove event handlers and javascript: links`);
  const remote = [...html.matchAll(/(?:\bsrc\s*=\s*|\bsrcset\s*=\s*|url\(\s*)["']?([^"')\s>]+)/gi)].filter((m) => !/^(data:image\/|#)/i.test(m[1]));
  if (remote.length || /@import/i.test(html)) problems.push(`${at}: use inline SVG, CSS or data:image for pictures; a published page can't load other files`);
  if (/<a\b[^>]*\bhref\s*=/i.test(html)) problems.push(`${at}: use <span> for links, so a click in the preview doesn't leave the page`);

  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style[^>]*>/gi)].map((m) => m[1]).join("\n").replace(/\/\*[\s\S]*?\*\//g, "");
  const values = [...styles.matchAll(/:([^;{}]+)(?=[;}])/g), ...html.matchAll(/\b(?:style|fill|stroke|stop-color|color|bgcolor)\s*=\s*"([^"]*)"/gi)].map((m) => m[1].replace(/url\([^)]*\)/gi, "")).join("\n");
  const literal = new Set();
  const painted = [...styles.matchAll(/(?<![\w-])(?:color|background(?:-color)?|border(?:-[a-z]+)?|outline(?:-color)?|fill|stroke)\s*:([^;{}]+)/gi), ...html.matchAll(/\b(?:fill|stroke|stop-color)\s*=\s*"([^"]*)"/gi), ...html.matchAll(/\bstyle\s*=\s*"([^"]*)"/gi)].map((m) => m[1]).join("\n");
  for (const m of painted.replace(/var\([^)]*\)|url\([^)]*\)/gi, "").matchAll(NAMED)) if (!fixed.has(m[0].toUpperCase())) literal.add(m[0]);
  for (const m of values.matchAll(/#[0-9a-f]{3,8}(?![\w-])|(?:rgba?|hsla?|oklch|oklab)\([^()]*\)/gi)) {
    const raw = m[0];
    // Black, white and faint tints are shadows and highlights.
    const alpha = raw.match(/^(?:rgba?|hsla?)\([^)]*[,/]\s*(0?\.\d+|0)\s*\)$/i);
    if (/^rgba?\(\s*(0|255)[\s,]+\1[\s,]+\1\s*[,/]/i.test(raw) || (alpha && +alpha[1] <= 0.2) || fixed.has(raw.toUpperCase())) continue;
    literal.add(raw);
  }
  if (literal.size) problems.push(`${at}: ${[...literal].slice(0, 8).join(", ")} won't follow the palette. Use var(--c-<role id>), or list a colour that must never change under "fixed"`);

  const used = new Set([...html.matchAll(/var\(\s*--c-([a-z0-9-]+)/g)].map((m) => m[1]));
  for (const id of used) if (!roles.has(id)) problems.push(`${at}: var(--c-${id}) has no role`);
  return used;
}

export function prepare(cfg, dir, scanned = null) {
  const problems = [], notes = [];
  const bad = () => ({ problems, notes, data: null });
  if (!text(cfg.project)) problems.push('"project" needs the product\'s name');
  if (!Array.isArray(cfg.roles) || cfg.roles.length < 4 || cfg.roles.length > 40) { problems.push('"roles" needs 4 to 40 colour jobs'); return bad(); }

  const ids = new Set(), tokenOwner = new Map();
  for (const r of cfg.roles) {
    const at = `role "${r.id}"`;
    if (!ID.test(r.id || "") || RESERVED.has(r.id)) problems.push(`${at}: id must be lower-case letters, digits and hyphens`);
    if (ids.has(r.id)) problems.push(`${at}: id is used twice`);
    ids.add(r.id);
    for (const key of ["name", "used", "group"]) if (!text(r[key])) problems.push(`${at}: needs "${key}"`);
    if (!Object.hasOwn(P.TYPES, r.type ?? "")) problems.push(`${at}: type must be one of ${Object.keys(P.TYPES).join(", ")}`);
    if (!["dark", "light"].includes(r.side)) problems.push(`${at}: side must be dark or light, for the ground it sits on`);
    if (r.kind !== undefined && !["neutral", "color"].includes(r.kind)) problems.push(`${at}: kind must be neutral or color`);
    if (r.range !== undefined && !range(r.range)) problems.push(`${at}: range must be [low, high] lightness between 0 and 1`);
    if (!P.HEX.test(r.value || "")) problems.push(`${at}: value must be the project's colour now, as #RRGGBB (flatten transparent colours onto their background)`);
    for (const t of r.tokens || []) {
      if (!text(t.name) || !text(t.file)) problems.push(`${at}: each token needs "name" and "file"`);
      if (t.format && !P.FORMATS.includes(t.format)) problems.push(`${at}: token format must be one of ${P.FORMATS.join(", ")}`);
      const key = `${t.file}\n${t.scope || ":root"}\n${t.name}`;
      if (tokenOwner.has(key)) problems.push(`${at}: ${t.name} also belongs to "${tokenOwner.get(key)}". One token can only be one role`);
      tokenOwner.set(key, r.id);
    }
  }
  for (const r of cfg.roles) {
    for (const pair of r.against || []) {
      if (!Array.isArray(pair) || pair.length !== 2 || !ids.has(pair[0]) || pair[0] === r.id || !(typeof pair[1] === "number" && pair[1] >= 0 && pair[1] <= 21)) problems.push(`role "${r.id}": "against" is a list of [other role id, minimum ratio]`);
    }
    if (["text", "text2", "text3", "on-fill"].includes(r.type) && !(r.against || []).some((p) => p[1])) problems.push(`role "${r.id}": readable roles need a contrast pair, for example [["page", 4.5]]`);
  }
  if (problems.length) return bad();

  const roles = cfg.roles.map((r) => ({ ...r, value: r.value.toUpperCase(), tokens: r.tokens || [], against: r.against || [] }));
  const current = Object.fromEntries(roles.map((r) => [r.id, r.value]));
  const finishes = new Set(FINISHES.map(([id]) => id));
  const palettes = [{ id: "current", name: "Current", idea: cfg.currentIdea || "What the project uses today. The baseline to beat.", finish: "built", roles: current }];

  if (!Array.isArray(cfg.palettes) || cfg.palettes.length < 4 || cfg.palettes.length > 12) problems.push('"palettes" needs 4 to 12 directions besides Current');
  const palIds = new Set(["current"]), looks = new Map([[JSON.stringify(current), "current"]]);
  for (const p of Array.isArray(cfg.palettes) ? cfg.palettes : []) {
    const at = `palette "${p.id}"`;
    if (!ID.test(p.id || "") || palIds.has(p.id)) { problems.push(`${at}: needs its own id ("current" is made for you)`); continue; }
    palIds.add(p.id);
    if (!text(p.name) || !text(p.idea)) problems.push(`${at}: needs "name" and a one-line "idea"`);
    const finish = p.finish || "built";
    if (!finishes.has(finish)) problems.push(`${at}: finish must be one of ${[...finishes].join(", ")}`);
    if (p.tint && !(Array.isArray(p.tint) && p.tint.length === 2 && p.tint.every(Number.isFinite) && p.tint[1] >= 0 && p.tint[1] <= 0.15)) { problems.push(`${at}: tint is [hue 0-360, chroma 0-0.15]`); continue; }
    const set = p.roles || {}, values = { ...current };
    const unknown = Object.keys(set).filter((id) => !ids.has(id) || !P.HEX.test(set[id]));
    if (unknown.length) { problems.push(`${at}: ${unknown.join(", ")} must be existing roles with #RRGGBB values`); continue; }
    for (const r of roles) {
      if (Object.hasOwn(set, r.id)) values[r.id] = set[r.id].toUpperCase();
      else if (p.tint && !P.isColor(r)) values[r.id] = P.applyTint(r, r.value, p.tint);
    }
    // Colours the author didn't choose are nudged to pass. Colours they did choose come back as problems.
    const moved = new Map();
    for (let round = 0; round < 2; round++) for (const r of roles) {
      if (Object.hasOwn(set, r.id) || !P.failures([r], values).length) continue;
      const to = P.nearestPassing(r, values);
      if (to) { moved.set(r.id, `${r.id} to ${to}`); values[r.id] = to; }
    }
    if (moved.size) notes.push(`${at}: nudged ${[...moved.values()].join(", ")} to pass contrast`);
    // One line per role, for its worst pair.
    const worst = new Map();
    for (const f of P.failures(roles, values)) if (!worst.has(f.role) || f.got / f.min < worst.get(f.role).got / worst.get(f.role).min) worst.set(f.role, f);
    for (const f of worst.values()) {
      const to = P.nearestPassing(roles.find((r) => r.id === f.role), values);
      problems.push(`${at}: ${f.role} ${values[f.role]} is ${P.showRatio(f.got)}:1 on ${f.bg}, needs ${f.min}.${to ? ` ${to} is the closest shade that passes` : ` Change ${f.bg} as well`}`);
    }
    const look = JSON.stringify(values);
    if (looks.has(look)) problems.push(`${at}: same colours as "${looks.get(look)}"`);
    looks.set(look, p.id);
    palettes.push({ id: p.id, name: p.name, idea: p.idea, finish, roles: values });
  }
  for (const f of P.failures(roles, current)) notes.push(`current: ${f.role} is ${P.showRatio(f.got)}:1 on ${f.bg}, needs ${f.min}. Shown as a failure, left as it is`);

  const fixed = new Set((cfg.fixed || []).map((x) => String(x).toUpperCase())), used = new Set(), scenes = [];
  if (!Array.isArray(cfg.scenes) || !cfg.scenes.length) problems.push('"scenes" needs at least one preview built from the project\'s real pieces');
  for (const s of Array.isArray(cfg.scenes) ? cfg.scenes : []) {
    const file = path.resolve(dir, s.file || ""), rel = path.relative(dir, file);
    if (!text(s.name) || !text(s.file)) { problems.push('each scene needs "name" and "file"'); continue; }
    if (rel.startsWith("..") || path.isAbsolute(rel)) { problems.push(`scene "${s.name}": keep the file in the config's folder`); continue; }
    if (!fs.existsSync(file)) { problems.push(`scene "${s.name}": ${s.file} doesn't exist`); continue; }
    const html = fs.readFileSync(file, "utf8");
    if (s.width !== undefined && !(Number.isInteger(s.width) && s.width >= 320 && s.width <= 1920)) problems.push(`scene "${s.name}": width is whole pixels, 320 to 1920`);
    const own = new Set([...fixed, ...(s.fixed || []).map((x) => String(x).toUpperCase())]);
    for (const id of checkScene(s.name, html, ids, own, problems)) used.add(id);
    scenes.push({ name: s.name, html, width: s.width });
  }
  if (scenes.length) {
    for (const r of roles) if (!used.has(r.id)) problems.push(`role "${r.id}": no scene uses var(--c-${r.id}), so changing it would show nothing`);
    if (!scenes.some((s) => /data-part\s*=/.test(s.html))) problems.push('no scene marks a data-part ("card", "primary", "input", "bar", "status"), so the finishes would show nothing');
  }

  const inUse = cfg.inUse || [];
  if (!Array.isArray(inUse) || !inUse.every((x) => P.HEX.test(x))) problems.push('"inUse" is a list of #RRGGBB colours');
  const fonts = cfg.fonts || [];
  if (!Array.isArray(fonts) || !fonts.every((f) => /^[A-Za-z0-9 ]+(:(ital,)?wght@[0-9.,;]+)?$/.test(f))) problems.push('"fonts" lists Google Fonts as "Inter" or "Inter:wght@400;600"');
  if (problems.length) return bad();

  // From extract.mjs's colours.json: copies of colours in the code that a token change won't reach.
  const hardCoded = (Array.isArray(scanned?.colors) ? scanned.colors : [])
    .filter((c) => P.HEX.test(c.hex || "") && Array.isArray(c.hardCoded) && c.hardCoded.length)
    .map((c) => ({ hex: c.hex.toUpperCase(), at: c.hardCoded.filter(text).slice(0, 12) }));
  const slug = cfg.project.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
  return { problems, notes, data: { project: cfg.project, slug, hardCoded, source: cfg.source || "", roles, palettes, scenes, finishes: FINISHES, fonts, inUse: [...new Set(inUse.map((x) => x.toUpperCase()))] } };
}

export function render(data) {
  const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const families = ["Geist:wght@400;500;600", "Geist Mono:wght@400;500", ...data.fonts.filter((f) => !/^Geist( Mono)?(:|$)/.test(f))];
  const slots = {
    TITLE: escape(`${data.project} Palette`),
    FONTS: escape(`https://fonts.googleapis.com/css2?${families.map((f) => `family=${f.replace(/ /g, "+")}`).join("&")}&display=swap`),
    MODEL: fs.readFileSync(path.join(here, "palette.mjs"), "utf8").replace(/^export /gm, ""),
    // Escaped: "<" could end the script tag, and U+2028/2029 end a line in older engines.
    DATA: JSON.stringify(data).replace(new RegExp(`[<${String.fromCharCode(0x2028, 0x2029)}]`, "g"), (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")),
  };
  // One pass, so project text can't fill in another slot.
  return fs.readFileSync(path.join(here, "../assets/workbook.html"), "utf8").replace(/__(TITLE|FONTS|MODEL|DATA)__/g, (_, key) => slots[key]);
}

export function standalone(page) {
  const at = page.indexOf('<div class="wrap">');
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${page.slice(0, at)}</head>\n<body>\n${page.slice(at)}</body></html>\n`;
}

// Picks come from a page other people may edit, so only known ids, hex values and finishes get through.
// Names, files and formats always come from the config.
export function changesFrom(data, input) {
  const docs = (Array.isArray(input) ? input : [input]).map((d) => ({ ...(d?.data || d), id: d?.id || d?.data?.id }));
  const picked = docs.filter((d) => d.status === "pick");
  if (picked.length !== 1) throw new Error(picked.length ? "More than one palette is picked. Ask the user which one." : "No palette is marked Pick yet.");
  const pick = picked[0], base = data.palettes.find((p) => `pal-${p.id}` === pick.id || p.id === pick.id);
  const swaps = pick.overrides || {}, snapshot = pick.roles || {}, values = {}, changes = [], warnings = [];
  let moved = false;
  for (const r of data.roles) {
    // The page shows the palette plus the swaps. The saved snapshot only matters if the palette is gone.
    const to = base ? (swaps[r.id] ?? base.roles[r.id]) : snapshot[r.id];
    if (!P.HEX.test(to || "")) throw new Error(`The pick has no valid colour for "${r.id}".`);
    values[r.id] = to.toUpperCase();
    if (base && P.HEX.test(snapshot[r.id] || "") && snapshot[r.id].toUpperCase() !== values[r.id]) moved = true;
    if (values[r.id] === r.value) continue;
    changes.push({ role: r.id, from: r.value, to: values[r.id], tokens: r.tokens.map((t) => ({ name: t.name, file: t.file, line: t.line, scope: t.scope || ":root", write: P.formatColor(values[r.id], t.format) })) });
  }
  if (!base) warnings.push("The picked palette is no longer in the config. These are the colours saved when it was picked.");
  if (moved) warnings.push("The palette changed after it was picked. These are the colours the page shows now: check with the user.");
  for (const f of P.failures(data.roles, values)) warnings.push(`${f.role} is ${P.showRatio(f.got)}:1 on ${f.bg}, needs ${f.min}`);
  for (const c of changes) if (!c.tokens.length) warnings.push(`${c.role} has no token: change it where it is written`);
  const finish = FINISHES.some(([id]) => id === pick.finish) ? pick.finish : base?.finish || "built";
  if (finish === "glass" || finish === "depth") warnings.push(`${finish} changes what is behind text, and these ratios are for flat colours: check contrast on the real page after applying it`);
  return { palette: base?.name || "Unknown palette", finish, warnings, changes, hardCoded: changes.length ? data.hardCoded : [] };
}

function main([config, option, extra]) {
  if (!config || !option || (option === "--picks" && !extra)) {
    console.error("Usage: node build.mjs <palette.config.json> <out.html> | --check | --picks <file>");
    return 2;
  }
  let cfg;
  try { cfg = JSON.parse(fs.readFileSync(config, "utf8")); } catch (e) { console.error(`Can't read ${config}: ${e.message}`); return 1; }
  const dir = path.dirname(path.resolve(config)), found = path.join(dir, "colours.json");
  let scanned = null;
  if (fs.existsSync(found)) { try { scanned = JSON.parse(fs.readFileSync(found, "utf8")); } catch { console.log("note  colours.json can't be read, so hard-coded colours aren't listed"); } }
  const { problems, notes, data } = prepare(cfg, dir, scanned);
  if (option !== "--picks") for (const n of notes) console.log(`note  ${n}`);
  if (problems.length) { console.error(problems.map((p) => `fix   ${p}`).join("\n")); return 1; }
  if (option === "--picks") {
    try { console.log(JSON.stringify(changesFrom(data, JSON.parse(fs.readFileSync(extra, "utf8"))), null, 2)); } catch (e) { console.error(e.message); return 1; }
    return 0;
  }
  if (option === "--check") { console.log(`OK: ${data.roles.length} roles, ${data.palettes.length} palettes, ${data.scenes.length} scenes.`); return 0; }
  if (option.startsWith("--")) { console.error(`Unknown option ${option}`); return 2; }
  fs.mkdirSync(path.dirname(path.resolve(option)), { recursive: true });
  const page = render(data), alone = option.replace(/(\.html?)?$/i, ".standalone.html");
  fs.writeFileSync(option, page);
  // An Artifact host adds the document around the page. A file opened directly needs its own.
  fs.writeFileSync(alone, standalone(page));
  console.log(`Built ${option} to publish, and ${alone} to open as a file: ${data.roles.length} roles, Current + ${data.palettes.length - 1} palettes, scenes: ${data.scenes.length}.`);
  return 0;
}

if (process.argv[1] && path.basename(process.argv[1]) === "build.mjs") process.exitCode = main(process.argv.slice(2));
