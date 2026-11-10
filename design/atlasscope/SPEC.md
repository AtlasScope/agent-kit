# AtlasScope identity specification

Version 0.4, 2026-11-09. Foundation only: symbol, wordmark, lockup, icons. Status: built and checked, waiting for Austin's sign-off.

AtlasScope is Austin's personal identity for building, researching and writing about AI and software. Projects such as Agent Kit sit beside it and keep their own names and marks.

## The parts

| Part | File stem | Use |
|---|---|---|
| Orbit symbol | `atlasscope-symbol` | Icons, avatars, anywhere the name is already written nearby |
| Wordmark | `atlasscope-wordmark` | When the symbol would repeat, or space is short and wide |
| Primary lockup | `atlasscope-lockup` | Default: site header, share images, documents |
| Small symbol | `atlasscope-symbol-small` | 32 px and below. Heavier legs, thicker band, wider gap |

Every file comes in `ink` (for light backgrounds) and `white` (for dark). The `currentcolor` files take the colour of the text around them when placed inline on a web page.

## Symbol construction

Drawn on a grid where the A is 100 units tall. All values are in [source/geometry.py](source/geometry.py).

| Measure | Value |
|---|---|
| Leg slope | 0.45 across per 1 up (24.2° from vertical) |
| Leg thickness, square to the leg | 21 |
| Flat top width | 23 |
| Horizon band thickness | 21, the same as the leg |
| Gap between feet and band | 12 |
| Band outer radius | 120 |
| Band reach past the outer foot corner | 10 each side |
| Overall box | 147.9 wide × 154.0 tall |

The feet, the gap and both edges of the band are arcs of circles with one shared centre on the symbol's centre line. The band ends are cut along lines through that centre. The inner notch is a sharp point. Nothing is rounded.

These proportions were measured from the selected Orbit reference image (`selected-orbit-symbol.png` in the v0.1 handoff) and then made exact. Laid over that reference, the redraw matches to within a pixel or two at the feet and band ends, which is where the reference itself was irregular.

Small drawing (32 px and below): leg 25, band 24, gap 14, reach 8. The 16 px favicon uses a flatter band (radius 260) so the gap falls on one clean pixel row.

## Wordmark construction

| Measure | Value |
|---|---|
| Typeface | Montserrat, variable weight axis at 600 (SemiBold), chosen by Austin on the decision board |
| Tracking | −22 units per 1000 on every letter |
| Cap height | 700 units (the unit used below) |
| A height | 700, same as the capital S without its overshoot |
| A leg slope | 0.45, identical to the symbol |
| A leg thickness | 131, which is 1.05 × the stem of the l (125) |
| A flat top | 150 |
| A width | 780 (1.11 × its height) |
| Pair adjustments | A–t −32, t–l +4, l–a +2, a–s −2, s–S +4, S–c +2, o–p +2 |
| Wordmark ink box | 5538 wide × 936 tall |

The A is drawn by hand. Two other letters carry a small detail, chosen by Austin on the decision board: the t has its crossbar on the right of the stem only, the tops of the t and l end in a shallow angled cut (it falls 46 units across the stem, low at the left), and the foot of the p carries the same cut turned half a circle. The remaining letters are Montserrat's own outlines with spacing reset. The details are switched on and off by name in `CUSTOM` in `source/geometry.py`. S, c, o, a, s and e are left alone: they are curves, and cutting curves is what made earlier versions look sci-fi.

## Lockup

- The symbol's A is exactly as tall as the wordmark's A and stands on the same baseline. The horizon band hangs below the baseline.
- Symbol scale is 7 × its grid, so its legs measure 147 against the wordmark A's 131. The two A's are the same height and angle; the symbol is slightly heavier, following the selected Orbit reference.
- Space between the symbol and the wordmark: 385 units (0.55 × cap height).
- Ink box: 6958 wide × 1120 tall. It reaches 742 above the baseline (top of the l) and 378 below it (the band).
- In a header, centre the cap height on the bar's centre line, so the name lines up with the navigation text. Do not centre the whole box.

## Clear space and minimum sizes

Clear space on every side is X, where X is half the cap height. The files in `svg/padded/` and all PNGs in `png/` have this space built in. The files directly in `svg/` are cropped tight to the ink.

| Version | Minimum size |
|---|---|
| Lockup | 14 px cap height (about 139 px wide) |
| Wordmark | 12 px cap height (about 95 px wide) |
| Symbol, regular drawing | 40 px wide |
| Symbol, small drawing | 12 px wide (16 px favicon tile) |

Below the lockup minimum, use the wordmark alone or the symbol alone.

## Colour

| Name | Hex | Use |
|---|---|---|
| Ink | `#0B0C12` | Dark backgrounds, logo on light |
| White | `#FFFFFF` | Logo on dark, light backgrounds |
| Slate | `#151821` | Raised panels on dark |
| Muted | `#A3A6AD` | Secondary text on dark |

The logo is only ever ink or white. No gradients, glows, outlines or tints. The board listed Muted as `#A9A0A0`, which is a warm grey that does not match the swatch it sat under; `#A3A6AD` matches the swatch.

## Typography

- Logo: Montserrat 600, as outlines. Never retype the wordmark in live text.
- Headings on AtlasScope surfaces: Montserrat SemiBold or Bold, tracking −1% to −2%.
- Interface and body text: Inter, as on the board. The Agent Kit site currently uses Geist; that is a site decision and is left alone here.

Licence: Montserrat is under the SIL Open Font License 1.1 ([source/fonts/Montserrat-OFL.txt](source/fonts/Montserrat-OFL.txt)). The licence allows use in logos, on the web and in products, and allows modified outlines in artwork. Its one restriction that matters here is on redistributing a modified font file under the Montserrat name, which this project does not do. A logo made from an open font can be used and registered, but the letter shapes themselves are not exclusive; the A and the symbol are the ownable parts.

## Do not

- Put the horizon band under the wordmark's A. The band belongs to the symbol only.
- Stretch, rotate, outline, shade or recolour any part.
- Change the gap between symbol and wordmark, or rebuild the lockup by hand.
- Use the regular symbol below 40 px; switch to the small drawing.
- Set the logo over photographs or busy imagery without a solid ink or white field behind it.

## Files

| Folder | Holds |
|---|---|
| `svg/` | Master vectors, cropped tight. Import these into Figma |
| `svg/padded/` | The same with clear space built in |
| `png/` | Transparent PNGs: lockup 600/1200/2400, wordmark 500/1000/2000, symbol 256/512/1024 wide |
| `icons/` | `favicon.svg`, `favicon.ico` (16, 32, 48), `apple-touch-icon.png` (180), app icons 64 to 1024, maskable 192 and 512 |
| `social/` | Avatars 400 and 1024 (dark and light), share images 1200×630 and 1280×640 |
| `applications/` | Mock-ups: headers, avatar, app icon, share image, size test |
| `spec/` | Construction sheet |
| `source/` | `geometry.py` (every number), `build.py` (regenerates everything), the font and its licence |

To regenerate: `python3 design/atlasscope/source/build.py`. It needs Python with fontTools and Pillow, and the site's `node_modules` for PNG rendering. No output file contains live text or refers to a font.

## Preliminary similarity review

This is a designer's first look, done with web searches on 2026-11-09. It is not a trademark search and not legal clearance.

| Compared with | Similarity | Assessment |
|---|---|---|
| NASA Artemis programme logo | A crossbar-free A with a crescent arc across its base and a trajectory line | The closest known design in idea. Differences: Artemis is three colours, has a red trajectory crossing the A, and its crescent sits inside the letter's feet. Different field, and NASA insignia are protected by their own rules. Worth knowing about, and a reason to keep AtlasScope away from space imagery |
| Stock "orbit letter A" logo templates | A with an orbit swoosh, sold as templates for aerospace and tech | The general idea is common. AtlasScope's version is separated from them by its exact construction: concentric foot cut, constant-thickness band, flat cuts. The idea alone is not unique |
| Crossbar-free A in wordmarks (NASA worm, Kia, Samsung, many others) | A without a crossbar | A widespread convention. Not ownable by anyone, and not a conflict |
| Atlassian, Autodesk, Adobe, Vercel | Triangular or A-shaped marks in software | Different constructions: none has open legs over a separate arc. Low risk of confusion |
| The name | ATLASSPACE (surgical planning software), ATLASVIEWER, several ATLAS marks in software | No record found for "AtlasScope" or "Atlas Scope" itself in these searches. "Atlas" is a crowded word in software, so the name is the larger risk, not the drawing |

Before relying on the identity commercially or filing anything: search the USPTO database directly for "atlasscope" and "atlas scope" in classes 9 and 42, run an image search on the final symbol, and have a trademark attorney review both.

Sources: [Creative Bloq on the Artemis logo](https://creativebloq.com/design/logos-icons/nasas-artemis-logo-has-a-deep-message-you-probably-didnt-notice), [Fox 35 on the Artemis symbol](https://www.fox35orlando.com/news/what-does-the-artemis-symbol-mean), [Fast Company on Kia's crossbar-free A](https://www.fastcompany.com/90824476/kia-confusing-logo-kn-design-trend), [stock orbit letter A logo](https://scalebranding.com/product/393491), [ATLASSPACE record](https://trademarks.justia.com/761/48/atlasspace-76148754.html), [ATLASVIEWER record](https://trademarks.justia.com/981/66/atlasviewer-98166279.html), [A ATLAS record](https://gleanmark.com/trademark/uspto-99336903).

## What was wrong in the v0.1 files

Checked in the SVG source of the v0.1 handoff package.

| Finding | Effect |
|---|---|
| Symbol drawn with hand-placed curves, described in its own notes as a manual approximation | Feet and band are not true arcs and do not share a centre; the band's lower edge is slightly off-centre |
| Wordmark A slope 0.39, symbol slope 0.45 | The two A's are different shapes |
| Wordmark A leg 1.29 × the letter stems, with a 17-unit flat top against the symbol's 65 | The A reads as a separate, heavier object with a near-pointed top |
| Letters are Inter Display SemiBold | Narrower and more neutral than the original board, whose round o, a and e measure closest to Montserrat |
| Default Inter spacing, A placed by a fixed offset | No optical spacing; the A–t gap is wider than the rest |
| In the lockup the symbol's A is 71 units tall beside a 90-unit wordmark A, on no shared line | The symbol looks like a smaller, unrelated A |
| Files named `light` contain the off-white artwork meant for dark backgrounds | Easy to place the wrong file |
| App icon is a plain square with no corner radius, no maskable or Apple version, no `.ico` | Not usable as shipped |
| 16 px favicon is a straight downscale of the full drawing | Gap and band blur into grey |
| `identity-proof.svg` has ten live text elements | Renders differently without the font installed |
| Ink `#120F1E` | Violet-tinted, not neutral |

## Decisions for Austin to review

1. **Typeface: Montserrat at weight 600.** Measured against both boards, it matches the letter shapes (round o, two-storey a, flat-topped t). The original board's letters are spaced tighter than Montserrat's default, so tracking is −22. Montserrat is very widely used, which is the trade-off for a free licence and a close match. A paid face with the same skeleton (Gilroy, Gotham) would be less common but is not needed to ship.
2. **One angle and one weight for both A's.** The symbol and the wordmark A share the 0.45 slope and the same leg thickness in the lockup. In v0.1 the wordmark A used a different slope (0.39) and was 1.29 × heavier than its letters.
3. **The symbol follows the selected Orbit reference, made exact.** Feet, gap and band are true arcs on one centre. The v0.1 file approximated them with hand-placed curves.
4. **Lockup alignment.** The two A's are the same height on one baseline, with the band below. This makes the lockup taller below the baseline than a plain line of type.
5. **Ink is `#0B0C12`.** Taken from the system board. The v0.1 package used `#120F1E`, sampled from the Orbit reference, which has a visible violet tint, and `#FAFAFA` in place of white. A neutral ink fits "monochrome" better; it is one constant in `build.py` if you prefer the violet. The Agent Kit site uses a warmer `#0B0A08`, to be reconciled when site work starts.

## Not production-ready yet

- No Figma file. Figma was not connected in this session, so the masters are SVG. They import cleanly as vector shapes.
- No formal trademark search (see above).
- The 16 px favicon is at the limit: the gap is one pixel and the band reads as a bar. It is legible, but the arc's curve is not visible at that size.
- Nothing is wired into the site.
