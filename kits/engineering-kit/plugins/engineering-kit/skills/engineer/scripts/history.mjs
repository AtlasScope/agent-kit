#!/usr/bin/env node
// What really happened to a set of paths in Git: how often they changed, which other files changed in the
// same commits, and how that compares with how often those files change anyway. Read-only: it reads Git
// objects at a pinned commit and never checks out, fetches or writes.
//
//   node history.mjs <path>... [--ref <rev>] [--limit <commits>] [--since <date>] [--max-files <n>]
//                    [--min-support <n>] [--top <n>] [--generated <path>]... [--include-generated] [--root <repo>] [--json]
//
// Each first-parent commit is one observed change set (a squash-merged pull request is one). Commits that
// touch more than --max-files files (default 50: formatting sweeps, renames, vendoring) are left out of
// every count and listed. Co-change is reported as support counts against a base rate:
//   "changed in 5 of the 8 commits that touched the target (63%); changes in 12 of 296 commits overall (4%)"
// That describes the sample. It is not a prediction, and it never shows that one change caused another.
// Renames are not followed: a renamed file's older history is under its old name.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildGraph, relations, generatedFiles } from "./structure.mjs";

const P = path.posix;

function git(root, args) {
  return execFileSync("git", ["-c", "core.quotepath=false", ...args], { cwd: root, encoding: "utf8", maxBuffer: 512 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
}

function repoName(root) {
  try {
    const url = git(root, ["remote", "get-url", "origin"]).trim();
    const m = /[/:]([\w.-]+\/[\w.-]+?)(\.git)?$/.exec(url);
    if (m) return m[1];
  } catch { /* no remote */ }
  return path.basename(root);
}

/** First-parent commits from a pinned revision, each with every path it changed against its first parent. */
export function collect(root, { ref = "HEAD", limit = 300, since = null } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20000) throw new Error("--limit must be 1 to 20000");
  const revision = git(root, ["rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`]).trim();
  const shallow = git(root, ["rev-parse", "--is-shallow-repository"]).trim() === "true";
  const args = ["log", "--first-parent", "-m", "--no-renames", "--name-status", "-z", "--format=%x1e%H%x00%cI%x00%P%x00%s", `--max-count=${limit}`];
  if (since) args.push(`--since=${since}`);
  args.push(revision, "--");
  const commits = [];
  for (const rec of git(root, args).split("\x1e").slice(1)) {
    const parts = rec.split("\0");
    const [sha, date, parents, subject] = parts;
    const files = [];
    for (let i = 4; i + 1 < parts.length; i += 2) {
      const status = parts[i].replace(/^\n/, "");
      if (!status) { i--; continue; }
      files.push({ status: status[0], path: parts[i + 1] });
    }
    commits.push({ sha, date, subject, parents: parents ? parents.split(" ").length : 0, files });
  }
  // Did the window reach the first commit, or stop at the limit?
  const total = Number(git(root, ["rev-list", "--first-parent", "--count", revision]).trim());
  return { revision, shallow, commits, totalFirstParent: total };
}

const within = (p, t) => (t.endsWith("/") ? p.startsWith(t) : p === t);

/** Paths whose first lines say they are generated, plus any named on the command line. */
function generatedPaths(root, paths, extra) {
  const out = new Set(extra);
  for (const p of paths) {
    try {
      const fd = fs.openSync(path.join(root, ...p.split("/")), "r");
      const buf = Buffer.alloc(800);
      const n = fs.readSync(fd, buf, 0, 800, 0);
      fs.closeSync(fd);
      const head = buf.subarray(0, n).toString("utf8").split("\n").slice(0, 6).join("\n");
      if (/\b(generated|do not edit|don't edit|auto-?generated)\b/i.test(head)) out.add(p);
    } catch { /* gone from the working tree */ }
  }
  return out;
}

/** Counts for the targets, the files that changed alongside them, and each pair of targets. */
export function analyze(history, targets, { maxFiles = 50, minSupport = 2, top = 15, generated = new Set(), includeGenerated = false, exists = () => true, links = null } = {}) {
  if (!Number.isInteger(maxFiles) || maxFiles < 1) throw new Error("--max-files must be a positive whole number");
  if (!Number.isInteger(minSupport) || minSupport < 1) throw new Error("--min-support must be a positive whole number");
  const eligible = [], excluded = [];
  for (const c of history.commits) (c.files.length > maxFiles ? excluded : eligible).push(c);
  const N = eligible.length;
  const touches = (c, t) => c.files.some((f) => within(f.path, t));
  const counts = new Map();
  for (const c of eligible) for (const p of new Set(c.files.map((f) => f.path))) counts.set(p, (counts.get(p) || 0) + 1);
  const hit = eligible.filter((c) => targets.some((t) => touches(c, t)));
  const n = hit.length;
  const perTarget = targets.map((t) => {
    const mine = eligible.filter((c) => touches(c, t));
    const all = history.commits.filter((c) => touches(c, t));
    return {
      path: t,
      commits: mine.length,
      inBroadCommits: all.length - mine.length,
      added: all.find((c) => c.files.some((f) => within(f.path, t) && f.status === "A"))?.sha ?? null,
      last: mine[0] ? { sha: mine[0].sha, date: mine[0].date, subject: mine[0].subject } : null,
      first: mine.at(-1) ? { sha: mine.at(-1).sha, date: mine.at(-1).date } : null,
    };
  });
  // files that changed in the same commits as the targets
  const together = new Map();
  for (const c of hit) for (const p of new Set(c.files.map((f) => f.path))) {
    if (targets.some((t) => within(p, t))) continue;
    if (!together.has(p)) together.set(p, []);
    together.get(p).push(c.sha);
  }
  let hiddenGenerated = 0;
  const related = [];
  for (const [p, shas] of together) {
    if (shas.length < minSupport) continue;
    const isGen = generated.has(p);
    if (isGen && !includeGenerated) { hiddenGenerated++; continue; }
    const k = shas.length, b = counts.get(p);
    // with the current tree's structure: a co-change with no relationship the program can see is the one worth reading
    const link = links ? links.get(p) ?? null : undefined;
    related.push({ path: p, support: k, targetCommits: n, otherCommits: b, eligible: N, together: k / n, baseRate: b / N, lift: (k / n) / (b / N), commits: shas, generated: isGen, gone: !exists(p), ...(link !== undefined ? { link } : {}) });
  }
  related.sort((a, b) => b.support - a.support || b.lift - a.lift || a.path.localeCompare(b.path));
  // each pair of targets
  const pairs = [];
  for (let i = 0; i < targets.length; i++) for (let j = i + 1; j < targets.length; j++) {
    const a = targets[i], b = targets[j];
    const na = eligible.filter((c) => touches(c, a)).length, nb = eligible.filter((c) => touches(c, b)).length;
    const both = eligible.filter((c) => touches(c, a) && touches(c, b));
    pairs.push({ a, b, aCommits: na, bCommits: nb, both: both.length, eligible: N, lift: na && nb ? (both.length / na) / (nb / N) : null, commits: both.map((c) => c.sha) });
  }
  const window = {
    commits: history.commits.length,
    newest: history.commits[0]?.date ?? null,
    oldest: history.commits.at(-1)?.date ?? null,
    reachedStart: history.commits.length >= history.totalFirstParent,
  };
  return { eligible: N, excluded: excluded.map((c) => ({ sha: c.sha, files: c.files.length, subject: c.subject })), targetCommits: n, perTarget, related: related.slice(0, top), relatedTotal: related.length, hiddenGenerated, pairs, recent: hit.slice(0, 10).map((c) => ({ sha: c.sha, date: c.date, subject: c.subject, files: c.files.length })), window, options: { maxFiles, minSupport, top, includeGenerated } };
}

const pct = (x) => `${Math.round(x * 100)}%`;
const short = (s) => s.slice(0, 7);

export function report(root, history, a, targets, ref) {
  const repository = repoName(root);
  const limits = [
    `First-parent history from ${a.window.oldest?.slice(0, 10) ?? "?"} to ${a.window.newest?.slice(0, 10) ?? "?"} (${a.window.commits} commits${a.window.reachedStart ? ", back to the first commit" : ", older history not read"}).`,
    history.shallow ? "This is a shallow clone: only the commits it holds were read." : "",
    `${a.excluded.length} commit(s) that changed more than ${a.options.maxFiles} files were left out of every count.`,
    "Each commit is one observed change set; squash merges hide the steps inside a pull request. Renames are not followed. Co-change describes this sample and does not show cause, risk or a requirement to edit together.",
    a.related.some((r) => r.link !== undefined) ? "Structural links come from the current working tree (structure.mjs, three steps), not from each commit's tree; \"no structural link found\" means none the program can see." : "",
  ].filter(Boolean).join(" ");
  const subjects = new Map();
  const subj = (p) => { if (!subjects.has(p)) subjects.set(p, { kind: p.endsWith("/") ? "directory" : "file", key: p, label: P.basename(p.replace(/\/$/, "")) + (p.endsWith("/") ? "/" : "") }); return p; };
  const observations = [];
  const add = (o) => { const id = `o${observations.length + 1}`; observations.push({ id, ...o }); return id; };
  const targetIds = a.perTarget.map((t) => add({ locator: `git log --first-parent ${short(history.revision)} -- ${t.path}`, subjects: [subj(t.path)], kind: "history:changes", summary: `${t.path} changed in ${t.commits} of ${a.eligible} eligible commits${t.last ? `, most recently ${t.last.date.slice(0, 10)} (${short(t.last.sha)} "${t.last.subject}")` : ""}`, details: t }));
  const pairIds = a.pairs.map((p) => add({ locator: `${short(history.revision)}: commits touching both ${p.a} and ${p.b}`, subjects: [subj(p.a), subj(p.b)], kind: "history:pair", summary: `${p.a} and ${p.b} changed in the same commit ${p.both} time(s) (${p.a}: ${p.aCommits} commits, ${p.b}: ${p.bCommits}, of ${p.eligible})`, details: p }));
  const relatedIds = a.related.map((r) => add({ locator: `${short(history.revision)}: ${r.commits.slice(0, 5).map(short).join(" ")}${r.commits.length > 5 ? " ..." : ""}`, subjects: [...targets.map(subj), subj(r.path)], kind: "history:co-change", summary: `${r.path} changed in ${r.support} of the ${r.targetCommits} commits that touched the target (${pct(r.together)}); it changes in ${r.otherCommits} of ${r.eligible} commits overall (${pct(r.baseRate)})`, details: r }));
  return {
    tool: "history",
    repository,
    revision: history.revision,
    ref,
    targets,
    ...a,
    perTarget: a.perTarget.map((t, i) => ({ id: targetIds[i], ...t })),
    pairs: a.pairs.map((p, i) => ({ id: pairIds[i], ...p })),
    related: a.related.map((r, i) => ({ id: relatedIds[i], ...r })),
    shallow: history.shallow,
    coverage: limits,
    evidence: {
      scope: "repository-history",
      method: `history.mjs read first-parent commits from ${history.revision} with git log --first-parent -m --no-renames --name-status and counted, for each file, the commits it shared with the targets against the commits it appears in overall.`,
      limits,
      subjects: [...subjects.values()],
      observations,
    },
  };
}

const linkText = (l) => {
  if (l === undefined) return "";
  if (l === null) return "; no structural link found";
  if (l.relation === "mention") return `; named (${l.at})`;
  if (l.relation === "sibling") return `; also an input of ${l.through[0]} (${l.at})`;
  return `; ${l.relation} by ${l.kind} (${l.at})`;
};

export function toText(r) {
  const out = [];
  out.push(`History of ${r.targets.join(", ")} · ${r.repository} at ${short(r.revision)} (first parent, ${r.window.oldest?.slice(0, 10)} to ${r.window.newest?.slice(0, 10)})`);
  out.push(`Eligible commits: ${r.eligible} of ${r.window.commits}${r.excluded.length ? ` (${r.excluded.length} changed more than ${r.options.maxFiles} files and were left out: ${r.excluded.slice(0, 6).map((c) => short(c.sha)).join(", ")}${r.excluded.length > 6 ? ", ..." : ""})` : ""}${r.window.reachedStart ? "; reaches the first commit" : "; older history not read (--limit)"}.`);
  out.push("");
  for (const t of r.perTarget) out.push(`[${t.id}] ${t.path}: changed in ${t.commits} of ${r.eligible} commits${t.inBroadCommits ? ` (plus ${t.inBroadCommits} broad commit(s) left out)` : ""}${t.last ? `; last ${t.last.date.slice(0, 10)} ${short(t.last.sha)} "${t.last.subject}"` : ""}${t.added ? `; added in ${short(t.added)}` : ""}`);
  if (r.pairs.length) {
    out.push("", "Targets changed together");
    for (const p of r.pairs) out.push(`  [${p.id}] ${p.a} + ${p.b}: ${p.both} shared commit(s) (${p.aCommits} and ${p.bCommits} in all)${p.commits.length ? `: ${p.commits.slice(0, 6).map(short).join(" ")}` : ""}${linkText(p.link)}`);
  }
  out.push("", `Changed in the same commits (at least ${r.options.minSupport}; showing ${r.related.length} of ${r.relatedTotal}${r.hiddenGenerated ? `; ${r.hiddenGenerated} generated file(s) left out, --include-generated shows them` : ""})`);
  if (!r.related.length) out.push("  none at this support");
  for (const x of r.related) out.push(`  [${x.id}] ${x.path}${x.gone ? " (no longer in the tree)" : ""}${x.generated ? " (generated)" : ""}: ${x.support} of ${x.targetCommits} target commits (${pct(x.together)}) vs ${x.otherCommits} of ${x.eligible} overall (${pct(x.baseRate)})${linkText(x.link)}`);
  out.push("", "Recent commits touching the targets");
  if (!r.recent.length) out.push("  none in this window");
  for (const c of r.recent) out.push(`  ${short(c.sha)} ${c.date.slice(0, 10)} ${c.subject} (${c.files} files)`);
  out.push("", `Limits: ${r.coverage}`);
  return out.join("\n");
}

function main(argv) {
  const o = { targets: [], ref: "HEAD", limit: 300, since: null, maxFiles: 50, minSupport: 2, top: 15, generated: [], includeGenerated: false, json: false, root: null, structure: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], v = () => { if (i + 1 >= argv.length) throw new Error(`${a} needs a value`); return argv[++i]; };
    if (a === "--json") o.json = true;
    else if (a === "--no-structure") o.structure = false;
    else if (a === "--include-generated") o.includeGenerated = true;
    else if (a === "--ref") o.ref = v();
    else if (a === "--limit") o.limit = Number(v());
    else if (a === "--since") o.since = v();
    else if (a === "--max-files") o.maxFiles = Number(v());
    else if (a === "--min-support") o.minSupport = Number(v());
    else if (a === "--top") o.top = Number(v());
    else if (a === "--generated") o.generated.push(v());
    else if (a === "--root") o.root = v();
    else if (a === "-h" || a === "--help") { console.log("Usage: node history.mjs <path>... [--ref <rev>] [--limit <n>] [--since <date>] [--max-files <n>] [--min-support <n>] [--top <n>] [--generated <path>] [--include-generated] [--json]"); return 0; }
    else if (a.startsWith("--")) throw new Error(`Unknown option ${a}`);
    else o.targets.push(a);
  }
  if (!o.targets.length) throw new Error("Name at least one file or folder.");
  const cwd = process.cwd();
  const root = fs.realpathSync(execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: o.root ? path.resolve(o.root) : cwd, encoding: "utf8" }).trim());
  const rel = (t) => {
    let abs = path.resolve(cwd, t);
    try { abs = fs.realpathSync(abs); } catch { /* deleted or renamed paths keep their history */ }
    const r = path.relative(root, abs).split(path.sep).join("/");
    if (r.startsWith("..")) throw new Error(`${t} is outside the repository`);
    let isDir = t.endsWith("/");
    try { isDir ||= fs.statSync(abs).isDirectory(); } catch { /* gone */ }
    return isDir ? r.replace(/\/?$/, "/") : r;
  };
  const targets = o.targets.map(rel);
  const history = collect(root, { ref: o.ref, limit: o.limit, since: o.since });
  const candidates = new Set(history.commits.flatMap((c) => c.files.map((f) => f.path)));
  const tracked = new Set(git(root, ["ls-tree", "-r", "--name-only", "-z", history.revision]).split("\0").filter(Boolean));
  // The current tree's structure labels generated outputs and says which co-changes have a relationship behind them.
  let links = null, built = new Set(), g = null;
  const live = (list) => list.filter((t) => g.repo.kind(t.replace(/\/$/, "")));
  if (o.structure) {
    g = buildGraph(root);
    links = relations(g, live(targets), 3);
    built = generatedFiles(g);
  }
  const generated = new Set([...generatedPaths(root, [...candidates].filter((p) => tracked.has(p)), o.generated.map(rel)), ...built]);
  const a = analyze(history, targets, { maxFiles: o.maxFiles, minSupport: o.minSupport, top: o.top, includeGenerated: o.includeGenerated, generated, exists: (p) => tracked.has(p), links });
  if (g) for (const p of a.pairs) p.link = live([p.a]).length ? relations(g, [p.a], 3).get(p.b.replace(/\/$/, "")) ?? null : null;
  if (!a.perTarget.some((t) => t.commits || t.inBroadCommits)) console.error(`No commit in this window touched ${targets.join(", ")}. Check the path, or widen --limit or --since.`);
  const r = report(root, history, a, targets, o.ref);
  process.stdout.write((o.json ? JSON.stringify(r, null, 2) : toText(r)) + "\n");
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); } catch (e) { console.error(e.message.split("\n")[0]); process.exitCode = 1; }
}
