import { createRequire } from 'node:module';
// Resolve playwright from the working directory (run from site/), not from this folder.
const { chromium } = createRequire(process.cwd() + '/package.json')('playwright');
import fs from 'node:fs'; import crypto from 'node:crypto';
const OUT = process.argv[2]; const pages = JSON.parse(fs.readFileSync(`${OUT}/pages.json`));
const h = (s) => crypto.createHash('sha256').update(s).digest('hex');
const b = await chromium.launch(); const ctx = await b.newContext({ permissions: ['clipboard-read','clipboard-write'], viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage(); const rows = [], texts = {};
for (const pg of pages.filter(x => x.copyButtons > 0 && x.path !== '/install')) {
  await p.goto((process.env.BASE || 'http://localhost:3200') + pg.path, { waitUntil: 'networkidle' });
    const all = await p.locator('main button').all();
  let i = 0;
  for (const bt of all) {
    const label = ((await bt.getAttribute('aria-label')) || (await bt.textContent()) || '').trim();
    if (!/copy/i.test(label) || !(await bt.isVisible())) continue;
    await p.evaluate(() => navigator.clipboard.writeText('\u0000'));
    await bt.click(); await p.waitForTimeout(120);
    const t = await p.evaluate(() => navigator.clipboard.readText());
    if (t === '\u0000') { rows.push({ path: pg.path, i: i++, label, sha256: null }); continue; }
    const k = h(t); texts[k] = t; rows.push({ path: pg.path, i: i++, label, sha256: k, length: t.length });
  }
}
await b.close();
fs.writeFileSync(`${OUT}/copy-buttons.json`, JSON.stringify(rows, null, 1));
fs.writeFileSync(`${OUT}/copy-payloads-by-sha256.json`, JSON.stringify(texts, null, 1));
console.log(rows.length, 'buttons', Object.keys(texts).length, 'unique payloads', rows.filter(r => !r.sha256).length, 'copied nothing');
