#!/usr/bin/env node
// Who depends on a file or symbol, what it depends on, and what running it does, with file:line anchors.
// It reads the tracked files of a Git checkout (their current bytes) and never runs them or writes anything.
//
//   node structure.mjs <path>... [--symbol <name>] [--depth <n>] [--root <repo>] [--limit <n>] [--json]
//
// Relationships stay separate, because they are different kinds of evidence:
//   import     a JS/TS module resolves to it (relative paths, tsconfig/jsconfig "paths", literal import()/require)
//   reads      a script reads it by a path the program can work out (a literal, path.join of literals and
//              of variables bound to them, new URL(.., import.meta.url))
//   generates  a script writes it, or its own header says which script generated it
//   runs       a command runs it: package.json scripts, CI steps, shell lines, child processes in scripts
//   mentions   a literal or a doc names its path, with no read, write or run worked out
//   same-name, shared-text   inferred: another file defines the same name, or repeats a long piece of its text
// Reach follows import, reads, generates and runs; mentions and inferred links are listed, never followed.
// Not seen: computed paths, framework routing and dispatch, other languages' imports, network and runtime
// behavior. A missing link is not proof of independence.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const P = path.posix;
const CODE = /\.(m?[jt]sx?|c[jt]s)$/;
const TEXT = /\.(md|mdx|json|jsonc|ya?ml|toml|sh|bash|txt|html?|css|svg|py|rb|go|rs|env\.example|gitignore|gitattributes)$|(^|\/)(Dockerfile|Makefile|\.github\/[^/]+\/[^/]+)$/;
const KINDS = ["import", "reads", "generates", "runs", "mentions"];
const FOLLOW = new Set(["import", "reads", "generates", "runs"]);
const MAX_BYTES = 2_000_000;

// ---------------------------------------------------------------------------------------------- tokens

const REGEX_AFTER = new Set(["return", "typeof", "instanceof", "in", "of", "new", "delete", "void", "throw", "case", "do", "else", "yield", "await"]);
const isIdStart = (c) => /[A-Za-z_$\u0080-￿]/.test(c);
const isId = (c) => /[\w$\u0080-￿]/.test(c);

/** JS/TS tokens with line numbers: identifiers, strings (template literals without substitutions count), punctuation. */
export function tokenize(src, firstLine = 1) {
  const out = [], comments = [];
  let i = 0, line = firstLine;
  const n = src.length;
  if (src.startsWith("#!")) while (i < n && src[i] !== "\n") i++;
  const prevSig = () => out[out.length - 1];
  const regexAllowed = () => {
    const p = prevSig();
    if (!p) return true;
    if (p.t === "id") return REGEX_AFTER.has(p.v);
    if (p.t === "str" || p.t === "tpl" || p.t === "num" || p.t === "re") return false;
    return !(p.v === ")" || p.v === "]");
  };
  function readString(q) {
    let j = i + 1, v = "";
    while (j < n) {
      const d = src[j];
      if (d === "\\") {
        const e = src[j + 1];
        if (e === "\n") { line++; j += 2; continue; }
        v += { n: "\n", t: "\t", r: "\r", "0": "\0" }[e] ?? e;
        j += 2;
        continue;
      }
      if (d === q) { out.push({ t: "str", v, line }); i = j + 1; return; }
      if (d === "\n") break; // an unterminated quote (JSX text such as Don't): drop it, keep the line count
      v += d;
      j++;
    }
    i = j;
  }
  function readTemplate() {
    const slot = out.length, at = line;
    out.push(null);
    i++;
    let v = "", simple = true;
    while (i < n) {
      const d = src[i];
      if (d === "\\") { if (src[i + 1] === "\n") line++; v += src[i + 1] ?? ""; i += 2; continue; }
      if (d === "`") { i++; break; }
      if (d === "$" && src[i + 1] === "{") { simple = false; v += "${}"; i += 2; code(true); continue; }
      if (d === "\n") line++;
      v += d;
      i++;
    }
    out[slot] = { t: simple ? "str" : "tpl", v, line: at };
  }
  function readRegex() {
    let j = i + 1, cls = false;
    while (j < n) {
      const d = src[j];
      if (d === "\n") return false;
      if (d === "\\") { j += 2; continue; }
      if (d === "[") cls = true;
      else if (d === "]") cls = false;
      else if (d === "/" && !cls) break;
      j++;
    }
    if (j >= n) return false;
    j++;
    while (j < n && /[a-z]/i.test(src[j])) j++;
    out.push({ t: "re", v: src.slice(i, j), line });
    i = j;
    return true;
  }
  function code(untilBrace) {
    let depth = 0;
    while (i < n) {
      const c = src[i];
      if (c === "\n") { line++; i++; continue; }
      if (c === " " || c === "\t" || c === "\r" || c === "﻿" || c === "\f" || c === "\v") { i++; continue; }
      if (c === "/" && src[i + 1] === "/") { const s = i; while (i < n && src[i] !== "\n") i++; comments.push({ v: src.slice(s + 2, i), line }); continue; }
      if (c === "/" && src[i + 1] === "*") {
        const end = src.indexOf("*/", i + 2), stop = end < 0 ? n : end + 2;
        comments.push({ v: src.slice(i + 2, stop - 2), line });
        for (let j = i; j < stop; j++) if (src[j] === "\n") line++;
        i = stop;
        continue;
      }
      if (c === '"' || c === "'") { readString(c); continue; }
      if (c === "`") { readTemplate(); continue; }
      if (c === "/" && regexAllowed() && readRegex()) continue;
      if (isIdStart(c)) {
        let j = i + 1;
        while (j < n && isId(src[j])) j++;
        out.push({ t: "id", v: src.slice(i, j), line });
        i = j;
        continue;
      }
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
        let j = i + 1;
        while (j < n && /[\w.]/.test(src[j])) j++;
        out.push({ t: "num", v: src.slice(i, j), line });
        i = j;
        continue;
      }
      if (c === "{") depth++;
      if (c === "}") {
        if (untilBrace && depth === 0) { i++; return; }
        depth--;
      }
      const three = src.slice(i, i + 3), two = src.slice(i, i + 2);
      const v = three === "..." ? three : ["=>", "?.", "??", "||", "&&"].includes(two) ? two : c;
      out.push({ t: "p", v, line });
      i += v.length;
    }
  }
  code(false);
  const toks = out.filter(Boolean);
  toks.comments = comments;
  return toks;
}

// ------------------------------------------------------------------------------------------ git + files

function git(root, args) {
  return execFileSync("git", ["-c", "core.quotepath=false", ...args], { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
}

export function repoName(root) {
  try {
    const url = git(root, ["remote", "get-url", "origin"]).trim();
    const m = /[/:]([\w.-]+\/[\w.-]+?)(\.git)?$/.exec(url);
    if (m) return m[1];
  } catch { /* no remote */ }
  return path.basename(root);
}

/** The checkout's tracked files, current revision and whether the working tree differs from it. */
export function snapshot(root) {
  const files = git(root, ["ls-files", "-z", "--cached"]).split("\0").filter(Boolean);
  let head = null;
  try { head = git(root, ["rev-parse", "HEAD"]).trim(); } catch { /* no commits yet */ }
  const changed = git(root, ["status", "--porcelain", "--untracked-files=no"]).split("\n").filter(Boolean).length;
  return { files, head, changed, revision: changed || !head ? "working-tree" : head };
}

// ----------------------------------------------------------------------------------------- resolution

const norm = (p) => {
  const x = P.normalize(p);
  return x === "." ? "" : x.replace(/^\.\//, "");
};
const escapes = (p) => p === ".." || p.startsWith("../");

function parseJsonc(text) {
  let out = "", i = 0, str = false;
  while (i < text.length) {
    const c = text[i];
    if (str) { out += c; if (c === "\\") { out += text[i + 1] ?? ""; i += 2; continue; } if (c === '"') str = false; i++; continue; }
    if (c === '"') { str = true; out += c; i++; continue; }
    if (c === "/" && text[i + 1] === "/") { while (i < text.length && text[i] !== "\n") i++; continue; }
    if (c === "/" && text[i + 1] === "*") { const e = text.indexOf("*/", i + 2); i = e < 0 ? text.length : e + 2; continue; }
    out += c;
    i++;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

class Repo {
  constructor(root) {
    this.root = root;
    const snap = snapshot(root);
    Object.assign(this, snap);
    this.tracked = new Set(this.files);
    this.dirs = new Set([""]);
    for (const f of this.files) { let d = P.dirname(f); while (d !== "." && !this.dirs.has(d + "/")) { this.dirs.add(d + "/"); d = P.dirname(d); } }
    const base = new Map();
    for (const f of this.files) { const b = P.basename(f); base.set(b, base.has(b) ? null : f); }
    this.byBase = base;
    this.text = new Map();
    this.tsconfigs = new Map();
  }
  read(rel) {
    if (this.text.has(rel)) return this.text.get(rel);
    let s = null;
    try {
      const abs = path.join(this.root, ...rel.split("/"));
      const st = fs.lstatSync(abs);
      if (st.isFile() && st.size <= MAX_BYTES) { s = fs.readFileSync(abs, "utf8"); if (s.includes("\0")) s = null; }
    } catch { /* deleted in the working tree */ }
    this.text.set(rel, s);
    return s;
  }
  onDisk(rel) {
    if (!rel || escapes(rel) || /(^|\/)(node_modules|\.git)\//.test(rel)) return false;
    try { return fs.statSync(path.join(this.root, ...rel.split("/"))).isFile(); } catch { return false; }
  }
  /** What a repository-relative path names: a tracked file, a tracked directory, an untracked file on disk, or nothing. */
  kind(rel) {
    if (rel === null || escapes(rel)) return null;
    if (this.tracked.has(rel)) return "file";
    if (this.dirs.has(rel.endsWith("/") ? rel : rel + "/")) return "dir";
    if (this.onDisk(rel)) return "untracked";
    return null;
  }
  /** The nearest tsconfig.json or jsconfig.json for a file, with its baseUrl and paths. */
  tsconfig(file) {
    let d = P.dirname(file);
    for (;;) {
      const key = d === "." ? "" : d;
      if (this.tsconfigs.has(key)) return this.tsconfigs.get(key);
      for (const name of ["tsconfig.json", "jsconfig.json"]) {
        const f = key ? `${key}/${name}` : name;
        if (!this.tracked.has(f)) continue;
        const cfg = this.loadConfig(f, 0);
        this.tsconfigs.set(key, cfg);
        return cfg;
      }
      if (key === "") { this.tsconfigs.set("", null); return null; }
      d = P.dirname(d);
    }
  }
  loadConfig(f, depth) {
    let raw;
    try { raw = parseJsonc(this.read(f) || "{}"); } catch { return null; }
    let base = { dir: P.dirname(f) === "." ? "" : P.dirname(f), baseUrl: null, paths: null };
    if (typeof raw.extends === "string" && raw.extends.startsWith(".") && depth < 4) {
      const parent = norm(P.join(base.dir, raw.extends.endsWith(".json") ? raw.extends : raw.extends + ".json"));
      const p = this.tracked.has(parent) ? this.loadConfig(parent, depth + 1) : null;
      if (p) base = { ...base, baseUrl: p.baseUrl, paths: p.paths };
    }
    const co = raw.compilerOptions || {};
    if (typeof co.baseUrl === "string") base.baseUrl = norm(P.join(base.dir, co.baseUrl));
    if (co.paths && typeof co.paths === "object") base.paths = { map: co.paths, from: base.baseUrl ?? base.dir };
    return base;
  }
  /** Resolve a module specifier the way TypeScript and Node usually do, without running anything. */
  module(spec, file) {
    const tryFile = (p) => {
      if (p === null || escapes(p)) return null;
      const stem = p.replace(/\.(m|c)?js$/, "");
      const ext = ["", ".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".json", ".d.ts"];
      for (const e of ext) if (this.tracked.has(p + e)) return p + e;
      if (stem !== p) for (const e of [".ts", ".tsx", ".mts", ".cts"]) if (this.tracked.has(stem + e)) return stem + e;
      for (const e of ext.slice(1)) if (this.tracked.has(`${p}/index${e}`)) return `${p}/index${e}`;
      if (/\.[a-z]+$/i.test(p) && this.onDisk(p)) return p;
      if (/\.json$/i.test(p)) return p; // generated or ignored: kept so the chain to its generator stays visible
      return null;
    };
    if (spec.startsWith(".")) return tryFile(norm(P.join(P.dirname(file), spec)));
    const cfg = this.tsconfig(file);
    if (cfg?.paths) {
      for (const [pattern, targets] of Object.entries(cfg.paths.map)) {
        const star = pattern.indexOf("*");
        const hit = star < 0 ? spec === pattern : spec.startsWith(pattern.slice(0, star)) && spec.endsWith(pattern.slice(star + 1));
        if (!hit) continue;
        const mid = star < 0 ? "" : spec.slice(star, spec.length - (pattern.length - star - 1));
        for (const t of targets) { const r = tryFile(norm(P.join(cfg.paths.from, t.replace("*", mid)))); if (r) return r; }
      }
    }
    if (cfg?.baseUrl !== null && cfg?.baseUrl !== undefined) { const r = tryFile(norm(P.join(cfg.baseUrl, spec))); if (r && this.tracked.has(r)) return r; }
    return null;
  }
  /** The nearest folder below the root with a package.json: npm scripts run there, and docs often name paths from it. */
  packageRoot(file) {
    this.pkgs ??= new Map();
    let d = P.dirname(file);
    const seen = [];
    while (d !== "." && d !== "") {
      if (this.pkgs.has(d)) { const v = this.pkgs.get(d); for (const s of seen) this.pkgs.set(s, v); return v; }
      seen.push(d);
      if (this.tracked.has(`${d}/package.json`)) { for (const s of seen) this.pkgs.set(s, d); return d; }
      d = P.dirname(d);
    }
    for (const s of seen) this.pkgs.set(s, null);
    return null;
  }
  /** Candidate repository paths for a literal path: from the repo root (scripts usually run there), the package folder, then the file's folder. */
  literal(v, file, { needSlash = true } = {}) {
    if (typeof v !== "string" || !v || v.length > 300 || /\s|:\/\/|[*?{}<>|"'`$\\]/.test(v) || /^[#\-/~]/.test(v) || !/[A-Za-z0-9]/.test(v) || /^[a-z]:/i.test(v)) return null;
    if (/^\.{1,2}(\/\.{1,2})*\/?$/.test(v)) return null;
    const hasSlash = v.includes("/"), hasExt = /\.[A-Za-z][\w-]{0,9}$/.test(v);
    if (needSlash && !hasSlash && !hasExt) return null;
    const rel = v.startsWith("./") || v.startsWith("../");
    const pkg = this.packageRoot(file);
    const cands = rel ? [norm(P.join(P.dirname(file), v))] : [norm(v), ...(pkg ? [norm(P.join(pkg, v))] : []), norm(P.join(P.dirname(file), v))];
    for (const c of cands) { const k = this.kind(c.replace(/\/$/, "")); if (k === "file" || k === "dir") return { path: k === "dir" ? c.replace(/\/?$/, "/") : c, kind: k, basis: "literal path" }; }
    if (!hasSlash && hasExt && this.byBase.get(v)) return { path: this.byBase.get(v), kind: "file", basis: "unique file name" };
    return null;
  }
}

// ---------------------------------------------------------------------------------------- JS analysis

const FS_READ = new Set(["readFileSync", "readFile", "readdirSync", "readdir", "createReadStream", "existsSync", "statSync", "stat", "lstatSync", "access", "accessSync", "opendirSync"]);
const FS_WRITE = new Set(["writeFileSync", "writeFile", "appendFileSync", "appendFile", "createWriteStream", "copyFileSync", "copyFile", "cpSync", "cp", "renameSync", "rename", "mkdirSync", "mkdir", "symlinkSync", "linkSync", "truncateSync", "mkdtempSync"]);
const FS_DELETE = new Set(["rmSync", "rm", "unlinkSync", "unlink", "rmdirSync", "rmdir"]);
const TWO_ARG = new Set(["copyFileSync", "copyFile", "cpSync", "cp", "renameSync", "rename", "symlinkSync", "linkSync"]);
const CP = new Set(["execFileSync", "execFile", "execSync", "exec", "spawn", "spawnSync", "fork"]);
const GIT_WRITES = new Set(["commit", "push", "reset", "checkout", "switch", "merge", "rebase", "stash", "clean", "add", "rm", "mv", "tag", "branch", "worktree", "restore", "apply", "am", "cherry-pick", "revert", "pull", "fetch", "init", "clone", "config", "update-ref"]);
const RUNNERS = new Set(["node", "nodejs", "tsx", "ts-node", "python", "python3", "sh", "bash", "zsh", "deno", "bun"]);
const MODULES = { fs: /^(node:)?fs(\/promises)?$/, cp: /^(node:)?child_process$/, http: /^(node:)?https?$/, path: /^(node:)?path$/ };

function matching(toks, k) {
  const open = toks[k].v, close = { "(": ")", "[": "]", "{": "}" }[open];
  let d = 0;
  for (let j = k; j < toks.length; j++) {
    if (toks[j].t !== "p") continue;
    if (toks[j].v === open) d++;
    else if (toks[j].v === close && --d === 0) return j;
  }
  return toks.length - 1;
}

/** Split a call's argument tokens at top-level commas. Returns [lo, hi) ranges. */
function args(toks, open) {
  const close = matching(toks, open), out = [];
  let d = 0, lo = open + 1;
  for (let j = open + 1; j < close; j++) {
    const v = toks[j].t === "p" ? toks[j].v : "";
    if (v === "(" || v === "[" || v === "{") d++;
    else if (v === ")" || v === "]" || v === "}") d--;
    else if (v === "," && d === 0) { out.push([lo, j]); lo = j + 1; }
  }
  if (lo < close) out.push([lo, close]);
  return out;
}

/** Imports, re-exports and literal import()/require, with the names they bring in. */
export function importsOf(toks) {
  const out = [];
  const isP = (k, v) => toks[k]?.t === "p" && toks[k].v === v;
  const isId = (k, v) => toks[k]?.t === "id" && (v === undefined || toks[k].v === v);
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.t !== "id" || isP(k - 1, ".") || isP(k - 1, "?.")) continue;
    if ((t.v === "require" || t.v === "import") && isP(k + 1, "(") && toks[k + 2]?.t === "str" && isP(k + 3, ")")) {
      out.push({ spec: toks[k + 2].v, line: t.line, how: t.v === "require" ? "require" : "dynamic import", names: null, at: k + 2 });
      continue;
    }
    if (t.v === "import" && !isP(k + 1, "(") && !isP(k + 1, ".")) {
      if (toks[k + 1]?.t === "str") { out.push({ spec: toks[k + 1].v, line: t.line, how: "side-effect import", names: [], at: k + 1 }); continue; }
      const names = [];
      let j = k + 1, type = false;
      if (isId(j, "type") && !isId(j + 1, "from")) { type = true; j++; }
      for (; j < toks.length && j < k + 400; j++) {
        if (isId(j, "from") && toks[j + 1]?.t === "str") break;
        if (isP(j, ";")) { j = -1; break; }
        if (isP(j, "*") && isId(j + 1, "as")) { names.push({ imported: "*", local: toks[j + 2]?.v }); j += 2; continue; }
        if (isP(j, "{")) {
          const end = matching(toks, j);
          for (let m = j + 1; m < end; m++) {
            if (isId(m, "type") && toks[m + 1]?.t === "id" && !isP(m + 1, ",")) continue;
            if (toks[m].t === "id" || toks[m].t === "str") {
              const imported = toks[m].v;
              let local = imported;
              if (isId(m + 1, "as")) { local = toks[m + 2]?.v; m += 2; }
              names.push({ imported, local });
            }
          }
          j = end;
          continue;
        }
        if (toks[j].t === "id" && !isP(j - 1, "{")) names.push({ imported: "default", local: toks[j].v });
      }
      if (j > 0 && toks[j + 1]?.t === "str") out.push({ spec: toks[j + 1].v, line: t.line, how: type ? "type-only import" : "static import", names, at: j + 1 });
      continue;
    }
    if (t.v === "export" && (isP(k + 1, "*") || isP(k + 1, "{") || (isId(k + 1, "type") && isP(k + 2, "{")))) {
      let j = k + 1;
      if (isId(j, "type")) j++;
      const names = [];
      if (isP(j, "*")) { names.push({ imported: "*", local: isId(j + 1, "as") ? toks[j + 2]?.v : "*" }); j = isId(j + 1, "as") ? j + 3 : j + 1; }
      else { const end = matching(toks, j); for (let m = j + 1; m < end; m++) if (toks[m].t === "id" && toks[m].v !== "type") { const imported = toks[m].v; let local = imported; if (isId(m + 1, "as")) { local = toks[m + 2]?.v; m += 2; } names.push({ imported, local }); } j = end + 1; }
      if (isId(j, "from") && toks[j + 1]?.t === "str") out.push({ spec: toks[j + 1].v, line: t.line, how: "re-export", names, at: j + 1 });
    }
  }
  return out;
}

/** Top-level-ish definitions: function, class, const/let/var, type, interface, enum. */
export function definitionsOf(toks) {
  const out = [];
  const DECL = new Set(["function", "class", "const", "let", "var", "type", "interface", "enum"]);
  for (let k = 0; k < toks.length - 1; k++) {
    const t = toks[k];
    if (t.t !== "id" || !DECL.has(t.v) || toks[k - 1]?.v === ".") continue;
    let j = k + 1;
    if (t.v === "function" && toks[j]?.v === "*") j++;
    if (toks[j]?.t !== "id") continue;
    if ((t.v === "type") && toks[j + 1]?.v !== "=" && toks[j + 1]?.v !== "<") continue;
    const exported = toks[k - 1]?.v === "export" || (toks[k - 1]?.v === "async" && toks[k - 2]?.v === "export") || (toks[k - 1]?.v === "default" && toks[k - 2]?.v === "export");
    out.push({ name: toks[j].v, line: t.line, exported, at: j, decl: t.v });
  }
  return out;
}

/** The token range of a definition's body: braces after a function head, or the initializer of a const. */
function bodyRange(toks, at) {
  for (let j = at + 1; j < toks.length && j < at + 200; j++) {
    const v = toks[j].t === "p" ? toks[j].v : null;
    if (v === "(" || v === "[" || v === "<") { j = matching(toks, j); continue; }
    if (v === "{") return [j, matching(toks, j)];
    if (v === "=") {
      let d = 0;
      for (let m = j + 1; m < toks.length; m++) {
        const w = toks[m].t === "p" ? toks[m].v : null;
        if (w === "(" || w === "[" || w === "{") d++;
        else if (w === ")" || w === "]" || w === "}") { if (d === 0) return [j, m]; d--; }
        else if ((w === ";" || w === ",") && d === 0) return [j, m];
        else if (d === 0 && toks[m].line > toks[m - 1].line && toks[m].t === "id" && /^(export|const|let|var|function|class|import|if|for|while|return|async|await)$/.test(toks[m].v) && !/^(=>|\(|,|\+|\?|:|\|\||&&|\?\?|=)$/.test(toks[m - 1].v)) return [j, m - 1];
      }
      return [j, toks.length - 1];
    }
    if (v === ";") return null;
  }
  return null;
}

/**
 * One JS/TS file: its imports, the paths its code reads, writes and runs, its side effects and the literals it names.
 * Paths are worked out from literals, path.join/resolve of literals and of variables bound to them, and
 * new URL(.., import.meta.url). Functions that wrap a read, write or child process with their first parameter
 * are followed one level, so `gen(path.join(here, "build.mjs"))` counts as running build.mjs.
 */
export function analyzeCode(repo, file, toks) {
  const dir = P.dirname(file) === "." ? "" : P.dirname(file);
  const imports = importsOf(toks);
  const used = new Set(imports.map((x) => x.at));
  const ns = { fs: new Set(), cp: new Set(), http: new Set(), path: new Set(["path"]) }, direct = { fs: new Set(), cp: new Set() };
  for (const im of imports) for (const [key, re] of Object.entries(MODULES)) if (re.test(im.spec)) for (const nm of im.names || []) {
    if (nm.imported === "default" || nm.imported === "*") ns[key].add(nm.local);
    else if (key === "fs" || key === "cp") direct[key].add(nm.local);
    if (key === "fs" && nm.imported === "promises") ns.fs.add(nm.local);
  }
  // const fs = require("fs") / const { readFileSync } = require("fs")
  for (let k = 0; k < toks.length; k++) {
    if (toks[k].v !== "require" || toks[k + 1]?.v !== "(" || toks[k + 2]?.t !== "str") continue;
    const key = Object.keys(MODULES).find((m) => MODULES[m].test(toks[k + 2].v));
    if (!key || toks[k - 1]?.v !== "=") continue;
    if (toks[k - 2]?.t === "id") ns[key].add(toks[k - 2].v);
    else if (toks[k - 2]?.v === "}") { for (let m = k - 3; m >= 0 && toks[m].v !== "{"; m--) if (toks[m].t === "id" && (key === "fs" || key === "cp")) direct[key].add(toks[m].v); }
  }
  if (!ns.fs.size && !direct.fs.size) ns.fs.add("fs");

  const ROOTISH = Symbol("unknown");
  const env = new Map([["__dirname", dir], ["__filename", file]]);
  const bindings = new Map(), consumed = new Set();
  let tracking = false;
  /** Evaluate a token range as a repository path, or return null. */
  const evalPath = (lo, hi) => {
    if (lo >= hi) return null;
    // a || b, a ?? b, c ? a : b: the first alternative that evaluates
    let d = 0, q = -1, qd = 0;
    for (let j = lo; j < hi; j++) {
      const v = toks[j].t === "p" ? toks[j].v : "";
      if (v === "(" || v === "[" || v === "{") d++;
      else if (v === ")" || v === "]" || v === "}") d--;
      else if ((v === "||" || v === "??") && d === 0 && q < 0) return evalPath(lo, j) ?? evalPath(j + 1, hi);
      else if (v === "?" && d === 0) { if (q < 0) q = j; else qd++; }
      else if (v === ":" && d === 0 && q >= 0) { if (qd) qd--; else return evalPath(q + 1, j) ?? evalPath(j + 1, hi); }
    }
    const t = toks[lo];
    if (hi - lo === 1) {
      if (t.t === "str") return { raw: t.v, at: lo };
      if (t.t === "id" && env.has(t.v)) { if (tracking) consumed.add(t.v); const v = env.get(t.v); return v === ROOTISH ? null : { path: v }; }
      return null;
    }
    if (t.v === "await") return evalPath(lo + 1, hi);
    // path.join(...), path.resolve(...), join(...), resolve(...), path.posix.join(...)
    let k = lo;
    if (toks[k].t === "id" && ns.path.has(toks[k].v) && toks[k + 1]?.v === ".") { k += 2; if (toks[k]?.v === "posix" || toks[k]?.v === "win32") k += 2; }
    const fn = toks[k]?.v;
    if ((fn === "join" || fn === "resolve" || fn === "dirname") && toks[k + 1]?.v === "(" && matching(toks, k + 1) === hi - 1) {
      const parts = args(toks, k + 1).map(([a, b]) => evalPath(a, b));
      if (fn === "dirname") { const p = parts[0]; const base = p?.path ?? (p?.raw !== undefined ? norm(p.raw) : null); return base === null || base === undefined ? null : { path: P.dirname(base) === "." ? "" : P.dirname(base) }; }
      if (!parts.length || parts.some((p) => !p) || parts[0].path === undefined) return null;
      let acc = parts[0].path;
      for (const p of parts.slice(1)) acc = norm(P.join(acc, p.path ?? p.raw));
      return escapes(acc) ? null : { path: acc, at: parts.find((p) => p.at !== undefined)?.at };
    }
    // new URL("../x", import.meta.url)
    if (t.v === "new" && toks[lo + 1]?.v === "URL" && toks[lo + 2]?.v === "(") {
      const a = args(toks, lo + 2);
      if (a.length >= 2 && toks[a[0][0]].t === "str" && toks.slice(a[1][0], a[1][1]).some((x) => x.v === "meta")) {
        const p = norm(P.join(dir, toks[a[0][0]].v));
        return escapes(p) ? null : { path: p, at: a[0][0] };
      }
    }
    // import.meta.dirname, fileURLToPath(import.meta.url) or dirname(...) of it
    const text = toks.slice(lo, hi).map((x) => x.v).join("");
    if (text === "import.meta.dirname") return { path: dir };
    if (text === "import.meta.filename") return { path: file };
    if (/import\.meta\.url|__filename/.test(text)) return { path: /dirname/.test(text) || /new URL\(["']\.\/?["']/.test(text) ? dir : file };
    return null;
  };
  const resolveValue = (val, { write = false } = {}) => {
    if (!val) return null;
    if (val.path !== undefined) {
      const k = repo.kind(val.path.replace(/\/$/, ""));
      if (k === "file" || k === "untracked") return { path: val.path, kind: k, basis: "computed path" };
      if (k === "dir") return { path: val.path.replace(/\/?$/, "/"), kind: "dir", basis: "computed path" };
      // a path computed from known folders is where the file will be, even before it exists (an ignored build output)
      if (write && val.path && !escapes(val.path) && !/(^|\/)(node_modules|\.git)\//.test(val.path)) return { path: val.path, kind: "untracked", basis: "computed path" };
      return null;
    }
    return repo.literal(val.raw, file);
  };

  // Bindings: const NAME = <path expression>
  for (let k = 0; k < toks.length; k++) {
    if (!["const", "let", "var"].includes(toks[k].v) || toks[k].t !== "id" || toks[k + 1]?.t !== "id" || toks[k + 2]?.v !== "=") continue;
    const r = bodyRange(toks, k + 1);
    if (!r) continue;
    const end = r[1] === toks.length - 1 && toks[r[1]].v !== ";" ? r[1] + 1 : r[1];
    const v = evalPath(r[0] + 1, end);
    let bound = false;
    if (v?.path !== undefined) { env.set(toks[k + 1].v, v.path); bound = true; }
    else if (v?.raw !== undefined) { const res = repo.literal(v.raw, file, { needSlash: false }); if (res) { env.set(toks[k + 1].v, res.path); bound = true; } }
    // the literals that made the binding are accounted for; its uses carry the relationship
    if (bound) {
      for (let m = r[0] + 1; m < end; m++) if (toks[m].t === "str") used.add(m);
      bindings.set(toks[k + 1].v, { path: env.get(toks[k + 1].v), line: toks[k + 1].line });
    }
  }
  tracking = true;

  // Effect calls, then one level of wrappers around them.
  const callKind = (k) => {
    const t = toks[k];
    if (t.t !== "id" || toks[k + 1]?.v !== "(") return null;
    const prev = toks[k - 1]?.v === "." ? toks[k - 2] : null;
    const prev2 = prev && toks[k - 3]?.v === "." ? toks[k - 4] : null;
    const fromFs = (prev && ns.fs.has(prev.v)) || (prev?.v === "promises" && prev2 && ns.fs.has(prev2.v)) || (!prev && direct.fs.has(t.v));
    const fromCp = (prev && ns.cp.has(prev.v)) || (!prev && direct.cp.has(t.v));
    if (fromFs && FS_READ.has(t.v)) return "read";
    if (fromFs && FS_WRITE.has(t.v)) return "write";
    if (fromFs && FS_DELETE.has(t.v)) return "delete";
    if (fromCp && CP.has(t.v)) return "spawn";
    if (!prev && t.v === "fetch") return "network";
    if (prev && ns.http.has(prev.v) && (t.v === "request" || t.v === "get")) return "network";
    return null;
  };
  const wrappers = new Map();
  const defs = definitionsOf(toks);
  for (let pass = 0; pass < 2; pass++) {
    for (const def of defs) {
      if (wrappers.has(def.name)) continue;
      const r = bodyRange(toks, def.at);
      if (!r) continue;
      // first parameter: the identifier after the first "(" in the head, or a bare arrow parameter
      let param = null;
      for (let j = def.at + 1; j < r[0] + 3 && j < toks.length; j++) if (toks[j].v === "(" && toks[j + 1]?.t === "id") { param = toks[j + 1].v; break; }
      if (!param && toks[r[0]]?.v === "=" && toks[r[0] + 1]?.t === "id" && toks[r[0] + 2]?.v === "=>") param = toks[r[0] + 1].v;
      if (!param) continue;
      for (let j = r[0]; j < r[1]; j++) {
        const kind = callKind(j) ?? (wrappers.has(toks[j].v) && toks[j + 1]?.v === "(" && toks[j - 1]?.v !== "." ? wrappers.get(toks[j].v) : null);
        if (!kind || kind === "network") continue;
        const a = args(toks, j + 1);
        const pick = kind === "spawn" ? a.slice(0, 2) : a.slice(0, 1);
        if (pick.some(([lo, hi]) => toks.slice(lo, hi).some((x) => x.t === "id" && x.v === param))) { wrappers.set(def.name, kind); break; }
      }
    }
  }

  const edges = [], effects = [];
  const lineText = (() => { const lines = (repo.read(file) || "").split("\n"); return (n) => (lines[n - 1] || "").trim().slice(0, 160); })();
  for (let k = 0; k < toks.length; k++) {
    let kind = callKind(k);
    let via = null;
    if (!kind && toks[k].t === "id" && wrappers.has(toks[k].v) && toks[k + 1]?.v === "(" && toks[k - 1]?.v !== "." && !["function", "const", "let", "var"].includes(toks[k - 1]?.v)) { kind = wrappers.get(toks[k].v); via = toks[k].v; }
    if (!kind) continue;
    const line = toks[k].line, a = args(toks, k + 1);
    const note = via ? `${via}() wraps a ${kind === "spawn" ? "child process" : kind}` : `${toks[k].v}()`;
    if (kind === "network") { effects.push({ kind: "network", line, text: lineText(line) }); continue; }
    if (kind === "spawn") {
      // the program, then its arguments: a script path in either place is what runs
      const items = [];
      if (a[0]) items.push(a[0]);
      if (a[1] && toks[a[1][0]]?.v === "[") for (const r of args(toks, a[1][0])) items.push(r);
      const first = a[0] && toks[a[0][0]].t === "str" && a[0][1] - a[0][0] === 1 ? toks[a[0][0]].v : null;
      if (first === "git" || first?.startsWith("git ")) {
        const sub = first.startsWith("git ") ? first.split(/\s+/)[1] : items.slice(1).map(([lo, hi]) => (hi - lo === 1 && toks[lo].t === "str" ? toks[lo].v : null)).find((x) => x && !x.startsWith("-") && !/^(core\.|user\.)/.test(x) && x !== "-c" && x !== "-C");
        effects.push({ kind: "git", line, text: lineText(line), detail: sub ? `git ${sub}${GIT_WRITES.has(sub) ? " (changes the repository)" : ""}` : "git" });
        continue;
      }
      let target = null;
      for (const [lo, hi] of items) {
        const v = evalPath(lo, hi);
        const r = resolveValue(v);
        if (r && r.kind !== "dir") { target = r; if (v?.at !== undefined) used.add(v.at); for (let m = lo; m < hi; m++) used.add(m); break; }
        if (hi - lo === 1 && toks[lo].t === "str") {
          // a command string: "node scripts/x.mjs --flag"
          const words = toks[lo].v.split(/\s+/);
          for (let w = 0; w < words.length - 1; w++) if (RUNNERS.has(P.basename(words[w]))) { const rr = repo.literal(words[w + 1], file); if (rr && rr.kind === "file") { target = rr; used.add(lo); break; } }
          if (target) break;
        }
      }
      effects.push({ kind: "spawns", line, text: lineText(line), target: target?.path });
      if (target) edges.push({ kind: "runs", from: target.path, to: file, line, basis: `${note}${target.basis === "unique file name" ? ", matched by unique file name" : ""}` });
      continue;
    }
    // copy, rename and link take (source, destination): the source is read, the destination written
    const twoArg = !via && TWO_ARG.has(toks[k].v);
    const markUsed = (range) => { if (range) for (let m = range[0]; m < range[1]; m++) if (toks[m].t === "str") used.add(m); };
    if (twoArg && a[0] && /^c(op|p)/.test(toks[k].v)) {
      const src = resolveValue(evalPath(a[0][0], a[0][1]));
      if (src && src.path !== file) { markUsed(a[0]); edges.push({ kind: "reads", from: src.path, to: file, line, basis: `${note} source` }); }
    }
    const target = twoArg ? a[1] : a[0];
    const v = target ? evalPath(target[0], target[1]) : null;
    const r = resolveValue(v, { write: kind === "write" });
    if (r) markUsed(target);
    if (kind === "read") { if (r && r.path !== file) edges.push({ kind: "reads", from: r.path, to: file, line, basis: `${note}${r.basis === "unique file name" ? ", matched by unique file name" : ""}` }); continue; }
    if (kind === "write") {
      // a written file is often named by its folder in one place and its name in another: dist + "x.html".
      // Only when the folder itself was worked out; a name joined to an unknown folder (a temp copy) is not this file.
      let out = r;
      if (out?.kind === "dir" && target) {
        for (const nm of toks.slice(target[0], target[1]).filter((x) => x.t === "str").map((x) => x.v)) {
          const cand = norm(P.join(out.path, nm));
          const kd = repo.kind(cand);
          if (kd === "file" || kd === "untracked") { out = { path: cand, kind: kd, basis: "computed path" }; markUsed(target); break; }
        }
      }
      effects.push({ kind: "writes", line, text: lineText(line), target: out?.path });
      if (out && out.kind !== "dir" && out.path !== file) edges.push({ kind: "generates", from: file, to: out.path, line, basis: `${note}${out.basis === "unique file name" ? ", matched by unique file name" : ""}` });
      continue;
    }
    if (kind === "delete") effects.push({ kind: "deletes", line, text: lineText(line), target: r?.path });
  }
  // A variable bound to a path but never read, written or run through is still a named path.
  for (const [name, b] of bindings) {
    if (consumed.has(name) || !b.path || b.path === file || b.path === dir) continue;
    const k = repo.kind(b.path.replace(/\/$/, ""));
    if (k === "file" || k === "dir") edges.push({ kind: "mentions", from: k === "dir" ? b.path.replace(/\/?$/, "/") : b.path, to: file, line: b.line, basis: `bound to ${name}` });
  }
  // Every other literal that names a path the repository has, and paths named in comments ("kept in step with x").
  for (let k = 0; k < toks.length; k++) {
    if (toks[k].t !== "str" || used.has(k)) continue;
    const r = repo.literal(toks[k].v, file);
    if (r && r.path !== file && r.path !== "") edges.push({ kind: "mentions", from: r.path, to: file, line: toks[k].line, basis: r.basis });
  }
  for (const c of toks.comments || []) {
    for (const m of c.v.matchAll(PATH_TOKEN)) {
      const tok = m[0].replace(/[.,;:)`]+$/, "");
      const r = tok.includes("/") ? repo.literal(tok, file) : null;
      if (r && r.path !== file && r.path !== "") edges.push({ kind: "mentions", from: r.path, to: file, line: c.line + (c.v.slice(0, m.index).match(/\n/g)?.length || 0), basis: "named in a comment" });
    }
  }
  for (const im of imports) {
    const to = repo.module(im.spec, file);
    if (to && to !== file) edges.push({ kind: "import", from: to, to: file, line: im.line, basis: im.how, names: im.names, spec: im.spec, endLine: toks[im.at].line });
  }
  return { edges, effects, imports, defs, wrappers: [...wrappers] };
}

// ------------------------------------------------------------------------------------- text analysis

const PATH_TOKEN = /(?<![\w@./-])(?:\.{1,2}\/)*[\w@][\w.@+-]*(?:\/[\w.@+-]+)+\/?|(?<![\w@./-])[\w@+-]+(?:\.[\w-]+)*\.[A-Za-z][A-Za-z0-9]{0,7}(?![\w/])/g;
const RUNNER_BEFORE = /(?:^|[\s"'`(;&|])(?:node|nodejs|tsx|ts-node|python3?|sh|bash|zsh|deno run|bun)(?:\s+-{1,2}[\w-]+(?:[= ][^\s-][^\s]*)?)*\s+["']?$/;
const lineStarts = (s) => { const a = [0]; for (let i = 0; i < s.length; i++) if (s[i] === "\n") a.push(i + 1); return a; };
const lineAt = (starts, idx) => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (starts[m] <= idx) lo = m; else hi = m - 1; } return lo + 1; };

function analyzeText(repo, file, src) {
  const edges = [];
  const doc = /\.(md|mdx|txt)$/i.test(file);
  const starts = lineStarts(src);
  let scripts = null;
  if (P.basename(file) === "package.json") { try { scripts = JSON.parse(src).scripts || null; } catch { /* not JSON */ } }
  const scriptValues = scripts ? new Set(Object.values(scripts).map(String)) : null;
  for (const m of src.matchAll(PATH_TOKEN)) {
    const tok = m[0].replace(/[.,;:)]+$/, "");
    const r = repo.literal(tok, file, { needSlash: true });
    if (!r || r.path === file || (r.basis === "unique file name" && !doc)) continue;
    if (r.basis === "unique file name" && doc && !repo.tracked.has(norm(P.join(P.dirname(file), tok))) && !repo.tracked.has(tok)) continue;
    const line = lineAt(starts, m.index);
    const before = src.slice(starts[line - 1], m.index);
    let kind = "mentions", basis = doc ? "named in a document" : "named in a text file";
    if (RUNNER_BEFORE.test(before) && r.kind === "file") {
      if (doc) basis = "documented command";
      else if (scripts) { const lineText = src.slice(starts[line - 1], starts[line] ?? src.length); if ([...scriptValues].some((v) => lineText.includes(JSON.stringify(v).slice(1, -1)))) { kind = "runs"; basis = "package.json script"; } }
      else { kind = "runs"; basis = /\.ya?ml$/.test(file) ? "CI or config step" : "command line"; }
    }
    edges.push({ kind, from: r.path, to: file, line, basis });
  }
  return edges;
}

/** A generated file usually says so in its first lines and names the script that made it. */
function generatedHeader(repo, file, src) {
  const head = src.split("\n").slice(0, 6);
  const at = head.findIndex((l) => /\b(generated|do not edit|don't edit|auto-?generated)\b/i.test(l));
  if (at < 0) return [];
  const edges = [];
  for (const l of head.slice(at, at + 3)) for (const m of l.matchAll(PATH_TOKEN)) {
    const r = repo.literal(m[0].replace(/[.,;:)`]+$/, ""), file);
    if (r && r.kind === "file" && CODE.test(r.path) && r.path !== file) edges.push({ kind: "generates", from: r.path, to: file, line: at + 1, basis: "named in the file's generated header" });
  }
  return edges;
}

// ------------------------------------------------------------------------------------------- the graph

export function buildGraph(root) {
  const repo = new Repo(root);
  const edges = [], effects = new Map(), code = new Map();
  let parsed = 0, scanned = 0;
  for (const file of repo.files) {
    const isCode = CODE.test(file) && !file.endsWith(".d.ts");
    const isHtml = /\.html?$/i.test(file);
    if (!isCode && !TEXT.test(file) && !P.basename(file).startsWith(".")) continue;
    const src = repo.read(file);
    if (src === null) continue;
    edges.push(...generatedHeader(repo, file, src));
    if (isCode) {
      const toks = tokenize(src);
      const a = analyzeCode(repo, file, toks);
      code.set(file, { toks, ...a });
      edges.push(...a.edges);
      if (a.effects.length) effects.set(file, a.effects);
      parsed++;
    } else if (isHtml) {
      // inline scripts are code; the rest is text
      const toks = [];
      toks.comments = [];
      const starts = lineStarts(src);
      for (const m of src.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) { const part = tokenize(m[1], lineAt(starts, m.index + m[0].indexOf(">") + 1)); toks.push(...part); toks.comments.push(...part.comments); }
      const a = analyzeCode(repo, file, toks);
      code.set(file, { toks, ...a });
      edges.push(...a.edges.filter((e) => e.kind !== "mentions"), ...analyzeText(repo, file, src));
      scanned++;
    } else {
      edges.push(...analyzeText(repo, file, src));
      scanned++;
    }
  }
  // one edge per kind, pair and line
  const seen = new Set(), uniq = [];
  for (const e of edges) { const k = `${e.kind}\0${e.from}\0${e.to}\0${e.line}`; if (!seen.has(k)) { seen.add(k); uniq.push(e); } }
  // a mention on the same line as a stronger edge between the same pair adds nothing
  const strong = new Set(uniq.filter((e) => e.kind !== "mentions").map((e) => `${e.from}\0${e.to}\0${e.line}`));
  const final = uniq.filter((e) => e.kind !== "mentions" || !strong.has(`${e.from}\0${e.to}\0${e.line}`));
  return { repo, edges: final, effects, code, parsed, scanned };
}

const inside = (p, targets) => targets.some((t) => (t.endsWith("/") ? p.startsWith(t) : p === t));

function walk(g, targets, dir, depth) {
  const by = new Map();
  for (const e of g.edges) {
    if (!FOLLOW.has(e.kind)) continue;
    const key = dir === "down" ? e.from : e.to;
    if (!by.has(key)) by.set(key, []);
    by.get(key).push(e);
  }
  const start = g.repo.files.filter((f) => inside(f, targets)).concat(targets.filter((t) => !t.endsWith("/") && !g.repo.tracked.has(t)));
  const dist = new Map(start.map((f) => [f, 0])), parent = new Map(), queue = [...start];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    if (dist.get(cur) >= depth) continue;
    for (const e of by.get(cur) || []) {
      const next = dir === "down" ? e.to : e.from;
      if (dist.has(next)) continue;
      dist.set(next, dist.get(cur) + 1);
      parent.set(next, e);
      queue.push(next);
    }
  }
  const chain = (f) => { const out = []; while (parent.has(f)) { const e = parent.get(f); out.unshift(e); f = dir === "down" ? e.from : e.to; } return out; };
  return queue.filter((f) => dist.get(f) > 0).map((f) => {
    const c = chain(f);
    return { path: f, depth: dist.get(f), start: dir === "down" ? c[0].from : c[0].to, through: c.slice(0, -1).map((e) => (dir === "down" ? e.to : e.from)), kind: c.at(-1).kind, at: loc(c.at(-1)) };
  });
}

/**
 * For each file related to the targets in the current tree: the nearest relationship found, downstream or upstream,
 * within `depth` steps of import, reads, generates and runs, or a direct mention. Used to tell co-change that has a
 * structural reason from co-change that has none the program can see.
 */
export function relations(g, targets, depth = 3) {
  const out = new Map();
  for (const [dir, list] of [["downstream", walk(g, targets, "down", depth)], ["upstream", walk(g, targets, "up", depth)]]) {
    for (const r of list) if (!out.has(r.path) || out.get(r.path).depth > r.depth) out.set(r.path, { relation: dir, kind: r.kind, depth: r.depth, at: r.at, through: r.through });
  }
  // another input of a file that consumes the target (library.json and template.html are both read by build.mjs)
  const direct = new Set(g.edges.filter((e) => FOLLOW.has(e.kind) && inside(e.from, targets) && !inside(e.to, targets)).map((e) => e.to));
  for (const e of g.edges) {
    if (!FOLLOW.has(e.kind) || !direct.has(e.to) || inside(e.from, targets) || out.has(e.from)) continue;
    out.set(e.from, { relation: "sibling", kind: e.kind, depth: 1, at: loc(e), through: [e.to] });
  }
  for (const e of g.edges) {
    if (e.kind !== "mentions") continue;
    const [t, other] = inside(e.from, targets) ? [e.from, e.to] : inside(e.to, targets) ? [e.to, e.from] : [null, null];
    if (t && !inside(other, targets) && !out.has(other)) out.set(other, { relation: "mention", kind: "mentions", depth: 1, at: loc(e), through: [] });
  }
  return out;
}

/** Files some tracked script writes, or that name their generator in a header. */
export const generatedFiles = (g) => new Set(g.edges.filter((e) => e.kind === "generates").map((e) => e.to));

/** Long literals (six words or more) that another tracked file repeats word for word. */
function sharedText(g, file, range) {
  const info = g.code.get(file);
  if (!info) return [];
  const [lo, hi] = range || [0, info.toks.length];
  // prose only: six words or more, no markup or code
  const prose = (s) => s.split(/\s+/).filter(Boolean).length >= 6 && !/[<>{}=;]|\$\{\}/.test(s);
  const lits = [];
  for (let k = lo; k < hi; k++) {
    const t = info.toks[k];
    if (t.t === "str" || t.t === "tpl") for (const piece of t.v.split("${}")) if (prose(piece.trim())) lits.push({ v: piece.trim(), line: t.line });
  }
  // copies inside files built from this one (its generated outputs) are expected; they are counted, not listed
  const derived = new Set(walk(g, [file], "down", 3).filter((r) => r.kind === "generates").map((r) => r.path));
  const generated = new Set(g.edges.filter((e) => e.kind === "generates").map((e) => e.to));
  const out = [], derivedCopies = new Map(), seenLit = new Set();
  for (const lit of lits.slice(0, 200)) {
    if (seenLit.has(lit.v)) continue;
    seenLit.add(lit.v);
    const forms = [...new Set([lit.v, JSON.stringify(lit.v).slice(1, -1)])];
    for (const other of g.repo.files) {
      if (other === file) continue;
      const src = g.repo.read(other);
      if (!src) continue;
      for (const f of forms) {
        const idx = src.indexOf(f);
        if (idx < 0) continue;
        if (derived.has(other)) derivedCopies.set(other, (derivedCopies.get(other) || 0) + 1);
        else out.push({ kind: "shared-text", from: file, to: other, line: lineAt(lineStarts(src), idx), fromLine: lit.line, basis: `repeats "${lit.v.length > 90 ? lit.v.slice(0, 87) + "..." : lit.v}"`, generated: generated.has(other) });
        break;
      }
    }
  }
  out.derivedCopies = Object.fromEntries(derivedCopies);
  return out.sort((a, b) => a.generated - b.generated || a.to.localeCompare(b.to));
}

/** Other files that define a name the target defines, without importing it from the target. */
function sameName(g, file, names) {
  const importers = new Set(g.edges.filter((e) => e.kind === "import" && e.from === file).map((e) => e.to));
  const generated = new Set(g.edges.filter((e) => e.kind === "generates").map((e) => e.to));
  const out = [];
  for (const [other, info] of g.code) {
    if (other === file || importers.has(other)) continue;
    for (const d of info.defs) if (names.has(d.name)) out.push({ kind: "same-name", from: file, to: other, line: d.line, basis: `also defines ${d.name} (${d.decl})`, generated: generated.has(other) });
  }
  return out.sort((a, b) => a.generated - b.generated || a.to.localeCompare(b.to));
}

/** A file the framework calls by convention, so nothing imports it: Next.js App Router pages, layouts and route handlers. */
export function entryOf(repo, file) {
  const parts = file.split("/");
  const m = /^(page|route|layout|template|loading|error|not-found|default|sitemap|robots|manifest)\.(m?[jt]sx?)$/.exec(parts.at(-1));
  if (!m) return null;
  for (let i = parts.length - 2; i >= 0; i--) {
    if (parts[i] !== "app") continue;
    const base = parts.slice(0, i).join("/");
    const hasNext = repo.files.some((f) => f.startsWith(base ? base + "/" : "") && /^next\.config\.[mc]?[jt]s$/.test(f.slice(base ? base.length + 1 : 0)));
    if (!hasNext) continue;
    const route = "/" + parts.slice(i + 1, -1).filter((s) => !/^\(.*\)$/.test(s) && !s.startsWith("@")).join("/");
    return { framework: "Next.js App Router", kind: m[1], route };
  }
  return null;
}

// ------------------------------------------------------------------------------------------- the query

export function query(g, rawTargets, { symbol = null, depth = 3 } = {}) {
  const repo = g.repo;
  const targets = rawTargets.map((t) => (repo.kind(t.replace(/\/$/, "")) === "dir" ? t.replace(/\/?$/, "/") : t));
  for (const t of targets) if (!repo.kind(t.replace(/\/$/, "")) && !g.edges.some((e) => e.from === t || e.to === t)) throw new Error(`${t} is not a tracked file or folder in this checkout`);
  const isT = (p) => inside(p, targets);
  let consumers = g.edges.filter((e) => isT(e.from) && !isT(e.to));
  const dependencies = g.edges.filter((e) => isT(e.to) && !isT(e.from));
  const effects = [...g.effects].filter(([f]) => isT(f)).flatMap(([f, list]) => list.map((x) => ({ path: f, ...x })));
  let inferred = [], defined = [], symbolUses = null;
  const derivedCopies = {};
  const shared = (file, range) => { const st = sharedText(g, file, range); Object.assign(derivedCopies, st.derivedCopies); return st; };
  const fileTargets = targets.filter((t) => !t.endsWith("/"));
  if (symbol) {
    if (fileTargets.length !== 1) throw new Error("--symbol needs exactly one file");
    const file = fileTargets[0], info = g.code.get(file);
    if (!info) throw new Error(`${file} is not a JS/TS file this tool parses`);
    const defs = info.defs.filter((d) => d.name === symbol);
    if (!defs.length) throw new Error(`${file} does not define ${symbol}`);
    defined = defs.map((d) => `${file}:${d.line}`);
    // importers that bring the name in, directly, through a namespace, or through a re-export one level away
    const uses = [];
    const viaReexport = [];
    for (const e of consumers.filter((x) => x.kind === "import")) {
      const names = e.names || [];
      const hit = names.find((nm) => nm.imported === symbol || nm.imported === "*");
      if (!hit && e.basis !== "require") continue;
      const toks = g.code.get(e.to)?.toks || [];
      const local = hit?.imported === "*" ? hit.local : hit?.local ?? symbol;
      const lines = [];
      for (let k = 0; k < toks.length; k++) {
        if (toks[k].t !== "id" || (toks[k].line >= e.line && toks[k].line <= (e.endLine ?? e.line))) continue;
        if (hit?.imported === "*" || e.basis === "require") { if (toks[k].v === local && toks[k + 1]?.v === "." && toks[k + 2]?.v === symbol) lines.push(toks[k].line); }
        else if (toks[k].v === local && toks[k - 1]?.v !== ".") lines.push(toks[k].line);
      }
      if (!lines.length && e.basis !== "re-export") continue;
      uses.push({ ...e, uses: [...new Set(lines)].slice(0, 8) });
      if (e.basis === "re-export") viaReexport.push(e.to);
    }
    for (const mid of viaReexport) for (const e of g.edges.filter((x) => x.kind === "import" && x.from === mid && (x.names || []).some((nm) => nm.imported === symbol))) uses.push({ ...e, basis: `${e.basis} via ${mid}` });
    symbolUses = uses;
    // only the importers that use the name; mentions of the file say nothing about one symbol
    consumers = uses;
    const r = bodyRange(info.toks, defs[0].at);
    inferred = [...sameName(g, file, new Set([symbol])), ...shared(file, r ? [r[0], r[1] + 1] : null)];
  } else {
    for (const file of fileTargets) {
      const info = g.code.get(file);
      if (!info) continue;
      const exported = new Set(info.defs.filter((d) => d.exported && d.name.length >= 6).map((d) => d.name));
      inferred.push(...sameName(g, file, exported), ...shared(file));
    }
  }
  const reachTargets = symbol ? [...new Set((symbolUses || []).map((u) => u.to))] : targets;
  let down;
  if (symbol) {
    const first = (symbolUses || []).map((u) => ({ path: u.to, depth: 1, through: [], kind: "import", at: loc(u) }));
    const firstSet = new Set(first.map((x) => x.path));
    const rest = walk(g, reachTargets, "down", Math.max(0, depth - 1)).filter((r) => !firstSet.has(r.path) && !isT(r.path)).map((r) => ({ ...r, depth: r.depth + 1, through: [r.start, ...r.through] }));
    down = [...new Map(first.map((x) => [x.path, x])).values(), ...rest];
  } else down = walk(g, targets, "down", depth);
  const up = walk(g, targets, "up", depth);
  const entries = fileTargets.map((f) => ({ path: f, ...entryOf(repo, f) })).filter((x) => x.framework);
  return { targets, symbol, defined, consumers, dependencies, effects, inferred, derivedCopies, symbolUses, entries, reach: { down, up } };
}

// ------------------------------------------------------------------------------------------ evidence

const loc = (e) => `${e.kind === "generates" && !e.basis.startsWith("named in") ? e.from : e.to}:${e.line}`;
const KIND_WORDS = { import: "imports", reads: "reads", generates: "generates", runs: "runs", mentions: "names", "same-name": "has the same name as", "shared-text": "repeats text from" };

function summaryOf(e) {
  if (e.kind === "import") return `${e.to} imports ${e.from} (${e.basis})`;
  if (e.kind === "reads") return `${e.to} reads ${e.from} (${e.basis})`;
  if (e.kind === "generates") return `${e.from} generates ${e.to} (${e.basis})`;
  if (e.kind === "runs") return `${e.to} runs ${e.from} (${e.basis})`;
  if (e.kind === "mentions") return `${e.to} names ${e.from} (${e.basis})`;
  if (e.kind === "same-name") return `${e.to} ${e.basis}, a name ${e.from} defines (inferred: not an import)`;
  if (e.kind === "shared-text") return `${e.to}${e.generated ? " (generated)" : ""} ${e.basis} at ${e.from}:${e.fromLine} (inferred)`;
  return `${e.from} ${KIND_WORDS[e.kind] || e.kind} ${e.to}`;
}

export function report(g, q, { limit = 25 } = {}) {
  const repo = g.repo;
  const obs = [];
  const add = (e, group) => { const id = `o${obs.length + 1}`; obs.push({ id, group, edge: e }); return id; };
  const consumerIds = q.consumers.map((e) => ({ e, id: add(e, "consumer") }));
  const depIds = q.dependencies.map((e) => ({ e, id: add(e, "dependency") }));
  const infIds = q.inferred.map((e) => ({ e, id: add(e, "inferred") }));
  const coverage = `Tracked files at ${repo.revision === "working-tree" ? `the working tree (HEAD ${repo.head ? repo.head.slice(0, 12) : "none"}, ${repo.changed} tracked file(s) changed)` : `revision ${repo.revision.slice(0, 12)}`}: ${g.parsed} JS/TS files tokenized, ${g.scanned} other text files scanned for paths. Imports resolve relative paths and tsconfig/jsconfig paths; reads, writes and runs are worked out only from literal paths, path.join/resolve of them and variables bound to them, and functions that wrap them one level deep. Not seen: computed paths, framework routing, other languages' imports, network calls' targets and runtime behavior. A missing relationship is not proof that none exists.`;
  const subjects = new Map();
  const subj = (p) => { if (!p || escapes(p)) return null; const dir = p.endsWith("/"); if (!subjects.has(p)) subjects.set(p, { kind: dir ? "directory" : "file", key: p, label: P.basename(p.replace(/\/$/, "")) + (dir ? "/" : "") }); return p; };
  for (const t of q.targets) subj(t);
  const observations = obs.slice(0, 400).map(({ id, edge: e }) => ({ id, locator: loc(e), subjects: [subj(e.from), subj(e.to)].filter(Boolean), kind: e.kind, summary: summaryOf(e), details: { kind: e.kind, from: e.from, to: e.to, line: e.line, basis: e.basis, ...(e.uses ? { uses: e.uses } : {}) } }));
  const reachId = `o${obs.length + 1}`;
  const byDepth = {};
  for (const r of q.reach.down) byDepth[r.depth] = (byDepth[r.depth] || 0) + 1;
  observations.push({ id: reachId, locator: q.targets.join(", ").slice(0, 900), subjects: q.targets.map(subj).filter(Boolean), kind: "reach", summary: `${q.reach.down.length} file(s) depend on ${q.targets.join(", ")}${q.symbol ? ` (${q.symbol})` : ""} through import, reads, generates or runs, within ${Object.keys(byDepth).length ? Math.max(...Object.keys(byDepth).map(Number)) : 0} step(s)`, details: { byDepth, files: q.reach.down.slice(0, 200).map((r) => r.path) } });
  const effectStart = observations.length;
  q.effects.slice(0, 100).forEach((x, i) => observations.push({ id: `o${effectStart + i + 1}`, locator: `${x.path}:${x.line}`, subjects: [subj(x.path), x.target && subj(x.target)].filter(Boolean), kind: `effect:${x.kind}`, summary: `${x.path}:${x.line} ${x.kind}${x.target ? ` ${x.target}` : ""}${x.detail ? ` (${x.detail})` : ""} when it runs`, details: { ...x } }));
  return {
    tool: "structure",
    repository: repoName(repo.root),
    revision: repo.revision,
    head: repo.head,
    targets: q.targets,
    symbol: q.symbol,
    defined: q.defined,
    consumers: consumerIds.map(({ e, id }) => ({ id, ...e })),
    dependencies: depIds.map(({ e, id }) => ({ id, ...e })),
    inferred: infIds.map(({ e, id }) => ({ id, ...e })),
    derivedCopies: q.derivedCopies,
    entries: q.entries,
    effects: q.effects,
    reach: { downstream: q.reach.down, upstream: q.reach.up },
    coverage,
    limit,
    evidence: {
      scope: "repository-snapshot",
      method: `structure.mjs read the tracked files of the checkout and worked out import, reads, generates and runs relationships with file:line anchors${q.symbol ? `, then narrowed them to the symbol ${q.symbol}` : ""}. Nothing was executed.`,
      limits: coverage,
      subjects: [...subjects.values()],
      observations,
    },
  };
}

// ------------------------------------------------------------------------------------------- text form

export function toText(r) {
  const out = [];
  const lim = r.limit;
  const head = r.revision === "working-tree" ? `working tree (HEAD ${r.head ? r.head.slice(0, 7) : "none"})` : r.revision.slice(0, 7);
  out.push(`Structure of ${r.targets.join(", ")}${r.symbol ? ` · symbol ${r.symbol} (defined at ${r.defined.join(", ")})` : ""} · ${r.repository} at ${head}`);
  const row = (x) => `  [${x.id}] ${x.kind.padEnd(10)} ${summaryOf(x).replace(/ \(([^()]*)\)$/, "")}  · ${loc(x)}${x.basis ? `  (${x.basis})` : ""}${x.uses?.length ? `  used on line ${x.uses.join(", ")}` : ""}`;
  const section = (title, list) => {
    out.push("", `${title} (${list.length})`);
    if (!list.length) { out.push("  none found"); return; }
    const sorted = [...list].sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) || a.to.localeCompare(b.to) || a.from.localeCompare(b.from));
    for (const x of sorted.slice(0, lim)) out.push(row(x));
    if (sorted.length > lim) out.push(`  ... ${sorted.length - lim} more (--limit or --json)`);
  };
  for (const x of r.entries || []) out.push(`Entry point: ${x.framework} serves ${x.path} as its ${x.kind} for ${x.route}. The framework calls it, so files rarely import it.`);
  section("Consumers: who depends on it", r.consumers);
  section("Dependencies: what it depends on", r.dependencies);
  out.push("", `Side effects when it runs (${r.effects.length})`);
  if (!r.effects.length) out.push("  none found in JS/TS code");
  for (const x of r.effects.slice(0, lim)) out.push(`  ${x.kind.padEnd(8)} ${x.path}:${x.line}${x.target ? ` -> ${x.target}` : ""}${x.detail ? ` (${x.detail})` : ""}  ${x.text}`);
  out.push("", `Inferred, not followed (${r.inferred.length})`);
  if (!r.inferred.length) out.push("  none found");
  for (const x of r.inferred.slice(0, lim)) out.push(`  [${x.id}] ${x.kind.padEnd(11)} ${x.to}:${x.line}${x.generated ? " (generated)" : ""}  ${x.basis}${x.fromLine ? ` (from line ${x.fromLine})` : ""}`);
  if (r.inferred.length > lim) out.push(`  ... ${r.inferred.length - lim} more`);
  const copies = Object.entries(r.derivedCopies || {});
  if (copies.length) out.push(`  expected copies inside files generated from it: ${copies.map(([f, n]) => `${f} (${n})`).join(", ")}`);
  const reachLine = (list, word) => {
    const byDepth = {};
    for (const x of list) byDepth[x.depth] = (byDepth[x.depth] || 0) + 1;
    out.push("", `Reach ${word} (${list.length} files; ${Object.entries(byDepth).map(([d, n]) => `${n} at step ${d}`).join(", ") || "none"})`);
    for (const x of [...list].sort((a, b) => a.depth - b.depth || a.path.localeCompare(b.path)).slice(0, lim)) out.push(`  ${x.depth}  ${x.path}  (${x.kind}, ${x.at})${x.through?.length ? `  through ${x.through.join(" -> ")}` : ""}`);
    if (list.length > lim) out.push(`  ... ${list.length - lim} more`);
  };
  reachLine(r.reach.downstream, "downstream (what a change here can affect)");
  reachLine(r.reach.upstream, "upstream (what it is built from)");
  out.push("", `Coverage: ${r.coverage}`);
  return out.join("\n");
}

// --------------------------------------------------------------------------------------------- the CLI

function main(argv) {
  const opts = { targets: [], depth: 3, limit: 25, json: false, symbol: null, root: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") opts.json = true;
    else if (a === "--symbol") opts.symbol = argv[++i];
    else if (a === "--depth") opts.depth = Number(argv[++i]);
    else if (a === "--limit") opts.limit = Number(argv[++i]);
    else if (a === "--root") opts.root = argv[++i];
    else if (a === "-h" || a === "--help") { console.log("Usage: node structure.mjs <path>... [--symbol <name>] [--depth <n>] [--root <repo>] [--limit <n>] [--json]"); return 0; }
    else if (a.startsWith("--")) throw new Error(`Unknown option ${a}`);
    else opts.targets.push(a);
  }
  if (!opts.targets.length) throw new Error("Name at least one file or folder. Usage: node structure.mjs <path>... [--symbol <name>] [--json]");
  if (!Number.isInteger(opts.depth) || opts.depth < 1 || opts.depth > 10) throw new Error("--depth must be 1 to 10");
  if (!Number.isInteger(opts.limit) || opts.limit < 1) throw new Error("--limit must be a positive whole number");
  const cwd = process.cwd();
  const root = fs.realpathSync(execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: opts.root ? path.resolve(opts.root) : cwd, encoding: "utf8" }).trim());
  const rel = (t) => {
    const abs = path.resolve(cwd, t);
    let real = abs;
    try { real = fs.realpathSync(abs); } catch { /* deleted path: keep as given */ }
    const r = path.relative(root, real).split(path.sep).join("/");
    if (r.startsWith("..")) throw new Error(`${t} is outside the repository at ${path.basename(root)}`);
    return r + (t.endsWith("/") && r ? "/" : "");
  };
  const g = buildGraph(root);
  const q = query(g, opts.targets.map(rel), { symbol: opts.symbol, depth: opts.depth });
  const r = report(g, q, { limit: opts.limit });
  process.stdout.write((opts.json ? JSON.stringify(r, null, 2) : toText(r)) + "\n");
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exitCode = 1; }
}
