#!/usr/bin/env node
// The still image of each horizon direction: the scene exactly as its first live frame draws it, so the page can
// show the still at once and let the live scene take over without a visible change. Also what shows with reduced
// motion, and where WebGL 2 is missing.
//   node scripts/horizon-stills.mjs [--bench]
// Wide stills are 2.4:1 and tall ones 4:5. The page fits them by height and crops the sides, which is what the live
// canvas does too (its lens is set by the frame's height), so the two line up on any screen narrower than the still.
// --bench also prints how long one frame takes to draw at each still's size on this machine.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { launch, site, startLab } from "./orbit-browser.mjs";

const bench = process.argv.includes("--bench");
const out = path.join(site, "public", "horizon", "stills");
await mkdir(out, { recursive: true });
const SHAPES = { wide: { width: 1920, height: 800, tall: 0 }, tall: { width: 780, height: 975, tall: 1 } };
const lab = await startLab(4320), browser = await launch();
try {
  for (const direction of ["day", "afternoon", "sunrise", "dawn", "night"]) for (const [shape, size] of Object.entries(SHAPES)) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 2 });
    await page.goto(`${lab.base}/lab/horizon.html?bare&dir=${direction}&t=0&tall=${size.tall}`);
    await page.waitForFunction(() => window.lab?.horizon.ready(), null, { timeout: 60000 });
    await page.waitForTimeout(900);
    const png = await page.screenshot();
    await sharp(png).avif({ quality: 62, effort: 6 }).toFile(path.join(out, `${direction}-${shape}.avif`));
    let cost = "";
    if (bench) {
      const ms = await page.evaluate(() => {
        const gl = document.getElementById("c").getContext("webgl2"), pixel = new Uint8Array(4), runs = 40, start = performance.now();
        for (let i = 0; i < runs; i++) { window.lab.stage.frame({ now: performance.now(), opening: 1e6, leave: 0, px: 0, py: 0 }); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel); }
        return (performance.now() - start) / runs;
      });
      cost = `${ms.toFixed(1)} ms a frame at ${size.width * 2}x${size.height * 2}`;
    }
    console.log(`${direction}-${shape}.avif`, cost);
    await page.close();
  }
} finally { await browser.close(); lab.stop(); }
