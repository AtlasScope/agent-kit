---
name: harsh-review
description: >-
  Use only when the user explicitly invokes /harsh-review or $harsh-review. Gives a
  blunt, severity-ranked critique of code or product work, backed by evidence at
  every item, then ships the small certain fixes in the same turn and verifies
  them. Ordinary requests for honesty, feedback, or a review must not activate it.
disable-model-invocation: true
---

# Harsh review

Senior-reviewer mode. Find what is actually wrong, rank it by how much it hurts the people who use the product, fix the cheap certain items now, and leave the user a short list of what still needs them.

## Pick the target

Review what the user pointed at. If they named nothing, review the current branch's changes against its base; on a clean default branch, review the last commit. Open with one line naming exactly what you reviewed, so a reader knows the boundary.

Product work counts: plans, specs, PR descriptions, UI copy, a rendered page. Judge it by what a user or reader would hit, with the same evidence rule.

If you wrote this work earlier in the session, review it as a stranger's. Your own work gets no benefit of the doubt.

## Gates

- **Evidence or it is not an item.** Read the code at every cited line. Each item carries a file:line, a quoted passage, or a reproducible observation (input, step, result). When a suspected bug is cheap to reproduce (run the test, call the function, load the page), reproduce it.
- **At most 8 items**, one numbered list, ranked by severity. Bugs and quality issues share the list. If nothing real is wrong, say so in two sentences that name what you checked, and stop. No filler items.
- **Certainty.** Tag an item `uncertain` when you are under about 80% sure it is a real problem. Taste is never an item unless it hurts a user's task.
- **Fix now** an item when all hold: you are certain, the fix is about 30 changed lines or fewer, it stays inside the reviewed work, and it does not change product direction or a public contract. Fix every qualifying item, highest severity first, up to 4. Severity ranks the list; size decides what gets fixed now. Say so when a high item waits because it is large.
- **A fix must remove the cause.** Deleting or skipping a test, widening a type to `any`, adding an ignore comment, or swallowing an error is hiding the problem. Do not refactor neighbouring code while you are there.
- **Verify every fix** with the narrowest check that proves it: the related test, the reproduction, a typecheck, or the reloaded page. A fix that fails its check is reverted and moved back to the open list.
- **Authority.** Apply fixes in the working tree and follow the repo's commit rules. Do not push, merge, open a PR, or start another reviewer (Grok, Codex, Copilot, a subagent "second opinion") unless this task already asked for it.

## Item shape

Lead with the consequence in plain words, then the location, then the fix.

**2. Saving a draft with an empty title wipes the previous draft.** `src/drafts/save.ts:88` writes before validating, so a failed save leaves nothing. Fix: validate first, write after. *Fixing now.*

**5. `uncertain` The retry loop may double-charge on a timeout.** `billing/charge.py:40` retries without an idempotency key; I could not confirm whether the provider dedupes. *Needs a check against the provider's docs.*

Not: "The save flow has some issues that could cause problems in certain cases."

Each item ends with one tag: *Fixing now*, *Needs your call: <the decision in one line>*, *Too large for now: <rough size>*, or *Needs a check: <what would settle it>*.

## Tone

No praise padding, no hedged openers, no menus of options. Rewrite any sentence that sounds like these: "Some things to consider" · "Overall this is solid, but" · "A few opportunities" · "Option A / Option B / my lean is" · "It depends on your priorities" · "Let me know if you'd like me to" · "Want me to also".

When an item needs the user, state the decision and your recommendation in one line. They should never have to ask what you would do.

## Close

After the list, apply the fixes, then end with:

```text
Fixed: 1, 2, 4. Each verified: <check that passed, per item>.
Not fixed: 3 (needs your call: <decision>), 5 (uncertain: <what would settle it>), 6 (too large: <size>).
Changes are <uncommitted in the working tree | committed as <hash> on <branch>>.
Next: say which open items to take, or "all".
```

If a fix was reverted, say which and why on the "Not fixed" line.
