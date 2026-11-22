// The scripts work inside repos other people wrote. A link planted at a path they use could aim a write at a git
// hook or a shell profile, or pull a private file into a page that gets published. So: no links, nothing in .git.
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

// Returns the resolved path, or throws. Every later operation must use the returned path, not the one passed in.
export function safePath(file) {
  const full = path.resolve(file), top = path.parse(full).root;
  let at = top;
  for (const [i, part] of full.slice(top.length).split(path.sep).filter(Boolean).entries()) {
    // Windows ignores trailing dots and spaces, and ":" opens another stream of the same file.
    if (/^(\.git([ .]*$|:)|git~\d+$)/i.test(part)) throw new Error(`Refusing ${full}: it is inside .git.`);
    at = path.join(at, part);
    let stat;
    try { stat = fs.lstatSync(at); } catch (e) { if (e.code === "ENOENT") continue; throw e; }
    // Links at the top of the disk belong to the system (/tmp and /var on macOS).
    if (stat.isSymbolicLink() && i > 0) throw new Error(`Refusing ${full}: ${at} is a link. Use a new scratch folder outside the project for the palette files.`);
  }
  return full;
}

// Writes a new file and moves it into place, so whatever was at the path is replaced and never written through.
export function writeSafe(file, body, extension) {
  if (path.extname(file).toLowerCase() !== extension) throw new Error(`Refusing ${file}: the file has to end in ${extension}`);
  const full = safePath(file), dir = path.dirname(full);
  fs.mkdirSync(dir, { recursive: true });
  safePath(full);
  const fresh = path.join(dir, `.palette-${randomBytes(8).toString("hex")}.tmp`);
  try {
    fs.writeFileSync(fresh, body, { flag: "wx" });
    fs.renameSync(fresh, full);
  } finally {
    fs.rmSync(fresh, { force: true });
  }
}
