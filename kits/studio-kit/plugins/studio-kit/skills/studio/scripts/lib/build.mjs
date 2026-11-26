// Builds a studio page: one self-contained HTML file from the skill's src/ files, plus the four parts a studio
// keeps as its own (its PROJECT block, its MORE block, the CSS and icons added for MORE choices).
//
// src/studio/ is the shared shell. Every other folder in src/ that has a files.json is a module (one kind of
// studio: button, palette, type). A page is built with one or more modules; the page records which in a meta tag.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../../src/", import.meta.url));
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");
const b64 = (f) => fs.readFileSync(path.join(SRC, f)).toString("base64");

/* AtlasScope's own identity for the studio's frame, the same in every project: the official lockup and symbol, the
   favicon, and Geist (a Latin subset, SIL Open Font License, fonts/OFL.txt) embedded so the page needs no network. */
const svgInner = (f, cls) => read(f).replace(/<title>[^<]*<\/title>/, "").replace(/^<svg /, `<svg class="${cls}" aria-hidden="true" focusable="false" `).replace(/ width="[^"]*" height="[^"]*"/, "").trim();
function brand() {
  return {
    fonts: `@font-face{font-family:"Studio Geist";src:url(data:font/woff2;base64,${b64("studio/fonts/geist-sans.woff2")}) format("woff2");font-weight:100 900;font-display:block}\n`
      + `@font-face{font-family:"Studio Geist Mono";src:url(data:font/woff2;base64,${b64("studio/fonts/geist-mono.woff2")}) format("woff2");font-weight:100 900;font-display:block}\n`,
    icon: `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${b64("studio/brand/icon.svg")}">`,
    logo: svgInner("studio/brand/lockup.svg", "aslogo aslogo--full") + svgInner("studio/brand/symbol.svg", "aslogo aslogo--mark"),
  };
}

/** Every module in src/: { id: { name, css: [], js: [] } }, in a steady order with button first. */
export function modules() {
  const out = {};
  const ids = fs.readdirSync(SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "studio" && fs.existsSync(path.join(SRC, d.name, "files.json")))
    .map((d) => d.name)
    .sort((a, b) => (a === "button" ? -1 : b === "button" ? 1 : a.localeCompare(b)));
  for (const id of ids) {
    const f = JSON.parse(read(`${id}/files.json`));
    out[id] = { name: String(f.name || id), order: +f.order || 50, css: (f.css || []).map((x) => `${id}/${x}`), js: (f.js || []).map((x) => `${id}/${x}`) };
  }
  return out;
}
/** Checks a list of module ids, and puts them in the order the page shows them. */
export function pickModules(wanted) {
  const all = modules();
  const ids = [...new Set((wanted && wanted.length ? wanted : ["button"]).map((x) => String(x).trim().toLowerCase()).filter(Boolean))];
  const bad = ids.filter((id) => !all[id]);
  if (bad.length) throw new Error(`No such studio: ${bad.join(", ")}. Available: ${Object.keys(all).join(", ")}.`);
  return ids.sort((a, b) => all[a].order - all[b].order);
}

const SHELL_CSS = ["studio/studio.css", "studio/scene.css"];
const SHELL_HEAD = ["studio/core.js"];
const SHELL_TAIL = ["studio/controls.js", "studio/state.js", "studio/scene.js", "studio/frame.js", "studio/panel.js", "studio/connection.js", "studio/events.js", "studio/boot.js"];

/** Palette Builder's colour maths (an ES module with no imports), wrapped so its names do not meet the page's. */
function colourJs() {
  const code = read("studio/colour.mjs");
  const names = [...code.matchAll(/^export (?:const|function) ([A-Za-z0-9_]+)/gm)].map((m) => m[1]);
  return `const COLOUR = (() => {\n${code.replace(/^export /gm, "")}\nreturn { ${names.join(", ")} };\n})();`;
}

// The parts a studio keeps across refreshes: each runs from its start marker up to (not including) its end marker.
export const REGIONS = {
  moreCss: ['<style id="more-css">', "</style>"],
  icons: ["<!-- MORE ICONS", "</defs>"],
  project: ["<script>\n/* REPLACE", "</script>"],
  more: ["<script>\n/* MORE:", "</script>"],
};
export function grab(html, [start, end]) {
  const i = html.indexOf(start);
  if (i < 0) return null;
  const j = html.indexOf(end, i);
  return j < 0 ? null : html.slice(i, j);
}
/** The modules a built page was made with. A page from before modules existed is a button studio. */
export function modulesOf(html) {
  const m = /<meta name="studio-modules" content="([a-z0-9,-]*)">/.exec(html);
  return m && m[1] ? m[1].split(",") : ["button"];
}

/* The page ships prebuilt: app/studio.html holds the whole studio, every module included. A session copies it, names the
   studios it shows (a meta tag the page reads) and fills in its own project; nothing is compiled per session. compile()
   makes app/studio.html from src/ (`node scripts/lib/build.mjs`); build() is what a session gets. */
export const APP_FILE = fileURLToPath(new URL("../../app/studio.html", import.meta.url));
const newest = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((t, d) => Math.max(t, d.isDirectory() ? newest(path.join(dir, d.name)) : fs.statSync(path.join(dir, d.name)).mtimeMs), 0);
/** The prebuilt studio; recompiled only when src/ is newer, which happens while the skill itself is being edited. */
function appHtml() {
  if (fs.existsSync(APP_FILE) && newest(SRC) <= fs.statSync(APP_FILE).mtimeMs) return fs.readFileSync(APP_FILE, "utf8");
  return compile();
}
/** A session's page: the prebuilt studio showing the chosen modules, with the session's own parts in place. */
export function build({ modules: wanted, keep = {} } = {}) {
  const ids = pickModules(wanted);
  let html = appHtml().replace(/<meta name="studio-modules" content="[a-z0-9,-]*">/, `<meta name="studio-modules" content="${ids.join(",")}">`);
  for (const [name, marks] of Object.entries(REGIONS)) {
    if (keep[name] == null) continue;
    const part = grab(html, marks);
    if (part == null) throw new Error("The prebuilt studio is missing " + marks[0]);
    html = html.replace(part, () => keep[name]);
  }
  return html;
}

export function compile({ modules: wanted, keep = {} } = {}) {
  const all = modules(), shown = pickModules(wanted), ids = Object.keys(all).sort((a, b) => all[a].order - all[b].order);
  const icons = read("studio/icons.svg");
  const iconsAt = icons.indexOf(REGIONS.icons[0]);
  const parts = {
    moreCss: keep.moreCss ?? '<style id="more-css">\n/* MORE CSS: the agent adds the classes for new choices here (see SKILL.md, "Add more choices"). */\n',
    icons: keep.icons ?? icons.slice(iconsAt),
    project: keep.project ?? "<script>\n" + read("project.js"),
    more: keep.more ?? "<script>\n" + read("more.js"),
  };
  const id = brand();
  const css = id.fonts + [...SHELL_CSS, ...ids.flatMap((id) => all[id].css)].map(read).join("\n");
  const files = [...SHELL_HEAD, ...ids.flatMap((id) => all[id].js), ...SHELL_TAIL];
  // Modules other than the button keep their names to themselves: each file runs in its own function scope, so a helper
  // it declares can never replace one of the shell's (the page is not strict code, so a block alone does not do that).
  const own = (f) => !f.startsWith("studio/") && !f.startsWith("button/");
  const js = [`/* ---- studio/colour.mjs (Palette Builder's colour maths) ---- */\n${colourJs()}`, ...files.map((f) => `/* ---- ${f} ---- */\n${own(f) ? `(() => {\n${read(f)}\n})();` : read(f)}`)].join("\n");
  if (/<\/script/i.test(js) || /<\/style/i.test(css)) throw new Error("A src file contains a closing script or style tag.");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="studio-modules" content="${shown.join(",")}">
<meta name="studio-available" content="${Object.entries(all).map(([id, m]) => id + ":" + m.name.replace(/[,:"<>&]/g, "")).join(",")}">
<title>Studio</title>
${id.icon}
<style>
${css}</style>
${parts.moreCss}</style></head><body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
${icons.slice(0, iconsAt)}${parts.icons}</defs></svg>
${read("studio/body.html").replace("<!-- LOGO -->", id.logo)}
${parts.project}</script>
${parts.more}</script>
<script>
/* ===== ENGINE: built from the studio skill's src/ folder. Edit it there, then run \`studio.mjs refresh\`. ===== */
${js}</script></body></html>
`;
}

/**
 * The same page as claude.ai publishes it: the Artifact tool wraps a file in its own doctype, head and body, so this
 * drops ours and keeps everything inside, with the title named after the project. Throws if the page is not one
 * this skill built.
 */
export function cloudPage(html, title) {
  const head = /^<!doctype html>\s*<html[^>]*><head><meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*(<meta name="studio-[a-z]+"[^>]*>\s*)*<title>[^<]*<\/title>\s*/i;
  const tail = /<\/body><\/html>\s*$/i;
  if (!head.test(html) || !tail.test(html) || !html.includes("</style></head><body>")) throw new Error("This index.html does not have the structure the skill builds; run refresh first.");
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const meta = (html.match(/<meta name="studio-(?:modules|available)"[^>]*>/g) || []).join("\n");
  return `<title>${esc(title)}</title>\n${meta}\n` + html.replace(head, "").replace("</style></head><body>", "</style>").replace(tail, "\n");
}

/** Rebuilds an existing studio page, keeping its own four parts and its modules (plus any in `add`). */
export function rebuild(html, add = []) {
  const keep = {};
  for (const [name, marks] of Object.entries(REGIONS)) {
    const part = grab(html, marks);
    if (part == null) throw new Error(`Could not find ${marks[0]} in the studio page; refresh it by hand.`);
    keep[name] = part;
  }
  return build({ modules: [...modulesOf(html), ...add], keep });
}

// `node scripts/lib/build.mjs` writes the prebuilt studio.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.mkdirSync(path.dirname(APP_FILE), { recursive: true });
  fs.writeFileSync(APP_FILE, compile());
  console.log("WROTE " + path.relative(process.cwd(), APP_FILE));
}
