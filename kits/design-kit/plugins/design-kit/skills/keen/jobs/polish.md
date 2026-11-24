# polish

The finishing pass on a screen whose structure is already right. It fixes the small inconsistencies that make good work look unfinished.

Aggressive. Edits files. Does not change what is on the screen, what it says or where things sit.

## When to stop instead

Polish cannot rescue a screen that is crowded, confusing or doing two jobs. If that is what you see, stop, say so in two lines and suggest `/keen distill` or `/keen critique`. Polishing it would hide the problem for a week.

## Steps

1. **Capture before**, at 390 and 1440 wide, plus the main button and one link with the pointer over them and with keyboard focus (press Tab until each is reached, then capture). Two controls are enough; the point is to see whether those states exist and match.
2. **Find the project's values.** DESIGN.md first, then the theme or token file, then the most common values in the code. Polish means moving stray values onto the project's own scale. If there is no scale, take the values used most often on this screen as the scale and say so. Where DESIGN.md and the screen disagree, DESIGN.md wins: a stray moves to the nearest value the file names, not to whichever stray is most common. If the file's value would look wrong here, leave the stray and list it as a question.
3. **Go through the eight passes** below, fixing as you go. A pass that finds nothing is finished; on a tidy screen most will. Stop when the passes are done, not when the change looks big enough.
4. **Capture after** and build the page with the before and after shots.

## The eight passes

1. **Alignment.** Every edge lines up with another edge on purpose. Text baselines in a row match. Icons sit centred on their labels. Look for anything off by one to three pixels.
2. **Spacing.** Every gap comes from the scale. Things that belong together are closer to each other than to anything else. The same kind of gap is the same size everywhere on the screen.
3. **Type.** Each text size, weight and line height comes from the scale, and each role (heading, body, label, caption) uses one style. Body text lines run roughly 45 to 75 characters. No orphaned single word under a heading where a small width change fixes it.
4. **Colour.** Every colour is a named project colour. Greys are from one family. Contrast is at least 4.5 to 1 for text and 3 to 1 for large text and the edges of controls (WCAG 2.2, 1.4.3 and 1.4.11). Measure the ones that look close.
5. **Shape and depth.** One corner radius per kind of thing. Borders one weight and one colour. Shadows from one set, all cast in the same direction. Nested corners look concentric.
6. **States.** Every control has hover, pressed, keyboard focus and disabled states, and they are consistent with each other. Focus is clearly visible (WCAG 2.2, 2.4.7). Nothing shifts position when a state changes.
7. **Images and icons.** One icon set at one stroke weight and size. Images have set proportions so the page does not jump while they load, and they are sharp on a high-density display.
8. **Edges of the screen.** Consistent page margins. Nothing touching the edge of a phone screen or sitting under a notch or home indicator.

## Limits

- No new components, no layout changes, no copy changes. If a pass turns up something that needs one, list it at the end.
- Do not introduce a value the project does not already have when an existing one is within a step of it.
- Leave motion alone.

## Report

Follow the report shape in SKILL.md. In "What happened", say how many fixes were made and name the two or three a person would notice. Under Details, list fixes grouped by pass, with the value before and after. Under "Not checked", any pass you could not verify by looking, such as focus states with no browser.
