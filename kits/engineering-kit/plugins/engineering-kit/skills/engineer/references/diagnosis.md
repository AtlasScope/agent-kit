# Diagnosis

Use this when behavior is wrong, slow or unreliable and the cause is not obvious. A small obvious bug needs a failing test and a fix. For a long hunt, the kit's `/diagnosing-bugs` gives a stricter loop.

## Explanations before fixes

Write the expected behavior and the observed one separately, with the real inputs, environment and revision. List the explanations that fit both. Pick the cheapest observation that separates them, and keep the others alive until something rules them out. A reading of the source is a hypothesis until a run shows it.

Keep track of what each statement rests on: observed, inferred from source, supported by an intervention, contradicted, or open. Say which result would change the conclusion.

## Reproduce without erasing the evidence

Preserve the failing state before touching it: the inputs, the revision, the user's uncommitted work. Some commands repair what they check, so a second run passes because the first one changed the evidence; a verifier that regenerates files in place is the common case. Run such commands in a copy.

`scripts/case.mjs` runs the same steps against a baseline and a candidate, each in its own temporary clone, and records exit codes, output, which project files changed, and which were written even with identical bytes. Reach for it when the question is what a command does to the files it touches, when a fix must keep a failure visible, or when "it passed the second time" needs explaining. Add a known-good control and a deliberately broken one when you need to know whether a check can fail at all.

When the failing input is large, shrink it while it still fails. When the failure is intermittent, find the states and transitions and look for the interleaving that produces the bad state: a duplicate delivery, out-of-order events, two writers, a retry after a partial commit, a stale read. A controllable clock or a barrier reproduces timing better than sleeps. Between a known good and a known bad revision, `git bisect` narrows the change; read the diff before calling it the cause.

## Speed

Name the slow task, its workload and the target. Measure the real path with the same build, data size and cache state before and after, and keep cold and warm runs apart. Follow the critical path through browser, server, queue and database; overlapping async work does not add up. Attribute time from traces and measurements, never from reading code alone, and fix the reason work is repeated, blocked or too large. Settle how a cache is invalidated before adding it. Never run `EXPLAIN ANALYZE` on a write against live data, add an index or create load without permission; PostgreSQL goes to `/database` when it is installed.

## The fix

A fix removes the supported cause everywhere it applies; then the original failing case passes, and so do its neighbors. One coherent change is better than several speculative patches. If the user asked for a diagnosis only, stop at the cause and propose the fix with its evidence.

## A broken branch or workflow

Stop speculative edits. Establish which worktree, branch, revision and environment are affected, and read the status, the diff and recent history. Keep the user's uncommitted work: never reset, stash, clean, force-push or delete a branch to get a clean slate. Find the last known good state and the smallest difference from it, and reproduce in a copy. For a deploy, check which code, migration and configuration reached the environment; reverting code does not revert a schema change or an email already sent. Leave any step that touches production data or credentials to the user, named plainly. Afterwards, rerun the path that failed and confirm unrelated work is intact.

Sources: Zeller, *Why Programs Fail* (2nd ed., 2009); Zeller and Hildebrandt, "Simplifying and Isolating Failure-Inducing Input" (IEEE TSE, 2002); Beyer et al., *Site Reliability Engineering*, "Monitoring Distributed Systems" (2016).
