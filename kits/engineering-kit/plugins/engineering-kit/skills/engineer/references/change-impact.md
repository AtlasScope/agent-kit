# Change impact

Read this before a change that crosses a boundary: a shared module, a generator and its outputs, a command that other commands run, or a rule that more than one surface implements. A local change with one caller needs none of it.

## What a change can reach

`scripts/structure.mjs <path>` (with `--symbol <name>` for one export) keeps five relationships apart, because they are different kinds of evidence:

- **import**: a module resolves to the file. Strong, and blind to framework dispatch: a Next.js page or route handler has no importers because the framework calls it. The report says when a file is such an entry point.
- **reads** and **generates**: a script reads the file by a path the program could work out, or writes it. A generated file changes through its generator; a hand edit is lost at the next build, and the generated copy usually has a check that compares it.
- **runs**: a package script, CI step, shell line or child process runs the file. Its side effects (writes, deletes, git commands, network calls) are listed with their lines, and they travel to every command that runs it.
- **mentions**: a doc, comment or literal names the path. Docs that name a file usually describe its behavior and go stale with it.
- **inferred**: another file defines the same name, or repeats a long piece of the file's text word for word. These point at a parallel implementation that imports nothing from the file.

Reach follows the first four relationships, three steps by default. Treat each reached file as something to inspect. A file with no consumers can still be called by a framework, a remote service, a scheduler or a computed path; the coverage line names what the program cannot see.

## What history adds

`scripts/history.mjs <path>...` shows how the files actually changed. Each first-parent commit is one change set, broad commits are left out and listed, and co-change is given as support against a base rate: "5 of the 8 commits that touched the target; 12 of 296 overall". For each co-changing file it says whether the current structure explains the pairing.

- Co-change with a structural link is usually expected: a generator and its output, a module and its test, two inputs of one build.
- Co-change with no structural link is the case to read. Open the shared commits and name the decision the two files both encode.
- Two files that implement one rule and rarely change together are drifting, or will.
- Small numbers are anecdotes. Two shared commits out of three is a lead to read.

Neither instrument shows cause. Both give anchors; read the code there before relying on a finding.

## Planning the change

Write down the observable behavior that must hold before and after. Check each reached consumer against it: callers that rely on a return shape, generated outputs and the check that compares them, commands whose side effects change, docs that describe the behavior. Rank what to verify by what a user would notice if it broke.

When two places implement one meaning, decide with the user whether they must agree. If they must, the durable fix is one source of truth with thin adapters, or a test that runs both on the same real inputs (`contracts.md`). If they serve different needs, write down why next to the code, so the next change keeps the difference on purpose.

## Restructuring

For a refactor or simplification, pick one real change that is painful today and follow it through the code: the places it touches and the decisions a reader must hold to make it. A better structure makes that change local. Deleting a layer, a duplicate path or a special case is often the best improvement. Keep a thin adapter that isolates a vendor, a permission boundary or a test seam, and keep similar-looking code with different meanings apart.

Keep behavior identical unless the user asked to change it: run the existing checks before and after, and run `scripts/case.mjs` with the old revision as baseline when the change touches what a command writes or prints. Prefer small reversible steps; a rewrite needs the user's agreement and a reason stronger than taste. The kit's `/improve-codebase-architecture` (a scan and an interview) and `codebase-design` (deep-module vocabulary) go further.

Sources: Parnas, "On the Criteria to Be Used in Decomposing Systems into Modules" (CACM, 1972); Zimmermann, Weißgerber, Diehl and Zeller, "Mining Version Histories to Guide Software Changes" (ICSE, 2004).
