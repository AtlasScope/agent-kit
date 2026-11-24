# type

Makes the text on a screen easy to read and gives it a clear order: a small set of sizes, each with one purpose.

Aggressive. Edits files. Does the whole screen in one go.

## The idea

Most of a screen is text, so most of how a screen looks is decided here. Two things go wrong. Text is hard to read: too small, too light, lines too long or too tight. Or text has no order: nine sizes chosen by eye, so nothing tells the reader which line is the heading. The fix for both is a short ladder of sizes where every rung has one purpose and the rungs are far enough apart to tell at a glance.

## Steps

1. **Capture before**, at 390 and 1440 wide.
2. **Count what is there.** Run `node <skill-dir>/scripts/measure.mjs` and run what it prints inside the page: `variety.textSizes` and `variety.fontFamilies` give every size and family on the screen and how often each is used. Note the weights and line heights in use as well.
3. **Find the project's own ladder**: DESIGN.md, then the theme or token file. If there is one, this job moves stray text onto it and stops there. If there is none, build one in step 4 and say so.
4. **Set the ladder.** Give each purpose on this screen one style, and no more purposes than the screen has. Most screens need four or five: a page heading, a section heading, body text, a label, a caption.
   - Body text is 16px or larger on the web. On a phone, text in a field is never under 16px, because Safari on iPhone zooms the page when a smaller field is tapped.
   - Each rung is visibly different from the next: at least a fifth larger, or the same size with a clear change of weight. Two sizes one pixel apart read as a mistake.
   - Two weights are enough, a regular and a bold. Add a third only if the font was drawn with one.
   - Nothing under 12px.
5. **Fix the reading.** Apply the table below to every style.
6. **Fix the fonts**, if they are the problem. One family is enough for most products; two at most, with clear roles (one for headings, one for reading). Keep the project's fonts unless the request was to change them. Check that each font really loads, and that the page does not jump when it does: the stand-in font shown while loading should be close in width to the real one.
7. **Capture after** and report on the Keen page, with the before and after shots.

## Reading

| What | Aim for | Why |
|---|---|---|
| Line length | 45 to 75 characters for text that is read; never over 80 | The eye loses its place on the way back from a long line (WCAG 2.2, 1.4.8) |
| Line height | About 1.5 for body text, 1.1 to 1.3 for large headings | Long lines need more room; big text needs less |
| Space after a paragraph | Clearly more than the line height | So a new thought looks like one |
| Alignment | Left for anything longer than three lines. No justified text | Even word spacing is easier to read than even edges |
| Capitals | Short labels only, with a little extra space between letters | Sentences in capitals are slow to read |
| Numbers in columns | Figures of equal width, right-aligned | So amounts can be compared down the column |
| Heading and what follows | The heading sits closer to its own text than to the text above it | So it reads as a title, not a divider |
| Text contrast | 4.5 to 1, or 3 to 1 at 24px and up | Light grey text is the commonest way a screen becomes unreadable (WCAG 2.2, 1.4.3) |
| Size units | Sizes that follow the reader's own text-size setting | So text grows when someone asks their browser or phone for larger text (WCAG 2.2, 1.4.4) |
| Punctuation | Real quotation marks and apostrophes, and a real multiplication sign and dashes where the content uses them | Straight marks from the keyboard look unfinished at large sizes |

## Checks before you report

- Each purpose uses one style everywhere on the screen. Count the sizes again (`variety.textStyles` lists each style with an example of where it is used). The number should have dropped, unless the screen was already on its ladder; then say so and report only the strays you fixed.
- At 200 percent zoom nothing is cut off and nothing overlaps (WCAG 2.2, 1.4.4).
- With line height 1.5, paragraph spacing twice the text size and letter spacing 0.12 of it, no text is clipped (WCAG 2.2, 1.4.12). This catches boxes with a fixed height.
- No heading is left with a single word alone on its last line where a small width change fixes it.
- Wording, colours and positions are unchanged. Those are `/keen words`, `/keen colour` and `/keen layout`.

## Report

Follow the report shape in SKILL.md. In "What happened", give the count of text sizes before and after and name the ladder in plain words ("five sizes: page title, section title, reading text, labels, small print"). Under Details, each style with its size, weight and line height, and the files changed. Under "Not checked", zoom or text-size settings you could not try, and whether you saw the real fonts load.
