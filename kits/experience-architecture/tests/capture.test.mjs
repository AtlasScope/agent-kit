// ea capture and ea sheet. The sheet tests need no browser; the capture test serves two pages itself and is
// skipped when no Playwright with a browser can be found.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { buildSheet, pairCaptures, pngSize } from '../plugins/experience-architecture/scripts/lib/sheet.mjs';
import { shotName, loadPlaywright } from '../plugins/experience-architecture/scripts/lib/browser.mjs';

const EA = path.resolve('plugins/experience-architecture/scripts/ea.mjs');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'ea-capture-'));

// A valid one-colour PNG of the given size, built by hand so the test needs no image library.
function png(width, height, grey) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const body = Buffer.concat([Buffer.from(type), data]); const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body)); return Buffer.concat([len, body, sum]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 0;
  const raw = Buffer.alloc((width + 1) * height, grey); for (let y = 0; y < height; y++) raw[y * (width + 1)] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function twoFolders() {
  const root = tmp(); const b = path.join(root, 'before'), a = path.join(root, 'after');
  fs.mkdirSync(b); fs.mkdirSync(a);
  for (const f of ['home-desktop.png', 'home-mobile.png', 'orders-desktop.png']) fs.writeFileSync(path.join(b, f), png(8, 6, 40));
  for (const f of ['home-desktop.png', 'home-mobile.png', 'settings-desktop.png']) fs.writeFileSync(path.join(a, f), png(8, 9, 200));
  fs.writeFileSync(path.join(a, 'home-mobile.png'), png(5, 9, 200));
  fs.writeFileSync(path.join(b, 'capture.json'), JSON.stringify({ base: 'http://localhost:3000', revision: 'abc1234' }));
  return { root, b, a };
}

test('capture file names depend only on the URL and the width, and hide secret parameters', () => {
  assert.equal(shotName('/', 'desktop'), 'home-desktop.png');
  assert.equal(shotName('http://localhost:3000/orders/1003?tab=notes', '560x900'), 'orders-1003-tab-notes-560x900.png');
  assert.ok(!shotName('/invite?token=abc123SECRET', 'mobile').includes('abc123'));
});

test('a sheet pairs by file name, links the full-size files and reports what did not pair', () => {
  const { root, b, a } = twoFolders();
  assert.deepEqual(pngSize(path.join(b, 'home-desktop.png')), { width: 8, height: 6 });
  assert.deepEqual(pairCaptures(b, a), { pairs: ['home-desktop.png', 'home-mobile.png'], onlyBefore: ['orders-desktop.png'], onlyAfter: ['settings-desktop.png'] });
  const r = buildSheet(b, a, { outFile: path.join(root, 'sheet.html') });
  assert.ok(r.html.includes('href="before/home-desktop.png"') && r.html.includes('src="after/home-desktop.png"'));
  assert.match(r.html, /revision abc1234/);
  assert.match(r.html, /After: no capture\.json in the folder; revision not recorded/);
  assert.match(r.html, /orders-desktop\.png \(before only\)/);
  assert.equal(r.notes.length, 1, 'the pair captured at two widths is flagged as not comparable');
  assert.equal(r.key, null);
});

test('a blind sheet gives away neither side, and its key matches what is shown', () => {
  const { root, b, a } = twoFolders();
  const before64 = fs.readFileSync(path.join(b, 'home-desktop.png')).toString('base64');
  for (const roll of [0.1, 0.9]) {
    const r = buildSheet(b, a, { outFile: path.join(root, 'blind.html'), blind: true, random: () => roll });
    assert.ok(!/before|after|abc1234/i.test(r.html.replace(/data:image\/png;base64,[A-Za-z0-9+/=]+/g, '')), 'no side, folder name or revision in the page');
    const k = r.key.pairs.find((p) => p.capture === 'home-desktop.png');
    assert.equal(k.A, roll < 0.5 ? 'after' : 'before');
    const firstImage = r.html.match(/<h2>home-desktop<\/h2>.*?src="data:image\/png;base64,([^"]+)"/s)[1];
    assert.equal(firstImage === before64, k.A === 'before', 'image A is the side the key says');
  }
});

test('the sheet command writes the page and a separate key, and refuses folders with nothing in common', () => {
  const { root, b, a } = twoFolders();
  const out = execFileSync('node', [EA, 'sheet', b, a, '--blind'], { encoding: 'utf8' });
  assert.match(out, /2 pair\(s\)/);
  assert.ok(fs.existsSync(path.join(root, 'sheet-blind.html')) && fs.existsSync(path.join(root, 'sheet-blind-key.json')));
  const empty = path.join(root, 'empty'); fs.mkdirSync(empty);
  assert.throws(() => execFileSync('node', [EA, 'sheet', b, empty], { stdio: 'pipe' }));
});

const havePw = await loadPlaywright().then(() => true).catch(() => false);
test('capture writes one full-page screen per URL and width, blocks writes and records the revision', { skip: havePw ? false : 'no Playwright with a browser' }, async () => {
  const hits = [];
  const server = http.createServer((req, res) => {
    hits.push(`${req.method} ${req.url}`);
    if (req.url === '/gone') { res.writeHead(404, { 'content-type': 'text/html' }); return res.end('<title>Not found</title><h1>Not found</h1>'); }
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(`<meta name="viewport" content="width=device-width,initial-scale=1"><title>Page ${req.url}</title><h1>${req.url}</h1><div style="height:2000px"></div><script>fetch('/save',{method:'POST',body:'x'}).catch(()=>{})</script>`);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const dir = path.join(tmp(), 'before');
  try {
    const { execFile } = await import('node:child_process');
    const out = await new Promise((resolve, reject) => execFile('node', [EA, 'capture', '/', '/orders?tab=open', '/gone', '--base', base, '--widths', 'desktop,mobile', '--out', dir, '--revision', 'test-rev'], (e, so, se) => (e ? reject(new Error(se || so)) : resolve(so))));
    assert.match(out, /6 capture\(s\) at desktop, mobile/);
    assert.match(out, /check: \/gone at desktop returned 404/);
    const m = JSON.parse(fs.readFileSync(path.join(dir, 'capture.json'), 'utf8'));
    assert.equal(m.revision, 'test-rev');
    assert.equal(m.shots.length, 6);
    assert.deepEqual(pngSize(path.join(dir, 'home-mobile.png')).width, 390);
    assert.ok(pngSize(path.join(dir, 'orders-tab-open-desktop.png')).height > 1500, 'full page, not only the first view');
    assert.ok(m.blockedWrites.includes('POST /save') && !hits.some((h) => h.startsWith('POST')), 'the page could not write');
  } finally { server.close(); }
});
