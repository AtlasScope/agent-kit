#!/usr/bin/env node
// Smaller copies of the horizon maps, so no device downloads and decodes more than it keeps.
//   node scripts/horizon-sizes.mjs
// components/horizon/stage.ts asks for the "-4k" globe maps on a computer and the "-2k" ones on a phone, and for the
// "-4k" copy of a regional cloud map on a phone. Run after horizon-maps.mjs; prints what each device then downloads.
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

sharp.cache(false);
const earth = path.join(path.resolve(fileURLToPath(new URL("..", import.meta.url))), "public", "horizon", "earth");
const big = { limitInputPixels: false };
const jobs = [
  ["clouds", 4096, 84], ["clouds", 2048, 84], ["colour", 4096, 86], ["colour", 2048, 86], ["night", 4096, 84], ["night", 2048, 84],
  ["clouds-pacific", 4096, 84], ["clouds-iberia", 4096, 84],
];
const size = async (name) => (await stat(path.join(earth, `${name}.jpg`))).size;
for (const [name, width, quality] of jobs) {
  await sharp(path.join(earth, `${name}.jpg`), big).resize({ width, kernel: "lanczos3" }).jpeg({ quality, mozjpeg: true }).toFile(path.join(earth, `${name}-${width / 1024}k.jpg`));
}
const mb = (bytes) => `${(bytes / 1e6).toFixed(1)} MB`;
for (const region of ["pacific", "iberia"]) {
  const tops = await size(`tops-${region}`).catch(() => 0);
  const computer = (await size("clouds-4k")) + (await size("colour-4k")) + (await size("night-4k")) + (await size(`clouds-${region}`)) + tops;
  const phone = (await size("clouds-2k")) + (await size("colour-2k")) + (await size("night-2k")) + (await size(`clouds-${region}-4k`)) + tops;
  console.log(`${region}: a computer downloads ${mb(computer)}, a phone ${mb(phone)}`);
}
