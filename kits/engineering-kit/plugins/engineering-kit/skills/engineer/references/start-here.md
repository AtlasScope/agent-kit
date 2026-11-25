# Start here

Generated from `library/library.json` by `kits/engineering-kit/scripts/build_references.mjs`; do not edit by hand.

## Symptoms

What the user says, mapped to the investigations that usually explain it, best first.

| Symptom | Investigations |
|---|---|
| Numbers on screen don't match the source | `D01`, `D02`, `A04`, `G05` |
| A workflow got slow, or database cost jumped | `P01`, `P02`, `P03`, `P04` |
| Tests are green but production keeps breaking | `T01`, `T02`, `I02`, `S06` |
| Agents break nearby features on small edits | `A01`, `A02`, `R03`, `G01` |
| Things happen twice, or not at all | `R01`, `R05`, `D04`, `I04` |
| Merged but not live, or a deploy broke something | `I02`, `G02`, `S06`, `I05` |
| Worried about who can see or change what | `T03`, `T05`, `G03`, `S06` |
| The app hangs when an outside service is down | `G04`, `P09`, `R02`, `R06` |
| Your computer is full or browser tests are flaky | `I07`, `I01`, `T01` |
| Users get lost, or Back and shared links misbehave | `R07`, `A08`, `A01`, `T01` |
| Animations stutter, lag or all feel different | `MO02`, `MO01`, `MO04`, `MO03` |

## Skills

Every skill the router may pick, what it does, and the investigations it can run or follow up. Check it is installed before picking it.

### Engineering kit

This plugin's commands. All run only when typed.

| Command | What it does | Covers |
|---|---|---|
| `/database` | Describe a PostgreSQL problem in plain words and it picks one database prompt from this library, says why, and runs it read-only when it can reach the code and database. In Codex it's $database. |  |
| `/diagnosing-bugs` | For hard bugs and slowdowns. Builds a check that fails on the bug, shrinks it, ranks likely causes, adds logging, fixes it with a test that keeps it from coming back, then cleans up. | `P01`, `R05`, `A06`, `G06` |
| `/tdd` | Writes the tests first, one small working slice at a time. Agrees with you where the tests will hook into the code before writing any. | `R03`, `T02`, `T06` |
| `/improve-codebase-architecture` | Looks at recently busy parts of the code for modules that add little behind their interface, writes a before/after HTML report to the temp folder, then interviews you about one. | `A01`, `A03`, `A05` |
| `/grill-me` | Asks rounds of numbered questions, each with a suggested answer, until every open question in a plan is settled. For product direction, not routine fixes. | `A01` |
| `/grill-with-docs` | The same interview, but it writes terms into GLOSSARY.md and records each settled decision as an ADR (a short decision record). | `A02`, `D05` |
| `/research` | A background agent answers a question from original sources and saves a Markdown note with citations in the repo. |  |
| `/retro` | Reviews a session and suggests changes to the agent's setup: how it finds its way around, its checks, its instruction files and what its tools cost. | `G01` |
| `/wizard` | Writes a bash script that walks you through the steps only you can do, like dashboards, secrets and switchovers. |  |
| `/to-questionnaire` | Turns a decision you can't make alone into a questionnaire for the person who can. |  |
| `/wait-what` | Asks the agent to explain its last message again in plain words. |  |

### Trail of Bits

Security plugins from trailofbits/skills, installed one at a time (see the README). Some run multi-agent workflows, which cost more than a single pass.

| Command | What it does | Covers |
|---|---|---|
| `/insecure-defaults:audit` | Finds unsafe defaults: fallback secrets, default passwords, switches that let everything through when they fail, weak encryption, loose access rules and debug details leaking out. | `T05`, `S06`, `R02` |
| `/supply-chain-risk-auditor` | Checks your direct dependencies and the ones in the lockfile for security warnings, abandoned projects and risky publishers. | `T04`, `I06` |
| `/agentic-actions-auditor` | Checks GitHub Actions that run Claude, Codex or Gemini for exposed tokens and prompt injection (hidden instructions in issues and PRs that the AI might follow). | `T04` |
| `/differential-review:diff-review` | Security review of a set of code changes, using git history and counting how many callers each change could affect. | `T03`, `G02` |
| `/sharp-edges` | Finds APIs that are easy to misuse and configuration options that are dangerous. | `T05` |
| `/variant-analysis` | After one bug is found, hunts for the other places with the same root cause. |  |
| `/property-based-testing` | Writes and reviews property tests (tests that throw many generated inputs at a rule) with fast-check or Hypothesis. | `R03`, `R04`, `T02` |
| `/dimensional-analysis` | Finds bugs from mixed-up units and decimal scaling by labeling each value with its unit. | `G05`, `D02` |
| `/spec-to-code-compliance` | Checks code against the document that specifies it, one requirement at a time. | `D01`, `D02`, `A02` |
| `/audit-context-building` | Reads code one function at a time and records what each one assumes, before any bug hunt starts. | `T03`, `A04`, `A07` |
| `/goal-prompt` | Drafts /goal commands with a checkable finish line and limits on when to stop. |  |

### Experience architecture

The experience-architecture plugin in AtlasScope/agent-kit (separate install, see its README): how an app's pages, navigation, URLs and state serve its users. Diagnose and Rethink can start on their own when the topic comes up; all three are read-only until the owner picks a change.

| Command | What it does | Covers |
|---|---|---|
| `/experience-architecture:diagnose` | Start here for any complaint about navigation, the Back button, filters, shared links or too many pages. Finds the causes, says whether the page structure is the problem, and checks its own file references before reporting. | `A08`, `R07`, `A01` |
| `/experience-architecture:rethink` | For questions like whether a page should exist, where a feature belongs, or whether to add a tab. Gives a recommendation, and for a real structural problem two or three options with a clickable prototype and a move-over plan that keeps old links working. | `A08`, `A05` |
| `/experience-architecture:verify` | Proves behaviour in a browser and saves the user journeys as a repeat check that ends PASS, FAIL or EXPLORATORY. Typed values and secrets stay out of the logs. | `R07`, `T01`, `G06` |
| `/experience-architecture:walkthrough` | Uses the running app the way a newcomer would, then says what the product is for, what to keep and the most valuable change to make. Changes no code. |  |

### Built in

Claude Code commands and the ci-optimizer plugin.

| Command | What it does | Covers |
|---|---|---|
| `/ceo` | Explains the status of the work, a system or a problem in plain English for someone who doesn't read code. Explains without deciding. |  |
| `/code-review` | Checks a set of changes or a PR for bugs, at an effort level you pick. Run it at high or above before marking a PR ready. | `D06` |
| `/security-review` | Security review of the not-yet-merged changes on the current branch. | `T03`, `G03` |
| `/simplify` | Looks over changed code for things to reuse or simplify, and makes the fixes. | `A03` |
| `/ci-optimizer:ci-check` | Checks CI workflow files (the automatic build and test runs) for speed, cost and safety problems. | `I03`, `T04` |
| `/ci-optimizer:ci-timings` | Finds the slowest jobs and steps, and flaky tests (ones that pass and fail at random), from recent CI runs. | `I03` |

## Thinking prompts

Short prompts that change how an agent works on any task. Paste as written.

### M01 Deeper, not bigger

Use it before you hand an agent a task you only half know how to describe.

```text
Give me the thorough, senior-level version of this task without expanding its scope. Look at what I'm trying to accomplish and identify what an experienced practitioner would check, question, or verify that I overlooked. Inspect the original code and data instead of relying on summaries. Name the specific checks or evidence that will prove the result is right, then refine the task plan accordingly. Keep the objective and scope tight, and skip extra process that adds complexity without improving the result.
```

### M02 Prove it wrong

Use it when an agent's plan sounds right and you can't see why it might be wrong.

```text
Before we proceed, try to prove the proposed plan wrong. List the key assumptions it relies on, search the code, data, logs, and documentation for evidence against each one, and run the fastest check or test that could break it. Report which assumptions held, which failed, and which you could not check. If any failed, explain what changes and propose the smallest adjustment. Recommend going ahead only if nothing you found contradicts the plan.
```

### M03 Root cause first

Use it the second time the same kind of bug shows up.

```text
Do not patch the visible symptom yet. Reproduce the problem first, then trace backward through code and data until you can explain in one or two plain sentences why it happens, citing the exact files, lines, or records involved. Search the codebase for every other place that shares the same cause. Report the cause, the proof, and every affected location. Then propose one fix that removes the underlying cause everywhere it applies, plus a check that fails if it returns. Wait for my yes before editing.
```

### M04 Simpler first

Use it when the proposed fix adds a new setting, table or service.

```text
Before adding any new code, layer, setting, table, or dependency, look for something you can remove instead. Check whether deleting a redundant wrapper, special case, duplicate path, or unused rule solves the problem or makes it simpler. Only if removal cannot solve it, propose the smallest addition that works and justify each new piece. Judge options by how little there will be to understand and maintain next month, avoiding unnecessary moving parts.
```

### M05 Let the expert decide

Use it when an agent keeps asking you technical questions you can't judge.

```text
Make the technical decisions yourself the way a senior engineer on this project would: follow the repository's existing patterns first, then established standards and official documentation, and inspect the codebase when unsure instead of asking me. Bring me only choices about product behavior, user impact, ongoing cost, or risks I must accept — each with your recommendation and how hard it is to change later. At the end, list the technical choices you made in one line each so I have a record.
```

### M06 Check it independently

Use it before you accept 'tests pass' as proof that something works.

```text
Prove this works without relying only on the code or unit tests you just wrote. Pick an independent check that will actually fail if the fix is broken: walk through the running app like a real user, call the real endpoint, inspect the real stored data, compare against an outside source, or write a check from the original requirement without reading your implementation. Run that check, show the actual output, and state plainly what it still does not cover.
```

### M07 Spec without the interview

The default way to start a real task. The opposite of /grill-me.

```text
Turn my request into a short working specification: desired outcome, what is in scope, what is explicitly out of scope, observable acceptance criteria, and where to stop. Resolve technical questions yourself by reading the repository and primary documentation. Ask me only about product behavior, permissions, or tradeoffs you cannot decide from the codebase. Show me the short spec first and wait for my yes before editing files unless I already told you to proceed immediately.
```

### M08 Reproduce, measure, prove

Use it in the second session, after a read-only investigation found a real problem.

```text
Before editing anything to fix this bug or slowdown, create a reproducible failing case or a measured baseline. Trace the root cause, apply the narrowest fix that removes it, rerun an independent check, and report the exact before-and-after evidence. If you cannot reproduce or measure the problem, stop and tell me what evidence is missing instead of claiming it is fixed.
```

### M09 Compare three options

Use it for decisions that will be expensive to undo.

```text
Do not implement the first workable idea you think of. Lay out three meaningfully different ways to solve this: (1) the smallest conservative patch to the existing code, (2) the cleanest long-term design, and (3) a subtractive option that removes an existing layer, constraint, or special case. For each option, compare what else it could break, how easy it is to test, and how it fails. Recommend one in plain English and wait for my decision before editing anything.
```

### M10 Handoff note before you stop

Use it before the agent compacts (shrinks its memory of the chat) or a long session ends.

```text
Write a compact, self-contained technical handoff so a fresh agent session can resume this work cold. Include only: (1) verified facts and current system state, (2) approaches already tried and why they were ruled out, (3) exact files modified and any uncommitted changes in flight, and (4) the single next verifiable step. Record ground truth from the repository and commands run, skipping conversational recap.
```

### M11 Thorough and bold

Add it to any prompt when you want depth and a firm recommendation, with the checking shown.

```text
Go past the first answer. For each claim you make, check the original evidence (the code, the data or the docs) and say which claims you verified and which you assumed. Then give one clear recommendation, the strongest argument against it, and the result that would change your mind.
```

### M12 Deepen modules, simplify interfaces

Use it as a cleanup pass on each pull request, or on a schedule for overdue maintenance. It pushes the agent to merge duplicated code, put core logic in one place and cut lines. Shared by Chris (@_khrus) on X on 7 Nov 2026; the idea is John Ousterhout's, from A Philosophy of Software Design, and Matt Pocock pointed him to it. /improve-codebase-architecture is the longer version: a scan, a report and an interview.

```text
Run a cleanup pass on the code touched by this branch or recent change. Look for logic duplicated in multiple places, functions whose callers need to know internal details, and thin pass-through wrappers that add indirection without value. Merge duplicates, put the core logic behind one clear entry point, and keep each interface simpler than the work inside it. Keep external behavior identical: run the existing tests before and after, and skip anything you cannot verify is safe. Summarize what you merged, moved, or deleted in plain English first, with file paths underneath.
```

### X17 Mark your guesses

Use it when you can't tell whether an agent actually looked or only sounds sure, especially before acting on what it says.

```text
Separate what you verified from what you assumed. In your answer, tag every factual claim as Checked (you ran it, read the file, or measured it — state how), Inferred (it follows from something you checked — state what), or Guessed (unverified). Before replying, verify any Guessed claim that your recommendation depends on. List any remaining guesses clearly along with what would change if they turned out wrong. Never state a guess in the same confident tone as a checked fact.
```

### AD03 Stop and untangle

The agent has spent several turns patching a bug, each fix broke something else, and you have lost track of what changed.

```text
Stop editing files. Step back and untangle where we are right now. Check git status and git diff against the last known working commit, then tell me in plain English: (1) what the original goal was, (2) every fix we already tried and what happened, (3) which uncommitted changes are half-finished patches that should be reverted, and (4) the single cleanest path forward from a clean base. Wait for my approval before reverting or editing anything.
```

### X18 Plan the failure

Use it before a change that would be painful to undo: a migration, a payment change, a launch or a large rewrite.

```text
Before you start, imagine this change is already shipped and has gone badly wrong. List up to five of the likeliest causes specific to this project, such as a false assumption, an untested edge case, a nearby feature broken by the edit, an unexpected bill, or a user doing something unintended. Stop as soon as the real risks run out instead of padding the list. For each risk, state how we would spot it early and what your plan does to prevent it. Show me that plan before changing files. When the work finishes, report which risks you eliminated and which remain possible.
```

### X19 Teach me what you just did

Use it on any change you'll have to live with, especially when you don't read the code yourself.

```text
When you finish, explain what you changed so I could describe it to someone else and spot trouble later. Assume I understand the product and do not read code. In under 250 words of plain English, cover: what the problem was, what you changed and why you picked this over the main alternative, what a user will notice, what could still go wrong and how I would spot it, and one concrete thing I can open, click, or check myself to confirm it works. End with two short questions to verify I understood the parts that matter most.
```

### X20 Who notices this change

Use it before renaming, moving or removing anything people or other systems rely on: a page, a field, a price, an email or an API.

```text
Before making this change, list everyone and everything that will feel its impact beyond the files you edit: users on each plan, people mid-task during deploy, saved links and bookmarks, links inside emails already sent, search engines, analytics and reports, external apps or scripts calling this, cached responses, older client or app versions still running, in-flight background jobs, and admins or support. For each item that applies to this project, explain what they will experience and whether it needs a redirect, a migration, a notice, or temporary backwards compatibility. Show me the list before editing anything, include the agreed code transitions when you build the change, and separate what you handled from what needs manual action from me.
```

### AD01 Stay inside the lines

Past changes touched files you didn't expect, or you are editing a delicate area right before shipping.

```text
Stay strictly inside the task I asked for. Do not refactor neighbouring code, rename unrelated variables, reformat untouched files, delete comments, or upgrade dependencies unless the task cannot work without it. If you spot a separate bug or cleanup opportunity while working, leave it untouched and list it at the end under "Spotted outside scope" with the file and line so I can decide whether to do it next. Before finishing, check the diff and revert any accidental edit outside scope.
```

### AD02 Show the plan and wait

You want to approve the approach before the agent touches code, especially on a big or unfamiliar change.

```text
Do not edit any files yet. Inspect the codebase and tell me your plan in plain English for someone who knows the product and does not read code. Cover what will change for a user, which areas of the product are touched, any tradeoffs or product choices I need to make, and what could break. Keep it under 200 words, end with any questions that need my call, and wait for my yes before making edits.
```

## Wrapping an investigation prompt

An investigation prompt is sent as: the prompt, one mode line, the separate-database line when the investigation is marked `iso`, an optional scope line, then the footer.

Modes:

- `read` (Read-only): Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.
- `repro` (Reproducer only): You may add a failing test or a small reproduction script for the highest-risk finding. Do not change application code, data or configuration.
- `change` (Propose a fix): After reporting, propose the smallest fix for the top confirmed finding as a diff for my review. Do not apply it to production, run migrations, or delete anything.

Separate database (`iso`): Anything that changes state, such as a rebuild, replay or migration test, runs only on a separate database with safe test data, never on production.

Scopes:

- `repo` (Whole repo): no line added.
- `branch` (This branch): Limit this to files changed on the current branch (git diff main...HEAD) and their direct callers.
- `slice` (One slice first): Start with one high-traffic route, module or entity. Report on that slice, then stop before scanning the rest.

Footer:

```text
End with a table I can paste into my playbook, one row per finding:
| ID | Project | Verdict (Clean / Suspect / Confirmed) | Evidence | False-positive notes |
```

## When to run what

| When | Look at | Keep it lean |
|---|---|---|
| After a big feature or change | Check the whole path people use through what changed, what it touches, and that nothing old broke. | Stick to what changed. A small change doesn't need a check of everything. |
| Weekly, if something changed | Recent changes that show signs of slowing down, failing at random, or deploy or accuracy trouble. | Skip it when nothing important was merged and nothing looks different. |
| Monthly | Problems you already know about: tests that fail at random, risky packages, wasted check time, work done over and over. | Start with the known problem areas. Don't rerun checks on things that haven't changed. |
| Quarterly | Whether the overall design still fits, how much growth it can take, who owns what, and old shortcuts that now cost you. | Only when the system or the evidence has changed. |
| After something breaks | The real cause, a test that shows the problem, and a fix for the shared cause. | Stop once it can't happen again. Don't set up anything permanent by default. |
