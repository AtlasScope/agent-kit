# layout

Fixes where things sit on a screen: what comes first, what is grouped with what, and how much room each thing gets. Everything stays; its position and weight change.

Aggressive. Edits files. Does the whole screen in one go.

## The idea

People do not read a screen. They look for the biggest thing, then for what sits near it. Layout is how a screen tells them, without words, what matters most and what belongs together. Two rules carry most of it. Things that are close are read as related, so the space between groups must be clearly larger than the space within them. And size, weight and position are a ranking, so the thing the screen is for must win that ranking outright.

If the screen has too much on it, layout will not save it. Stop and suggest `/keen distill` first.

## Steps

1. **Name the screen's one job** from PRODUCT.md or the screen. Then rank what is on it: the one thing that matters most, the things that support it, and everything else.
2. **Capture before**, at 390 and 1440 wide. Shrink each capture to a thumbnail and write down what stands out. That is the screen's ranking today.
3. **Find the project's spacing values**: DESIGN.md, then the theme or token file, then the values used most on this screen. If there is no set, use steps of 4 (4, 8, 12, 16, 24, 32, 48, 64) and say so.
4. **Work through the six passes** below.
5. **Capture after**, same sizes, and check the thumbnail again: the thing that matters most should now be what stands out.
6. **Report** on the Keen page, before and after side by side.

## The six passes

1. **Order.** Arrange things in the order a person needs them, top to bottom, and in the reading direction of the language. The screen's main thing and its main action appear without scrolling at 390 wide. Whatever is asked for first sits first. On a phone the main action sits where a thumb reaches, in the lower half or fixed at the bottom.
2. **Grouping.** Things that belong together sit together, and the gap between groups is at least twice the gap inside them. A label sits closer to its own field than to the one above. Group with space first. Add a line only when space is not enough, and a box only when a line is not enough. Remove boxes inside boxes.
3. **One focal point.** One element per screen is largest or heaviest, and it is the thing the screen is for. Lower everything that competes with it: reduce its size, weight or contrast before raising the winner. Only one button looks like the main button.
4. **Alignment.** Pick the fewest vertical lines the content can hang from and put every edge on one of them. Left-align text that is read; centre only short, standalone things. Numbers in a column align on the right so they can be compared.
5. **Room.** Give the most important thing the most space around it. Text that is read runs 45 to 75 characters per line; cap the width when the screen is wider than that. Content does not stretch to fill a wide screen just because the room is there. Every gap comes from the spacing set.
6. **Scanning.** A list or table lets the eye run down one edge: the thing people look for (a name, a date, an amount) is first in each row and in the same place every time. Repeated items share one structure.

## Checks before you report

- Nothing was removed and nothing was restyled beyond size and weight. Colours and fonts are for `/keen colour` and `/keen type`.
- The order a keyboard or screen reader moves through the page matches the new visual order (WCAG 2.2, 1.3.2 and 2.4.3). If you moved something on screen, move it in the code. Do not reorder with styling alone.
- No sideways scrolling at 320 wide (WCAG 2.2, 1.4.10).
- Every control is still at least 24 by 24 CSS pixels (WCAG 2.2, 2.5.8).
- The screen's one job takes the same number of steps or fewer. Do it once.

## Report

Follow the report shape in SKILL.md. In "What happened", say what stood out before and what stands out now, then what moved, in words a person can check against the screenshots ("the total is now above the list, not below it"). Under Details, the files and the spacing values used. Under "Not checked", any width or state you did not capture.
