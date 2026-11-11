#!/usr/bin/env node
// Turns a router log (.artifacts/agent-kit/router-log.jsonl) into draft routing cases.
// Each draft still needs a person to remove project details, set `expect`, and check the context.
// Usage, from the repo root: node tests/routing/from-log.mjs <router-log.jsonl> > drafts.json
import fs from "node:fs";

export function draftsFromLog(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      // A half-written line is skipped, not fatal.
    }
  }
  const drafts = [];
  for (const [i, row] of rows.entries()) {
    if (!row.request || !row.route) continue;
    const next = rows[i + 1];
    const outcome = next && !next.request && next.router === row.router ? next : {};
    drafts.push({
      router: row.router,
      request: row.request.startsWith(row.router) ? row.request : `${row.router} ${row.request}`,
      picked: row.route,
      outcome: outcome.outcome || "unknown",
      ...(outcome.to ? { asked_for_instead: outcome.to } : {}),
      started_on_its_own: row.auto === true,
      source: "observed",
    });
  }
  return drafts;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node tests/routing/from-log.mjs <router-log.jsonl>");
    process.exit(1);
  }
  const drafts = draftsFromLog(fs.readFileSync(file, "utf8"));
  console.log(JSON.stringify(drafts, null, 2));
  const counts = drafts.reduce((m, d) => ((m[d.outcome] = (m[d.outcome] || 0) + 1), m), {});
  console.error(`${drafts.length} picks: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ")}`);
}
