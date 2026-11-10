#!/usr/bin/env node
// One worktree ("lane") per writing session, always started from current origin/main.
//
//   node scripts/lanes.mjs new <branch> [--dir <name>] [--base <ref>]   create a lane, print its path
//   node scripts/lanes.mjs list                                         read-only overview of every lane
//   node scripts/lanes.mjs finish <path> [--dry-run]                    remove a lane whose work is on main
//   node scripts/lanes.mjs hook-create | hook-remove                    Claude Code WorktreeCreate/Remove hooks
//
// Lanes live in <primary>/.worktrees/<name>. Nothing here resets, overwrites or force-deletes work:
// a lane with uncommitted changes, or commits main does not have, is always kept.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, symlinkSync } from "node:fs";
import path from "node:path";

const log = (msg) => process.stderr.write(`${msg}\n`);
const fail = (msg) => {
  log(`lanes: ${msg}`);
  process.exit(1);
};

function run(cmd, args, cwd, { quiet = false } = {}) {
  try {
    // trimEnd, not trim: porcelain output starts with meaningful spaces (" M file").
    return execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trimEnd();
  } catch (error) {
    if (quiet) return null;
    throw new Error(`${cmd} ${args.join(" ")}: ${(error.stderr || error.message).toString().trim()}`);
  }
}
const git = (args, cwd, opts) => run("git", args, cwd, opts);

const here = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const primary = path.dirname(git(["rev-parse", "--path-format=absolute", "--git-common-dir"], here));
const laneRoot = path.join(primary, ".worktrees");
const real = (p) => (existsSync(p) ? realpathSync(p) : path.resolve(p));
const isPrimary = (p) => real(p) === real(primary);

const slug = (s) =>
  s.toLowerCase().replace(/^claude\//, "").replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || `lane-${Date.now()}`;

function fetchMain() {
  if (git(["fetch", "--quiet", "origin", "main"], primary, { quiet: true }) === null)
    log("lanes: could not reach origin; using the last fetched origin/main");
}

export function createLane({ branch, dir, base = "origin/main" }) {
  if (!branch) throw new Error("a branch name is required");
  fetchMain();
  const lanePath = path.join(laneRoot, slug(dir || branch));
  if (existsSync(lanePath)) throw new Error(`${lanePath} already exists; pick another name or reuse that lane`);
  if (git(["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`], primary, { quiet: true }))
    throw new Error(`branch ${branch} already exists; pick another name`);
  mkdirSync(laneRoot, { recursive: true });
  // --no-track: a lane branch must never push to main by accident.
  git(["worktree", "add", "--no-track", "-b", branch, lanePath, base], primary);
  // Scratch output written in the lane lands in the primary checkout's .artifacts (gitignored),
  // so the app can open it and it survives the lane's removal.
  const artifacts = path.join(primary, ".artifacts");
  mkdirSync(artifacts, { recursive: true });
  try {
    symlinkSync(artifacts, path.join(lanePath, ".artifacts"), "junction");
  } catch (error) {
    log(`lanes: could not link .artifacts (${error.message}); write scratch files under ${artifacts}`);
  }
  log(`lanes: ${branch} at ${lanePath}, from ${git(["rev-parse", "--short", base], primary)}`);
  return real(lanePath);
}

function lanes() {
  const out = git(["worktree", "list", "--porcelain"], primary);
  return out.split("\n\n").filter(Boolean).map((block) => {
    const lane = {};
    for (const line of block.split("\n")) {
      const [key, ...rest] = line.split(" ");
      if (key === "worktree") lane.path = rest.join(" ");
      if (key === "HEAD") lane.head = rest[0];
      if (key === "branch") lane.branch = rest[0].replace("refs/heads/", "");
      if (key === "detached") lane.branch = "(detached)";
      if (key === "prunable") lane.prunable = true;
    }
    return lane;
  });
}

// strict: any git failure throws, so removal is refused instead of guessing "clean" or "no commits".
function status(p, { strict = false } = {}) {
  const quiet = !strict;
  if (strict) git(["rev-parse", "--verify", "--quiet", "origin/main"], p);
  const dirty = (git(["status", "--porcelain"], p, { quiet }) || "").split("\n").filter(Boolean);
  const ahead = Number(git(["rev-list", "--count", "origin/main..HEAD"], p, { quiet }) || 0);
  const committed = (git(["diff", "--name-only", "origin/main...HEAD"], p, { quiet }) || "").split("\n");
  const files = new Set([...committed, ...dirty.map((l) => l.slice(3))].filter(Boolean));
  return { dirty: dirty.length, ahead, files };
}

// Merged when main already contains the tip, or a merged PR's head was exactly this tip (squash merges).
function merged(p, branch) {
  const head = git(["rev-parse", "HEAD"], p);
  if (git(["merge-base", "--is-ancestor", head, "origin/main"], p, { quiet: true }) !== null) return "on main";
  if (!branch || branch === "(detached)") return null;
  const prs = run("gh", ["pr", "list", "--head", branch, "--state", "merged", "--json", "number,headRefOid"], p, { quiet: true });
  if (!prs) return null;
  const hit = JSON.parse(prs).find((pr) => pr.headRefOid === head);
  return hit ? `merged in #${hit.number}` : null;
}

// Removes a lane only if it is clean and its work is on main. Returns why it was kept, or null once removed.
function removeLane(lanePath, { dryRun = false } = {}) {
  if (!existsSync(lanePath)) {
    git(["worktree", "prune"], primary, { quiet: true });
    return null;
  }
  if (isPrimary(lanePath)) return "it is the primary checkout";
  if (real(process.cwd()).startsWith(real(lanePath) + path.sep) || real(process.cwd()) === real(lanePath))
    return "you are inside it; run this from another checkout";
  const lane = lanes().find((l) => real(l.path) === real(lanePath));
  if (!lane) return "git does not know it as a worktree";
  fetchMain();
  let dirty, ahead;
  try {
    ({ dirty, ahead } = status(lanePath, { strict: true }));
  } catch (error) {
    return `its state could not be checked (${error.message.split("\n")[0]})`;
  }
  if (dirty) return `it has ${dirty} uncommitted change(s)`;
  const how = ahead ? merged(lanePath, lane.branch) : "no commits of its own";
  if (!how) return `its ${ahead} commit(s) are not on main and no merged PR has this exact tip`;
  if (dryRun) {
    log(`lanes: would remove ${lanePath} and branch ${lane.branch} (${how})`);
    return null;
  }
  git(["worktree", "remove", "--force", lanePath], primary);
  git(["worktree", "prune"], primary, { quiet: true });
  if (lane.branch && !["main", "(detached)"].includes(lane.branch)) git(["branch", "-D", lane.branch], primary, { quiet: true });
  log(`lanes: removed ${lanePath} and branch ${lane.branch} (${how})`);
  return null;
}

function list() {
  fetchMain();
  const all = lanes().map((l) => ({ ...l, ...(l.prunable || !existsSync(l.path) ? { dirty: 0, ahead: 0, files: new Set() } : status(l.path)) }));
  const seen = new Map();
  for (const l of all) for (const f of l.files) seen.set(f, (seen.get(f) || 0) + 1);
  for (const l of all) {
    const overlap = [...l.files].filter((f) => seen.get(f) > 1);
    const tag = isPrimary(l.path) ? " (primary)" : l.prunable ? " (missing; run git worktree prune)" : "";
    console.log(`${l.path}${tag}\n  ${l.branch}  ${l.dirty} uncommitted, ${l.ahead} ahead of origin/main${overlap.length ? `\n  overlaps another lane: ${overlap.join(", ")}` : ""}`);
  }
}

const stdinJson = () => {
  const raw = readFileSync(0, "utf8").trim();
  return raw ? JSON.parse(raw) : {};
};
const flag = (args, name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args.splice(i, 2)[1];
};

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === "new") {
    const dir = flag(args, "--dir");
    const base = flag(args, "--base");
    console.log(createLane({ branch: args[0], dir, base }));
  } else if (cmd === "list") {
    list();
  } else if (cmd === "finish") {
    const dryRun = args.includes("--dry-run");
    const target = args.find((a) => !a.startsWith("--"));
    if (!target) fail("give the lane's path");
    const kept = removeLane(path.resolve(target), { dryRun });
    if (kept) fail(`kept ${target}: ${kept}`);
  } else if (cmd === "hook-create") {
    // Claude Code reads the worktree path from the last line of stdout; everything else goes to stderr.
    const input = stdinJson();
    const name = slug(input.name || `session-${Date.now()}`);
    console.log(createLane({ branch: `claude/${name}`, dir: name, base: input.commit || "origin/main" }));
  } else if (cmd === "hook-remove") {
    // Claude Code does not double-check before this runs (ExitWorktree with discard_changes), so this is the last guard.
    const { worktree_path: target } = stdinJson();
    if (!target) fail("no worktree_path in hook input");
    const kept = removeLane(target);
    if (kept) fail(`kept ${target}: ${kept}. Commit and merge it, or remove it by hand once you are sure.`);
  } else {
    fail("usage: lanes.mjs new <branch> [--dir name] [--base ref] | list | finish <path> [--dry-run] | hook-create | hook-remove");
  }
} catch (error) {
  fail(error.message);
}
