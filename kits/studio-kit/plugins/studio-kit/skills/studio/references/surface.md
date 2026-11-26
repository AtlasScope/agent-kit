# Surface studio

Build with `--modules surface` (or `button,palette,type,surface`). It designs the surfaces of a product: cards, panels, fields and menus. It decides the material (solid, glass, paper, metal, pressed ...), how round the corners are, how high the surface sits above the page and what its shadow looks like, and the line around it. The extras cover where the light comes from, how see-through it is, texture and how things inside a card differ from the card. It draws a card (heading, a line of text, a field, a row) with a menu floating over it, on the project's page colour, with coloured shapes behind so see-through surfaces show what they do. It follows Palette's colours and Typography's fonts when those studios are in the page, and the button can follow it.

## What the agent fills in: `PROJECT.surface`

```js
surface: {
  measured: true,                       // true only when `today` was read from the project's code
  today: { material: 'solid', radius: 12, depth: 35, shadow: 'layered', edge: 'hairline', bw: 1, ba: 20,
           light: 'top', hl: 50, alpha: 100, blur: 0, tex: 'none', texa: 40, layers: 'darker' },
  words: { title: 'Invoice 1042', text: 'Due on the first of next month.', label: 'Email',
           placeholder: 'name@example.com', row: 'Billing export', menu: ['Rename', 'Duplicate', 'Delete'] },
  drop: [],                             // group ids to hide: material shape depth edges light glass texture layers
}
```

Every key is optional. Read `today` from the project's card, panel, input and menu styles: the corner radius of a card (`radius`) and the nearest material, the box-shadow (`depth` 0 to 100 and the nearest `shadow` style), the border (`bw` px, `ba` percent of the text colour), any `backdrop-filter` (`blur`) and background alpha (`alpha`). A value that is not exactly one of the offered choices is listed first as "Today". `words` is optional: the project's own heading, line of text, field label and menu items make the drawings recognisable. `PROJECT.context` (field, placeholder, rows) is used where `words` is silent.

## State keys

| key | meaning | values |
|---|---|---|
| material | what the surface is made of | solid, frosted, clear, tinted, paper, satin, sheen, outline, pressed |
| radius | card corner, px; fields are about 0.6 of it, menus 0.75; 36 and up makes fields pills | 0 to 40 |
| depth | height above the page | 0 (flat) to 100 |
| shadow | shadow style | soft, crisp, long, layered, coloured, hard |
| edge | kind of line around the surface | none, hairline, firm, lit, double, accent, ink |
| bw | line thickness, px | 0 to 4 in halves |
| ba | line strength, percent of the text colour (the brand colour for `accent`) | 0 to 100 |
| light | where the light comes from | top, topleft, topright, ambient, below |
| hl | brightness of the lit edge, percent | 0 to 100 |
| alpha | how solid the fill is, percent | 10 to 100 |
| blur | blur behind the surface, px | 0 to 40 |
| tex | texture, drawn as an inline SVG | none, grain, paper, dots, lines, grid, brushed |
| texa | texture strength, percent | 0 to 100 |
| layers | how fields and rows inside the card differ from it | same, lighter, darker, sunken, tinted |

Choosing a material also sets how see-through it is, its blur and its texture (Outline only and Soft and pressed also set the edge and depth); each can be changed afterwards. Choosing an edge sets its thickness and strength. The sliders still move them freely.

## What other studios and the page read

`share()` offers `{ surface: { r, rCard, border, borderAlpha, shadow, depth, material, blur, alpha } }`: `r` is the corner of a medium control in px (999 for a pill), `rCard` the card corner, `border` the line width in px, `borderAlpha` 0 to 1, `shadow` the box-shadow of a raised card (outer shadow plus its bright edge), `alpha` 0 to 1.

`scene()` sets `--sc-radius`, `--sc-radius-sm`, `--sc-border`, `--sc-border-a`, `--sc-shadow`, `--sc-card-alpha`, `--sc-blur` and `--sc-texture` on the example page.

## Reach

Review asks how far the change should go: "The shared surface styles" (the card, panel, field and menu styles every screen uses) or "Only the surfaces shown".

## What it warns about

Words that would read below 4.5 to 1 on a see-through surface where something colourful sits behind it; a line around fields too faint to see; a card that blends into the page (no line, almost no shadow, nearly the same colour); and, softly, a texture strong enough to show through words.

## Adding choices later (`MORE`)

Numeric choices take new values inside the ranges above; the shell draws them as tiles like the rest.

```js
'surface.radius': [[20, 'Friendly cards', 'Rounded like this project’s onboarding screens.']],
'surface.depth': [[48, 'Dialog height', 'How far this project’s dialogs rise above the page.']],
'surface.blur': [[14, 'Header glass', 'The blur behind this project’s sticky header.']],
'surface.alpha': [[80, 'Veil', 'Mostly solid, with a hint of what is behind.', { set: { blur: 12 } }]],
'surface.look': [['docs', 'Docs panels', 'Quiet paper cards with a hairline and no shadow.',
  { set: { material: 'paper', radius: 8, depth: 0, edge: 'hairline', bw: 1, ba: 24, tex: 'paper', texa: 40, layers: 'darker' } }]],
```

The kinds (material, shadow, edge, light, tex, layers) are fixed by the drawing code: a new kind is a new look built from them (`surface.look`), not a new material id. Values must sit inside the ranges above. Words follow the usual rules: a plain name, one plain sentence, no jargon. Run `studio.mjs check` after every edit.
