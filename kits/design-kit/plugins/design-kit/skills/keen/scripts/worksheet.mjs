#!/usr/bin/env node
// The Keen page: one live page per piece of work, served from this computer, that the person keeps open
// beside the conversation. Each finished job adds a page to it. The person picks next steps and presses
// Start, and the agent hears about it. Nothing is written into the project.
//
//   node worksheet.mjs open <name>            start the page's server if it is not running; prints "URL: ..."
//   node worksheet.mjs add  <name> < page.json   add the next page (JSON on standard input); screenshots are copied in
//   node worksheet.mjs wait <name>            wait for a Start; prints one "CHOSEN: <command>" line per pick, in order
//   node worksheet.mjs say  <name> "text"     show one line of progress on the page while you work
//   node worksheet.mjs stop <name>            stop the server
//
// <name> is a short name for the piece of work ("kits-page"). Its pages are kept in this computer's cache
// folder, not in the project. A path to a folder works too.
//
// The server stays up between waits, so the page never goes dead: it shows whether the agent is listening,
// what it is working on, and anything started in the meantime, which is held and handed over at the next wait.
// "wait" prints NO_CHOICE and exits 3 if nobody presses Start within --minutes (default 30).
//
// It needs only Node. It listens on this computer alone, accepts a start only with the key in the page's own
// address, and can only report commands that are written in its own pages.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

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

/** Every command a page offers. */
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
  <h3>${esc(step.label)}${step.suggested ? ' <span class="tag">Suggested</span>' : ""}</h3>
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

// Keen's own look. Every value is set here, so the page is the same in every project and every browser tab:
// warm paper and near-black ink, one lime accent that only ever sits behind ink-coloured text, a red-orange
// for the numbered marks on screenshots, system fonts, and no pictures or web fonts to fetch.
const STYLE = `:root{color-scheme:light dark;--paper:oklch(0.975 0.006 95);--card:oklch(1 0 0);--ink:oklch(0.2 0.012 95);--soft:oklch(0.44 0.012 95);--line:oklch(0.87 0.008 95);--lime:oklch(0.87 0.2 128);--on-lime:oklch(0.2 0.03 128);--mark:oklch(0.56 0.21 30);--amber:oklch(0.75 0.16 75);--ring:oklch(0.2 0.012 95)}
@media (prefers-color-scheme:dark){:root{--paper:oklch(0.165 0.008 95);--card:oklch(0.21 0.008 95);--ink:oklch(0.95 0.006 95);--soft:oklch(0.72 0.01 95);--line:oklch(0.32 0.008 95);--mark:oklch(0.68 0.19 30);--ring:oklch(0.87 0.2 128)}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.top{position:sticky;top:0;z-index:4;background:var(--paper);border-bottom:1px solid var(--line)}
.top .in{max-width:960px;margin:0 auto;padding:10px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.brand{display:inline-flex;align-items:center;gap:9px;font-weight:800;font-size:18px;letter-spacing:-0.03em}
.brand i{width:13px;height:13px;background:var(--lime);transform:rotate(45deg) skew(12deg,12deg);border:1.5px solid var(--ink);display:inline-block}
.state{margin-left:auto;display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;border:1px solid var(--line);border-radius:999px;padding:5px 12px 5px 10px;background:var(--card);max-width:100%}
.state i{width:9px;height:9px;border-radius:50%;background:var(--soft);flex:none}
.state[data-is=listening] i{background:var(--lime);box-shadow:0 0 0 1.5px var(--ink)}
.state[data-is=working] i{background:var(--amber);box-shadow:0 0 0 1.5px var(--ink);animation:beat 1.2s ease-in-out infinite}
@keyframes beat{50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){.state i{animation:none!important}}
main{max-width:960px;margin:0 auto;padding:0 16px 210px}
h1{font-size:28px;line-height:1.15;letter-spacing:-0.025em;font-weight:750;margin:26px 0 6px}h2{font-size:18px;letter-spacing:-0.01em;margin:42px 0 12px}h3{font-size:16px;margin:0 0 4px}
p{margin:0 0 10px;max-width:68ch}.sub,figcaption,.why{color:var(--soft)}
ul{max-width:68ch;padding-left:20px}
nav.tabs{display:flex;gap:6px;flex-wrap:wrap;padding:12px 0 0}
nav.tabs[hidden]{display:none}
nav.tabs button{min-height:40px;padding:0 14px;font-weight:600;border-radius:999px}
nav.tabs button[aria-selected=true]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.page[hidden]{display:none}
.verdict{font-size:21px;line-height:1.38;font-weight:550;letter-spacing:-0.01em;border-left:5px solid var(--lime);padding-left:16px;margin:20px 0;max-width:58ch}
.box,.step,figure,ol.problems li{background:var(--card);border:1px solid var(--line);border-radius:12px}
.box{padding:16px 18px}.box dt{font-weight:700;margin-top:10px}.box dt:first-child{margin-top:0}.box dd{margin:2px 0 0;max-width:68ch}
.shots{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;align-items:start}
figure{margin:0;padding:10px}.frame{position:relative}.frame img{display:block;width:100%;height:auto;border-radius:6px}figcaption{font-size:14px;margin-top:8px}
.pin,ol.problems li::before{width:26px;height:26px;border-radius:50%;background:var(--mark);color:#fff;font:700 14px/26px system-ui,sans-serif;text-align:center}
.pin{position:absolute;margin:-13px 0 0 -13px;box-shadow:0 0 0 3px rgba(0,0,0,.45)}
ol.problems{padding:0;margin:0;list-style:none;counter-reset:p}
ol.problems li{counter-increment:p;padding:14px 16px 6px 54px;margin:0 0 12px;position:relative}
ol.problems li::before{content:counter(p);position:absolute;left:16px;top:14px}
.step{padding:14px 16px;margin:0 0 12px}.step.suggested{border:2px solid var(--ink)}.step.all,.step.other{background:transparent;border-style:dashed}
.step.picked{box-shadow:inset 6px 0 0 var(--lime)}
.tag{font-size:12px;font-weight:700;background:var(--lime);color:var(--on-lime);border-radius:999px;padding:2px 10px;margin-left:6px;vertical-align:1px}
.pick{display:flex;align-items:center;gap:8px;font-weight:600;margin:6px 0}
select{font:inherit;min-height:44px;max-width:100%;padding:0 10px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink)}
.cmd{font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;color:var(--soft);overflow-wrap:anywhere}
.acts{display:flex;gap:8px;flex-wrap:wrap}
button{font:inherit;font-weight:650;min-height:44px;padding:0 18px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
button.add[aria-pressed=true]{border-color:var(--ink)}
button.go{background:var(--lime);border-color:var(--ink);color:var(--on-lime);font-weight:750;padding:0 26px}
button:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid var(--ring);outline-offset:2px}
button[disabled]{opacity:.45;cursor:default}
#bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:2px solid var(--ink);padding:12px 16px calc(12px + env(safe-area-inset-bottom));z-index:3}
#bar .in{max-width:960px;margin:0 auto;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
#bar ol{margin:0;padding-left:20px;flex:1 1 260px;min-width:0}#bar ol:empty{display:none}
#bar .hint{flex:1 1 260px;margin:0;color:var(--soft)}
#bar li button{min-height:32px;padding:0 8px;margin-left:8px;font-weight:500}
#status,#held{margin:0 auto 8px;max-width:960px;font-weight:650}#status:empty,#held:empty{display:none}
#held{font-weight:500;color:var(--soft)}
details{border-top:1px solid var(--line);margin-top:40px;padding-top:14px}summary{cursor:pointer;font-weight:650}
pre{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;color:var(--soft)}`;

// The page's own script. It reads everything it needs from DATA and never builds markup from text.
const CLIENT = `const tabs=document.getElementById("tabs"),book=document.getElementById("book"),queueEl=document.getElementById("queue"),hint=document.getElementById("hint"),startBtn=document.getElementById("start"),copyAll=document.getElementById("copyall"),clearBtn=document.getElementById("clear"),statusEl=document.getElementById("status"),heldEl=document.getElementById("held"),stateEl=document.getElementById("state"),stateText=document.getElementById("statetext");
let pages=DATA.pages,current=pages.length-1,queue=[],live=DATA.live||{working:[],held:[],listening:false,progress:""},lost=false;
const say=(t)=>{statusEl.textContent=t};
const optionOf=(p,pick)=>pick[0]==="s"?pages[p].steps[pick[1]][pick[2]||0]:pages[p].menu[pick[1]];
async function copy(text){try{await navigator.clipboard.writeText(text);return true}catch{}const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand("copy")}catch{}ta.remove();return ok}
function show(i){current=i;[...book.children].forEach((el,n)=>{el.hidden=n!==i});[...tabs.children].forEach((el,n)=>el.setAttribute("aria-selected",String(n===i)));queue=[];draw()}
function buildTabs(){tabs.textContent="";pages.forEach((p,i)=>{const b=document.createElement("button");b.type="button";b.setAttribute("role","tab");b.textContent=(i+1)+". "+p.tab;b.addEventListener("click",()=>{show(i);scrollTo(0,0)});tabs.appendChild(b)});tabs.hidden=pages.length<2}
function selected(step){const s=book.children[current].querySelector('select[data-step="'+step+'"]');return s?Number(s.value):0}
function drawState(){
  const working=live.working.length>0;
  const is=!TOKEN||lost?"off":working?"working":live.listening?"listening":"off";
  stateEl.dataset.is=is;
  stateText.textContent=!TOKEN?"Not connected":lost?"This page lost its connection":working?"Working: "+live.working[0]+(live.working.length>1?" (+"+(live.working.length-1)+" after)":""):live.listening?"Your agent is listening":"Your agent is not listening";
  heldEl.textContent=(live.progress?live.progress+" ":"")+(live.held.length?"Waiting its turn: "+live.held.join(", then ")+".":"");
}
function draw(){
  queueEl.textContent="";
  queue.forEach((pick,n)=>{const li=document.createElement("li");li.textContent=optionOf(current,pick).label;const x=document.createElement("button");x.type="button";x.textContent="Remove";x.setAttribute("aria-label","Remove "+optionOf(current,pick).label);x.addEventListener("click",()=>{queue.splice(n,1);draw()});li.appendChild(x);queueEl.appendChild(li)});
  const page=book.children[current];
  page.querySelectorAll("[data-step-card]").forEach((card)=>{const i=Number(card.dataset.stepCard),on=queue.some((q)=>q[0]==="s"&&q[1]===i);card.classList.toggle("picked",on);const b=card.querySelector("[data-add]");b.setAttribute("aria-pressed",String(on));b.textContent=on?"Added. Remove":"Add to my run"});
  const n=queue.length,working=live.working.length>0,direct=live.listening&&!working;
  hint.hidden=n>0;
  hint.textContent=working?"Add more if you want. It waits its turn.":direct?"Pick a step above, then press Start.":"Pick a step above. Start keeps it for your agent.";
  startBtn.disabled=n===0||!TOKEN;copyAll.disabled=n===0;clearBtn.hidden=n===0;
  startBtn.textContent=n<2?(direct?"Start":"Start next"):(direct?"Start these "+n+" in order":"Start these "+n+" next");
  drawState();
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
async function start(){
  if(!queue.length||!TOKEN)return;const labels=queue.map((q)=>optionOf(current,q).label);
  try{
    const res=await fetch("/choose",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({k:TOKEN,page:current,picks:queue})});
    if(!res.ok)throw new Error(String(res.status));
    const out=await res.json();live=out.live;queue=[];
    say(out.delivered?"Started: "+labels.join(", then ")+". Keep reading. This page turns when the work is done.":live.working.length?"Got it: "+labels.join(", then ")+". It starts when the current work is done.":"Kept: "+labels.join(", then ")+". Your agent is not listening right now. Say \\"continue\\" in the chat and it will pick this up.");
  }catch{say("That did not go through. This page may have lost its connection. Ask your agent to open it again.")}
  draw();
}
startBtn.addEventListener("click",start);
clearBtn.addEventListener("click",()=>{queue=[];draw()});
copyAll.addEventListener("click",async()=>{say(await copy(queue.map((q)=>optionOf(current,q).command).join("\\n"))?"Copied. Paste into your chat to start.":"Could not copy here.")});
let misses=0;
async function poll(){
  if(!TOKEN)return;
  try{
    const s=await (await fetch("/state?k="+TOKEN,{cache:"no-store"})).json();misses=0;lost=false;
    const turned=s.count!==pages.length;
    if(turned){const fresh=await (await fetch("/pages?k="+TOKEN,{cache:"no-store"})).json();pages=fresh.pages;book.innerHTML=fresh.html.map((h)=>'<section class="page">'+h+"</section>").join("");[...book.children].forEach(wire);buildTabs();live=s.live;show(pages.length-1);scrollTo(0,0);say("New page: "+pages[pages.length-1].tab+".")}
    else if(JSON.stringify(s.live)!==JSON.stringify(live)){live=s.live;draw()}
  }catch{misses+=1;if(misses>2&&!lost){lost=true;draw()}}
}
[...book.children].forEach(wire);buildTabs();show(current);
if(TOKEN){poll();setInterval(poll,1500)}`;

const clientData = (pages) => pages.map((p, i) => ({ tab: String(p.tab || p.title || `Page ${i + 1}`), steps: (p.steps || []).map(optionsOf), menu: (p.menu || []).filter((m) => m.command).map((m) => ({ label: String(m.label ?? ""), why: String(m.why ?? ""), command: String(m.command) })) }));
const inScript = (value) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
const NO_LIVE = { working: [], held: [], listening: false, progress: "" };

/** The whole page as one HTML document. `live` is { token, state } when a server is behind it. */
export function render(pages, { baseDir = process.cwd(), live = null } = {}) {
  const list = Array.isArray(pages) ? pages : [pages];
  const html = list.map((p) => renderPage(p, { baseDir }));
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(list.at(-1)?.title || "Keen")}</title>
<style>${STYLE}</style>
<body>
<header class="top"><div class="in"><span class="brand"><i aria-hidden="true"></i>Keen</span><span class="state" id="state" role="status" aria-live="polite"><i aria-hidden="true"></i><span id="statetext"></span></span></div></header>
<main>
<nav class="tabs" id="tabs" role="tablist" aria-label="Pages" hidden></nav>
<div id="book">${html.map((h) => `<section class="page">${h}</section>`).join("\n")}</div>
</main>
<div id="bar"><p id="status" role="status" aria-live="polite"></p><p id="held"></p><div class="in"><p class="hint" id="hint"></p><ol id="queue" aria-label="Your run, in order"></ol><button type="button" id="clear" hidden>Clear</button><button type="button" id="copyall">Copy</button><button type="button" class="go" id="start">Start</button></div></div>
<script>
const DATA = ${inScript({ pages: clientData(list), live: live?.state || NO_LIVE })};
const TOKEN = ${inScript(live?.token || "")};
${CLIENT}
</script>
</body>
</html>
`;
}

/** The pages in a folder, oldest first: page-1.json, page-2.json, ... */
export function readBook(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).map((name) => [name, /^page-(\d+)\.json$/.exec(name)]).filter(([, m]) => m).sort((a, b) => Number(a[1][1]) - Number(b[1][1])).map(([name]) => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")));
}

const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } };
const slug = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "work";

/**
 * Where a piece of work's pages are kept. A short name maps to this computer's cache folder, keyed by the
 * project, so nothing lands in the project itself. A path to a folder is used as it is.
 */
export function bookDir(name, { cwd = process.cwd(), env = process.env } = {}) {
  const value = String(name ?? "");
  if (!value) throw new Error("Give the piece of work a short name, such as kits-page.");
  if (path.isAbsolute(value) || value.startsWith(".") || value.includes("/") || value.includes(path.sep)) return path.resolve(cwd, value);
  let project = cwd;
  try { project = path.dirname(execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()); } catch { /* not a git project: key on the folder */ }
  const home = env.KEEN_HOME || path.join(env.XDG_CACHE_HOME || env.LOCALAPPDATA || path.join(os.homedir(), ".cache"), "keen");
  return path.join(home, `${slug(path.basename(project))}-${crypto.createHash("sha256").update(project).digest("hex").slice(0, 8)}`, slug(value));
}

/** Add the next page to a book. Screenshots named by path are copied in, so the originals can be thrown away. */
export function addPage(dir, page, { baseDir = process.cwd() } = {}) {
  if (!page || typeof page !== "object" || !String(page.title || "").trim()) throw new Error("A page needs at least a title.");
  const stored = { ...page, shots: (page.shots || []).map((s) => ({ ...s, src: image(s.src, baseDir) })) };
  renderPage(stored); // fail now, with a clear message, on anything the page cannot show
  fs.mkdirSync(dir, { recursive: true });
  const n = readBook(dir).length + 1;
  fs.writeFileSync(path.join(dir, `page-${n}.json`), JSON.stringify(stored));
  return n;
}

const SLICE_MS = 240_000; // a wait is answered at least this often, so no connection sits idle long enough to be cut
const IDLE_MS = 12 * 60 * 60_000;

/**
 * Serve a book on this computer until stopped. Resolves once it is listening, with { url, port, token, close }.
 * It keeps three things the page shows: whether an agent is waiting, what it is working on, and what was
 * started in the meantime and is waiting its turn.
 */
export function serve(dir, { port, idleMs = IDLE_MS, sliceMs = SLICE_MS } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const serverFile = path.join(dir, "server.json");
  const saved = readJson(serverFile, {});
  const token = /^[0-9a-f]{32}$/.test(saved.token || "") ? saved.token : crypto.randomBytes(16).toString("hex");
  // The address is kept after the server stops, so a page left open finds it again when it restarts.
  const state = { working: [], held: [], progress: "" };
  const waiters = new Set();
  let cache = { stamp: "", pages: [] };
  const pages = () => {
    const stamp = fs.readdirSync(dir).filter((n) => /^page-\d+\.json$/.test(n)).join(",");
    if (stamp !== cache.stamp) cache = { stamp, pages: readBook(dir) };
    return cache.pages;
  };
  const live = () => ({ working: state.working.map((w) => w.label), held: state.held.map((h) => h.label), listening: waiters.size > 0, progress: state.progress });
  const handOver = () => {
    if (!state.held.length || !waiters.size || state.working.length) return false;
    const [waiter] = waiters;
    waiters.delete(waiter);
    state.working = state.held.splice(0);
    state.progress = "";
    waiter({ chosen: state.working.map((w) => w.command) });
    return true;
  };
  return new Promise((resolve, reject) => {
    let idle;
    const close = () => { clearTimeout(idle); for (const w of waiters) w({ stopped: true }); waiters.clear(); server.close(); server.closeAllConnections?.(); };
    const touch = () => { clearTimeout(idle); idle = setTimeout(close, idleMs); idle.unref?.(); };
    const server = http.createServer((req, res) => {
      touch();
      const url = new URL(req.url, "http://127.0.0.1");
      const send = (code, body, type = "text/plain; charset=utf-8") => { res.writeHead(code, { "content-type": type, "cache-control": "no-store", "x-content-type-options": "nosniff" }); res.end(body); };
      const json = (code, value) => send(code, JSON.stringify(value), "application/json; charset=utf-8");
      const keyed = url.searchParams.get("k") === token;
      const body = (then) => { let text = ""; req.on("data", (c) => { text += c; if (text.length > 8192) req.destroy(); }); req.on("end", () => { let data; try { data = JSON.parse(text); } catch { return send(400, "bad request"); } if (data?.k !== token) return send(403, "forbidden"); then(data); }); };
      if (req.method === "GET" && url.pathname === "/health") return json(200, { keen: true });
      if (req.method === "GET" && url.pathname === "/") return keyed ? send(200, render(pages(), { baseDir: dir, live: { token, state: live() } }), "text/html; charset=utf-8") : send(403, "This link is missing its key. Open the full address your agent gave you.");
      if (req.method === "GET" && url.pathname === "/state") return keyed ? json(200, { count: pages().length, live: live() }) : send(403, "forbidden");
      if (req.method === "GET" && url.pathname === "/pages") return keyed ? json(200, { pages: clientData(pages()), html: pages().map((p) => renderPage(p, { baseDir: dir })) }) : send(403, "forbidden");
      // The agent's side. Asking to wait means the agent has finished whatever it was doing.
      if (req.method === "GET" && url.pathname === "/wait") {
        if (!keyed) return send(403, "forbidden");
        state.working = [];
        state.progress = "";
        const timer = setTimeout(() => { waiters.delete(answer); json(200, { again: true }); }, sliceMs);
        const answer = (value) => { clearTimeout(timer); json(200, value); };
        waiters.add(answer);
        req.on("close", () => { clearTimeout(timer); waiters.delete(answer); });
        handOver();
        return;
      }
      if (req.method === "POST" && url.pathname === "/choose") return body((data) => {
        const book = pages();
        if (!Number.isInteger(data.page) || !book[data.page] || !Array.isArray(data.picks) || !data.picks.length || data.picks.length > 12) return send(400, "unknown choice");
        const items = data.picks.map((pick) => { const command = commandFor(book[data.page], pick); if (!command) return null; const [kind, a, b = 0] = pick; const label = kind === "s" ? optionsOf(book[data.page].steps[a])[b].label : String(book[data.page].menu[a].label ?? command); return { command, label: label || command }; });
        if (items.some((i) => !i) || state.held.length + items.length > 24) return send(400, "unknown choice");
        state.held.push(...items);
        const delivered = handOver();
        json(200, { delivered, live: live() });
      });
      if (req.method === "POST" && url.pathname === "/say") return body((data) => { state.progress = String(data.text ?? "").slice(0, 200); json(200, { ok: true }); });
      // A page was added: the job at the front of the line is finished.
      if (req.method === "POST" && url.pathname === "/turned") return body(() => { state.working.shift(); state.progress = ""; json(200, { ok: true }); });
      if (req.method === "POST" && url.pathname === "/stop") return body(() => { json(200, { ok: true }); setTimeout(close, 20); });
      send(404, "not found");
    });
    let retried = false;
    // The saved port can be taken by something else since the last run; fall back to any free one.
    server.on("error", (error) => { if (error.code === "EADDRINUSE" && !retried && !port) { retried = true; server.listen(0, "127.0.0.1"); } else reject(error); });
    server.on("listening", () => {
      const actual = server.address().port;
      fs.writeFileSync(serverFile, JSON.stringify({ pid: process.pid, port: actual, token }));
      touch();
      resolve({ url: `http://127.0.0.1:${actual}/?k=${token}`, port: actual, token, close });
    });
    server.listen(port ?? saved.port ?? 0, "127.0.0.1");
  });
}

const origin = (info) => `http://127.0.0.1:${info.port}`;
async function running(dir) {
  const info = readJson(path.join(dir, "server.json"), null);
  if (!info?.port || !info?.token) return null;
  try { const res = await fetch(`${origin(info)}/health`, { signal: AbortSignal.timeout(1500) }); return (await res.json()).keen ? info : null; } catch { return null; }
}
const post = (info, route, data = {}) => fetch(`${origin(info)}${route}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ k: info.token, ...data }) });

/** Make sure a book's server is running, in its own process so it outlives this command. Resolves with its address. */
export async function open(dir) {
  let info = await running(dir);
  if (!info) {
    fs.mkdirSync(dir, { recursive: true });
    spawn(process.execPath, [fileURLToPath(import.meta.url), "serve", dir], { detached: true, stdio: "ignore" }).unref();
    for (let i = 0; i < 50 && !info; i += 1) { await new Promise((r) => setTimeout(r, 100)); info = await running(dir); }
    if (!info) throw new Error("The page's server did not start. If this tool runs commands in a sandbox, it may not be allowed to listen on this computer.");
  }
  return `${origin(info)}/?k=${info.token}`;
}

/** Wait for the person to press Start. Resolves with the commands in their order, or null at the time limit. */
export async function wait(dir, { minutes = 30 } = {}) {
  const until = Date.now() + minutes * 60_000;
  while (Date.now() < until) {
    const info = await running(dir);
    if (!info) throw new Error("The page is not open. Run: open <name>");
    let out;
    try { out = await (await fetch(`${origin(info)}/wait?k=${info.token}`, { signal: AbortSignal.timeout(Math.max(1000, Math.min(SLICE_MS + 15_000, until - Date.now()))) })).json(); } catch { continue; }
    if (out.chosen) return out.chosen;
    if (out.stopped) return null;
  }
  return null;
}

const readStdin = () => new Promise((resolve, reject) => { let text = ""; process.stdin.setEncoding("utf8"); process.stdin.on("data", (c) => { text += c; }); process.stdin.on("end", () => resolve(text)); process.stdin.on("error", reject); });

async function main(argv) {
  const [verb, name, ...rest] = argv.slice(2);
  const opt = (flag) => { const i = rest.indexOf(`--${flag}`); return i === -1 ? undefined : rest[i + 1]; };
  const usage = "Usage: node worksheet.mjs open|add|wait|say|stop <name>   (add reads a page's JSON on standard input)";
  if (!verb || !name) { console.error(usage); process.exit(2); }
  const dir = bookDir(name);
  if (verb === "serve") { await serve(dir, { port: opt("port") ? Number(opt("port")) : undefined }); return; }
  if (verb === "open") { console.log(`URL: ${await open(dir)}`); return; }
  if (verb === "add") {
    const from = opt("from");
    const page = JSON.parse(from ? fs.readFileSync(from, "utf8") : await readStdin());
    const n = addPage(dir, page, { baseDir: from ? path.dirname(path.resolve(from)) : process.cwd() });
    const info = await running(dir);
    if (info) await post(info, "/turned");
    console.log(`PAGE: ${n}`);
    console.log(`URL: ${await open(dir)}`);
    return;
  }
  if (verb === "wait") {
    const chosen = await wait(dir, { minutes: Number(opt("minutes")) || 30 });
    if (chosen === null) { console.log("NO_CHOICE"); process.exit(3); }
    for (const command of chosen) console.log(`CHOSEN: ${command}`);
    return;
  }
  if (verb === "say") { const info = await running(dir); if (info) await post(info, "/say", { text: rest.filter((r) => !r.startsWith("--")).join(" ") }); return; }
  if (verb === "stop") { const info = await running(dir); if (info) await post(info, "/stop"); console.log("STOPPED"); return; }
  console.error(usage); process.exit(2);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv).catch((error) => { console.error(`keen page: ${error.message}`); process.exit(1); });
