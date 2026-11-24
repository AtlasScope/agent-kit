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

// Wait for the server: the CHECKLIST starts `next start` in the background right before this runs.
for (let i = 0; ; i++) {
  try { await fetch(BASE + '/'); break; } catch (e) {
    if (i >= 60) { console.log(`No server answering at ${BASE}: ${e.message}`); process.exit(1); }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

const b = await chromium.launch();
const ctx = await b.newContext({ permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

// 1. Every baseline URL still answers 200 with the same SEO metadata and one h1.
for (const was of pages) {
  let res;
  try { res = await p.goto(BASE + was.path, { waitUntil: 'domcontentloaded' }); }
  catch (e) { fail.push(`${was.path}: failed to load (${e.message.split('\n')[0]})`); continue; }
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

// Copy harvesting. Every string the page hands to the clipboard is recorded by an init script, so a
// control that copies nothing, or copies through execCommand, is seen as it is. Closed <details>
// (for example "Or run it yourself" on /install) are opened, and every tab in main is clicked, because
// a tab often swaps the text behind the same Copy button.
const recorder = () => {
  window.__copies = [];
  const clip = navigator.clipboard;
  if (clip && clip.writeText) {
    const original = clip.writeText.bind(clip);
    clip.writeText = (text) => { window.__copies.push(String(text)); return original(text).catch(() => undefined); };
  }
  // clipboard.write([new ClipboardItem(...)]) carries text as a text/plain blob; record that too.
  if (clip && clip.write) {
    const original = clip.write.bind(clip);
    clip.write = async (items) => {
      for (const item of items || []) {
        if (!item.types || !item.types.includes('text/plain')) continue;
        try { window.__copies.push(await (await item.getType('text/plain')).text()); } catch { /* unreadable item */ }
      }
      return original(items).catch(() => undefined);
    };
  }
  const exec = document.execCommand.bind(document);
  document.execCommand = (cmd, ...rest) => {
    if (String(cmd).toLowerCase() === 'copy') {
      // The usual fallback selects a hidden <textarea>; read its selection directly, not only the document's.
      const a = document.activeElement;
      const field = a && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT') && typeof a.selectionStart === 'number';
      window.__copies.push(field ? a.value.slice(a.selectionStart, a.selectionEnd) : String(getSelection()));
    }
    return exec(cmd, ...rest);
  };
};
await ctx.addInitScript(recorder);
// Visible, non-inert controls whose name has the word Copy ("Copy prompt", "/design (copy)"). Toggles
// (aria-pressed) are skipped: the "Tests on a copy" filter on prompt areas is one, and clicking it would
// hide the cards still to be checked. A floating Copy bar stays inert until its panel scrolls away.
const markControls = () => {
  const ids = [];
  // Clear marks from an earlier pass: a control hidden since then would keep a stale id that now also
  // names a different control, and the duplicate would make the click fail.
  document.querySelectorAll('[data-verify-copy]').forEach((el) => el.removeAttribute('data-verify-copy'));
  document.querySelectorAll('button, [role="button"]').forEach((el, i) => {
    const name = (el.getAttribute('aria-label') || el.textContent || '').trim();
    const r = el.getBoundingClientRect();
    if (!/\bcopy\b/i.test(name) || el.hasAttribute('aria-pressed')) return;
    if (r.width === 0 || r.height === 0 || el.closest('[inert]')) return;
    if (el.checkVisibility && !el.checkVisibility({ visibilityProperty: true, opacityProperty: true })) return;
    el.setAttribute('data-verify-copy', String(i));
    ids.push(String(i));
  });
  return ids;
};
// Returns [{ tab, sha256 }]: tab is null for the page as loaded, else the name of the tab that was selected.
async function harvest(page) {
  const out = [];
  const clickAll = async (tab) => {
    // Reopen disclosures on every pass: a tab can mount a fresh panel whose <details> start closed.
    await page.evaluate(() => document.querySelectorAll('details:not([open])').forEach((d) => { d.open = true; }));
    await page.waitForTimeout(150);
    for (const id of await page.evaluate(markControls)) {
      const before = await page.evaluate(() => window.__copies.length);
      const loc = page.locator(`[data-verify-copy="${id}"]`);
      try { await loc.scrollIntoViewIfNeeded({ timeout: 2000 }); await loc.click({ timeout: 3000 }); } catch { continue; }
      await page.waitForTimeout(120);
      for (const t of await page.evaluate((n) => window.__copies.slice(n), before)) out.push({ tab, sha256: sha(t) });
    }
  };
  await clickAll(null);
  const tabs = page.locator('main [role=tab]');
  for (let i = 0; i < (await tabs.count()); i++) {
    const tab = ((await tabs.nth(i).textContent()) || '').replace(/\s+/g, ' ').trim();
    try { await tabs.nth(i).scrollIntoViewIfNeeded({ timeout: 2000 }); await tabs.nth(i).click({ timeout: 2000 }); } catch { continue; }
    await page.waitForTimeout(200);
    await clickAll(tab);
  }
  return out;
}

// 2. Every payload a page could copy is still copyable from that page (order, labels and tabs may change).
const byPath = new Map();
for (const r of buttons) { if (!byPath.has(r.path)) byPath.set(r.path, []); byPath.get(r.path).push(r.sha256); }
for (const [path, want] of byPath) {
  let got;
  try {
    await p.goto(BASE + path, { waitUntil: 'networkidle' });
    got = new Set((await harvest(p)).map((c) => c.sha256));
  } catch (e) { fail.push(`${path}: copy check failed (${e.message.split('\n')[0]})`); continue; }
  const missing = [...new Set(want)].filter((h) => !got.has(h));
  if (missing.length) fail.push(`${path}: ${missing.length} payload(s) no longer copyable (sha256 ${missing.map((h) => h.slice(0, 12)).join(', ')}; full text in data/copy-payloads-by-sha256.json)`);
}

// 3. Install page: each agent's message and commands must be copyable while that agent's tab is selected.
// The manual steps may sit in a closed disclosure; #manual opens it, and harvest() opens any <details> left closed.
try {
  await p.goto(BASE + '/install#manual', { waitUntil: 'networkidle' });
  const got = await harvest(p);
  for (const r of install.install) {
    const mine = got.filter((c) => c.tab && c.tab.includes(r.agent));
    if (!mine.length) fail.push(`/install: no tab named "${r.agent}", or its copy controls copied nothing`);
    else if (!mine.some((c) => c.sha256 === r.sha256)) fail.push(`/install: ${r.agent} payload changed or missing:\n${r.text}`);
  }
} catch (e) { fail.push(`/install: install check failed (${e.message.split('\n')[0]})`); }

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
