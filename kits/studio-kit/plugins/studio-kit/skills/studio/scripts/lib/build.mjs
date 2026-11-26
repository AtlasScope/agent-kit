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

export function build({ modules: wanted, keep = {} } = {}) {
  const all = modules(), ids = pickModules(wanted);
  const icons = read("studio/icons.svg");
  const iconsAt = icons.indexOf(REGIONS.icons[0]);
  const parts = {
    moreCss: keep.moreCss ?? '<style id="more-css">\n/* MORE CSS: the agent adds the classes for new choices here (see SKILL.md, "Add more choices"). */\n',
    icons: keep.icons ?? icons.slice(iconsAt),
    project: keep.project ?? "<script>\n" + read("project.js"),
    more: keep.more ?? "<script>\n" + read("more.js"),
  };
  const css = [...SHELL_CSS, ...ids.flatMap((id) => all[id].css)].map(read).join("\n");
  const files = [...SHELL_HEAD, ...ids.flatMap((id) => all[id].js), ...SHELL_TAIL];
  const js = [`/* ---- studio/colour.mjs (Palette Builder's colour maths) ---- */\n${colourJs()}`, ...files.map((f) => `/* ---- ${f} ---- */\n${read(f)}`)].join("\n");
  if (/<\/script/i.test(js) || /<\/style/i.test(css)) throw new Error("A src file contains a closing script or style tag.");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="studio-modules" content="${ids.join(",")}">
<meta name="studio-available" content="${Object.entries(all).map(([id, m]) => id + ":" + m.name.replace(/[,:"<>&]/g, "")).join(",")}">
<title>Studio</title>
<style>
${css}</style>
${parts.moreCss}</style></head><body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
${icons.slice(0, iconsAt)}${parts.icons}</defs></svg>
${read("studio/body.html")}
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
