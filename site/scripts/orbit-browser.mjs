// Shared by the scripts that draw the orbit scene outside the website (orbit-capture.mjs, build-hero-images.mjs):
// start the lab's server, and a browser to open it in.
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

export const site = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

// The lab, on a port of its own, unless LAB_URL points at one that is already running. Returns its address and a
// function that stops it.
export async function startLab(port = 4318) {
  if (process.env.LAB_URL) return { base: process.env.LAB_URL.replace(/\/$/, ""), stop() {} };
  const server = spawn("node", [path.join(site, "scripts", "orbit-lab.mjs")], { env: { ...process.env, PORT: String(port) }, stdio: "ignore" });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  return { base, stop: () => server.kill() };
}

// A Chromium that draws with the machine's real GPU where it has one; it falls back to its software renderer
// otherwise, which is slow but draws the same picture. If the browser build this version of Playwright wants is not
// installed, any Chromium that Playwright downloaded before will do, and then the machine's own Chrome.
export async function launch() {
  const args = ["--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader", ...(process.platform === "darwin" ? ["--use-angle=metal"] : [])];
  const tries = [{}];
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH
    || (process.platform === "darwin" ? path.join(homedir(), "Library", "Caches", "ms-playwright")
      : process.platform === "win32" ? path.join(homedir(), "AppData", "Local", "ms-playwright") : path.join(homedir(), ".cache", "ms-playwright"));
  const BINARIES = [
    ["chrome-mac-arm64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing"],
    ["chrome-mac", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing"],
    ["chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium"],
    ["chrome-linux64", "chrome"], ["chrome-linux", "chrome"], ["chrome-win64", "chrome.exe"], ["chrome-win", "chrome.exe"],
  ];
  if (existsSync(cache)) {
    for (const dir of readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) {
      for (const parts of BINARIES) {
        const bin = path.join(cache, dir, ...parts);
        if (existsSync(bin)) tries.push({ executablePath: bin });
      }
    }
  }
  tries.push({ channel: "chrome" });
  let last;
  for (const how of tries) { try { return await chromium.launch({ ...how, args }); } catch (error) { last = error; } }
  throw last;
}

// Open the lab at a size and wait until the scene has drawn. `query` is the lab's switches (see lab/lab.ts);
// `look` is the parameters changed from the defaults.
export async function openLab(browser, base, { width, height, scale = 1, query = {}, look = {} }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/?${new URLSearchParams({ bare: "1", ...query })}#${encodeURIComponent(JSON.stringify(look))}`);
  await page.waitForFunction(() => document.getElementById("error").textContent || (window.lab?.orbit?.stats().ready && window.lab.orbit.stats().map[0] > 0), null, { timeout: 180000 });
  const broken = await page.evaluate(() => document.getElementById("error").textContent);
  if (broken || errors.length) throw new Error(`the lab reported: ${(broken || errors.join(" | ")).slice(0, 1500)}`);
  return page;
}
