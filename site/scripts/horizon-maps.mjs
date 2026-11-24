#!/usr/bin/env node
// Makes the planet's maps for the horizon scene from NASA originals kept outside the repository.
//   node scripts/horizon-maps.mjs <folder with the originals> [day, e.g. 20261122]
// Originals (see components/horizon/SOURCES.md for where each comes from and its terms):
//   bmng/world.topo.bathy.200412.3x21600x10800.jpg   Blue Marble Next Generation, surface colour
//   night/BlackMarble_2016_3km.jpg                   Black Marble, city lights
//   cloud2k/cloud_combined_2048.jpg                  Blue Marble cloud composite, used only where the day has no data
//   gibs/viirs_<day>_r<row>_c<col>.jpg               one day of VIIRS true colour from GIBS, 2 rows by 4 columns of 4096 px
// Written to public/horizon/earth/: colour.jpg, night.jpg, clouds.jpg (8192 wide) and clouds-16k.jpg.
//
// The cloud map is measured, not drawn. A true-colour satellite picture shows cloud as whatever is whiter than the
// ground under it, so each pixel is compared with the cloud-free Blue Marble at the same place: the amount by which
// its darkest channel exceeds the ground's is the cloud. Where the satellite saw nothing that day (the polar night,
// gaps between passes) or the ground is itself white (ice, snow), the older global cloud composite fills in.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

sharp.cache(false);
const site = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
// With no folder given, the originals are looked for in the repository's ignored scratch folder.
const [source = path.join(site, "..", ".artifacts", "horizon", "source"), day = "20261122"] = process.argv.slice(2);
const out = path.join(site, "public", "horizon", "earth");
await mkdir(out, { recursive: true });
const big = { limitInputPixels: false };
const W = 16384, H = 8192, TILE = 4096;

const bmng = path.join(source, "bmng", "world.topo.bathy.200412.3x21600x10800.jpg");
await sharp(bmng, big).resize(8192, 4096, { kernel: "lanczos3" }).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(out, "colour.jpg"));
await sharp(path.join(source, "night", "BlackMarble_2016_3km.jpg"), big).resize(8192, 4096, { kernel: "lanczos3" }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(out, "night.jpg"));
console.log("colour.jpg, night.jpg");

const ground = await sharp(bmng, big).resize(W, H, { kernel: "cubic" }).removeAlpha().raw().toBuffer();
const filler = await sharp(path.join(source, "cloud2k", "cloud_combined_2048.jpg")).resize(W, H, { kernel: "cubic" }).greyscale().raw().toBuffer();
const cloud = Buffer.alloc(W * H);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
  const tile = await sharp(path.join(source, "gibs", `viirs_${day}_r${row}_c${col}.jpg`)).removeAlpha().raw().toBuffer();
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const i = (y * TILE + x) * 3, gx = col * TILE + x, gy = row * TILE + y, g = (gy * W + gx) * 3;
    const r = tile[i] / 255, gr = tile[i + 1] / 255, b = tile[i + 2] / 255;
    const low = Math.min(r, gr, b), high = Math.max(r, gr, b);
    const under = Math.min(ground[g], ground[g + 1], ground[g + 2]) / 255, underHigh = Math.max(ground[g], ground[g + 1], ground[g + 2]) / 255;
    // Whiter than the ground, and not strongly coloured (sand and shallow water are bright but tinted).
    // Kept linear all the way to white, so the brightest towers still stand out from the decks round them.
    let c = Math.min(1, Math.max(0, (low - under - 0.03) / (0.97 - under))) * (1 - smooth(0.16, 0.34, high - low));
    // No data that day, or ground too white to tell cloud from snow: lean on the composite.
    const seen = smooth(0.012, 0.05, high), white = smooth(0.5, 0.72, under) * smooth(0.6, 0.8, underHigh);
    const trust = seen * (1 - white);
    c = c * trust + (filler[gy * W + gx] / 255) * (1 - trust);
    cloud[gy * W + gx] = Math.round(255 * Math.min(1, Math.max(0, c)));
  }
  console.log(`tile r${row} c${col}`);
}
const grey = () => sharp(cloud, { raw: { width: W, height: H, channels: 1 }, ...big });
await grey().jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(out, "clouds-16k.jpg"));
await grey().resize(8192, 4096, { kernel: "lanczos3" }).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(out, "clouds.jpg"));
console.log("clouds.jpg, clouds-16k.jpg");

// Sharper cloud for the regions the directions fly over (components/horizon/stage.ts names the same boxes): the
// full-resolution map cut to a box, which may cross the date line. About 2.4 km a pixel, twice the global map.
const REGIONS = { pacific: { west: 145, north: -2, width: 150, height: 62 }, iberia: { west: -25, north: 64, width: 130, height: 62 } };
for (const [name, box] of Object.entries(REGIONS)) {
  const x0 = Math.round(((box.west + 180) / 360) * W), y0 = Math.round(((90 - box.north) / 180) * H);
  const w = Math.round((box.width / 360) * W), h = Math.round((box.height / 180) * H), cut = Buffer.alloc(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) cut[y * w + x] = cloud[(y0 + y) * W + ((x0 + x) % W)];
  await sharp(cut, { raw: { width: w, height: h, channels: 1 } }).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(out, `clouds-${name}.jpg`));
  console.log(`clouds-${name}.jpg ${w}x${h}`);
}
