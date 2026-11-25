// Pointing and tuning on a real page, in a real browser: two running versions of a small interface, notes left on
// two parts, two values tuned, and a revise that reaches the waiting agent. Then the keyboard and touch, and a
// running version that forges messages to the page and must not start anything or put markup on it.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { addPage, serve, wait } from "../scripts/worksheet.mjs";
import { steerPage } from "./steer-fixture.mjs";
import { browserSkip, launch } from "./browser.mjs";

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "scripts", "worksheet.mjs");
const tmp = (name) => fs.mkdtempSync(path.join(os.tmpdir(), `keen-${name}-`));
async function open(t, options, { hostile = false, viewport = { width: 1440, height: 900 } } = {}) {
  const dir = tmp("steerb");
  addPage(dir, steerPage(tmp("live"), { hostile }));
  const s = await serve(dir);
  t.after(() => s.close());
  const browser = await launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport, ...options });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(s.url);
  const frame = page.frameLocator('[data-pane="0"] iframe');
  await frame.locator("h1").waitFor();
  return { dir, s, page, frame, errors };
}
const listening = (page) => page.waitForFunction(() => document.getElementById("state").dataset.is === "listening");
const sheet = (frame) => frame.locator("keen-point");
// The version hears the page through messages, so what it shows changes a moment later. Read until it does.
async function until(read, ok, ms = 3000) {
  let value;
  for (const end = Date.now() + ms; Date.now() < end; await new Promise((r) => setTimeout(r, 25))) if (ok((value = await read()))) break;
  return value;
}

test("in a browser, the person points at two parts, tunes two values and asks: the agent gets CHOSEN, then one NOTE with all of it", { skip: browserSkip }, async (t) => {
  const { dir, page, frame, errors } = await open(t);
  assert.equal(await sheet(frame).count(), 0, "nothing is added to the version until the person asks");
  assert.equal(await frame.locator("body").evaluate(() => document.scripts.length), 1, "the steering script removes its own tag");
  const beans = frame.locator("[data-dish]", { hasText: "Green beans" }).locator("button");
  await beans.click();
  assert.equal(await beans.innerText(), "Yours", "with pointing off, the version behaves as it was built");

  await page.locator("[data-point]").click();
  assert.equal(await page.locator("[data-point]").innerText(), "Stop pointing", "the button says what pressing it again does");
  await sheet(frame).waitFor({ state: "attached" }); // the version hears the page a moment later; a person is slower than that
  const rolls = frame.locator("[data-dish]", { hasText: "Bread rolls" }).locator("button");
  await rolls.click({ force: true });
  await page.locator("[data-pop]").waitFor();
  assert.equal(await rolls.innerText(), "Claim", "while pointing, a press picks the part and the version's own code never sees it");
  assert.equal(await page.locator("[data-pop-what]").textContent(), "1Button “Claim”");
  await page.locator("[data-pop-input]").fill("Make this the loudest thing in the row");
  await page.keyboard.press("Enter");
  await frame.locator("h1").click({ force: true });
  await page.locator("[data-pop-input]").fill("Smaller, so the list leads");
  await page.locator("[data-pop] button[type=submit]").click();
  assert.equal(await page.locator("[data-pnotes]").isVisible(), true);
  assert.deepEqual(await page.locator("[data-pnote-list] .ps").allInnerTexts(), ["Make this the loudest thing in the row", "Smaller, so the list leads"]);
  assert.equal(await sheet(frame).evaluate((h) => h.shadowRoot.querySelectorAll(".m b").length), 2, "each part is outlined and numbered in the version");

  const h1Size = () => frame.locator("h1").evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  const before = await h1Size();
  await page.locator("[data-tune] input[type=color]").fill("#c2410c");
  const range = page.locator("[data-tune] input[type=range]");
  await range.focus();
  for (let i = 0; i < 3; i += 1) await page.keyboard.press("ArrowRight");
  const accent = () => frame.locator("button[data-claim]").first().evaluate((b) => getComputedStyle(b).backgroundColor);
  assert.equal(await until(accent, (v) => v === "rgb(194, 65, 12)"), "rgb(194, 65, 12)", "the accent changes in the running version as the control moves");
  assert.ok((await until(h1Size, (v) => v > before * 1.2)) > before * 1.2, "and so does the type scale");
  assert.equal(await page.locator("[data-apply]").innerText(), "Apply A: Menu as tuned");

  await page.locator("[data-ws] textarea").fill("Warmer overall.");
  // The agent's side, exactly as it runs: the wait command, whose printed lines are what the agent reads.
  const waiter = spawn(process.execPath, [CLI, "wait", dir, "--minutes", "1"], { stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  waiter.stdout.on("data", (c) => { out += c; });
  const done = new Promise((r) => waiter.on("exit", r));
  await listening(page);
  await page.locator("[data-ask]").click();
  assert.equal(await done, 0);
  const lines = out.trimEnd().split("\n");
  assert.equal(lines.length, 2, "one CHOSEN line, then one NOTE line");
  assert.equal(lines[0], "CHOSEN: /keen variants the sign-up list: revise version A (Menu)");
  assert.ok(lines[1].startsWith("NOTE: {"));
  const note = JSON.parse(lines[1].slice("NOTE: ".length));
  assert.equal(note.say, "Warmer overall.");
  assert.deepEqual(note.points.map((p) => [p.n, p.tag, p.say]), [[1, "button", "Make this the loudest thing in the row"], [2, "h1", "Smaller, so the list leads"]]);
  assert.equal(await frame.locator(note.points[0].selector).innerText(), "Claim", "the selector finds the very part the person pointed at");
  assert.equal(await frame.locator(note.points[0].selector).evaluate((b) => b.closest("[data-dish]").textContent.includes("Bread rolls")), true);
  assert.equal(await frame.locator(note.points[1].selector).innerText(), "Who brings what");
  for (const p of note.points) {
    assert.equal(p.viewport, 390, "measured in the phone-size version shown");
    assert.ok(p.box.w > 0 && p.box.h > 0);
    assert.match(p.styles["font-size"], /px$/);
  }
  assert.equal(note.points[0].text, "Claim");
  assert.deepEqual(note.tuned, [{ var: "--accent", label: "Accent", from: "#2f6b4f", to: "#c2410c" }, { var: "--step", label: "Type scale", from: "1.25", to: "1.4" }]);
  await page.locator("#status", { hasText: "with 2 notes on parts and your tuning" }).waitFor({ timeout: 5000 });
  assert.equal(await page.locator("[data-pnotes]").isVisible(), false, "sent notes are cleared");

  await page.locator("[data-point]").click();
  await page.waitForFunction(() => !document.querySelector("[data-ws]").hasAttribute("data-pointing"));
  await sheet(frame).waitFor({ state: "detached" });
  const wellington = frame.locator("[data-dish]", { hasText: "Mushroom" }).locator("button");
  await wellington.click();
  assert.equal(await wellington.innerText(), "Yours", "once pointing stops, the version is left exactly as it was");
  assert.deepEqual(errors, []);
});

test("in a browser, pointing works from the keyboard with visible focus, and by touch on a phone", { skip: browserSkip }, async (t) => {
  const { page, frame, errors } = await open(t);
  await page.locator("[data-point]").focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.tagName), "IFRAME", "pointing takes the keyboard into the version");
  await sheet(frame).waitFor({ state: "attached" });
  const hint = page.locator("[data-point-hint]");
  for (let i = 0, last = await hint.innerText(); i < 12 && !last.startsWith("Heading"); i += 1) {
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction((prev) => document.querySelector("[data-point-hint]").textContent !== prev, last);
    last = await hint.innerText();
  }
  assert.equal(await hint.innerText(), "Heading “Who brings what”. Press Enter to pick it.");
  await page.keyboard.press("Enter");
  await page.locator("[data-pop]").waitFor();
  assert.equal(await page.evaluate(() => document.activeElement.matches("[data-pop-input]")), true, "the note card takes the keyboard");
  await page.keyboard.type("Less shouty");
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("[data-pop]").isHidden(), true);
  assert.equal(await page.evaluate(() => document.activeElement.tagName), "IFRAME", "and hands it back to point at the next part");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("[data-ws]").hasAttribute("data-pointing"));
  assert.equal(await page.evaluate(() => document.activeElement.matches("[data-point]:focus-visible")), true, "Esc stops and puts visible focus back on the button");
  assert.deepEqual(await page.locator("[data-pnote-list] .pw").allInnerTexts(), ["Heading “Who brings what”"]);
  assert.deepEqual(errors, []);

  const phone = await open(t, { hasTouch: true, isMobile: true }, { viewport: { width: 390, height: 844 } });
  await phone.page.locator("[data-point]").tap();
  await sheet(phone.frame).waitFor({ state: "attached" });
  assert.equal(await phone.page.locator("[data-point-hint]").innerText(), "Tap a part of this version to say what should change there.");
  await phone.frame.locator("h1").tap({ force: true });
  await phone.page.locator("[data-pop]").waitFor();
  assert.equal(await phone.page.locator("[data-pop-what]").textContent(), "1Heading “Who brings what”");
  const card = await phone.page.locator("[data-pop]").boundingBox();
  assert.ok(card.x >= 0 && card.x + card.width <= 390, "the note card fits the phone's width");
  assert.equal(await phone.page.evaluate(() => document.documentElement.scrollWidth), 390, "nothing scrolls sideways");
  await phone.page.locator("[data-tunes]").tap();
  assert.equal(await phone.page.locator("[data-tune]").isVisible(), true, "on a phone the controls are one tap away");
  assert.deepEqual(phone.errors, []);
});

test("in a browser, a running version that forges messages cannot start anything or put markup on the page", { skip: browserSkip }, async (t) => {
  const { dir, s, page, errors } = await open(t, {}, { hostile: true });
  const starts = [];
  page.on("request", (r) => { if (r.url().includes("/choose") && r.frame() === page.mainFrame()) starts.push(r.url()); });
  await page.locator('[data-view="3"]').click();
  const frame = page.frameLocator('[data-pane="0"] iframe');
  await frame.locator("h1").waitFor();
  await page.waitForTimeout(600);
  assert.equal(await page.locator("[data-pop]").isHidden(), true, "with pointing off, forged picks are ignored");
  assert.equal(await page.locator("[data-point-hint]").innerText(), "");

  await page.locator("[data-point]").click();
  await page.locator("[data-pop]").waitFor();
  const what = await page.locator("[data-pop-what]").innerText();
  assert.ok(what.includes("<img src=x"), "a forged part is shown as text");
  assert.equal(await page.locator("[data-ws] img, [data-ws] script").count(), 0, "and never becomes markup");
  assert.equal(await page.evaluate(() => window.hacked), undefined);
  const stage = await page.locator(".stage").boundingBox(), card = await page.locator("[data-pop]").boundingBox();
  assert.ok(card.x >= stage.x && card.y >= stage.y && card.x + card.width <= stage.x + stage.width + 1, "absurd positions are clamped inside the stage");
  assert.equal(await page.locator("[data-point-hint]").innerText(), "Click a part of this version, or use the arrow keys and Enter. Esc stops.", "a forged hover with a bad tag says nothing");
  await page.waitForTimeout(800);

  assert.deepEqual(starts, [], "the page itself never asked to start anything");
  assert.equal(await wait(dir, { minutes: 0.02 }), null, "and nothing reached the agent");
  const state = await (await fetch(`http://127.0.0.1:${s.port}/state?k=${s.token}`)).json();
  assert.deepEqual([state.live.working, state.live.held], [[], []]);
  assert.equal(await frame.locator("body").evaluate(() => document.title), "sent, answer opaque", "the version's own request to start reached the server, which held nothing: it lacks the page's key");
  assert.equal(await page.locator("[data-pnotes]").isHidden(), true, "no note is added without the person");
  assert.deepEqual(errors, []);
});
