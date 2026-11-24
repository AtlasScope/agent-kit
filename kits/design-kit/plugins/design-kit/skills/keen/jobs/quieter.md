# quieter

Calms a screen that shouts: too many colours, weights, borders, shadows or things moving. Everything stays on the screen; it stops competing.

Aggressive. Edits files. Does the whole screen in one go.

## The idea

A loud screen is one where everything was made to stand out, so nothing does. The person feels it as tiring or cheap without knowing why. Quieter turns down everything that is not the point, so the one thing that should be noticed is noticed without effort. It differs from `distill`: distill takes things away, quieter keeps them and lowers their volume. If there is simply too much on the screen, stop and suggest `/keen distill`.

## Steps

1. **Name what should still be noticed** when you are done: the screen's main thing and its main action. Everything else is a candidate for turning down.
2. **Capture before**, at 390 and 1440 wide.
3. **Count the noise.** Run `node <skill-dir>/scripts/measure.mjs` and run what it prints inside the page, for the number of colours, text sizes and corner shapes. Then count by eye: filled buttons, bold runs of text, boxes with borders, shadows, badges, icons, anything that moves without being asked.
4. **Turn things down** in the order below. After each, look again; stop when the main thing is the first thing you see.
5. **Capture after**, count again, and report on the worksheet with before and after side by side.

## What to turn down, in order

1. **Movement.** Anything that loops, pulses, slides in or plays by itself stops, unless it reports something that is happening now. Movement is the loudest thing on any screen.
2. **Colour.** Keep the accent for the main action and for things that can be pressed. Status colours stay only where they report a state. Everything else becomes a neutral. Soften large areas of strong colour to a tint.
3. **Filled shapes.** One filled button. The rest become outlines or plain text buttons. Badges and pills that carry no information lose their fill.
4. **Bold.** Bold is for headings and for the one or two words in a block that someone scanning must catch. Unbold the rest.
5. **Lines and boxes.** Replace borders with space where space is enough. Lighten the borders that remain. Remove a box that sits inside another box.
6. **Shadows and effects.** Keep a shadow only where something really floats above the page, such as a menu or a dialog. Remove gradients, glows and blurs that are there for looks.
7. **Capitals, icons and exclamation marks.** Sentence case in place of capitals. Icons only where they are recognised faster than the word. No exclamation marks.

## Limits

- Quiet is not faint. Text stays at 4.5 to 1 against its background, or 3 to 1 for large text, and the edges of fields and controls at 3 to 1 (WCAG 2.2, 1.4.3 and 1.4.11). Turning text grey until it fails is the common mistake of this job.
- A control must still look like something you can press, and the focused control must still show a clear outline (WCAG 2.2, 2.4.7).
- Errors and warnings stay loud. They are meant to interrupt.
- Nothing is removed or moved, and no wording changes.

## Report

Follow the report shape in SKILL.md. In "What happened", give the counts before and after (colours, filled buttons, bordered boxes) and say what a person now sees first. Offer `/keen bolder` as a next step in case the screen now feels flat. Under Details, the values changed. Under "Not checked", any state you did not capture, and movement if you could not watch the page run.
