# Typography studio

Build with `--modules type` (or `button,type`). It designs the lettering: the faces for headings, text and code, the text size, how much bigger each heading gets, thickness, space between lines and letters, line length, capitals and numbers. It opens on "In a page" and paints the shared example page; the button can follow it ("From Typography").

## What the agent fills in: `PROJECT.type`

```js
type: {
  measured: true,                       // true only when `today` was read from the project's code
  faces: [                              // the project's own faces; they come first in every list
    { id: 'brand', name: 'Acme Sans', stack: '"Acme Sans",system-ui,sans-serif',
      use: 'ht',                        // where it is offered: h headings, t text, c code (default 'ht')
      weights: [400, 700],              // optional: the thicknesses it really has
      css: '@font-face{font-family:"Acme Sans";src:url(...)}' },  // optional; injected, then checked it loaded
  ],
  today: { display: 'brand', body: 'brand', mono: 'sysmono', size: 16, ratio: 1.25, hweight: 700, bweight: 400,
           lh: 1.5, hlh: 1.1, htrack: -0.02, measure: 65, hcase: 'none', num: 'normal' },
  drop: [],                             // group ids to hide: hface tface cface size ratio lines letters length weight caps nums
}
```

Every key is optional. A face in `today` must be a catalogue id or one of `faces`, or it falls back to the built-in face.

## State keys

| key | meaning | values |
|---|---|---|
| display, body, mono | face ids for headings, text, code | see catalogue |
| size | text size, px | 12 to 24 |
| ratio | each size step is the one below times this | 1.067 to 1.618 |
| hweight, bweight | heading and text thickness | 100 to 900 |
| lh, hlh | line height of text, of headings | 1.2 to 2, 0.85 to 1.5 |
| htrack | heading letter spacing, em | -0.06 to 0.15 |
| measure | paragraph max-width, ch | 30 to 110 |
| hcase | heading text-transform | none, uppercase, capitalize |
| num | font-variant-numeric | normal, tabular-nums, oldstyle-nums |

Sizes run from small print (size / ratio) to page title (size x ratio^4).

## Faces

Built in (load nothing, the exact face varies by device): `system`, `rounded`, `humanist`, `geometric`, `narrow`, `bookserif`, `oldstyle`, `fashion`, `slab`, `sysmono`.
From Google Fonts, loaded the first time a drawing needs them: `inter`, `geist`, `manrope`, `dmsans`, `plexsans`, `spacegrotesk`, `sora`, `bricolage`, `nunito`, `instrument`, `playfair`, `fraunces`, `newsreader`, `sourceserif`, `jetbrains`, `plexmono`.
The page checks each one with `document.fonts`; when one does not arrive (offline, blocked) the tiles mark it, the Faces page and the specimen say a stand-in is showing, and Review lists it under "To check".

A new face for one project goes in `PROJECT.type.faces`, not in the engine. A face for every project goes in `FACES` in `src/type/module.js` (with an `ORDER` entry), then `studio.mjs refresh`.

## Adding choices later (`MORE`)

```js
'type.measure': [[58, 'Snug column', 'About 58 letters a line, like this project’s blog.']],
'type.size': [[19, 'Generous', 'One step up for long articles.', { set: { lh: 1.65 } }]],
'type.display': [['brand', 'Acme Sans', 'Your brand face.']],   // the id must also be in PROJECT.type.faces
'type.look': [['docs', 'Docs site', 'Calm serif text with a crisp sans for headings.',
  { set: { display: 'inter', body: 'sourceserif', mono: 'jetbrains', size: 17, ratio: 1.2, lh: 1.65, measure: 68 } }]],
```

Values must sit inside the ranges above. Words follow the usual rules: a plain name, one plain sentence, no jargon. Run `studio.mjs check` after every edit.
