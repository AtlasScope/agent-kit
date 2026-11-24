#!/usr/bin/env node
// Stills of the horizon lab, one browser for all of them:
//   node scripts/horizon-shot.mjs <folder> <width> <height> <scale> name=query [name=query ...]
// e.g. node scripts/horizon-shot.mjs ../.artifacts/shots 1440 835 2 day="dir=day" dusk="dir=dawn&t=60"
import path from "node:path";
import { launch, startLab } from "./orbit-browser.mjs";

const [folder, width, height, scale, ...jobs] = process.argv.slice(2);
const lab = await startLab(4319), browser = await launch();
try {
  for (const job of jobs) {
    const cut = job.indexOf("="), name = job.slice(0, cut), query = job.slice(cut + 1);
    const page = await browser.newPage({ viewport: { width: +width, height: +height }, deviceScaleFactor: +scale });
    const errors = [];
    page.on("pageerror", (e) => { if (e.message !== "stage mode") errors.push(e.message); });
    await page.goto(`${lab.base}/lab/horizon.html?bare&${query.includes("t=") ? "" : "t=0&"}${query}`);
    // A scene that never becomes ready (a shader that will not compile, say) is reported, not waited on for ever.
    try { await page.waitForFunction(() => document.getElementById("error").textContent || window.lab?.horizon.ready(), null, { timeout: 60000 }); }
    catch { console.log(name, "never became ready:", errors.join(" | ").slice(0, 3000)); await page.close(); continue; }
    await page.waitForTimeout(900);
    const broken = await page.evaluate(() => document.getElementById("error").textContent);
    console.log(name, broken || "", errors.join(" | ").slice(0, 1500));
    await page.screenshot({ path: path.join(folder, `${name}.png`) });
    await page.close();
  }
} finally { await browser.close(); lab.stop(); }
