// Runs scripts/geometry_check.js against a fixture page in headless Chromium and
// prints the JSON result. Needs an existing Playwright install reachable through
// NODE_PATH; it never installs anything.
//   NODE_PATH=<project>/node_modules node run_geometry_fixture.cjs <fixture.html> [width] [height] [touch]
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('@playwright/test')); }

(async () => {
  const fixtureName = process.argv[2] || 'geometry-defects.html';
  const width = Number(process.argv[3] || 390);
  const height = Number(process.argv[4] || 844);
  const touch = process.argv[5] === 'touch';
  const script = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'geometry_check.js'), 'utf8');
  const fixture = 'file://' + path.join(__dirname, 'fixtures', fixtureName);
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch });
    const page = await context.newPage();
    await page.goto(fixture, { waitUntil: 'load' });
    const result = await page.evaluate(script);
    process.stdout.write(JSON.stringify(result));
  } finally {
    await browser.close();
  }
})().catch(err => { console.error(err.message); process.exit(1); });
