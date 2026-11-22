// node --test "kits/design-kit/plugins/design-kit/skills/palette-builder/tests/*.test.mjs"
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import * as P from "../scripts/palette.mjs";
import { parseColor, parseChannels, colorsIn, declarations, scan } from "../scripts/extract.mjs";
import { prepare, render, standalone, changesFrom } from "../scripts/build.mjs";
import { safePath, writeSafe } from "../scripts/safe-files.mjs";

function folder(t, files) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "palette-builder-")));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const [name, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), body);
  }
  return dir;
}
const SCENE = '<style>.s{background:var(--c-page);color:var(--c-text)}</style><div class="s"><b data-part="primary" style="background:var(--c-action);color:var(--c-label)">Go</b></div>';
const config = () => ({
  project: "Example",
  roles: [
    { id: "page", name: "Page", used: "Every screen", group: "Dark", type: "page", side: "dark", value: "#0B0C12", tokens: [{ name: "--background", file: "app.css", scope: ".dark", format: "hsl-channels" }] },
    { id: "text", name: "Text", used: "Words", group: "Dark", type: "text", side: "dark", value: "#FFFFFF", against: [["page", 4.5]] },
    { id: "action", name: "Button", used: "Go", group: "Dark", type: "fill", side: "dark", value: "#FFFFFF", against: [["page", 3]] },
    { id: "label", name: "Label", used: "Words on Go", group: "Dark", type: "on-fill", side: "dark", value: "#0B0C12", against: [["action", 4.5]] },
  ],
  palettes: [["navy", [262, 0.03]], ["moss", [155, 0.022]], ["sand", [80, 0.026]], ["rose", [10, 0.024]]].map(([id, tint]) => ({ id, name: id, idea: "A direction", tint })),
  scenes: [{ name: "Main", file: "main.html" }],
});

test("colour maths matches known values", () => {
  assert.equal(P.ratio("#000000", "#FFFFFF").toFixed(2), "21.00");
  assert.equal(P.showRatio(4.499), "4.4");
  for (const hex of ["#0B0C12", "#39FF88", "#5E6AD2", "#F5A524"]) {
    const back = P.oklch(...P.toOklch(hex));
    P.hexRgb(back).forEach((v, i) => assert.ok(Math.abs(v - P.hexRgb(hex)[i]) < 0.006, `${hex} became ${back}`));
    assert.equal(parseChannels("--color", P.formatColor(hex, "hsl-channels")).hex, hex);
  }
});

test("every colour syntax is read", () => {
  assert.equal(parseColor("#abc").hex, "#AABBCC");
  assert.equal(parseColor("rgb(255 0 0 / 50%)").alpha, 0.5);
  assert.equal(parseColor("hsla(0, 100%, 50%, .2)").hex, "#FF0000");
  assert.equal(parseColor("oklch(1 0 0)").hex, "#FFFFFF");
  assert.equal(parseChannels("--background", "15 18 34").hex, "#0F1222");
  assert.equal(parseColor("calc(1px + 2px)"), null);
});

test("stylesheets keep scope and line, and urls don't end a declaration", () => {
  const d = declarations('/* a\nb */\n:root{--bg:#fff}\n@media (prefers-color-scheme: dark){:root{--bg:#000}}\n.x{background:url("data:image/svg+xml;a;b") #123}');
  assert.deepEqual(d.map((x) => [x.name, x.scope, x.line]), [["--bg", ":root", 3], ["--bg", "@media (prefers-color-scheme: dark) :root", 4], ["background", ".x", 5]]);
  assert.deepEqual(colorsIn(d[2].value).map((c) => c.hex), ["#112233"]);
});

test("a project scan finds tokens, aliases and uses, and ignores anchors, issues and node_modules", (t) => {
  const dir = folder(t, {
    "app.css": ":root{--base:#101820;--bg:var(--base);--primary:240 10% 4%}\n.card{background:#FAFAFA}",
    "App.tsx": '// see #123\nconst a = <a href="#add" className="bg-[#FF0000] text-zinc-500">x</a>;',
    "node_modules/pkg/x.css": ".x{color:#ABCDEF}",
  });
  const r = scan([dir]), hexes = r.colors.map((c) => c.hex);
  assert.equal(r.tokens.find((x) => x.name === "--bg").resolves, "#101820");
  assert.equal(r.tokens.find((x) => x.name === "--primary").format, "hsl-channels");
  assert.equal(r.colors.find((c) => c.hex === "#FF0000").uses.background, 1);
  for (const no of ["#112233", "#AADDDD", "#ABCDEF"]) assert.ok(!hexes.includes(no), no);
  assert.equal(r.utilities[0].value, "text-zinc-500");
});

test("a good config builds a page whose script parses", (t) => {
  const { problems, data } = prepare(config(), folder(t, { "main.html": SCENE }));
  assert.deepEqual(problems, []);
  assert.equal(data.palettes.length, 5);
  for (const p of data.palettes) assert.deepEqual(P.failures(data.roles, p.roles), []);
  const html = render(data);
  assert.doesNotMatch(html, /__(TITLE|FONTS|MODEL|DATA)__/);
  new vm.Script(html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>")));
});

test("project text can't break out of the page or fill another slot", (t) => {
  const cfg = { ...config(), project: 'X</script><img src=x onerror="alert(1)"> __DATA__ $&' };
  const html = render(prepare(cfg, folder(t, { "main.html": SCENE })).data);
  assert.equal(html.split("</script").length, 2);
  assert.ok(!html.includes("<img src=x"));
});

test("chosen colours that fail come back with a shade that passes", (t) => {
  const cfg = config();
  cfg.palettes[0].roles = { text: "#222222" };
  assert.match(prepare(cfg, folder(t, { "main.html": SCENE })).problems.join(), /needs 4\.5.*#[0-9A-F]{6} is the closest/);
});

test("unsafe or disconnected scenes are refused", (t) => {
  for (const extra of ["<script>1</script>", '<b onclick="x()">x</b>', '<img src="https://example.com/a.png">', "<style>.z{color:#123456}</style>", "<style>.z{color:#123456}</style >", '<b style="color:var(--c-missing)">x</b>']) {
    assert.ok(prepare(config(), folder(t, { "main.html": SCENE + extra })).problems.length, extra);
  }
  assert.match(prepare(config(), folder(t, { "main.html": SCENE.replace("var(--c-text)", "inherit") })).problems.join(), /changing it would show nothing/);
});

test("picks become changes in the project's format, using the config's names only", (t) => {
  const { data } = prepare(config(), folder(t, { "main.html": SCENE }));
  const row = { id: "pal-navy", data: { status: "pick", finish: "glass", overrides: { page: "#000000" }, tokens: [{ file: "../../elsewhere" }] } };
  const { changes, finish } = changesFrom(data, [row]);
  assert.equal(finish, "glass");
  assert.deepEqual(changes[0].tokens, [{ name: "--background", file: "app.css", line: undefined, scope: ".dark", write: "0 0% 0%" }]);
  assert.throws(() => changesFrom(data, [{ id: "pal-navy", status: "pick", overrides: { page: "red; }" } }]));
  assert.throws(() => changesFrom(data, [{ id: "pal-navy", status: "" }]));
});

test("picks match the page after a palette changes, and say so", (t) => {
  const { data } = prepare(config(), folder(t, { "main.html": SCENE }));
  const old = { ...data.palettes[1].roles, page: "#101010" };
  const { changes, warnings } = changesFrom(data, [{ id: "pal-navy", status: "pick", overrides: {}, roles: old }]);
  assert.equal(changes.find((c) => c.role === "page").to, data.palettes[1].roles.page);
  assert.match(warnings.join(), /changed after it was picked/);
});

test("named colours are refused, words in property names are not", (t) => {
  assert.match(prepare(config(), folder(t, { "main.html": SCENE + "<style>.q{color:red}</style>" })).problems.join(), /red won't follow/);
  assert.deepEqual(prepare(config(), folder(t, { "main.html": SCENE + "<style>.q{white-space:nowrap;box-shadow:0 1px 2px rgba(16,24,40,.06)}</style>" })).problems, []);
});

test("hard-coded colours from a scan reach the page and the picks", (t) => {
  const { data } = prepare(config(), folder(t, { "main.html": SCENE }), { colors: [{ hex: "#1C222C", hardCoded: ["app.css:58"] }] });
  assert.deepEqual(data.hardCoded, [{ hex: "#1C222C", at: ["app.css:58"] }]);
  assert.equal(changesFrom(data, [{ id: "pal-navy", status: "pick" }]).hardCoded.length, 1);
});

test("the file to open directly is a whole document", (t) => {
  const html = standalone(render(prepare(config(), folder(t, { "main.html": SCENE })).data));
  assert.match(html, /^<!doctype html>/);
  assert.match(html, /<meta charset="utf-8">/);
  assert.equal(html.match(/<body>/g).length, 1);
});

test("bare channels keep their commas", () => {
  for (const [value, format] of [["255, 0, 0", "rgb-channels-comma"], ["240, 10%, 4%", "hsl-channels-comma"], ["255 0 0", "rgb-channels"]]) {
    const read = parseChannels("--brand-color", value);
    assert.equal(read.format, format);
    const written = P.formatColor(read.hex, format);
    assert.equal(written.includes(","), value.includes(","), written);
    assert.ok(parseChannels("--brand-color", written).hex);
  }
  assert.equal(P.formatColor("#0000FF", "rgb-channels-comma"), "0, 0, 255");
});

test("several paths keep one name per file", (t) => {
  const css = ":root{--brand:#123456}";
  const dir = folder(t, { "apps/web/tokens.css": css, "packages/theme/tokens.css": css });
  const paths = ["apps/web", "packages/theme"].map((p) => path.join(dir, p));
  assert.deepEqual(scan(paths).tokens.map((x) => x.file), ["apps/web/tokens.css", "packages/theme/tokens.css"]);
  assert.deepEqual(scan([paths[0]]).tokens.map((x) => x.file), ["tokens.css"]);
  assert.equal(scan([dir, paths[0]]).filesRead, 2, "an overlapping path isn't read twice");
});

test("picks with a see-through finish say the ratios are for flat colours", (t) => {
  const { data } = prepare(config(), folder(t, { "main.html": SCENE }));
  const warn = (finish) => changesFrom(data, [{ id: "pal-navy", status: "pick", finish }]).warnings.join();
  assert.match(warn("glass"), /flat colours/);
  assert.doesNotMatch(warn("matte"), /flat colours/);
});

test("links are refused, at the file and on the way to it", (t) => {
  const dir = folder(t, { "real/keep.txt": "SAFE", "real/main.html": SCENE });
  // A junction needs no special rights on Windows and is a plain symlink elsewhere.
  for (const name of ["out", "page.html"]) fs.symlinkSync(path.join(dir, "real"), path.join(dir, name), "junction");
  assert.throws(() => writeSafe(path.join(dir, "out/page.html"), "x", ".html"), /is a link/);
  assert.throws(() => writeSafe(path.join(dir, "page.html"), "x", ".html"), /is a link/);
  assert.ok(!fs.existsSync(path.join(dir, "real/page.html")));
  const cfg = { ...config(), scenes: [{ name: "Main", file: "out/main.html" }] };
  assert.match(prepare(cfg, dir).problems.join(), /is a link/);
});

test("a symlinked file is refused", (t) => {
  const dir = folder(t, { "victim": "SAFE" });
  try { fs.symlinkSync(path.join(dir, "victim"), path.join(dir, "page.html"), "file"); } catch (e) { if (e.code === "EPERM") return t.skip("no right to make file symlinks here"); throw e; }
  assert.throws(() => writeSafe(path.join(dir, "page.html"), "x", ".html"), /is a link/);
  assert.equal(fs.readFileSync(path.join(dir, "victim"), "utf8"), "SAFE");
});

test("a write replaces a hard link instead of writing through it", (t) => {
  const dir = folder(t, { "victim": "SAFE" }), out = path.join(dir, "page.html");
  fs.linkSync(path.join(dir, "victim"), out);
  writeSafe(out, "page", ".html");
  assert.equal(fs.readFileSync(path.join(dir, "victim"), "utf8"), "SAFE");
  assert.equal(fs.readFileSync(out, "utf8"), "page");
  assert.deepEqual(fs.readdirSync(dir).sort(), ["page.html", "victim"], "no temporary file left");
});

test("nothing is written into .git or under another extension", (t) => {
  const dir = folder(t, { "keep": "" });
  for (const p of [".git/hooks/page.html", ".GIT/page.html", "git~1/page.html"]) assert.throws(() => safePath(path.join(dir, p)), /inside .git/, p);
  assert.throws(() => writeSafe(path.join(dir, "pre-commit"), "x", ".html"), /has to end in/);
  assert.equal(safePath(path.join(dir, ".github/page.html")), path.join(dir, ".github", "page.html"));
});
