#!/usr/bin/env node
// Turns saved results into an evidence bundle (atlasscope.evidence/v1, see evidence.mjs) and checks it.
//
//   node bundle.mjs draft.json [--out bundle.json]
//
// The draft is a bundle with the mechanical parts left out. Paths are relative to the draft's folder.
//   - A source may name a run.mjs result instead of an artifact: { "id", "label", "result": "snapshot.json",
//     "limits" }. Its artifact, SHA-256 and method (database, role, server, snapshot time, limits, script digest)
//     are filled in from the file, and its scope defaults to "database-snapshot". Use "synthetic-fixture" when
//     the data is made up, whatever engine it ran on.
//   - Any other source gives "artifact"; its SHA-256 is computed, or checked when given.
//   - An observation may name { "source", "query": "<result name>" }: its locator becomes /results/<name> and,
//     unless given, its details hold that result's rows (up to 50) and whether they were cut off.
//   - "schema" and producer.at are filled in.
// The output is a bundle that validates under the contract, or an error naming what is wrong. A bundle is data:
// it never grants permission to change code, data, configuration or infrastructure.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { SCHEMA, validateBundle } from "./evidence.mjs";

const fail = (m) => { throw new Error(m); };
const ROWS_IN_DETAILS = 50;

function readInside(base, rel) {
  if (typeof rel !== "string" || !rel || path.isAbsolute(rel) || rel.split(/[\\/]/).includes("..")) fail(`Use a path inside the draft's folder: ${JSON.stringify(rel)}`);
  return fs.readFileSync(path.join(base, ...rel.split(/[\\/]/)));
}

/** The method line for a run.mjs result: what ran, where, as whom and when. */
export function snapshotMethod(result) {
  const r = result.ran || {}, l = result.limits || {};
  const names = (result.queries || []).map((q) => q.name).join(", ");
  return `Read-only queries (${names}) run as one statement in a READ ONLY transaction (transaction_read_only=${r.read_only}) on database ${r.database} as role ${r.role}, PostgreSQL ${r.server}, snapshot at ${r.at}; statement_timeout ${l.statementTimeoutMs} ms, lock_timeout ${l.lockTimeoutMs} ms, row cap ${l.rowCap}, time zone ${r.time_zone}, row_security ${r.row_security}. Script SHA-256 ${result.script_sha256}.`;
}

/** Fills in the mechanical parts of a draft and validates it. Returns the bundle. */
export function seal(draft, base = ".", { now = new Date() } = {}) {
  if (!draft || typeof draft !== "object") fail("The draft must be a JSON object");
  const results = new Map();
  const sources = (draft.sources || []).map((s) => {
    const { result, ...rest } = s;
    if (result !== undefined) {
      const bytes = readInside(base, result), parsed = JSON.parse(bytes.toString("utf8"));
      if (!parsed.ran || !parsed.results) fail(`${result} is not a run.mjs result`);
      results.set(s.id, parsed);
      const cut = Object.entries(parsed.results).filter(([, v]) => v.truncated).map(([k]) => k);
      if (!rest.limits) fail(`Source ${s.id}: say in "limits" what this evidence cannot show (whose data, which role, what was not checked)`);
      const limits = [rest.limits, cut.length ? `Results cut off at the row cap: ${cut.join(", ")}.` : ""].filter(Boolean).join(" ");
      return { scope: "database-snapshot", method: snapshotMethod(parsed), ...rest, limits, artifact: result.replace(/\\/g, "/"), sha256: crypto.createHash("sha256").update(bytes).digest("hex") };
    }
    const digest = crypto.createHash("sha256").update(readInside(base, rest.artifact)).digest("hex");
    if (rest.sha256 && rest.sha256 !== digest) fail(`Source ${s.id}: ${rest.artifact} does not match its recorded SHA-256`);
    return { ...rest, sha256: digest };
  });
  const observations = (draft.observations || []).map((o) => {
    const { query, ...rest } = o;
    if (query === undefined) return rest;
    const parsed = results.get(o.source) || fail(`Observation ${o.id}: source ${o.source} has no result file to read ${query} from`);
    const res = parsed.results[query] || fail(`Observation ${o.id}: ${query} is not in ${o.source}'s results`);
    return { locator: `/results/${query}`, details: { rows: res.rows.slice(0, ROWS_IN_DETAILS), rows_returned: res.rows.length, truncated: res.truncated }, ...rest };
  });
  const bundle = {
    schema: SCHEMA,
    ...draft,
    ...(draft.producer ? { producer: { ...draft.producer, at: draft.producer.at ?? now.toISOString() } } : {}),
    sources,
    observations,
    decisions: draft.decisions || [],
    cases: draft.cases || [],
  };
  return validateBundle(bundle);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2), i = args.indexOf("--out");
    const out = i >= 0 ? args.splice(i, 2)[1] : undefined;
    if (args.length !== 1) throw new Error("Usage: node bundle.mjs draft.json [--out bundle.json]");
    const bundle = seal(JSON.parse(fs.readFileSync(args[0], "utf8")), path.dirname(path.resolve(args[0])));
    const text = JSON.stringify(bundle, null, 2) + "\n";
    if (out) { fs.writeFileSync(out, text); console.log(`Valid bundle: ${bundle.subjects.length} subjects, ${bundle.sources.length} sources, ${bundle.observations.length} observations, ${bundle.claims.length} claims. Saved to ${out}.`); }
    else process.stdout.write(text);
  } catch (e) { console.error(e.message); process.exit(1); }
}
