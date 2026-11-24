#!/usr/bin/env node
// Evidence for the homepage and its move to the install page: stills, a strip of frames through the move, and
// recordings at actual speed. Point it at a running site (a production build for anything that is to be judged).
//   node scripts/stage-capture.mjs <base url> <folder> [stills] [strip] [video] [checks]
// Everything is headless Chromium. "phone" is that browser emulating a 390 by 844 touch screen, not a phone.
import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { launch } from "./orbit-browser.mjs";

const [base, folder, ...asked] = process.argv.slice(2);
const want = (k) => !asked.length || asked.includes(k);
await mkdir(folder, { recursive: true });
const SIZES = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
};
const browser = await launch();
const live = (page) => page.waitForFunction(() => document.querySelector(".stage")?.classList.contains("is-live"), null, { timeout: 60000 });
const open = async (size, url, extra = {}) => {
  const context = await browser.newContext({ ...SIZES[size], permissions: ["clipboard-read", "clipboard-write"], ...extra });
  const page = await context.newPage();
  page.on("console", (m) => { if (m.type() === "error") console.log("console error:", m.text().slice(0, 600)); });
  page.on("pageerror", (e) => console.log("page error:", e.message.slice(0, 600)));
  await page.goto(base + url, { waitUntil: "load" });
  return { context, page };
};
const out = (name) => path.join(folder, name);
// A recording at actual speed. The browser hands over a picture each time the page changes, with the time it was
// drawn; they are laid onto a steady thirty frames a second, so the film runs at the speed the page did. (Playwright's
// own recorder writes nothing with the browser these scripts launch.) Returns how many pictures the browser gave and
// over how long, which is the frame rate the page actually reached in this headless browser.
async function record(page) {
  const cdp = await page.context().newCDPSession(page), frames = [];
  cdp.on("Page.screencastFrame", (f) => { frames.push({ t: f.metadata.timestamp, data: Buffer.from(f.data, "base64") }); cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, everyNthFrame: 1 });
  return async (file) => {
    await cdp.send("Page.stopScreencast");
    const cache = path.join(homedir(), "Library", "Caches", "ms-playwright"), build = readdirSync(cache).filter((d) => d.startsWith("ffmpeg-")).sort().pop();
    const ffmpeg = spawn(path.join(cache, build, "ffmpeg-mac"), ["-y", "-f", "image2pipe", "-framerate", "30", "-c:v", "mjpeg", "-i", "pipe:0", "-c:v", "libvpx-vp9", "-crf", "22", "-b:v", "0", "-deadline", "realtime", "-cpu-used", "5", "-pix_fmt", "yuv420p", "-threads", "8", file], { stdio: ["pipe", "ignore", "ignore"] });
    const t0 = frames[0].t, length = frames[frames.length - 1].t - t0;
    let k = 0;
    for (let n = 0; n / 30 <= length; n++) {
      while (k + 1 < frames.length && frames[k + 1].t - t0 <= n / 30) k++;
      if (!ffmpeg.stdin.write(frames[k].data)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
    }
    ffmpeg.stdin.end();
    await new Promise((r) => ffmpeg.on("close", r));
    return `${frames.length} pictures in ${length.toFixed(1)} s`;
  };
}
try {
  if (want("stills")) for (const size of Object.keys(SIZES)) {
    for (const [name, url] of [["home", "/"], ["install", "/install"]]) {
      const { context, page } = await open(size, url);
      await live(page); await page.waitForTimeout(2500);
      await page.screenshot({ path: out(`${name}-${size}.png`) });
      if (name === "install") {
        await page.locator(".inst__manual > summary").first().click(); await page.waitForTimeout(400);
        await page.screenshot({ path: out(`install-manual-${size}.png`), fullPage: size === "phone" });
      }
      await context.close();
    }
    // Arrived from the homepage: the message is on the clipboard and the page says so.
    const { context, page } = await open(size, "/");
    await live(page); await page.waitForTimeout(1500);
    await page.locator(".launch__go").click(); await page.waitForTimeout(2200);
    await page.screenshot({ path: out(`install-arrived-${size}.png`) });
    await context.close();
  }
  if (want("strip")) for (const size of Object.keys(SIZES)) {
    const { context, page } = await open(size, "/");
    await live(page); await page.waitForTimeout(1500);
    await page.locator(".launch__go").click({ noWaitAfter: true });
    const t0 = Date.now();
    for (let i = 0; i < 12; i++) { await page.screenshot({ path: out(`strip-${size}-${String(i).padStart(2, "0")}.png`) }); console.log(size, "frame", i, "at", Date.now() - t0, "ms"); }
    await context.close();
  }
  if (want("video")) for (const size of Object.keys(SIZES)) {
    for (const [name, reduced] of [["flow", false], ["flow-reduced-motion", true]]) {
      const { context, page } = await open(size, "/", { deviceScaleFactor: 1, reducedMotion: reduced ? "reduce" : "no-preference" });
      if (!reduced) await live(page);
      const stop = await record(page);
      await page.waitForTimeout(3000);
      await page.locator(".launch__go").click(); await page.waitForTimeout(4000);       // to Install
      await page.goBack(); await page.waitForTimeout(3500);                              // Back to the homepage
      await page.locator(".launch__go").click(); await page.waitForTimeout(450);         // Install again, and Back in the middle of it
      await page.goBack(); await page.waitForTimeout(3000);
      await page.goForward(); await page.waitForTimeout(3000);
      const got = await stop(out(`${name}-${size}.webm`));
      await context.close();
      console.log(`${name}-${size}.webm`, got);
    }
  }
  if (want("checks")) {
    const report = [];
    const say = (ok, what) => { report.push(`${ok ? "pass" : "FAIL"}  ${what}`); };
    // 1. Install copies inside the click and the address changes without waiting for the movement.
    let { context, page } = await open("desktop", "/");
    await live(page); await page.waitForTimeout(800);
    const before = Date.now();
    await page.locator(".launch__go").click({ noWaitAfter: true });
    await page.waitForURL("**/install");
    const took = Date.now() - before;
    say(took < 400, `address is /install ${took} ms after the click`);
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    say(clip.startsWith("Install Agent Kit for me"), "clipboard holds the install message");
    await page.waitForTimeout(900);
    say(await page.locator(".inst__copy--main", { hasText: "Copied" }).count() === 1, "install page says Copied on arrival");
    say(await page.locator(".inst__note", { hasText: "Message copied." }).count() === 1, "status line says Message copied");
    await page.waitForTimeout(700);
    say(await page.locator(".stage__ghost > *").count() === 0 && !(await page.locator(".stage").getAttribute("data-shift")), "nothing of the move is left after it");
    // 2. Back in the middle of the move returns to the homepage, with its words showing.
    await page.goBack(); await page.waitForTimeout(1500);
    await page.locator(".launch__go").click({ noWaitAfter: true }); await page.waitForTimeout(300);
    say(await page.locator(".stage__ghost .stage__copy").count() === 1 && await page.locator(".stage__ghost .stage__morph").count() === 1, "mid-move: the page that was left is still leaving, and the button is growing into the panel");
    await page.goBack(); await page.waitForTimeout(1800);
    say(new URL(page.url()).pathname === "/" && await page.locator("main.home h1").isVisible(), "Back mid-move lands on the homepage with its headline visible");
    say(await page.locator("main[data-left]").count() === 0, "no page is left hidden");
    // 3. A second click during the move, then a different link.
    await page.locator(".launch__go").dblclick({ noWaitAfter: true }); await page.waitForTimeout(1600);
    say(new URL(page.url()).pathname === "/install" && await page.locator(".inst h1").isVisible(), "double click still lands on Install");
    await page.locator(".wordmark").click({ noWaitAfter: true }); await page.waitForTimeout(250);
    await page.locator(".links a", { hasText: "Prompts" }).first().click({ noWaitAfter: true }).catch(() => {});
    await page.waitForTimeout(2500);
    say(new URL(page.url()).pathname.startsWith("/prompts"), "a link to another section during the move wins: " + new URL(page.url()).pathname);
    await context.close();
    // 4. A direct visit to /install: no move plays, no copied claim, and the receded pose is what shows.
    ({ context, page } = await open("desktop", "/install"));
    await page.waitForTimeout(600);
    say(!(await page.locator(".stage").getAttribute("data-shift")) && await page.locator(".inst[data-arrived]").count() === 0, "direct /install: no move, no arrival");
    say(await page.locator(".inst__copy--main", { hasText: "Copied" }).count() === 0, "direct /install: makes no claim about the clipboard");
    await context.close();
    // 5. Reduced motion: no copy layer, no live scene, the right still for each page.
    ({ context, page } = await open("desktop", "/", { reducedMotion: "reduce" }));
    await page.waitForTimeout(800);
    await page.locator(".launch__go").click({ noWaitAfter: true }); await page.waitForTimeout(120);
    say(await page.locator(".stage__ghost > *").count() === 0, "reduced motion: no travelling copy");
    await page.waitForTimeout(900);
    const opacity = await page.evaluate(() => [".stage__still--home", ".stage__still--install"].map((s) => getComputedStyle(document.querySelector(s)).opacity).join(" "));
    say(opacity === "0 1" && !(await page.evaluate(() => document.querySelector(".stage").classList.contains("is-live"))), "reduced motion: the install still shows and the scene never starts (" + opacity + ")");
    await context.close();
    // 6. Clipboard refused: the install page says so and selects the message.
    ({ context, page } = await open("desktop", "/"));
    await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error("no")); });
    await page.locator(".launch__go").click({ noWaitAfter: true }); await page.waitForTimeout(1600);
    say(await page.locator(".inst__note.is-warn").count() === 1, "blocked clipboard: the page says copying was blocked");
    await context.close();
    console.log(report.join("\n"));
  }
} finally { await browser.close(); }
