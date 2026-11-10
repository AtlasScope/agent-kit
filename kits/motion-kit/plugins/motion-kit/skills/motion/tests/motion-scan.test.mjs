// node --test "kits/motion-kit/plugins/motion-kit/skills/motion/tests/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const scan = (dir) => JSON.parse(execFileSync(process.execPath, [path.join(here, "../scripts/motion-scan.mjs"), path.join(here, "fixtures", dir), "--json"], { encoding: "utf8" }));
const rules = (r) => r.findings.map((f) => f.rule);

test("a messy codebase: every planted problem is listed with its file and line", () => {
  const r = scan("app");
  assert.equal(r.filesScanned, 2, "node_modules is skipped");
  for (const rule of ["transition-all", "layout-property", "long-transition", "ease-in", "linear", "infinite", "scale-from-zero", "will-change"]) assert.ok(rules(r).includes(rule), `missing ${rule}`);
  assert.deepEqual(r.system.map((s) => s.rule), ["no-reduced-motion", "duration-sprawl", "easing-sprawl", "no-tokens"]);
  const all = r.findings.find((f) => f.rule === "transition-all" && f.file === "src/styles.css");
  assert.equal(all.line, 1);
  assert.equal(r.findings[0].level, "fix", "fixes sort first");
  assert.equal(r.libraries.motion, 1);
  assert.equal(r.springs.length, 1);
  assert.ok(r.durations.some((d) => d.ms === 800), "Motion durations are read as seconds");
  assert.ok(r.durations.some((d) => d.ms === 700), "Tailwind durations are read");
});

test("a tidy codebase: tokens, two curves, reduced motion handled, nothing to flag", () => {
  const r = scan("clean");
  assert.deepEqual(r.findings, [], "linear on an opacity-only transition is not flagged");
  assert.deepEqual(r.system, []);
  assert.equal(r.reducedMotion.css, 1);
  assert.equal(r.totals.literalDurations, 0);
  assert.ok(r.totals.tokenDurations >= 4);
});

test("Tailwind utilities inside @apply in a stylesheet are counted, and plain CSS keywords are not counted twice", () => {
  const r = scan("apply");
  assert.ok(rules(r).includes("transition-all") && rules(r).includes("long-transition") && rules(r).includes("ease-in"));
  assert.ok(r.durations.some((d) => d.ms === 700));
  assert.equal(r.easings.find((e) => e.easing === "ease-in-out").count, 1, "the CSS declaration is counted once");
  assert.equal(r.findings.find((f) => f.rule === "transition-all").line, 2);
});

test("transitions written as longhand properties count as motion", () => {
  const r = scan("longhand");
  assert.equal(r.totals.transitions, 1);
  assert.ok(rules(r).includes("long-transition") && rules(r).includes("ease-in"));
  assert.deepEqual(r.system.map((s) => s.rule), ["no-reduced-motion"]);
});

test("inline style strings and library durations are read in the right units", () => {
  const r = scan("inline");
  const inline = r.findings.filter((f) => f.file === "Inline.tsx").map((f) => f.rule);
  assert.ok(inline.includes("transition-all") && inline.includes("layout-property"), "quoted values keep their first token");
  assert.ok(r.durations.some((d) => d.ms === 30000), "30 in a Motion file is thirty seconds");
  assert.ok(r.durations.some((d) => d.ms === 8) && !r.durations.some((d) => d.ms === 8000), "8 in a Web Animations call is eight milliseconds");
});

test("Tailwind v4 variable-backed utilities count as tokens", () => {
  const r = scan("tw4");
  assert.equal(r.totals.tokenDurations, 1);
  assert.equal(r.totals.literalDurations, 0);
  assert.deepEqual(r.easings.map((e) => e.easing), ["var(--ease-out)"]);
});

test("duration tokens are recognised by their place in a shorthand, whatever they are called", () => {
  const r = scan("tokens");
  assert.equal(r.totals.tokenDurations, 3, "one per transition: --motion-base, --t2 and --quick");
  assert.equal(r.totals.literalDurations, 0);
  assert.deepEqual(r.easings.map((e) => e.easing).sort(), ["var(--ease-out)", "var(--snap)"]);
  assert.ok(!r.system.some((x) => x.rule === "no-tokens"));
});

test("a folder with no motion says so and exits cleanly", () => {
  const out = execFileSync(process.execPath, [path.join(here, "../scripts/motion-scan.mjs"), path.join(here, "../agents")], { encoding: "utf8" });
  assert.match(out, /No motion found/);
});

test("a comment that mentions reduced motion does not count as handling it", () => {
  const r = scan("comment");
  assert.deepEqual(r.reducedMotion, { css: 0, tailwind: 0, js: 0 });
  assert.ok(r.system.some((s) => s.rule === "no-reduced-motion"));
});

test("Tailwind transitions with a bracketed property list are counted and checked", () => {
  const r = scan("arbitrary");
  assert.equal(r.totals.transitions, 2);
  assert.deepEqual(r.properties.map((p) => p.property).sort(), ["height", "opacity", "transform"]);
  assert.ok(r.findings.some((f) => f.rule === "layout-property" && f.line === 3));
  assert.ok(r.system.some((s) => s.rule === "no-reduced-motion"));
});

test("a transition shorthand that names no property is read as all", () => {
  const r = scan("shorthand");
  const all = r.findings.filter((f) => f.rule === "transition-all").map((f) => f.line);
  assert.deepEqual(all, [1, 3], "the unnamed variable on line 2 might be the property, so it is not assumed");
});

test("commented-out motion is not counted", () => {
  const r = scan("commented");
  assert.equal(r.totals.transitions + r.totals.animations, 0);
  assert.deepEqual(r.durations, []);
  assert.deepEqual(r.findings, []);
  assert.deepEqual(r.system, []);
});
