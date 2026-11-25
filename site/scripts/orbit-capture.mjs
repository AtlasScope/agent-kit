#!/usr/bin/env node
// Captures frames of the orbit lab at exact window sizes, for judging the scene and for the record.
//   cd site && node scripts/orbit-capture.mjs [--out ../.artifacts/shots/orbit] [--size desktop,phone] [--name tag]
//       [--look '{"sunHeight":12}'] [--open 1.2] [--clock 60] [--tier high] [--words] [--debug 1] [--bench]
//       [--world ink]
// --open holds the opening at that many seconds; --clock holds the weather; --bench also times a frame.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { launch, openLab, site, startLab } from "./orbit-browser.mjs";

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i < 0 ? fallback : args[i + 1]; };
const flag = (name) => args.includes(`--${name}`);

// Windows as the homepage's scene sees them: the screen less the 65px header.
const SIZES = {
  desktop: { width: 1440, height: 835, scale: 2 },
  laptop: { width: 1280, height: 655, scale: 2 },
  hd: { width: 1920, height: 1015, scale: 1 },
  wide: { width: 2560, height: 1375, scale: 1 },
  phone: { width: 390, height: 779, scale: 3 },
  small: { width: 375, height: 602, scale: 2 },
  tablet: { width: 820, height: 1115, scale: 2 },
};

const out = path.resolve(opt("out", path.join(site, "..", ".artifacts", "shots", "orbit")));
const name = opt("name", "frame");
const query = { tier: opt("tier", "high") };
for (const key of ["open", "debug", "frame", "clock", "world", "cloudSteps", "airSteps", "pixels"]) if (opt(key)) query[key] = opt(key);
if (flag("words")) query.words = "1";

await mkdir(out, { recursive: true });
const browser = await launch();
// --url: capture a page of the running website instead of the lab, the header included (so the window is 65px
// taller than the scene). --at: seconds after loading at which to capture, e.g. 0.6,1.4,6 for the opening.
if (opt("url")) {
  try {
    for (const key of opt("size", "desktop,phone").split(",")) {
      const size = SIZES[key];
      if (!size) throw new Error(`unknown size ${key}`);
      const context = await browser.newContext({ viewport: { width: size.width, height: size.height + 65 }, deviceScaleFactor: size.scale, isMobile: size.width < 760, hasTouch: size.width < 760, reducedMotion: flag("reduced") ? "reduce" : "no-preference" });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const started = Date.now();
      await page.goto(opt("url"), { waitUntil: "commit" });
      for (const at of opt("at", "8").split(",").map(Number)) {
        await page.waitForTimeout(Math.max(0, at * 1000 - (Date.now() - started)));
        const file = path.join(out, `${name}-${key}-${at}s.png`);
        await page.screenshot({ path: file });
        const state = await page.evaluate(() => { const el = document.querySelector(".launch"), cv = document.querySelector(".launch__gl"); return { live: el?.classList.contains("is-live"), intro: el?.hasAttribute("data-intro"), canvas: cv ? `${cv.width} x ${cv.height}` : "none" }; });
        console.log(file, JSON.stringify(state), errors.join(" | "));
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  process.exit(0);
}
const lab = await startLab();
try {
  for (const key of opt("size", "desktop,phone").split(",")) {
    const size = SIZES[key];
    if (!size) throw new Error(`unknown size ${key}`);
    const page = await openLab(browser, lab.base, { ...size, query, look: JSON.parse(opt("look", "{}")) });
    await page.waitForTimeout(Number(opt("wait", 600)));
    const info = await page.evaluate((benchIt) => {
      const gl = document.createElement("canvas").getContext("webgl2"), ext = gl?.getExtension("WEBGL_debug_renderer_info");
      return { gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown", stats: window.lab.orbit.stats(), bench: benchIt ? window.lab.bench() : null, bake: benchIt ? window.lab.bakeBench() : null, first: window.lab.firstFrame() };
    }, flag("bench"));
    if (info.bench !== null) console.log(`bench ${key}: ${info.bench.toFixed(2)} ms a frame at ${info.stats.width} x ${info.stats.height}, ${info.stats.tier}; maps ${info.stats.map.join(" x ")} made in ${info.bake.toFixed(0)} ms; first frame ${info.first.toFixed(0)} ms after the renderer was created`);
    const file = path.join(out, `${name}-${key}.png`);
    await page.screenshot({ path: file });
    console.log(file, `${info.stats.width} x ${info.stats.height}`, `map ${info.stats.map.join(" x ")}`, info.gpu);
    await page.close();
  }
} finally {
  await browser.close();
  lab.stop();
}
