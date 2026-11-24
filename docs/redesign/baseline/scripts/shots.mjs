import { createRequire } from 'node:module';
// Resolve playwright from the working directory (run from site/), not from this folder.
const { chromium, devices } = createRequire(process.cwd() + '/package.json')('playwright');
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:3200';
const OUT = process.argv[2];
const ROUTES = ['/', '/install', '/prompts', '/prompts/before-it-starts', '/prompts/PROMPT', '/skills', '/skills/animate', '/kits',
 '/kits/design-kit','/kits/engineering-kit','/kits/experience-architecture','/kits/motion-kit','/kits/working-style',
 '/fix', '/fix/agents-keep-asking-me-to-decide', '/start', '/start/choose', '/learn', '/learn/agents', '/about', '/mcp-setup', '/privacy', '/terms', '/this-page-does-not-exist'];
const VPS = {
  'desktop-1440': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  'desktop-1728': { viewport: { width: 1728, height: 1117 }, deviceScaleFactor: 2 },
  'ipad-pro-11': devices['iPad Pro 11'],
  'iphone-15-pro': devices['iPhone 15 Pro'],
};
const prompt = process.argv[3] || 'status-hidden-in-a-pile-of-flags';
const b = await chromium.launch();
const log = [];
for (const [vp, dev] of Object.entries(VPS)) for (const scheme of ['light', 'dark']) {
  const ctx = await b.newContext({ ...dev, colorScheme: scheme, reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  for (let r of ROUTES) {
    r = r.replace('PROMPT', prompt);
    const name = (r === '/' ? 'home' : r.slice(1).replace(/\//g, '__'));
    fs.mkdirSync(`${OUT}/${vp}/${scheme}`, { recursive: true });
    try {
      const res = await page.goto(BASE + r, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(r === '/' ? 2500 : 600);
      await page.screenshot({ path: `${OUT}/${vp}/${scheme}/${name}--fold.png` });
      await page.screenshot({ path: `${OUT}/${vp}/${scheme}/${name}--full.png`, fullPage: true });
      log.push([vp, scheme, r, res.status()].join('\t'));
    } catch (e) { log.push([vp, scheme, r, 'ERR ' + e.message.split('\n')[0]].join('\t')); }
  }
  await ctx.close();
}
await b.close();
fs.writeFileSync(`${OUT}/screenshot-log.tsv`, log.join('\n') + '\n');
console.log(log.filter(l => !/\t200$/.test(l)).join('\n'));
