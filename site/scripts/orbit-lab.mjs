#!/usr/bin/env node
// The orbit lab: a development page for tuning the homepage's procedural planet (components/orbit/).
// It is not part of the website. Nothing under app/ links to it and `next build` never sees it.
//   cd site && npm run lab        then open http://localhost:4317
// The renderer's TypeScript is served straight from disk with its types stripped, so a saved edit shows on the next
// load, and the page reloads itself when a file under components/orbit or lab changes.
// It listens on this machine only. To judge the scene on a real phone on the same network, start it with
// HOST=0.0.0.0 and open the computer's address from the phone.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync, watch } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORT = Number(process.env.PORT || 4317);
const HOST = process.env.HOST || "127.0.0.1";
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".ts": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml",
};

// Only these folders are served: the lab page, the renderer, and the hero stills for side-by-side comparison.
const ALLOWED = ["lab", "components/orbit", "components/horizon", "public/hero", "public/horizon"].map((dir) => path.join(ROOT, dir) + path.sep);
const clients = new Set();

// The file an address names, or null. The address is resolved against the site folder and must then lie inside it,
// and inside one of the served folders, however it was written (.. segments, escaped slashes).
function resolve(urlPath) {
  let wanted;
  try { wanted = decodeURIComponent(urlPath); } catch { return null; }
  if (wanted === "/") return path.join(ROOT, "lab", "index.html");
  const full = path.resolve(ROOT, `./${wanted}`);
  if (!full.startsWith(ROOT + path.sep)) return null;
  if (!ALLOWED.some((dir) => full.startsWith(dir))) return null;
  for (const candidate of [full, `${full}.ts`, path.join(full, "index.ts")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/__reload") {
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
    res.write("retry: 500\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }
  const file = resolve(url.pathname);
  if (!file) { res.writeHead(404, { "content-type": "text/plain" }); res.end("Not found"); return; }
  try {
    const ext = path.extname(file);
    let body = await readFile(file);
    if (ext === ".ts") body = stripTypeScriptTypes(body.toString("utf8"), { mode: "strip" });
    res.writeHead(200, { "content-type": TYPES[ext] || "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
  } catch (error) {
    // A source file that will not parse is served as a module that throws, so the page itself says what broke.
    const message = `${path.relative(ROOT, file)}: ${error?.message || error}`;
    if (path.extname(file) === ".ts") {
      res.writeHead(200, { "content-type": TYPES[".ts"], "cache-control": "no-store" });
      res.end(`throw new Error(${JSON.stringify(message)});`);
    } else {
      res.writeHead(500, { "content-type": "text/plain" });
      res.end(message);
    }
  }
});

let pending = 0;
for (const dir of ["lab", "components/orbit", "components/horizon"]) {
  watch(path.join(ROOT, dir), { recursive: true }, () => {
    clearTimeout(pending);
    pending = setTimeout(() => { for (const client of clients) client.write("data: reload\n\n"); }, 80);
  });
}

process.removeAllListeners("warning");
server.listen(PORT, HOST, () => console.log(`orbit lab: http://localhost:${PORT}`));
