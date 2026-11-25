#!/usr/bin/env node
// The real website with a horizon direction behind it, captured from a production build (`npx next build` first).
//   node scripts/horizon-site.mjs <folder> [--engine chromium|webkit] [--film seconds] [--base url] name=path@WxHxS ...
// e.g. node scripts/horizon-site.mjs ../.artifacts/horizon/site day=/horizon/day@1440x900x2 phone=/horizon/day@390x844x3
// Each job waits for the opening to finish, then saves a still. With --film it also records that many seconds of
// the page at real speed (Playwright's recorder: CSS resolution, about 25 frames a second).
// `webkit` is Playwright's WebKit build. It is the same engine family as Safari but not Safari itself.
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { webkit } from "playwright";
import { launch, site } from "./orbit-browser.mjs";

const args = process.argv.slice(2), folder = args.shift();
const take = (flag, fallback) => { const i = args.indexOf(flag); return i < 0 ? fallback : args.splice(i, 2)[1]; };
const engine = take("--engine", "chromium"), film = Number(take("--film", 0)), given = take("--base", "");
// --still asks for reduced motion, so the page shows its still image and never starts the live scene.
const still = args.includes("--still"); if (still) args.splice(args.indexOf("--still"), 1);
await mkdir(folder, { recursive: true });

let server = null, base = given;
if (!base) {
  server = spawn("npx", ["next", "start", "-p", "4410"], { cwd: site, stdio: "ignore", detached: true });
  base = "http://localhost:4410";
  for (let i = 0; i < 80; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 250)); }
}
const browser = engine === "webkit" ? await webkit.launch() : await launch();
try {
  for (const job of args) {
    const [name, rest] = job.split("="), [route, size = "1440x900x2"] = rest.split("@"), [width, height, scale] = size.split("x").map(Number);
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale || 1, isMobile: engine !== "webkit" ? width < 600 : undefined, hasTouch: width < 600, reducedMotion: still ? "reduce" : "no-preference", ...(film ? { recordVideo: { dir: folder, size: { width, height } } } : {}) });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + route);
    if (still) await page.waitForTimeout(2500);
    else { await page.waitForSelector(".launch.is-live", { timeout: 30000 }).catch(() => errors.push("the scene never went live")); await page.waitForTimeout(5200); }
    await page.screenshot({ path: path.join(folder, `${name}.png`) });
    if (film) await page.waitForTimeout(film * 1000);
    const video = page.video();
    await context.close();
    if (video) await video.saveAs(path.join(folder, `${name}.webm`)).catch((e) => errors.push(`no film: ${e.message}`));
    console.log(name, errors.join(" | ").slice(0, 600));
  }
} finally {
  await browser.close();
  if (server) { try { process.kill(-server.pid); } catch {} }
}
