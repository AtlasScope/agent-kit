// Playwright-driven crawl and journey runner. Playwright is resolved at runtime and never installed silently.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROBE = fs.readFileSync(path.join(HERE, 'probe.js'), 'utf8');
export const RUNTIME_DIR = process.env.EA_RUNTIME_DIR || path.join(os.homedir(), '.experience-architecture', 'runtime');

export async function loadPlaywright() {
  const bases = [process.cwd(), process.env.EA_PLAYWRIGHT_DIR, RUNTIME_DIR].filter(Boolean);
  for (const b of bases) {
    for (const name of ['playwright', 'playwright-core', '@playwright/test']) {
      try {
        const req = createRequire(path.join(path.resolve(b), 'package.json'));
        const p = req.resolve(name);
        const mod = await import(pathToFileURL(p).href);
        const pw = mod.chromium ? mod : mod.default;
        if (pw?.chromium) return pw;
      } catch { /* try next */ }
    }
  }
  const err = new Error(`Playwright not found. Options:
  1. Use your agent's browser tools with the probe script ("ea probe") and save snapshots as a journey log, then run "ea transitions <log.json>".
  2. With the user's OK, install it once outside their project:
       mkdir -p "${RUNTIME_DIR}" && cd "${RUNTIME_DIR}" && npm init -y >/dev/null && npm i playwright && npx playwright install chromium
  3. Point EA_PLAYWRIGHT_DIR at any folder whose node_modules has playwright.`);
  err.code = 'NO_PLAYWRIGHT';
  throw err;
}

const VIEWPORTS = { desktop: { width: 1366, height: 860 }, laptop: { width: 1180, height: 760 }, tablet: { width: 820, height: 1100 }, mobile: { width: 390, height: 844, isMobile: true, hasTouch: true } };
function viewportOf(v) {
  if (!v) return VIEWPORTS.desktop;
  if (VIEWPORTS[v]) return VIEWPORTS[v];
  const m = String(v).match(/^(\d+)x(\d+)$/);
  return m ? { width: +m[1], height: +m[2] } : VIEWPORTS.desktop;
}

async function settle(page) {
  try { await page.waitForLoadState('domcontentloaded', { timeout: 8000 }); } catch { /* ignore */ }
  try { await page.waitForLoadState('networkidle', { timeout: 2500 }); } catch { /* ignore */ }
  let last = page.url();
  for (let i = 0; i < 6; i++) { await page.waitForTimeout(120); if (page.url() === last) break; last = page.url(); }
  await page.waitForTimeout(150);
}
const snap = async (page) => { try { return await page.evaluate(PROBE); } catch (e) { return { error: String(e.message || e), url: page.url() }; } };

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const globRe = (g) => new RegExp('^' + String(g).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');

// One browser context. Writes (POST/PUT/PATCH/DELETE) are blocked unless allowWrites lists them, so a journey
// or crawl cannot change data by accident; every blocked request is recorded and reported.
async function newContext(pw, { viewport, storageState, cookies, base, allowWrites, text = true, reveal = false, browser: shared }) {
  const browser = shared || await pw.chromium.launch({ headless: process.env.EA_HEADED ? false : true });
  const vp = viewportOf(viewport);
  const { isMobile, hasTouch, ...size } = vp;
  const state = typeof storageState === 'object' ? storageState : storageState && fs.existsSync(storageState) ? storageState : undefined;
  const ctx = await browser.newContext({ viewport: size, isMobile: !!isMobile, hasTouch: !!hasTouch, storageState: state });
  await ctx.addInitScript((o) => { window.__eaOpts = o; }, { text, reveal });
  if (cookies?.length && base) await ctx.addCookies(cookies.map((c) => ({ url: base, ...c })));
  const blocked = [];
  if (allowWrites !== true) {
    const allow = [].concat(allowWrites || []).map(globRe);
    await ctx.route('**/*', (route) => {
      const r = route.request();
      if (READ_METHODS.has(r.method()) || allow.some((re) => re.test(r.url()))) return route.continue();
      let u = r.url(); try { const x = new URL(u); u = x.pathname; } catch { /* keep */ }
      blocked.push(`${r.method()} ${u}`);
      return route.abort('blockedbyclient');
    });
  }
  return { browser, ctx, blocked, own: !shared };
}
const stripText = (s) => { if (s && 'mainText' in s) delete s.mainText; return s; };

// ---------------- privacy for what the runner itself writes ----------------
// The probe hides typed values inside snapshots. These helpers cover everything else the runner writes:
// step descriptions, requested URLs, redirect chains, error messages and cookie steps.
const SECRET_Q = /token|secret|passw|api[-_]?key|access[-_]?key|auth|session|signature|^sig$|^code$|otp|nonce|jwt/i;
export const fingerprint = (v) => { let h = 2166136261; for (let i = 0; i < v.length; i++) { h ^= v.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0').slice(0, 6); };
export const hidden = (v) => { const s = String(v); return `«${s.length} chars #${fingerprint(s)}»`; };
// Mask secret-looking query values and token fragments in every URL found in a string.
export function scrubUrls(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/([?&])([^=&#\s"'<>]+)=([^&#\s"'<>]*)/g, (m, sep, k, val) => (SECRET_Q.test(decodeURIComponent(k)) && val ? `${sep}${k}=REDACTED` : m))
    .replace(/#[^\s"'<>]*(access_token|id_token)=[^\s"'<>]*/g, '#REDACTED');
}
// A step's readable description. Typed values and cookie values never appear in it unless reveal is set.
export function describeStep(step, t, v, reveal) {
  if (step.label || step.desc) return scrubUrls(step.label || step.desc);
  const within = step.within ? ` in ${step.within}` : '';
  if (v === true) return t[0].toUpperCase() + t.slice(1);
  if (t === 'fill') { const [sel, val] = Array.isArray(v) ? v : [v?.selector, v?.value]; return `fill ${sel} with ${reveal ? JSON.stringify(String(val)) : hidden(val ?? '')}${within}`; }
  if (t === 'setCookie') return `setCookie ${v?.name || ''}`;
  if (t === 'select') { const [sel, val] = Array.isArray(v) ? v : [v?.selector, v?.value]; return `select ${val} in ${sel}${within}`; }
  return scrubUrls(`${t} ${typeof v === 'string' || typeof v === 'number' ? v : JSON.stringify(v)}${within}`);
}
// Literal values from the spec that must not reach disk: fill values and cookie values (4+ characters, so a
// one-letter search does not erase unrelated text). Used as a final sweep over every file the runner writes.
export function sensitiveValues(spec) {
  const out = new Set();
  const visit = (steps) => { for (const st of steps || []) {
    if (st.fill) { const val = Array.isArray(st.fill) ? st.fill[1] : st.fill.value; if (val != null && String(val).length >= 4) out.add(String(val)); }
    if (st.setCookie?.value && String(st.setCookie.value).length >= 4) out.add(String(st.setCookie.value));
  } };
  for (const j of spec.journeys || []) visit(j.steps);
  for (const c of [...(spec.cookies || []), ...Object.values(spec.profiles || {}).flatMap((p) => p.cookies || [])]) if (c?.value && String(c.value).length >= 4) out.add(String(c.value));
  return [...out].sort((a, b) => b.length - a.length);
}
export function scrubText(text, values) {
  let s = scrubUrls(text);
  for (const v of values) { const esc = JSON.stringify(v).slice(1, -1); s = s.split(v).join(hidden(v)); if (esc !== v) s = s.split(esc).join(hidden(v)); }
  return s;
}

// ---------------- crawl ----------------
const UNSAFE = /logout|log-out|signout|sign-out|delete|destroy|remove|unsubscribe|reset|revoke|\/api\//i;
const ID_SEG = /^(\d+|[0-9a-f]{8,}|[0-9a-f-]{36}|[A-Z0-9]{6,}|[a-z]+[-_]\d+)$/;
const shapeOf = (p) => p.split('?')[0].split('/').map((x) => (ID_SEG.test(x) ? ':id' : x)).join('/');
export async function crawl(start, { max = 60, viewport, storageState, cookies, include, exclude, perShape = 3 } = {}) {
  const pw = await loadPlaywright();
  const origin = new URL(start).origin;
  const { browser, ctx, blocked } = await newContext(pw, { viewport, storageState, cookies, base: origin, allowWrites: false });
  const page = await ctx.newPage();
  const queue = [new URL(start).pathname + new URL(start).search];
  const seen = new Set(queue);
  const shapes = new Map();
  const pages = [];
  let mobileMenu = null;
  const incRe = include ? new RegExp(include) : null; const excRe = exclude ? new RegExp(exclude) : null;
  while (queue.length && pages.length < max) {
    const u = queue.shift();
    let status = null; const chain = [];
    try {
      const resp = await page.goto(origin + u, { waitUntil: 'domcontentloaded', timeout: 15000 });
      status = resp?.status() ?? null;
      let r = resp?.request(); while (r?.redirectedFrom()) { r = r.redirectedFrom(); chain.unshift(new URL(r.url()).pathname); }
    } catch (e) { pages.push({ requested: u, error: String(e.message || e) }); continue; }
    await settle(page);
    const s = await snap(page);
    const finalPath = new URL(page.url()).pathname + new URL(page.url()).search;
    pages.push({ requested: u, final: finalPath, status, redirects: chain, snapshot: s });
    if (!mobileMenu && s.navToggle && !s.navVisible) {
      try {
        await page.locator('button,[role=button]').filter({ hasText: s.navToggle.name }).first().click({ timeout: 3000 }).catch(() => page.getByRole('button', { name: s.navToggle.name }).first().click({ timeout: 3000 }));
        await page.waitForTimeout(300);
        const open = await snap(page);
        mobileMenu = { from: finalPath, toggle: s.navToggle.name, links: [...new Set(open.regions.filter((r) => !r.hidden && !/breadcrumb|tablist/i.test(r.region)).flatMap((r) => r.links.map((l) => l.href)).filter(Boolean))] };
        await page.keyboard.press('Escape').catch(() => {});
      } catch { mobileMenu = { from: finalPath, toggle: s.navToggle.name, error: 'could not open' }; }
    }
    for (const r of s.regions || []) for (const l of r.links) enqueue(l.href);
    for (const href of await page.$$eval('main a[href], body a[href]', (as) => as.map((a) => a.getAttribute('href')))) enqueue(href);
    function enqueue(href) {
      if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/.test(href)) return;
      let x; try { x = new URL(href, origin + u); } catch { return; }
      if (x.origin !== origin) return;
      const k = x.pathname + x.search;
      if (UNSAFE.test(k) || (incRe && !incRe.test(k)) || (excRe && excRe.test(k)) || seen.has(k)) return;
      const sh = shapeOf(k) + (x.search ? '?' + [...x.searchParams.keys()].sort().join('&') : '');
      seen.add(k);
      if ((shapes.get(sh) || 0) >= perShape) return;
      shapes.set(sh, (shapes.get(sh) || 0) + 1); queue.push(k);
    }
  }
  await browser.close();
  const findings = crawlFindings(pages, viewport, mobileMenu);
  for (const p of pages) stripText(p.snapshot);
  return { start, origin, viewport: viewport || 'desktop', pages, unvisited: queue, mobileMenu, blockedWrites: [...new Set(blocked)], findings };
}

function shingles(t) { const w = t.toLowerCase().split(/\W+/).filter(Boolean); const s = new Set(); for (let i = 0; i + 3 <= w.length; i++) s.add(w.slice(i, i + 3).join(' ')); return s; }
function jac(a, b) { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); }

export function crawlFindings(pages, viewport, mobileMenu) {
  const F = [];
  const ok = pages.filter((p) => p.snapshot && !p.error);
  const inbound = new Map();
  for (const p of ok) for (const r of (p.snapshot.regions || []).filter((x) => !x.hidden)) for (const l of r.links) {
    if (!l.href || !l.href.startsWith('/')) continue;
    const k = l.href.split('#')[0];
    if (!inbound.has(k)) inbound.set(k, []);
    inbound.get(k).push({ from: p.final, region: r.region, text: l.text });
  }
  for (const p of ok) {
    if ((p.status && p.status >= 400) || p.snapshot.notFound) F.push({ type: 'dead-page', severity: 'defect', url: p.requested, status: p.status, linkedFrom: (inbound.get(p.requested) || []).slice(0, 8) });
    if (p.redirects.length > 1) F.push({ type: 'redirect-chain', severity: 'likely', url: p.requested, chain: [...p.redirects, p.final] });
    if (p.redirects.length && /login|signin|sign-in|auth/i.test(p.final) && !/[?&](next|from|redirect|returnTo|returnUrl|callbackUrl)=/i.test(p.final)) F.push({ type: 'deep-link-loss', severity: 'defect', url: p.requested, final: p.final });
    // conflicting current markers between regions
    const visRegions = (p.snapshot.regions || []).filter((x) => !x.hidden);
    const cur = visRegions.map((r) => ({ region: r.region, current: r.links.filter((l) => l.current).map((l) => l.href) })).filter((r) => !/tablist|breadcrumb/i.test(r.region));
    const navs = cur.filter((r) => (visRegions.find((x) => x.region === r.region)?.links.length || 0) >= 3);
    const marked = navs.filter((r) => r.current.length);
    const unmarked = navs.filter((r) => !r.current.length && (visRegions.find((x) => x.region === r.region).links.some((l) => l.href && l.href !== '/' && p.final.startsWith(l.href.split('?')[0]))));
    if (marked.length && unmarked.length) F.push({ type: 'active-state-mismatch', severity: 'defect', url: p.final, marked, unmarked: unmarked.map((u) => u.region) });
    if (viewport && /mobile|^3\d\dx|^4\d\dx/.test(viewport) && !p.snapshot.navVisible && !p.snapshot.navToggle) F.push({ type: 'no-visible-nav', severity: 'defect', url: p.final });
  }
  // same destination in multiple regions on one page
  const dupRegions = new Map();
  for (const p of ok) {
    const where = new Map();
    for (const r of (p.snapshot.regions || []).filter((x) => !x.hidden && !/breadcrumb|tablist/i.test(x.region))) for (const l of r.links) if (l.href?.startsWith('/')) where.set(l.href, (where.get(l.href) || new Set()).add(r.region.split('#')[0]));
    for (const [h, rs] of where) if (rs.size > 1) dupRegions.set(h, [...rs]);
  }
  if (dupRegions.size) F.push({ type: 'duplicate-nav', severity: 'judgment', destinations: [...dupRegions.entries()].map(([href, regions]) => ({ href, regions })) });
  // near-duplicate content: drop boilerplate shingles seen on most pages, then compare by containment
  const sh = ok.filter((p) => (p.snapshot.mainText || '').length > 80 && !p.snapshot.notFound && !(p.status >= 400)).map((p) => ({ p, s: shingles(p.snapshot.mainText) }));
  const freq = new Map(); for (const x of sh) for (const g of x.s) freq.set(g, (freq.get(g) || 0) + 1);
  const common = new Set([...freq].filter(([, n]) => sh.length >= 4 && n > sh.length * 0.4).map(([g]) => g));
  for (const x of sh) x.s = new Set([...x.s].filter((g) => !common.has(g)));
  for (let i = 0; i < sh.length; i++) for (let j = i + 1; j < sh.length; j++) {
    const A = sh[i]; const B = sh[j];
    if (A.p.final === B.p.final || A.s.size < 6 || B.s.size < 6 || shapeOf(A.p.final) === shapeOf(B.p.final)) continue;
    let inter = 0; for (const g of A.s) if (B.s.has(g)) inter++;
    const jacc = inter / (A.s.size + B.s.size - inter); const contain = inter / Math.min(A.s.size, B.s.size);
    if (jacc >= 0.5) F.push({ type: 'near-duplicate', severity: 'judgment', a: A.p.final, b: B.p.final, similarity: +jacc.toFixed(2), containment: +contain.toFixed(2) });
    else if (contain >= 0.8) { const [small, big] = A.s.size <= B.s.size ? [A, B] : [B, A]; F.push({ type: 'embeds', severity: 'info', a: big.p.final, b: small.p.final, note: `${big.p.final} contains most of ${small.p.final}`, similarity: +jacc.toFixed(2), containment: +contain.toFixed(2) }); }
  }
  // one finding when navigation is missing on most pages
  const noNav = F.filter((f) => f.type === 'no-visible-nav');
  if (noNav.length >= Math.max(2, ok.length / 2)) {
    for (const f of noNav) F.splice(F.indexOf(f), 1);
    F.push({ type: 'no-visible-nav', severity: 'defect', url: noNav[0].url, pages: noNav.length, of: ok.length, note: `no visible navigation region on ${noNav.length} of ${ok.length} pages at this viewport` });
  }
  // mobile menu destinations versus the sections reachable from persistent nav on the same pages
  if (mobileMenu?.links) {
    const sections = new Set();
    for (const p of ok) for (const r of (p.snapshot.regions || []).filter((x) => x.hidden && !/breadcrumb|tablist|footer/i.test(x.region) && x.links.length >= 3)) for (const l of r.links) if (l.href?.startsWith('/')) sections.add(l.href.split('?')[0]);
    const missing = [...sections].filter((h) => !mobileMenu.links.some((m) => m.split('?')[0] === h));
    if (missing.length) F.push({ type: 'mobile-nav-subset', severity: 'defect', url: mobileMenu.from, toggle: mobileMenu.toggle, offers: mobileMenu.links.length, missing: missing.slice(0, 20), note: 'destinations in the desktop nav (hidden at this width) that the mobile menu does not offer' });
  }
  const emb = F.filter((f) => f.type === 'embeds');
  if (emb.length > 1) { for (const f of emb) F.splice(F.indexOf(f), 1); F.push({ type: 'embeds', severity: 'info', pairs: emb.slice(0, 10).map((f) => f.note), count: emb.length }); }
  // collapse repeats of the same finding across URLs of one shape
  const groups = new Map();
  for (const f of F) {
    const u = f.url || f.a || '';
    const ex = f.b ? `${f.a} ~ ${f.b}` : u;
    const k = f.type + '|' + shapeOf(u) + '|' + (f.b ? shapeOf(f.b) : '') + '|' + JSON.stringify(f.unmarked || f.chain?.slice(-1) || '');
    if (!groups.has(k)) groups.set(k, { ...f, shape: shapeOf(u), occurrences: 1, examples: [ex] });
    else { const g = groups.get(k); g.occurrences++; if (g.examples.length < 3 && !g.examples.includes(ex)) g.examples.push(ex); }
  }
  return [...groups.values()];
}

export function crawlMarkdown(res) {
  const L = [`# Crawl of ${res.start} (${res.viewport})`, '', `${res.pages.length} pages visited, ${res.unvisited.length} queued but not visited.`, ''];
  L.push('| Requested | Final | Status | Redirects | Nav regions | Title |', '|---|---|---|---|---|---|');
  for (const p of res.pages) L.push(`| ${p.requested} | ${p.final || ''} | ${p.status ?? p.error ?? ''} | ${(p.redirects || []).join(' → ')} | ${(p.snapshot?.regions || []).map((r) => r.region).join(', ')} | ${p.snapshot?.title || ''} |`);
  L.push('', '## Findings', '');
  for (const f of res.findings) L.push(`- **${f.type}** (${f.severity}) ${JSON.stringify(Object.fromEntries(Object.entries(f).filter(([k]) => !['type', 'severity'].includes(k))))}`);
  return L.join('\n');
}

// ---------------- journeys ----------------
function resolveLocator(page, step) {
  const sel = step.click ?? step.fill?.[0] ?? step.fill?.selector ?? step.hover ?? step.focus;
  const scope = step.within ? page.locator(step.within) : page;
  return scope.locator(sel).first();
}

const STEP_TYPES = ['goto', 'click', 'fill', 'select', 'press', 'back', 'forward', 'reload', 'scroll', 'wait', 'waitFor', 'hover', 'expect', 'setCookie', 'clearCookies', 'setViewport', 'coldOpen', 'openInNewTab'];

// Runs each journey in a fresh context per viewport. A step whose action fails (selector missing, timeout,
// navigation error) fails the journey: it is recorded as a failed check and the remaining steps are skipped,
// unless the step says "optional": true.
export async function runJourneys(spec, { base, viewport, screenshots, reveal } = {}) {
  const pw = await loadPlaywright();
  const baseUrl = (base || spec.baseUrl || 'http://localhost:3000').replace(/\/$/, '');
  const viewports = viewport ? [viewport] : spec.viewports || ['desktop'];
  const profiles = spec.profiles || {};
  const allowWrites = spec.allowWrites;
  const runs = [];
  for (const j of spec.journeys) {
    for (const vp of j.viewports || viewports) {
      const main = await newContext(pw, { viewport: vp, storageState: j.storageState || spec.storageState, cookies: j.cookies || spec.cookies, base: baseUrl, allowWrites, reveal: reveal || spec.reveal });
      const { browser } = main;
      let ctx = main.ctx; let blocked = main.blocked;
      let page = await ctx.newPage();
      const steps = []; let failed = null;
      const shot = async (pg, i, suffix = '') => { if (!screenshots) return undefined; const f = path.join(screenshots, `${j.id}-${vp}-${String(i).padStart(2, '0')}${suffix}.png`); await pg.screenshot({ path: f }).catch(() => {}); return f; };
      const flushBlocked = (extra) => { if (blocked.length) { extra.blockedWrites = [...new Set(blocked)]; blocked.length = 0; } };
      await page.goto('about:blank');
      let i = 0;
      for (const step of j.steps) {
        const t = Object.keys(step).find((k) => STEP_TYPES.includes(k));
        const v = step[t];
        const desc = describeStep(step, t, v, reveal || spec.reveal);
        if (failed) { steps.push({ i: i++, type: t || 'unknown', desc, skipped: true }); continue; }
        const extra = { label: step.label };
        let other = null; // snapshot taken in another tab or browser (coldOpen, openInNewTab)
        try {
          switch (t) {
            case 'goto': {
              const resp = await page.goto(baseUrl + step.goto, { waitUntil: 'domcontentloaded' });
              const chain = []; let r = resp?.request(); while (r?.redirectedFrom()) { r = r.redirectedFrom(); chain.unshift(new URL(r.url()).pathname + new URL(r.url()).search); }
              extra.status = resp?.status(); extra.redirects = chain.map(scrubUrls); extra.requested = scrubUrls(step.goto); break;
            }
            case 'click': await resolveLocator(page, step).click({ timeout: 6000 }); break;
            case 'hover': await resolveLocator(page, step).hover({ timeout: 6000 }); break;
            case 'fill': { const [sel, val] = Array.isArray(step.fill) ? step.fill : [step.fill.selector, step.fill.value]; await (step.within ? page.locator(step.within) : page).locator(sel).first().fill(String(val), { timeout: 6000 }); break; }
            case 'select': { const [sel, val] = Array.isArray(step.select) ? step.select : [step.select.selector, step.select.value]; await (step.within ? page.locator(step.within) : page).locator(sel).first().selectOption(String(val), { timeout: 6000 }); break; }
            case 'press': await page.keyboard.press(step.press); break;
            case 'back': await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {}); break;
            case 'forward': await page.goForward({ waitUntil: 'domcontentloaded' }).catch(() => {}); break;
            case 'reload': await page.reload({ waitUntil: 'domcontentloaded' }); break;
            case 'scroll': await page.evaluate((y) => window.scrollTo(0, y === 'bottom' ? document.documentElement.scrollHeight : Number(y)), step.scroll); break;
            case 'wait': await page.waitForTimeout(Number(step.wait) || 300); break;
            case 'waitFor': await page.locator(step.waitFor).first().waitFor({ timeout: 8000 }); break;
            case 'setCookie': await ctx.addCookies([{ url: baseUrl, ...step.setCookie }]); break;
            case 'clearCookies': await ctx.clearCookies(); break;
            case 'setViewport': { const { isMobile, hasTouch, ...size } = viewportOf(step.setViewport); await page.setViewportSize(size); break; }
            case 'coldOpen': {
              // Open a URL the way a recipient of a shared link would: a new browser with no history, as a
              // given account. "as": "signed-out" (default), "same" (copy of the current session), or a profile.
              await settle(page);
              const target = v === true ? page.url() : /^https?:/.test(v) ? v : baseUrl + v;
              const as = step.as || 'signed-out';
              const prof = as === 'same' ? { storageState: await ctx.storageState() } : as === 'signed-out' ? {} : profiles[as];
              if (!prof) throw new Error(`coldOpen: unknown profile "${as}" (define it under "profiles")`);
              extra.reference = stripText(await snap(page)); extra.target = scrubUrls(target.replace(baseUrl, '')); extra.as = as;
              const cold = await newContext(pw, { viewport: vp, storageState: prof.storageState, cookies: prof.cookies, base: baseUrl, allowWrites, browser, reveal: reveal || spec.reveal });
              const cp = await cold.ctx.newPage();
              const resp = await cp.goto(target, { waitUntil: 'domcontentloaded' });
              const chain = []; let r = resp?.request(); while (r?.redirectedFrom()) { r = r.redirectedFrom(); chain.unshift(new URL(r.url()).pathname + new URL(r.url()).search); }
              extra.status = resp?.status(); extra.redirects = chain.map(scrubUrls);
              await settle(cp); other = await snap(cp); extra.screenshot = await shot(cp, i, '-cold');
              if (step.continue) { await ctx.close(); ctx = cold.ctx; blocked = cold.blocked; page = cp; } else await cold.ctx.close();
              break;
            }
            case 'openInNewTab': {
              // Cmd/Ctrl-click the control. A real link opens a new tab and leaves this one alone; a click
              // handler on a non-link either does nothing or navigates in place.
              await settle(page);
              const loc = resolveLocator(page, { ...step, click: v });
              extra.href = await loc.evaluate((el) => { const a = el.closest('a[href]'); return a ? a.getAttribute('href') : null; }, null, { timeout: 6000 });
              extra.reference = stripText(await snap(page));
              const before = page.url();
              const popup = ctx.waitForEvent('page', { timeout: 4000 }).catch(() => null);
              await loc.click({ modifiers: ['ControlOrMeta'], timeout: 6000 });
              const np = await popup;
              await settle(page);
              extra.sameTabUrl = page.url() !== before ? page.url().replace(baseUrl, '') : null;
              if (np) { await settle(np); other = await snap(np); extra.screenshot = await shot(np, i, '-tab'); if (step.continue) page = np; else await np.close(); }
              else extra.newTab = 'none';
              break;
            }
            case 'expect': break;
            default: throw new Error(`Unknown step: ${JSON.stringify(step)}`);
          }
        } catch (e) { extra.error = scrubUrls(String(e.message || e).split('\n')[0]); }
        if (t !== 'expect') await settle(page);
        flushBlocked(extra);
        if (t === 'expect') { steps.push({ i: i++, type: 'expect', desc, expect: step.expect, snapshot: steps.length ? steps[steps.length - 1].snapshot : await snap(page) }); continue; }
        const s = other || await snap(page);
        if (!other) extra.screenshot = await shot(page, i);
        steps.push({ i: i++, type: t, desc, snapshot: s, other: ['coldOpen', 'openInNewTab'].includes(t) || undefined, ...extra });
        if (extra.error && !step.optional) { failed = extra.error; continue; }
        if (step.expect) steps.push({ i: i++, type: 'expect', desc: `expect after ${desc}`, expect: step.expect, snapshot: s });
      }
      await browser.close();
      runs.push({ journey: j.id, title: j.title, viewport: vp, intent: j.intent, failed: failed || undefined, steps });
    }
  }
  return { baseUrl, generatedAt: new Date().toISOString(), accept: spec.accept || [], runs };
}

// Remove captured page text before a log is written to disk.
export function redactLog(log) { for (const r of log.runs || []) for (const st of r.steps) { stripText(st.snapshot); stripText(st.reference); } return log; }
