# colour

Gives a screen a small set of colours where each one has a purpose, and makes sure everything can be read. Also answers to `/keen color`.

Aggressive. Edits files. Does the whole screen in one go.

## The idea

Colour on a screen does three jobs: it shows what can be pressed, it shows what state something is in, and it sets the mood. It fails when one colour is asked to do two of those, so that the same blue means "link", "selected" and "information", or when there are so many colours that none of them means anything. The fix is fewer colours, each with one purpose, used the same way everywhere. Most of a good screen is not coloured at all.

## Steps

1. **Capture before**, at 390 and 1440 wide, in light and dark if the product has both.
2. **Count and measure.** Run `node <skill-dir>/scripts/measure.mjs` and run what it prints inside the page. `variety.textColours` and `variety.backgroundColours` say how many colours are in use. `text.lowContrast` lists every piece of text that fails, with its measured ratio.
3. **Find the project's palette**: DESIGN.md, then the theme or token file. If there is one, this job moves stray colours onto it, fixes the pairs that fail, and stops. If there is none, build the set in step 4 and say so. If the person wants to choose a new palette from scratch and `/palette-builder` is installed, offer it as the next step and do not invent a brand colour here.
4. **Give each colour one purpose.**

   | Purpose | How many | Used for |
   |---|---|---|
   | Neutrals | One family of greys, eight to ten steps from near white to near black | Backgrounds, text, borders, dividers. Most of the screen |
   | Accent | One | Things that can be pressed, and the one thing on the screen that matters most |
   | Status | Up to four: success, warning, danger, information | Only to report state. Never as decoration |

   Anything on the screen that fits none of these loses its colour.
5. **Build the steps evenly.** When you create or fill in a scale, step the lightness evenly in a colour space made to match what the eye sees, such as OKLCH, which CSS supports. Even steps in ordinary hex values look uneven. Tint the greys slightly toward the accent so they sit together, and keep pure black and pure white for the rare case that needs them.
6. **Fix every pair that fails**, using the table below. Change the lightness of the weaker colour and keep its hue, so the palette still looks like itself.
7. **Do the same for dark mode** if the product has one. Dark mode is its own set of pairs, not the light one reversed: surfaces get lighter as they come forward, and strong colours are toned down so they do not glare.
8. **Capture after**, run the measuring script again, and report on the worksheet with before and after side by side.

## What must be readable

Contrast is how much one colour stands out from the colour behind it, as a ratio from 1 to 1 (invisible) to 21 to 1 (black on white).

| Pair | At least | Standard |
|---|---|---|
| Text on its background | 4.5 to 1 | WCAG 2.2, 1.4.3 |
| Text of 24px and up, or 18.66px and up in bold | 3 to 1 | WCAG 2.2, 1.4.3 |
| The edge of a field, a checkbox, a switch, and any icon that carries meaning | 3 to 1 against what is beside it | WCAG 2.2, 1.4.11 |
| The outline on the focused control | 3 to 1 against what is beside it | WCAG 2.2, 1.4.11 and 2.4.7 |
| Text on the accent colour, such as a button label | 4.5 to 1 | WCAG 2.2, 1.4.3 |
| Placeholder and hint text | 4.5 to 1 | WCAG 2.2, 1.4.3 |
| Disabled controls | No minimum, but they must still look like they are there | WCAG 2.2, 1.4.3 exception |

## Rules

- **Never colour alone.** About one man in twelve cannot tell red from green. An error has an icon and words as well as red. A required field has a mark. A line on a chart has a label or a pattern. A link inside text is underlined (WCAG 2.2, 1.4.1).
- **One accent, used sparingly.** If everything pressable is the accent and nothing else is, people learn what can be pressed. One filled accent button per screen.
- **Status colours mean status.** Red is for danger and failure only. If the brand colour is red, the danger colour needs to look different from it, or carry an icon every time.
- **Use the name, not the value.** Each colour is defined once, named for its purpose ("text", "border", "danger"), and used by that name. A raw colour value in a screen's own code is a stray.
- **States come from the set.** Hover, pressed and selected are the next step along the same scale, not a new colour.

## Checks before you report

- The measuring script shows no text below its minimum, in light and in dark. Text over a photo, video or drawing is not measured by the script: it lists each one, and you look at them.
- The count of colours went down, or stayed the same with every one now from the set.
- Seen in greyscale, the screen still makes sense: the main action still stands out and every status can still be told apart.
- Positions, sizes and wording are unchanged.

## Report

Follow the report shape in SKILL.md. In "What happened", give the two numbers a person can hold on to: pieces of text that were hard to read before and after, and colours in use before and after. Explain contrast once, the first time it appears. Under Details, each pair you changed with its ratio before and after, and the files. Under "Not checked", dark mode if you could not see it, text over pictures, and any state you did not open.
