# critique

Says what is wrong with a screen, in order of how much it matters, and which job would fix each thing.

Interactive. Changes nothing.

## Before you start

If PRODUCT.md does not say what this screen is for and you cannot tell from the screen, ask that one question and stop: "What is the one thing someone comes to this screen to do?" Every judgment below depends on the answer.

## Steps

1. **Capture it.** Screenshots at 390 and 1440 wide, in the state a real person usually sees. If the screen has an empty, loading or error state you can reach, capture those too.
2. **Use it once** as the person in PRODUCT.md would, doing the screen's one job. Note where you hesitated.
3. **Judge it against the seven questions**, in this order. Stop collecting once you have more than you will report.
4. **Rank.** Keep the three problems that most get in the way of the screen's job. A problem that blocks the job outranks any number that only look untidy.
5. **Report**, with the page described under Proof in SKILL.md: each problem marked on the screenshot it appears in.

## The seven questions

1. **Can a newcomer say what this screen is for within five seconds?** Look at it, look away, and write down what you remember. If the purpose is not among it, that is the first problem.
2. **Is there one clear place to look first?** Blur your eyes or shrink the screenshot to a thumbnail. What stands out should be the thing that matters most. Several things competing at the same weight is a hierarchy problem.
3. **Is the main action obvious and reachable?** One primary action per screen, visually distinct from the rest, and on a phone within reach of a thumb.
4. **Does it speak the user's language and tell them where they are?** Labels a user would say out loud, a visible sign of what just happened after each action, and a way back. (Nielsen's heuristics: visibility of system status, match with the real world, user control.)
5. **Is it consistent with itself and with the product?** Same thing looks the same everywhere. Check against DESIGN.md if there is one. Count the distinct text sizes, colours, corner radii and spacing values on the screen; a high count is evidence.
6. **Does it hold up outside the ideal case?** Empty, loading, error, very long text, no image. A missing state is a finding.
7. **Can everyone use it?** Text contrast of at least 4.5 to 1, or 3 to 1 for large text and for the edges of controls (WCAG 2.2, 1.4.3 and 1.4.11). Tap targets at least 24 by 24 CSS pixels (WCAG 2.2, 2.5.8), and 44 points on a phone (Apple's guidelines). A visible focus outline when moving through the page with the keyboard. Measure these; do not estimate them.

## What to report

- **A verdict in one sentence.** Honest, specific to this screen. "The page does three jobs at once, so the one that matters gets lost."
- **The three problems**, most important first. For each: what a user experiences, where it is on the screenshot, the evidence (a count, a measured ratio, the step where you hesitated), and the job that fixes it (`/keen distill`, `polish`, `harden`, `adapt`). If no Keen job fits, say what kind of work it is.
- **What is working**, two items at most, so the next change does not undo it.
- **One suggested next step**, as a line they can copy.

Do not pad the list to three. Two real problems are a better report than three with a filler. Do not score the screen out of ten.

## Report

Follow the report shape in SKILL.md. "What happened" is the verdict. "What you need to do" is to pick the next step. Under "Not checked", list every state and screen size you did not see.
