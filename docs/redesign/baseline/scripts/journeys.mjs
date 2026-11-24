import { createRequire } from 'node:module';
// Resolve playwright from the working directory (run from site/), not from this folder.
const { chromium, devices } = createRequire(process.cwd() + '/package.json')('playwright');
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:3200', OUT = process.argv[2];
const PROMPT = '/prompts/status-hidden-in-a-pile-of-flags';
const clip = (p) => p.evaluate(() => navigator.clipboard.readText());
const results = [];
const J = {
  'search': async (p, mobile) => {
    await p.goto(BASE + '/'); await p.waitForTimeout(1500);
    if (mobile) await p.click('button.nav__find'); else await p.keyboard.press('/');
    await p.waitForTimeout(500);
    await p.keyboard.type('slow', { delay: 140 }); await p.waitForTimeout(1200);
    const n = await p.locator('#search-results [role=option]').count();
    await p.keyboard.press('ArrowDown'); await p.waitForTimeout(400); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(600);
    await p.keyboard.press('Enter'); await p.waitForURL(u => !u.pathname.endsWith('/') || u.pathname.length > 1, { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(1500);
    return `"slow" -> ${n} results; Enter on 2nd -> ${new URL(p.url()).pathname}`;
  },
  'browse-prompts-and-copy': async (p) => {
    await p.goto(BASE + '/prompts'); await p.waitForTimeout(1000);
    for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, 500); await p.waitForTimeout(450); }
    await p.goto(BASE + PROMPT); await p.waitForTimeout(1200);
    await p.click('button.btn--solid:has-text("Copy prompt")'); await p.waitForTimeout(1200);
    const c = await clip(p);
    fs.writeFileSync(`${OUT}/clipboard--prompt-copy.txt`, c);
    for (let i = 0; i < 3; i++) { await p.mouse.wheel(0, 500); await p.waitForTimeout(450); }
    return `copied ${c.length} chars; button label after click recorded in video`;
  },
  'skills-browse-and-detail': async (p) => {
    await p.goto(BASE + '/skills'); await p.waitForTimeout(1000);
    for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, 600); await p.waitForTimeout(400); }
    await p.click('a[href="/skills/animate"]').catch(() => p.goto(BASE + '/skills/animate'));
    await p.waitForTimeout(1500);
    for (let i = 0; i < 3; i++) { await p.mouse.wheel(0, 500); await p.waitForTimeout(400); }
    return new URL(p.url()).pathname;
  },
  'kits-browse-and-install-copy': async (p) => {
    await p.goto(BASE + '/kits'); await p.waitForTimeout(1200);
    await p.click('a[href="/kits/design-kit"]').catch(() => p.goto(BASE + '/kits/design-kit'));
    await p.waitForTimeout(1200);
    await p.click('button.copy--main'); await p.waitForTimeout(1000);
    const c = await clip(p); fs.writeFileSync(`${OUT}/clipboard--kit-install-design-kit.txt`, c);
    return `kit message ${c.length} chars`;
  },
  'install-flow': async (p) => {
    await p.goto(BASE + '/'); await p.waitForTimeout(1500);
    await p.click('a.launch__go'); await p.waitForTimeout(2500);
    const after = new URL(p.url()).pathname;
    let c0 = await clip(p).catch(() => '');
    fs.writeFileSync(`${OUT}/clipboard--home-install-cta.txt`, c0);
    const tabs = p.locator('main [role=tab]');
    for (let i = 0; i < await tabs.count(); i++) { await tabs.nth(i).click(); await p.waitForTimeout(900); }
    await tabs.first().click(); await p.waitForTimeout(500);
    await p.locator('button.inst__copy').last().click(); await p.waitForTimeout(1000);
    const c = await clip(p); fs.writeFileSync(`${OUT}/clipboard--install-copy-all-claude-code.txt`, c);
    return `CTA -> ${after}; CTA clipboard ${c0.length} chars; copy-all ${c.length} chars`;
  },
  'mobile-menu': async (p) => {
    await p.goto(BASE + '/prompts'); await p.waitForTimeout(1000);
    await p.click('button[aria-label=Menu]'); await p.waitForTimeout(1200);
    await p.keyboard.press('Escape'); await p.waitForTimeout(800);
    return 'opened and closed with Escape';
  },
  'keyboard-tab-order-home': async (p) => {
    await p.goto(BASE + '/'); await p.waitForTimeout(1500);
    const seq = [];
    for (let i = 0; i < 14; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(350);
      seq.push(await p.evaluate(() => { const e = document.activeElement; return (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 30); })); }
    return seq.join(' > ');
  },
};
const plan = [
  ['desktop-1440-dark', { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' }, ['search','browse-prompts-and-copy','skills-browse-and-detail','kits-browse-and-install-copy','install-flow','keyboard-tab-order-home']],
  ['iphone-15-pro-light', { ...devices['iPhone 15 Pro'], colorScheme: 'light' }, ['search','browse-prompts-and-copy','install-flow','mobile-menu']],
];
const b = await chromium.launch();
for (const [tag, dev, js] of plan) for (const j of js) {
  const dir = `${OUT}/${tag}`; fs.mkdirSync(dir, { recursive: true });
  const ctx = await b.newContext({ ...dev, permissions: ['clipboard-read', 'clipboard-write'], recordVideo: { dir, size: dev.viewport } });
  const p = await ctx.newPage();
  let r; try { r = await J[j](p, tag.startsWith('iphone')); } catch (e) { r = 'ERR ' + e.message.split('\n')[0]; }
  await p.screenshot({ path: `${dir}/${j}--end.png` });
  const v = p.video(); await ctx.close(); fs.renameSync(await v.path(), `${dir}/${j}.webm`);
  results.push(`${tag}\t${j}\t${r}`); console.log(tag, j, r);
}
await b.close();
fs.writeFileSync(`${OUT}/journey-results.tsv`, results.join('\n') + '\n');
