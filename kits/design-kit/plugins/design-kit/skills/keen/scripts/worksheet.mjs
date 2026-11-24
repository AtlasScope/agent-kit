#!/usr/bin/env node
// Keen worksheet: one page per finished job, in a book the person keeps open while they work.
//
//   node worksheet.mjs <folder>                      show the book and wait for a start
//   node worksheet.mjs <folder> --static out.html    write a self-contained file instead
//
// <folder> holds page-1.json, page-2.json, ... (one per job, oldest first). Showing prints
// "URL: http://127.0.0.1:<port>/?k=<key>" and waits. The person picks one or more next steps and
// presses Start; the script prints one "CHOSEN: <command>" line per pick, in their order, and ends.
// With no start before the time limit it prints "NO_CHOICE" and exits 3.
//
// Run it again on the same folder after adding the next page: the address stays the same, the open
// page reconnects by itself and turns to the new page. Options: --port <n>, --minutes <n> (default 30).
//
// It needs only Node. It listens on this computer alone, accepts a start only with the key in the
// page's own address, and can only report commands that are written in the folder's page files.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const para = (v) => String(v ?? "").split(/\n{2,}/).filter((s) => s.trim()).map((s) => `<p>${esc(s.trim())}</p>`).join("");
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };
const INLINE_IMAGE = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/;

/** A step's choices, best first. A step with no `options` is its own single choice. */
export function optionsOf(step) {
  if (!step || typeof step !== "object") return [];
  const list = Array.isArray(step?.options) && step.options.length ? step.options : [step];
  return list.map((o) => ({ label: String(o.label ?? step.label ?? ""), why: String(o.why ?? ""), command: String(o.command ?? "") })).filter((o) => o.command);
}

/** The command a pick names, or undefined. A pick is ["s", stepIndex, optionIndex] or ["m", menuIndex]. */
export function commandFor(page, pick) {
  if (!Array.isArray(pick)) return undefined;
  const [kind, a, b = 0] = pick;
  if (!Number.isInteger(a) || !Number.isInteger(b)) return undefined;
  if (kind === "s") return optionsOf((page?.steps || [])[a])[b]?.command;
  if (kind === "m") return a >= 0 && (page?.menu || [])[a]?.command ? String(page.menu[a].command) : undefined;
  return undefined;
}

/** Every command a page offers, for the static file's copy buttons and for tests. */
export function commands(page) {
  return [...(page.steps || []).flatMap((s) => optionsOf(s).map((o) => o.command)), ...(page.menu || []).map((m) => String(m.command || "")).filter(Boolean)];
}

function image(src, baseDir) {
  const value = String(src ?? "");
  if (value.startsWith("data:")) {
    if (!INLINE_IMAGE.test(value)) throw new Error("Inline screenshot: use a base64 png, jpeg, webp or gif.");
    return value;
  }
  const file = path.resolve(baseDir, value);
  const type = MIME[path.extname(file).toLowerCase()];
  if (!type) throw new Error(`Screenshot ${value}: use a png, jpg, webp or gif file.`);
  return `data:${type};base64,${fs.readFileSync(file).toString("base64")}`;
}

function stepCard(step, index) {
  const options = optionsOf(step);
  if (!options.length) return "";
  const picker = options.length > 1
    ? `<label class="pick">Job <select data-step="${index}">${options.map((o, i) => `<option value="${i}">${esc(o.label)}${i === 0 ? " (suggested here)" : ""}</option>`).join("")}</select></label>`
    : "";
  return `<section class="step${step.suggested ? " suggested" : ""}" data-step-card="${index}">
  <h3>${esc(step.label)}${step.suggested ? ' <span class="tag">Suggested first</span>' : ""}</h3>
  ${para(step.why)}
  ${picker}
  <p class="why" data-why="${index}">${esc(options.length > 1 ? options[0].why : "")}</p>
  <p class="cmd" data-cmd="${index}">${esc(options[0].command)}</p>
  <div class="acts"><button type="button" class="add" data-add="${index}" aria-pressed="false">Add to my run</button><button type="button" data-copy-step="${index}">Copy</button></div>
</section>`;
}

/** One page of the book as an HTML fragment. */
export function renderPage(page, { baseDir = process.cwd() } = {}) {
  const r = page.report || {};
  const steps = (page.steps || []).map(stepCard).join("\n");
  const menu = (page.menu || []).filter((m) => m.command);
  const shots = (page.shots || []).map((s) => `<figure><div class="frame"><img src="${esc(image(s.src, baseDir))}" alt="${esc(s.alt || s.caption || "Screenshot")}">${(s.pins || []).map((p) => `<span class="pin" style="left:${Number(p.x) || 0}%;top:${Number(p.y) || 0}%">${esc(p.n)}</span>`).join("")}</div><figcaption>${esc(s.caption)}</figcaption></figure>`).join("\n");
  const problems = (page.problems || []).map((p) => `<li><h3>${esc(p.title)}</h3>${para(p.body)}</li>`).join("\n");
  const hasNext = steps || menu.length;
  return `<h1>${esc(page.title || "Keen")}</h1>
${page.subtitle ? `<p class="sub">${esc(page.subtitle)}</p>` : ""}
${page.verdict ? `<p class="verdict">${esc(page.verdict)}</p>` : ""}
<dl class="box">
<dt>What happened</dt><dd>${esc(r.happened)}</dd>
<dt>What it means</dt><dd>${esc(r.means)}</dd>
<dt>What you need to do</dt><dd>${esc(r.todo || (hasNext ? "Read on, then pick what to run next at the bottom of the screen." : "Nothing."))}</dd>
</dl>
${shots ? `<h2>What it looks like</h2><div class="shots">${shots}</div>` : ""}
${problems ? `<h2>What was found, most important first</h2><ol class="problems">${problems}</ol>` : ""}
${(page.also || []).length ? `<h2>Also found</h2><ul>${page.also.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>` : ""}
${(page.working || []).length ? `<h2>What is working</h2>${page.working.map((w) => `<p>${esc(w)}</p>`).join("")}` : ""}
${hasNext ? `<h2>What you can run next</h2>
<p class="sub">Add as many as you want, in the order you want them. Nothing starts until you press Start at the bottom.</p>
${steps}
${steps && (page.steps || []).length > 1 ? `<section class="step all"><h3>Or take them all</h3>${para(page.order || "They run in the order listed, with a report after each.")}<div class="acts"><button type="button" data-all>Add all, in this order</button></div></section>` : ""}
${menu.length ? `<section class="step other"><h3>Something else</h3><p>Every job Keen can run on this screen.</p><label class="pick">Job <select data-menu>${menu.map((m, i) => `<option value="${i}">${esc(m.label)}</option>`).join("")}</select></label><p class="why" data-menu-why>${esc(menu[0].why || "")}</p><p class="cmd" data-menu-cmd>${esc(menu[0].command)}</p><div class="acts"><button type="button" class="add" data-add-menu>Add to my run</button><button type="button" data-copy-menu>Copy</button></div></section>` : ""}` : ""}
${page.notChecked ? `<h2>Not checked</h2>${para(page.notChecked)}` : ""}
${page.details ? `<details><summary>Details for someone technical</summary><pre>${esc(page.details)}</pre></details>` : ""}`;
}

const STYLE = `:root{--bg:#f6f5f1;--ink:#16150f;--soft:#5b584e;--line:#d9d5c9;--card:#fff;--mark:#b3261e;--go:#1d4ed8;--on-go:#fff;--ok:#1a7f37}
@media (prefers-color-scheme:dark){:root{--bg:#131311;--ink:#f1efe8;--soft:#a9a598;--line:#33312b;--card:#1c1b18;--mark:#e5534b;--go:#8ab4ff;--on-go:#0b1220;--ok:#56d364}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:960px;margin:0 auto;padding:16px 16px 190px}
h1{font-size:26px;line-height:1.2;margin:20px 0 4px}h2{font-size:18px;margin:40px 0 12px}h3{font-size:16px;margin:0 0 4px}
p{margin:0 0 10px;max-width:68ch}.sub,figcaption,.why{color:var(--soft)}
nav.tabs{display:flex;gap:6px;flex-wrap:wrap;position:sticky;top:0;background:var(--bg);padding:10px 0;z-index:2;border-bottom:1px solid var(--line)}
nav.tabs[hidden]{display:none}
nav.tabs button{min-height:40px;padding:0 14px;font-weight:500}
nav.tabs button[aria-selected=true]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.page[hidden]{display:none}
.verdict{font-size:20px;line-height:1.4;border-left:3px solid var(--mark);padding-left:14px;margin:20px 0;max-width:60ch}
.box,.step,figure,ol.problems li{background:var(--card);border:1px solid var(--line);border-radius:10px}
.box{padding:16px 18px}.box dt{font-weight:600;margin-top:10px}.box dt:first-child{margin-top:0}.box dd{margin:2px 0 0;max-width:68ch}
.shots{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;align-items:start}
figure{margin:0;padding:10px}.frame{position:relative}.frame img{display:block;width:100%;height:auto;border-radius:6px}figcaption{font-size:14px;margin-top:8px}
.pin,ol.problems li::before{width:26px;height:26px;border-radius:50%;background:var(--mark);color:#fff;font:600 14px/26px system-ui,sans-serif;text-align:center}
.pin{position:absolute;margin:-13px 0 0 -13px;box-shadow:0 0 0 3px rgba(0,0,0,.45)}
ol.problems{padding:0;margin:0;list-style:none;counter-reset:p}
ol.problems li{counter-increment:p;padding:14px 16px 6px 54px;margin:0 0 12px;position:relative}
ol.problems li::before{content:counter(p);position:absolute;left:16px;top:14px}
.step{padding:14px 16px;margin:0 0 12px}.step.suggested{border:2px solid var(--go)}.step.all,.step.other{background:transparent;border-style:dashed}
.step.picked{border-color:var(--ok);box-shadow:inset 4px 0 0 var(--ok)}
.tag{font-size:12px;font-weight:600;color:var(--go);border:1px solid var(--go);border-radius:999px;padding:1px 9px;margin-left:6px;vertical-align:1px}
.pick{display:flex;align-items:center;gap:8px;font-weight:600;margin:6px 0}
select{font:inherit;min-height:44px;max-width:100%;padding:0 10px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink)}
.cmd{font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;color:var(--soft);overflow-wrap:anywhere}
.acts{display:flex;gap:8px;flex-wrap:wrap}
button{font:inherit;font-weight:600;min-height:44px;padding:0 18px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
button.add[aria-pressed=true]{border-color:var(--ok);color:var(--ok)}
button.go{background:var(--go);border-color:var(--go);color:var(--on-go)}
button:focus-visible,select:focus-visible{outline:3px solid var(--go);outline-offset:2px}
button[disabled]{opacity:.5;cursor:default}
#bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:12px 16px calc(12px + env(safe-area-inset-bottom));z-index:3}
#bar .in{max-width:960px;margin:0 auto;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
#bar ol{margin:0;padding-left:20px;flex:1 1 260px;min-width:0}#bar ol:empty{display:none}
#bar .hint{flex:1 1 260px;margin:0;color:var(--soft)}
#bar li button{min-height:32px;padding:0 8px;margin-left:8px;font-weight:500}
#status{margin:0 auto 8px;max-width:960px;font-weight:600}#status:empty{display:none}
body.static #bar .go{display:none}
.copynote{border:1px solid currentColor;border-radius:8px;padding:12px 14px;margin:0 0 20px;font-weight:600}
details{border-top:1px solid var(--line);margin-top:40px;padding-top:14px}summary{cursor:pointer;font-weight:600}
pre{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;color:var(--soft)}`;

// The page's own script. It reads everything it needs from DATA and never builds markup from text.
const CLIENT = `const tabs=document.getElementById("tabs"),book=document.getElementById("book"),queueEl=document.getElementById("queue"),hint=document.getElementById("hint"),startBtn=document.getElementById("start"),copyAll=document.getElementById("copyall"),clearBtn=document.getElementById("clear"),statusEl=document.getElementById("status");
let pages=DATA.pages,current=pages.length-1,queue=[],pending=null,running=DATA.running||[];
try{pending=JSON.parse(sessionStorage.getItem("keen-pending")||"null")}catch{}
const say=(t)=>{statusEl.textContent=t};
const optionOf=(p,pick)=>pick[0]==="s"?pages[p].steps[pick[1]][pick[2]||0]:pages[p].menu[pick[1]];
async function copy(text){try{await navigator.clipboard.writeText(text);return true}catch{}const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand("copy")}catch{}ta.remove();return ok}
function show(i){current=i;[...book.children].forEach((el,n)=>{el.hidden=n!==i});[...tabs.children].forEach((el,n)=>el.setAttribute("aria-selected",String(n===i)));queue=[];draw()}
function buildTabs(){tabs.textContent="";pages.forEach((p,i)=>{const b=document.createElement("button");b.type="button";b.setAttribute("role","tab");b.textContent=(i+1)+". "+p.tab;b.addEventListener("click",()=>{show(i);scrollTo(0,0)});tabs.appendChild(b)});tabs.hidden=pages.length<2}
function selected(step){const s=book.children[current].querySelector('select[data-step="'+step+'"]');return s?Number(s.value):0}
function draw(){
  queueEl.textContent="";
  queue.forEach((pick,n)=>{const li=document.createElement("li");li.textContent=optionOf(current,pick).label;const x=document.createElement("button");x.type="button";x.textContent="Remove";x.setAttribute("aria-label","Remove "+optionOf(current,pick).label);x.addEventListener("click",()=>{queue.splice(n,1);draw()});li.appendChild(x);queueEl.appendChild(li)});
  const page=book.children[current];
  page.querySelectorAll("[data-step-card]").forEach((card)=>{const i=Number(card.dataset.stepCard),on=queue.some((q)=>q[0]==="s"&&q[1]===i);card.classList.toggle("picked",on);const b=card.querySelector("[data-add]");b.setAttribute("aria-pressed",String(on));b.textContent=on?"Added. Remove":"Add to my run"});
  const n=queue.length,busy=running.length>0||!!pending;
  hint.hidden=n>0;
  hint.textContent=busy?"Working on: "+running.join(", then ")+". Keep reading. Anything you add now starts when that finishes.":"Nothing picked yet. Add a step above, then start it here.";
  startBtn.disabled=n===0;copyAll.disabled=n===0;clearBtn.hidden=n===0;
  startBtn.textContent=n<2?(busy?"Queue it":"Start"):(busy?"Queue these "+n:"Start these "+n+" in order");
}
function wire(page,p){
  page.querySelectorAll("select[data-step]").forEach((s)=>s.addEventListener("change",()=>{const i=Number(s.dataset.step),o=pages[p].steps[i][Number(s.value)];page.querySelector('[data-why="'+i+'"]').textContent=o.why;page.querySelector('[data-cmd="'+i+'"]').textContent=o.command;queue=queue.map((q)=>q[0]==="s"&&q[1]===i?["s",i,Number(s.value)]:q);draw()}));
  page.querySelectorAll("[data-add]").forEach((b)=>b.addEventListener("click",()=>{const i=Number(b.dataset.add),at=queue.findIndex((q)=>q[0]==="s"&&q[1]===i);if(at>=0)queue.splice(at,1);else queue.push(["s",i,selected(i)]);draw()}));
  page.querySelectorAll("[data-copy-step]").forEach((b)=>b.addEventListener("click",async()=>{const i=Number(b.dataset.copyStep);say(await copy(pages[p].steps[i][selected(i)].command)?"Copied. Paste it into your chat to start.":"Could not copy here. Select the command text and copy it by hand.")}));
  const all=page.querySelector("[data-all]");if(all)all.addEventListener("click",()=>{queue=pages[p].steps.map((_,i)=>["s",i,selected(i)]);draw();say("All added, in the order listed. Press Start when you are ready.")});
  const menu=page.querySelector("select[data-menu]");
  if(menu){const sync=()=>{const m=pages[p].menu[Number(menu.value)];page.querySelector("[data-menu-why]").textContent=m.why;page.querySelector("[data-menu-cmd]").textContent=m.command};menu.addEventListener("change",sync);
    page.querySelector("[data-add-menu]").addEventListener("click",()=>{queue.push(["m",Number(menu.value)]);draw()});
    page.querySelector("[data-copy-menu]").addEventListener("click",async()=>{say(await copy(pages[p].menu[Number(menu.value)].command)?"Copied. Paste it into your chat to start.":"Could not copy here.")})}
}
async function send(payload){const res=await fetch("/choose",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({k:TOKEN,...payload})});if(!res.ok)throw new Error(String(res.status));return res.json()}
async function start(){
  if(!queue.length)return;const payload={page:current,picks:queue.slice()},labels=queue.map((q)=>optionOf(current,q).label);
  if(!TOKEN){say(await copy(queue.map((q)=>optionOf(current,q).command).join("\\n"))?"Copied. Paste into your chat to start.":"Could not copy here.");return}
  try{await send(payload);running=labels;queue=[];say("Started: "+labels.join(", then ")+". Keep reading. This page will turn when the work is done.")}
  catch{if(pending){payload.picks=pending.payload.page===payload.page?[...pending.payload.picks,...payload.picks]:payload.picks;if(pending.payload.page===payload.page)labels.unshift(...pending.labels)}pending={payload,labels};try{sessionStorage.setItem("keen-pending",JSON.stringify(pending))}catch{}queue=[];say("Queued: "+labels.join(", then ")+". It starts as soon as your assistant finishes what it is doing.")}
  draw();
}
startBtn.addEventListener("click",start);
clearBtn.addEventListener("click",()=>{queue=[];draw()});
copyAll.addEventListener("click",async()=>{say(await copy(queue.map((q)=>optionOf(current,q).command).join("\\n"))?"Copied. Paste into your chat to start.":"Could not copy here.")});
async function poll(){
  if(!TOKEN)return;
  try{
    const s=await (await fetch("/state?k="+TOKEN,{cache:"no-store"})).json();
    if(s.count!==pages.length){const fresh=await (await fetch("/pages?k="+TOKEN,{cache:"no-store"})).json();pages=fresh.pages;book.innerHTML=fresh.html.map((h)=>'<section class="page">'+h+"</section>").join("");[...book.children].forEach(wire);buildTabs();running=s.running;show(pages.length-1);scrollTo(0,0);say("New page: "+pages[pages.length-1].tab+".")}
    else if(JSON.stringify(s.running)!==JSON.stringify(running)){running=s.running;draw()}
    if(pending&&!s.running.length){const p=pending;pending=null;try{sessionStorage.removeItem("keen-pending")}catch{}try{await send(p.payload);running=p.labels;say("Started what you queued: "+p.labels.join(", then ")+".");draw()}catch{pending=p}}
  }catch{}
}
[...book.children].forEach(wire);buildTabs();show(current);if(pending)say("Queued: "+pending.labels.join(", then ")+".");
if(TOKEN)setInterval(poll,2000);`;

const clientData = (pages) => pages.map((p, i) => ({ tab: String(p.tab || p.title || `Page ${i + 1}`), steps: (p.steps || []).map(optionsOf), menu: (p.menu || []).filter((m) => m.command).map((m) => ({ label: String(m.label ?? ""), why: String(m.why ?? ""), command: String(m.command) })) }));
const inScript = (value) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

/** The whole book as one self-contained HTML document. `live` is { token, running } when a server will take a start. */
export function render(pages, { baseDir = process.cwd(), live = null } = {}) {
  const list = Array.isArray(pages) ? pages : [pages];
  const html = list.map((p) => renderPage(p, { baseDir }));
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(list.at(-1)?.title || "Keen")}</title>
<style>${STYLE}</style>
<body${live ? "" : ' class="static"'}>
<main>
${live ? "" : '<p class="copynote" role="note">This is a read-only copy to keep or send. Nothing here can start work. To pick steps and start them, ask your agent to open the live page.</p>'}
<nav class="tabs" id="tabs" role="tablist" aria-label="Pages" hidden></nav>
<div id="book">${html.map((h) => `<section class="page">${h}</section>`).join("\n")}</div>
</main>
<div id="bar"><p id="status" role="status" aria-live="polite"></p><div class="in"><p class="hint" id="hint"></p><ol id="queue" aria-label="Your run, in order"></ol><button type="button" id="clear" hidden>Clear</button><button type="button" id="copyall">Copy</button><button type="button" class="go" id="start">Start</button></div></div>
<script>
const DATA = ${inScript({ pages: clientData(list), running: live?.running || [] })};
const TOKEN = ${inScript(live?.token || "")};
${CLIENT}
</script>
</body>
</html>
`;
}

/** The pages in a folder, oldest first: page-1.json, page-2.json, ... */
export function readBook(dir) {
  return fs.readdirSync(dir).map((name) => [name, /^page-(\d+)\.json$/.exec(name)]).filter(([, m]) => m).sort((a, b) => Number(a[1][1]) - Number(b[1][1])).map(([name]) => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")));
}

const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } };

/**
 * Show the book in `dir` on this computer and resolve with the commands the person starts, in order,
 * or null at the time limit. The address is kept in the folder so the open page survives a rerun.
 */
export function serve(dir, { port, minutes = 30, onReady = () => {} } = {}) {
  const sessionFile = path.join(dir, "session.json");
  const session = readJson(sessionFile, {});
  const token = /^[0-9a-f]{32}$/.test(session.token || "") ? session.token : crypto.randomBytes(16).toString("hex");
  const wanted = port ?? session.port ?? 0;
  let pages = readBook(dir);
  if (!pages.length) return Promise.reject(new Error(`No page-1.json in ${dir}.`));
  // Running again means the last job is finished: nothing is in flight until the next start.
  const state = { running: [] };
  const fragments = () => pages.map((p) => renderPage(p, { baseDir: dir }));
  return new Promise((resolve, reject) => {
    let timer, done = false;
    const finish = (value) => { if (done) return; done = true; clearTimeout(timer); server.close(); server.closeAllConnections?.(); resolve(value); };
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://127.0.0.1");
      const send = (code, body, type = "text/plain; charset=utf-8") => { res.writeHead(code, { "content-type": type, "cache-control": "no-store", "x-content-type-options": "nosniff" }); res.end(body); };
      const json = (code, value) => send(code, JSON.stringify(value), "application/json; charset=utf-8");
      const keyed = url.searchParams.get("k") === token;
      if (req.method === "GET" && url.pathname === "/") return keyed ? send(200, render(pages, { baseDir: dir, live: { token, running: state.running } }), "text/html; charset=utf-8") : send(403, "This link is missing its key. Open the full address your assistant gave you.");
      if (req.method === "GET" && url.pathname === "/state") return keyed ? json(200, { count: pages.length, running: state.running }) : send(403, "forbidden");
      if (req.method === "GET" && url.pathname === "/pages") return keyed ? json(200, { pages: clientData(pages), html: fragments() }) : send(403, "forbidden");
      if (req.method === "POST" && url.pathname === "/choose") {
        let body = "";
        req.on("data", (c) => { body += c; if (body.length > 4096) req.destroy(); });
        req.on("end", () => {
          let data; try { data = JSON.parse(body); } catch { return send(400, "bad request"); }
          if (data?.k !== token) return send(403, "forbidden");
          if (done || state.running.length) return send(409, "busy");
          if (!Number.isInteger(data.page) || !pages[data.page] || !Array.isArray(data.picks) || !data.picks.length || data.picks.length > 12) return send(400, "unknown choice");
          const chosen = data.picks.map((pick) => commandFor(pages[data.page], pick));
          if (chosen.some((c) => !c)) return send(400, "unknown choice");
          state.running = chosen;
          json(200, { started: chosen.length });
          setTimeout(() => finish(chosen), 50);
        });
        return;
      }
      send(404, "not found");
    });
    const listen = (p) => server.listen(p, "127.0.0.1");
    let retried = false;
    // The saved port can be taken by something else since the last run; fall back to any free one.
    server.on("error", (error) => { if (error.code === "EADDRINUSE" && !retried && !port) { retried = true; listen(0); } else reject(error); });
    server.on("listening", () => {
      const actual = server.address().port;
      fs.writeFileSync(sessionFile, JSON.stringify({ token, port: actual }, null, 2));
      timer = setTimeout(() => finish(null), minutes * 60_000);
      onReady(`http://127.0.0.1:${actual}/?k=${token}`);
    });
    listen(wanted);
  });
}

async function main(argv) {
  const args = argv.slice(2);
  const target = args[0];
  const opt = (name) => { const i = args.indexOf(`--${name}`); return i === -1 ? undefined : args[i + 1]; };
  if (!target || target.startsWith("--")) { console.error("Usage: node worksheet.mjs <folder with page-1.json> [--static out.html] [--port n] [--minutes n]"); process.exit(2); }
  const dir = path.resolve(target);
  const out = opt("static");
  if (out) { fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); fs.writeFileSync(out, render(readBook(dir), { baseDir: dir })); console.log(`WROTE: ${path.resolve(out)}`); console.log("NOTE: this is a read-only copy with no Start. Do not hand it over as the result. Run the same command without --static and open the URL it prints."); return; }
  const chosen = await serve(dir, { port: opt("port") ? Number(opt("port")) : undefined, minutes: Number(opt("minutes")) || 30, onReady: (url) => console.log(`URL: ${url}`) });
  if (chosen === null) { console.log("NO_CHOICE"); process.exit(3); }
  for (const command of chosen) console.log(`CHOSEN: ${command}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv).catch((error) => { console.error(`worksheet: ${error.message}`); process.exit(1); });
