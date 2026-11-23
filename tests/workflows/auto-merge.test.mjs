// Runs the `run:` script from .github/workflows/auto-merge.yml against a stub `gh`,
// so the retry on "Base branch was modified" is checked without touching GitHub.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, chmodSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, delimiter, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const workflow = readFileSync(join(root, ".github/workflows/auto-merge.yml"), "utf8");

// The workflow has one `run: |` block; take its lines until the indentation drops.
function extractScript(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => /^\s*run: \|\s*$/.test(l));
  assert.ok(start >= 0, "auto-merge.yml should have a `run: |` block");
  const body = [];
  let indent = null;
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "") { body.push(""); continue; }
    const width = line.match(/^ */)[0].length;
    if (indent === null) indent = width;
    if (width < indent) break;
    body.push(line.slice(indent));
  }
  return body.join("\n") + "\n";
}

const script = extractScript(workflow);

// The stub answers `gh pr merge` from merge-1, merge-2, ... (first line is the exit
// code, the rest is output) and `gh pr view` from view-1, view-2, ... It logs each call.
const STUB = `#!/usr/bin/env bash
dir="$STUB_DIR"
echo "$*" >> "$dir/calls"
case "$1 $2" in
  "pr merge") kind=merge ;;
  "pr view") kind=view ;;
  *) echo "unexpected gh call: $*" >&2; exit 99 ;;
esac
n=$(( $(cat "$dir/$kind.count" 2>/dev/null || echo 0) + 1 ))
echo "$n" > "$dir/$kind.count"
file="$dir/$kind-$n"
[ -f "$file" ] || { echo "no stub response for $kind call $n" >&2; exit 98; }
code=$(head -n 1 "$file")
tail -n +2 "$file"
exit "$code"
`;

const RACE = "GraphQL: Base branch was modified. Review and try the merge again. (mergePullRequest)";

function run({ merges, views = [], attempts = "4" }) {
  const dir = mkdtempSync(join(tmpdir(), "auto-merge-test-"));
  const bin = join(dir, "bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "gh"), STUB);
  chmodSync(join(bin, "gh"), 0o755);
  merges.forEach(([code, out], i) => writeFileSync(join(dir, `merge-${i + 1}`), `${code}\n${out}\n`));
  views.forEach((out, i) => writeFileSync(join(dir, `view-${i + 1}`), `0\n${out}\n`));
  writeFileSync(join(dir, "script.sh"), script);
  // Same shell flags GitHub Actions uses for `run:` steps.
  const result = spawnSync("bash", ["--noprofile", "--norc", "-eo", "pipefail", join(dir, "script.sh")], {
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${bin}${delimiter}${process.env.PATH}`,
      STUB_DIR: dir,
      URL: "https://github.com/o/r/pull/1",
      ATTEMPTS: attempts,
      RETRY_DELAY: "0",
    },
  });
  const callsFile = join(dir, "calls");
  const calls = existsSync(callsFile) ? readFileSync(callsFile, "utf8").trim().split("\n") : [];
  rmSync(dir, { recursive: true, force: true });
  return { code: result.status, out: result.stdout + result.stderr, calls };
}

const merges = (calls) => calls.filter((c) => c.startsWith("pr merge"));
const views = (calls) => calls.filter((c) => c.startsWith("pr view"));

test("merges on the first try without reading the PR again", () => {
  const r = run({ merges: [[0, ""]] });
  assert.equal(r.code, 0, r.out);
  assert.deepEqual(r.calls, ["pr merge https://github.com/o/r/pull/1 --auto --squash --delete-branch"]);
});

test("retries after main moves, then succeeds", () => {
  const r = run({ merges: [[1, RACE], [0, ""]], views: ["OPEN false false"] });
  assert.equal(r.code, 0, r.out);
  assert.equal(merges(r.calls).length, 2);
  assert.equal(views(r.calls).length, 1);
  assert.match(r.out, /retrying/);
});

test("other errors fail at once with gh's exit code and message", () => {
  const r = run({ merges: [[1, "GraphQL: Resource not accessible by integration"]] });
  assert.equal(r.code, 1);
  assert.match(r.out, /Resource not accessible/);
  assert.equal(merges(r.calls).length, 1);
  assert.equal(views(r.calls).length, 0);
});

test("a different error on a retry still fails", () => {
  const r = run({ merges: [[1, RACE], [4, "HTTP 401: Bad credentials"]], views: ["OPEN false false"] });
  assert.equal(r.code, 4);
  assert.match(r.out, /Bad credentials/);
});

test("gives up visibly after the last attempt", () => {
  const r = run({
    merges: [[1, RACE], [1, RACE], [1, RACE]],
    views: ["OPEN false false", "OPEN false false"],
    attempts: "3",
  });
  assert.equal(r.code, 1);
  assert.equal(merges(r.calls).length, 3);
  assert.match(r.out, /::error::.*gave up after 3 attempts/);
});

test("does not merge a PR that gained no-auto-merge between attempts", () => {
  const r = run({ merges: [[1, RACE]], views: ["OPEN false true"] });
  assert.equal(r.code, 0, r.out);
  assert.equal(merges(r.calls).length, 1);
  assert.match(r.out, /no-auto-merge; skipping/);
});

test("does not merge a PR that went back to draft between attempts", () => {
  const r = run({ merges: [[1, RACE]], views: ["OPEN true false"] });
  assert.equal(r.code, 0, r.out);
  assert.equal(merges(r.calls).length, 1);
  assert.match(r.out, /back to draft/);
});

test("stops if the PR was merged or closed in the meantime", () => {
  const r = run({ merges: [[1, RACE]], views: ["MERGED false false"] });
  assert.equal(r.code, 0, r.out);
  assert.equal(merges(r.calls).length, 1);
  assert.match(r.out, /PR is MERGED now/);
});

test("a failing re-read of the PR fails the run instead of merging", () => {
  // No view stub: the stub exits 98, and bash -e stops the script.
  const r = run({ merges: [[1, RACE]] });
  assert.notEqual(r.code, 0);
  assert.equal(merges(r.calls).length, 1);
});

test("the kill switch, draft skip, label opt-out and token stay in place", () => {
  assert.match(workflow, /vars\.AUTO_MERGE == 'on'/);
  assert.match(workflow, /github\.event\.pull_request\.draft == false/);
  assert.match(workflow, /!contains\(github\.event\.pull_request\.labels\.\*\.name, 'no-auto-merge'\)/);
  assert.match(workflow, /GH_TOKEN: \$\{\{ github\.token \}\}/);
  assert.match(workflow, /contents: write\n\s+pull-requests: write/);
});
