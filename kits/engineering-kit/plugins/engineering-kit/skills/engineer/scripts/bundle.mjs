#!/usr/bin/env node
// Assembles an evidence bundle (atlasscope.evidence/v1, see evidence.mjs) from instrument output and the
// agent's own claims, and validates it. The instruments record what was observed; the claims say what the
// agent concludes from it. A bundle is data: it never authorizes a change to code, data or configuration.
//
//   node bundle.mjs --title "<title>" [--claims claims.json] [--id <id>] <output.json>...  > bundle.json
//
// Each <output.json> is what structure.mjs, history.mjs or case.mjs printed with --json; it becomes one source,
// and its observations keep their ids behind the source's name: structure.o4, history.o2, case.o1.
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

export function assemble(inputs, { title, id = "engineer", claims = {}, now = new Date() } = {}) {
  if (!title) throw new Error("--title is required");
  if (!inputs.length) throw new Error("Give at least one instrument output (--json) file");
  const sources = [], subjects = [], observations = [];
  const subjectId = new Map(), names = new Set();
  const subj = (s) => {
    const k = `${s.kind}\0${s.key}`;
    if (!subjectId.has(k)) { const sid = `s${subjects.length + 1}`; subjectId.set(k, sid); subjects.push({ id: sid, kind: s.kind, key: s.key, label: String(s.label || s.key).slice(0, 200) }); }
    return subjectId.get(k);
  };
  const repos = new Set(), revisions = new Set();
  for (const { file, text, base } of inputs) {
    const r = JSON.parse(text);
    if (!r?.evidence || !r.tool) throw new Error(`${file}: not instrument output; run the instrument with --json`);
    repos.add(r.repository);
    const rev = r.revision;
    if (rev) revisions.add(rev);
    let name = r.tool, n = 2;
    while (names.has(name)) name = `${r.tool}-${n++}`;
    names.add(name);
    const byKey = new Map(r.evidence.subjects.map((s) => [s.key, s]));
    let artifact = path.relative(base, path.resolve(file)).split(path.sep).join("/");
    if (!artifact || artifact.startsWith("..") || path.isAbsolute(artifact)) artifact = path.basename(file);
    const label = `${r.tool} · ${(r.targets || [r.title]).join(", ")}`.slice(0, 200);
    sources.push({ id: name, label, scope: r.evidence.scope, artifact, sha256: crypto.createHash("sha256").update(text).digest("hex"), method: `${r.evidence.method}${rev ? ` Revision ${rev}.` : ""}`.slice(0, 4000), limits: r.evidence.limits.slice(0, 4000) });
    for (const o of r.evidence.observations) {
      observations.push({ id: `${name}.${o.id}`, source: name, locator: o.locator, subjects: [...new Set(o.subjects.map((k) => subj(byKey.get(k) || { kind: "file", key: k, label: k })))], kind: o.kind, summary: o.summary, details: o.details });
    }
  }
  if (repos.size > 1) throw new Error(`The outputs come from different repositories: ${[...repos].join(", ")}`);
  const revision = revisions.size === 1 ? [...revisions][0] : "working-tree";
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
