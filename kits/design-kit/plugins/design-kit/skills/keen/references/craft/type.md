# Type

Type is most of every interface. Choosing and setting it well is the single largest lever on quality.

## Choosing faces

- **Choose a face for what it says, then check that it works.** A face carries a voice before anyone reads a word: a grotesque is neutral and institutional, a humanist sans is friendly, a slab is mechanical and sturdy, a high-contrast serif is editorial and expensive, a monospace is technical and tabular. Pick the voice the idea needs, then check the face has the weights, numerals and language coverage the product needs.
- **Two faces at most, with different jobs.** One for display, one for reading, or one family used with discipline. A second face must differ clearly (serif against sans, wide against narrow); two similar sans faces look like a mistake.
- **Avoid the stock faces unless chosen.** Inter, Roboto, the system stack and their kin are excellent and say nothing. `fingerprint.mjs` flags a page that uses only these.
- **Variable fonts give the in-between weights and optical sizes for one download.** Prefer them when they exist.

## Setting it

- **Line length.** 45 to 75 characters per line for reading, 66 the classic ideal (Bringhurst, *The Elements of Typographic Style*). `fingerprint.mjs` reports the measured median as `type.measure`. Set width in `ch` units.
- **Scale from the content.** Choose body size first (16 to 20px on screen), then the largest size the idea needs, then fill the steps between with a ratio. A modular scale (Tim Brown, "More Meaningful Typography", A List Apart 2011) keeps the steps related; steps smaller than about 1.2 are hard to tell apart, so use fewer sizes with bigger gaps.
- **Optical size.** Small text needs wider spacing, larger x-height and lower contrast; large text needs tighter spacing and can take finer detail. Fonts with an `opsz` axis do this when `font-optical-sizing: auto` is on (the default in CSS Fonts Level 4). Without one, add tracking to small sizes (+0.01 to +0.04em) and remove it from display sizes (−0.01 to −0.04em). All caps always needs added tracking, about +0.05 to +0.1em.
- **Line height falls as size rises.** About 1.5 for body, 1.1 to 1.2 for headings, 0.9 to 1.0 for very large display.
- **Optical alignment.** Round and pointed letters overshoot the baseline and cap height on purpose so they look the same size. Apply the same logic at the edge: a large heading's first letter often needs a small negative indent to look aligned with the text below, and quotation marks hang into the margin (`hanging-punctuation` where supported, a negative indent elsewhere).
- **Rag and widows.** `text-wrap: balance` for headings and `text-wrap: pretty` for paragraphs (CSS Text Level 4) avoid single-word last lines.
- **Numbers.** Tabular figures (`font-variant-numeric: tabular-nums`) in tables, timers and anything that updates, so digits do not shift. Old-style figures sit better inside running text in faces that have them. Use real minus signs, en dashes for ranges and the correct unit spacing.
- **Hierarchy with fewer tools.** Size, weight, colour, case and space each signal importance; use two at a time. A heading that is bigger, bolder, coloured and uppercase is shouting.

## Checks

- Are body and secondary text at 16px and above, and at least 4.5 to 1 contrast?
- Count the distinct sizes in use (`measure.mjs` `variety.textSizes`). More than six on a screen is usually indecision.
- Read one paragraph at arm's length on a phone. If it is tiring, the measure, size or line height is off.

## Sources

Bringhurst, *The Elements of Typographic Style* (4th ed., 2012). CSS Fonts Module Level 4 (`font-optical-sizing`, variable font axes). CSS Text Module Level 4 (`text-wrap`). OpenType specification, `opsz` and `tnum`/`onum` features. Tim Brown, "More Meaningful Typography" (2011).
