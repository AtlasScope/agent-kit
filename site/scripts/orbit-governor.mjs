#!/usr/bin/env node
// Watches the renderer's resolution governor (components/orbit/renderer.ts, judge()) in a browser, in three
// situations made on purpose:
//   fast       nothing in the way: it should never step down.
//   pixels     each frame costs time in proportion to the pixels drawn (as on a graphics chip that cannot keep
//              up): it should step down, and keep stepping while each step helps.
//   throttled  frames arrive only thirty times a second whatever is drawn (as on a phone saving power): it should
//              try one step, find it buys nothing, and put it back.
// The cost is simulated in the page rather than asked of the graphics chip, because a headless browser does not
// hold its frames back when the chip falls behind, so a genuinely slow scene would not show as late frames.
//   cd site && node scripts/orbit-governor.mjs
import { launch, startLab } from "./orbit-browser.mjs";

const lab = await startLab(4331);
const browser = await launch();
async function watch(name, mode) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 835 }, deviceScaleFactor: 2 });
  await page.addInitScript((mode) => {
    const raf = window.requestAnimationFrame.bind(window);
    let next = 0;
    if (mode === "throttled") {
      window.requestAnimationFrame = (cb) => raf(function tick(t) { if (t < next) return raf(tick); next = t + 33; cb(t); });
    } else if (mode === "pixels") {
      // 80 ms a frame for a canvas of four device pixels per CSS pixel, less in proportion as it shrinks.
      window.requestAnimationFrame = (cb) => raf((t) => {
        cb(t);
        const c = document.getElementById("gl");
        const full = c ? c.clientWidth * c.clientHeight * 4 : 1;
        const until = performance.now() + (80 * (c ? c.width * c.height : 0)) / full;
        while (performance.now() < until);
      });
    }
  }, mode);
  // Not ?bare: the bare lab is fixed at full resolution, for captures.
  await page.goto(`${lab.base}/`);
  await page.waitForFunction(() => window.lab?.orbit?.stats().ready && window.lab.orbit.stats().map[0] > 0, null, { timeout: 120000, polling: 200 });
  const seen = [];
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    seen.push(await page.evaluate(() => Math.round(window.lab.orbit.stats().scale * 100)));
  }
  console.log(`${name.padEnd(9)} resolution every half second, % of full: ${seen.join(" ")}`);
  await page.close();
  return seen;
}
try {
  const fast = await watch("fast", "fast");
  const pixels = await watch("pixels", "pixels");
  const throttled = await watch("throttled", "throttled");
  const ok = fast.every((v) => v === 100) && pixels.at(-1) < 100 && throttled.at(-1) === 100;
  console.log(ok ? "governor: as intended" : "governor: NOT as intended");
  process.exitCode = ok ? 0 : 1;
} finally {
  await browser.close();
  lab.stop();
}
