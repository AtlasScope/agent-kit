#!/usr/bin/env node
// Lays captures of the orbit scene side by side on one labelled sheet, for comparing looks and moments at a glance.
//   cd site && node scripts/orbit-sheet.mjs out.png 2 a.png b.png ...    (2: columns; each file's name is its label)
// Columns are 960 pixels wide; every capture is scaled to that width and keeps its own shape.
import path from "node:path";
import sharp from "sharp";

const [out, columns, ...files] = process.argv.slice(2);
if (!out || !files.length) { console.error("usage: orbit-sheet.mjs out.png columns file..."); process.exit(1); }
const cols = Math.max(1, Number(columns) || 2), W = 960, GAP = 8, LABEL = 28;
const tiles = await Promise.all(files.map(async (file) => {
  const img = sharp(file).resize({ width: W });
  const buf = await img.png().toBuffer();
  const { height } = await sharp(buf).metadata();
  return { buf, height, label: path.basename(file, path.extname(file)) };
}));
const rows = [];
for (let i = 0; i < tiles.length; i += cols) rows.push(tiles.slice(i, i + cols));
const rowH = rows.map((r) => Math.max(...r.map((t) => t.height)) + LABEL);
const width = cols * W + (cols + 1) * GAP, height = rowH.reduce((a, b) => a + b + GAP, GAP);
const escape = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const layers = [];
let y = GAP;
rows.forEach((row, j) => {
  row.forEach((t, i) => {
    const x = GAP + i * (W + GAP);
    layers.push({ input: Buffer.from(`<svg width="${W}" height="${LABEL}"><text x="4" y="20" font-family="monospace" font-size="16" fill="#cfd">${escape(t.label)}</text></svg>`), left: x, top: y });
    layers.push({ input: t.buf, left: x, top: y + LABEL });
  });
  y += rowH[j] + GAP;
});
await sharp({ create: { width, height, channels: 3, background: "#14161a" } }).composite(layers).png().toFile(out);
console.log(out, `${width} x ${height}`);
