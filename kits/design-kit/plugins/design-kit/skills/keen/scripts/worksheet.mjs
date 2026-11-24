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
    ? `<label class="pick">How <select data-step="${index}">${options.map((o, i) => `<option value="${i}">${esc(o.label)}</option>`).join("")}</select></label>`
    : "";
  return `<section class="step${step.suggested ? " suggested" : ""}" data-step-card="${index}">
  <h3>${esc(step.label)}${step.suggested ? ' <span class="tag">Start here</span>' : ""}</h3>
  ${para(step.why)}
  ${picker}
  <p class="why" data-why="${index}">${esc(options.length > 1 ? options[0].why : "")}</p>
  <p class="cmd" data-cmd="${index}">${esc(options[0].command)}</p>
  <div class="acts"><button type="button" class="add" data-add="${index}" aria-pressed="false">Add</button><button type="button" data-copy-step="${index}">Copy command</button></div>
</section>`;
}

// The most words each part of a page may hold. A page is glanced at on a small laptop beside a conversation,
// so the program refuses a long one and says which parts to cut: the writer shortens it, not the reader.
export const LIMITS = { verdict: 16, todo: 12, subtitle: 14, statLabel: 6, problemTitle: 9, problemBody: 45, line: 16, stepLabel: 8, why: 18, order: 20, happened: 30, means: 30, notChecked: 40, termMeans: 25, change: 20 };
export const COUNTS = { stats: 3, problems: 3, also: 5, working: 3, steps: 3, terms: 3, changes: 5 };
const words = (v) => String(v ?? "").trim().split(/\s+/).filter(Boolean).length;

/** Every part of a page that is too long, as plain sentences. Empty when the page is short enough. */
export function tooLong(page) {
  const out = [];
  const check = (name, value, max) => { const n = words(value); if (n > max) out.push(`${name} is ${n} words; ${max} at most.`); };
  const count = (name, list, max) => { if (Array.isArray(list) && list.length > max) out.push(`${name} has ${list.length} items; ${max} at most. Keep the ones that matter most.`); };
  const r = page.report || {};
  check("verdict", page.verdict, LIMITS.verdict);
  check("report.todo", r.todo, LIMITS.todo);
  check("subtitle", page.subtitle, LIMITS.subtitle);
  check("report.happened", r.happened, LIMITS.happened);
  check("report.means", r.means, LIMITS.means);
  check("order", page.order, LIMITS.order);
  check("notChecked", page.notChecked, LIMITS.notChecked);
  for (const [key, max] of Object.entries(COUNTS)) count(key, page[key], max);
  (page.stats || []).forEach((s, i) => check(`stats[${i}].label`, s?.label, LIMITS.statLabel));
  (page.problems || []).forEach((p, i) => { check(`problems[${i}].title`, p?.title, LIMITS.problemTitle); check(`problems[${i}].body`, p?.body, LIMITS.problemBody); });
  (page.also || []).forEach((w, i) => check(`also[${i}]`, w, LIMITS.line));
  (page.working || []).forEach((w, i) => check(`working[${i}]`, w, LIMITS.line));
  (page.changes || []).forEach((c, i) => { check(`changes[${i}].before`, c?.before, LIMITS.change); check(`changes[${i}].after`, c?.after, LIMITS.change); });
  (page.terms || []).forEach((t, i) => check(`terms[${i}].means`, t?.means, LIMITS.termMeans));
  (page.steps || []).forEach((s, i) => {
    check(`steps[${i}].label`, s?.label, LIMITS.stepLabel);
    check(`steps[${i}].why`, s?.why, LIMITS.why);
    (s?.options || []).forEach((o, j) => { check(`steps[${i}].options[${j}].label`, o?.label, LIMITS.stepLabel); check(`steps[${i}].options[${j}].why`, o?.why, LIMITS.why); });
  });
  (page.menu || []).forEach((m, i) => check(`menu[${i}].why`, m?.why, LIMITS.why));
  return out;
}

// One line that opens when pressed. Everything past the headline, the picture and the next steps is one of these,
// so the page shows its point and the reader chooses what to read.
const row = (title, inner, { n = "", open = false, quiet = false } = {}) => `<details class="row${quiet ? " quiet" : ""}"${open ? " open" : ""}><summary>${n ? `<span class="num">${esc(n)}</span>` : ""}<span>${esc(title)}</span></summary><div class="body">${inner}</div></details>`;
const list = (items, cls = "") => `<ul${cls ? ` class="${cls}"` : ""}>${items.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>`;

/** One page as an HTML fragment. */
export function renderPage(page, { baseDir = process.cwd() } = {}) {
  const r = page.report || {};
  const steps = (page.steps || []).map(stepCard).join("\n");
  const menu = (page.menu || []).filter((m) => m.command);
  const figure = (s) => `<figure><div class="frame"><img src="${esc(image(s.src, baseDir))}" alt="${esc(s.alt || s.caption || "Screenshot")}">${(s.pins || []).map((p) => `<span class="pin" style="left:${Number(p.x) || 0}%;top:${Number(p.y) || 0}%">${esc(p.n)}</span>`).join("")}</div><figcaption>${esc(s.caption)}</figcaption></figure>`;
  const shots = (page.shots || []).map(figure).join("\n");
  const problems = (page.problems || []).map((p, i) => row(p.title, para(p.body), { n: i + 1, open: i === 0 })).join("\n");
  const hasNext = steps || menu.length;
  const todo = r.todo || (hasNext ? "Pick what to run next." : "Nothing.");
  const chips = (page.stats || []).slice(0, COUNTS.stats).map((s) => `<span class="chip"><b>${esc(s.value)}</b> ${esc(s.label)}</span>`).join("");
  const also = page.also || [], working = page.working || [], terms = (page.terms || []).filter((t) => t?.term && t?.means);
  const changes = (page.changes || []).filter((c) => c?.after).map((c) => `<li>${c.where ? `<span class="where">${esc(c.where)}</span>` : ""}${c.before ? `<s>${esc(c.before)}</s>` : ""}<b>${esc(c.after)}</b></li>`).join("");
  const story = [r.happened, r.means].filter((v) => String(v ?? "").trim());
  const more = [
    story.length ? row("What happened", story.map((v) => `<p>${esc(v)}</p>`).join(""), { quiet: true }) : "",
    also.length ? row(`Also found (${also.length})`, list(also), { quiet: true }) : "",
    working.length ? row(`Working well (${working.length})`, list(working, "ticks"), { quiet: true }) : "",
    terms.length ? row("Words used here", `<dl>${terms.map((t) => `<dt>${esc(t.term)}</dt><dd>${esc(t.means)}</dd>`).join("")}</dl>`, { quiet: true }) : "",
    page.notChecked ? row("Not checked", para(page.notChecked), { quiet: true }) : "",
    page.details ? row("Details", `<pre>${esc(page.details)}</pre>`, { quiet: true }) : "",
  ].filter(Boolean).join("\n");
  return `<header class="hero">
<p class="eyebrow">${esc(page.title || page.tab || "Report")}</p>
<h1>${esc(page.verdict || page.title || "Report")}</h1>
<p class="next"><b>Your move</b> ${esc(todo)}</p>
${chips ? `<p class="chips">${chips}</p>` : ""}
${page.subtitle ? `<p class="sub">${esc(page.subtitle)}</p>` : ""}
</header>
<div class="split${shots ? " has-shots" : ""}"><div class="main">
${problems ? `<section class="sec"><p class="label">Found</p><div class="rows">${problems}</div></section>` : ""}
${changes ? `<section class="sec"><p class="label">Changed</p><ul class="changes">${changes}</ul></section>` : ""}
${hasNext ? `<section class="sec"><p class="label">Next</p>
<div class="steps">${steps}
${menu.length ? `<section class="step other"><h3>Something else</h3><label class="pick">Job <select data-menu>${menu.map((m, i) => `<option value="${i}">${esc(m.label)}</option>`).join("")}</select></label><p class="why" data-menu-why>${esc(menu[0].why || "")}</p><p class="cmd" data-menu-cmd>${esc(menu[0].command)}</p><div class="acts"><button type="button" class="add" data-add-menu>Add</button><button type="button" data-copy-menu>Copy command</button></div></section>` : ""}</div>
${steps && (page.steps || []).length > 1 ? `<p class="allrow"><button type="button" data-all>Add all ${(page.steps || []).length}, in this order</button>${page.order ? `<span>${esc(page.order)}</span>` : ""}</p>` : ""}</section>` : ""}
</div>
${shots ? `<aside class="look" aria-label="What it looks like"><div class="gallery">${shots}</div></aside>` : ""}
</div>
${more ? `<section class="sec"><p class="label">More</p><div class="rows">${more}</div></section>` : ""}`;
}

// The AtlasScope page. One shell for every area of the kit: the header says AtlasScope, and a small tag names the
// tool that made the page (Keen by default; a page can set `area`). Every value is set here, so the page is the same in every project and every browser tab:
// black, white type set tight and large, hairlines for structure, one green that marks what is live and what
// to press, system fonts, and nothing fetched from anywhere. It is always dark, like a product page, not a document.
const STYLE = `:root{color-scheme:dark;--bg:#000;--card:#0a0a0a;--card2:#111;--ink:#f5f5f5;--soft:#a1a1a1;--dim:#6f6f6f;--line:rgba(255,255,255,.1);--line2:rgba(255,255,255,.18);--green:oklch(0.86 0.21 150);--on-green:#03130a;--mark:oklch(0.68 0.2 28);--amber:oklch(0.8 0.15 80);--sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",sans-serif;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;background:var(--bg)}
body{margin:0;background:radial-gradient(1200px 420px at 50% -120px,rgba(0,220,130,.13),transparent 70%) no-repeat,var(--bg);color:var(--ink);font:16px/1.6 var(--sans);-webkit-font-smoothing:antialiased}
.top{position:sticky;top:0;z-index:4;background:rgba(0,0,0,.72);-webkit-backdrop-filter:saturate(1.4) blur(14px);backdrop-filter:saturate(1.4) blur(14px);border-bottom:1px solid var(--line)}
.top .in{max-width:1120px;margin:0 auto;padding:0 20px;min-height:56px;display:flex;align-items:center;gap:14px}
.brand{display:inline-flex;align-items:center;gap:10px;font-weight:650;font-size:17px;letter-spacing:-0.02em}
.brand svg{display:block;width:17px;height:24px;flex:none}
.tool{font:500 12px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--on-green);background:var(--green);border-radius:999px;padding:5px 9px;flex:none}
nav.tabs{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;flex:1 1 auto;min-width:0;margin:0 4px}
nav.tabs::-webkit-scrollbar{display:none}
nav.tabs[hidden]{display:none}
nav.tabs button{min-height:36px;padding:0 12px;font-weight:500;font-size:14px;border:0;background:transparent;color:var(--soft);border-radius:8px;white-space:nowrap}
nav.tabs button[aria-selected=true]{background:rgba(255,255,255,.1);color:var(--ink)}
.state{margin-left:auto;flex:none;display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:500;color:var(--soft);border:1px solid var(--line);border-radius:999px;padding:6px 12px 6px 10px;max-width:46vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.state i{width:8px;height:8px;border-radius:50%;background:var(--dim);flex:none}
.state[data-is=listening]{color:var(--ink)}.state[data-is=listening] i{background:var(--green);box-shadow:0 0 10px rgba(0,220,130,.8)}
.state[data-is=working]{color:var(--ink)}.state[data-is=working] i{background:var(--amber);animation:beat 1.2s ease-in-out infinite}
@keyframes beat{50%{opacity:.3}}
@media (prefers-reduced-motion:reduce){.state i{animation:none!important}}
main{max-width:1120px;margin:0 auto;padding:0 20px 200px}
.page[hidden]{display:none}
.hero{padding:28px 0 24px;max-width:860px}
.eyebrow,.label{font:500 12px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--green);margin:0 0 12px}
.next{margin:0 0 12px;padding:10px 14px;border:1px solid rgba(0,220,130,.4);border-radius:10px;background:rgba(0,220,130,.06);font-size:15px;max-width:none}.next b{font:500 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--green);margin-right:10px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px;max-width:none}.chip{font-size:13px;color:var(--soft);border:1px solid var(--line);border-radius:999px;padding:4px 10px}.chip b{color:var(--ink);font-weight:600}
.label{color:var(--dim);margin-bottom:16px}
h1{font-size:clamp(22px,2.6vw,34px);line-height:1.18;letter-spacing:-0.03em;font-weight:600;margin:0 0 16px;background:linear-gradient(180deg,#fff 30%,#9c9c9c);-webkit-background-clip:text;background-clip:text;color:transparent;text-wrap:balance}
.verdict{font-size:clamp(18px,2vw,23px);line-height:1.42;letter-spacing:-0.015em;color:var(--ink);margin:0 0 14px;max-width:44ch;text-wrap:pretty}
h2{font-size:15px;font-weight:600;letter-spacing:-0.005em;margin:0 0 8px}h3{font-size:17px;font-weight:600;letter-spacing:-0.015em;margin:0 0 6px}
p{margin:0 0 10px;max-width:66ch}.sub,figcaption,.why{color:var(--soft)}.sub{font-size:15px}
ul{margin:0;padding-left:18px;max-width:60ch;color:var(--soft)}li{margin:0 0 6px}
.ticks{list-style:none;padding:0}.ticks li{padding-left:22px;position:relative}.ticks li::before{content:"";position:absolute;left:2px;top:.5em;width:9px;height:5px;border-left:2px solid var(--green);border-bottom:2px solid var(--green);transform:rotate(-45deg)}
.sec{margin-top:40px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--card);margin-bottom:24px}
.stat{padding:22px 20px;box-shadow:1px 0 0 var(--line),0 1px 0 var(--line)}.stat b{display:block;font-size:clamp(30px,4vw,44px);line-height:1;font-weight:600;letter-spacing:-0.04em}.stat span{display:block;margin-top:10px;font-size:13.5px;color:var(--soft);line-height:1.35}
.gallery{display:flex;gap:16px;overflow-x:auto;padding:28px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(180deg,#0d0d0d,#050505);scroll-snap-type:x proximity;align-items:flex-start}
.split .main>.sec:first-child{margin-top:8px}
.look{margin-top:32px}
@media (min-width:900px){.split.has-shots{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,38%);gap:28px;align-items:start}.look{margin-top:8px;position:sticky;top:72px}.split.has-shots .gallery{padding:16px;max-height:calc(100vh - 190px);overflow-y:auto}.split.has-shots .steps{grid-template-columns:1fr}}
figure{margin:0;flex:0 0 auto;width:min(300px,72vw);scroll-snap-align:start}
.gallery figure:only-child{width:min(560px,100%);margin:0 auto}
.frame{position:relative;border-radius:12px;overflow:hidden;border:1px solid var(--line2);box-shadow:0 30px 60px -20px rgba(0,0,0,.9)}
.frame img{display:block;width:100%;height:auto}figcaption{font-size:13.5px;line-height:1.4;margin-top:12px}
.pin,ol.problems li::before{width:26px;height:26px;border-radius:50%;background:var(--mark);color:#fff;font:600 13px/26px var(--sans);text-align:center}
.pin{position:absolute;margin:-13px 0 0 -13px;box-shadow:0 0 0 3px rgba(0,0,0,.6)}
.trio{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-top:24px}
.card{background:var(--card);padding:22px}.card h2{color:var(--dim);font:500 12px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px}.card p{margin:0;font-size:15.5px;line-height:1.55}
.card.key h2{color:var(--green)}
ol.problems{padding:0;margin:0;list-style:none;counter-reset:p;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;max-width:none}
ol.problems li{counter-increment:p;margin:0;padding:22px 22px 14px;position:relative;background:var(--card);border:1px solid var(--line);border-radius:14px}
ol.problems li::before{content:counter(p);display:block;margin-bottom:14px}
ol.problems p{color:var(--soft);font-size:15px}
.more{margin:2px 0 8px}.more summary,.tech summary{cursor:pointer;color:var(--ink);font-size:14px;font-weight:500;list-style:none;display:inline-flex;align-items:center;gap:6px;min-height:32px}
.more summary::after,.tech summary::after{content:"";width:6px;height:6px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg) translateY(-2px);opacity:.7}
.more[open] summary::after,.tech[open] summary::after{transform:rotate(225deg) translateY(-2px)}
.more summary::-webkit-details-marker,.tech summary::-webkit-details-marker{display:none}
.pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:40px}.pair h2{margin-bottom:12px}
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;margin-top:20px}
.step{padding:22px;margin:0;background:var(--card);border:1px solid var(--line);border-radius:14px;display:flex;flex-direction:column}
.step p{font-size:15px;color:var(--soft)}
.step .acts{margin-top:auto;padding-top:12px}
.step.suggested{border-color:rgba(0,220,130,.55);background:linear-gradient(180deg,rgba(0,220,130,.07),transparent 60%),var(--card)}
.step.other{background:transparent;border-style:dashed}
.step.picked{border-color:var(--green);box-shadow:inset 0 0 0 1px var(--green)}
.tag{display:inline-block;font:500 11px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;background:var(--green);color:var(--on-green);border-radius:999px;padding:4px 9px;margin-left:8px;vertical-align:2px}
.pick{display:flex;align-items:center;gap:10px;font-weight:500;font-size:14px;color:var(--soft);margin:8px 0}
select{font:inherit;font-size:15px;min-height:44px;max-width:100%;flex:1 1 auto;min-width:0;padding:0 12px;border-radius:10px;border:1px solid var(--line2);background:var(--card2);color:var(--ink)}
.cmd{display:none}
.acts{display:flex;gap:8px;flex-wrap:wrap}
button{font:inherit;font-size:14.5px;font-weight:500;min-height:44px;padding:0 16px;border-radius:10px;border:1px solid var(--line2);background:var(--card2);color:var(--ink);cursor:pointer;transition:background .15s,border-color .15s}
button:hover{background:#1a1a1a;border-color:rgba(255,255,255,.3)}
button.add{background:#fff;color:#000;border-color:#fff}button.add:hover{background:#dcdcdc}
button.add[aria-pressed=true]{background:transparent;color:var(--green);border-color:var(--green)}
button.go{background:var(--green);border-color:var(--green);color:var(--on-green);font-weight:650;padding:0 26px;box-shadow:0 0 28px rgba(0,220,130,.35)}
button.go:hover{background:oklch(0.9 0.2 150);border-color:oklch(0.9 0.2 150)}
button:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid var(--green);outline-offset:2px}
button[disabled]{opacity:.4;cursor:default;box-shadow:none}
#bar{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(880px,calc(100% - 24px));background:rgba(14,14,14,.86);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);border:1px solid var(--line2);border-radius:18px;padding:12px 12px 12px 18px;z-index:3;box-shadow:0 24px 60px -12px rgba(0,0,0,.95)}
#bar .in{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
#bar ol{margin:0;padding-left:20px;flex:1 1 240px;min-width:0;font-size:14.5px;color:var(--ink)}#bar ol:empty{display:none}
#bar .hint{flex:1 1 200px;margin:0;color:var(--soft);font-size:14.5px}
#bar li button{min-height:28px;padding:0 8px;margin-left:8px;font-size:12.5px}
#status,#held{margin:0 0 8px;font-size:14px;font-weight:500;max-width:none}#status:empty,#held:empty{display:none}
#held{color:var(--soft)}
.rows{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--card)}
.row+.row{border-top:1px solid var(--line)}
.row summary{display:flex;align-items:center;gap:12px;min-height:56px;padding:10px 18px;cursor:pointer;font-weight:600;font-size:16px;letter-spacing:-0.01em;list-style:none}
.row summary::-webkit-details-marker{display:none}
.row summary::after{content:"";margin-left:auto;flex:none;width:7px;height:7px;border-right:1.5px solid var(--soft);border-bottom:1.5px solid var(--soft);transform:rotate(45deg)}
.row[open] summary::after{transform:rotate(225deg)}
.row summary:hover{background:rgba(255,255,255,.03)}
.row .body{padding:0 18px 14px;color:var(--soft);font-size:15px}.row .body p:last-child{margin-bottom:0}
.row:has(.num) .body{padding-left:56px}
.row.quiet summary{font-weight:500;font-size:15px;color:var(--soft);min-height:48px}
.num{flex:none;width:26px;height:26px;border-radius:50%;background:var(--mark);color:#fff;font:600 13px/26px var(--sans);text-align:center}
.changes{list-style:none;padding:0;max-width:none;border:1px solid var(--line);border-radius:14px;background:var(--card)}.changes li{margin:0;padding:12px 18px;display:grid;gap:2px}.changes li+li{border-top:1px solid var(--line)}.changes s{color:var(--dim);font-size:14.5px}.changes b{color:var(--ink);font-weight:500}.where{font:500 11px/1.4 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--dim)}
dl{margin:0}dt{color:var(--ink);font-weight:600}dd{margin:0 0 10px}
.allrow{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:14px 0 0;max-width:none;color:var(--soft);font-size:14px}
pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12.5px/1.6 var(--mono);color:var(--soft);background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin:12px 0 0}
@media (max-width:820px){.trio{grid-template-columns:1fr}.hero{padding:20px 0 18px}.sec{margin-top:32px}.gallery{padding:16px;border-radius:14px}main{padding-bottom:230px}}
@media (max-width:560px){.top .in{flex-wrap:wrap;padding:8px 16px;gap:8px}nav.tabs{order:3;flex-basis:100%;margin:0 -4px}main{padding-left:16px;padding-right:16px}.state{max-width:60vw}#bar{padding:10px 10px 10px 14px}#copyall[disabled]{display:none}}`;

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
  page.querySelectorAll("[data-step-card]").forEach((card)=>{const i=Number(card.dataset.stepCard),on=queue.some((q)=>q[0]==="s"&&q[1]===i);card.classList.toggle("picked",on);const b=card.querySelector("[data-add]");b.setAttribute("aria-pressed",String(on));b.textContent=on?"Added. Remove":"Add"});
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
<header class="top"><div class="in"><span class="brand"><svg viewBox="0 0 23 32" fill="currentColor" aria-hidden="true"><path d="M9.66 4L13.34 4L21.72 22.63A21.2 21.2 0 0 0 16.42 20.58L11.5 9.66L6.59 20.58A21.2 21.2 0 0 0 1.28 22.63ZM0 25.83A19.2 19.2 0 0 1 23 25.83L20.61 29.03A15.2 15.2 0 0 0 2.4 29.03Z"/></svg>AtlasScope</span><span class="tool">${esc(list.at(-1)?.area || "Keen")}</span><nav class="tabs" id="tabs" role="tablist" aria-label="Pages" hidden></nav><span class="state" id="state" role="status" aria-live="polite"><i aria-hidden="true"></i><span id="statetext"></span></span></div></header>
<main>
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
  const long = tooLong(page);
  if (long.length) throw new Error(`This page has too many words. Shorten these and add it again:\n- ${long.join("\n- ")}`);
  renderPage(stored); // fail now, with a clear message, on anything the page cannot show
  fs.mkdirSync(dir, { recursive: true });
  const book = readBook(dir);
  if (book.length && JSON.stringify(book.at(-1)) === JSON.stringify(stored)) return book.length; // the same page sent twice is one page
  const n = book.length + 1;
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
