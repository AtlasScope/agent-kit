#!/usr/bin/env node
// Studio: makes, serves and updates a live studio page. Needs only Node.
//
//   node studio.mjs new     <dir>   write a fresh studio page to <dir>/index.html (refuses to overwrite without --force)
//                                   --modules button,palette,type picks the studios in it (default: button)
//   node studio.mjs add     <dir> <module>   add a studio to an existing page, keeping everything in it
//   node studio.mjs list            the studios this skill has
//   node studio.mjs open    <dir>   start the page's local server if it is not running; prints "URL: ..."
//                                   --at palette or --at button/material opens straight there
//   node studio.mjs wait    <dir>   run in the background; prints what the person sent, then exits:
//                                     MORE: {json}          they asked for more choices
//                                     MODULE: name          they asked for another studio in the workspace
//                                     SPEC: ... END SPEC    their finished choices
//                                     PAGE ERROR: ...       the page, or the last edit to it, is broken
//                                   exits 3 with NO_REQUEST after --minutes (default 30) of quiet
//   node studio.mjs check   <dir>   after every edit: the page parses and every added choice can show
//   node studio.mjs state   <dir>   the person's current choices as JSON
//   node studio.mjs refresh <dir>   rebuild the page from this skill, keeping its PROJECT, MORE and added CSS and icons
//   node studio.mjs stop    <dir>   stop the server
//   node studio.mjs cloud   <dir>   in a cloud session: write <dir>/cloud.html, the same page ready to publish on claude.ai
//
// <dir> is the studio folder, or its index.html. Server files, saved choices and the request queue live in
// <dir>/.studio/.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { build, rebuild, cloudPage, modules, modulesOf } from "./lib/build.mjs";
import { checkHtml, scriptsOf } from "./lib/check.mjs";
import { serve, metaDir, readJSON } from "./lib/server.mjs";

const SELF = fileURLToPath(import.meta.url);
const [verb, target, ...rest] = process.argv.slice(2);
const flag = (name, fallback) => { const i = rest.indexOf("--" + name); return i < 0 ? fallback : rest[i + 1] ?? true; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function die(message, code = 1) { console.error(message); process.exit(code); }

function studioDir(t, { mustExist = true } = {}) {
  if (!t) die("Name the studio folder, for example: node studio.mjs open .artifacts/design/install-button");
  let p = path.resolve(t);
  if (fs.existsSync(p) && fs.statSync(p).isFile()) p = path.dirname(p);
  if (mustExist && !fs.existsSync(path.join(p, "index.html"))) die(`No index.html in ${p}`);
  return p;
}
const pagePath = (dir) => path.join(dir, "index.html");
function printProblems(problems) { problems.forEach((p) => console.log("PROBLEM: " + p)); }

/** The running server for a folder, if it answers with the key on file. */
async function running(dir) {
  const s = readJSON(path.join(metaDir(dir), "server.json"), null);
  if (!s) return null;
  try {
    const r = await fetch(`http://127.0.0.1:${s.port}/api/status?k=${s.key}`, { signal: AbortSignal.timeout(1500) });
    if (r.ok) return s;
  } catch {}
  return null;
}

async function open(dir) {
  fs.mkdirSync(metaDir(dir), { recursive: true });
  let s = await running(dir);
  if (!s) {
    // Only one caller starts the server; others wait for it. A lock older than 10s was abandoned.
    const lock = path.join(metaDir(dir), "starting.lock");
    let mine = false;
    try { fs.writeFileSync(lock, String(process.pid), { flag: "wx" }); mine = true; } catch {
      try { if (Date.now() - fs.statSync(lock).mtimeMs > 10000) { fs.unlinkSync(lock); return open(dir); } } catch {}
    }
    try {
      if (mine) {
        const log = fs.openSync(path.join(metaDir(dir), "server.log"), "a");
        spawn(process.execPath, [SELF, "serve", dir], { detached: true, stdio: ["ignore", log, log] }).unref();
      }
      for (let i = 0; i < 60 && !(s = await running(dir)); i++) await sleep(100);
    } finally {
      if (mine) { try { fs.unlinkSync(lock); } catch {} }
    }
    if (!s) die(`The server did not start; see ${path.join(metaDir(dir), "server.log")}`);
  }
  const at = String(flag("at", "")).replace(/[^a-z0-9/_-]/gi, "");
  console.log(`URL: http://127.0.0.1:${s.port}/?k=${s.key}${at ? "#" + at : ""}`);
}

async function wait(dir) {
  const until = Date.now() + Number(flag("minutes", 30)) * 60e3;
  while (Date.now() < until) {
    const s = await running(dir);
    if (!s) die("SERVER_DOWN: run open first", 2);
    let items;
    try { items = (await (await fetch(`http://127.0.0.1:${s.port}/api/next?k=${s.key}`)).json()).items || []; } catch { await sleep(1000); continue; }
    if (!items.length) continue;
    for (const it of items) {
      if (it.kind === "more") { const { kind, at, ...request } = it; console.log("MORE: " + JSON.stringify(request)); }
      else if (it.kind === "module") console.log("MODULE: " + it.module);
      else if (it.kind === "spec") console.log("SPEC:\n" + it.text + "\nEND SPEC");
      else if (it.kind === "error") console.log("PAGE ERROR: " + it.message);
    }
    return;
  }
  console.log("NO_REQUEST");
  process.exit(3);
}

const COMMANDS = {
  serve: () => serve(studioDir(target)),
  new: () => {
    const dir = studioDir(target, { mustExist: false });
    if (fs.existsSync(pagePath(dir)) && !flag("force", false)) die(`${pagePath(dir)} already exists. Use refresh to update it, or --force to replace it.`);
    fs.mkdirSync(dir, { recursive: true });
    let html;
    try { html = build({ modules: String(flag("modules", "button")).split(",") }); } catch (e) { die(e.message); }
    fs.writeFileSync(pagePath(dir), html);
    console.log("CREATED: " + pagePath(dir));
    console.log("STUDIOS: " + modulesOf(html).join(", "));
  },
  list: () => { for (const [id, m] of Object.entries(modules())) console.log(`${id}: ${m.name}`); },
  add: () => {
    const f = pagePath(studioDir(target)), name = rest.find((x) => !x.startsWith("--"));
    if (!name) die("Name the studio to add, for example: node studio.mjs add <dir> palette");
    let html;
    try { html = rebuild(fs.readFileSync(f, "utf8"), name.split(",")); } catch (e) { die(e.message); }
    const problems = checkHtml(html);
    if (problems.length) { printProblems(problems); die("Not written: the page would not pass check."); }
    fs.writeFileSync(f, html);
    console.log("STUDIOS: " + modulesOf(html).join(", "));
  },
  open: () => open(studioDir(target)),
  wait: () => wait(studioDir(target)),
  check: () => {
    const problems = checkHtml(fs.readFileSync(pagePath(studioDir(target)), "utf8"));
    if (problems.length) { printProblems(problems); process.exit(1); }
    console.log("OK");
  },
  refresh: () => {
    const f = pagePath(studioDir(target));
    let html;
    try { html = rebuild(fs.readFileSync(f, "utf8")); } catch (e) { die(e.message); }
    const problems = checkHtml(html);
    if (problems.length) { printProblems(problems); die("Not written: the refreshed page would not pass check."); }
    fs.writeFileSync(f, html);
    console.log("REFRESHED");
  },
  cloud: () => {
    // For a cloud session: the file to publish with the Artifact tool. Same page; it saves to the claude.ai store.
    const dir = studioDir(target), html = fs.readFileSync(pagePath(dir), "utf8");
    const problems = checkHtml(html);
    if (problems.length) { printProblems(problems); die("Not written: fix the page first."); }
    let p = {};
    try { const ctx = vm.createContext({}); vm.runInContext(scriptsOf(html)[0] + "\n;globalThis.__P=PROJECT;", ctx, { timeout: 500 }); p = ctx.__P || {}; } catch {}
    const title = `${p.name ? p.name + " " : ""}studio`;
    let out;
    try { out = cloudPage(html, title); } catch (e) { die(e.message); }
    fs.writeFileSync(path.join(dir, "cloud.html"), out);
    console.log("CLOUD_PAGE: " + path.join(dir, "cloud.html"));
    console.log("TITLE: " + title);
    console.log('CAPABILITIES: {"db":{}}');
  },
  state: () => {
    const st = readJSON(path.join(metaDir(studioDir(target)), "state.json"), null);
    console.log(st ? JSON.stringify({ choices: st.mods || { button: st.S }, changedScope: st.scope || "", pinned: (st.pins || []).map((p) => ({ name: p.name, studio: p.mod, choices: p.s })), viewing: st.nav ? (st.nav.review ? "review" : st.nav.mod + "/" + (st.nav.cat || {})[st.nav.mod]) : undefined }, null, 1) : "NO_STATE: the page has not saved anything yet (an offline copy saves in the browser only)");
  },
  stop: async () => {
    const s = await running(studioDir(target));
    if (!s) return console.log("NOT_RUNNING");
    try { await fetch(`http://127.0.0.1:${s.port}/api/stop?k=${s.key}`, { method: "POST" }); } catch {}
    console.log("STOPPED");
  },
};

if (!COMMANDS[verb]) die("Usage: node studio.mjs new|add|open|wait|check|state|refresh|stop|cloud <dir>, or: node studio.mjs list");
await COMMANDS[verb]();
