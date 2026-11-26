// The studio's build and checks: a fresh page passes its own check, new categories are judged by the same rules the
// page applies, and a module's own helpers can never replace the shell's.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { build, compile, modules, APP_FILE } from "../scripts/lib/build.mjs";
import { checkHtml, dimProblems, extensionProblems } from "../scripts/lib/check.mjs";

const withMore = (html, more, css = "") => html
  .replace("const MORE={\n", "const MORE={\n" + more + "\n")
  .replace('<style id="more-css">', '<style id="more-css">' + css);
const RIM = "dims:[{id:'rimLight',module:'button',t:'Rim light',options:[['none','No rim','None.'],['top','From above','A rim on top.']],default:'none',ranges:[{k:'rimK',label:'Brightness',min:0.2,max:1,step:0.05,default:0.6}]}],";

test("a fresh page with every studio passes its own check", () => {
  const all = ["button", "palette", "type", "surface", "spacing", "motion", "icons"];
  assert.deepEqual(Object.keys(modules()).sort(), [...all].sort(), "every studio in src/ is one the page is tested with");
  assert.deepEqual(checkHtml(build({ modules: all })), []);
  for (const id of all.slice(1)) assert.deepEqual(checkHtml(build({ modules: [id] })), [], `${id} alone`);
});

test("the prebuilt studio is current with src/, and a session is that page with its own studios named", () => {
  assert.equal(fs.readFileSync(APP_FILE, "utf8"), compile(), "app/studio.html is stale: run node scripts/lib/build.mjs");
  const html = build({ modules: ["palette", "type"] });
  assert.match(html, /<meta name="studio-modules" content="palette,type">/);
  assert.deepEqual(checkHtml(html), []);
});

test("a new category with CSS for its choices passes; the page's rules are the checker's", () => {
  const html = withMore(build({ modules: ["button"] }), RIM, ".x-rimLight-top .pv .fx{box-shadow:inset 0 2px 0 #fff}");
  assert.deepEqual(checkHtml(html), []);
  assert.deepEqual(extensionProblems(html), []);
});

test("a broken category is reported, so the server keeps serving the last good page", () => {
  const bad = withMore(build({ modules: ["button"] }), "dims:[{id:'Bad id',t:'Broken',options:[['x','X']]}],");
  const problems = extensionProblems(bad);
  assert.ok(problems.some((p) => /id must be/.test(p)), problems.join("\n"));
  assert.ok(problems.some((p) => /2 to 16 choices/.test(p)), problems.join("\n"));
  assert.ok(dimProblems({ dims: [{ id: "rimLight", t: "Rim", options: [["a", "A", "a."], ["b", "B", "b."]] }], }, "").some((p) => /no choice has CSS/.test(p)));
  assert.deepEqual(dimProblems({}, ""), []);
});

test("palette and typography code runs in its own scope, so its helpers cannot replace the shell's", () => {
  const html = build({ modules: ["button", "palette", "type"] });
  for (const f of ["palette/module.js", "type/module.js"]) {
    assert.match(html, new RegExp(`/\\* ---- ${f.replace("/", "\\/")} ---- \\*/\\n\\(\\(\\) => \\{`), f);
  }
  // The shell picks with choose(); a module's internal pick() must not share its name at the top level.
  assert.match(html, /\nfunction choose\(c, op\)/);
});

test("the colour maths stays byte-identical to Palette Builder's", () => {
  const here = fileURLToPath(new URL("../src/studio/colour.mjs", import.meta.url));
  const builder = fileURLToPath(new URL("../../../../../../design-kit/plugins/design-kit/skills/palette-builder/scripts/palette.mjs", import.meta.url));
  if (!fs.existsSync(builder)) return; // a copy of the plugin on its own
  assert.equal(fs.readFileSync(here, "utf8"), fs.readFileSync(builder, "utf8"));
});
