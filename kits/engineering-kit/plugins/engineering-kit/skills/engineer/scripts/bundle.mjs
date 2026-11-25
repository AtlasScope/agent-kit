#!/usr/bin/env node
// Assembles an evidence bundle (atlasscope.evidence/v1, see evidence.mjs) from instrument output and the
// agent's own claims, and validates it. The instruments record what was observed; the claims say what the
// agent concludes from it. A bundle is data: it never authorizes a change to code, data or configuration.
//
//   node bundle.mjs --title "<title>" [--claims claims.json] [--id <id>] <output.json>...  > bundle.json
//
// Each <output.json> is what structure.mjs, history.mjs or case.mjs printed with --json; it becomes one source,
// and its observations keep their ids behind the source's name: structure.o4, history.o2, case.o1.
// What no instrument records (a command run against the real checkout, a page checked in a browser, a log read)
// goes in by hand, in the same shape. The least a hand-written source needs:
//   { "tool": "checks", "repository": "owner/repo", "revision": "<full commit hash, or working-tree>",
//     "evidence": { "scope": "runtime-observation", "method": "What ran, where and how.", "limits": "What it did not show.",
//                   "subjects": [{ "kind": "file", "key": "site/lib/copy.ts", "label": "copy.ts" }],
//                   "observations": [{ "id": "o1", "locator": "npm test", "subjects": ["site/lib/copy.ts"], "kind": "command-run",
//                                      "summary": "12 tests, 12 pass.", "details": {} }] } }
// "title" (or "targets") names the source on the page; "scope" is one of the contract's scopes (evidence.mjs).
// When the outputs come from different revisions the bundle records "working-tree" and says so on stderr;
// each source's method keeps its own revision.
// claims.json is optional:
//   { "claims": [{ "id": "copy-drift", "title": "...", "statement": "...", "status": "supported",
//                  "limits": "...", "subjects": ["site/lib/copy.ts"], "links": [{ "observation": "structure.o12", "relation": "supports" }] }],
//     "decisions": [{ "id": "...", "title": "...", "recommendation": "...", "claims": ["copy-drift"], "verification": "..." }],
//     "cases": [{ "id": "...", "title": "...", "question": "...", "summary": "...", "subjects": [...], "claims": [...], "decisions": [...] }] }
// Subjects may be named by path (or experiment key); a claim's scope defaults to the scope of the first
// observation it links as support or refutation.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { SCHEMA, validateBundle } from "./evidence.mjs";

const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/;

/**
 * Every claim link the contract would refuse, named by claim and observation, so the one to fix is plain.
 * The contract (evidence.mjs) checks the same rules but stops at the first, without saying where.
 */
export function linkProblems(claims, observations, sources, subjects = []) {
  const obs = new Map(observations.map((o) => [o.id, o])), scope = new Map(sources.map((s) => [s.id, s.scope]));
  const key = new Map(subjects.map((s) => [s.id, s.key]));
  const out = [];
  for (const c of claims) for (const l of c.links || []) {
    const o = obs.get(l.observation);
    const at = `claim ${c.id}, observation ${l.observation}`;
    if (!o) { out.push(`${at}: no such observation. Ids are the source's name and the instrument's id, such as structure.o4.`); continue; }
    if (!["supports", "refutes", "context"].includes(l.relation)) { out.push(`${at}: relation is supports, refutes or context, not ${JSON.stringify(l.relation)}.`); continue; }
    if (l.relation === "context") continue;
    const from = scope.get(o.source);
    if (from !== c.scope) out.push(`${at}: ${from} evidence cannot ${l.relation === "supports" ? "support" : "refute"} a ${c.scope} claim. Link it as context, or give the claim evidence from its own scope.`);
    else if (!o.subjects.some((s) => c.subjects.includes(s))) out.push(`${at}: shares no subject with the claim. Add one of its subjects to the claim (${o.subjects.slice(0, 5).map((s) => key.get(s) ?? s).join(", ")}), or link it as context.`);
  }
  return out;
}

export function assemble(inputs, { title, id = "engineer", claims = {}, now = new Date(), warn = (m) => process.stderr.write(`${m}\n`) } = {}) {
  if (!title) throw new Error("--title is required");
  if (!inputs.length) throw new Error("Give at least one instrument output (--json) file");
  const sources = [], subjects = [], observations = [];
  const subjectId = new Map(), names = new Set();
  const subj = (s) => {
    const k = `${s.kind}\0${s.key}`;
    if (!subjectId.has(k)) { const sid = `s${subjects.length + 1}`; subjectId.set(k, sid); subjects.push({ id: sid, kind: s.kind, key: s.key, label: String(s.label || s.key).slice(0, 200) }); }
    return subjectId.get(k);
  };
  const repos = new Set(), revisionOf = new Map();
  for (const { file, text, base } of inputs) {
    const r = JSON.parse(text);
    if (!r?.evidence || !r.tool) throw new Error(`${file}: not instrument output; run the instrument with --json, or write the source by hand in the shape at the top of bundle.mjs`);
    for (const k of ["scope", "method", "limits"]) if (typeof r.evidence[k] !== "string") throw new Error(`${file}: evidence.${k} is missing`);
    for (const k of ["subjects", "observations"]) if (!Array.isArray(r.evidence[k])) throw new Error(`${file}: evidence.${k} must be a list`);
    repos.add(r.repository);
    const rev = r.revision;
    let name = r.tool, n = 2;
    while (names.has(name)) name = `${r.tool}-${n++}`;
    names.add(name);
    if (rev) revisionOf.set(name, rev);
    const byKey = new Map(r.evidence.subjects.map((s) => [s.key, s]));
    let artifact = path.relative(base, path.resolve(file)).split(path.sep).join("/");
    if (!artifact || artifact.startsWith("..") || path.isAbsolute(artifact)) artifact = path.basename(file);
    const about = r.targets?.length ? r.targets.join(", ") : r.title;
    const label = `${r.tool}${about ? ` · ${about}` : ""}`.slice(0, 200);
    sources.push({ id: name, label, scope: r.evidence.scope, artifact, sha256: crypto.createHash("sha256").update(text).digest("hex"), method: `${r.evidence.method}${rev ? ` Revision ${rev}.` : ""}`.slice(0, 4000), limits: r.evidence.limits.slice(0, 4000) });
    for (const o of r.evidence.observations) {
      observations.push({ id: `${name}.${o.id}`, source: name, locator: o.locator, subjects: [...new Set((o.subjects || []).map((k) => subj(byKey.get(k) || { kind: "file", key: k, label: k })))], kind: o.kind, summary: o.summary, details: o.details ?? {} });
    }
  }
  if (repos.size > 1) throw new Error(`The outputs come from different repositories: ${[...repos].join(", ")}`);
  const revisions = new Set(revisionOf.values());
  const revision = revisions.size === 1 ? [...revisions][0] : "working-tree";
  if (revisions.size > 1) warn(`Note: the sources read different revisions, so the bundle records "working-tree" (each source's method keeps its own): ${[...revisionOf].map(([s, r]) => `${s} ${r === "working-tree" ? r : r.slice(0, 12)}`).join(", ")}.`);
  const obsById = new Map(observations.map((o) => [o.id, o]));
  const scopeOf = new Map(sources.map((s) => [s.id, s.scope]));
  const keyToId = (k) => {
    if (subjects.some((s) => s.id === k)) return k;
    const hit = subjects.find((s) => s.key === k);
    if (hit) return hit.id;
    return subj({ kind: k.endsWith("/") ? "directory" : "file", key: k, label: path.posix.basename(k.replace(/\/$/, "")) });
  };
  const list = Array.isArray(claims) ? { claims } : claims;
  const outClaims = (list.claims || []).map((c) => {
    const first = (c.links || []).find((l) => l.relation !== "context" && obsById.has(l.observation));
    return {
      id: c.id, title: c.title, statement: c.statement,
      scope: c.scope || (first ? scopeOf.get(obsById.get(first.observation).source) : sources[0].scope),
      status: c.status, limits: c.limits,
      links: (c.links || []).map((l) => ({ observation: l.observation, relation: l.relation })),
      subjects: [...new Set((c.subjects || []).map(keyToId))],
    };
  });
  const outDecisions = (list.decisions || []).map((d) => ({ id: d.id, title: d.title, recommendation: d.recommendation, state: "proposed", claims: d.claims, verification: d.verification }));
  const outCases = (list.cases || []).map((k) => ({ id: k.id, title: k.title, question: k.question, summary: k.summary, subjects: [...new Set((k.subjects || []).map(keyToId))], claims: k.claims || [], decisions: k.decisions || [] }));
  const problems = linkProblems(outClaims, observations, sources, subjects);
  if (problems.length) throw new Error(`${problems.length === 1 ? "one claim link" : `${problems.length} claim links`} the evidence contract refuses:\n- ${problems.slice(0, 20).join("\n- ")}`);
  const bundle = {
    schema: SCHEMA,
    id,
    title,
    project: { repository: [...repos][0], revision },
    producer: { capability: "engineer", at: now.toISOString() },
    subjects, sources, observations,
    claims: outClaims, decisions: outDecisions, cases: outCases,
  };
  return validateBundle(bundle);
}

function main(argv) {
  let title = null, id = "engineer", claimsFile = null;
  const files = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--title") title = argv[++i];
    else if (a === "--id") id = argv[++i];
    else if (a === "--claims") claimsFile = argv[++i];
    else if (a === "-h" || a === "--help") { console.log('Usage: node bundle.mjs --title "<title>" [--claims claims.json] [--id <id>] <output.json>...'); return 0; }
    else if (a.startsWith("--")) throw new Error(`Unknown option ${a}`);
    else files.push(a);
  }
  if (!ID.test(id)) throw new Error("--id: letters, digits and . _ : - only");
  const base = process.cwd();
  const inputs = files.map((file) => ({ file, text: fs.readFileSync(file, "utf8"), base }));
  const claims = claimsFile ? JSON.parse(fs.readFileSync(claimsFile, "utf8")) : {};
  process.stdout.write(JSON.stringify(assemble(inputs, { title, id, claims }), null, 2) + "\n");
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); } catch (e) { console.error(`Bundle not valid: ${e.message}`); process.exitCode = 1; }
}
