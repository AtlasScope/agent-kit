# Config and scene format

The config is one JSON file. Scene files sit in the same folder or below it.

```json
{
  "project": "Tidewater",
  "source": "src/styles and the pricing page",
  "currentIdea": "Cool ink, white type, one green light. The baseline to beat.",
  "fonts": ["Inter:wght@400;600"],
  "inUse": ["#0B0C12", "#151821", "#39FF88"],
  "fixed": [],
  "roles": [
    { "id": "page", "name": "Page", "group": "On dark", "type": "page", "side": "dark", "value": "#0B0C12",
      "used": "Every app screen's background",
      "tokens": [{ "name": "--background", "file": "src/globals.css", "line": 12, "scope": ".dark", "format": "hsl-channels" }] },
    { "id": "text", "name": "Text", "group": "On dark", "type": "text", "side": "dark", "value": "#FFFFFF",
      "used": "Headings and table rows", "against": [["page", 4.5]] },
    { "id": "action", "name": "Main button", "group": "On dark", "type": "fill", "side": "dark", "value": "#FFFFFF",
      "used": "Start trial", "against": [["page", 3]] },
    { "id": "action-text", "name": "Main button label", "group": "On dark", "type": "on-fill", "side": "dark", "value": "#0B0C12",
      "used": "Words on Start trial", "against": [["action", 4.5]] }
  ],
  "palettes": [
    { "id": "night-water", "name": "Night water", "idea": "Greys pulled toward the estuary photo's navy.",
      "finish": "glass", "tint": [262, 0.03], "roles": { "action": "#8AB4FF" } }
  ],
  "scenes": [{ "name": "Pricing", "file": "scenes/pricing.html", "width": 1100 }]
}
```

That is the shape, cut short. A real config has about 10 to 25 roles (40 at most) and 6 or 7 palettes besides Current, which the builder adds (4 to 12 allowed).

## Fields

| Field | What it is |
|---|---|
| `project` | The product's name. The page title becomes "<name> Palette" |
| `source` | What was read, shown under the title. No home-folder paths |
| `currentIdea` | One line about today's palette |
| `fonts` | Google Fonts the scenes use, with weights |
| `inUse` | The project's real colours, most used first. They become the "In play" swatches |
| `fixed` | Colour literals the scenes may use because they must never change, such as another brand's mark |

### Roles

| Field | What it is |
|---|---|
| `id` | Lower case and hyphens. Never rename it once the user has picks |
| `group` | Heading it sits under, such as "On dark" or "Light pages" |
| `used` | The real places it appears |
| `type` | One of the types below. It sets the useful lightness range and whether families are tints or full hues |
| `side` | `dark` or `light`: the ground this role sits on. A dark button on a white page is `light` |
| `value` | Today's colour as `#RRGGBB`. Flatten transparency onto its background |
| `against` | `[other role, minimum ratio]` pairs. Text 4.5, large text 3, control edges and fills 3, dividers 0 (shown, not required) |
| `tokens` | Where the value lives. One token belongs to one role. See below when one does two jobs |
| `kind` | Optional. `color` gives a normally grey role full hues (a brand-coloured page); `neutral` does the reverse |
| `range` | Optional `[low, high]` OKLCH lightness, 0 to 1. Rarely needed: the type's range already stretches to each palette's colour and follows it from dark to light. A wide range makes coarse steps |

| Type | For | Families |
|---|---|---|
| `page` | The ground of a page | Tints |
| `surface` | Cards, menus, bars, code chips | Tints |
| `line` | Dividers and card edges | Tints |
| `control` | Edges of things you click | Tints |
| `text`, `text2`, `text3` | Main, secondary and faint text. Need a contrast pair | Tints |
| `fill` | Main and destructive buttons | Hues |
| `on-fill` | A label on a fill. Needs a pair against that fill | Hues |
| `accent` | Links, focus, the current item | Hues |
| `signal` | Success, warning, error, starred, live | Hues |

### Tokens

When one token does two jobs, choose by what would go wrong. If the jobs can share a colour (link text and button fill), make one role with both contrast pairs and the type of the commoner job. If they can't (a divider that is also a field edge needing 3:1), give the token to the commoner job, leave the other role's list empty and say the token needs splitting in its "used" line.

`name` and `file` are required. `scope` is the selector, with any media query in front (`.dark`, `@media (prefers-color-scheme: dark) :root`); it defaults to `:root`. `format` is how the value is written now: `hex`, `rgb`, `rgb-channels`, `hsl`, `hsl-channels`, `oklch` or `oklch-channels`. Channels means bare numbers, as in shadcn's `240 10% 4%`. The wrong format breaks the project when the pick is applied.

### Palettes

- `roles` lists only what changes. Everything else comes from Current.
- `tint` is `[hue, chroma]`. On every role with tint families that you didn't list, it replaces hue and chroma and keeps lightness (roles with hue families are left alone), so seven palettes don't mean a hundred hand-written greys. Useful chroma is 0 (pure grey) to 0.04.
- Colours you didn't list are nudged until they pass contrast. Colours you listed that fail come back as `fix` lines.
- `finish` is `built`, `matte`, `depth`, `glass` or `glow`. The user can switch it on any palette.

## Scenes

In the config a scene has `name`, `file`, and optionally `width` and `fixed` (colour literals allowed in that scene only; safer than the top-level list). The preview column is 400 to 780px wide. Give a desktop layout a `width` such as 1100: it is laid out at that width and scaled down, and phones still get the narrow layout.

A scene is an HTML fragment with its own `<style>`. It renders isolated from the workbook and from other scenes.

```html
<style>
  .s { container-type: inline-size; background: var(--c-page); color: var(--c-text); font: 400 13px/1.5 Inter, sans-serif; padding: 20px; }
  .card { background: var(--c-surface); border: 1px solid var(--c-line); border-radius: 12px; padding: 14px; }
  .go { display: inline-block; background: var(--c-action); color: var(--c-action-text); border-radius: 999px; padding: 8px 16px; }
  .row { display: flex; gap: 12px; }
  @container (max-width: 420px) { .row { flex-direction: column; } }
</style>
<div class="s">
  <div class="row"><div class="card" data-part="card">Team plan</div></div>
  <span class="go" data-part="primary">Start trial</span>
</div>
```

- Every colour is `var(--c-<role id>)`, and every role appears in at least one scene. Black or white with alpha, and any colour at 20% or less, are allowed for shadows and highlights; `color-mix()` of role variables is fine.
- Mark the pieces finishes act on: `data-part="card"`, `primary`, `input` (draw it focused; with no focus style in the product, use the accent), `bar` and `status` (a small filled dot). Mark only the ones the product has.
- Use `@container`, not `@media`: the preview is narrower than the window.
- Use `<span>` for links and buttons. No scripts, handlers, forms or remote files. Draw pictures with CSS or inline SVG, or embed a small `data:image`. A gradient built from role variables can stand in for a photo.
- Keep each scene to about a screen's height. The first one shows by default, so make it the most recognisable screen.
