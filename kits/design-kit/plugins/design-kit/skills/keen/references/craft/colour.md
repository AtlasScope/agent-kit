# Colour

Colour is relative, perceptual and semantic at once. Work in a space that matches the eye, then decide what each colour means.

## Moves

- **Work in OKLCH.** OKLab (Björn Ottosson, 2020) is built so equal steps look equal; OKLCH is the same space as lightness, chroma and hue, and CSS Color 4 writes it as `oklch(L C H)`. Holding L fixed while changing H gives colours that really look equally light, which HSL does not (HSL yellow and blue at "50% lightness" are wildly different to the eye). Build ramps by stepping L evenly and easing C down toward both ends.
- **Start from the source world's materials, not the colour wheel.** A tide planner's palette comes from chart paper, survey ink, the red of a harbour light; a bakery's from crust, flour and the paper bag. Name three to five materials, sample their colours, then tune them in OKLCH for contrast. This is how a palette becomes owned.
- **One accent, used once.** An accent spread across everything stops meaning anything. Give it one job (the action, the live value, the one thing that matters now) and keep everything else neutral.
- **Tint the neutrals.** Pure greys look dead beside a coloured accent. Give neutrals a trace of the accent's hue or of the material's (chroma 0.005 to 0.02). Warm paper and cool ink are both choices; #f5f5f5 is not.
- **Colour is relative.** The same swatch looks different on different grounds (Josef Albers, *Interaction of Color*, 1963). Judge colours in place, at their real sizes, beside their real neighbours. A small area of colour needs more chroma to read than a large one.
- **Saturated colour looks brighter than its lightness.** The Helmholtz–Kohlrausch effect makes vivid colours appear lighter than greys of the same measured luminance, so a saturated button can feel louder than its contrast number suggests. Balance by eye, then check the number.
- **Contrast is a floor.** WCAG 2.2: 4.5 to 1 for text, 3 to 1 for large text and for the edges of controls (1.4.3, 1.4.11). APCA, a candidate method for a future WCAG, weighs polarity and size more realistically; it can inform a judgement, but the current standard is what is checked.
- **Dark themes are designed, not inverted.** Lift the background off black (OKLCH L about 0.13 to 0.2), lower chroma of large areas, and raise surfaces by lightness rather than shadow.
- **Wide gamut, with a floor.** Display P3 screens show more saturated colours than sRGB. `oklch()` can describe them; wrap them in `@media (color-gamut: p3)` with an sRGB fallback, and never let meaning depend on the extra saturation.
- **Colour that carries data follows data rules.** See [data.md](data.md): sequential for ordered values, diverging around a meaningful midpoint, categorical for kinds, and never rainbow for magnitudes.

## Checks

- Run `fingerprint.mjs`. Is the main hue in the indigo-violet default band? Are there gradients doing decoration? Is every colour accountable to the idea?
- Does the screen still work in greyscale? If meaning is lost, colour is carrying something alone (WCAG 2.2, 1.4.1).

## Sources

Ottosson, "A perceptual color space for image processing" (2020). CSS Color Module Level 4 (`oklch()`, `color-gamut`). Albers, *Interaction of Color* (1963). WCAG 2.2, 1.4.1, 1.4.3, 1.4.11. Brewer, ColorBrewer (2002). Fairchild, *Color Appearance Models* (3rd ed., 2013) on Helmholtz–Kohlrausch.
