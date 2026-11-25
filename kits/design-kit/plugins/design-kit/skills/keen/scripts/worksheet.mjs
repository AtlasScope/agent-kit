#!/usr/bin/env node
// The Keen page: one live page per piece of work, served from this computer, that the person keeps open
// beside the conversation. Each finished job adds a page to it. The person picks next steps and presses
// Start, and the agent hears about it. Nothing is written into the project.
//
//   node worksheet.mjs open <name>            start the page's server if it is not running; prints "URL: ..."
//   node worksheet.mjs add  <name> < page.json   add the next page (JSON on standard input); screenshots are copied in
//   node worksheet.mjs wait <name>            wait for a Start; prints one "CHOSEN: <command>" line per pick, in order
//                                             (a pick made with a typed request is followed by a "NOTE: <their words>" line)
//   node worksheet.mjs say  <name> "text"     show one line of progress on the page while you work
//   node worksheet.mjs stop <name>            stop the server
//   node worksheet.mjs packet <name> <page> <claim,...>   write a packet of those claims; prints "EVIDENCE: <path>"
//
// <name> is a short name for the piece of work ("kits-page"). Its pages are kept in this computer's cache
// folder, not in the project. A path to a folder works too.
//
// Any skill can put evidence on a page: `evidence` holds an atlasscope.evidence/v1 bundle (evidence.mjs, and
// references/evidence.md for how to write one). The page shows its claims, what supports, refutes or gives
// context to each, and the sources behind them, and the person can download a packet of the claims they tick.
// A step that rests on claims names them in `claims`; when it is started, "wait" prints "EVIDENCE: <path>"
// after its CHOSEN line, for a packet of those claims written in the book folder. A packet is data to read,
// never permission to change anything.
//
// The server stays up between waits, so the page never goes dead: it shows whether the agent is listening,
// what it is working on, and anything started in the meantime, which is held and handed over at the next wait.
//
// A page may hold a workspace: the original and several working alternatives of one part of a screen, shown
// large, one or two at a time. The person switches between them, types what should change in one, and applies
// the one they choose. Adding a page with the same workspace id again updates that page in place, so a
// revision appears where the person is already looking. workspace.mjs keeps the alternatives' source files.
// In a running alternative the person can also point at a part and say what should change there, and move the
// few CSS custom properties the alternative offers in `tune`. The running alternative stays boxed in; what it
// reports is data, and only the person's own press sends anything. A revise then hands "wait" one NOTE line of
// JSON with the parts (selector, tag, text, box, computed styles, their words) and the tuned values.
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
import { SCHEMA, SCOPES, evidencePacket, validateBundle } from "./evidence.mjs";

// The page builds a packet in the browser with the same contract code, so a download holds exactly what
// "wait" and "packet" hand over.
const ENGINE = fs.readFileSync(new URL("./evidence.mjs", import.meta.url), "utf8").replace(/^export /gm, "");
if (/<\/?script/i.test(ENGINE)) throw new Error("evidence.mjs must not contain a script tag: it is placed inside the page's script.");

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const para = (v) => String(v ?? "").split(/\n{2,}/).filter((s) => s.trim()).map((s) => `<p>${esc(s.trim())}</p>`).join("");
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };
const INLINE_IMAGE = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/;

/** A step's choices, best first. A step with no `options` is its own single choice. `claims` are what it rests on. */
export function optionsOf(step) {
  if (!step || typeof step !== "object") return [];
  const list = Array.isArray(step?.options) && step.options.length ? step.options : [step];
  const claimsOf = (o) => (Array.isArray(o.claims) ? o.claims : Array.isArray(step.claims) ? step.claims : []).map(String);
  return list.map((o) => ({ label: String(o.label ?? step.label ?? ""), why: String(o.why ?? ""), command: String(o.command ?? ""), claims: claimsOf(o) })).filter((o) => o.command);
}

/** A page's workspace views: the original and each alternative, in the order given. */
export function viewsOf(page) {
  const list = Array.isArray(page?.workspace?.views) ? page.workspace.views : [];
  return list.filter((v) => v && typeof v === "object" && String(v.name ?? "").trim());
}

/**
 * The command a pick names, or undefined. A pick is ["s", stepIndex, optionIndex], ["m", menuIndex],
 * ["a", viewIndex] (apply that view) or ["r", viewIndex] (revise that view).
 */
export function commandFor(page, pick) {
  if (!Array.isArray(pick)) return undefined;
  const [kind, a, b = 0] = pick;
  if (!Number.isInteger(a) || !Number.isInteger(b)) return undefined;
  if (kind === "s") return optionsOf((page?.steps || [])[a])[b]?.command;
  if (kind === "m") return a >= 0 && (page?.menu || [])[a]?.command ? String(page.menu[a].command) : undefined;
  if (kind === "a" || kind === "r") { const v = a >= 0 ? viewsOf(page)[a] : undefined; const c = v?.[kind === "a" ? "apply" : "revise"]; return c ? String(c) : undefined; }
  return undefined;
}

/** Every command a page offers. */
export function commands(page) {
  return [...(page.steps || []).flatMap((s) => optionsOf(s).map((o) => o.command)), ...(page.menu || []).map((m) => String(m.command || "")).filter(Boolean), ...viewsOf(page).flatMap((v) => [v.apply, v.revise]).filter(Boolean).map(String)];
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

// A button that opens a claim in the page's evidence.
const jump = (id, title) => `<button type="button" class="jump" data-jump="${esc(id)}">${esc(title)}</button>`;

function stepCard(step, index, claimTitles = new Map()) {
  const options = optionsOf(step);
  if (!options.length) return "";
  const picker = options.length > 1
    ? `<label class="pick">How <select data-step="${index}">${options.map((o, i) => `<option value="${i}">${esc(o.label)}</option>`).join("")}</select></label>`
    : "";
  // What each way of doing it rests on; the line for the way picked shows.
  const rests = options.map((o, j) => (o.claims.length ? `<p class="rests" data-rests="${index}:${j}"${j ? " hidden" : ""}><span>Rests on</span>${o.claims.map((c) => jump(c, claimTitles.get(c) || c)).join("")}</p>` : "")).join("");
  return `<section class="step${step.suggested ? " suggested" : ""}" data-step-card="${index}">
  <h3>${esc(step.label)}${step.suggested ? ' <span class="tag">Start here</span>' : ""}</h3>
  ${para(step.why)}
  ${picker}
  <p class="why" data-why="${index}">${esc(options.length > 1 ? options[0].why : "")}</p>
  <p class="cmd" data-cmd="${index}">${esc(options[0].command)}</p>
  ${rests}
  <div class="acts"><button type="button" class="add" data-add="${index}" aria-pressed="false">Add</button><button type="button" data-copy-step="${index}">Copy command</button></div>
</section>`;
}

// The most words each part of a page may hold. A page is glanced at on a small laptop beside a conversation,
// so the program refuses a long one and says which parts to cut: the writer shortens it, not the reader.
export const LIMITS = { verdict: 16, todo: 12, subtitle: 14, statLabel: 6, problemTitle: 9, problemBody: 45, line: 16, stepLabel: 8, why: 18, order: 20, happened: 30, means: 30, notChecked: 40, termMeans: 25, change: 20, brief: 30, viewName: 4, bet: 18, viewNote: 18, tuneLabel: 3 };
export const COUNTS = { stats: 3, problems: 3, also: 5, working: 3, steps: 3, terms: 3, changes: 5 };
export const VIEWS = 5; // the original and up to four alternatives
export const NOTE_MAX = 600; // characters of a typed request
export const TUNE = 4; // values one version can offer for tuning
export const POINTS = 8; // notes on parts of one version in one request
export const POINT_SAY = 300; // characters of a note on one part
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
  if (page.workspace) {
    check("workspace.brief", page.workspace.brief, LIMITS.brief);
    count("workspace.views", page.workspace.views, VIEWS);
    (page.workspace.views || []).forEach((v, i) => {
      const at = `workspace.views[${i}]`;
      check(`${at}.name`, v?.name, LIMITS.viewName); check(`${at}.bet`, v?.bet, LIMITS.bet); check(`${at}.note`, v?.note, LIMITS.viewNote);
      count(`${at}.tune`, v?.tune, TUNE);
      (Array.isArray(v?.tune) ? v.tune : []).forEach((t, j) => { check(`${at}.tune[${j}].label`, t?.label, LIMITS.tuneLabel); (Array.isArray(t?.options) ? t.options : []).forEach((o, k) => check(`${at}.tune[${j}].options[${k}].label`, o?.label, LIMITS.tuneLabel)); });
    });
  }
  return out;
}

// Tuning. A running version can offer a few of the CSS custom properties it is built on, each as a real control.
// The agent that made the version chooses them; the page only draws them and sets them inside the running version.
const TUNE_VAR = /^--[A-Za-z][\w-]{0,40}$/;
const TUNE_UNITS = ["", "px", "rem", "em", "%", "ms", "s", "deg", "vw", "vh", "ch", "fr"];
const CHOICE_VALUE = /^[^;{}<>"'`\\\u0000-\u001f\u007f]{1,60}$/;

/** What is wrong with a view's `tune`, as plain sentences. Empty when the page can draw it. */
export function tuneProblems(view, where = "view") {
  if (view?.tune === undefined) return [];
  if (!Array.isArray(view.tune)) return [`${where}.tune must be a list.`];
  const out = [];
  if (!view.live) out.push(`${where}.tune needs a live page: the controls set values inside the running version.`);
  if (!view.revise) out.push(`${where}.tune needs a revise command, so the tuned values can come back to you.`);
  const seen = new Set();
  view.tune.forEach((t, i) => {
    const at = `${where}.tune[${i}]`;
    if (!t || typeof t !== "object") { out.push(`${at} must be an object.`); return; }
    const name = String(t.var ?? "");
    if (!TUNE_VAR.test(name)) out.push(`${at}.var must be a CSS custom property, such as --accent.`);
    else if (seen.has(name)) out.push(`${at}.var ${name} is listed twice.`);
    seen.add(name);
    if (!String(t.label ?? "").trim()) out.push(`${at} needs a label: what the person is tuning, in their words.`);
    if (t.type === "color") {
      if (!/^#[0-9a-f]{6}$/i.test(String(t.value ?? ""))) out.push(`${at}.value must be a colour written #rrggbb.`);
    } else if (t.type === "number") {
      const [min, max, step, value] = [t.min, t.max, t.step, t.value].map((n) => (typeof n === "number" ? n : NaN));
      if (![min, max, step, value].every(Number.isFinite) || !(min < max) || !(step > 0) || value < min || value > max) out.push(`${at} needs numbers min < max, a step above 0 and a value between them.`);
      if (!TUNE_UNITS.includes(String(t.unit ?? ""))) out.push(`${at}.unit must be one of: ${TUNE_UNITS.filter(Boolean).join(", ")}, or left out.`);
    } else if (t.type === "choice") {
      const options = Array.isArray(t.options) ? t.options : [];
      if (options.length < 2 || options.length > 5 || options.some((o) => !String(o?.label ?? "").trim() || !CHOICE_VALUE.test(String(o?.value ?? "")))) out.push(`${at}.options must be two to five, each with a label and a plain CSS value.`);
      else if (!options.some((o) => String(o.value) === String(t.value ?? ""))) out.push(`${at}.value must be one of its options' values.`);
    } else out.push(`${at}.type must be color, number or choice.`);
  });
  return out;
}

/** A view's tuning controls as the page uses them. Only for a view whose tune was checked when it was added. */
export function tuneOf(view) {
  if (!Array.isArray(view?.tune)) return [];
  return view.tune.filter((t) => t && typeof t === "object" && TUNE_VAR.test(String(t.var ?? ""))).map((t) => ({
    var: String(t.var), label: String(t.label ?? t.var), type: String(t.type), value: t.type === "color" ? String(t.value).toLowerCase() : String(t.value ?? ""),
    min: Number(t.min), max: Number(t.max), step: Number(t.step), unit: String(t.unit ?? ""),
    options: Array.isArray(t.options) ? t.options.map((o) => ({ label: String(o?.label ?? ""), value: String(o?.value ?? "") })) : [],
  }));
}

/**
 * The CSS value one tuning control gives for a raw value from the page, or null when the control cannot take it.
 * The page runs this same function, so what the person sees is what the agent is told.
 */
export function tuneValue(t, raw) {
  const v = String(raw ?? "").trim();
  if (t.type === "color") return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null;
  if (t.type === "choice") return (t.options || []).some((o) => o.value === v) ? v : null;
  if (t.type !== "number" || !/^-?\d+(\.\d+)?$/.test(v)) return null;
  const n = Number(v), places = Math.min(6, (String(t.step).split(".")[1] || "").length);
  return n >= t.min - 1e-9 && n <= t.max + 1e-9 ? `${Number(n.toFixed(places))}${t.unit || ""}` : null;
}

/**
 * One part of a running version the person pointed at, as the page reports it: whitelisted keys, plain one-line
 * strings with a fixed most, whole numbers. Null when it is not a part. Everything in it came from the running
 * version, which is generated code, so it is only ever data. The page runs this same function.
 */
export function cleanPoint(x) {
  const STYLES = ["display", "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-align", "text-transform", "color", "background", "padding", "margin", "gap", "border", "border-radius", "box-shadow", "opacity"];
  const str = (v, n) => (typeof v === "string" ? v.slice(0, n * 4).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim().slice(0, n) : "");
  const num = (v) => (typeof v === "number" && Number.isFinite(v) ? Math.round(Math.max(-1e6, Math.min(1e6, v))) : 0);
  if (!x || typeof x !== "object") return null;
  const tag = str(x.tag, 40).toLowerCase(), selector = str(x.selector, 400);
  if (!/^[a-z][a-z0-9-]*$/.test(tag) || !selector) return null;
  const box = x.box && typeof x.box === "object" ? x.box : {}, styles = {};
  if (x.styles && typeof x.styles === "object") for (const k of STYLES) { const v = str(x.styles[k], 120); if (v) styles[k] = v; }
  return { tag, selector, text: str(x.text, 160), label: str(x.label, 120), box: { x: num(box.x), y: num(box.y), w: num(box.w), h: num(box.h) }, viewport: num(x.viewport), styles };
}

/**
 * What a revise or an apply hands the agent on its NOTE line. A revise with only words stays the person's words,
 * one plain line. Notes on parts or tuned values make it one line of JSON:
 *   { "say": "...", "points": [{ "n", "say", "tag", "selector", "text", "label", "box", "viewport", "styles" }],
 *     "tuned": [{ "var", "label", "from", "to" }] }
 * An apply carries only tuned values, or nothing. Throws on anything the page would not send.
 */
export function noteFor(view, kind, data = {}) {
  const tune = tuneOf(view), given = data.tuned ?? {};
  if (!given || typeof given !== "object" || Array.isArray(given)) throw new Error("tuned values must be an object");
  for (const name of Object.keys(given)) if (!tune.some((t) => t.var === name)) throw new Error(`${name} is not offered for tuning on this version`);
  const tuned = [];
  for (const t of tune) {
    if (!Object.hasOwn(given, t.var)) continue;
    const to = tuneValue(t, given[t.var]), from = tuneValue(t, t.value);
    if (to === null) throw new Error(`${t.var} cannot take that value`);
    if (to !== from) tuned.push({ var: t.var, label: t.label, from, to });
  }
  if (kind === "a") return tuned.length ? JSON.stringify({ tuned }) : "";
  const say = cleanNote(data.note), list = data.points ?? [];
  if (!Array.isArray(list) || list.length > POINTS) throw new Error(`at most ${POINTS} notes on parts`);
  if (list.length && !view.live) throw new Error("only a running version can be pointed at");
  const points = list.map((p, i) => {
    const el = cleanPoint(p?.el), words = cleanNote(p?.say).slice(0, POINT_SAY);
    if (!el || !words) throw new Error("a note on a part needs the part and the words");
    return { n: i + 1, say: words, ...el };
  });
  if (!points.length && !tuned.length) return say;
  return JSON.stringify({ ...(say ? { say } : {}), ...(points.length ? { points } : {}), ...(tuned.length ? { tuned } : {}) });
}

// One line that opens when pressed. Everything past the headline, the picture and the next steps is one of these,
// so the page shows its point and the reader chooses what to read.
const row = (title, inner, { n = "", open = false, quiet = false } = {}) => `<details class="row${quiet ? " quiet" : ""}"${open ? " open" : ""}><summary>${n ? `<span class="num">${esc(n)}</span>` : ""}<span>${esc(title)}</span></summary><div class="body">${inner}</div></details>`;
const list = (items, cls = "") => `<ul${cls ? ` class="${cls}"` : ""}>${items.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>`;

// What runs inside a running version that can be steered. /live puts it first in the version's document, and it
// removes its own script tag. Until the Keen page asks for something it does nothing but listen for the page's
// messages: no element, no style, and its other listeners return at once. Pointing lays a clear sheet over the
// version, so the version's own code sees no press while the person points, and nothing of the version changes
// when pointing stops. Tuning sets the version's own CSS custom properties on its root element. Whatever it
// reports, the Keen page treats as data from generated code.
function inFrame() {
  const self = document.currentScript;
  if (self) self.remove();
  if (window.parent === window) return;
  const home = location.protocol + "//" + location.host;
  const READ = ["display", "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-align", "text-transform", "color", "padding", "margin", "gap", "border", "border-radius", "box-shadow", "opacity"];
  const PLAIN = /^(normal|none|auto|0px|0px 0px|0px 0px 0px 0px|1|start)$|^0px none /;
  const SKIP = /^(script|style|template|noscript|meta|link|title|br|wbr|keen-point)$/;
  const PRESS = ["pointerdown", "pointermove", "pointerup", "pointercancel", "pointerover", "pointerout", "pointerenter", "pointerleave", "mousedown", "mousemove", "mouseup", "mouseover", "mouseout", "mouseenter", "mouseleave", "click", "dblclick", "auxclick", "contextmenu", "touchstart", "touchmove", "touchend", "touchcancel", "wheel"];
  const KEYS = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Enter", " ", "Escape"];
  let host = null, root = null, sheet = null, frame = 0, pointing = false, cand = null, picked = null, pickedN = 0, marks = [];
  const before = new Map();
  const post = (m) => { try { parent.postMessage(Object.assign({ keen: 1 }, m), home); } catch (e) { /* not inside the Keen page */ } };
  const flat = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
  const esc = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/[^\w-]/g, "\\$&"));
  const find = (sel) => { try { return document.querySelector(sel); } catch (e) { return null; } };
  const only = (sel) => { try { return document.querySelectorAll(sel).length === 1; } catch (e) { return false; } };
  function selectorOf(el) {
    if (el.id && only("#" + esc(el.id))) return "#" + esc(el.id);
    const parts = [];
    for (let n = el; n && n.nodeType === 1 && n !== document.documentElement; n = n.parentElement) {
      if (n !== el && n.id && only("#" + esc(n.id))) { parts.unshift("#" + esc(n.id)); break; }
      let part = n.localName;
      const cls = Array.from(n.classList).filter((c) => /^[A-Za-z_][\w-]*$/.test(c)).slice(0, 2);
      if (cls.length) part += "." + cls.map(esc).join(".");
      const up = n.parentElement;
      if (up) { const same = Array.from(up.children).filter((c) => c.localName === n.localName); if (same.length > 1) part += ":nth-of-type(" + (same.indexOf(n) + 1) + ")"; }
      parts.unshift(part);
      if (n === document.body) break;
    }
    return parts.join(" > ");
  }
  function describe(el) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el), styles = {};
    for (const k of READ) { const v = cs.getPropertyValue(k).trim(); if (v && !PLAIN.test(v)) styles[k] = v.slice(0, 120); }
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage && s.backgroundImage !== "none") { styles.background = s.backgroundImage.slice(0, 120); break; }
      if (s.backgroundColor && !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(s.backgroundColor)) { styles.background = s.backgroundColor; break; }
    }
    const text = typeof el.innerText === "string" ? el.innerText : el.textContent;
    const label = el.getAttribute("aria-label") || el.getAttribute("alt") || el.getAttribute("title") || el.getAttribute("placeholder") || "";
    return { tag: el.localName.toLowerCase(), selector: selectorOf(el), text: flat(text, 160), label: flat(label, 120), box: { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) }, at: { x: r.left, y: r.top, w: r.width, h: r.height }, viewport: innerWidth, styles };
  }
  const named = (el) => (el ? { tag: el.localName.toLowerCase(), text: flat(typeof el.innerText === "string" ? el.innerText : el.textContent, 60), label: flat(el.getAttribute("aria-label") || el.getAttribute("alt") || "", 60) } : null);
  const later = () => { if (!frame) frame = requestAnimationFrame(draw); };
  function ensure() {
    if (host) return;
    host = document.createElement("keen-point");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;display:block!important";
    root = host.attachShadow({ mode: "open" });
    const css = document.createElement("style");
    css.textContent = ".m{position:fixed;box-sizing:border-box;border-radius:4px;box-shadow:0 0 0 2px #03130a,0 0 0 4px oklch(0.86 0.21 150);pointer-events:none}.m.c{background:rgba(46,204,113,.12);box-shadow:0 0 0 2px #03130a,0 0 0 4px rgba(255,255,255,.9)}.m.p{background:rgba(46,204,113,.16)}.m b{position:absolute;left:-4px;top:-28px;min-width:24px;height:24px;padding:0 7px;box-sizing:border-box;border-radius:12px;background:oklch(0.86 0.21 150);color:#03130a;font:700 13px/24px system-ui,-apple-system,sans-serif;text-align:center;box-shadow:0 0 0 2px #03130a}.m b.in{top:4px;left:4px}.s{position:fixed;inset:0;cursor:crosshair;pointer-events:none}";
    sheet = document.createElement("div");
    sheet.className = "s";
    root.append(css, sheet);
    document.documentElement.appendChild(host);
    addEventListener("scroll", later, true);
    addEventListener("resize", later);
  }
  function drop() {
    if (!host) return;
    host.remove(); host = root = sheet = null;
    removeEventListener("scroll", later, true);
    removeEventListener("resize", later);
  }
  function draw() {
    frame = 0;
    if (!root) return;
    root.querySelectorAll(".m").forEach((n) => n.remove());
    const outline = (el, cls, n) => {
      if (!el || !el.isConnected) return;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      const d = document.createElement("div");
      d.className = "m " + cls;
      d.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px";
      if (n) { const b = document.createElement("b"); b.textContent = String(n); if (r.top < 30) b.className = "in"; d.appendChild(b); }
      root.appendChild(d);
    };
    for (const m of marks) outline(find(m.selector), "", m.n);
    if (picked) outline(picked, "p", pickedN);
    if (pointing && cand && cand !== picked) outline(cand, "c", 0);
    if (!pointing && !marks.length && !picked) drop();
  }
  const under = (x, y) => { for (const el of document.elementsFromPoint(x, y)) if (el !== host && el !== document.documentElement && el !== document.body) return el; return null; };
  // Said aloud on the Keen page, so only a move made from the keyboard is reported; the mouse has the outline.
  const hover = () => post({ type: "hover", el: named(cand) });
  function pick(el) { picked = el; pickedN = 0; later(); post({ type: "picked", el: describe(el) }); }
  function start() {
    ensure();
    pointing = true;
    sheet.style.pointerEvents = "auto";
    const f = document.activeElement;
    if (!cand && f && f !== document.body && f !== document.documentElement) { cand = f; hover(); }
    later();
  }
  function stop() { pointing = false; cand = null; if (sheet) sheet.style.pointerEvents = "none"; later(); }
  function step(dir) {
    const all = Array.from(document.body ? document.body.querySelectorAll("*") : []).filter((el) => !SKIP.test(el.localName) && el.getClientRects().length > 0);
    if (!all.length) return;
    let i = cand ? all.indexOf(cand) : -1;
    i = i < 0 ? (dir > 0 ? 0 : all.length - 1) : Math.max(0, Math.min(all.length - 1, i + dir));
    cand = all[i];
    cand.scrollIntoView({ block: "nearest", inline: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "auto" });
    later(); hover();
  }
  // While pointing, every press lands on the sheet and stops here, before the version's own listeners.
  const press = (e) => {
    if (!pointing || e.target !== host) return;
    e.stopImmediatePropagation();
    if (e.type === "pointermove" || e.type === "mousemove") { const el = under(e.clientX, e.clientY); if (el !== cand) { cand = el; later(); } return; }
    if (e.type === "click") { const el = under(e.clientX, e.clientY); if (el) pick(el); }
    if (e.cancelable && !/^(touch|wheel)/.test(e.type)) e.preventDefault();
  };
  for (const type of PRESS) addEventListener(type, press, /^(touch|wheel)/.test(type) ? { capture: true, passive: true } : true);
  const keys = (e) => {
    if (!pointing || !KEYS.includes(e.key) || e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.type !== "keydown") return;
    if (e.key === "Escape") { stop(); post({ type: "exit" }); }
    else if (e.key === "Enter" || e.key === " ") { if (cand) pick(cand); }
    else step(e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1);
  };
  for (const type of ["keydown", "keypress", "keyup"]) addEventListener(type, keys, true);
  addEventListener("focusin", (e) => { if (pointing && e.target && e.target.nodeType === 1 && e.target !== document.body && e.target !== host) { cand = e.target; later(); hover(); } }, true);
  function tune(values) {
    const want = values && typeof values === "object" ? values : {}, style = document.documentElement.style;
    for (const [name, was] of Array.from(before)) if (!Object.prototype.hasOwnProperty.call(want, name)) { if (was) style.setProperty(name, was); else style.removeProperty(name); before.delete(name); }
    for (const name of Object.keys(want).slice(0, 8)) {
      const value = want[name];
      if (!/^--[A-Za-z][\w-]{0,40}$/.test(name) || typeof value !== "string" || value.length > 80) continue;
      if (!before.has(name)) before.set(name, style.getPropertyValue(name));
      style.setProperty(name, value);
    }
    later();
  }
  addEventListener("message", (e) => {
    if (e.source !== parent) return;
    const d = e.data;
    if (!d || typeof d !== "object" || d.keen !== 1) return;
    e.stopImmediatePropagation();
    if (d.type === "point") { if (d.on) start(); else stop(); }
    else if (d.type === "marks") {
      marks = (Array.isArray(d.marks) ? d.marks : []).slice(0, 12).filter((m) => m && typeof m.selector === "string").map((m) => ({ n: Number(m.n) || 0, selector: m.selector }));
      picked = d.pending && typeof d.pending.selector === "string" ? find(d.pending.selector) : null;
      pickedN = d.pending ? Number(d.pending.n) || 0 : 0;
      if (marks.length || picked) ensure();
      later();
    } else if (d.type === "tune") tune(d.values);
  }, true);
  const ready = () => post({ type: "ready" });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true }); else ready();
}
const IN_FRAME = Buffer.from(`<script>(${inFrame.toString()})();</script>`);
if (/<\/script/i.test(inFrame.toString())) throw new Error("The frame script must not close its own tag.");

/** A running version's document with the steering script placed first: after any doctype, before anything else. */
export function withSteering(html) {
  const buf = Buffer.isBuffer(html) ? html : Buffer.from(String(html));
  const lead = /^(?:﻿|\xEF\xBB\xBF)?\s*(?:<!--[\s\S]*?-->\s*)*(?:<!doctype[^>]*>)?/i.exec(buf.toString("latin1"));
  const at = lead ? lead[0].length : 0;
  return Buffer.concat([buf.subarray(0, at), IN_FRAME, buf.subarray(at)]);
}

const SIZES = { phone: [390, 800], desktop: [1440, 900] };
const LOCAL_URL = /^http:\/\/(127\.0\.0\.1|localhost)(:\d{2,5})?(\/[^\s"'<>]*)?$/;
const LIVE_FILE = /^live-[0-9a-f]{16}\.html$/;

// One view at one size: the running page in a frame when there is one, otherwise its screenshot.
function media(view, size, index, liveKey) {
  const [w, h] = SIZES[size];
  const src = view.live && liveKey && LIVE_FILE.test(view.live) ? `/live/${view.live}?l=${liveKey}` : LOCAL_URL.test(view.url || "") ? view.url : "";
  const label = `${view.name}, ${size}`;
  let inner = `<p class="none">No ${size} preview of this one.</p>`;
  // A page served from here is boxed in by the header it is served with (see /live): it cannot read this page
  // or its key. A project's own address is another origin already.
  if (src) inner = `<div class="dev" data-w="${w}" data-h="${h}"><iframe title="${esc(label)}" referrerpolicy="no-referrer" data-src="${esc(src)}"></iframe></div>`;
  else if (view[size]) inner = `<div class="shot ${size}"><img src="${esc(view[size])}" alt="${esc(label)}"></div>`;
  return `<div data-media="${index}:${size}">${inner}</div>`;
}

function workspaceSection(page, liveKey) {
  const views = viewsOf(page);
  if (!views.length) return "";
  const ws = page.workspace;
  return `<section class="ws" data-ws aria-label="Compare the versions">
${ws.brief ? `<p class="brief"><b>Brief</b> ${esc(ws.brief)}</p>` : ""}
<div class="wsbar"><div class="seg" role="group" aria-label="Version">${views.map((v, i) => `<button type="button" data-view="${i}" aria-pressed="false"><kbd>${i + 1}</kbd> ${esc(v.name)}</button>`).join("")}</div>
<div class="seg" role="group" aria-label="Size"><button type="button" data-size="phone" aria-pressed="false">Phone</button><button type="button" data-size="desktop" aria-pressed="false">Desktop</button></div>
<label class="pick">Beside <select data-compare><option value="-1">Nothing</option>${views.map((v, i) => `<option value="${i}">${esc(v.name)}</option>`).join("")}</select></label></div>
<p class="stale" data-stale role="status" hidden></p>
<div class="steer" data-steer hidden><button type="button" class="point" data-point><span class="ring" aria-hidden="true"></span><span data-point-label>Point at a part</span></button><button type="button" class="tunes" data-tunes aria-expanded="false" hidden>Tune</button><div class="tune" data-tune role="group" data-folded></div><button type="button" class="reset" data-tune-reset hidden>Reset</button></div>
<p class="phint" data-point-hint role="status" aria-live="polite"></p>
<div class="stage"><div class="pane" data-pane="0"></div><div class="pane" data-pane="1" hidden></div>
<form class="pop" data-pop hidden><div class="pophead"><p class="what" data-pop-what></p><button type="button" class="x" data-pop-cancel>Cancel</button></div><label for="pop-${esc(ws.id || "ws")}">What should change here?</label><div class="poprow"><input id="pop-${esc(ws.id || "ws")}" type="text" maxlength="${POINT_SAY}" autocomplete="off" enterkeyhint="done" data-pop-input><button type="submit" class="add">Add note</button></div></form></div>
<div class="wsfoot"><div class="about"><h3 data-ws-name></h3><p data-ws-bet></p><p class="rev" data-ws-note></p></div>
<form data-revise><div class="pnotes" data-pnotes hidden><p class="plabel" data-pnotes-label></p><ol data-pnote-list></ol></div><p class="ptuned" data-ptuned hidden></p><label for="ask-${esc(ws.id || "ws")}">What should change in <b data-ws-short></b>?</label><textarea id="ask-${esc(ws.id || "ws")}" rows="3" maxlength="${NOTE_MAX}" placeholder="Say it in your own words. Your agent revises this version and it updates here."></textarea>
<div class="acts"><button type="submit" data-ask>Ask for this change</button><button type="button" class="go" data-apply>Apply this one</button></div></form></div>
<div hidden>${views.map((v, i) => media(v, "phone", i, liveKey) + media(v, "desktop", i, liveKey)).join("")}</div>
</section>`;
}

// Evidence, in plain words. The page names each kind of evidence by where it came from; the packet keeps the ids.
const SCOPE_NAME = { "repository-snapshot": "Code snapshot", "repository-history": "Git history", "controlled-fixture": "Controlled test", "synthetic-fixture": "Synthetic data", "runtime-observation": "Real run", "database-snapshot": "Database read" };
const STATUS_NAME = { observed: "Observed", supported: "Supported", contradicted: "Contradicted", open: "Open" };
const RELATIONS = [["supports", "Supports"], ["refutes", "Refutes"], ["context", "Context"]];
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// A page's evidence: the question, the claims with what bears on each, the proposals, the sources. Collapsed
// under the page's own content; every value is the producer's and is shown as text.
function evidenceSection(page) {
  const b = page.evidence;
  if (!b || typeof b !== "object") return "";
  const sources = new Map(b.sources.map((s) => [s.id, s])), observations = new Map(b.observations.map((o) => [o.id, o]));
  const subjects = new Map(b.subjects.map((s) => [s.id, s])), claims = new Map(b.claims.map((c) => [c.id, c]));
  const scope = (s) => `<span class="scope">${esc(SCOPE_NAME[s] || s)}</span>`;
  const keys = (ids) => ids.map((id) => subjects.get(id)).filter(Boolean).map((s) => `<code title="${esc(s.label)}">${esc(s.key)}</code>`).join(" ");
  const source = (s) => `<details class="more src"><summary>Source: ${esc(s.label)} · sha256 ${esc(s.sha256.slice(0, 12))}</summary><dl><dt>How it was read</dt><dd>${para(s.method)}</dd><dt>Limits</dt><dd>${para(s.limits)}</dd><dt>Artifact</dt><dd><code>${esc(s.artifact)}</code></dd><dt>SHA-256</dt><dd><code>${esc(s.sha256)}</code></dd></dl></details>`;
  const card = (o, rel = "") => {
    const s = sources.get(o.source);
    const data = Object.keys(o.details).length ? `<details class="more raw"><summary>Recorded data</summary><pre>${esc(JSON.stringify(o.details, null, 2))}</pre></details>` : "";
    return `<li class="ob ${rel}"><p class="obh">${scope(s.scope)}<span>${esc(o.kind)}</span><code>${esc(o.locator)}</code></p>${para(o.summary)}<p class="keys">${keys(o.subjects)}</p>${data}${source(s)}</li>`;
  };
  const casesOf = (id) => b.cases.filter((k) => k.claims.includes(id)).map((k) => k.id);
  const claimRow = (c) => {
    const linked = c.links.map((l) => observations.get(l.observation));
    const about = [...new Set([...c.subjects, ...linked.flatMap((o) => o.subjects)])];
    const from = [...new Set([c.scope, ...linked.map((o) => sources.get(o.source).scope)])];
    const groups = RELATIONS.map(([rel, name]) => {
      const list = c.links.filter((l) => l.relation === rel);
      return list.length ? `<div class="grp"><p class="glabel ${rel}">${name} <span>${list.length}</span></p><ul class="obs">${list.map((l) => card(observations.get(l.observation), rel)).join("")}</ul></div>` : "";
    }).join("");
    const named = c.subjects.map((id) => subjects.get(id)).filter(Boolean).map((s) => `<span class="subj">${esc(s.label)} <code>${esc(s.key)}</code></span>`).join("");
    return `<div class="claim" data-claim="${esc(c.id)}" data-subjects="${esc(about.join(" "))}" data-scopes="${esc(from.join(" "))}" data-cases="${esc(casesOf(c.id).join(" "))}">
<label class="tick"><input type="checkbox" data-tick="${esc(c.id)}" aria-label="Put this claim in the packet: ${esc(c.title)}"></label>
<details><summary><span class="ct">${esc(c.title)}</span><span class="meta"><span class="st ${esc(c.status)}">${esc(STATUS_NAME[c.status] || c.status)}</span>${scope(c.scope)}</span></summary>
<div class="cb">${para(c.statement)}<div class="lim"><b>Limits</b>${para(c.limits)}</div><p class="about"><b>About</b>${named}</p>${groups || '<p class="none">Nothing observed is linked to this claim yet.</p>'}</div></details></div>`;
  };
  const used = SCOPES.filter((s) => b.sources.some((f) => f.scope === s));
  const filters = [
    b.cases.length > 1 ? `<label class="pick">Question <select data-ev-case><option value="">All of them</option>${b.cases.map((k, i) => `<option value="${esc(k.id)}"${i ? "" : " selected"}>${esc(k.title)}</option>`).join("")}</select></label>` : "",
    b.subjects.length > 1 ? `<label class="pick">About <select data-ev-subject><option value="">Everything</option>${[...b.subjects].sort((x, y) => x.label.localeCompare(y.label, "en")).map((s) => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join("")}</select></label>` : "",
    used.length > 1 ? `<label class="pick">From <select data-ev-scope><option value="">Every kind of evidence</option>${used.map((s) => `<option value="${esc(s)}">${esc(SCOPE_NAME[s])}</option>`).join("")}</select></label>` : "",
  ].join("");
  // One question heads the box itself; several each lead when chosen.
  const one = b.cases.length === 1;
  const lead = one ? `<div class="case">${para(b.cases[0].summary)}</div>` : b.cases.map((k, i) => `<div class="case" data-case="${esc(k.id)}"${i ? " hidden" : ""}><h3>${esc(k.question)}</h3>${para(k.summary)}</div>`).join("");
  const proposals = b.decisions.map((d) => `<li class="prop"><p class="ptag">Proposed · not approved</p><h4>${esc(d.title)}</h4>${para(d.recommendation)}<p class="verify"><b>Check by</b> ${esc(d.verification)}</p><p class="rests"><span>Rests on</span>${d.claims.map((id) => jump(id, claims.get(id)?.title || id)).join("")}</p></li>`).join("");
  const linkedIds = new Set(b.claims.flatMap((c) => c.links.map((l) => l.observation)));
  const loose = b.observations.filter((o) => !linkedIds.has(o.id));
  const sourceList = `<ul class="obs">${b.sources.map((s) => `<li class="ob"><p class="obh">${scope(s.scope)}<b>${esc(s.label)}</b></p>${para(s.method)}<div class="lim"><b>Limits</b>${para(s.limits)}</div><p class="keys"><code>${esc(s.artifact)}</code> <code>sha256 ${esc(s.sha256)}</code></p></li>`).join("")}</ul>`;
  const p = b.project, rev = p.revision === "working-tree" ? "uncommitted working tree" : `<code>${esc(p.revision.slice(0, 12))}</code>`;
  const made = b.producer ? ` · from ${esc(b.producer.capability)} · ${esc(b.producer.at.slice(0, 16).replace("T", " "))} UTC` : "";
  return `<section class="sec ev" data-ev aria-label="Evidence"><p class="label">Evidence</p>
<details class="evbox" data-ev-box><summary><span class="evq">${esc(one ? b.cases[0].question : b.title)}</span><span class="evn">${plural(b.claims.length, "claim")} · ${plural(b.observations.length, "observation")} · ${plural(b.sources.length, "source")}</span></summary>
<div class="evin">
<p class="evproj"><code>${esc(p.repository)}</code> · ${rev}${made}</p>
${lead}
${b.claims.length ? `<div class="evbar">${filters}<span class="evcount" data-ev-count></span></div>
<div class="claims">${b.claims.map(claimRow).join("")}</div>
<p class="none" data-ev-empty hidden>No claim matches. Choose Everything to see them all.</p>
<div class="pack"><button type="button" data-packet disabled>Download packet</button><p>Tick the claims to share. The packet holds them, the observations and sources behind them, and any proposal that rests only on them. It is made on this page, sent nowhere, and grants no permission.</p></div>` : '<p class="none">This evidence makes no claims yet.</p>'}
${proposals ? `<div class="props"><p class="label">Proposed next steps</p><ul>${proposals}</ul></div>` : ""}
<div class="rows">${row(`Sources (${b.sources.length})`, sourceList, { quiet: true })}${loose.length ? row(`Not linked to a claim (${loose.length})`, `<ul class="obs">${loose.map((o) => card(o)).join("")}</ul>`, { quiet: true }) : ""}</div>
</div></details></section>`;
}

/** One page as an HTML fragment. */
export function renderPage(page, { baseDir = process.cwd(), liveKey = "" } = {}) {
  const r = page.report || {};
  const claimTitles = new Map((page.evidence?.claims || []).map((c) => [c.id, c.title]));
  const steps = (page.steps || []).map((s, i) => stepCard(s, i, claimTitles)).join("\n");
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
${workspaceSection(page, liveKey)}
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
${evidenceSection(page)}
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
.pick{flex:0 1 auto;min-width:0;margin-left:auto}
.pick[hidden]{display:none}
.pick:not([hidden])+.state{margin-left:0}
.pick select{min-height:36px;font-size:14px;max-width:260px;background:transparent;color:var(--soft);border-color:var(--line2)}
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
#bar.bare .in{display:none}#bar.bare:has(#status:empty):has(#held:empty){display:none}#bar.bare #status,#bar.bare #held{margin:0}
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
.ws{margin:4px 0 8px}
.brief{max-width:none;color:var(--soft);font-size:15px;margin:0 0 14px}.brief b{font:500 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin-right:10px}
.wsbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px}.wsbar .pick{margin:0 0 0 auto}.wsbar .pick select{min-height:40px}
.seg{display:inline-flex;flex-wrap:wrap;border:1px solid var(--line2);border-radius:12px;padding:3px;gap:3px;background:var(--card)}
.seg button{min-height:38px;border:0;background:transparent;color:var(--soft);padding:0 14px;border-radius:9px}.seg button:hover{background:#1a1a1a}
.seg button[aria-pressed=true],.seg button[aria-pressed=true]:hover{background:#fff;color:#000}
kbd{font:500 11px/1 var(--mono);opacity:.6;margin-right:4px}
.stage{display:grid;gap:12px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(180deg,#0d0d0d,#050505);padding:16px;min-height:320px}
.ws.two .stage{grid-template-columns:repeat(2,minmax(0,1fr))}
.pane{min-width:0;display:flex;flex-direction:column;align-items:center}.pane[hidden]{display:none}
.cap{align-self:stretch;margin:0 0 10px;font:500 12px/1.3 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--soft);max-width:none}
.dev{position:relative;overflow:hidden;border-radius:12px;border:1px solid var(--line2);background:#fff;max-width:100%}
.dev iframe{position:absolute;left:0;top:0;border:0;transform-origin:0 0;background:#fff}
.shot{max-width:100%;max-height:78vh;overflow:auto;border-radius:12px;border:1px solid var(--line2)}.shot.phone{width:390px}.shot img{display:block;width:100%;height:auto}
.none{color:var(--dim);padding:60px 0;margin:0}
.stale{max-width:none;margin:0 0 12px;padding:10px 14px;border:1px solid var(--amber);border-radius:10px;color:var(--amber);font-size:14.5px}.stale[hidden]{display:none}
.wsfoot{display:grid;gap:20px;margin-top:16px}@media (min-width:860px){.wsfoot{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start}}
.about p{color:var(--soft);font-size:15px}.rev{color:var(--green)!important}.rev:empty{display:none}
form[data-revise]{margin:0;display:grid;gap:8px}form[data-revise] label{font-size:14.5px;font-weight:500;color:var(--soft)}form[data-revise] label b{color:var(--ink)}form[data-revise][data-plain] label,form[data-revise][data-plain] textarea,form[data-revise][data-plain] [data-ask]{display:none}
textarea{font:inherit;font-size:15px;line-height:1.5;width:100%;min-height:84px;resize:vertical;padding:10px 12px;border-radius:10px;border:1px solid var(--line2);background:var(--card2);color:var(--ink)}textarea:focus-visible{outline:2px solid var(--green);outline-offset:2px}
.rests{display:flex;flex-wrap:wrap;align-items:center;gap:6px;max-width:none;margin:2px 0 6px}.rests[hidden]{display:none}.rests>span{font:500 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin-right:4px}
button.jump{min-height:34px;padding:4px 12px;font-size:13.5px;line-height:1.3;border-radius:999px;background:transparent;text-align:left;max-width:100%}
.ev code{font:12.5px/1.5 var(--mono);color:var(--ink);overflow-wrap:anywhere}
.evbox{border:1px solid var(--line);border-radius:14px;background:var(--card)}
.evbox>summary{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 14px;position:relative;min-height:56px;padding:15px 48px 15px 18px;cursor:pointer;list-style:none;border-radius:14px}
.evbox>summary::-webkit-details-marker{display:none}
.evbox>summary::after{content:"";position:absolute;right:21px;top:23px;width:7px;height:7px;border-right:1.5px solid var(--soft);border-bottom:1.5px solid var(--soft);transform:rotate(45deg)}
.evbox[open]>summary::after{transform:rotate(225deg);top:26px}
.evbox>summary:hover{background:rgba(255,255,255,.03)}
.evq{flex:1 1 320px;min-width:0;font-weight:600;font-size:16px;letter-spacing:-0.01em;text-wrap:pretty}
.evn{font:500 12px/1.4 var(--mono);letter-spacing:.04em;color:var(--dim)}
.evin{padding:0 18px 18px;border-top:1px solid var(--line)}
.evproj{margin:14px 0 0;max-width:none;font-size:13px;color:var(--dim)}.evproj code{color:var(--soft)}
.case{margin:18px 0 0}.case[hidden]{display:none}.case h3{font-size:19px;line-height:1.3;max-width:52ch;text-wrap:balance}.case p{color:var(--soft);font-size:15px}
.evbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 18px;margin:18px 0 10px}.evbar .pick{margin:0}.evbar select{min-height:40px;max-width:260px}
.evcount{margin-left:auto;font:500 12px/1.4 var(--mono);letter-spacing:.04em;color:var(--dim)}
.claims{border-top:1px solid var(--line)}
.claim{display:grid;grid-template-columns:44px minmax(0,1fr);border-bottom:1px solid var(--line);transition:background .4s}.claim[hidden]{display:none}.claim.flash{background:rgba(0,220,130,.07)}
.tick{display:flex;justify-content:center;align-items:flex-start;padding-top:14px;min-height:52px;cursor:pointer}
.tick input{width:18px;height:18px;margin:0;accent-color:var(--green);cursor:pointer}.tick input:focus-visible{outline:2px solid var(--green);outline-offset:3px}
.claim>details>summary{display:grid;gap:6px;position:relative;padding:12px 34px 12px 0;cursor:pointer;list-style:none}
.claim>details>summary::-webkit-details-marker{display:none}
.claim>details>summary::after{content:"";position:absolute;right:10px;top:19px;width:6px;height:6px;border-right:1.5px solid var(--soft);border-bottom:1.5px solid var(--soft);transform:rotate(45deg)}
.claim>details[open]>summary::after{transform:rotate(225deg);top:22px}
.ct{font-weight:600;font-size:15.5px;letter-spacing:-0.01em;line-height:1.4}
.meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.st{display:inline-flex;align-items:center;gap:6px;font:500 11px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink)}
.st::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--dim)}.st.observed::before,.st.supported::before{background:var(--green)}.st.contradicted::before{background:var(--mark)}.st.open::before{background:var(--amber)}
.scope{display:inline-block;font:500 10.5px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--soft);border:1px solid var(--line2);border-radius:999px;padding:4px 8px;white-space:nowrap}
.cb{padding:0 12px 18px 0}.cb>p,.cb .lim p{color:var(--soft);font-size:15px}
.lim{margin:0 0 12px;padding:2px 0 2px 12px;border-left:2px solid var(--amber)}.lim p{margin:0 0 6px;font-size:14.5px;color:var(--soft)}.lim p:last-child{margin-bottom:0}
.lim b,.about b,.verify b{display:block;font:500 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--amber);margin:0 0 6px}.about b,.verify b{color:var(--dim)}
.about{display:flex;flex-wrap:wrap;gap:4px 14px;max-width:none}.about b{flex:0 0 100%}.subj{font-size:14px;color:var(--soft)}
.grp{margin-top:16px}.glabel{font:500 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin:0 0 8px}.glabel span{color:var(--soft);margin-left:4px}.glabel.supports{color:var(--green)}.glabel.refutes{color:var(--mark)}
.obs{list-style:none;padding:0;margin:0;max-width:none;display:grid;gap:8px;color:var(--ink)}
.ob{margin:0;padding:12px 14px;border:1px solid var(--line);border-left:2px solid var(--line2);border-radius:10px;background:var(--card2);min-width:0}.ob.supports{border-left-color:var(--green)}.ob.refutes{border-left-color:var(--mark)}
.ob p{font-size:14.5px;color:var(--soft)}.ob .obh{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:0 0 8px;max-width:none;font-size:13.5px;color:var(--ink)}
.keys{display:flex;flex-wrap:wrap;gap:4px 10px;max-width:none}.keys:empty{display:none}
.ob .more{margin:4px 0 0}.ob .more summary{font-size:13.5px;color:var(--soft);min-height:32px}.ob .more[open] summary{color:var(--ink)}.ob dl{margin:4px 0;padding-left:12px;border-left:1px solid var(--line2)}.ob dt{font:500 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin:12px 0 6px}.ob dt:first-child{margin-top:6px}.ob dd{margin:0}.ob dd p{font-size:14px;margin:0 0 4px}.ob pre{margin:6px 0 4px;max-height:420px;overflow:auto}
.pack{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;margin:16px 0 0}.pack p{flex:1 1 300px;margin:0;font-size:14px;color:var(--soft)}.pack button:not([disabled]){background:#fff;color:#000;border-color:#fff}.pack button:not([disabled]):hover{background:#dcdcdc}
.props{margin-top:28px}.props .label{margin-bottom:12px}.props ul{list-style:none;padding:0;margin:0;max-width:none;display:grid;gap:10px}
.prop{margin:0;padding:14px 16px;border:1px dashed var(--line2);border-radius:12px}.prop .ptag{font:500 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin:0 0 10px}.prop h4{font-size:16px;font-weight:600;letter-spacing:-0.01em;margin:0 0 6px}.prop p{font-size:14.5px;color:var(--soft)}.prop .rests{margin:10px 0 0}
.evin>.rows{margin-top:24px}
.steer{display:flex;flex-wrap:wrap;align-items:center;gap:6px 16px;margin:0 0 10px;padding:6px;border:1px solid var(--line);border-radius:14px;background:var(--card)}.steer[hidden]{display:none}
.steer>button{min-height:40px}
button.point{display:inline-flex;align-items:center;gap:9px}
.ring{position:relative;width:14px;height:14px;border-radius:50%;border:1.5px solid currentColor;flex:none}.ring::after{content:"";position:absolute;inset:2.5px;border-radius:50%;background:currentColor}
.ws[data-pointing] button.point,.ws[data-pointing] button.point:hover{background:var(--green);border-color:var(--green);color:var(--on-green)}
.tune{display:flex;flex-wrap:wrap;align-items:center;gap:0 20px;min-width:0}.tune[hidden]{display:none}
.tv{display:inline-flex;align-items:center;gap:10px;min-height:44px;margin:0;font-size:14px;color:var(--soft)}
.tn{color:var(--ink);font-weight:500;white-space:nowrap}
.tv input[type=range]{width:128px;height:32px;margin:0;accent-color:oklch(0.86 0.21 150);background:transparent;cursor:pointer}
.tv input[type=color]{width:40px;height:32px;padding:2px;border:1px solid var(--line2);border-radius:8px;background:var(--card2);cursor:pointer}
.tv output{font:500 12.5px/1 var(--mono);color:var(--soft);min-width:6ch}
.tv .seg{padding:2px}.tv .seg button{min-height:32px;padding:0 10px;font-size:13.5px}
.tv input:focus-visible,.pop input:focus-visible{outline:2px solid var(--green);outline-offset:2px}
button.reset,button.tunes,.pop button.x,.pnotes li button{background:transparent;border-color:transparent;color:var(--soft)}button.reset:hover,.pop button.x:hover,.pnotes li button:hover{color:var(--ink)}
button.reset{padding:0 10px}button.tunes{display:none}
.phint{max-width:none;margin:-2px 0 10px;font-size:14px;line-height:1.5;color:var(--soft)}.phint:empty{display:none}.steer:not([hidden])+.phint{display:block;min-height:1.5em}
.stage{position:relative}
.ws[data-pointing] [data-pane="0"] .dev{border-color:var(--green);box-shadow:0 0 0 1px var(--green)}
.dev:focus-within{outline:2px solid var(--green);outline-offset:3px}
.pop{position:absolute;z-index:2;left:8px;top:8px;width:min(360px,calc(100% - 16px));display:grid;gap:8px;margin:0;padding:10px 10px 12px 14px;border-radius:14px;background:rgba(18,18,18,.97);border:1px solid var(--line2);box-shadow:0 24px 60px -12px rgba(0,0,0,.95)}.pop[hidden]{display:none}
.pophead{display:flex;align-items:center;gap:8px}
.what{flex:1 1 auto;min-width:0;margin:0;display:flex;align-items:center;gap:8px;font-size:14px;font-weight:500;color:var(--ink);overflow-wrap:anywhere}
.pop label{font-size:13.5px;color:var(--soft)}
.poprow{display:flex;gap:8px}
.pop input{flex:1 1 auto;min-width:0;font:inherit;font-size:16px;min-height:44px;padding:0 12px;border-radius:10px;border:1px solid var(--line2);background:var(--card2);color:var(--ink)}
.pop button.x{min-height:36px;padding:0 10px;font-size:13.5px}
.pn{flex:none;display:inline-block;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:var(--green);color:var(--on-green);font:700 12px/22px var(--sans);text-align:center}
.pnotes{border:1px solid var(--line);border-radius:12px;background:var(--card)}.pnotes[hidden]{display:none}
.ptuned{max-width:none;margin:0;font-size:14px;color:var(--soft)}.ptuned[hidden]{display:none}
.plabel{margin:0;padding:10px 12px 0;font:500 11px/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--dim)}
.pnotes ol{list-style:none;margin:0;padding:2px 0;max-width:none}
.pnotes li{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:start;margin:0;padding:8px 6px 8px 12px}.pnotes li+li{border-top:1px solid var(--line)}.pnotes li .pn{margin-top:1px}
.pw{display:block;font-size:13px;color:var(--dim);overflow-wrap:anywhere}.ps{display:block;font-size:15px;color:var(--ink);overflow-wrap:anywhere}
.pnotes li button{min-height:36px;padding:0 10px;font-size:13px}
button.tunes::after{content:"";width:7px;height:7px;margin:0 2px 3px 10px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg)}button.tunes[aria-expanded=true]::after{transform:rotate(225deg);margin-bottom:-3px}
@media (max-width:699px){button.tunes:not([hidden]){display:inline-flex;align-items:center}.steer>button.point{flex:1 1 auto;justify-content:center}.tune{flex-basis:100%;flex-direction:column;align-items:stretch;gap:0;padding:0 6px}.tune[data-folded]{display:none}.tv .tn{flex:1 1 auto}.tv input[type=range]{width:min(170px,42vw)}}
@media (max-width:820px){.ws.two .stage{grid-template-columns:1fr}.trio{grid-template-columns:1fr}.hero{padding:20px 0 18px}.sec{margin-top:32px}.gallery{padding:16px;border-radius:14px}main{padding-bottom:230px}}
@media (max-width:560px){.top .in{flex-wrap:wrap;padding:8px 16px;gap:8px}.pick select{max-width:44vw}main{padding-left:16px;padding-right:16px}.state{max-width:60vw}#bar{padding:10px 10px 10px 14px}#copyall[disabled]{display:none}
.evbox>summary{padding-left:14px}.evin{padding:0 14px 16px}.evbar .pick{flex:1 1 100%}.evbar .pick select{max-width:none}.evcount{margin-left:0}.claim{grid-template-columns:36px minmax(0,1fr)}.cb{padding-right:4px}.ob{padding:10px 12px}}`;

// The page's own script. It reads everything it needs from DATA and never builds markup from text.
const CLIENT = `const tabs=document.getElementById("tabs"),book=document.getElementById("book"),queueEl=document.getElementById("queue"),hint=document.getElementById("hint"),startBtn=document.getElementById("start"),copyAll=document.getElementById("copyall"),clearBtn=document.getElementById("clear"),statusEl=document.getElementById("status"),heldEl=document.getElementById("held"),stateEl=document.getElementById("state"),stateText=document.getElementById("statetext");
let pages=DATA.pages,current=pages.length-1,queue=[],live=DATA.live||{working:[],held:[],listening:false,progress:"",stale:[]},lost=false,rev=DATA.rev||"";
const picked={},barEl=document.getElementById("bar");
const say=(t)=>{statusEl.textContent=t};
const optionOf=(p,pick)=>pick[0]==="s"?pages[p].steps[pick[1]][pick[2]||0]:pages[p].menu[pick[1]];
async function copy(text){try{await navigator.clipboard.writeText(text);return true}catch{}const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand("copy")}catch{}ta.remove();return ok}
function show(i){current=i;[...book.children].forEach((el,n)=>{el.hidden=n!==i});tabs.value=String(i);queue=[];draw();const ws=book.children[i]&&book.children[i].querySelector("[data-ws]");if(ws&&ws._fit)ws._fit()}
function buildTabs(){tabs.textContent="";for(let i=pages.length-1;i>=0;i--){const o=document.createElement("option");o.value=String(i);o.textContent=i===pages.length-1?"Latest: "+pages[i].tab:(i+1)+". "+pages[i].tab;tabs.appendChild(o)}document.getElementById("pick").hidden=pages.length<2}
tabs.addEventListener("change",()=>{show(Number(tabs.value));scrollTo(0,0)});
function selected(step){const s=book.children[current].querySelector('select[data-step="'+step+'"]');return s?Number(s.value):0}
function drawState(){
  const working=live.working.length>0;
  const is=!TOKEN||lost?"off":working?"working":live.listening?"listening":"off";
  stateEl.dataset.is=is;
  stateText.textContent=!TOKEN?"Not connected":lost?"This page lost its connection":working?"Working: "+live.working[0]+(live.working.length>1?" (+"+(live.working.length-1)+" after)":""):live.listening?"Your agent is listening":"Your agent is not listening";
  heldEl.textContent=(live.progress?live.progress+" ":"")+(live.held.length?"Waiting its turn: "+live.held.join(", then ")+".":"");
  const moved=live.stale||[];
  book.querySelectorAll("[data-stale]").forEach((el)=>{el.hidden=moved.length===0;el.textContent=moved.length?"The project's files changed after these previews were made ("+moved.join(", ")+"). Applying keeps those edits where it can and stops if it cannot.":""});
}
function fit(pane){pane.querySelectorAll(".dev").forEach((d)=>{const w=Number(d.dataset.w),h=Number(d.dataset.h),s=Math.min(1,(pane.clientWidth||w)/w),f=d.firstElementChild;d.style.width=w*s+"px";d.style.height=h*s+"px";f.style.width=w+"px";f.style.height=h+"px";f.style.transform="scale("+s+")"})}
// A running version that can be steered talks to this page only through messages. Each one is checked against the
// frame it must come from, read as data, capped and shown as text; none of them can start, apply or revise anything.
const frames=new WeakMap(),steers={};
addEventListener("message",(e)=>{const f=frames.get(e.source);if(!f||e.origin!=="null")return;const d=e.data;if(!d||typeof d!=="object"||Array.isArray(d)||d.keen!==1||typeof d.type!=="string")return;if(f.ws.isConnected&&f.ws._msg)f.ws._msg(f,d)});
const NAMES={a:"Link",button:"Button",h1:"Heading",h2:"Heading",h3:"Heading",h4:"Heading",h5:"Heading",h6:"Heading",p:"Text",span:"Text",strong:"Text",em:"Text",small:"Text",b:"Text",i:"Text",label:"Label",img:"Picture",picture:"Picture",figure:"Figure",figcaption:"Caption",svg:"Drawing",canvas:"Drawing",path:"Shape",rect:"Shape",circle:"Shape",input:"Field",textarea:"Field",select:"Menu",li:"List item",ul:"List",ol:"List",dl:"List",nav:"Navigation",header:"Header",footer:"Footer",main:"Main area",section:"Section",article:"Card",aside:"Side panel",form:"Form",table:"Table",tr:"Table row",td:"Cell",th:"Cell",div:"Block",time:"Time",blockquote:"Quote",hr:"Divider"};
const partName=(el)=>{const t=String(el.text||el.label||"");return (NAMES[el.tag]||el.tag)+(t?" “"+(t.length>44?t.slice(0,43)+"…":t)+"”":"")};
const rectOf=(a)=>{const n=(v)=>typeof v==="number"&&isFinite(v)?Math.max(-1e5,Math.min(1e5,v)):0;return a&&typeof a==="object"?{x:n(a.x),y:n(a.y),w:n(a.w),h:n(a.h)}:{x:0,y:0,w:0,h:0}};
const pointingHint=()=>matchMedia("(pointer: coarse)").matches?"Tap a part of this version to say what should change there.":"Click a part of this version, or use the arrow keys and Enter. Esc stops.";
function wireWs(page,p){
  const ws=page.querySelector("[data-ws]");if(!ws)return;
  const views=pages[p].views,key=pages[p].ws,first=Math.max(0,views.findIndex((v)=>v.suggested)>=0?views.findIndex((v)=>v.suggested):views.findIndex((v)=>!v.original));
  const st=picked[key]||(picked[key]={view:first,size:"phone",cmp:-1,pointing:false,open:false});
  if(st.view>=views.length)st.view=first;if(st.cmp>=views.length)st.cmp=-1;
  const $=(s)=>ws.querySelector(s);
  const panes=[...ws.querySelectorAll("[data-pane]")],form=$("[data-revise]"),box=form.querySelector("textarea"),applyBtn=$("[data-apply]"),askBtn=$("[data-ask]"),cmp=$("[data-compare]");
  const bar=$("[data-steer]"),pointBtn=$("[data-point]"),pointLabel=$("[data-point-label]"),tunesBtn=$("[data-tunes]"),tuneEl=$("[data-tune]"),resetBtn=$("[data-tune-reset]"),hintEl=$("[data-point-hint]");
  const pop=$("[data-pop]"),popWhat=$("[data-pop-what]"),popInput=$("[data-pop-input]"),notesEl=$("[data-pnotes]"),notesLabel=$("[data-pnotes-label]"),notesList=$("[data-pnote-list]"),tunedEl=$("[data-ptuned]");
  // What the person has pointed at and tuned, per version and revision: a new revision starts clean.
  const steerOf=(i)=>{const v=views[i],k=key+"\\n"+v.name+"\\n"+v.rev;return steers[k]||(steers[k]={points:[],pending:null,tuned:{},draft:""})};
  const steering=()=>Boolean(TOKEN&&views[st.view].steer);
  const main=()=>panes[0].querySelector("iframe");
  const tell=(f,msg)=>{try{if(f&&f.contentWindow)f.contentWindow.postMessage(Object.assign({keen:1},msg),"*")}catch{}};
  const values=(i)=>{const s=steerOf(i),out={};(views[i].tune||[]).forEach((t)=>{if(s.tuned[t.var]!==undefined){const v=tuneValue(t,s.tuned[t.var]);if(v!==null)out[t.var]=v}});return out};
  const tunedCount=(i)=>Object.keys(steerOf(i).tuned).length;
  const marks=()=>{const s=steerOf(st.view);tell(main(),{type:"marks",marks:s.points.map((q)=>({n:q.n,selector:q.el.selector})),pending:s.pending?{n:s.points.length+1,selector:s.pending.el.selector}:null})};
  const hint=(t)=>{hintEl.textContent=t};
  const restHint=()=>{const n=steerOf(st.view).points.length;hint(st.pointing?pointingHint():n?(n===1?"1 note on this version. It goes with Ask for this change.":n+" notes on this version. They go with Ask for these changes."):"")};
  const fill=(pane,i)=>{pane.textContent="";const cap=document.createElement("p");cap.className="cap";cap.textContent=views[i].name+(views[i].rev>1?" · revision "+views[i].rev:"");const m=ws.querySelector('[data-media="'+i+":"+st.size+'"]').cloneNode(true);m.removeAttribute("data-media");pane.append(cap,m);m.querySelectorAll("iframe[data-src]").forEach((f)=>{f.src=f.dataset.src;if(views[i].steer)frames.set(f.contentWindow,{ws,i,el:f,main:pane===panes[0]})});fit(pane)};
  const labels=()=>{
    const v=views[st.view],s=steerOf(st.view),n=s.points.length,t=tunedCount(st.view);
    askBtn.textContent=n+t>0?"Ask for these changes":"Ask for this change";
    applyBtn.textContent=v.original?"Keep it as it is":"Apply "+v.name+(t?" as tuned":"");
    resetBtn.hidden=!t;tunesBtn.textContent=t?"Tune · "+t+" changed":"Tune";
    const shown=(t,raw)=>t.type==="choice"?((t.options.find((o)=>o.value===raw)||{}).label||raw):(tuneValue(t,raw)||raw);
    const tl=(v.tune||[]).filter((t)=>s.tuned[t.var]!==undefined).map((t)=>t.label+" "+shown(t,t.value)+" \u2192 "+shown(t,s.tuned[t.var]));
    tunedEl.hidden=!tl.length;tunedEl.textContent=tl.length?"Tuned: "+tl.join(" · ")+". These values go with your request.":"";
    notesEl.hidden=!n;notesLabel.textContent=n===1?"1 note on a part":n+" notes on parts";notesList.textContent="";
    s.points.forEach((q,j)=>{const li=document.createElement("li"),b=document.createElement("span"),txt=document.createElement("div"),w=document.createElement("span"),said=document.createElement("span"),x=document.createElement("button");b.className="pn";b.textContent=String(q.n);w.className="pw";w.textContent=partName(q.el);said.className="ps";said.textContent=q.say;txt.append(w,said);x.type="button";x.textContent="Remove";x.setAttribute("aria-label","Remove note "+q.n);x.addEventListener("click",()=>{s.points.splice(j,1);s.points.forEach((r,m)=>{r.n=m+1});labels();marks();restHint();(notesList.querySelector("button")||box).focus()});li.append(b,txt,x);notesList.appendChild(li)});
  };
  const setTuned=(t,raw)=>{const s=steerOf(st.view);if(tuneValue(t,raw)===tuneValue(t,t.value))delete s.tuned[t.var];else s.tuned[t.var]=String(raw);tell(main(),{type:"tune",values:values(st.view)});labels()};
  const drawTune=()=>{
    const s=steerOf(st.view),list=steering()?views[st.view].tune||[]:[];tuneEl.textContent="";
    list.forEach((t)=>{
      const raw=s.tuned[t.var]!==undefined?s.tuned[t.var]:t.value,name=document.createElement("span");name.className="tn";name.textContent=t.label;
      if(t.type==="choice"){const g=document.createElement("div"),seg=document.createElement("div");g.className="tv";g.setAttribute("role","group");g.setAttribute("aria-label",t.label);seg.className="seg";
        t.options.forEach((o)=>{const b=document.createElement("button");b.type="button";b.textContent=o.label;b.setAttribute("aria-pressed",String(o.value===raw));b.addEventListener("click",()=>{setTuned(t,o.value);seg.querySelectorAll("button").forEach((x,m)=>x.setAttribute("aria-pressed",String(t.options[m].value===o.value)))});seg.appendChild(b)});
        g.append(name,seg);tuneEl.appendChild(g);return}
      const l=document.createElement("label"),input=document.createElement("input"),out=document.createElement("output");l.className="tv";input.type=t.type==="color"?"color":"range";input.setAttribute("aria-label",t.label);
      if(t.type==="number"){input.min=String(t.min);input.max=String(t.max);input.step=String(t.step)}
      input.value=String(raw);out.textContent=tuneValue(t,raw)||"";input.addEventListener("input",()=>{setTuned(t,input.value);out.textContent=tuneValue(t,input.value)||""});
      l.append(name,input,out);tuneEl.appendChild(l)});
    tunesBtn.hidden=!list.length;tuneEl.hidden=!list.length;
    if(st.open)tuneEl.removeAttribute("data-folded");else tuneEl.setAttribute("data-folded","");tunesBtn.setAttribute("aria-expanded",String(st.open));
  };
  const setPointing=(on)=>{st.pointing=Boolean(on)&&steering();ws.toggleAttribute("data-pointing",st.pointing);pointLabel.textContent=st.pointing?"Stop pointing":"Point at a part";tell(main(),{type:"point",on:st.pointing});if(st.pointing){const f=main();if(f)f.focus()}restHint()};
  // The note card sits beside the part the person picked, inside the stage, and is clamped to it.
  const placePop=()=>{
    const s=steerOf(st.view),f=main();if(!s.pending||!f||!steering()){pop.hidden=true;return}
    pop.hidden=false;const stage=pop.parentElement,sr=stage.getBoundingClientRect(),fr=f.getBoundingClientRect(),dev=f.parentElement,k=fr.width/(Number(dev.dataset.w)||fr.width||1),a=s.pending.at,w=pop.offsetWidth,h=pop.offsetHeight;
    const ox=fr.left-sr.left-stage.clientLeft,oy=fr.top-sr.top-stage.clientTop,top=Math.max(0,a.y)*k,bottom=Math.min(Number(dev.dataset.h)||1e4,a.y+a.h)*k;
    let y=oy+bottom+12;if(y+h>stage.clientHeight-8)y=oy+top-h-12;y=Math.max(8,Math.min(y,stage.clientHeight-h-8));
    const x=Math.max(8,Math.min(ox+Math.max(0,a.x)*k,stage.clientWidth-w-8));pop.style.left=x+"px";pop.style.top=y+"px";
  };
  const openPop=(el,at)=>{const s=steerOf(st.view);if(s.points.length>=DATA.max.points){hint("That is the most notes for one request. Send these first.");return}s.pending={el,at};popWhat.textContent="";const b=document.createElement("span");b.className="pn";b.textContent=String(s.points.length+1);popWhat.append(b,document.createTextNode(partName(el)));popInput.value=s.draft;placePop();popInput.focus();marks()};
  const closePop=(back)=>{const s=steerOf(st.view);s.pending=null;pop.hidden=true;marks();if(back){const f=main();if(st.pointing&&f)f.focus();else pointBtn.focus()}};
  ws._msg=(f,d)=>{
    if(d.type==="ready"){if(tunedCount(f.i))tell(f.el,{type:"tune",values:values(f.i)});if(f.main&&f.i===st.view&&f.el===main()){if(steerOf(f.i).points.length)marks();if(st.pointing)tell(f.el,{type:"point",on:true})}return}
    if(!f.main||f.el!==main()||f.i!==st.view||!st.pointing||!steering()||book.children[current]!==page)return;
    if(d.type==="hover"){const el=d.el&&typeof d.el==="object"?cleanPoint({tag:d.el.tag,text:d.el.text,label:d.el.label,selector:"-"}):null;hint(el?partName(el)+". Press Enter to pick it.":pointingHint())}
    else if(d.type==="picked"){const el=cleanPoint(d.el);if(el){hint(pointingHint());openPop(el,rectOf(d.el.at))}}
    else if(d.type==="exit"){setPointing(false);pointBtn.focus()}
  };
  const drawWs=()=>{
    const v=views[st.view];
    ws.querySelectorAll("[data-view]").forEach((b)=>b.setAttribute("aria-pressed",String(Number(b.dataset.view)===st.view)));
    ws.querySelectorAll("[data-size]").forEach((b)=>b.setAttribute("aria-pressed",String(b.dataset.size===st.size)));
    cmp.value=String(st.cmp);const two=st.cmp>=0&&st.cmp!==st.view;ws.classList.toggle("two",two);panes[1].hidden=!two;
    steerOf(st.view).pending=null;pop.hidden=true;if(!steering())st.pointing=false;
    fill(panes[0],st.view);if(two)fill(panes[1],st.cmp);else panes[1].textContent="";
    $("[data-ws-name]").textContent=v.name+(v.rev>1?" · revision "+v.rev:"");
    $("[data-ws-bet]").textContent=v.bet;
    $("[data-ws-note]").textContent=v.rev>1&&v.note?"Changed: "+v.note:"";
    $("[data-ws-short]").textContent=v.name;
    if(v.revise)form.removeAttribute("data-plain");else form.setAttribute("data-plain","");
    applyBtn.hidden=!v.apply;applyBtn.disabled=!TOKEN;askBtn.disabled=!TOKEN;
    bar.hidden=!steering();ws.toggleAttribute("data-pointing",st.pointing);pointLabel.textContent=st.pointing?"Stop pointing":"Point at a part";
    drawTune();labels();restHint();
  };
  const send=async(kind,note)=>{
    const v=views[st.view],s=steerOf(st.view),body={k:TOKEN,page:p,picks:[[kind,st.view]],note};
    if(v.steer){body.tuned=Object.assign({},s.tuned);if(kind==="r")body.points=s.points.map((q)=>({say:q.say,el:q.el}))}
    try{
      const res=await fetch("/choose",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});if(!res.ok)throw new Error(String(res.status));
      const out=await res.json();live=out.live;
      const parts=[];if(kind==="r"&&s.points.length)parts.push(s.points.length===1?"1 note on a part":s.points.length+" notes on parts");if(tunedCount(st.view))parts.push("your tuning");
      const what=(kind==="r"?"Asked for a change to "+v.name:v.original?"Keeping it as it is":"Applying "+v.name)+(parts.length?", with "+parts.join(" and "):"");
      say(out.delivered?what+". This page updates when it is done.":live.working.length?what+". It starts when the current work is done.":what+". Your agent is not listening right now. Say \\"continue\\" in the chat and it will pick this up.");
      if(kind==="r"){box.value="";s.points=[];s.pending=null;s.draft="";pop.hidden=true;marks();labels();restHint()}
    }catch{say("That did not go through. This page may have lost its connection. Ask your agent to open it again.")}
    drawState();
  };
  ws.querySelectorAll("[data-view]").forEach((b)=>b.addEventListener("click",()=>{st.view=Number(b.dataset.view);drawWs()}));
  ws.querySelectorAll("[data-size]").forEach((b)=>b.addEventListener("click",()=>{st.size=b.dataset.size;drawWs()}));
  cmp.addEventListener("change",()=>{st.cmp=Number(cmp.value);drawWs()});
  form.addEventListener("submit",(e)=>{e.preventDefault();const note=box.value.trim(),s=steerOf(st.view);if(!note&&!s.points.length&&!tunedCount(st.view)){say(steering()?"Say what should change first, point at a part, or tune a value.":"Say what should change first.");box.focus();return}send("r",note)});
  applyBtn.addEventListener("click",()=>send("a",""));
  pointBtn.addEventListener("click",()=>setPointing(!st.pointing));
  tunesBtn.addEventListener("click",()=>{st.open=!st.open;drawTune()});
  resetBtn.addEventListener("click",()=>{steerOf(st.view).tuned={};drawTune();tell(main(),{type:"tune",values:{}});labels();(tuneEl.querySelector("input,button")||pointBtn).focus()});
  pop.addEventListener("submit",(e)=>{e.preventDefault();const s=steerOf(st.view),said=popInput.value.trim().slice(0,DATA.max.say);if(!s.pending)return;if(!said){hint("Say what should change in this part first.");popInput.focus();return}s.points.push({n:s.points.length+1,el:s.pending.el,say:said});s.draft="";popInput.value="";closePop(true);labels();hint("Note "+s.points.length+" added."+(!st.pointing?"":matchMedia("(pointer: coarse)").matches?" Tap another part, or Stop pointing.":" Point at another part, or press Esc to stop."))});
  popInput.addEventListener("input",()=>{steerOf(st.view).draft=popInput.value});
  pop.addEventListener("keydown",(e)=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();closePop(true)}});
  $("[data-pop-cancel]").addEventListener("click",()=>closePop(true));
  ws._key=(n)=>{if(n<views.length){st.view=n;drawWs()}};ws._fit=()=>{panes.forEach(fit);placePop()};
  ws._esc=()=>{if(st.pointing){setPointing(false);pointBtn.focus()}};
  drawWs();
}
addEventListener("keydown",(e)=>{const ws=book.children[current]&&book.children[current].querySelector("[data-ws]");if(e.key==="Escape"&&ws&&ws._esc){ws._esc();return}if(e.metaKey||e.ctrlKey||e.altKey||/^(TEXTAREA|INPUT|SELECT)$/.test(e.target.tagName)||!/^[1-9]$/.test(e.key))return;if(ws&&ws._key)ws._key(Number(e.key)-1)});
addEventListener("resize",()=>{const ws=book.children[current]&&book.children[current].querySelector("[data-ws]");if(ws&&ws._fit)ws._fit()});
function draw(){
  queueEl.textContent="";
  queue.forEach((pick,n)=>{const li=document.createElement("li");li.textContent=optionOf(current,pick).label;const x=document.createElement("button");x.type="button";x.textContent="Remove";x.setAttribute("aria-label","Remove "+optionOf(current,pick).label);x.addEventListener("click",()=>{queue.splice(n,1);draw()});li.appendChild(x);queueEl.appendChild(li)});
  const page=book.children[current];
  page.querySelectorAll("[data-step-card]").forEach((card)=>{const i=Number(card.dataset.stepCard),on=queue.some((q)=>q[0]==="s"&&q[1]===i);card.classList.toggle("picked",on);const b=card.querySelector("[data-add]");b.setAttribute("aria-pressed",String(on));b.textContent=on?"Added. Remove":"Add"});
  const n=queue.length,working=live.working.length>0,direct=live.listening&&!working;
  hint.hidden=n>0;
  const hasSteps=pages[current].steps.length+pages[current].menu.length>0;
  barEl.classList.toggle("bare",!hasSteps);
  hint.textContent=working?"Add more if you want. It waits its turn.":direct?"Pick a step above, then press Start.":"Pick a step above. Start keeps it for your agent.";
  startBtn.disabled=n===0||!TOKEN;copyAll.disabled=n===0;clearBtn.hidden=n===0;
  startBtn.textContent=n<2?(direct?"Start":"Start next"):(direct?"Start these "+n+" in order":"Start these "+n+" next");
  drawState();
}
function wire(page,p){
  page.querySelectorAll("select[data-step]").forEach((s)=>s.addEventListener("change",()=>{const i=Number(s.dataset.step),o=pages[p].steps[i][Number(s.value)];page.querySelector('[data-why="'+i+'"]').textContent=o.why;page.querySelector('[data-cmd="'+i+'"]').textContent=o.command;page.querySelectorAll('[data-rests^="'+i+':"]').forEach((el)=>{el.hidden=el.dataset.rests!==i+":"+s.value});queue=queue.map((q)=>q[0]==="s"&&q[1]===i?["s",i,Number(s.value)]:q);draw()}));
  page.querySelectorAll("[data-add]").forEach((b)=>b.addEventListener("click",()=>{const i=Number(b.dataset.add),at=queue.findIndex((q)=>q[0]==="s"&&q[1]===i);if(at>=0)queue.splice(at,1);else queue.push(["s",i,selected(i)]);draw()}));
  page.querySelectorAll("[data-copy-step]").forEach((b)=>b.addEventListener("click",async()=>{const i=Number(b.dataset.copyStep);say(await copy(pages[p].steps[i][selected(i)].command)?"Copied. Paste it into your chat to start.":"Could not copy here. Select the command text and copy it by hand.")}));
  const all=page.querySelector("[data-all]");if(all)all.addEventListener("click",()=>{queue=pages[p].steps.map((_,i)=>["s",i,selected(i)]);draw();say("All added, in the order listed. Press Start when you are ready.")});
  const menu=page.querySelector("select[data-menu]");
  if(menu){const sync=()=>{const m=pages[p].menu[Number(menu.value)];page.querySelector("[data-menu-why]").textContent=m.why;page.querySelector("[data-menu-cmd]").textContent=m.command};menu.addEventListener("change",sync);
    page.querySelector("[data-add-menu]").addEventListener("click",()=>{queue.push(["m",Number(menu.value)]);draw()});
    page.querySelector("[data-copy-menu]").addEventListener("click",async()=>{say(await copy(pages[p].menu[Number(menu.value)].command)?"Copied. Paste it into your chat to start.":"Could not copy here.")})}
  wireWs(page,p);
  wireEv(page,p);
  page.querySelectorAll("[data-jump]").forEach((b)=>b.addEventListener("click",()=>{const ev=page.querySelector("[data-ev]");if(ev&&ev._open)ev._open(b.dataset.jump)}));
}
// The evidence on a page: filters, ticks and the packet. What the person ticked and opened survives a refresh of the page.
const evState={};
function save(name,text){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"application/json"}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
function wireEv(page,p){
  const ev=page.querySelector("[data-ev]");if(!ev)return;
  const box=ev.querySelector("[data-ev-box]"),rows=[...ev.querySelectorAll("[data-claim]")],btn=ev.querySelector("[data-packet]"),count=ev.querySelector("[data-ev-count]"),empty=ev.querySelector("[data-ev-empty]");
  const sel={subject:ev.querySelector("[data-ev-subject]"),scope:ev.querySelector("[data-ev-scope]"),kase:ev.querySelector("[data-ev-case]")};
  const ids=rows.map((r)=>r.dataset.claim);
  const st=evState[p]||(evState[p]={open:false,ticks:[],subject:"",scope:"",kase:sel.kase?sel.kase.value:""});
  st.ticks=st.ticks.filter((id)=>ids.includes(id));
  const has=(r,k,v)=>!v||(r.dataset[k]||"").split(" ").includes(v);
  const sync=()=>{
    let shown=0;
    rows.forEach((r)=>{const on=has(r,"subjects",st.subject)&&has(r,"scopes",st.scope)&&has(r,"cases",st.kase);r.hidden=!on;if(on)shown+=1;r.querySelector("[data-tick]").checked=st.ticks.includes(r.dataset.claim)});
    ev.querySelectorAll("[data-case]").forEach((el)=>{el.hidden=Boolean(st.kase)&&el.dataset.case!==st.kase});
    if(count)count.textContent=shown===rows.length?rows.length+(rows.length===1?" claim":" claims"):"Showing "+shown+" of "+rows.length;
    if(empty)empty.hidden=shown>0||!rows.length;
    if(btn){const n=st.ticks.length;btn.disabled=n===0;btn.textContent=n?"Download packet ("+n+(n===1?" claim)":" claims)"):"Download packet"}
  };
  box.open=st.open;box.addEventListener("toggle",()=>{st.open=box.open});
  for(const k of Object.keys(sel))if(sel[k]){sel[k].value=st[k];sel[k].addEventListener("change",()=>{st[k]=sel[k].value;sync()})}
  rows.forEach((r)=>r.querySelector("[data-tick]").addEventListener("change",(e)=>{const id=r.dataset.claim;st.ticks=st.ticks.filter((x)=>x!==id);if(e.target.checked)st.ticks.push(id);sync()}));
  if(btn)btn.addEventListener("click",()=>{try{const b=pages[p].evidence,chosen=b.claims.map((c)=>c.id).filter((id)=>st.ticks.includes(id)),packet=EV.evidencePacket(b,chosen);save((b.id+"-packet.json").replace(/[^A-Za-z0-9._-]+/g,"-"),JSON.stringify(packet,null,2)+"\\n");say("Downloaded a packet of "+packet.claims.length+(packet.claims.length===1?" claim":" claims")+" and the "+packet.observations.length+" observations behind them. It was made on this page and sent nowhere.")}catch(err){say("Could not make the packet: "+err.message)}});
  ev._open=(id)=>{
    const r=rows.find((x)=>x.dataset.claim===id);if(!r)return;
    if(r.hidden){st.subject="";st.scope="";st.kase="";for(const k of Object.keys(sel))if(sel[k])sel[k].value="";sync()}
    box.open=true;st.open=true;const d=r.querySelector("details");d.open=true;
    r.classList.add("flash");setTimeout(()=>r.classList.remove("flash"),1600);
    r.scrollIntoView({block:"center",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});d.querySelector("summary").focus({preventScroll:true});
  };
  sync();
}
async function start(){
  if(!queue.length||!TOKEN)return;const labels=queue.map((q)=>optionOf(current,q).label),rests=queue.some((q)=>((optionOf(current,q)||{}).claims||[]).length>0);
  try{
    const res=await fetch("/choose",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({k:TOKEN,page:current,picks:queue})});
    if(!res.ok)throw new Error(String(res.status));
    const out=await res.json();live=out.live;queue=[];
    say((out.delivered?"Started: "+labels.join(", then ")+". Keep reading. This page turns when the work is done.":live.working.length?"Got it: "+labels.join(", then ")+". It starts when the current work is done.":"Kept: "+labels.join(", then ")+". Your agent is not listening right now. Say \\"continue\\" in the chat and it will pick this up.")+(rests?" The evidence it rests on goes with it.":""));
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
    const turned=s.count!==pages.length,redone=!turned&&s.rev&&s.rev!==rev;rev=s.rev||rev;
    if(redone){const box=book.children[current]&&book.children[current].querySelector("[data-revise] textarea"),typed=box?box.value:"",at=current;const fresh=await (await fetch("/pages?k="+TOKEN,{cache:"no-store"})).json();pages=fresh.pages;book.innerHTML=fresh.html.map((h)=>'<section class="page">'+h+"</section>").join("");[...book.children].forEach(wire);buildTabs();live=s.live;show(Math.min(at,pages.length-1));const again=book.children[current].querySelector("[data-revise] textarea");if(again)again.value=typed;say("Updated: "+pages[current].tab+".")}
    else if(turned){const fresh=await (await fetch("/pages?k="+TOKEN,{cache:"no-store"})).json();pages=fresh.pages;book.innerHTML=fresh.html.map((h)=>'<section class="page">'+h+"</section>").join("");[...book.children].forEach(wire);buildTabs();live=s.live;show(pages.length-1);scrollTo(0,0);say("New page: "+pages[pages.length-1].tab+".")}
    else if(JSON.stringify(s.live)!==JSON.stringify(live)){live=s.live;draw()}
  }catch{misses+=1;if(misses>2&&!lost){lost=true;draw()}}
}
[...book.children].forEach(wire);buildTabs();show(current);
if(TOKEN){poll();setInterval(poll,1500)}`;

const clientData = (pages) => pages.map((p, i) => ({ tab: String(p.tab || p.title || `Page ${i + 1}`), steps: (p.steps || []).map(optionsOf), menu: (p.menu || []).filter((m) => m.command).map((m) => ({ label: String(m.label ?? ""), why: String(m.why ?? ""), command: String(m.command) })), ws: String(p.workspace?.id ?? ""), views: viewsOf(p).map((v) => ({ name: String(v.name), bet: String(v.bet ?? ""), note: String(v.note ?? ""), rev: Number(v.rev) || 1, original: Boolean(v.original), suggested: Boolean(v.suggested), apply: Boolean(v.apply), revise: Boolean(v.revise), steer: Boolean(v.revise && LIVE_FILE.test(String(v.live ?? ""))), tune: v.revise && v.live ? tuneOf(v) : [] })), evidence: p.evidence || null }));
// The page reads points and tuned values with the same functions the server checks them with.
const STEER = `${cleanPoint.toString()}\n${tuneValue.toString()}`;
if (/<\/?script|<!--/i.test(STEER)) throw new Error("cleanPoint and tuneValue are placed inside the page's script and must not hold a script tag.");
const inScript = (value) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
const NO_LIVE = { working: [], held: [], listening: false, progress: "", stale: [] };
const liveKeyOf = (token) => (token ? crypto.createHash("sha256").update(`${token}:live`).digest("hex").slice(0, 32) : "");

/** The whole page as one HTML document. `live` is { token, state } when a server is behind it. */
export function render(pages, { baseDir = process.cwd(), live = null } = {}) {
  const list = Array.isArray(pages) ? pages : [pages];
  const html = list.map((p) => renderPage(p, { baseDir, liveKey: liveKeyOf(live?.token) }));
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(list.at(-1)?.title || "Keen")}</title>
<style>${STYLE}</style>
<body>
<header class="top"><div class="in"><span class="brand"><svg viewBox="0 0 23 32" fill="currentColor" aria-hidden="true"><path d="M9.66 4L13.34 4L21.72 22.63A21.2 21.2 0 0 0 16.42 20.58L11.5 9.66L6.59 20.58A21.2 21.2 0 0 0 1.28 22.63ZM0 25.83A19.2 19.2 0 0 1 23 25.83L20.61 29.03A15.2 15.2 0 0 0 2.4 29.03Z"/></svg>AtlasScope</span><span class="tool">${esc(list.at(-1)?.area || "Keen")}</span><label class="pick" id="pick" hidden><select id="tabs" aria-label="Pages in this piece of work"></select></label><span class="state" id="state" role="status" aria-live="polite"><i aria-hidden="true"></i><span id="statetext"></span></span></div></header>
<main>
<div id="book">${html.map((h) => `<section class="page">${h}</section>`).join("\n")}</div>
</main>
<div id="bar"><p id="status" role="status" aria-live="polite"></p><p id="held"></p><div class="in"><p class="hint" id="hint"></p><ol id="queue" aria-label="Your run, in order"></ol><button type="button" id="clear" hidden>Clear</button><button type="button" id="copyall">Copy</button><button type="button" class="go" id="start">Start</button></div></div>
<script>
const DATA = ${inScript({ pages: clientData(list), live: live?.state || NO_LIVE, rev: live?.rev || "", max: { points: POINTS, say: POINT_SAY } })};
const TOKEN = ${inScript(live?.token || "")};
const EV = (() => {
${ENGINE}
return { evidencePacket };
})();
${STEER}
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

// What a credential looks like. Deliberately narrow: each pattern is a shape real secrets have and ordinary
// text does not. A match refuses the page and says where; nothing is removed on the producer's behalf.
const SECRETS = [
  [/-----BEGIN [A-Z0-9 ]*PRIVATE KEY(?: BLOCK)?-----/g, "a private key"],
  [/\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:([^\s/@]+)@/gi, "an address with a password in it", (m) => !/^(\*+|x+|<[^>]*>|\$\{[^}]*\}|\[?redacted\]?|\.{3})$/i.test(m[1])],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/g, "a GitHub token"],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}/g, "a GitHub token"],
  [/\bsk-[A-Za-z0-9_-]{20,}/g, "an API key", (m) => /\d/.test(m[0])],
  [/\bxox[abposr]-[A-Za-z0-9-]{10,}/g, "a Slack token"],
  [/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, "an AWS access key"],
];

/** Where a value seems to hold a credential, as plain sentences ("a GitHub token in evidence.sources[0].method"). */
export function credentialsIn(value, where = "evidence", key = "", out = []) {
  if (out.length >= 5) return out;
  if (typeof value === "string") {
    if (key && value.includes(key)) out.push(`this page's own key in ${where}`);
    for (const [pattern, what, real] of SECRETS) for (const m of value.matchAll(pattern)) if (!real || real(m)) { out.push(`${what} in ${where}`); break; }
  } else if (Array.isArray(value)) value.forEach((v, i) => credentialsIn(v, `${where}[${i}]`, key, out));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) {
    // A key that is itself a secret is never written into the location.
    const named = credentialsIn(k, `a key name in ${where}`, key, []);
    out.push(...named);
    credentialsIn(v, named.length ? `${where}[that key]` : /^[A-Za-z_$][\w$]*$/.test(k) ? `${where}.${k}` : `${where}[${JSON.stringify(k)}]`, key, out);
  }
  return out.slice(0, 5);
}

// A page's evidence must be a valid bundle with nothing secret in it, and every claim a step rests on must be in it.
function checkEvidence(dir, page) {
  if (page.evidence !== undefined) {
    // Look for secrets first: a validation error quotes the value it rejects, and that value could be one.
    const found = credentialsIn(page.evidence, "evidence", readJson(path.join(dir, "server.json"), {}).token);
    if (found.length) throw new Error(`The evidence looks like it holds a credential, so the page was not added. Take each one out of the evidence (a placeholder such as *** is fine) and add the page again:\n- ${found.join("\n- ")}`);
    try { validateBundle(page.evidence); } catch (error) { throw new Error(`The page's evidence is not a valid ${SCHEMA} bundle: ${error.message}. references/evidence.md shows the shape.`); }
  }
  const known = new Set((page.evidence?.claims || []).map((c) => c.id));
  (page.steps || []).forEach((step, i) => [step, ...(Array.isArray(step?.options) ? step.options : [])].forEach((o, j) => {
    if (o?.claims === undefined) return;
    const where = j ? `steps[${i}].options[${j - 1}].claims` : `steps[${i}].claims`;
    if (!Array.isArray(o.claims) || !o.claims.length || o.claims.some((c) => typeof c !== "string") || new Set(o.claims).size !== o.claims.length) throw new Error(`${where} must be a list of claim ids from the page's evidence.`);
    if (!page.evidence) throw new Error(`${where} names claims, but the page has no evidence.`);
    const missing = o.claims.filter((c) => !known.has(c));
    if (missing.length) throw new Error(`${where} names ${missing.join(", ")}, which the page's evidence does not have.`);
  }));
}

/** Add the next page to a book. Screenshots named by path are copied in, so the originals can be thrown away. */
export function addPage(dir, page, { baseDir = process.cwd() } = {}) {
  if (!page || typeof page !== "object" || !String(page.title || "").trim()) throw new Error("A page needs at least a title.");
  const stored = { ...page, shots: (page.shots || []).map((s) => ({ ...s, src: image(s.src, baseDir) })) };
  const lives = [];
  if (page.workspace) {
    const id = String(page.workspace.id ?? "");
    if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(id)) throw new Error("A workspace needs an id: a short lowercase name such as pricing-header.");
    const views = viewsOf(page);
    if (views.length < 2) throw new Error("A workspace needs at least two views: the original and one alternative.");
    const tuning = views.flatMap((v, i) => tuneProblems(v, `workspace.views[${i}] (${v.name})`));
    if (tuning.length) throw new Error(`The workspace's tuning cannot be drawn. Fix these and add it again:\n- ${tuning.join("\n- ")}`);
    stored.workspace = { ...page.workspace, id, views: views.map((v) => {
      const out = { ...v };
      for (const size of ["phone", "desktop"]) if (v[size]) out[size] = image(v[size], baseDir);
      if (v.url && !LOCAL_URL.test(v.url)) throw new Error(`View ${v.name}: url must be an http address on this computer (127.0.0.1 or localhost).`);
      if (v.live) {
        const html = fs.readFileSync(path.resolve(baseDir, String(v.live)));
        if (html.length > LIVE_MAX) throw new Error(`View ${v.name}: the live page is over ${LIVE_MAX / 1e6} MB. It must be one self-contained HTML file.`);
        out.live = `live-${crypto.createHash("sha256").update(html).digest("hex").slice(0, 16)}.html`;
        lives.push([out.live, html]);
      }
      if (!out.live && !out.url && !out.phone && !out.desktop) throw new Error(`View ${v.name} has nothing to show: give it live, url, phone or desktop.`);
      return out;
    }) };
  }
  checkEvidence(dir, page);
  const long = tooLong(page);
  if (long.length) throw new Error(`This page has too many words. Shorten these and add it again:\n- ${long.join("\n- ")}`);
  renderPage(stored); // fail now, with a clear message, on anything the page cannot show
  fs.mkdirSync(dir, { recursive: true });
  const book = readBook(dir);
  for (const [name, html] of lives) fs.writeFileSync(path.join(dir, name), html);
  const last = book.at(-1);
  // The same workspace sent again is the same page, updated where it stands. A view whose preview changed is a new revision.
  const same = Boolean(stored.workspace && last?.workspace?.id === stored.workspace.id);
  if (stored.workspace) for (const v of stored.workspace.views) {
    const was = same ? last.workspace.views.find((o) => o.name === v.name) : null;
    const shown = (x) => JSON.stringify([x.live, x.url, x.phone, x.desktop, x.tune]);
    v.rev = was ? (Number(was.rev) || 1) + (shown(was) === shown(v) ? 0 : 1) : 1;
  }
  if (book.length && JSON.stringify(last) === JSON.stringify(stored)) return book.length; // the same page sent twice is one page
  const n = book.length + (same ? 0 : 1);
  fs.writeFileSync(path.join(dir, `page-${n}.json`), JSON.stringify(stored));
  return n;
}

const LIVE_MAX = 4_000_000;
const BODY_MAX = 65_536; // a start from the page: a request with notes on parts is the largest
const SLICE_MS = 240_000; // a wait is answered at least this often, so no connection sits idle long enough to be cut
const IDLE_MS = 12 * 60 * 60_000;

/**
 * Write a packet of these claims from a page's evidence into the book folder and return its absolute path.
 * The file is named by its contents, written whole or not at all, and never holds the page's key.
 */
export function writePacket(dir, page, claimIds, key = "") {
  if (!page?.evidence) throw new Error("That page has no evidence.");
  const text = `${JSON.stringify(evidencePacket(page.evidence, claimIds), null, 2)}\n`;
  if (key && text.includes(key)) throw new Error("The packet would hold this page's key, so it was not written.");
  const file = path.resolve(dir, `packet-${crypto.createHash("sha256").update(text).digest("hex").slice(0, 16)}.json`);
  if (readText(file) === text) return file;
  const tmp = `${file}.${crypto.randomBytes(6).toString("hex")}.tmp`;
  fs.writeFileSync(tmp, text, { flag: "wx", mode: 0o600 });
  try { fs.renameSync(tmp, file); } catch (error) { fs.rmSync(tmp, { force: true }); throw error; }
  return file;
}
const readText = (file) => { try { return fs.readFileSync(file, "utf8"); } catch { return null; } };

// Keen's alternatives keep their source files with workspace.mjs. A copy of this page that ships without it
// has no alternatives, so nothing is ever stale.
async function workspaceStatus() {
  try { return (await import("./workspace.mjs")).status; } catch (error) { if (error?.code === "ERR_MODULE_NOT_FOUND") return null; throw error; }
}

/**
 * Serve a book on this computer until stopped. Resolves once it is listening, with { url, port, token, close }.
 * It keeps three things the page shows: whether an agent is waiting, what it is working on, and what was
 * started in the meantime and is waiting its turn.
 */
export async function serve(dir, { port, idleMs = IDLE_MS, sliceMs = SLICE_MS } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const sourceStatus = await workspaceStatus();
  const serverFile = path.join(dir, "server.json");
  const saved = readJson(serverFile, {});
  const token = /^[0-9a-f]{32}$/.test(saved.token || "") ? saved.token : crypto.randomBytes(16).toString("hex");
  // The address is kept after the server stops, so a page left open finds it again when it restarts.
  const state = { working: [], held: [], progress: "" };
  const waiters = new Set();
  let cache = { stamp: "", pages: [] };
  const pages = () => {
    const stamp = fs.readdirSync(dir).filter((n) => /^page-\d+\.json$/.test(n)).map((n) => { const st = fs.statSync(path.join(dir, n)); return `${n}:${st.size}:${st.mtimeMs}`; }).join(",");
    if (stamp !== cache.stamp) cache = { stamp, pages: readBook(dir) };
    return cache.pages;
  };
  // Whether the project's files moved since the previews were made is read from disk, at most once a second.
  let seen = { at: 0, stale: [] };
  const stale = () => { if (sourceStatus && Date.now() - seen.at > 1000) { let changed = []; try { changed = sourceStatus(dir).changed; } catch { /* no source kept for this work */ } seen = { at: Date.now(), stale: changed }; } return seen.stale; };
  const live = () => ({ working: state.working.map((w) => w.label), held: state.held.map((h) => h.label), listening: waiters.size > 0, progress: state.progress, stale: stale() });
  const rev = () => { pages(); return crypto.createHash("sha256").update(cache.stamp).digest("hex").slice(0, 12); };
  const liveKey = liveKeyOf(token);
  const handOver = () => {
    if (!state.held.length || !waiters.size || state.working.length) return false;
    const [waiter] = waiters;
    waiters.delete(waiter);
    state.working = state.held.splice(0);
    state.progress = "";
    waiter({ chosen: state.working.map((w) => w.command), notes: state.working.map((w) => w.note || ""), evidence: state.working.map((w) => w.evidence || "") });
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
      const body = (then) => { let text = ""; req.on("data", (c) => { text += c; if (text.length > BODY_MAX) req.destroy(); }); req.on("end", () => { let data; try { data = JSON.parse(text); } catch { return send(400, "bad request"); } if (data?.k !== token) return send(403, "forbidden"); then(data); }); };
      if (req.method === "GET" && url.pathname === "/health") return json(200, { keen: true });
      if (req.method === "GET" && url.pathname === "/") return keyed ? send(200, render(pages(), { baseDir: dir, live: { token, state: live(), rev: rev() } }), "text/html; charset=utf-8") : send(403, "This link is missing its key. Open the full address your agent gave you.");
      if (req.method === "GET" && url.pathname === "/state") return keyed ? json(200, { count: pages().length, rev: rev(), live: live() }) : send(403, "forbidden");
      if (req.method === "GET" && url.pathname === "/pages") return keyed ? json(200, { pages: clientData(pages()), html: pages().map((p) => renderPage(p, { baseDir: dir, liveKey })) }) : send(403, "forbidden");
      // An alternative's own page, for the frame that shows it. It has its own key and is boxed in, so nothing
      // inside it can read the Keen page or press its buttons.
      if (req.method === "GET" && url.pathname.startsWith("/live/")) {
        const name = url.pathname.slice(6);
        if (url.searchParams.get("l") !== liveKey || !LIVE_FILE.test(name) || !fs.existsSync(path.join(dir, name))) return send(404, "not found");
        res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "content-security-policy": "sandbox allow-scripts allow-forms", "referrer-policy": "no-referrer" });
        // Only a version the person can steer gets the steering script; the original is served exactly as it is.
        const html = fs.readFileSync(path.join(dir, name));
        return res.end(pages().some((p) => viewsOf(p).some((v) => v.live === name && v.revise)) ? withSteering(html) : html);
      }
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
        let items;
        try {
          items = data.picks.map((pick) => { const command = commandFor(book[data.page], pick); if (!command) return null; const [kind, a, b = 0] = pick; const view = viewsOf(book[data.page])[a]; const label = kind === "s" ? optionsOf(book[data.page].steps[a])[b].label : kind === "m" ? String(book[data.page].menu[a].label ?? command) : `${kind === "a" ? (view.original ? "Keep" : "Apply") : "Revise"} ${view.name}`; return { command, label: label || command, note: kind === "r" || kind === "a" ? noteFor(view, kind, data) : "", asks: kind === "r", claims: kind === "s" ? optionsOf(book[data.page].steps[a])[b].claims : [] }; });
        } catch { return send(400, "that change could not be read"); }
        if (items.some((i) => i && i.asks && !i.note)) return send(400, "say what should change");
        if (items.some((i) => !i) || state.held.length + items.length > 24) return send(400, "unknown choice");
        // A step that rests on claims goes with a packet of them, written now, from the page the person started it on.
        try { for (const item of items) if (item.claims.length) item.evidence = writePacket(dir, book[data.page], item.claims, token); } catch { return send(500, "the evidence packet could not be written"); }
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

/** A typed request as one plain line: no control characters, no line breaks, a fixed most. */
export const cleanNote = (text) => String(text ?? "").replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim().slice(0, NOTE_MAX);

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
    if (out.chosen) return Object.assign(out.chosen, { notes: out.notes || [], evidence: out.evidence || [] });
    if (out.stopped) return null;
  }
  return null;
}

const readStdin = () => new Promise((resolve, reject) => { let text = ""; process.stdin.setEncoding("utf8"); process.stdin.on("data", (c) => { text += c; }); process.stdin.on("end", () => resolve(text)); process.stdin.on("error", reject); });

async function main(argv) {
  const [verb, name, ...rest] = argv.slice(2);
  const opt = (flag) => { const i = rest.indexOf(`--${flag}`); return i === -1 ? undefined : rest[i + 1]; };
  const usage = "Usage: node worksheet.mjs open|add|wait|say|stop <name>   (add reads a page's JSON on standard input)\n       node worksheet.mjs packet <name> <page number> <claim id,...>";
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
    chosen.forEach((command, i) => { console.log(`CHOSEN: ${command}`); if (chosen.notes?.[i]) console.log(`NOTE: ${chosen.notes[i]}`); if (chosen.evidence?.[i]) console.log(`EVIDENCE: ${chosen.evidence[i]}`); });
    return;
  }
  if (verb === "packet") {
    const [number, ids = ""] = rest, book = readBook(dir), page = book[Number(number) - 1];
    if (!/^[1-9]\d*$/.test(String(number ?? "")) || !page) throw new Error(`There is no page ${number ?? ""}: this piece of work has ${book.length}. Give the number "add" printed after PAGE:.`);
    console.log(`EVIDENCE: ${writePacket(dir, page, ids.split(",").map((s) => s.trim()).filter(Boolean), readJson(path.join(dir, "server.json"), {}).token)}`);
    return;
  }
  if (verb === "say") { const info = await running(dir); if (info) await post(info, "/say", { text: rest.filter((r) => !r.startsWith("--")).join(" ") }); return; }
  if (verb === "stop") { const info = await running(dir); if (info) await post(info, "/stop"); console.log("STOPPED"); return; }
  console.error(usage); process.exit(2);
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) main(process.argv).catch((error) => { console.error(`keen page: ${error.message}`); process.exit(1); });
