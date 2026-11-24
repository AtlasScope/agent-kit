#!/usr/bin/env node
// Keen worksheet: turns a job's report into one page a person can read and act on.
//
//   node worksheet.mjs report.json                 serve it and wait for a press
//   node worksheet.mjs report.json --static out.html   write a self-contained file instead
//
// Serving prints "URL: http://127.0.0.1:<port>/?k=<token>" and waits. When the person presses a
// next step, it prints "CHOSEN: <command>" and exits 0. With no press before the time limit it
// prints "NO_CHOICE" and exits 3. Options: --port <n>, --minutes <n> (default 30).
//
// It needs only Node. It listens on this computer alone, accepts a press only with the token in
// the page's own address, and will only ever report a command that was in report.json.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const para = (v) => String(v ?? "").split(/\n{2,}/).filter((s) => s.trim()).map((s) => `<p>${esc(s.trim())}</p>`).join("");
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };

/** Every command a press may report: each next step, then the run-in-order bundle if there is one. */
export function commands(report) {
  const list = (report.steps || []).map((s) => String(s.command || "")).filter(Boolean);
  if (report.bundle?.command) list.push(String(report.bundle.command));
  return list;
}

function image(src, baseDir) {
  if (/^data:image\//.test(src)) return src;
  const file = path.resolve(baseDir, src);
  const type = MIME[path.extname(file).toLowerCase()];
  if (!type) throw new Error(`Screenshot ${src}: use a png, jpg, webp or gif file.`);
  return `data:${type};base64,${fs.readFileSync(file).toString("base64")}`;
}

function stepCard(step, index, extraClass = "") {
  return `<section class="step ${extraClass}${step.suggested ? " suggested" : ""}">
  <h3>${esc(step.label)}${step.suggested ? ' <span class="tag">Suggested</span>' : ""}</h3>
  ${para(step.why)}
  <p class="cmd">${esc(step.command)}</p>
  <div class="acts"><button type="button" class="run" data-run="${index}">Run this</button><button type="button" data-copy="${index}">Copy</button></div>
</section>`;
}

/** The whole page as one self-contained HTML string. `live` is { token } when a server will take presses. */
export function render(report, { baseDir = process.cwd(), live = null } = {}) {
  const steps = report.steps || [];
  const all = commands(report);
  const shots = (report.shots || []).map((s) => `<figure><div class="frame"><img src="${image(s.src, baseDir)}" alt="${esc(s.alt || s.caption || "Screenshot")}">${(s.pins || []).map((p) => `<span class="pin" style="left:${Number(p.x) || 0}%;top:${Number(p.y) || 0}%">${esc(p.n)}</span>`).join("")}</div><figcaption>${esc(s.caption)}</figcaption></figure>`).join("\n");
  const problems = (report.problems || []).map((p) => `<li><h3>${esc(p.title)}</h3>${para(p.body)}</li>`).join("\n");
  const cards = steps.map((s, i) => stepCard(s, i)).join("\n");
  const bundle = report.bundle?.command ? stepCard({ ...report.bundle, suggested: false }, steps.length, "bundle") : "";
  const r = report.report || {};
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(report.title || "Keen")}</title>
<style>
:root{--bg:#f6f5f1;--ink:#16150f;--soft:#5b584e;--line:#d9d5c9;--card:#fff;--mark:#b3261e;--go:#1d4ed8;--on-go:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#131311;--ink:#f1efe8;--soft:#a9a598;--line:#33312b;--card:#1c1b18;--mark:#e5534b;--go:#8ab4ff;--on-go:#0b1220}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:960px;margin:0 auto;padding:32px 16px 72px}
h1{font-size:26px;line-height:1.2;margin:0 0 4px}
h2{font-size:18px;margin:40px 0 12px}
h3{font-size:16px;margin:0 0 4px}
p{margin:0 0 10px;max-width:68ch}
.sub,figcaption{color:var(--soft)}
.verdict{font-size:20px;line-height:1.4;border-left:3px solid var(--mark);padding-left:14px;margin:20px 0;max-width:60ch}
.box,.step,figure,ol.problems li{background:var(--card);border:1px solid var(--line);border-radius:10px}
.box{padding:16px 18px}
.box dt{font-weight:600;margin-top:10px}.box dt:first-child{margin-top:0}
.box dd{margin:2px 0 0;max-width:68ch}
.shots{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;align-items:start}
figure{margin:0;padding:10px}
.frame{position:relative}
.frame img{display:block;width:100%;height:auto;border-radius:6px}
figcaption{font-size:14px;margin-top:8px}
.pin,ol.problems li::before{width:26px;height:26px;border-radius:50%;background:var(--mark);color:#fff;font:600 14px/26px system-ui,sans-serif;text-align:center}
.pin{position:absolute;margin:-13px 0 0 -13px;box-shadow:0 0 0 3px rgba(0,0,0,.45)}
ol.problems{padding:0;margin:0;list-style:none;counter-reset:p}
ol.problems li{counter-increment:p;padding:14px 16px 6px 54px;margin:0 0 12px;position:relative}
ol.problems li::before{content:counter(p);position:absolute;left:16px;top:14px}
.step{padding:14px 16px;margin:0 0 12px}
.step.suggested{border:2px solid var(--go)}
.step.bundle{background:transparent;border-style:dashed}
.tag{font-size:12px;font-weight:600;color:var(--go);border:1px solid var(--go);border-radius:999px;padding:1px 9px;margin-left:6px;vertical-align:1px}
.cmd{font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;color:var(--soft);overflow-wrap:anywhere}
.acts{display:flex;gap:8px;flex-wrap:wrap}
button{font:inherit;font-weight:600;min-height:44px;padding:0 18px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
button.run{background:var(--go);border-color:var(--go);color:var(--on-go)}
button:focus-visible{outline:3px solid var(--go);outline-offset:2px}
button[disabled]{opacity:.55;cursor:default}
body:not(.live) button.run{display:none}
#status{min-height:26px;margin:12px 0 0;font-weight:600}
details{border-top:1px solid var(--line);margin-top:40px;padding-top:14px}
summary{cursor:pointer;font-weight:600}
pre{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;color:var(--soft)}
</style>
<body${live ? ' class="live"' : ""}>
<main>
<h1>${esc(report.title || "Keen")}</h1>
${report.subtitle ? `<p class="sub">${esc(report.subtitle)}</p>` : ""}
${report.verdict ? `<p class="verdict">${esc(report.verdict)}</p>` : ""}
<dl class="box">
<dt>What happened</dt><dd>${esc(r.happened)}</dd>
<dt>What it means</dt><dd>${esc(r.means)}</dd>
<dt>What you need to do</dt><dd>${esc(r.todo || (all.length ? "Pick a next step below." : "Nothing."))}</dd>
</dl>
${all.length ? `<h2>Pick a next step</h2>
${cards}
${bundle}
<p id="status" role="status" aria-live="polite"></p>` : ""}
${shots ? `<h2>What it looks like</h2><div class="shots">${shots}</div>` : ""}
${problems ? `<h2>What was found, most important first</h2><ol class="problems">${problems}</ol>` : ""}
${(report.working || []).length ? `<h2>What is working</h2>${report.working.map((w) => `<p>${esc(w)}</p>`).join("")}` : ""}
${report.notChecked ? `<h2>Not checked</h2>${para(report.notChecked)}` : ""}
${report.details ? `<details><summary>Details for someone technical</summary><pre>${esc(report.details)}</pre></details>` : ""}
</main>
<script>
const COMMANDS = ${JSON.stringify(all).replace(/</g, "\\u003c")};
const TOKEN = ${JSON.stringify(live?.token || "")};
const status = document.getElementById("status");
const say = (t) => { if (status) status.textContent = t; };
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {}
  const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand("copy"); } catch {} ta.remove(); return ok;
}
document.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
  say((await copy(COMMANDS[Number(b.dataset.copy)])) ? "Copied. Paste it into your chat to start." : "Could not copy here. Select the command text and copy it by hand.");
}));
document.querySelectorAll("[data-run]").forEach((b) => b.addEventListener("click", async () => {
  const index = Number(b.dataset.run);
  document.querySelectorAll("button").forEach((x) => (x.disabled = true));
  try {
    const res = await fetch("/choose", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ k: TOKEN, index }) });
    if (!res.ok) throw new Error(String(res.status));
    say("Sent. Your assistant is starting it now. You can go back to the chat.");
  } catch {
    document.querySelectorAll("button").forEach((x) => (x.disabled = false));
    document.body.classList.remove("live");
    say((await copy(COMMANDS[index])) ? "This page is no longer connected, so the command was copied instead. Paste it into your chat." : "This page is no longer connected. Copy the command text and paste it into your chat.");
  }
}));
</script>
</body>
</html>
`;
}

/** Serve the page on this computer and resolve with the command the person presses, or null at the time limit. */
export function serve(report, { baseDir = process.cwd(), port = 0, minutes = 30, onReady = () => {} } = {}) {
  const token = crypto.randomBytes(16).toString("hex");
  const all = commands(report);
  const html = render(report, { baseDir, live: { token } });
  return new Promise((resolve, reject) => {
    let timer;
    const finish = (value) => { clearTimeout(timer); server.close(); server.closeAllConnections?.(); resolve(value); };
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://127.0.0.1");
      const send = (code, body, type = "text/plain; charset=utf-8") => { res.writeHead(code, { "content-type": type, "cache-control": "no-store", "x-content-type-options": "nosniff" }); res.end(body); };
      if (req.method === "GET" && url.pathname === "/") return url.searchParams.get("k") === token ? send(200, html, "text/html; charset=utf-8") : send(403, "This link is missing its key. Open the full address your assistant gave you.");
      if (req.method === "POST" && url.pathname === "/choose") {
        let body = "";
        req.on("data", (c) => { body += c; if (body.length > 2048) req.destroy(); });
        req.on("end", () => {
          let data; try { data = JSON.parse(body); } catch { return send(400, "bad request"); }
          if (data?.k !== token) return send(403, "forbidden");
          const command = Number.isInteger(data.index) ? all[data.index] : undefined;
          if (!command) return send(400, "unknown choice");
          send(200, "ok");
          setTimeout(() => finish(command), 50);
        });
        return;
      }
      send(404, "not found");
    });
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => {
      timer = setTimeout(() => finish(null), minutes * 60_000);
      onReady(`http://127.0.0.1:${server.address().port}/?k=${token}`);
    });
  });
}

async function main(argv) {
  const args = argv.slice(2);
  const file = args[0];
  const opt = (name) => { const i = args.indexOf(`--${name}`); return i === -1 ? undefined : args[i + 1]; };
  if (!file || file.startsWith("--")) { console.error("Usage: node worksheet.mjs report.json [--static out.html] [--port n] [--minutes n]"); process.exit(2); }
  const report = JSON.parse(fs.readFileSync(file, "utf8"));
  const baseDir = path.dirname(path.resolve(file));
  const out = opt("static");
  if (out) { fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); fs.writeFileSync(out, render(report, { baseDir })); console.log(`WROTE: ${path.resolve(out)}`); return; }
  const chosen = await serve(report, { baseDir, port: Number(opt("port")) || 0, minutes: Number(opt("minutes")) || 30, onReady: (url) => console.log(`URL: ${url}`) });
  if (chosen === null) { console.log("NO_CHOICE"); process.exit(3); }
  console.log(`CHOSEN: ${chosen}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv).catch((error) => { console.error(`worksheet: ${error.message}`); process.exit(1); });
