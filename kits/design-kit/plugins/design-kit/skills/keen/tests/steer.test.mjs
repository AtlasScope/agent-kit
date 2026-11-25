// Pointing at a part of a running version and tuning its values, without a browser: what a version may offer,
// how its document is served, and what reaches the waiting agent.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { addPage, cleanPoint, noteFor, readBook, render, serve, tooLong, tuneProblems, tuneValue, wait, withSteering } from "../scripts/worksheet.mjs";
import { TUNE_A, TUNE_B, steerPage } from "./steer-fixture.mjs";

const tmp = (name) => fs.mkdtempSync(path.join(os.tmpdir(), `keen-${name}-`));
const up = async (t, dir) => { const s = await serve(dir); t.after(() => s.close()); return s; };
const post = (s, data) => fetch(`http://127.0.0.1:${s.port}/choose`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ k: s.token, ...data }) });
const book = () => { const dir = tmp("steer"); addPage(dir, steerPage(tmp("live"))); return dir; };
const button = { tag: "button", selector: "main > ul:nth-of-type(2) > li:nth-of-type(2) > button", text: "Claim", label: "", box: { x: 520, y: 412.6, w: 88, h: 44 }, viewport: 1440, styles: { "font-size": "14px", "background": "rgb(47, 107, 79)", "border-radius": "999px" } };

test("a version offers a few named values for tuning, each one checked before the page is added", () => {
  const view = { name: "A", live: "/x.html", revise: "/keen revise A", tune: TUNE_A };
  assert.deepEqual(tuneProblems(view), []);
  assert.deepEqual(tuneProblems({ ...view, tune: TUNE_B }), []);
  const bad = (tune, extra = {}) => tuneProblems({ ...view, ...extra, tune }).join(" ");
  assert.match(bad([{ ...TUNE_A[0], var: "accent" }]), /CSS custom property/);
  assert.match(bad([TUNE_A[0], TUNE_A[0]]), /listed twice/);
  assert.match(bad([{ ...TUNE_A[0], value: "red" }]), /#rrggbb/);
  assert.match(bad([{ ...TUNE_A[1], value: 2 }]), /value between them/);
  assert.match(bad([{ ...TUNE_A[1], step: 0 }]), /step above 0/);
  assert.match(bad([{ ...TUNE_B[1], unit: "furlongs" }]), /unit must be one of/);
  assert.match(bad([{ ...TUNE_B[0], options: [{ label: "Odd", value: "1px;}body{display:none" }, TUNE_B[0].options[1]] }]), /plain CSS value/);
  assert.match(bad([{ ...TUNE_B[0], value: "99px" }]), /one of its options/);
  assert.match(bad([{ ...TUNE_A[0], type: "slider" }]), /color, number or choice/);
  assert.match(bad(TUNE_A, { live: undefined, phone: "x.png" }), /needs a live page/);
  assert.match(bad(TUNE_A, { revise: undefined }), /needs a revise command/);

  const page = steerPage(tmp("live"));
  page.workspace.views[1].tune = [...TUNE_A, ...TUNE_B, { ...TUNE_A[0], var: "--ink" }];
  page.workspace.views[2].tune = [{ ...TUNE_A[0], label: "The colour of every accent" }];
  const long = tooLong(page);
  assert.ok(long.some((l) => l.startsWith("workspace.views[1].tune has 5 items; 4 at most")));
  assert.ok(long.some((l) => l.startsWith("workspace.views[2].tune[0].label is 5 words; 3 at most")));
  const broken = steerPage(tmp("live"));
  broken.workspace.views[0].tune = TUNE_A; // the original has no revise command
  assert.throws(() => addPage(tmp("steer"), broken), /tuning cannot be drawn[\s\S]*views\[0\] \(Now\)\.tune needs a revise command/);
});

test("a tuned value is read the same way on the page and by the server", () => {
  const [accent, scale] = TUNE_A, [corners, spacing] = TUNE_B;
  assert.equal(tuneValue(accent, "#C2410C"), "#c2410c");
  assert.equal(tuneValue(accent, "rgb(0,0,0)"), null);
  assert.equal(tuneValue(scale, "1.4000000000000001"), "1.4");
  assert.equal(tuneValue(scale, "1.6"), null, "outside its range");
  assert.equal(tuneValue({ ...spacing, unit: "px" }, "18"), "18px");
  assert.equal(tuneValue(spacing, "18; color:red"), null);
  assert.equal(tuneValue(corners, "22px"), "22px");
  assert.equal(tuneValue(corners, "23px"), null);
});

test("a part the person pointed at is reduced to plain, capped data", () => {
  const raw = { ...button, text: "Claim\n\u2028it  <b>now</b>" + "x".repeat(500), styles: { ...button.styles, onclick: "alert(1)", color: 5 }, extra: { deep: true }, box: { x: 1e12, y: "4", w: Infinity, h: 44.4 } };
  const el = cleanPoint(raw);
  assert.deepEqual(Object.keys(el), ["tag", "selector", "text", "label", "box", "viewport", "styles"]);
  assert.equal(el.text.length, 160);
  assert.ok(el.text.startsWith("Claim it <b>now</b>"), "one line; markup is kept as text and escaped wherever it is shown");
  assert.deepEqual(el.box, { x: 1e6, y: 0, w: 0, h: 44 });
  assert.deepEqual(Object.keys(el.styles), ["font-size", "background", "border-radius"], "only the styles Keen reads, and only strings");
  for (const bad of [null, "button", { ...button, tag: "<img>" }, { ...button, selector: "" }, { ...button, tag: 7 }]) assert.equal(cleanPoint(bad), null);
});

test("the note for the agent: plain words stay plain; parts and tuned values become one line of JSON", () => {
  const view = { name: "A: Menu", live: "live-0000000000000000.html", revise: "/r", tune: TUNE_A };
  assert.equal(noteFor(view, "r", { note: "Bigger dish names.\nPlease." }), "Bigger dish names. Please.");
  const note = noteFor(view, "r", { note: "Warmer overall.", points: [{ say: "The loudest thing\nin the row", el: button }], tuned: { "--accent": "#C2410C", "--step": "1.25" } });
  assert.ok(!/[\n\r\u2028\u2029]/.test(note), "one line, so it can never start a line of its own");
  assert.deepEqual(JSON.parse(note), {
    say: "Warmer overall.",
    points: [{ n: 1, say: "The loudest thing in the row", ...cleanPoint(button) }],
    tuned: [{ var: "--accent", label: "Accent", from: "#2f6b4f", to: "#c2410c" }],
  }, "a value left at its default is not reported");
  assert.deepEqual(JSON.parse(noteFor(view, "r", { tuned: { "--step": "1.4" } })), { tuned: [{ var: "--step", label: "Type scale", from: "1.25", to: "1.4" }] });
  assert.equal(noteFor(view, "a", {}), "");
  assert.deepEqual(JSON.parse(noteFor(view, "a", { note: "ignored", points: [{ say: "x", el: button }], tuned: { "--accent": "#000000" } })), { tuned: [{ var: "--accent", label: "Accent", from: "#2f6b4f", to: "#000000" }] });
  for (const data of [{ tuned: { "--ink": "#000000" } }, { tuned: { "--step": "9" } }, { tuned: [] }, { points: "x" }, { points: Array(9).fill({ say: "x", el: button }) }, { points: [{ say: "", el: button }] }, { points: [{ say: "x", el: { tag: "b" } }] }]) {
    assert.throws(() => noteFor(view, "r", data), undefined, JSON.stringify(data).slice(0, 80));
  }
  assert.throws(() => noteFor({ name: "Shot", phone: "x.png", revise: "/r" }, "r", { points: [{ say: "x", el: button }] }), /running version/);
});

test("only a version that can be steered is served with the steering script, placed first and nothing else changed", async (t) => {
  for (const [html, at] of [["<!doctype html><p>x</p>", 15], ["﻿<!-- c -->\n<!DOCTYPE html>\n<p>x</p>", 29], ["<p>no doctype</p>", 0]]) {
    const out = withSteering(Buffer.from(html)).toString();
    const start = out.indexOf("<script>");
    assert.equal(Buffer.byteLength(out.slice(0, start)), at);
    assert.equal(out.slice(0, start) + out.slice(out.indexOf("</script>") + 9), html, "the document is otherwise untouched");
  }
  const dir = book();
  const s = await up(t, dir);
  const html = await (await fetch(`${s.url}`)).text();
  const srcs = [...html.matchAll(/data-src="(\/live\/[^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const [stored] = readBook(dir);
  const live = (i) => srcs.find((x) => x.includes(stored.workspace.views[i].live));
  for (const i of [0, 1, 2]) {
    const res = await fetch(`http://127.0.0.1:${s.port}${live(i)}`);
    assert.equal(res.headers.get("content-security-policy"), "sandbox allow-scripts allow-forms", "boxed in as before: no same-origin");
    const body = await res.text(), raw = fs.readFileSync(path.join(dir, stored.workspace.views[i].live), "utf8");
    if (i === 0) assert.equal(body, raw, "the original is served exactly as it is");
    else { assert.ok(body.startsWith("<!doctype html><script>(function inFrame()")); assert.equal(body.replace(/<script>\(function inFrame\(\)[\s\S]*?\}\)\(\);<\/script>/, ""), raw); }
  }
  assert.ok(!fs.readFileSync(path.join(dir, stored.workspace.views[1].live), "utf8").includes("inFrame"), "the stored copy is not changed");
});

test("the page offers pointing and tuning only on a running version with a revise command", () => {
  const dir = book();
  const html = render(readBook(dir), { live: { token: "a".repeat(32), state: { working: [], held: [], listening: false, progress: "", stale: [] } } });
  const data = JSON.parse(/const DATA = (.*);\n/.exec(html)[1]);
  assert.deepEqual(data.pages[0].views.map((v) => [v.steer, v.tune.length]), [[false, 0], [true, 2], [true, 2]]);
  assert.deepEqual(data.max, { points: 8, say: 300 });
  for (const hook of ["data-steer hidden", "data-point>", "data-tune ", "data-pop hidden", 'maxlength="300"', "data-pnotes hidden"]) assert.ok(html.includes(hook), hook);
  const js = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));
  assert.doesNotThrow(() => new Function(js));
  assert.equal(html.toLowerCase().split("<script").length - 1, 1, "still one script tag on the page");
});

test("a revise with parts and tuned values reaches the waiting agent as CHOSEN, then one NOTE carrying them", async (t) => {
  const dir = book();
  const s = await up(t, dir);
  assert.equal((await post(s, { page: 0, picks: [["r", 1]], tuned: { "--ink": "#000000" } })).status, 400, "a value the version does not offer");
  assert.equal((await post(s, { page: 0, picks: [["r", 1]], points: [{ say: "x", el: { tag: "<b>" } }] })).status, 400, "something that is not a part");
  assert.equal((await post(s, { page: 0, picks: [["r", 1]], note: "", tuned: { "--step": "1.25" } })).status, 400, "nothing changed is nothing to ask");
  assert.notEqual(await post(s, { page: 0, picks: [["r", 1]], note: "x".repeat(70000) }).then((r) => r.status, () => "cut off"), 200, "an oversized request is cut off");
  const waiting = wait(dir, { minutes: 1 });
  await new Promise((r) => setTimeout(r, 150));
  const res = await post(s, { page: 0, picks: [["r", 1]], note: "Warmer overall.", points: [{ say: "Make this the loudest thing in the row", el: button }, { say: "Smaller, so the list leads", el: { ...button, tag: "h1", selector: "main > h1", text: "Who brings what" } }], tuned: { "--accent": "#c2410c", "--step": "1.4" } });
  assert.equal(res.status, 200);
  const chosen = await waiting;
  assert.deepEqual([...chosen], ["/keen variants the sign-up list: revise version A (Menu)"]);
  const note = JSON.parse(chosen.notes[0]);
  assert.equal(note.say, "Warmer overall.");
  assert.deepEqual(note.points.map((p) => [p.n, p.tag, p.selector, p.say]), [[1, "button", button.selector, "Make this the loudest thing in the row"], [2, "h1", "main > h1", "Smaller, so the list leads"]]);
  assert.deepEqual(note.tuned, [{ var: "--accent", label: "Accent", from: "#2f6b4f", to: "#c2410c" }, { var: "--step", label: "Type scale", from: "1.25", to: "1.4" }]);

  // An apply carries the tuned values, so they can be written into the source the version declares them in.
  const again = wait(dir, { minutes: 1 });
  await new Promise((r) => setTimeout(r, 150));
  await post(s, { page: 0, picks: [["a", 2]], tuned: { "--radius": "22px", "--density": "20" } });
  const applied = await again;
  assert.deepEqual([...applied], ["/keen variants the sign-up list: apply version B (Table)"]);
  assert.deepEqual(JSON.parse(applied.notes[0]).tuned, [{ var: "--radius", label: "Corners", from: "10px", to: "22px" }, { var: "--density", label: "Spacing", from: "14px", to: "20px" }]);
});

test("a revision of a tuned version starts its tuning afresh: a changed tune is a new revision", () => {
  const dir = book();
  const page = steerPage(tmp("live"));
  page.workspace.views[1].tune = [{ ...TUNE_A[0], value: "#c2410c" }, TUNE_A[1]];
  addPage(dir, page);
  assert.deepEqual(readBook(dir)[0].workspace.views.map((v) => v.rev), [1, 2, 1]);
});
