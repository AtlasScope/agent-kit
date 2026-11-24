# Editorial log

Decisions about what the library says, newest first. Each line names the entries it touched and why.
The full inventory is `library/dist/inventory.csv`, rebuilt by `node library/build.mjs`.

## 2026-11-24 (Prompts, Skills and Recipes, and an outside rewrite)

- The page opens on three kinds: Prompts (in 15 categories), Skills (Agent Kit's own, by plugin) and
  Recipes (in three groups). `v3` in `library.json` holds the categories, the "Use it when" lines,
  the skill groups and the recipes; `check.mjs` checks every reference in it.
- 20 new entries (X01 to X20): sixteen investigations the library did not cover (promises the product
  makes, first support tickets, abuse by ordinary users, the money path, unit cost, vendor risk, dated
  failures, outage alarms, defaults nobody chose, personal data, licences, single-owner knowledge,
  repeated agent mistakes, a first bad day and others) and four ways of working.
- A different model reviewed the page and rewrote its text. Its wording replaced the descriptions and
  most copied prompts; a script kept every investigation's read-only rule, evidence, stop condition and
  plain-English report. It also proposed eleven prompts (AD01 to AD11: a plan gate, a scope fence, a
  pre-merge walkthrough, an unfinished-work check, sign-in, emails, public links, backups and others)
  and two recipes. All new entries score 1 for evidence: none has been run on a real project.
- Hidden behind what replaces them (`notShown`): seven Postgres prompts that repeated general ones,
  T01 and T02 (merged into T06), four speed prompts merged into P01, P02 and P07, M11 (into X17),
  MO01 (into /motion setup), D05 (into R03) and two machine-housekeeping prompts (I01, I07). Their data
  stays for the routers and the site. The Postgres workflows and the motion-system recipe became page
  recipes with numbered steps.
- Recipes that use commands or several big investigations now run one step per message, each with its
  own Copy. Copy used to paste commands inside one prose block and dropped each investigation's stop
  rule and "Watch out" line. "A bug you can't explain", "It got slow" and "Before you ship a change"
  had steps that contradicted each other; they no longer do.
- Search and the problem shortcuts no longer offer borrowed skills or the older recipes; Enter opens
  the best match instead of copying it.
- The new investigations and the thinking prompts that only had `line` now also carry `why`, and the
  new investigations a `scope` and `tools`, so the /engineer and /database references no longer print
  "undefined".
- G02 now asks for a migration replay on a separate copy, so it is marked `iso`. The /engineer and
  /database references that ship these prompts changed, so engineering-kit is 1.7.0.

## 2026-11-23 (areas, Keen and a complete Copy)

- The page is organised the way the kit is: a front door ("What's wrong?", 13 plain problems, three
  things to try each) and ten areas that match the kit's commands. `areas` and `front` in
  `library.json` hold the structure; `check.mjs` checks every reference and that no entry sits in two
  areas.
- Keen's 21 jobs are on the page, read at build time from Keen's own SKILL.md and job files, so the
  page and Keen's menu cannot disagree. Each one can also be copied as full instructions for an agent
  without Agent Kit.
- Commands written by other people that Agent Kit has a job for, and the recipes built from them,
  moved to an Other tools page. `closest` names the Agent Kit job that does the same work for each.
  Borrowed engineering, security and writing tools stay in their areas until their replacements exist.
- Copy now hands over everything: for an investigation or database prompt, the prompt plus what it may
  change, what to bring back, when to stop, and a report that starts in plain English. Before, the
  copied text of all 56 investigations left these out although every card said "Changes nothing".
- Removed: the Which one? page, stars and recent copies, and the prompt builder. Their data stays in
  `library.json` for the site and the routers.
- "Tried on a real project" marks an entry only where a run is recorded: `tried` in `library.json`
  (Keen critique and audit, run on three screens of the Agent Kit website) or a private `runs` list.
- Thinking prompts M02 to M06 and M12 were rewritten to ask for evidence and a concrete result
  (M12 was five words). The /engineer reference that ships them changed, so engineering-kit is 1.6.2.
- Plain one-line descriptions (`line`) for the database prompts and workflows, the thinking prompts and
  seven engineering commands whose descriptions leaned on jargon. The routers still read `why`.
- UI029 and UI031 are the same commands as EC31 and EC32, so the page shows them once (`notShown`).

## 2026-11-21 (palette builder)

- One design command, UI108 `/palette-builder`, written here. The color skills advise and write exact
  values; none lets a person compare whole palettes on their own screens and choose. It is the first
  pick for that one new situation only, and `/oklch-skill` keeps scales, dark mode and contrast.
- Audit score: 1 for evidence, because it is new and only tested on our own codebase and a fixture app.

## 2026-11-10 (motion)

- Six investigation prompts for motion, MO01 to MO06, in a new "Motion" group: values nobody chose, frame
  cost, reduced motion, interruption, motion with no job, and state changes with no feedback. They follow
  the same shape as the other investigations (what it finds, evidence, when to skip, what agents get
  wrong) and need nothing installed. A new symptom, "Animations stutter, lag or all feel different",
  points at four of them.
- Six design commands, UI100 to UI105, for `/motion` and its modes, from the new motion-kit plugin, and
  one recipe, RC23 "A motion system for the whole app".
- `/motion` is listed as the alternative, never the first pick, in the situations where a borrowed
  motion skill already was the pick (check existing motion, find where motion would help, animation
  stutters). Two situations had no pick before and get one: deciding how a product moves
  (`/motion setup`) and planning an entrance before coding it (`/motion storyboard`). The first picks
  change only after a recorded run shows `/motion` doing the job at least as well.
- Audit scores: the MO prompts get 14/14 on reading. The `/motion` commands get 1 for unique, because
  borrowed skills cover parts of the same job, and 1 for compat, because the skill has been run on
  Chromium only and not yet end to end in Codex or Cursor.
- The design catalog can now show "Asks before changing" as "edits after a yes"; `/motion setup` is the
  first design command with that mode.

## 2026-11-10 (router references)

- The /design router's `catalog.md`, `recipes.md` and `situations.md` now come from `library/library.json`
  through `kits/design-kit/scripts/build_references.mjs`, and `check.mjs` fails when they drift. The old
  `build_references.cjs` had the same field-guide problem as the engineering one. The command set is
  unchanged; descriptions now match the library's current wording. The Impeccable helper agents have no
  library entries, so their rows sit in `kits/design-kit/scripts/impeccable-helpers.json`.
- The /engineer router's `start-here.md` and `investigations.md` now come from `library/library.json`
  through `kits/engineering-kit/scripts/build_references.mjs`, and `check.mjs` fails when they drift.
  The old `build_references.cjs` read an older field-guide format and had stopped running, so the
  router had been reading stale text: older titles for the thinking prompts, no M11 or M12, and M02
  "Falsification" showing M10's handoff prompt instead of its own.
- Symptom rows list only investigation IDs, since database prompts live in the /database reference.
- /harsh-review, /viewport-proof and /recommend stay out of the router's skill list. They ship in
  working-style, which has no dependency from engineering-kit.

## 2026-11-10 (rewrites)

- M11 "Thorough and bold" was one line ("Be thorough in your analysis and bold in your
  recommendations"). It now asks the agent to check original evidence for each claim, say what it
  verified and what it assumed, and end with one recommendation, the strongest argument against it,
  and what would change its mind. Score 9 to 13; `rewrite` flag removed.
- R04's evidence line asked for a test "at midnight in Memphis". It now says the users' main time
  zone. `personal` flag removed.
- D02 needed "the source filings", which only fits financial data. It now says the source documents
  the numbers come from. PG01's search tags lost "doesn't match the filings" for the same reason.
- G04's summary named Google and the AI Gateway; it now names the kinds of service instead.
- I07's summary called it "the safe version of the viral prompt". It now says what it finds.
- The /engineer router's `references/investigations.md` carries the same text and got the same four
  edits by hand. Its generator (`kits/engineering-kit/scripts/build_references.cjs`) expects an older
  field-guide format and no longer runs against `library/dist/prompt-library.html`; fixing that is
  roadmap task 13 (one source of truth).

## 2026-11-10

- Every entry now has an editorial score in `library/audit.json`, checked by `library/check.mjs` and
  copied into the inventory. Seven criteria, each 0 (weak), 1 (fair) or 2 (strong), in this order:
  1. use: someone building or fixing an app would reach for it.
  2. clarity: the copy text says what to do without guessing, and nothing in it is one person's setup.
  3. unique: no other entry does the same job better.
  4. evidence: it asks for proof (file and line, a trace, a measurement, a failing check) or says what comes back.
  5. safety: what it may change is stated and bounded.
  6. source: where it comes from and its license are recorded.
  7. compat: it works on the agents Agent Kit supports, with no unstated platform or service.
- What the scores mean, and don't:
  - They come from reading each entry, not from running it.
  - Third-party commands get 1 for evidence and compat by default, because their output and current
    install were not re-tested in this pass. That is a flag to confirm, not a judgment of the skill.
  - Built-in Claude Code commands (/code-review, /security-review, /simplify) get 1 for compat
    because they don't exist in other agents.
- Result: 82 entries score 14/14, 32 score 13, 106 score 12 (mostly the third-party default),
  8 score 11, 10 score 10 and one scores 9. The lowest:
  - M11 "Thorough and bold" (9): one vague line, the kind of prompt the roadmap asks us to replace. Flagged `rewrite`.
  - Six entries flagged `hide` from default browsing, kept with their IDs: UI058 (an option of
    /hallmark, not a command), UI077 canvas posters, UI078 Anthropic's own brand, UI079 generative
    art, UI080 Slack GIFs, UI097 Hemingway fiction. None helps build or fix an app.
  - UI019 /impeccable overdrive, UI036 /top-design, RC04 and RC16 score 10 because they easily
    overshoot a product UI. They stay, for when someone asks for that on purpose.
  - UI090 and UI099 are the raw Vale and slop-guard CLIs; the slash commands cover them.
- Two skills were listed twice under different sections: /harsh-review (EC31 and UI029) and
  /viewport-proof (EC32 and UI031). Both rows stay so links keep working; `dupOf` marks the copy.
- R04 named one city ("midnight in Memphis") in its evidence line. Flagged `personal`; the rewrite
  pass replaces it with the user's own time zone.
- 22 overlap clusters in `audit.json` group 70 entries by the job people come for. Each names one
  primary and, for every alternative, when to choose it instead. The design-command overlaps that
  already lived in `library.json` (`overlaps`) stay there; check.mjs now confirms each command they
  name is a real entry.
- Clusters follow the starting points on the site where both exist (bug fixing: EC02; hard-to-change
  code: EC04; data accuracy: DBR01; planning: M07; review before merge: EC26).

## 2026-11-09

- Every entry now states whether it changes code. Investigations and database prompts already had
  `mode`. The 73 others (database workflows, thinking prompts, engineering commands and design
  recipes) get a `dmode` from a fixed list, checked by `library/check.mjs`:
  Changes code, Report only, Advice, Asks before changing, Writes notes only, Depends on the task.
- Labels come from what each entry's prompt or skill tells the agent to do, not from its name:
  - Database workflows (DBR01 to DBR05) say "Stay read-only until I approve a change": Asks before changing.
  - EC04 /improve-codebase-architecture, EC06 /grill-with-docs, EC07 /research, EC10 /to-questionnaire,
    EC21 and M10 write notes, glossaries or decision records but not app code: Writes notes only.
  - EC24 /experience-architecture:rethink writes proposal files and a prototype, and changes the app
    only after the owner picks an option: Asks before changing.
  - Thinking prompts that only change how the agent works (M01, M05, M11) and the /engineer router
    take on whatever the task does: Depends on the task.
  - Workflows list what all of their prompts need, not just the first one's.
  - Every design recipe ends with a step that edits the page: Changes code.
- The `reviewed` column in the inventory is empty for every entry. It gets a date only when a person
  has read the entry and run it on a real project.
