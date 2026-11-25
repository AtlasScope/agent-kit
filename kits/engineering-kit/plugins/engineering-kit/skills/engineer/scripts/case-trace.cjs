// Loaded with --require by case.mjs into every Node process a case step starts. It records which files the
// program writes, deletes or renames and which programs it starts, then lets each call proceed unchanged.
// It is an observer, not a sandbox: it sees Node's fs and child_process calls only, not what a shell,
// Python or a native tool does, and a program can still write anywhere it is allowed to.
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
  let count = 0;
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
  const emit = (kind, data) => {
    if (busy || data.path === logPath || count >= 5000) return;
    count++;
    busy = true;
    try { append(log, JSON.stringify({ kind, pid: process.pid, ppid: process.ppid, ...data }) + "\n"); } catch { /* the log is best effort */ } finally { busy = false; }
  };
  const WRITE_FLAGS = /[wa+]/;
  const wrap = (obj, name, kind, pick) => {
    const orig = obj[name];
    if (typeof orig !== "function") return;
    obj[name] = function (...args) {
      for (const p of pick(args)) { const at = where(p); if (at) emit(kind, { path: at, call: name }); }
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
      if (typeof flags === "string" ? WRITE_FLAGS.test(flags) : typeof flags === "number" && (flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR))) { const at = where(p); if (at) emit("write", { path: at, call: name }); }
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
      emit("spawn", { program: String(file).slice(0, 200), args: args.slice(0, 6).map(String), cwd: where(isOpts(rest[at]) && rest[at].cwd ? rest[at].cwd : process.cwd()), call: name });
      if (isOpts(rest[at])) rest[at] = traced(rest[at]);
      return orig.call(this, file, ...rest);
    };
  }
  syncBuiltinESMExports();
  emit("start", { argv: process.argv.slice(1, 4).map((a) => where(a) || a), cwd: process.cwd() });
  process.on("exit", (code) => emit("exit", { code }));
}
