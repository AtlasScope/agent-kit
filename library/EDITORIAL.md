# Editorial log

Decisions about what the library says, newest first. Each line names the entries it touched and why.
The full inventory is `library/dist/inventory.csv`, rebuilt by `node library/build.mjs`.

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
