// Builds a studio page: one self-contained HTML file from the skill's src/ files, plus the four parts a studio
// keeps as its own (its PROJECT block, its MORE block, the CSS and icons added for MORE choices).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../../src/", import.meta.url));
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");

// Concatenated in this order into one <style> and one engine <script>; later files use names from earlier ones.
export const CSS = ["studio/studio.css", "button/button.css"];
export const JS = [
  "studio/core.js", "button/catalogue.js", "studio/controls.js", "studio/state.js", "button/preview.js",
  "studio/frame.js", "studio/panel.js", "studio/connection.js", "studio/events.js", "studio/boot.js",
];

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

export function build(keep = {}) {
  const icons = read("button/icons.svg");
  const iconsAt = icons.indexOf(REGIONS.icons[0]);
  const parts = {
    moreCss: keep.moreCss ?? '<style id="more-css">\n/* MORE CSS: the agent adds the classes for new choices here (see SKILL.md, "Add more choices"). */\n',
    icons: keep.icons ?? icons.slice(iconsAt),
    project: keep.project ?? "<script>\n" + read("project.js"),
    more: keep.more ?? "<script>\n" + read("more.js"),
  };
  const css = CSS.map(read).join("\n");
  const js = JS.map((f) => `/* ---- ${f} ---- */\n${read(f)}`).join("\n");
  if (/<\/script/i.test(js) || /<\/style/i.test(css)) throw new Error("A src file contains a closing script or style tag.");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Button studio</title>
<style>
${css}</style>
${parts.moreCss}</style></head><body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
${icons.slice(0, iconsAt)}${parts.icons}</defs></svg>
${read("studio/body.html")}
${parts.project}</script>
${parts.more}</script>
<script>
/* ===== ENGINE: built from the button-studio skill's src/ folder. Edit it there, then run \`studio.mjs refresh\`. ===== */
${js}</script></body></html>
`;
}

/**
 * The same page as claude.ai publishes it: the Artifact tool wraps a file in its own doctype, head and body, so this
 * drops ours and keeps everything inside, with the title named after the project. Throws if the page is not one
 * this skill built.
 */
export function cloudPage(html, title) {
  const head = /^<!doctype html>\s*<html[^>]*><head><meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*<title>[^<]*<\/title>\s*/i;
  const tail = /<\/body><\/html>\s*$/i;
  if (!head.test(html) || !tail.test(html) || !html.includes("</style></head><body>")) throw new Error("This index.html does not have the structure the skill builds; run refresh first.");
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<title>${esc(title)}</title>\n` + html.replace(head, "").replace("</style></head><body>", "</style>").replace(tail, "\n");
}

/** Rebuilds an existing studio page, keeping its own four parts. Throws if a part cannot be found. */
export function rebuild(html) {
  const keep = {};
  for (const [name, marks] of Object.entries(REGIONS)) {
    const part = grab(html, marks);
    if (part == null) throw new Error(`Could not find ${marks[0]} in the studio page; refresh it by hand.`);
    keep[name] = part;
  }
  return build(keep);
}
