# Editorial log

Decisions about what the library says, newest first. Each line names the entries it touched and why.
The full inventory is `library/dist/inventory.csv`, rebuilt by `node library/build.mjs`.

## 2026-11-09

- Every entry now states whether it changes code. Investigations and database prompts already had
  `mode`. The 73 others (database workflows, thinking prompts, engineering commands and design
  recipes) get a `dmode` from a fixed list, checked by `library/check.mjs`:
  Changes code, Report only, Advice, Asks before changing, Writes notes only, Depends on the task.
- Labels come from what each entry's prompt or skill tells the agent to do, not from its name:
  - Database workflows (DBR01 to DBR05) say "Stay read-only until I approve a change": Asks before changing.
  - EC04 /improve-codebase-architecture, EC06 /grill-with-docs, EC07 /research, EC10 /to-questionnaire,
    EC21 and M10 write notes, glossaries or decision records but not app code: Writes notes only.
  - Thinking prompts that only change how the agent works (M01, M05, M11) and the /engineer router
    take on whatever the task does: Depends on the task.
  - Workflows list what all of their prompts need, not just the first one's.
  - Every design recipe ends with a step that edits the page: Changes code.
- The `reviewed` column in the inventory is empty for every entry. It gets a date only when a person
  has read the entry and run it on a real project.
