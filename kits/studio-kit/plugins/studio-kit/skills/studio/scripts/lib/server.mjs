// The local server for one studio folder. It serves the page and any files beside it, keeps the person's choices
// in .studio/state.json, queues what the page sends for the agent's `wait`, and pushes status to the page.
// It listens on 127.0.0.1 only, accepts API calls only with the key in the page's address, and when an edit
// breaks the page it keeps serving the last version that parsed.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";
import { syntaxProblems, extensionProblems } from "./check.mjs";

export const metaDir = (dir) => path.join(dir, ".studio");
export const readJSON = (f, fallback) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return fallback; } };
export function writeJSON(f, v) {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const tmp = f + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(v, null, 1));
  fs.renameSync(tmp, f);
}
/** A port that stays the same for a folder, so the page's address (and its saved choices) survive restarts. */
export const preferredPort = (dir) => 47000 + (parseInt(crypto.createHash("sha1").update(dir).digest("hex").slice(0, 6), 16) % 2000);

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".otf": "font/otf", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp" };
const LISTEN_GRACE = 4000; // a wait reconnects every 20s; between polls it still counts as listening
const POLL_MS = 20000;

export function serve(dir) {
  const meta = metaDir(dir);
  fs.mkdirSync(meta, { recursive: true });
  const file = path.join(dir, "index.html");
  const prev = readJSON(path.join(meta, "server.json"), {});
  const key = prev.key || crypto.randomBytes(16).toString("hex");
  const queueFile = path.join(meta, "queue.json"), stateFile = path.join(meta, "state.json");
  let queue = readJSON(queueFile, []);
  const persist = () => writeJSON(queueFile, queue);

  /* ---- the page file: the last version that parsed is the one served ---- */
  let good = "", version = "", lastMtime = 0, ok = true, error = "";
  const reportedBroken = new Set();
  function refresh() {
    let st;
    try { st = fs.statSync(file); } catch { return; }
    if (st.mtimeMs === lastMtime) return;
    lastMtime = st.mtimeMs;
    const html = fs.readFileSync(file, "utf8");
    const hash = crypto.createHash("sha1").update(html).digest("hex").slice(0, 12);
    const problems = syntaxProblems(html);
    if (!problems.length) problems.push(...extensionProblems(html)); // a broken new category keeps the last good page too
    if (!problems.length || !good) { good = html; version = hash; }
    ok = !problems.length;
    error = problems.join("; ");
    if (!ok && !reportedBroken.has(hash)) {
      reportedBroken.add(hash);
      push({ kind: "error", message: `The last edit to index.html has a mistake, so the page still shows the version before it: ${error}` });
    }
  }
  const page = () => good.replace("</head>", `<meta name="studio-version" content="${version}"></head>`);

  /* ---- waiting agents and the queue ---- */
  let waiters = [], lastWaiter = 0;
  const listening = () => waiters.length > 0 || Date.now() - lastWaiter < LISTEN_GRACE;
  function push(item) {
    if (item.kind === "error" && queue.some((q) => q.kind === "error" && q.message === item.message)) return;
    queue.push({ ...item, at: new Date().toISOString() });
    persist();
    flush();
  }
  /* Hands the whole queue to one live waiter. If that connection closes before the reply is sent, the items go
     back on the queue for the next wait. */
  function flush() {
    waiters = waiters.filter((w) => !w.destroyed && !w.writableEnded);
    if (!queue.length || !waiters.length) return;
    const res = waiters.shift();
    const items = queue.splice(0);
    persist();
    res.on("close", () => { if (!res.writableFinished) { queue.unshift(...items); persist(); } });
    res.end(JSON.stringify({ items }));
  }

  /* ---- status pushed to the page ---- */
  const clients = new Set();
  const status = () => ({ version, ok, error, listening: listening(), queued: queue.length });
  let lastSent = "";
  function broadcast() {
    const msg = JSON.stringify(status());
    if (msg === lastSent) return;
    lastSent = msg;
    for (const c of clients) c.write(`data: ${msg}\n\n`);
  }
  fs.watchFile(file, { interval: 300 }, () => { refresh(); broadcast(); });
  setInterval(() => { for (const c of clients) c.write(": keep\n\n"); }, 25000).unref();

  const json = (res, code, v) => { res.writeHead(code, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(v)); };
  const API = {
    "GET /api/status": (req, res) => { refresh(); json(res, 200, status()); },
    "GET /api/events": (req, res) => {
      refresh();
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
      res.write(`retry: 1500\ndata: ${JSON.stringify(status())}\n\n`);
      clients.add(res);
      req.on("close", () => clients.delete(res));
    },
    "GET /api/state": (req, res) => json(res, 200, { state: readJSON(stateFile, null) }),
    "GET /api/next": (req, res) => {
      lastWaiter = Date.now();
      res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      waiters.push(res);
      const t = setTimeout(() => { waiters = waiters.filter((w) => w !== res); res.end(JSON.stringify({ items: [] })); }, POLL_MS);
      res.on("close", () => {
        clearTimeout(t);
        waiters = waiters.filter((w) => w !== res);
        lastWaiter = Date.now();
        setTimeout(broadcast, LISTEN_GRACE + 100);
      });
      broadcast();
      flush();
    },
    "POST /api/stop": (req, res) => { json(res, 200, { stopped: true }); setTimeout(() => process.exit(0), 50); },
    "POST /api/state": (req, res, body) => { writeJSON(stateFile, body); json(res, 200, { saved: true }); },
    "POST /api/send": (req, res, v) => {
      const str = (x, n) => (x == null ? null : String(x).slice(0, n));
      const id = str(v.id, 24);
      if (v.kind === "more") push({ kind: "more", id, module: str(v.module, 40) || "button", intent: ["like", "different", "what"].includes(v.intent) ? v.intent : "", pinned: Array.isArray(v.pinned) ? v.pinned.slice(0, 3).map((x) => str(x, 60)) : [], step: str(v.step, 60) || "", stepName: str(v.stepName, 120) || "", control: str(v.control, 60), controlName: str(v.controlName, 120), wish: str(v.wish, 400) || "", current: str(v.current, 200), existing: JSON.stringify(v.existing || []).length < 8000 ? v.existing : [] });
      else if (v.kind === "module") push({ kind: "module", id, module: String(v.module || "").replace(/[^a-z0-9-]/g, "").slice(0, 40) });
      else if (v.kind === "spec") push({ kind: "spec", text: str(v.text, 20000) || "" });
      else if (v.kind === "error") push({ kind: "error", message: str(v.message, 500) || "" });
      else return json(res, 400, { error: "kind" });
      json(res, 200, { queued: true, listening: listening() });
    },
  };

  function handle(req, res) {
    const port = server.address().port, host = String(req.headers.host || "");
    if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) return json(res, 403, { error: "host" });
    const url = new URL(req.url, `http://${host}`);
    if (url.pathname.startsWith("/api/")) {
      if (url.searchParams.get("k") !== key) return json(res, 403, { error: "key" });
      if (req.method === "POST" && req.headers.origin && req.headers.origin !== `http://${host}`) return json(res, 403, { error: "origin" });
      const route = API[`${req.method} ${url.pathname}`];
      if (!route) return json(res, req.method === "GET" || req.method === "POST" ? 404 : 405, {});
      if (req.method !== "POST" || url.pathname === "/api/stop") return route(req, res);
      let body = "", tooBig = false;
      req.on("data", (c) => {
        if (tooBig) return;
        body += c;
        if (body.length > 256e3) { tooBig = true; json(res, 413, {}); req.destroy(); }
      });
      req.on("end", () => {
        if (tooBig) return;
        let v;
        try { v = JSON.parse(body); } catch { return json(res, 400, { error: "json" }); }
        if (!v || typeof v !== "object") return json(res, 400, { error: "json" });
        route(req, res, v);
      });
      return;
    }
    // The page itself, and files beside it (fonts, images); never the .studio folder.
    refresh();
    let rel;
    try { rel = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html"; } catch { return json(res, 400, { error: "path" }); }
    if (rel === "index.html") { res.writeHead(200, { "content-type": TYPES[".html"], "cache-control": "no-store", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff" }); return res.end(page()); }
    // Only ordinary files inside the studio folder: no dot files or folders, nothing reached through a link.
    if (rel.split(/[\/]/).some((seg) => seg.startsWith(".") || seg === "")) return json(res, 404, {});
    const abs = path.resolve(dir, rel);
    let real = "";
    try { real = fs.realpathSync(abs); } catch { return json(res, 404, {}); }
    const root = fs.realpathSync(dir);
    if (!real.startsWith(root + path.sep) || !TYPES[path.extname(real).toLowerCase()] || !fs.statSync(real).isFile()) return json(res, 404, {});
    res.writeHead(200, { "content-type": TYPES[path.extname(real).toLowerCase()], "x-content-type-options": "nosniff" });
    fs.createReadStream(real).pipe(res);
  }

  const server = http.createServer((req, res) => {
    try { handle(req, res); } catch (e) {
      console.error(e);
      if (!res.headersSent) json(res, 500, { error: "server" }); else res.destroy();
    }
  });
  let retried = false;
  server.on("error", (e) => {
    if (e.code === "EADDRINUSE" && !retried) { retried = true; server.listen(0, "127.0.0.1"); return; }
    console.error(e.message);
    process.exit(1);
  });
  server.on("listening", () => {
    writeJSON(path.join(meta, "server.json"), { port: server.address().port, key, pid: process.pid });
    refresh();
  });
  server.listen(prev.port || preferredPort(dir), "127.0.0.1");
}
