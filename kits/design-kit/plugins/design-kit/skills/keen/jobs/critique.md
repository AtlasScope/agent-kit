# critique

Says what is wrong with a screen, in order of how much it matters, and which job would fix each thing.

Report only. Changes nothing. Asks at most one question.

## Before you start

If PRODUCT.md does not say what this screen is for and you cannot tell from the screen, ask that one question and stop: "What is the one thing someone comes to this screen to do?" Every judgment below depends on the answer.

## Steps

1. **Capture it.** Screenshots at 390 and 1440 wide, in the state a real person usually sees. If the screen has an empty, loading or error state you can reach, capture those too.
2. **Say what kind of screen it is.** One line, because it decides which questions below weigh most.
   - **It asks for something**: an install, a sign-up, a payment, a contact. Trust and the main action matter most.
   - **It is for doing a task**: a form, an editor, a settings page, a dashboard. Status, mistakes and the way back matter most.
   - **It is for finding something**: a list, a library, search results. Whether the thing can be found matters most.

   A screen can be two of these, such as a list that leads to an install. Name the one the person arrives for first.
3. **Use it, do not only look at it.** Most of what a critique misses is invisible in a screenshot.
   - **Do the screen's one job from start to finish**, as the person in PRODUCT.md would (the main one, if it names several). Do not stop at the press. Follow it to where the person ends up, and capture each step. If the action sends, buys, deletes or publishes, stop before that point and read what it does in the code. When the job continues on another screen, follow it there: how well this screen hands over is part of this critique. Report what you find at the far end as where the action leads, and leave a full critique of that screen for its own run.
   - **Compare what you were told with what you got.** What did the label promise, and what happened? If something was copied, saved, sent or filled in for you, is it what was shown on screen, word for word? Read the clipboard or the field; do not assume. If the tool will not let you read the clipboard, read what the code copies, and list the copy itself under "Not checked".
   - **Try to make every message untrue.** For each message the screen shows ("Copied", "Saved", "3 results", "Up to date"), do the thing twice, do the other option, wait a minute, go back. A message that can be wrong is a fault however small it looks.
   - **Then do it as a second person**: someone on a phone if you began on a computer, and someone who uses this every day if you began as a newcomer. Note where each of you hesitated or ended up somewhere useless.
   - **Press everything that looks pressable**, and note anything that looks pressable and is not, or is pressable and does not look it.
4. **Find out why it is the way it is, before you judge anything.** This step is not optional and the screenshots do not replace it. Read, in this order:
   - PRODUCT.md and DESIGN.md, for anything said about this screen. Write down every rule in them that applies here, including the things they forbid. You will check the screen against each one in question 6.
   - The screen's own source: the component file and its stylesheet. Read the notes written in them. People record decisions there ("phones: the message sits at the top, with the horizon below", "40px for a finger") that appear nowhere else.
   - What a control does when used, from the code, when you are not going to press it.

   Then sort every finding into one of two kinds. A **fault** is something no note explains or that contradicts the project's own notes. A **question** is something a written decision covers: report it as "your notes say X; the cost of that is Y; is that still what you want?", never as a problem. A fault gets a next step. A question may get one too, as long as the step says in plain words that it changes a choice already written down and what that choice was, so the person presses it knowing. A critique that turns up only questions says so plainly; that is a real result.

   Three cases need care:
   - **A note that only describes.** "On a phone the card shows its job and Copy" says what the code does. It is a decision only if it gives a reason, names a trade-off, or is written in PRODUCT.md or DESIGN.md. A description does not turn a fault into a question.
   - **Notes that disagree.** The note nearest the screen and most recently written is the current decision. A stale section elsewhere is itself a finding: list it under what you noticed elsewhere.
   - **A decision that gets in the way of the screen's one job.** It is still a question, and it still takes one of the three places if it earns it. Say plainly that it is deliberate and what it costs.

   List the decisions you read under Details, with where each is written, so the person can see what the critique respected.
5. **Judge it against the ten questions**, in this order. Answer every one, even when the answer is "yes, fine": a question skipped is how a real problem gets missed.
6. **Rank.** Keep the three problems that most get in the way of the screen's job. A problem that blocks the job, or leaves the person with something other than what they were told, outranks any number that only look untidy. Keep up to five more as one line each.
7. **Report**, on the worksheet described in SKILL.md, with each problem pinned on the screenshot it appears in.

## The ten questions

1. **Can a newcomer say what this screen is for within five seconds?** Look at it, look away, and write down what you remember. If the purpose is not among it, that is the first problem.
2. **Is there one clear place to look first?** Blur your eyes or shrink the screenshot to a thumbnail. What stands out should be the thing that matters most. Several things competing at the same weight is a hierarchy problem. Two controls styled as the main action is the commonest form of it.
3. **Does the main action do what its label says, and is it obvious and reachable?** One primary action, visually distinct, within reach of a thumb on a phone. Its label names what will happen. From step 3: what happened is what the label said, and what the person was handed is what the screen showed them.
4. **Does the person know what happens next?** Before they act: what it will do, what it costs, what it touches, and how to undo it. After: where they are, what just happened, and what to do now. A screen that hands the person to another tool, another device or a later step says what that step will look like.
5. **Is there a reason to believe it?** For a screen that asks for something, the reasons sit near the ask: who made it, what it costs, how many use it, what it will do to their computer or their data, how to back out. Only real ones count. For any screen: is every message true every time, from step 3?
6. **Does it keep the product's own rules?** Go down the list of rules you wrote from PRODUCT.md and DESIGN.md and check each one against the screen, including what they forbid. A screen breaking its own written rule is a fault with the rule as its evidence. Then the unwritten kind: the same thing looks and is named the same everywhere on the screen. Count the distinct text sizes, colours, corner shapes and spacing values; a count the notes do not explain is evidence.
7. **Does it speak the user's language?** Labels a user would say out loud. No name the team invented left unexplained where a newcomer meets it first. (Nielsen's heuristics: match with the real world.)
8. **Can the person find the thing they came for?** If the screen holds more than a screenful of items: is there a way to search or narrow them on the screen itself, does a search show everything it found or say how many it left out, can two items be told apart by their names, and is anything reachable only by already knowing what it is called?
9. **Does it hold up outside the ideal case?** Empty, loading, error, very long text, no image, a refused permission. A missing state is a finding. On a phone: is anything the person needs before acting folded away while the action stays visible?
10. **Can everyone use it?** Text contrast of at least 4.5 to 1, or 3 to 1 for large text and for the edges of controls (WCAG 2.2, 1.4.3 and 1.4.11). Tap targets at least 24 by 24 CSS pixels (WCAG 2.2, 2.5.8), and 44 points on a phone (Apple's guidelines). A visible focus outline when moving through the page with the keyboard. Nothing told apart by colour alone (WCAG 2.2, 1.4.1). Measure these with the script described under Measuring in SKILL.md; do not estimate them. If an audit of this screen was run in this conversation and the screen has not changed since, use its numbers.

## What to report

- **A verdict in one sentence.** Honest, specific to this screen. "The page does three jobs at once, so the one that matters gets lost."
- **What kind of screen it is**, in a few words, with the verdict.
- **The three problems**, most important first. For each: what a user experiences, where it is on the screenshot, the evidence (a count, a measured ratio, the step where you hesitated), and the job that fixes it, from the job tables in SKILL.md. If no Keen job fits, say what kind of work it is.
- **Also found**, up to five more, one line each, so nothing real is lost to the limit of three.
- **What is working**, two items at most, so the next change does not undo it.
- **Next steps**, as SKILL.md describes.

Do not pad the list to three. Two real problems are a better report than three with a filler, and a screen with one small fault gets a short report that says the screen works. Do not score the screen out of ten.

## Report

Follow the report shape in SKILL.md. "What happened" is the verdict. "What you need to do" is to pick the next step. Under "Not checked", list every state and screen size you did not see.
