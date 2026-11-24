# critique

Says what is wrong with a screen, in order of how much it matters, and which job would fix each thing.

Report only. Changes nothing. Asks at most one question.

## Before you start

If PRODUCT.md does not say what this screen is for and you cannot tell from the screen, ask that one question and stop: "What is the one thing someone comes to this screen to do?" Every judgment below depends on the answer.

## Steps

1. **Capture it.** Screenshots at 390 and 1440 wide, in the state a real person usually sees. If the screen has an empty, loading or error state you can reach, capture those too.
2. **Use it once** as the person in PRODUCT.md would (the main one, if it names several), doing the screen's one job. Note where you hesitated.
3. **Find out why it is the way it is, before you judge anything.** This step is not optional and the screenshots do not replace it. Read, in this order:
   - PRODUCT.md and DESIGN.md, for anything said about this screen.
   - The screen's own source: the component file and its stylesheet. Read the notes written in them. People record decisions there ("phones: the message sits at the top, with the horizon below", "40px for a finger") that appear nowhere else.
   - What a control does when used, from the code, when you are not going to press it.

   Then sort every finding into one of two kinds. A **fault** is something no note explains or that contradicts the project's own notes. A **question** is something a written decision covers: report it as "your notes say X; the cost of that is Y; is that still what you want?", never as a problem. A fault gets a next step. A question may get one too, as long as the step says in plain words that it changes a choice already written down and what that choice was, so the person presses it knowing. A critique that turns up only questions says so plainly; that is a real result.

   Three cases need care:
   - **A note that only describes.** "On a phone the card shows its job and Copy" says what the code does. It is a decision only if it gives a reason, names a trade-off, or is written in PRODUCT.md or DESIGN.md. A description does not turn a fault into a question.
   - **Notes that disagree.** The note nearest the screen and most recently written is the current decision. A stale section elsewhere is itself a finding: list it under what you noticed elsewhere.
   - **A decision that gets in the way of the screen's one job.** It is still a question, and it still takes one of the three places if it earns it. Say plainly that it is deliberate and what it costs.

   List the decisions you read under Details, with where each is written, so the person can see what the critique respected.
4. **Judge it against the seven questions**, in this order. Stop collecting once you have more than you will report.
5. **Rank.** Keep the three problems that most get in the way of the screen's job. A problem that blocks the job outranks any number that only look untidy.
6. **Report**, on the worksheet described in SKILL.md, with each problem pinned on the screenshot it appears in.

## The seven questions

1. **Can a newcomer say what this screen is for within five seconds?** Look at it, look away, and write down what you remember. If the purpose is not among it, that is the first problem.
2. **Is there one clear place to look first?** Blur your eyes or shrink the screenshot to a thumbnail. What stands out should be the thing that matters most. Several things competing at the same weight is a hierarchy problem.
3. **Is the main action obvious and reachable?** One primary action per screen, visually distinct from the rest, and on a phone within reach of a thumb.
4. **Does it speak the user's language and tell them where they are?** Labels a user would say out loud, a visible sign of what just happened after each action, and a way back. (Nielsen's heuristics: visibility of system status, match with the real world, user control.)
5. **Is it consistent with itself and with the product?** Same thing looks the same everywhere. Check against DESIGN.md if there is one. Count the distinct text sizes, colours, corner radii and spacing values on the screen; a high count is evidence.
6. **Does it hold up outside the ideal case?** Empty, loading, error, very long text, no image. A missing state is a finding.
7. **Can everyone use it?** Text contrast of at least 4.5 to 1, or 3 to 1 for large text and for the edges of controls (WCAG 2.2, 1.4.3 and 1.4.11). Tap targets at least 24 by 24 CSS pixels (WCAG 2.2, 2.5.8), and 44 points on a phone (Apple's guidelines). A visible focus outline when moving through the page with the keyboard. Measure these with the script described under Measuring in SKILL.md; do not estimate them. If an audit of this screen was run in this conversation and the screen has not changed since, use its numbers.

## What to report

- **A verdict in one sentence.** Honest, specific to this screen. "The page does three jobs at once, so the one that matters gets lost."
- **The three problems**, most important first. For each: what a user experiences, where it is on the screenshot, the evidence (a count, a measured ratio, the step where you hesitated), and the job that fixes it, from the job tables in SKILL.md. If no Keen job fits, say what kind of work it is.
- **What is working**, two items at most, so the next change does not undo it.
- **Next steps**, as SKILL.md describes.

Do not pad the list to three. Two real problems are a better report than three with a filler, and a screen with one small fault gets a short report that says the screen works. Do not score the screen out of ten.

## Report

Follow the report shape in SKILL.md. "What happened" is the verdict. "What you need to do" is to pick the next step. Under "Not checked", list every state and screen size you did not see.
