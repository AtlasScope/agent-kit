import { createRequire } from 'node:module';
// Resolve playwright from the working directory (run from site/), not from this folder.
const { chromium } = createRequire(process.cwd() + '/package.json')('playwright');
import fs from 'node:fs'; import crypto from 'node:crypto';
const BASE = process.env.BASE || 'http://localhost:3200', OUT = process.argv[2];
const read = (f) => fs.readFileSync(f, 'utf8').trim().split('\n');
const routes = read(process.env.ROUTES || new URL('../data/routes.txt', import.meta.url));
// Routes outside the sitemap, marked inSitemap: false so verify.mjs doesn't expect them in sitemap.xml.
const extra = new Set(read(process.env.EXTRA_ROUTES || new URL('../data/extra-routes.txt', import.meta.url)));
routes.push(...[...extra].filter((r) => !routes.includes(r)));
const h = (s) => crypto.createHash('sha256').update(s).digest('hex');
const b = await chromium.launch();
const ctx = await b.newContext({ permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const pages = [], payloads = [];
for (const r of routes) {
  const res = await p.goto(BASE + r, { waitUntil: 'domcontentloaded' });
  const m = await p.evaluate(() => {
    const q = (s, a = 'content') => document.querySelector(s)?.getAttribute(a) ?? null;
    return { title: document.title, description: q('meta[name=description]'), canonical: q('link[rel=canonical]', 'href'),
      ogTitle: q('meta[property="og:title"]'), ogUrl: q('meta[property="og:url"]'), ogImage: q('meta[property="og:image"]'),
      twitterCard: q('meta[name="twitter:card"]'), robots: q('meta[name=robots]'), lang: document.documentElement.lang,
      h1: [...document.querySelectorAll('h1')].map(e => e.textContent.trim()), jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { return JSON.parse(s.textContent)['@type']; } catch { return 'invalid'; } }),
      alternateMd: q('link[rel=alternate][type="text/markdown"]', 'href'),
      copyButtons: [...document.querySelectorAll('main button')].filter(b => /copy/i.test(b.getAttribute('aria-label') || b.textContent)).length };
  });
  pages.push({ path: r, status: res.status(), ...m, ...(extra.has(r) ? { inSitemap: false } : {}) });
  if (/^\/prompts\/[^/]+$/.test(r) || /^\/kits\/[^/]+$/.test(r) || /^\/skills\/[^/]+$/.test(r) || /^\/fix\/[^/]+$/.test(r)) {
    const btn = p.locator('main button.btn--solid:has-text("Copy prompt"), main button.copy--main').first();
    if (await btn.count()) {
      await p.evaluate(() => navigator.clipboard.writeText(''));
      await btn.click(); await p.waitForTimeout(150);
      const t = await p.evaluate(() => navigator.clipboard.readText());
      payloads.push({ path: r, button: (await btn.getAttribute('aria-label')) || (await btn.textContent()).trim(), sha256: h(t), length: t.length, text: t });
    }
  }
}
// Install page: each agent tab, every copy button
await p.goto(BASE + '/install'); const install = [];
const tabs = p.locator('main [role=tab]');
for (let ti = 0; ti < await tabs.count(); ti++) {
  const a = (await tabs.nth(ti).textContent()).trim(); await tabs.nth(ti).click(); await p.waitForTimeout(250);
  const n = await p.locator('main button.inst__copy:visible').count();
  for (let i = 0; i < n; i++) { const bt = p.locator('main button.inst__copy:visible').nth(i);
    await bt.click(); await p.waitForTimeout(150); const t = await p.evaluate(() => navigator.clipboard.readText());
    install.push({ agent: a, button: (await bt.getAttribute('aria-label')) || (await bt.textContent()).trim(), sha256: h(t), text: t }); }
}
// kit command blocks
const kitCmds = [];
for (const k of ['design-kit','engineering-kit','experience-architecture','motion-kit','working-style']) {
  await p.goto(BASE + '/kits/' + k); const bs = p.locator('main button.copy');
  for (let i = 0; i < await bs.count(); i++) { const bt = bs.nth(i); await bt.click(); await p.waitForTimeout(150);
    const t = await p.evaluate(() => navigator.clipboard.readText()); kitCmds.push({ kit: k, button: await bt.getAttribute('aria-label'), sha256: h(t), text: t }); }
}
const files = {};
for (const f of ['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt', '/install.md', '/mcp-setup']) {
  const r = await p.request.get(BASE + f); const t = await r.text(); files[f] = { status: r.status(), sha256: h(t), length: t.length, contentType: r.headers()['content-type'] };
}
await b.close();
fs.writeFileSync(`${OUT}/pages.json`, JSON.stringify(pages, null, 1));
fs.writeFileSync(`${OUT}/payloads.json`, JSON.stringify(payloads, null, 1));
fs.writeFileSync(`${OUT}/install-commands.json`, JSON.stringify({ install, kitCmds }, null, 1));
fs.writeFileSync(`${OUT}/files.json`, JSON.stringify(files, null, 1));
console.log(pages.length, 'pages', payloads.length, 'payloads', install.length, 'install', kitCmds.length, 'kit cmds');
console.log('non-200', pages.filter(x => x.status !== 200).map(x => x.path));
console.log('no canonical', pages.filter(x => !x.canonical).length, 'no desc', pages.filter(x => !x.description).length, 'h1!=1', pages.filter(x => x.h1.length !== 1).map(x => x.path + ':' + x.h1.length).slice(0, 20));
console.log(JSON.stringify(files));
