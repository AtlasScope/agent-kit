# Spacing studio

Build with `--modules spacing` (or `button,palette,type,spacing`). It designs how much room things get: overall density, the scale every gap is picked from, padding inside cards, gaps between items and sections, alignment, control size, content width and list row height. It draws one small real page (header, heading and paragraph, a card with a field and the main action, a short list) at real pixel sizes, on the project's page colour and in its fonts when Palette and Typography are in the session. The button can follow it ("From Spacing").

## What the agent fills in: `PROJECT.spacing`

```js
spacing: {
  measured: true,                       // true only when `today` was read from the project's code
  today: { unit: 4, system: 'multiples', pad: 20, gap: 12, section: 40, row: 10, controlH: 40, padX: 0.5, maxw: 960, align: 'start' },
  drop: [],                             // group ids to hide: density rhythm padding gaps align controls width rows guides
}
```

Every key is optional. Measure from the project's spacing tokens or the values its cards, lists and buttons really use (padding of a card, gap between items, space between sections, height of its buttons). Values outside the ranges below are clamped. If today's values do not match a density, the density shows as custom.

## State keys

| key | meaning | values |
|---|---|---|
| density | named set of pad, gap, section, row and controlH | spacious, airy, comfortable, cosy, compact, dense, packed, custom |
| system | how the eight scale steps grow from the base unit | steps, multiples, double, natural, gentle, bold, finewide |
| unit | base unit, px | 2 to 16 |
| pad | padding inside cards, px | 0 to 64 |
| gap | gap between neighbouring items, px | 0 to 48 |
| section | gap between sections, px | 8 to 160 |
| row | list row padding above and below, px | 0 to 28 |
| controlH | height of buttons and fields, px | 20 to 72 |
| padX | control side padding as a share of its height | 0.2 to 0.9 |
| maxw | widest the content gets, px | 360 to 1280 |
| align | what things line up with | start, center, split, grid, end, indent |
| guides | tint the spaces | off, on |

Picking a density sets pad, gap, section, row and controlH together. Picking a system or unit snaps pad, gap and row to the nearest step of the new scale (section to a step or twice a step). Changing any of those by hand turns the density into custom. The text-block gap is worked out as three quarters of the item gap.

The scale is eight steps: base unit times these, rounded and kept strictly rising. steps 0.5 1 1.5 2 3 4 6 8; multiples 1 to 8; double 0.125 up to 16 (each twice the last); natural 0.382 0.618 1 1.618 2.618 4.236 6.854 11.09; gentle 0.51 0.64 0.8 1 1.25 1.56 1.95 2.44; bold 0.3 0.44 0.67 1 1.5 2.25 3.4 5.06; finewide 0.25 0.5 0.75 1 1.5 2.5 4 8.

## What other studios and the page get

`share('spacing')` returns `{ unit, scale: [8 px steps], density, pad, gap, section, controlH, padX, align: 'start' | 'center' }`. The example page reads `--sc-space --sc-pad --sc-gap --sc-stack --sc-section --sc-row --sc-align --sc-maxw --sc-control-h` (px numbers; align is start or center).

The proposal lists the scale as `space-1` to `space-8` tokens (px and rem), then which token each value uses, and any value that is not on the scale. Reach choices: the spacing scale (shared tokens) or only the screens shown.

## Warnings

Only real problems: controls under 24px tall (under 44px on a touch screen, softly), gaps under 4px, padding under 8px, rows with no room, content wider than 1040px (paragraphs of about 125 letters or more).

## Adding choices later (`MORE`)

```js
'spacing.pad': [[28, 'Card standard', '28px, the padding this project’s cards use.']],
'spacing.maxw': [[760, 'Article', '760px, the width of this project’s articles.']],
'spacing.look': [['docs', 'Docs site', 'Calm, narrow and airy for long reading.',
  { set: { density: 'airy', system: 'natural', unit: 8, pad: 32, gap: 24, section: 64, row: 12, controlH: 46, maxw: 720, align: 'start' } }]],
```

Values must sit inside the ranges above. Words follow the usual rules: a plain name, one plain sentence, no jargon. Run `studio.mjs check` after every edit.
