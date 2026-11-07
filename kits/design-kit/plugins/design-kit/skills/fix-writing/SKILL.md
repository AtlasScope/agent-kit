---
name: fix-writing
description: One command for text the user dislikes. Works out what kind of text it is, reads the project's voice and vocabulary, applies the right rules from Humanizer, Sepia, Stop Slop or Impeccable clarify, and scores it with slop-guard before and after. Use when the user says /fix-writing, or asks to fix, clean up or de-AI a section of text without naming a specific tool.
---

# Fix writing

The user hands over text (pasted, or a file with an optional line range such as `README.md:12-40`) and wants it fixed. Pick the tools for them.

## 1. Read the project's voice

When they exist, read `PRODUCT.md`, `DESIGN.md`, `CLAUDE.md`/`AGENTS.md` and Vale's accepted vocabulary (`.vale.ini` → `StylesPath`, then `config/vocabularies/*/accept.txt`). Keep product names and accepted terms exactly as written, and match the tone those files describe.

## 2. Score before

Run `sg -s` on the text (stdin for pasted text, the file otherwise; for a line range, pipe just those lines). Keep the number.

## 3. Classify and pick the rules

| What it is | Use |
|---|---|
| Words inside an interface: labels, buttons, errors, empty states | `/impeccable clarify` rules |
| A format with known conventions: release notes, PR or issue reply, code-review comment, postmortem, ticket, technical article, fiction | Sepia (`sepia:sepia-refactor` for small fixes, `sepia:sepia-recreate` when the shape is wrong) |
| A draft with facts, numbers or real caveats: README, docs, PR description, email | Humanizer (keeps meaning and caveats) |
| Short persuasive or personal copy with no caveats to protect: posts, landing copy, bios | Stop Slop |

If two fit, prefer the one that protects facts. Never let a rule strip a correct caveat or change what the text claims.

## 4. Rewrite

Apply the chosen skill's rules. With a file, edit it in place and touch only the given range. With pasted text, return the rewrite.

## 5. Score after and report

Run `sg -s` again. Reply with:
- what kind of text it was treated as and which rules were used
- the score before and after
- the rewrite (or a note that the file was edited)

If the score did not rise, run `sg -v` on the result and fix what it flags once more.

## Out of scope

A whole docs folder at once. Run Vale (`/vale:triage`) or `sg --counts` first to find the worst files, then fix those one at a time.
