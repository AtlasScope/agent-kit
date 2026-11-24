# distill

Makes a crowded screen simple by taking things away, so the one thing the screen is for stands out.

Aggressive. Edits files. Does the whole screen in one go.

## The idea

A screen is crowded when things that matter a little are shown as loudly as the thing that matters most. Distilling is deciding what the screen is for and making everything else quieter, later or gone. Making things smaller so they all fit is the opposite of this job.

## Steps

1. **Name the screen's one job** from PRODUCT.md or from the screen itself. Write it in one sentence. If you cannot, stop and suggest `/keen critique`.
2. **Capture before**, at 390 and 1440 wide.
3. **List everything on the screen**: every heading, block of text, control, image, badge, divider and box. Count them. Count the distinct text sizes, colours and box styles too.
4. **Sort each item into one of five piles.**
   - **Keep**: the job cannot be done without it.
   - **Quiet**: useful, but it should not compete. Less weight, less colour, less contrast, smaller.
   - **Later**: needed sometimes. Move it behind one click: a "more" menu, an expandable row, a second step, a details view.
   - **Merge**: two things that say or do nearly the same. One survives.
   - **Cut**: decoration, repetition, explanation of the obvious, borders and boxes that group nothing.
5. **Ask once, if needed.** Anything in the Cut pile that a person can act on (a button, a link, a setting, a filter) is a capability. List those and ask for a yes before removing them. Everything else, go.
6. **Make the change.**
   - One primary action. Other actions drop to plain buttons or links.
   - Group what remains by what belongs together, using space before lines and lines before boxes.
   - Bring the counts down: aim for three or four text sizes and one accent colour on the screen, using the project's own values.
   - Rewrite labels that need a sentence of help into labels that do not. Remove the help.
7. **Capture after**, same sizes, and build the page with before and after side by side.

## Checks before you report

- The screen's one job is still possible, in the same number of steps or fewer. Do it once.
- Everything moved to Later is still reachable, and you can say where.
- Nothing was shrunk below the project's smallest text size or below a 24 by 24 CSS pixel tap target (WCAG 2.2, 2.5.8).
- Keyboard order still follows the visual order.

## Report

Follow the report shape in SKILL.md. In "What happened", give the counts: items on screen before and after, text sizes before and after. Then three short lists in plain words: what went quiet, what moved and where to find it, what was removed. Under Details, the files. Under "Not checked", any state or size you did not capture.
