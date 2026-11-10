// Needs Playwright with a browser. Skips, and says so, when the machine has none.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, "../scripts/filmstrip.mjs");
const page = path.join(here, "fixtures/page.html");
const run = (...args) => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "filmstrip-test-"));
  const r = spawnSync(process.execPath, [script, page, "--out", out, "--json", ...args], { encoding: "utf8", timeout: 120000 });
  return { ...r, out, json: r.status === 0 ? JSON.parse(r.stdout) : null };
};
const probe = run("--do", "click:#open-good", "--frames", "4");
const skip = probe.status === 3 ? "Playwright or its browser is not available on this machine" : false;

test("a CSS transition is stepped frame by frame and described", { skip }, () => {
  assert.equal(probe.status, 0, probe.stderr);
  const m = probe.json;
  assert.equal(m.windowMs, 200);
  assert.equal(m.frames.length, 4);
  assert.equal(m.framesChanged, 3, "every frame shows progress");
  assert.deepEqual(m.animations.map((a) => a.properties[0]).sort(), ["opacity", "transform"]);
  assert.ok(m.animations.every((a) => a.composited && a.duration === 200 && a.easing === "cubic-bezier(0.2, 0, 0, 1)"));
  for (const f of ["sheet.png", "sheet.html", "filmstrip.json", "frames/before.png", "frames/00.png", "frames/03.png"]) assert.ok(fs.existsSync(path.join(probe.out, f)), f);
});

test("a height transition is reported as layout work, and the real-time run counts the layouts", { skip }, () => {
  const { json: m, status, stderr } = run("--do", "click:#open-bad", "--perf", "--throttle", "1");
  assert.equal(status, 0, stderr);
  assert.deepEqual(m.animations[0].layout, ["height"]);
  assert.equal(m.animations[0].composited, false);
  assert.equal(m.animations[0].easing, "ease-in");
  assert.ok(m.perf.layouts > 10, `expected a layout on most frames, saw ${m.perf.layouts}`);
});

test("a page entrance is measured while it plays, not after it has finished", { skip }, () => {
  const entrance = path.join(here, "fixtures/entrance.html");
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "filmstrip-test-"));
  const r = spawnSync(process.execPath, [script, entrance, "--out", out, "--json", "--do", "load", "--perf", "--throttle", "1"], { encoding: "utf8", timeout: 120000 });
  assert.equal(r.status, 0, r.stderr);
  const m = JSON.parse(r.stdout);
  assert.deepEqual(m.animations[0].layout, ["height"]);
  assert.ok(m.perf.layouts > 10, `the entrance animates height for 500ms, yet only ${m.perf.layouts} layouts were counted`);
});

test("reduced motion: the good panel drops its movement, the bad one does not", { skip }, () => {
  const good = run("--do", "click:#open-good", "--reduced").json;
  assert.deepEqual(good.animations.map((a) => a.properties.join()), ["opacity"]);
  const bad = run("--do", "click:#open-bad", "--reduced").json;
  assert.deepEqual(bad.animations[0].layout, ["height"]);
});

test("a change with no animation is reported as instant, not as nothing happening", { skip }, () => {
  const { json: m } = run("--do", "click:#snap");
  assert.equal(m.animations.length, 0);
  assert.equal(m.instant, true);
  assert.match(m.note, /instant/);
});

test("script-driven motion has no Web Animations but still produces changing frames", { skip }, () => {
  const { json: m } = run("--do", "click:#run-js", "--ms", "400", "--frames", "5");
  assert.equal(m.animations.length, 0);
  assert.ok(m.framesChanged >= 3, `saw ${m.framesChanged} changed frames`);
  assert.match(m.note, /script-driven/);
});

test("a Playwright copy inside the project is not loaded unless the project is trusted", () => {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), "filmstrip-untrusted-"));
  const sentinel = path.join(proj, "ran.txt");
  for (const name of ["playwright", "playwright-core", "@playwright/test"]) {
    const dir = path.join(proj, "node_modules", name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name, main: "index.js" }));
    fs.writeFileSync(path.join(dir, "index.js"), `require("fs").writeFileSync(${JSON.stringify(sentinel)}, "ran"); module.exports = {};`);
  }
  const go = (...extra) => spawnSync(process.execPath, [script, page, "--out", path.join(proj, "out"), "--json", "--do", "click:#open-good", "--frames", "2", ...extra], { cwd: proj, encoding: "utf8", timeout: 120000 });
  go();
  assert.equal(fs.existsSync(sentinel), false, "the project's module must not be imported by default");
  go("--project-playwright");
  assert.equal(fs.existsSync(sentinel), true, "with the flag, the project's copy is the first one tried");
});

test("an unknown action fails with a usage error instead of a blank capture", { skip }, () => {
  const r = run("--do", "wiggle:#x");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Unknown action/);
});
