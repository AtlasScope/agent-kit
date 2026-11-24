# Wide-color finish

Macs, iPhones, iPads and good wide-gamut monitors can show more saturated colors than a standard screen. A palette written only in hex is held to the standard screen's range, so on those displays it looks a little flat. The wide-color finish gives those screens a more saturated version of each brand color. The hue and lightness never change, and every other screen keeps the hex exactly as it is.

This is the default whenever you write or change color tokens for a web project. Skip it only when DESIGN.md or the user says the colors must stay exactly as written, or for a color that has to match a printed or regulated brand spec (a logo color, say). It is a separate step from the workbook's finishes (glass, flat and the rest), which change components, not colors.

## What each screen sees

| Screen | What it shows |
|---|---|
| Standard sRGB screen, any browser | The hex. It does not match `@media (color-gamut: p3)`, so the wide values are never read. |
| Mac, iPhone, iPad (Safari, Chrome, Edge) | The OKLCH values: same hue and lightness, more saturation. |
| Windows wide-gamut or QHD/4K panel, Chrome or Edge | The OKLCH values only when Windows reports the wide range: HDR on, or Windows color management (Auto Color Management, or a calibrated wide-gamut profile) turned on for that display. Otherwise the browser reports sRGB and the page shows the hex. |
| Older browsers without OKLCH (before Safari 15.4, Chrome 111, Firefox 113) | The hex. The overrides sit behind `@supports (color: oklch(0 0 0))`, so these browsers never read them, even on a P3 screen. |

Nothing gets worse on any screen. The worst case is the page looking the way it did before.

## How to apply it

1. **Keep each token's hex as written.** It is the fallback, and contrast checks run on it. Don't convert the base tokens to OKLCH as part of this step.
2. **Work out the wide values.** Run the script on the tokens file, or on single colors:

   ```sh
   node <skill>/scripts/wide-color.mjs --css <path/to/tokens.css>
   node <skill>/scripts/wide-color.mjs --accent=#2563EB --danger=#DC2626
   ```

   For each color it keeps the OKLCH lightness and hue and moves the chroma (saturation) 90% of the way toward the Display P3 edge for that lightness and hue. A color already at the edge of the standard range gets the full move; a half-saturated one gets about a quarter of it; muted tints get almost nothing; grays, near-white and near-black are left alone. `--amount 0.8` is gentler. It prints a ready block.
3. **Add the block after the tokens it overrides**, including after any dark-theme block, so the cascade order is hex first, wide value second:

   ```css
   :root { --accent: #2563EB; --danger: #DC2626; }

   @media (color-gamut: p3) {
     @supports (color: oklch(0 0 0)) {
       :root { --accent: oklch(54.6% 0.251 262.9); --danger: oklch(57.7% 0.253 27.3); }
     }
   }
   ```

   Keep the `@supports` wrapper. A custom property accepts any value, so a P3 browser without OKLCH (Safari before 15.4) would store the `oklch()` text, and every `color: var(--accent)` would then be invalid and fall back to the inherited or initial color, not the hex.

   A theme that sets its own hex (a dark theme under `prefers-color-scheme`, a `.dark` class) needs its own wide line in the same place: nest the media query the same way, or repeat the theme selector inside the P3 block. The script groups `--css` output by the rule each token sits in; a token inside another media query comes back under that rule's selector only, so nest its line by hand.
4. **Derive tints and glows from the token.** A hardcoded `rgba(37, 99, 235, .3)` never picks up the wide value. Write `color-mix(in oklab, var(--accent) 30%, transparent)` instead, for glows, selection, hover fills, rings, gradients and shadows. Search the CSS for `rgba(` and for hex values that repeat a token.
5. **Mix in oklab, never srgb.** `color-mix(in srgb, …)` mixes in the standard range and drags the result back toward it. Change existing ones to `in oklab`. Gradients can say `linear-gradient(in oklab, …)`.
6. **Optional: a soft bloom on focus.** Keep the solid outline and add a glow made from the same token, so it gets the wide color too:

   ```css
   :focus-visible { outline: 2px solid var(--focus); outline-offset: 2px;
     box-shadow: 0 0 0 5px color-mix(in oklab, var(--focus) 16%, transparent), 0 0 18px color-mix(in oklab, var(--focus) 30%, transparent); }
   ```

`color-mix()` needs Safari 16.2, Chrome 111 or Firefox 113. An older browser drops the whole line, so where the line carries meaning (a focus outline, an error border), keep a plain line with the hex just before it.

## What to leave alone

- Body text and neutrals. Text reads the same at either range, and tinted grays should stay quiet. The script skips true grays; don't feed it text colors.
- Colors with a fixed spec, as above.
- Values already written in OKLCH beyond the standard range (Tailwind v4's own palette does this). They are already wide; give their sRGB fallback a hex only if the project supports old browsers.

## Check it

- Contrast stays with the hex. The wide value has the same lightness, so its contrast is within a hair of the hex's; recheck only a pair that sits right at a threshold.
- Look at it on a Mac or iPhone next to a standard screen, or in Chrome DevTools: Rendering, then "Emulate CSS media feature color-gamut". Switching between `srgb` and `p3` should change saturation only. A hue shift means a value was typed wrong.
- Search again for `rgba(` and `in srgb` in the files you touched.

## Native apps

On iOS and macOS, use the same lift: `node <skill>/scripts/wide-color.mjs --json <colors>` gives a `p3` value per color (`color(display-p3 r g b)`). Put those components in the asset catalog with the Display P3 color space, or in `Color(.displayP3, red:, green:, blue:)`. Keep the sRGB value as the asset's fallback.
