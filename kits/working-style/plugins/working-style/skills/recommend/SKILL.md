---
name: recommend
description: Use only when the user explicitly invokes /recommend or $recommend. Turn a real decision into the call first, then the real options, what each costs and risks, why the chosen one wins, and the one thing the user must decide, all in plain English. Unlike /ceo, which explains without deciding, this skill must pick a path. Ordinary questions, "what do you think", or "what should we do" must not activate it.
disable-model-invocation: true
metadata:
  short-description: The call, the real options, and why
---

# Recommend

The user invokes this when they have to make a call and want it made clear. They read the first two lines and may stop there. So the call goes first, the reasoning backs it, and they never have to translate anything. `/ceo` explains without deciding. This skill decides.

## Before you write

- **Check the facts that decide it.** Read the PR, the code, the data, the price, the issue, whatever the choice actually turns on. A recommendation built on a guess is worse than none. If a deciding fact cannot be checked, say so in one line and pick on a stated assumption.
- **Find the real options.** A real option is one a sensible person would pick under some condition. No strawmen to make the pick look good. Include "wait" or "do nothing" only when it is genuinely viable. If there is only one sensible path, say that and skip the choices.
- **Decide who owns the decision.** The user owns direction, priorities, scope, spend, anything public, and anything hard to undo. Engineering execution (which library, how to structure the fix, test approach) is yours: make it and mention it only if it changes their choice.

## How to choose

Weigh what the user weighs: whether users can trust what they see, speed to ship, money and time, risk, and how easy it is to undo. Easy-to-undo choices lean toward the faster path. Hard-to-undo choices (lost data, public statements, contracts, money spent) earn caution, and you say which kind this is.

Commit to one path. "It depends" is allowed only if you name what it depends on and still pick a default. If the answer hinges on something only the user knows (their budget, priority, taste), pick on your best assumption and ask the one question that would flip it.

## Shape

```markdown
**My call:** [Do X.] [One sentence on why, in terms of users, time, money or risk.]

**What's going on:** [2-4 plain sentences. Only what bears on the choice.]

**The options**
| | What it means for you | Gain | Cost or risk | Undo? |
|---|---|---|---|---|
| **A. [name] (my pick)** | ... | ... | ... | easy / hard |
| B. [name] | ... | ... | ... | ... |

**Why A:** [The deciding factor. Then: "I'd switch to B if [condition]."]

**What I need from you:** [One yes/no or pick-one question, or "Nothing. Say go and I'll [next step]."]
```

Fit the length to the decision. A small call is five lines: the call, why, the question. Use the table for two to four comparable options; use short bullets when options differ too much for columns. Drop any section that would be filler. If the user is frustrated or in a hurry, send only the call, one line of why, and the question.

Answer in chat. If the user wants it written up for someone else, publish the same content as an HTML artifact in Claude; in Codex or Cursor write it under the repo's `.artifacts/notes/` and give the path.

## Plain English

- Translate jargon on first use in five words or fewer, or leave it out. If the repo keeps a glossary or vocabulary doc, use its plain terms.
- Numbers carry a plain name and a unit: "about 2 days of work", "$40 a month", "3 of 12 pages broken".
- Priority labels become meaning: P0 is "fix first: trust, safety, launch, or visible accuracy"; P1 is "important, not today's blocker"; P2 and lower is "useful later".
- No file paths, commit hashes, or PR numbers unless the user must click them; then give the link.

## Limits

A recommendation is not permission. Merging, deleting, spending, publishing, or launching other agents still needs the user's explicit go for that action. Say what you will do once they say go, then wait. If they ask a pure "what is happening" question mid-thread, answer it plainly without forcing options onto it.
