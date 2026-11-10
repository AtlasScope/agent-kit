---
name: Agent Kit by AtlasScope
description: Ink, white, slate and muted grey, with one orbit photograph on the homepage.
colors:
  ink: "#0B0C12"
  white: "#FFFFFF"
  slate: "#151821"
  muted: "#A3A6AD"
  rule: "#2C2E34"
  rule-control: "#66686F"
  hue-investigate: "#4BF0A8"
  hue-database: "#C9E05A"
  hue-thinking: "#BFA8FF"
  hue-engineer-command: "#3FE0F5"
  hue-design-command: "#8CB6FF"
  hue-recipe: "#FF7FB2"
typography:
  display:
    fontFamily: "Montserrat, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 4.2vw + 0.75rem, 5.5rem)"
    fontWeight: 600
    lineHeight: 1.055
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 0.6vw + 1rem, 1.5rem)"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  lead:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 0.4vw + 1rem, 1.1875rem)"
    fontWeight: 400
    lineHeight: 1.53
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  small:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  command:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  dot: "3px"
  control: "8px"
  field: "10px"
  panel: "12px"
  card: "14px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
  gutter: "32px"
  container: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.ink}"
  button-secondary:
    backgroundColor: "rgba(11, 12, 18, 0.6)"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.slate}"
  copy-button:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "32px"
  copy-button-hover:
    backgroundColor: "{colors.muted}"
  command-field:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.white}"
    typography: "{typography.command}"
    rounded: "{rounded.control}"
    padding: "0 6px 0 16px"
    height: "44px"
  agent-tab:
    textColor: "{colors.muted}"
    padding: "0 0 4px"
  agent-tab-selected:
    textColor: "{colors.white}"
  header:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    height: "64px"
  nav-link:
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  nav-link-current:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.white}"
  search-field:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.white}"
    rounded: "{rounded.field}"
    padding: "0 36px"
    height: "40px"
  card:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.white}"
    rounded: "{rounded.card}"
    padding: "18px 20px"
---

# Design System: Agent Kit by AtlasScope

## Overview

**Creative North Star: "Monolithic Minimal"**

AtlasScope is the brand. Agent Kit is its first product, and atlasscope.dev is the Agent Kit site. The system is the AtlasScope identity applied to a working tool: a near-black ink ground, white type, one raised slate tone, one muted grey, and nothing else. The name "Monolithic Minimal" is the owner's own reference board (black and white, a lit planet horizon, white pill buttons); it is used here as the working name for the system.

The homepage carries the one image the system allows, a photograph of a planet horizon, sitting under a solid ink header and above a solid ink strip that holds the install command. Everything a visitor acts on (the command and the Copy button) sits on a solid ground, never on the photograph. The rest of the site is a library of prompts and skills laid out as slate panels on ink.

The system has no accent hue. Emphasis comes from white against ink, from weight, and from the typeface: anything a visitor can type or paste is set in Geist Mono, and that is what marks it as a command.

**Key Characteristics:**
- Four colours on dark surfaces: ink, white, slate, muted. Rules are muted mixed over ink.
- The header and the homepage are ink in both the light and the dark setting.
- Montserrat 600 for display, Geist for text, Geist Mono for commands.
- One white pill per view for the primary action; the second action is an outlined pill.
- One photograph, used only as the homepage hero backdrop under a solid header.
- The AtlasScope logo is ink or white only, sits on a solid field, and is never scaled.

## Colors

A monochrome palette: one near-black, white, one raised tone and one grey, with two rule colours derived from the grey.

### Primary
- **White** (#FFFFFF): text, the logo, the one primary button per view, the Copy button, the selected-tab underline and the focus ring. White is the only emphasis colour.

### Neutral
- **Ink** (#0B0C12): the page ground on every dark surface, the header, the install strip, and the text colour on a white button. A neutral near-black, not tinted warm or violet.
- **Slate** (#151821): raised panels on ink: cards, the command field, the search field, the current navigation link, hover fills.
- **Muted** (#A3A6AD): secondary text on ink: the hero sentence, tab labels, count labels, the tested-with line, footer text. Also the hover fill of a white button.
- **Hairline** (#2C2E34): muted at 22% over ink. Dividers and panel edges: the line under the header, the line above the install strip, card borders.
- **Control border** (#66686F): muted at 60% over ink, which holds 3:1 against ink. Borders of things a visitor operates: the outlined button, the search field, the divider in the header lockup.

### Section hues
Six hues mark the six sections of the library. On ink they are mint (#4BF0A8), lime (#C9E05A), violet (#BFA8FF), cyan (#3FE0F5), blue (#8CB6FF) and pink (#FF7FB2). They are wayfinding, used as a small square dot (10px, 3px corners) beside a section or card title on library pages. The homepage does not use them.

### Not yet migrated
Light-mode library pages still run on an older warm set: paper #ECEAE4, white cards, warm ink #0B0A08, warm greys #3A362F and #5E594F, rules #D6D1C7 and #B9B3A6, and an amber #8A4B00 used for commands and focus with a soft amber #F6E6CF fill. These are not the system. They are the previous look, still in place in the light setting, and have not been moved to the AtlasScope colours. Do not extend them to new surfaces.

### Named Rules
**The Four Colours Rule.** Dark surfaces use ink, white, slate and muted, and nothing else. The two rule colours are muted mixed over ink, not new colours.

**The No Accent Rule.** There is no accent hue. A command is marked by Geist Mono, a primary action by a white pill, a selection by white text and a white underline.

**The Ink Everywhere Rule.** The header and the homepage are ink in both the light and the dark setting. They do not follow the visitor's light preference.

**The Dots Only Rule.** The six section hues appear only as small dots on library pages. They are not fills, borders, text colours or button tints.

**The White Ring Rule.** Keyboard focus on a dark surface is a 2px white outline, 2px off the element.

## Typography

**Display Font:** Montserrat at weight 600 (with Geist, then system sans, as fallback)
**Body Font:** Geist (with system sans as fallback)
**Label/Mono Font:** Geist Mono (with system monospace as fallback)

**Character:** Montserrat 600 is the face of the AtlasScope wordmark, so page headlines share the logo's letter shapes. Geist carries everything that is read, and Geist Mono carries everything that is typed or counted.

### Hierarchy
- **Display** (600, clamp(2.5rem, 4.2vw + 0.75rem, 5.5rem), line-height 1.055, tracking -0.02em): the homepage headline, held to 13 characters a line. Library page headlines use the same face at clamp(2.125rem, 2.8vw + 1rem, 3.25rem), line-height 1.05.
- **Headline** (Geist 650, clamp(1.25rem, 0.6vw + 1rem, 1.5rem), line-height 1.2, tracking -0.025em): section headings inside a page.
- **Title** (Geist 650, 1.0625rem, line-height 1.3, tracking -0.015em): card and tile titles.
- **Lead** (Geist 400, clamp(1.0625rem, 0.4vw + 1rem, 1.1875rem), line-height 1.53, muted): the sentence under a headline, held to 36.5rem wide.
- **Body** (Geist 400, 1rem, line-height 1.55): running text, held to 72 characters.
- **Small** (Geist 400, 0.875rem; 0.8125rem for tab labels, the tested-with line and card meta): supporting lines.
- **Command** (Geist Mono 400, 0.9375rem, line-height 1.6): install commands, prefixed with a muted "$ ". Inline code and ids use Geist Mono at 0.8125rem.

### Named Rules
**The Three Faces Rule.** Montserrat 600 for display, Geist for text, Geist Mono for commands. The wordmark is drawn as outlines; never retype it in live Montserrat.

**The No Label Above Rule.** No small label sits above a heading. A headline is the first thing in its block.

**The Read Before Paste Rule.** A command is never cut off on a phone. Below 720px it wraps and shows in full, so it can be read before it is pasted.

## Layout

The page is a centred container (1280px, growing to 1320px on screens at least 1600px wide and 900px tall) with a gutter of 32px, stepping to 24px below 960px, 16px below 640px and 12px below 352px. Spacing runs on six steps: 8, 12, 16, 24, 40 and 64px.

The header is a solid ink bar, 64px tall, fixed to the top of the window, with a hairline under it. Below 1024px it becomes two rows with search on its own row; below 640px, three rows (brand, links, search).

The homepage hero is three stacked bands on one left edge, the container's left edge:
1. The solid header.
2. The photograph, full window width, anchored to its bottom edge so the horizon stays in frame. It is clamp(520px, the window height less the header and the strip, 1000px) tall. Headline, sentence, two pills and one line of small print hang from the left edge, 28px apart, vertically centred. Ink is laid over the photograph from the left (solid to 80px past the text edge, clear by 1040px past it) so the text sits in black sky, and a 140px ink fade runs down from the header.
3. A solid ink strip with a hairline above it: agent tabs, the install commands and the tested-with line on the left (up to 720px wide), and what to do next for the chosen agent in a column behind a hairline on the right.

Below 1088px the strip wraps: the command takes a full row, with what to do next under it, and the photograph band sizes to its text. Below 720px the text sits on solid ink at the top and the horizon shows beneath it (ink solid to 44% of the band's height, clear by 82%), the pills go full width, and the strip falls below the first screen; the primary pill jumps to it.

Below the strip the homepage closes with one short band: the three words of the library (prompt, skill, kit), each with its one-line definition and a link, in three columns divided by hairlines, then one line crediting the authors. Below 960px the columns stack.

Library pages stack sections 40px apart inside the container, with cards in auto-filling grids (minimum column 300px for prompt and skill cards, 250px for rows, 180px or 240px for tiles) and text held to 72 characters.

The headline also scales with window height (8.2% of it, 7.2% below 820px tall), and below 820px tall the hero tightens its spacing, so the install command stays on the first screen of a 1280 by 720 or 1366 by 768 laptop. On a phone held sideways the headline runs to two lines and the ink covers the left two thirds of the photograph.

Touch screens raise tap targets to 40px or more. Layouts hold from 360px to 2560px wide.

## Elevation & Depth

The hero is flat. Its three bands are separated by hairlines and by the edge of the photograph, with no shadow anywhere in the first screen.

The rest of the homepage is flat too: hairlines and no shadow.

On library pages, depth is mostly tonal: a slate panel with a hairline border on an ink ground. Cards also carry a soft black shadow with a faint light line along the top edge, which on ink reads as a slight lift and no more. Pointer hover on a tile or row deepens the shadow and raises it 1px.

### Shadow Vocabulary
- **Lift** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 1px 2px rgba(0,0,0,.6), 0 8px 20px -10px rgba(0,0,0,.7), 0 24px 40px -24px rgba(0,0,0,.9)`): cards, tiles, rows and code panels at rest.
- **Lift, raised** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 2px 4px rgba(0,0,0,.6), 0 12px 26px -10px rgba(0,0,0,.8), 0 30px 50px -24px rgba(0,0,0,1)`): hover on tiles and rows, and floating layers (search results, menus).

### Named Rules
**The Solid Ground Rule.** Anything a visitor operates or needs to read exactly (the header, the logo, the install command) sits on solid ink or slate, never on the photograph.

**The One Movement Rule.** The only animation that plays by itself on the homepage is the photograph settling into place on load (1400ms, from 55% opacity and 3.5% oversize). Text is in place from the first frame. With reduced motion set, nothing moves.

## Shapes

Two families. Actions in the hero are full pills (999px): the primary and secondary buttons and the Copy button. Everything that holds content is a rectangle with a modest corner: 8px for small controls (the command field, navigation links, the header button), 10px for the search field, 12px for panels and rows, 14px for cards and tiles. Section dots are 10px squares with 3px corners.

Borders are 1px throughout: hairline on panels and dividers, control border on things that are operated. The selected agent tab is marked by a 2px white underline, not a filled shape.

The AtlasScope symbol and wordmark are sharp: flat cuts, true arcs, nothing rounded. Nothing in the interface imitates or echoes the symbol's shape.

## Components

### Header lockup
The AtlasScope lockup, a hairline divider, then "Agent Kit".
- **Logo:** the full lockup, 159 by 32px, white, drawn as outlines. Below 720px wide it is replaced by the symbol alone.
- **Divider:** 1px wide, 20px tall, control border colour, 14px either side (10px below 720px).
- **Product name:** "Agent Kit" in Geist 500, 0.9375rem, white, set on the logo's baseline.
- **Pixel fit:** the header svg is drawn on the pixel grid by `design/atlasscope/source/export_site.py`: capitals run from 4px to a baseline at 20px, and its top edge sits on a multiple of 4px (16px in the 64px bar, 12px in the two-row header). A second symbol drawing is swapped in at 125% display scaling. Render it at its own width and height.

### Buttons
- **Shape:** full pill (999px) in the hero.
- **Primary:** white fill, ink text, Geist 600 at 1rem, 48px tall, 24px side padding, with an optional 16px line arrow after the label. One per view.
- **Secondary:** outlined pill: 1px control border, white text in Geist 500, ink at 60% behind it so the label holds over the photograph.
- **Hover / Focus:** primary fills muted on hover; secondary fills slate. Both press down 1px when active. Focus is the white ring. Hover applies only where a precise pointer exists.
- **Copy:** a small white pill (32px tall, 14px side padding, Geist 600 at 0.8125rem) at the right end of the command field. Its label reads "Copy", or "Copy all" when the install has more than one line, and changes to "Copied" for 1.6 seconds.
- **Header button:** a borderless 34px control with 8px corners, an icon and a label, used for the GitHub link.

### Install strip
The signature component: pick an agent, copy the install command, see what was tested.
- **Agent tabs:** each agent's own mark at 20px in the text colour, then its name at 0.875rem, muted, 24px apart. The selected tab is white with a 2px white underline. Arrow keys, Home and End move between tabs. On phones the six tabs sit two to a row so none is hidden. The marks are the only logos besides AtlasScope's; they are single-colour and never tinted.
- **Command field:** slate fill, hairline border, 8px corners, tall enough for the longest install so the strip does not jump between agents. Each line is in Geist Mono with a muted "$ " in front. Lines wrap between words at every width and are never cut off.
- **What to do next:** a title naming the chosen agent and one muted sentence saying where to paste and what to type to see it work.
- **Tested-with line:** small muted text directly under the command, naming what was tested, the CLI version and the date, or stating plainly that the agent has not been tested and offering the tested command.

### Navigation
- **Links:** Geist 500 at 0.9375rem, muted, 36px tall with 12px side padding and 8px corners. The current section is white, weight 600, on a slate fill. Hover fills slate and turns the text white.
- **Search field:** 40px tall, slate fill, control border, 10px corners, a 16px search icon inside the left edge and a "/" key hint inside the right. On focus the border turns white with a 3px slate ring.
- **Mobile:** links scroll sideways on their own row; search takes a full row.

### Cards / Containers
- **Corner Style:** 14px for cards and tiles, 12px for rows and panels.
- **Background:** slate on ink.
- **Shadow Strategy:** Lift at rest; raised on hover for tiles and rows. See Elevation & Depth.
- **Border:** 1px hairline.
- **Internal Padding:** 16px for prompt and skill cards, 18px by 20px for tiles, 12px by 16px for rows.
- **Section dot:** a 10px square in the section's hue before the title.

### Hero photograph
- **Source:** the supplied 3840 by 2160 orbit photograph, used as supplied: no retouching, regrading or generated variants.
- **Derivatives:** made by `site/scripts/build-hero-images.mjs` as AVIF and WebP at 960, 1440, 1920, 2560 and 3840px wide. Phones get the middle of the frame cropped to 4:5 at 780 and 1170px wide. A 24px blurred copy is inlined so the horizon is present before the photograph loads.
- **Placement:** homepage hero backdrop only, under the solid header, anchored bottom centre, covered by the ink overlays described in Layout. It is decorative and has an empty text alternative.

### Named Rules
**The One White Pill Rule.** One white primary pill per view. A second action beside it is an outlined pill. Two white pills never sit side by side.

**The Untouched Logo Rule.** The header logo is pixel-fitted. Never scale it, transform it, or set its size from CSS. The logo is ink or white only: no gradient, glow, outline or tint.

**The One Photograph Rule.** The orbit photograph is the only image in the system. It is used as supplied, only as the homepage hero backdrop, and only under a solid header.

## Do's and Don'ts

### Do:
- **Do** build dark surfaces from ink (#0B0C12), white, slate (#151821) and muted (#A3A6AD) only, with hairlines at #2C2E34 and control borders at #66686F.
- **Do** keep the header and the homepage ink in both the light and the dark setting.
- **Do** set the header as the AtlasScope lockup, a 1px divider, then "Agent Kit", in that order.
- **Do** set every command and id in Geist Mono; that is what marks it.
- **Do** use one white pill for the primary action in a view and an outlined pill for the second.
- **Do** put the install command and the logo on solid ink or slate.
- **Do** use a 2px white focus ring on dark surfaces.
- **Do** show a full command on phones, wrapped, so it can be read before it is pasted.
- **Do** read counts from generated content.

### Don't:
- **Don't** add an accent hue, or use amber, on any dark surface.
- **Don't** use a section hue as a fill, border, text colour or button tint; the six hues are small dots on library pages.
- **Don't** place the AtlasScope logo on the photograph or on any image.
- **Don't** scale, transform, recolour, outline or shade the header logo, and don't retype the wordmark in live text.
- **Don't** put a small label above a heading.
- **Don't** add a second image, crop or regrade the orbit photograph for effect, or use it anywhere but the homepage hero.
- **Don't** put two white pills in one view.
- **Don't** treat the warm paper colours on light-mode library pages as the system; they are the earlier look and have not been migrated.
- **Don't** animate text into place; only the photograph moves, once, on load.
