#!/usr/bin/env node
// Makes a map of how high the cloud tops stand, for one region, from NASA's retrieved cloud properties.
//   node scripts/horizon-heights.mjs [folder with the originals] [region] [layer suffix: Day or Night]
// The originals are pictures from GIBS of the layer VIIRS_NOAA20_Cloud_Top_Height_Day (the browse rendering of the
// CLDPROP_L2_VIIRS_NOAA20 product) for the scene's day, cut to the region's box at the regional cloud map's size, as
// a west and an east half where the box crosses the date line, with the layer's colour key beside them (cth.xml).
// components/horizon/SOURCES.md has the exact requests.
//
// The pictures are colour-coded: each colour stands for a 50 m band of height, up to 12 km. The key turns every pixel
// back into metres. Clear sky and places the retrieval failed have no height; they are filled from the cloud round
// them, widest gaps from farthest away, so the map is a continuous surface. Where there is no cloud the surface is
// never seen, because the cloud map, not this one, says where cloud is. Written as public/horizon/earth/
// tops-<region>.jpg at half the cloud map's size: white is 12.75 km.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const site = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const [source = path.join(site, "..", ".artifacts", "horizon", "source", "cldprop"), region = "pacific", suffix = "Day"] = process.argv.slice(2);
const layer = `VIIRS_NOAA20_Cloud_Top_Height_${suffix}`;
const big = { limitInputPixels: false };

const key = new Map();
for (const [, r, g, b, low, high] of (await readFile(path.join(source, "cth.xml"), "utf8")).matchAll(/rgb="(\d+),(\d+),(\d+)" transparent="false" sourceValue="\[(\d+),([^)\]]+)/g)) {
  key.set((+r << 16) | (+g << 8) | +b, high === "+INF" ? +low : (+low + +high) / 2);
}

const halves = [];
for (const side of ["w", "e"]) {
  try { halves.push(await sharp(path.join(source, `${layer}_${region}_${side}.png`), big).ensureAlpha().raw().toBuffer({ resolveWithObject: true })); } catch { /* a box that does not cross the date line has one picture */ }
}
const W = halves.reduce((sum, half) => sum + half.info.width, 0), H = halves[0].info.height;
const w = Math.ceil(W / 2), h = Math.ceil(H / 2);
let value = new Float32Array(w * h), weight = new Float32Array(w * h), x0 = 0, known = 0;
for (const { data, info } of halves) {
  for (let y = 0; y < H; y++) for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * 4;
    if (data[i + 3] < 128) continue;
    const metres = key.get((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
    if (metres === undefined) continue;
    const j = (y >> 1) * w + ((x0 + x) >> 1);
    value[j] += metres; weight[j] += 1; known++;
  }
  x0 += info.width;
}
for (let i = 0; i < value.length; i++) if (weight[i]) { value[i] /= weight[i]; weight[i] = 1; }
console.log(`${layer} ${region}: ${W}x${H}, ${((100 * known) / (W * H)).toFixed(1)}% of pixels carry a height`);

// Fill the gaps: halve the map again and again, averaging only what is known, then come back up, giving each unknown
// pixel the value of the coarsest level that knew something there.
const levels = [{ value, weight, w, h }];
while (levels.at(-1).w > 2 && levels.at(-1).h > 2) {
  const up = levels.at(-1), cw = Math.ceil(up.w / 2), ch = Math.ceil(up.h / 2), cv = new Float32Array(cw * ch), cwt = new Float32Array(cw * ch);
  for (let y = 0; y < up.h; y++) for (let x = 0; x < up.w; x++) {
    const i = y * up.w + x, j = (y >> 1) * cw + (x >> 1);
    cv[j] += up.value[i] * up.weight[i]; cwt[j] += up.weight[i];
  }
  for (let j = 0; j < cv.length; j++) if (cwt[j]) { cv[j] /= cwt[j]; cwt[j] = Math.min(1, cwt[j]); }
  levels.push({ value: cv, weight: cwt, w: cw, h: ch });
}
for (let l = levels.length - 2; l >= 0; l--) {
  const fine = levels[l], coarse = levels[l + 1];
  for (let y = 0; y < fine.h; y++) for (let x = 0; x < fine.w; x++) {
    const i = y * fine.w + x;
    if (fine.weight[i] >= 1) continue;
    // Bilinear from the coarser level, so a filled gap is smooth and not blocks.
    const fx = Math.min(coarse.w - 1, Math.max(0, (x - 0.5) / 2)), fy = Math.min(coarse.h - 1, Math.max(0, (y - 0.5) / 2));
    const ax = Math.floor(fx), ay = Math.floor(fy), bx = Math.min(coarse.w - 1, ax + 1), by = Math.min(coarse.h - 1, ay + 1), tx = fx - ax, ty = fy - ay;
    const at = (cx, cy) => coarse.value[cy * coarse.w + cx];
    const filled = (at(ax, ay) * (1 - tx) + at(bx, ay) * tx) * (1 - ty) + (at(ax, by) * (1 - tx) + at(bx, by) * tx) * ty;
    fine.value[i] = fine.value[i] * fine.weight[i] + filled * (1 - fine.weight[i]); fine.weight[i] = 1;
  }
}
// A retrieval is noisy from pixel to pixel, and a noisy surface would light like hammered metal. Three passes of a
// small box blur (about a 7 km Gaussian) keep the fronts and towers and lose the speckle.
const blur = (src) => {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) tmp[y * w + x] = (src[y * w + Math.max(0, x - 1)] + src[y * w + x] + src[y * w + Math.min(w - 1, x + 1)]) / 3;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + x] = (tmp[Math.max(0, y - 1) * w + x] + tmp[y * w + x] + tmp[Math.min(h - 1, y + 1) * w + x]) / 3;
  return out;
};
value = blur(blur(blur(value)));
const bytes = Buffer.alloc(w * h);
for (let i = 0; i < bytes.length; i++) bytes[i] = Math.round(Math.min(255, Math.max(0, value[i] / 50)));
const file = path.join(site, "public", "horizon", "earth", `tops-${region}.jpg`);
await sharp(bytes, { raw: { width: w, height: h, channels: 1 } }).jpeg({ quality: 88, mozjpeg: true }).toFile(file);
console.log(`tops-${region}.jpg ${w}x${h}`);
