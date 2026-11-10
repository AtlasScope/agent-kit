// Before/after sheet: pairs PNG captures that share a file name in two folders and writes one HTML page.
// No browser needed. The sheet is an index; the full-size images stay where they are.
import fs from 'node:fs';
import path from 'node:path';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pngs = (dir) => fs.readdirSync(dir).filter((f) => /\.png$/i.test(f)).sort();
const manifest = (dir) => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'capture.json'), 'utf8')); } catch { return null; } };

// PNG width and height from the IHDR chunk.
export function pngSize(file) {
  const fd = fs.openSync(file, 'r'); const b = Buffer.alloc(24);
  try { fs.readSync(fd, b, 0, 24, 0); } finally { fs.closeSync(fd); }
  return b.toString('ascii', 12, 16) === 'IHDR' ? { width: b.readUInt32BE(16), height: b.readUInt32BE(20) } : null;
}

export function pairCaptures(beforeDir, afterDir) {
  const a = pngs(beforeDir), b = new Set(pngs(afterDir));
  const pairs = a.filter((f) => b.has(f));
  return { pairs, onlyBefore: a.filter((f) => !b.has(f)), onlyAfter: [...b].filter((f) => !a.includes(f)).sort() };
}

// blind: each pair is shown as A and B in an order chosen per pair, images are embedded so file paths do not
// give the side away, and the key is returned separately for the caller to write to its own file.
export function buildSheet(beforeDir, afterDir, { outFile, title, blind = false, inline = false, random = Math.random } = {}) {
  const { pairs, onlyBefore, onlyAfter } = pairCaptures(beforeDir, afterDir);
  title = title || (blind ? 'Comparison' : 'Before and after');
  const embed = blind || inline;
  const src = (dir, f) => (embed ? `data:image/png;base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}` : esc(path.relative(path.dirname(outFile), path.join(dir, f)).split(path.sep).map((seg) => (seg === '..' ? seg : encodeURIComponent(seg))).join('/')));
  const mb = manifest(beforeDir), ma = manifest(afterDir);
  const key = []; const rows = []; const notes = [];
  for (const f of pairs) {
    const sb = pngSize(path.join(beforeDir, f)), sa = pngSize(path.join(afterDir, f));
    if (sb && sa && sb.width !== sa.width) notes.push(`${f}: widths differ (${sb.width} and ${sa.width} px), so this pair is not comparable`);
    const swap = blind && random() < 0.5;
    const sides = swap ? [['A', afterDir], ['B', beforeDir]] : blind ? [['A', beforeDir], ['B', afterDir]] : [['Before', beforeDir], ['After', afterDir]];
    if (blind) key.push({ capture: f, A: swap ? 'after' : 'before', B: swap ? 'before' : 'after' });
    rows.push(`<section><h2>${esc(f.replace(/\.png$/i, ''))}</h2><div class="pair">${sides.map(([label, dir]) => `<figure><figcaption>${label}</figcaption>${embed ? '' : `<a href="${src(dir, f)}">`}<img loading="lazy" alt="${label}: ${esc(f)}" src="${src(dir, f)}">${embed ? '' : '</a>'}</figure>`).join('')}</div></section>`);
  }
  const meta = (m, label) => (m ? `<li>${label}: ${esc(m.base || '')}${m.revision ? `, revision ${esc(m.revision)}` : ', revision not recorded'}${m.capturedAt ? `, captured ${esc(m.capturedAt)}` : ''}</li>` : `<li>${label}: no capture.json in the folder; revision not recorded</li>`);
  const unpaired = [...onlyBefore.map((f) => `${f} (before only)`), ...onlyAfter.map((f) => `${f} (after only)`)];
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>
:root{color-scheme:light dark;--bg:#fff;--fg:#111;--mut:#666;--line:#ddd}
@media (prefers-color-scheme:dark){:root{--bg:#111;--fg:#eee;--mut:#999;--line:#333}}
body{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}
h1{font-size:20px;margin:0 0 8px}h2{font-size:14px;font-weight:600;margin:32px 0 8px;font-family:ui-monospace,monospace}
ul{margin:0 0 8px;padding-left:20px;color:var(--mut);font-size:13px}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
figure{margin:0}figcaption{font-size:12px;color:var(--mut);margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em}
img{max-width:100%;height:auto;border:1px solid var(--line);display:block}
@media (max-width:700px){.pair{grid-template-columns:1fr}}
</style>
<h1>${esc(title)}</h1>
<ul>${blind ? '<li>Blind sheet: A and B are in a different order for each pair. The key is in a separate file.</li>' : meta(mb, 'Before') + meta(ma, 'After')}<li>${pairs.length} pair(s)${embed ? '' : '. Each image links to the full-size file'}.</li>${notes.map((n) => `<li>${esc(n)}</li>`).join('')}${!blind && unpaired.length ? `<li>Not paired: ${esc(unpaired.join(', '))}</li>` : ''}</ul>
${rows.join('\n')}
</html>
`;
  return { html, key: blind ? { before: mb?.revision || null, after: ma?.revision || null, pairs: key } : null, pairs, onlyBefore, onlyAfter, notes };
}
