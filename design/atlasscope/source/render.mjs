// Turns SVG files into PNGs. Usage: node render.mjs <in.svg> <out.png> [width]  (repeatable via a JSON job list on stdin)
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(new URL("../../../site/package.json", import.meta.url));
const sharp = require("sharp");

const jobs = process.argv[2] === "-" ? JSON.parse(readFileSync(0, "utf8")) : [[process.argv[2], process.argv[3], Number(process.argv[4]) || undefined]];
for (const [src, out, width] of jobs) {
  let img = sharp(readFileSync(src), { density: 300 });
  if (width) img = img.resize({ width });
  await img.png({ compressionLevel: 9 }).toFile(out);
}
