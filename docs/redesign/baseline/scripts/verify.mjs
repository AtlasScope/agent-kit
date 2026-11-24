// Checks a running build of the site against the 2026-11-24 baseline.
// Usage (from site/, so `playwright` resolves): BASE=http://localhost:3000 node ../docs/redesign/baseline/scripts/verify.mjs
// Exits 1 on any regression. Writes nothing.
import { createRequire } from 'node:module';
// Resolve playwright from the working directory (run from site/), not from this folder.
const { chromium } = createRequire(process.cwd() + '/package.json')('playwright');
import fs from 'node:fs';
import crypto from 'node:crypto';

const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/$/, '');
const data = (f) => JSON.parse(fs.readFileSync(new URL(`../data/${f}`, import.meta.url)));
const pages = data('pages.json');
const buttons = data('copy-buttons.json');
const install = data('install-commands.json');
const files = data('files.json');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const fail = [];
const META = ['title', 'description', 'canonical', 'ogTitle', 'ogImage', 'twitterCard', 'robots', 'lang', 'alternateMd'];

const b = await chromium.launch();
const ctx = await b.newContext({ permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

// 1. Every baseline URL still answers 200 with the same SEO metadata and one h1.
for (const was of pages) {
  const res = await p.goto(BASE + was.path, { waitUntil: 'domcontentloaded' });
  if (res.status() !== was.status) { fail.push(`${was.path}: status ${res.status()} (was ${was.status})`); continue; }
  const now = await p.evaluate(() => {
    const q = (s, a = 'content') => document.querySelector(s)?.getAttribute(a) ?? null;
    return { title: document.title, description: q('meta[name=description]'), canonical: q('link[rel=canonical]', 'href'),
      ogTitle: q('meta[property="og:title"]'), ogImage: q('meta[property="og:image"]'), twitterCard: q('meta[name="twitter:card"]'),
      robots: q('meta[name=robots]'), lang: document.documentElement.lang,
      alternateMd: q('link[rel=alternate][type="text/markdown"]', 'href'), h1: document.querySelectorAll('h1').length };
  });
  for (const k of META) {
    // The og:image query string is a build hash; compare the path only.
    const norm = (v) => (k === 'ogImage' && v ? v.split('?')[0] : v);
    if (norm(now[k]) !== norm(was[k])) fail.push(`${was.path}: ${k} changed\n    was: ${was[k]}\n    now: ${now[k]}`);
  }
  if (now.h1 !== 1) fail.push(`${was.path}: ${now.h1} h1 elements (was 1)`);
}

// 2. Every payload a page could copy is still copyable from that page (order and labels may change).
const byPath = new Map();
for (const r of buttons) { if (!byPath.has(r.path)) byPath.set(r.path, []); byPath.get(r.path).push(r.sha256); }
for (const [path, want] of byPath) {
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  const got = [];
  for (const bt of await p.locator('main button').all()) {
    const label = ((await bt.getAttribute('aria-label')) || (await bt.textContent()) || '').trim();
    if (!/copy/i.test(label) || !(await bt.isVisible())) continue;
    await p.evaluate(() => navigator.clipboard.writeText('\u0000'));
    await bt.click();
    await p.waitForTimeout(120);
    const t = await p.evaluate(() => navigator.clipboard.readText());
    if (t !== '\u0000') got.push(sha(t));
  }
  const missing = [...new Set(want)].filter((h) => !got.includes(h));
  if (missing.length) fail.push(`${path}: ${missing.length} payload(s) no longer copyable (sha256 ${missing.map((h) => h.slice(0, 12)).join(', ')}; full text in data/copy-payloads-by-sha256.json)`);
}

// 3. Install page: each agent's message and commands.
await p.goto(BASE + '/install', { waitUntil: 'networkidle' });
const got = new Set();
const tabs = p.locator('main [role=tab]');
for (let i = 0; i < (await tabs.count()); i++) {
  await tabs.nth(i).click();
  await p.waitForTimeout(250);
  const bs = p.locator('main button.inst__copy:visible');
  for (let j = 0; j < (await bs.count()); j++) {
    await bs.nth(j).click();
    await p.waitForTimeout(150);
    got.add(sha(await p.evaluate(() => navigator.clipboard.readText())));
  }
}
for (const r of install.install) if (!got.has(r.sha256)) fail.push(`/install: ${r.agent} payload changed or missing:\n${r.text}`);

// 4. Machine-readable files. sitemap.xml carries build dates, so compare its URL list instead of its hash.
for (const [f, was] of Object.entries(files)) {
  const r = await p.request.get(BASE + f);
  if (r.status() !== was.status) { fail.push(`${f}: status ${r.status()} (was ${was.status})`); continue; }
  const t = await r.text();
  if (f === '/sitemap.xml') {
    const urls = new Set([...t.matchAll(/<loc>([^<]+)/g)].map((m) => new URL(m[1]).pathname));
    for (const was of pages) if (was.inSitemap !== false && !urls.has(was.path)) fail.push(`/sitemap.xml: ${was.path} dropped`);
  } else if (f !== '/mcp-setup' && sha(t) !== was.sha256) fail.push(`${f}: content changed (was sha256 ${was.sha256.slice(0, 12)})`);
}

await b.close();
if (fail.length) { console.log(`${fail.length} regression(s):\n- ` + fail.join('\n- ')); process.exit(1); }
console.log(`OK: ${pages.length} pages, ${buttons.length} copy buttons, ${install.install.length} install payloads, ${Object.keys(files).length} files match the baseline.`);
