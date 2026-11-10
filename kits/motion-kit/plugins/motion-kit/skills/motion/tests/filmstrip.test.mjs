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

test("a short script-driven entrance is captured from its first frame", { skip }, () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "filmstrip-test-"));
  const r = spawnSync(process.execPath, [script, path.join(here, "fixtures/entrance-script.html"), "--out", out, "--json", "--do", "load", "--ms", "120", "--frames", "4"], { encoding: "utf8", timeout: 120000 });
  assert.equal(r.status, 0, r.stderr);
  const m = JSON.parse(r.stdout);
  assert.ok(m.framesChanged >= 2, `the 80ms entrance should still be moving in the frames, saw ${m.framesChanged} changes`);
});

test("a load capture can wait for an element that a timer reveals", { skip }, () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "filmstrip-test-"));
  const r = spawnSync(process.execPath, [script, path.join(here, "fixtures/entrance-timer.html"), "--out", out, "--json", "--do", "load", "--wait", "#ready", "--frames", "3"], { encoding: "utf8", timeout: 60000 });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).animations[0].name, "ready-in");
});

test("the real-time run of a load capture also waits for the target before its window", { skip }, () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "filmstrip-test-"));
  const r = spawnSync(process.execPath, [script, path.join(here, "fixtures/entrance-late.html"), "--out", out, "--json", "--do", "load", "--wait", "#ready", "--perf", "--throttle", "1", "--frames", "3"], { encoding: "utf8", timeout: 60000 });
  assert.equal(r.status, 0, r.stderr);
  const m = JSON.parse(r.stdout);
  assert.ok(m.perf.layouts > 5, `the height animation starts 1.2s after load and should be counted, saw ${m.perf.layouts} layouts`);
});

test("the real-time run lasts as long as the animation the frames show", { skip }, () => {
  const { json: m, status, stderr } = run("--do", "click:#open-late", "--perf", "--throttle", "1", "--frames", "3");
  assert.equal(status, 0, stderr);
  assert.equal(m.windowMs, 1300);
  assert.ok(m.perf.windowMs >= 1300, `perf ran for ${m.perf.windowMs}ms`);
  assert.ok(m.perf.layouts > 5, `the delayed height animation should be counted, saw ${m.perf.layouts} layouts`);
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

test("--clip on an element the action reveals crops to it instead of capturing the whole viewport", { skip }, () => {
  const { json: m, status, stderr } = run("--do", "click:#open-menu", "--clip", "[role=menu]", "--frames", "3");
  assert.equal(status, 0, stderr);
  assert.ok(m.clip && m.clip.width < 300 && m.clip.height < 200, `expected a crop around the menu, got ${JSON.stringify(m.clip)}`);
  assert.ok(m.clip.x >= 370 && m.clip.y >= 270, "the crop sits where the menu rests");
  assert.equal(m.before, null);
  assert.match(m.note, /after the action revealed/);
  assert.equal(m.animations[0].name, "menu-in");
  assert.equal(m.framesChanged, 2, "the entrance still plays in the frames after the crop was measured");
});

test("--perf survives an action that loads a new page", { skip }, () => {
  const { json: m, status, stderr } = run("--do", "click:#next", "--perf", "--throttle", "1", "--frames", "2");
  assert.equal(status, 0, stderr);
  assert.ok(m.perf.frames > 5, `the sampler should keep running in the new document, saw ${m.perf.frames} frames`);
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

test("a symbolic link planted in the output folder is refused, and its target is left untouched", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "filmstrip-link-"));
  const victim = path.join(dir, "victim.txt");
  fs.writeFileSync(victim, "keep me");
  const out = path.join(dir, "out");
  fs.mkdirSync(out);
  fs.symlinkSync(victim, path.join(out, "sheet.html"));
  const r = spawnSync(process.execPath, [script, page, "--out", out, "--do", "click:#open-good", "--frames", "2"], { encoding: "utf8", timeout: 120000 });
  assert.equal(fs.readFileSync(victim, "utf8"), "keep me");
  if (r.status !== 3) { assert.equal(r.status, 2); assert.match(r.stderr, /symbolic link/); }
});

test("a package whose entry point escapes its own folder is never loaded from a trusted place", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "filmstrip-escape-"));
  const sentinel = path.join(dir, "ran.txt");
  fs.writeFileSync(path.join(dir, "payload.cjs"), `require("fs").writeFileSync(${JSON.stringify(sentinel)}, "ran"); module.exports = {};`);
  const pkg = path.join(dir, "tools", "node_modules", "playwright");
  fs.mkdirSync(pkg, { recursive: true });
  fs.writeFileSync(path.join(pkg, "package.json"), JSON.stringify({ name: "playwright", main: "../../../payload.cjs" }));
  const work = path.join(dir, "work"); fs.mkdirSync(work);
  spawnSync(process.execPath, [script, page, "--out", path.join(dir, "out"), "--do", "click:#open-good", "--frames", "2"], { cwd: work, encoding: "utf8", timeout: 120000, env: { ...process.env, MOTION_PLAYWRIGHT_DIR: path.join(dir, "tools") } });
  assert.equal(fs.existsSync(sentinel), false, "an entry outside the package folder must not be imported");
});

test("a copy of the skill installed inside a project does not pick up that project's Playwright", () => {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), "filmstrip-nested-"));
  fs.mkdirSync(path.join(proj, ".git"));
  const sentinel = path.join(proj, "ran.txt");
  const pkg = path.join(proj, "node_modules", "playwright");
  fs.mkdirSync(pkg, { recursive: true });
  fs.writeFileSync(path.join(pkg, "package.json"), JSON.stringify({ name: "playwright", main: "index.js" }));
  fs.writeFileSync(path.join(pkg, "index.js"), `require("fs").writeFileSync(${JSON.stringify(sentinel)}, "ran"); module.exports = {};`);
  const copy = path.join(proj, ".agents", "skills", "motion", "scripts");
  fs.mkdirSync(copy, { recursive: true });
  fs.copyFileSync(script, path.join(copy, "filmstrip.mjs"));
  const nested = path.join(proj, "packages", "app"); fs.mkdirSync(nested, { recursive: true });
  spawnSync(process.execPath, [path.join(copy, "filmstrip.mjs"), page, "--out", path.join(os.tmpdir(), "filmstrip-nested-out"), "--do", "click:#open-good", "--frames", "2"], { cwd: nested, encoding: "utf8", timeout: 120000 });
  assert.equal(fs.existsSync(sentinel), false, "the project's module must not be imported from a nested working directory");
});

test("a link higher up the output path is refused before anything is removed", () => {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), "filmstrip-ancestor-"));
  fs.mkdirSync(path.join(proj, ".git"));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "filmstrip-outside-"));
  const victim = path.join(outside, "motion", "menu", "frames", "keep.txt");
  fs.mkdirSync(path.dirname(victim), { recursive: true });
  fs.writeFileSync(victim, "keep me");
  fs.symlinkSync(outside, path.join(proj, ".artifacts"));
  const r = spawnSync(process.execPath, [script, page, "--out", ".artifacts/motion/menu", "--do", "click:#open-good", "--frames", "2"], { cwd: proj, encoding: "utf8", timeout: 120000 });
  assert.equal(fs.readFileSync(victim, "utf8"), "keep me");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /symbolic link on the way/);
});

test("an animation a timer starts between frames keeps the time it began", { skip }, () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "filmstrip-test-"));
  const r = spawnSync(process.execPath, [script, path.join(here, "fixtures/staged.html"), "--out", out, "--json", "--do", "click:#go", "--ms", "400", "--frames", "3"], { encoding: "utf8", timeout: 60000 });
  assert.equal(r.status, 0, r.stderr);
  const second = JSON.parse(r.stdout).animations.find((a) => a.name === "second");
  assert.ok(second, "the staged animation is found");
  assert.ok(Math.abs(second.startedAt - 100) <= 20, `it starts 100ms in, recorded ${second.startedAt}ms`);
});

test("an unknown action fails with a usage error instead of a blank capture", { skip }, () => {
  const r = run("--do", "wiggle:#x");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Unknown action/);
});
