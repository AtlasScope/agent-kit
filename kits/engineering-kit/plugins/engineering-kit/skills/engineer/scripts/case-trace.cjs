// Loaded with --require by case.mjs into every Node process a case step starts. It records which files the
// program writes, deletes or renames and which programs it starts, then lets each call proceed unchanged.
// It is an observer, not a sandbox: it sees Node's fs and child_process calls only, not what a shell,
// Python or a native tool does, and a program can still write anywhere it is allowed to.
// Each file and call is recorded once per process, up to 5,000 records; past that it writes one "overflow"
// record, and case.mjs treats the trace as incomplete. A child started with detached: true gets a "detached"
// record with its process id, so case.mjs can stop the process group it makes for itself.
"use strict";
const log = process.env.ENGINEER_CASE_LOG;
if (log) {
  const fs = require("node:fs");
  const fsp = require("node:fs/promises");
  const cp = require("node:child_process");
  const path = require("node:path");
  const { syncBuiltinESMExports } = require("node:module");
  const { fileURLToPath } = require("node:url");
  const append = fs.appendFileSync.bind(fs);
  const self = __filename;
  const MAX = 5000;
  const seen = new Set();
  let count = 0, overflowed = false;
  const where = (p) => {
    try {
      if (p instanceof URL) p = fileURLToPath(p);
      if (Buffer.isBuffer(p)) p = p.toString();
      return typeof p === "string" ? path.resolve(p) : null;
    } catch { return null; }
  };
  // appendFileSync itself goes through writeFileSync, which is wrapped: without this guard every event logs itself
  let busy = false;
  const logPath = path.resolve(log);
  const write = (kind, data) => {
    busy = true;
    try { append(log, JSON.stringify({ kind, pid: process.pid, ppid: process.ppid, ...data }) + "\n"); } catch { /* the log is best effort */ } finally { busy = false; }
  };
  // key: what makes a record a repeat (the same kind of call on the same path); repeats are not written again
  const emit = (kind, data, key) => {
    if (busy || data.path === logPath || (key !== undefined && seen.has(key))) return;
    if (count >= MAX) { if (!overflowed) { overflowed = true; write("overflow", { max: MAX }); } return; }
    if (key !== undefined) seen.add(key);
    count++;
    write(kind, data);
  };
  const WRITE_FLAGS = /[wa+]/;
  const wrap = (obj, name, kind, pick) => {
    const orig = obj[name];
    if (typeof orig !== "function") return;
    obj[name] = function (...args) {
      for (const p of pick(args)) { const at = where(p); if (at) emit(kind, { path: at, call: name }, `${kind}\0${at}`); }
      return orig.apply(this, args);
    };
  };
  const first = (a) => [a[0]];
  const second = (a) => [a[1]];
  const both = (a) => [a[0], a[1]];
  for (const [obj, sync] of [[fs, true], [fsp, false]]) {
    const s = sync ? "Sync" : "";
    for (const n of ["writeFile", "appendFile", "truncate"]) { wrap(obj, n + s, "write", first); if (sync) wrap(fs, n, "write", first); }
    for (const n of ["rm", "unlink", "rmdir"]) { wrap(obj, n + s, "delete", first); if (sync) wrap(fs, n, "delete", first); }
    for (const n of ["copyFile", "cp", "symlink", "link"]) { wrap(obj, n + s, "write", second); if (sync) wrap(fs, n, "write", second); }
    for (const n of ["rename"]) { wrap(obj, n + s, "rename", both); if (sync) wrap(fs, n, "rename", both); }
    wrap(obj, "mkdir" + s, "mkdir", first);
    if (sync) wrap(fs, "mkdir", "mkdir", first);
  }
  const openWrap = (obj, name) => {
    const orig = obj[name];
    if (typeof orig !== "function") return;
    obj[name] = function (p, flags, ...rest) {
      if (typeof flags === "string" ? WRITE_FLAGS.test(flags) : typeof flags === "number" && (flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR))) { const at = where(p); if (at) emit("write", { path: at, call: name }, `write\0${at}`); }
      return orig.call(this, p, flags, ...rest);
    };
  };
  openWrap(fs, "openSync");
  openWrap(fs, "open");
  openWrap(fsp, "open");
  wrap(fs, "createWriteStream", "write", first);
  // Child processes: note the program, and keep tracing inside it when it is Node and its env was replaced.
  const traced = (opts) => {
    const o = opts && typeof opts === "object" ? opts : {};
    if (!o.env) return opts;
    const want = `--require=${JSON.stringify(self)}`;
    const cur = o.env.NODE_OPTIONS || "";
    return { ...o, env: { ...o.env, ENGINEER_CASE_LOG: log, NODE_OPTIONS: cur.includes(self) ? cur : `${cur} ${want}`.trim() } };
  };
  const isOpts = (o) => o && typeof o === "object" && !Array.isArray(o);
  for (const name of ["spawn", "spawnSync", "execFile", "execFileSync", "fork", "exec", "execSync"]) {
    const orig = cp[name];
    if (typeof orig !== "function") continue;
    cp[name] = function (file, ...rest) {
      const at = Array.isArray(rest[0]) ? 1 : 0;
      const args = at ? rest[0] : [];
      const program = String(file).slice(0, 200), shown = args.slice(0, 6).map(String);
      emit("spawn", { program, args: shown, cwd: where(isOpts(rest[at]) && rest[at].cwd ? rest[at].cwd : process.cwd()), call: name }, `spawn\0${program}\0${shown.join("\0")}`);
      const detached = isOpts(rest[at]) && rest[at].detached;
      if (isOpts(rest[at])) rest[at] = traced(rest[at]);
      const child = orig.call(this, file, ...rest);
      // not capped: case.mjs needs every one to stop what the step left running
      if (detached && Number.isInteger(child?.pid)) write("detached", { child: child.pid });
      return child;
    };
  }
  syncBuiltinESMExports();
  emit("start", { argv: process.argv.slice(1, 4).map((a) => where(a) || a), cwd: process.cwd() });
  process.on("exit", (code) => emit("exit", { code }));
}
