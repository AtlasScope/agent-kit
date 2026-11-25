#!/usr/bin/env node
// Runs a read-only plan through psql and saves what came back, with where, when and as whom it ran.
//
//   node run.mjs <plan.json | -> [--out result.json] [--url-env NAME]
//   node run.mjs <plan.json | -> --print        print the script instead, for a host's own SQL tool
//
// The connection comes from the environment, never from the command line: a URL in AGENT_KIT_PG_URL (or the
// variable named by --url-env), otherwise psql's usual PGHOST/PGUSER/PGDATABASE, ~/.pgpass or service file.
// The URL is handed to psql as PG* variables, so it never appears in a process list, and it is never printed.
// psql comes from PATH, or AGENT_KIT_PSQL when it lives elsewhere. Needs psql 15 or later.
//
// The result holds every query's SQL and rows, the script's SHA-256, the limits, and what the server reported:
// database, role, server version, snapshot time, transaction_read_only, time zone and row_security. Numbers
// JavaScript cannot hold exactly (big integers, long decimals) are kept as their exact text.
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readOnlyScript } from "./sql.mjs";

const PARAMS = { sslmode: "PGSSLMODE", sslrootcert: "PGSSLROOTCERT", sslcert: "PGSSLCERT", sslkey: "PGSSLKEY", sslnegotiation: "PGSSLNEGOTIATION", application_name: "PGAPPNAME", connect_timeout: "PGCONNECT_TIMEOUT", options: "PGOPTIONS", target_session_attrs: "PGTARGETSESSIONATTRS", host: "PGHOST", port: "PGPORT", user: "PGUSER", dbname: "PGDATABASE", channel_binding: "PGCHANNELBINDING", gssencmode: "PGGSSENCMODE" };

/** PG* variables for a postgres:// or postgresql:// URL. Errors never repeat the URL. */
export function connectionEnv(url) {
  let u;
  try { u = new URL(url); } catch { throw new Error("The connection URL could not be read. For several hosts or an unusual form, set PGHOST, PGUSER and the other PG* variables instead."); }
  if (!["postgres:", "postgresql:"].includes(u.protocol)) throw new Error("The connection URL must start with postgres:// or postgresql://");
  const env = {};
  if (u.hostname) env.PGHOST = decodeURIComponent(u.hostname.replace(/^\[|\]$/g, ""));
  if (u.port) env.PGPORT = u.port;
  if (u.username) env.PGUSER = decodeURIComponent(u.username);
  if (u.password) env.PGPASSWORD = decodeURIComponent(u.password);
  const db = decodeURIComponent(u.pathname.replace(/^\//, ""));
  if (db) env.PGDATABASE = db;
  for (const [key, value] of u.searchParams) {
    if (key === "password") { env.PGPASSWORD = value; continue; }
    if (!PARAMS[key]) throw new Error(`Connection parameter "${key}" is not supported here; set it as a PG* environment variable instead.`);
    env[PARAMS[key]] = value;
  }
  return env;
}

// Keeps a number's exact text when JavaScript would round it (needs JSON.parse source access, Node 21+).
const exact = (_key, value, context) => (typeof value === "number" && context?.source !== undefined && String(value) !== context.source ? context.source : value);

/** The result object from psql's output (the script's JSON, which json_agg spreads over lines), rows cut to the cap. */
export function parseOutput(stdout, rowCap) {
  const text = String(stdout), at = text.search(/^\{\s*"ran"\s*:/m);
  if (at < 0) throw new Error("psql returned no result. psql 15 or later is needed; older versions print only the last statement's output.");
  const out = JSON.parse(text.slice(at).trim(), exact);
  const results = {};
  for (const [name, rows] of Object.entries(out.results || {})) results[name] = { rows: rows.slice(0, rowCap), truncated: rows.length > rowCap };
  return { ran: out.ran, results };
}

/** Runs the plan and returns the result object. Throws with psql's own message on failure. */
export function runPlan(plan, { psql = process.env.AGENT_KIT_PSQL || "psql", env = process.env, url } = {}) {
  const { script, queries, limits } = readOnlyScript(plan);
  // psql -c sends the text as written, with no psql variables or backslash commands; Windows caps a command line near 32,000 characters.
  if (script.length > 30000) throw new Error("This plan's script is too long for one command line; split it into two plans.");
  const childEnv = { ...env, ...(url ? connectionEnv(url) : {}) };
  delete childEnv.AGENT_KIT_PG_URL;
  let stdout;
  try {
    stdout = execFileSync(psql, ["-X", "-A", "-t", "-q", "-w", "-c", script], { env: childEnv, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, timeout: limits.statementTimeoutMs + 30000, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  } catch (e) {
    if (e.code === "ENOENT") throw new Error(`psql was not found${psql === "psql" ? " on PATH" : ` at ${psql}`}. Install the PostgreSQL client, set AGENT_KIT_PSQL, or use --print and the host's SQL tool.`);
    const message = String(e.stderr || e.message || "").trim().split("\n").filter(Boolean).slice(-3).join("\n");
    throw new Error(message || "psql failed");
  }
  const { ran, results } = parseOutput(stdout, limits.rowCap);
  return {
    tool: "agent-kit database run.mjs",
    ran,
    limits,
    script_sha256: crypto.createHash("sha256").update(script).digest("hex"),
    queries: queries.map((q) => ({ name: q.name, ...(q.builder ? { builder: q.builder } : {}), sql: q.sql })),
    results,
  };
}

function main(argv) {
  const args = [...argv];
  const take = (flag) => { const i = args.indexOf(flag); if (i < 0) return undefined; const v = args[i + 1]; if (!v || v.startsWith("--")) throw new Error(`${flag} needs a value`); args.splice(i, 2); return v; };
  const print = args.includes("--print");
  if (print) args.splice(args.indexOf("--print"), 1);
  const out = take("--out"), urlEnv = take("--url-env");
  if (args.length !== 1) throw new Error("Usage: node run.mjs <plan.json | -> [--out result.json] [--url-env NAME] [--print]");
  const plan = JSON.parse(args[0] === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(args[0], "utf8"));
  if (print) { process.stdout.write(readOnlyScript(plan).script); return; }
  const name = urlEnv || "AGENT_KIT_PG_URL";
  if (urlEnv && !process.env[urlEnv]) throw new Error(`${urlEnv} is not set`);
  const result = runPlan(plan, { url: process.env[name] || undefined });
  const text = JSON.stringify(result, null, 2) + "\n";
  if (out) { fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); fs.writeFileSync(out, text); console.log(`Saved ${Object.keys(result.results).length} results to ${out} (${result.ran.role} on ${result.ran.database}, PostgreSQL ${result.ran.server}, read_only=${result.ran.read_only}).`); }
  else process.stdout.write(text);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(1); }
}
