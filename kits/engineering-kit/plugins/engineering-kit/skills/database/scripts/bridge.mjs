#!/usr/bin/env node
// A reconciliation bridge with exact arithmetic: from one figure to another through ordered steps, with whatever
// the steps do not explain reported as the residual, never folded into a step.
//
//   node bridge.mjs bridge.json        (or the JSON on standard input)
//
// {
//   "unit": "USD cents",
//   "from": { "label": "Independent statement, comparable accounts", "value": 670500 },
//   "steps": [ { "label": "Ingestion mismatch", "value": -2000 }, ... ],        signed contributions, in order
//     or "stages": [ { "label": "...", "value": 668500 }, ... ]                 running totals; each step is the change
//   "to": { "label": "Report, comparable accounts", "value": 689000 },         the observed figure
//   "outside": [ { "label": "Reported with no independent evidence", "value": 43000 } ],   kept out of the bridge
//   "keys": [ { "key": "A02", "delta": 87500 }, ... ]                           per-key differences, for net versus gross
// }
//
// Values are whole numbers or decimal strings ("12.30"); JavaScript numbers that are not safe integers are
// refused, so pass large or fractional amounts as strings. A bridge is order-specific: when steps interact,
// another order gives other contributions with the same total.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const fail = (m) => { throw new Error(m); };
const DECIMAL = /^-?\d+(\.\d+)?$/;

function parts(v, where) {
  if (typeof v === "number") { if (!Number.isSafeInteger(v)) fail(`${where}: ${v} is not a safe whole number; pass it as a decimal string`); v = String(v); }
  if (typeof v !== "string" || !DECIMAL.test(v)) fail(`${where}: expected a number or a decimal string, got ${JSON.stringify(v)}`);
  const neg = v.startsWith("-"), [whole, frac = ""] = (neg ? v.slice(1) : v).split(".");
  return { neg, whole, frac };
}

/** Exact bridge. Returns contributions with running totals, the residual and, with keys, net versus gross. */
export function bridge(input) {
  if (!input || typeof input !== "object") fail("Give the bridge as a JSON object");
  const { unit = "", from, to, steps, stages, outside = [], keys = [] } = input;
  if (!from || !to) fail('A bridge needs "from" and "to"');
  if (!!steps === !!stages) fail('Give either "steps" (contributions) or "stages" (running totals), not both');
  const list = steps || stages;
  if (!Array.isArray(list) || !Array.isArray(outside) || !Array.isArray(keys)) fail("steps, stages, outside and keys must be lists");
  const raw = [["from", from.value], ["to", to.value], ...list.map((s, i) => [`step ${i + 1}`, s.value]), ...outside.map((o, i) => [`outside ${i + 1}`, o.value]), ...keys.map((k, i) => [`key ${k.key ?? i + 1}`, k.delta])];
  const parsed = raw.map(([where, v]) => parts(v, where));
  const scale = Math.max(0, ...parsed.map((p) => p.frac.length));
  const toInt = (p) => (p.neg ? -1n : 1n) * BigInt(p.whole + p.frac.padEnd(scale, "0"));
  const ints = parsed.map(toInt);
  const show = (n) => {
    if (scale === 0) return Number.isSafeInteger(Number(n)) ? Number(n) : String(n);
    const s = (n < 0n ? -n : n).toString().padStart(scale + 1, "0");
    return `${n < 0n ? "-" : ""}${s.slice(0, -scale)}.${s.slice(-scale)}`;
  };
  const [start, end] = ints;
  const listInts = ints.slice(2, 2 + list.length);
  const outsideInts = ints.slice(2 + list.length, 2 + list.length + outside.length);
  const keyInts = ints.slice(2 + list.length + outside.length);
  let running = start, previous = start;
  const rows = list.map((s, i) => {
    const contribution = stages ? listInts[i] - previous : listInts[i];
    previous = stages ? listInts[i] : previous;
    running += contribution;
    return { label: String(s.label ?? `Step ${i + 1}`), value: show(contribution), running: show(running) };
  });
  const explained = running - start, observed = end - start, residual = observed - explained;
  const out = {
    unit,
    from: { label: String(from.label ?? "From"), value: show(start) },
    steps: rows,
    to: { label: String(to.label ?? "To"), value: show(end) },
    observed: show(observed),
    explained: show(explained),
    residual: show(residual),
    exact: residual === 0n,
  };
  if (outside.length) {
    const total = outsideInts.reduce((a, b) => a + b, 0n);
    out.outside = { items: outside.map((o, i) => ({ label: String(o.label ?? `Outside ${i + 1}`), value: show(outsideInts[i]) })), total: show(total), to_plus_outside: show(end + total) };
  }
  if (keys.length) {
    const net = keyInts.reduce((a, b) => a + b, 0n), gross = keyInts.reduce((a, b) => a + (b < 0n ? -b : b), 0n);
    out.keys = { count: keys.length, net: show(net), gross: show(gross), raising: keyInts.filter((d) => d > 0n).length, lowering: keyInts.filter((d) => d < 0n).length, offsetting: gross > (net < 0n ? -net : net), matches_observed: net === observed };
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const file = process.argv[2];
    const result = bridge(JSON.parse(file && file !== "-" ? fs.readFileSync(file, "utf8") : fs.readFileSync(0, "utf8")));
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } catch (e) { console.error(e.message); process.exit(1); }
}
