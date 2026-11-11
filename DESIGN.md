---
name: Agent Kit by AtlasScope
description: Ink, white, slate and muted grey on dark surfaces, a cool grey paper set in the light setting, and one orbit photograph, staged as a live scene, on the homepage.
colors:
  ink: "#0B0C12"
  white: "#FFFFFF"
  slate: "#151821"
  muted: "#A3A6AD"
  rule: "#2C2E34"
  rule-control: "#66686F"
  paper: "#F4F5F7"
  paper-raised: "#FFFFFF"
  paper-sunk: "#E8EAEE"
  ink-2: "#2B2F3A"
  muted-light: "#5A5F6B"
  rule-light: "#DCDFE5"
  rule-control-light: "#808693"
  danger: "#B42318"
  danger-dark: "#FF8A75"
  warm: "#F5A524"
  warm-light: "#B45309"
  warm-soft: "#2A2113"
  warm-soft-light: "#FDF1E3"
  hue-investigate: "#4BF0A8"
  hue-database: "#C9E05A"
  hue-thinking: "#BFA8FF"
  hue-engineer-command: "#3FE0F5"
  hue-design-command: "#8CB6FF"
  hue-recipe: "#FF7FB2"
  hue-investigate-light: "#00704A"
  hue-database-light: "#5C6B00"
  hue-thinking-light: "#5A2FC2"
  hue-engineer-command-light: "#006C80"
  hue-design-command-light: "#1849C4"
  hue-recipe-light: "#BF1F5E"
typography:
  display:
    fontFamily: "Montserrat, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 4.2vw + 0.75rem, 5.5rem)"
    fontWeight: 600
    lineHeight: 1.055
    letterSpacing: "-0.02em"
  page-title:
    fontFamily: "Montserrat, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.125rem, 2.8vw + 1rem, 3.25rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.035em"
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
  button: "10px"
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
  measure: "72ch"
  read: "52ch"
  header: "65px"
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
  button-library:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "0 16px"
    height: "40px"
  button-library-solid:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
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
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  card-dark:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.white}"
    rounded: "{rounded.card}"
    padding: "16px"
  panel:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "16px 24px"
---

# Design System: Agent Kit by AtlasScope

## Overview

**Creative North Star: "Monolithic Minimal"**

AtlasScope is the brand. Agent Kit is its first product, and atlasscope.dev is the Agent Kit site. The system is the AtlasScope identity applied to a working tool: a near-black ink ground, white type, one raised slate tone, one muted grey, and nothing else. The name "Monolithic Minimal" is the owner's own reference board (black and white, a lit planet horizon, white pill buttons); it is used here as the working name for the system.

The homepage carries the one image the system allows, a photograph of a planet horizon, sitting under a solid ink header and above a solid ink strip that holds the install command. Everything a visitor acts on (the command and the Copy button) sits on a solid ground, never on the photograph.

The rest of the site is a library, a first-app guide, a few reading pages and an account area. These follow the visitor's light or dark setting. Dark is the brand set. Light is the same system turned over: cool grey paper, white raised panels, ink type and ink buttons. Both sets are neutral and cool, with no warm tint.

The system has no accent hue. Emphasis comes from contrast, from weight, and from the typeface: anything a visitor can type or paste is set in Geist Mono, and that is what marks it as a command.

**Key Characteristics:**
- Four colours on dark surfaces: ink, white, slate, muted. Rules are muted mixed over ink.
- A cool light set for library pages: paper #F4F5F7, white panels, ink type, grey rules.
- The header and the homepage are ink in both the light and the dark setting.
- Montserrat 600 for display, Geist for text, Geist Mono for commands.
- One primary action per view. In the hero it is a white pill; on library pages it is a solid ink (or, in dark, white) button.
- One photograph, used only as the homepage hero backdrop under a solid header.
- The AtlasScope logo is ink or white only, sits on a solid field, and is never scaled.

## Colors

Two neutral sets, one for each setting, plus one warm accent for what the visitor has chosen or kept, six section hues used as dots, and one danger colour used for destructive actions and errors. All tokens live in `site/app/globals.css`.

### Dark set (the brand)
- **Ink** (#0B0C12): the page ground, the header, the install strip, and the text colour on a white button. A neutral near-black, not tinted warm or violet.
- **Slate** (#151821): raised panels on ink: cards, the command field, the search field, the current navigation link, hover fills.
- **White** (#FFFFFF): text, the logo, the primary button, the Copy button, the selected-tab underline and the focus ring.
- **Muted** (#A3A6AD): secondary text: the hero sentence, tab labels, card meta, the tested-with line, footer links. Also the hover fill of a white button.
- **Hairline** (#2C2E34): muted at 22% over ink. Dividers and panel edges.
- **Control border** (#66686F): muted at 60% over ink, which holds 3:1 against ink. Borders of things a visitor operates.

### Light set (library pages)
- **Paper** (#F4F5F7): the page ground.
- **Raised** (#FFFFFF): cards, tiles, panels, the guide's "What you need" and "You should see" panels, collection panels, the search results list.
- **Sunk** (#E8EAEE): open states: an open popover's trigger, the Copy button inside a code block, prompt ids.
- **Ink** (#0B0C12): headings, body emphasis, the solid button, the focus ring, commands.
- **Ink 2** (#2B2F3A): running text, leads, card descriptions.
- **Muted** (#5A5F6B): meta lines, counts, crumbs, footer links. Holds 4.5:1 on paper.
- **Hairline** (#DCDFE5) and **control border** (#808693): the same two roles as in the dark set.

### Warm accent
- **Warm** (#B45309 on light, #F5A524 on dark) with a **warm tint** behind it (#FDF1E3 on light, #2A2113 on dark). In the manner of Vercel and Resend: the site stays black, white and grey, and one warm colour appears only where the visitor has chosen or kept something. That means a starred star and its tinted Starred button, the star on the header's Starred link, a pressed toggle, the copy icon after a copy worked, "Saved" in the Save to menu, a finished step in the first-app guide, and selected text (the warm colour at 30%).
- It is never a background for a section, a headline colour, a link colour or a decoration.

### Danger
- **Danger** (#B42318 on light, #FF8A75 on dark, with white or ink text on it): the Delete collection button, form error messages and the "has a warning" mark on a prompt card. It appears only where something can be lost or has gone wrong.

### Section hues
Six hues mark the six sections of the library. On dark they are mint (#4BF0A8), lime (#C9E05A), violet (#BFA8FF), cyan (#3FE0F5), blue (#8CB6FF) and pink (#FF7FB2); on light, deeper versions that hold contrast on paper: #00704A, #5C6B00, #5A2FC2, #006C80, #1849C4 and #BF1F5E. They are wayfinding, used as a small square dot (10px, 3px corners) beside a section or card title. The homepage does not use them.

### Named Rules
**The Four Colours Rule.** Dark surfaces use ink, white, slate and muted, and nothing else. The two rule colours are muted mixed over ink, not new colours.

**The Cool Paper Rule.** The light set is neutral and cool. Paper, raised white and sunk grey make the surfaces; ink and two greys make the type. No warm paper; the warm accent is a mark, never a surface.

**The One Warm Accent Rule.** There is one accent, the warm colour, and it marks only what the visitor has chosen or kept: starred, copied, saved, done, selected. A command is still marked by Geist Mono and a primary action by the solid button.

**The Ink Everywhere Rule.** The header and the homepage are ink in both the light and the dark setting. They do not follow the visitor's light preference.

**The Dots Only Rule.** The six section hues appear as small dots, plus one hint: a card or tile that belongs to a section takes that hue as its border on hover. They are not fills, resting borders, text colours, card tints or button tints.

**The Danger Only Rule.** The danger colour marks destruction and errors and nothing else. A prompt that changes code is normal, so its card label is marked with a dot in ink-2, not red.

**The Ring Rule.** Keyboard focus is a 2px outline in the focus colour (white on dark, ink on light), 2px off the element.

## Typography

**Display Font:** Montserrat at weight 600 (with Geist, then system sans, as fallback)
**Body Font:** Geist (with system sans as fallback)
**Label/Mono Font:** Geist Mono (with system monospace as fallback)

**Character:** Montserrat 600 is the face of the AtlasScope wordmark, so page headlines share the logo's letter shapes. Geist carries everything that is read, and Geist Mono carries everything that is typed.

### Hierarchy
- **Display** (600, clamp(2.5rem, 4.2vw + 0.75rem, 5.5rem), line-height 1.055, tracking -0.02em): the homepage headline, held to 13 characters a line.
- **Page title** (Montserrat 600, clamp(2.125rem, 2.8vw + 1rem, 3.25rem), line-height 1.05, tracking -0.035em): the h1 on every library, guide, reading and account page.
- **Headline** (Geist 650, clamp(1.25rem, 0.6vw + 1rem, 1.5rem), line-height 1.2, tracking -0.025em): section headings inside a page.
- **Title** (Geist 650, 1.0625rem, line-height 1.3, tracking -0.015em): card, tile, kit-row and panel titles.
- **Lead** (Geist 400, clamp(1.0625rem, 0.4vw + 1rem, 1.1875rem), line-height 1.53): the sentence under a headline, held to 52 characters.
- **Body** (Geist 400, 1rem, line-height 1.55): running text. Paragraphs are held to 52 characters (`--read`); blocks such as code panels, fact lists and notices to 72 (`--measure`).
- **Small** (Geist 400, 0.875rem; 0.8125rem for tab labels, the tested-with line, card meta and kickers): supporting lines.
- **Command** (Geist Mono 400, 0.9375rem, line-height 1.6): install commands, prefixed with a muted "$ ". Inline code, prompt ids and skill commands use Geist Mono at 0.8125rem to 0.875rem.

Headings balance their lines (`text-wrap: balance`); paragraphs and list items avoid single-word last lines (`text-wrap: pretty`). Visible prose uses curly quotes and apostrophes. Text a visitor pastes into an agent keeps straight quotes, because it is input.

### Named Rules
**The Three Faces Rule.** Montserrat 600 for display, Geist for text, Geist Mono for commands. The wordmark is drawn as outlines; never retype it in live Montserrat.

**The No Label Above Rule.** No small label sits above a heading. A headline is the first thing in its block. On detail pages the kicker (kind, group, version, id) sits under the title and lead.

**The One H1 Rule.** Each page has one h1. Headings inside imported skill text are shifted down a level so they never compete with it.

**The Read Before Paste Rule.** A command is never cut off on a phone. Below 720px it wraps and shows in full, so it can be read before it is pasted.

## Layout

The page is a centred container (1280px, growing to 1320px on screens at least 1600px wide and 900px tall) with a gutter of 32px, stepping to 24px below 960px, 16px below 640px and 12px below 352px. Spacing runs on six steps: 8, 12, 16, 24, 40 and 64px.

The header is a solid ink bar, 64px tall plus a 1px hairline, fixed to the top of the window. Below 1024px it becomes two rows with search on its own row (107px); below 640px, three rows (153px). The `--header-h` token holds the current height, and every sticky column and jump target is offset by it, so nothing slides under the header. A "Skip to content" link is the first Tab stop.

### Homepage
The first screen is a live view from orbit, under the solid header (`site/components/LaunchHero.tsx`, `site/components/orbit-gl.ts`, `site/app/launch.css`). It holds four things: the headline (each word in its own mask), one sentence, the Install pill and a "New to coding agents? Start here" text link, hung from the container's left edge and vertically centred. Ink shades the sky side from the left so the text holds contrast.

Scrolling follows one real request into the skill it routes to, on a pinned stage of about three screens (all of it from `site/lib/hero-demo.ts`, which `site/tests/hero-demo.test.mjs` checks against the kit line by line):
1. **Ask.** The message lifts away and a plain input box, belonging to no particular agent, types `/design the dashboard's hierarchy looks amateur`. That is the router's own "Hierarchy looks amateur" row, whose first pick is /refactoring-ui.
2. **Route.** The box dissolves while the sentence resolves above it at full size; /design wires to a refactoring-ui pill and "amateur" lights, since that is why the skill matched. The sentence then rises to the top and stays.
3. **Look.** A card shows SKILL.md's real outline, all fourteen headings with their line ranges. A bar moves down it, pausing on the two sections that match (Visual Hierarchy, which has a Dashboards row, and Common Mistakes, which lists "Looks amateur"), then returns to Visual Hierarchy.
4. **Read.** That section opens as a page quoting its lines by number. A thread runs from "dashboard's" to line 44, the Dashboards row.
5. **Answer.** The page steps back and "Key metric large, context small" rises out of the row to full size, credited to its line, with the row's own example set the way it says: $42,300 large, "vs last month" small.
6. **What it read.** The camera pulls back. A list names SKILL.md (read) and data-visualization.md (opened, because line 210 sends dashboards there), with the other references dimmed as "if needed", and counts only the lines this request uses. On wide screens the opened reference comes forward from a named stack.
7. **End.** "One sentence in. 251 lines read, one reference opened." with an Install pill. Then the stage lets go and the install strip scrolls up under it.

Amber marks the answer (the lit words, the thread, the marked row); cool blue marks a command or a skill. Nothing in the example is invented: if the kit changes, the test names what no longer matches.

The Install pills jump straight to the install strip and move keyboard focus there. On phones the text sits at the top, cards fill the width, the thread runs down the right margin, and the file list carries the pull-back on its own. With reduced motion there is no stage: the first screen over the photograph, then the same example laid flat (the request in its box, the outline beside the section, the answer, the file list and the end), read top to bottom.

Below the strip the homepage closes in three parts. First, what the install adds: the kit rows (see Components). Then three ways into the library (prompts, skills, fix a problem), each with its one-line definition and a link, in three columns divided by hairlines. Then one line crediting the authors. Below 960px the three columns stack.

### Library pages
Sections stack 40px apart inside the container. Each page opens with crumbs, the page title and a lead. Cards sit in auto-filling grids (minimum column 300px for prompt and skill cards, 250px for rows, 180px or 240px for tiles). A prompt's own page is two columns: the prompt text and its notes on the left, and a sticky 340px side column of facts (when to use it, what it returns, when to skip it) on the right.

### Guide pages
The first-app guide has a hub at `/start`: the title and lead beside a "What you need" panel, two tiles for where to begin, the eight steps as a numbered list in two columns, then the five lessons. Each step and lesson page is two columns: the step on the left, and on the right a sticky 260px rail listing every step, with this one highlighted and finished ones ticked. The crumbs say "Step 3 of 8". Below 960px the rail moves under the step.

### Reading pages
About, Privacy and Terms share one layout: title and lead, an optional draft notice, then sections at reading width with a sticky 220px contents list on the right. Below 960px the contents list is hidden.

### Account pages
Sign-in is two columns: why an account helps on the left (the page title and a short list), the sign-in form on the right. Collections is a single column: a form to make a collection, then one panel per collection. Both stack on phones.

Touch screens raise tap targets to 40px or more. Layouts hold from 360px to 2560px wide.

## Elevation & Depth

The hero is a scene, not a stack of panels: depth comes from the planet, the atmosphere and the light, with no box shadows in the first screen. The rest of the homepage is flat too: hairlines and no shadow.

On library pages, depth is mostly tonal: a raised panel with a hairline border on the page ground. Cards and tiles also carry a soft shadow, which reads as a slight lift and no more. Pointer hover on a card, tile or row deepens the shadow. Kit rows, guide lists and the footer are flat, separated by hairlines.

### Shadow Vocabulary
- **Lift, dark** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 1px 2px rgba(0,0,0,.6), 0 8px 20px -10px rgba(0,0,0,.7), 0 24px 40px -24px rgba(0,0,0,.9)`): cards, tiles and rows at rest.
- **Lift raised, dark** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 2px 4px rgba(0,0,0,.6), 0 12px 26px -10px rgba(0,0,0,.8), 0 30px 50px -24px rgba(0,0,0,1)`): hover, and floating layers (search results, popovers).
- **Lift, light** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.8), 0 1px 2px rgba(11,12,18,.06), 0 6px 14px -6px rgba(11,12,18,.08), 0 20px 34px -22px rgba(11,12,18,.18)`): the same roles on paper.
- **Lift raised, light** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.8), 0 2px 4px rgba(11,12,18,.07), 0 10px 22px -8px rgba(11,12,18,.13), 0 28px 44px -24px rgba(11,12,18,.26)`): hover and floating layers on paper.

### Named Rules
**The Solid Ground Rule.** Anything a visitor operates or needs to read exactly (the header, the logo, the install command) sits on a solid colour, never on the photograph.

**The Launch Rule.** The homepage opens once per visit, about three and a half seconds: the planet rises out of black, the sun breaks over the limb, then the headline lifts out of its masks and the sentence and actions follow. Any click, key, wheel or touch skips to the end. Every element's resting state is the final frame, so the text is real and readable from the first paint, and with no script it simply shows. `?replay` in the address plays it again and shows Replay and Play buttons, for tuning.

**The Living Scene Rule.** The scene keeps moving, slowly, whatever the scroll: cloud flow and a slight turn of the planet, a breathing atmosphere and sun, twinkling stars, a craft on a dashed orbit track (faded out on the text side), a camera that follows the pointer a little, and a light sweep across the Install pill every few seconds. Scroll moves only what the example needs, one thing at a time: the planet sinks to a dim horizon and never leaves the frame, and no two lines of text ever overlap. The scene pauses when off screen or in a background tab. With reduced motion set the still photograph shows and nothing moves; without WebGL the photograph still sinks with the scroll.

## Shapes

Two families. Hero actions are full pills (999px): the primary and secondary buttons and the Copy button. The skip link and chips are pills too. Library buttons have 10px corners (8px when small). Everything that holds content is a rectangle with a modest corner: 8px for small controls (the command field, navigation links, rail items), 10px for fields and inputs, 12px for panels, notices and rows, 14px for cards, tiles and collection panels. Section dots are 10px squares with 3px corners.

Borders are 1px throughout: hairline on panels and dividers, control border on things that are operated. No callout carries a coloured side border. The selected agent tab is marked by a 2px underline, not a filled shape.

The AtlasScope symbol and wordmark are sharp: flat cuts, true arcs, nothing rounded. Nothing in the interface imitates or echoes the symbol's shape.

## Components

### Header lockup
The AtlasScope lockup, a hairline divider, then "Agent Kit".
- **Logo:** the full lockup, 159 by 32px, white, drawn as outlines. Below 720px wide it is replaced by the symbol alone.
- **Divider:** 1px wide, 20px tall, control border colour, 14px either side (10px below 720px).
- **Product name:** "Agent Kit" in Geist 500, 0.9375rem, white, set on the logo's baseline.
- **Pixel fit:** the header svg is drawn on the pixel grid by `design/atlasscope/source/export_site.py`: capitals run from 4px to a baseline at 20px, and its top edge sits on a multiple of 4px (16px in the 64px bar, 12px in the two-row header). A second symbol drawing is swapped in at 125% display scaling. Render it at its own width and height.

### Buttons
- **Hero primary:** white fill, ink text, Geist 600 at 1rem, 48px tall, 24px side padding, with an optional 16px line arrow after the label. One per view.
- **Hero secondary:** outlined pill: 1px control border, white text in Geist 500, ink at 60% behind it so the label holds over the photograph.
- **Library button:** raised fill, control border, ink text in Geist 550, 40px tall (34px small), 10px corners. The solid variant (ink on light, white on dark) is the one primary action in a view, such as Next on a guide step.
- **Danger:** danger fill with no border, used only to confirm a delete.
- **Pending:** a button that saves shows its work in its label ("Saving…", "Deleting…") and is disabled until the server answers.
- **Hover / Focus:** hero primary fills muted on hover; secondary fills slate. Library buttons darken their fill. All press down 1px when active. Focus is the ring. Hover applies only where a precise pointer exists.
- **Copy:** a small pill that reads "Copy", or "Copy all" when the install has more than one line, and changes to "Copied" for 1.6 seconds. If the browser blocks the clipboard it reads "Copy blocked: select the text" for 5 seconds. Its accessible name says what it copies ("Copy prompt: …").
- **Header button:** a borderless 34px control with 8px corners, an icon and a label, used for the GitHub link.

### Install strip
The signature component: pick an agent, copy the install command, see what was tested.
- **Agent tabs:** each agent's own mark at 20px in the text colour, then its name at 0.875rem, muted, 24px apart. The selected tab is white with a 2px white underline. Arrow keys, Home and End move between tabs. On phones the six tabs sit two to a row so none is hidden. The marks are the only logos besides AtlasScope's; they are single-colour and never tinted.
- **Command field:** slate fill, hairline border, 8px corners, tall enough for the longest install so the strip does not jump between agents. Each line is in Geist Mono with a muted "$ " in front. Lines wrap between words at every width and are never cut off.
- **What to do next:** a title naming the chosen agent and one muted sentence saying where to paste and what to type to see it work.
- **Tested-with line:** small muted text directly under the command, naming what was tested, the CLI version and the date, or stating plainly that the agent has not been tested and offering the tested command.

### Kit rows
One row per kit between hairlines, used on the homepage, `/kits` and `/skills` (`site/components/KitRows.tsx`). Three columns: the kit's name (a title, linking to the kit, the whole row clickable) with its skill count under it; one muted sentence on what it does; and the commands that start it in Geist Mono. Flat, no panel. Below 960px the sentence and commands go under the name. The kit list and the commands come from `KITS` and `KIT_GUIDE` in `site/lib/site.ts`, and a test fails if they drift from the catalog.

### Navigation and search
- **Links:** Geist 500 at 0.9375rem, muted, 36px tall with 12px side padding and 8px corners. The current section is white, weight 600, on a slate fill. Hover fills slate and turns the text white.
- **Search field:** 40px tall, slate fill, control border, 10px corners, a 16px search icon inside the left edge and a "/" key hint inside the right. On focus it shows the ring.
- **Results:** a raised list under the field. Each result is a real link (title, kind, a two-line description), so it opens in a new tab with a modified click. The list closes when focus leaves the box. The first Escape closes it, a second leaves the box. A hidden live line announces how many results there are.
- **Mobile:** links scroll sideways on their own row; search takes a full row.

### Cards
- **Prompt card:** raised panel, hairline border, 14px corners, 16px padding, Lift. The title links to the prompt and the whole card is clickable. Under the title, a meta line (section dot, group, a danger mark if the prompt has a warning); then up to three lines of description; then a foot with one Copy button. A card that is the best pick for its job has a control-border edge.
- **Skill card:** the same panel. Its title is the job the skill does; under it a line naming the skill (in Geist Mono when it is a command), then a short question-and-answer list.
- **Tiles:** big entry points (180px or 240px minimum), a title, an optional count in Geist Mono, and a line of description. The lead tile in a set has a darker edge.
- **Rows:** symptom links on the Fix a problem page, with a count and an arrow.
- **Section dot:** a 10px square in the section's hue before a title or kicker.

### Guide
- **Step list:** numbered rows between hairlines, two columns when there are more than five. A finished step's number becomes an ink disc with a check mark, and screen readers hear "(done)".
- **Rail:** the step list in small type down the right of a step page, behind a hairline. The current step is on a raised fill in weight 600 with an ink number disc; finished steps are ticked.
- **"What you need":** a raised panel beside the hub's title, a title and a short list with bold lead-ins.
- **"You should see":** a raised panel at the end of each step, its title led by a small ink disc with a check mark.
- **Progress:** "3 of 8 done" and a Continue button beside the step list once a visitor has started. Progress is kept in the visitor's browser only and is marked when they press Next.

### Footer
A hairline, then four columns: the full AtlasScope lockup (kept on phones, where the header shows the symbol alone) with one line on licences, and three link groups (Library, Use it, AtlasScope), each a small title over muted links. Three columns below 960px with the brand across the top; two below 640px.

### Reading pages
`site/components/DocPage.tsx`. The draft notice is a raised panel with a control-border edge and a bold date. Section headings are headlines. Definitions (the words the site uses) are a two-column term list. The contents list is muted links behind a hairline.

### Sign-in
The why-column is the page title over a list with small ink squares as markers. The sign-in form is Clerk's, drawn in the site's own tokens by `site/lib/clerk-appearance.ts`, so it follows the light and dark settings: raised card with a hairline and 14px corners and no shadow, pill buttons, 40px fields. On the first step the card drops Clerk's own title, because the page title already says it, and the header shows no Sign in button on this page.

### Collections
- **Panel:** raised, hairline, 14px corners. The collection's name as a title, a muted line with its size and whether it is shared, and its actions on the right.
- **Actions:** Share (or Stop sharing) is a plain button. Rename and Delete open small popovers in place (a raised panel under the trigger) that close on Escape or an outside click. Delete asks once, with a danger button.
- **Items:** rows between hairlines: the kind, the name as a link, and a small × that asks once before removing the item.
- **Commands:** a shared collection shows its link, and a collection with skills shows the command that installs them, each in a command line with Copy.
- **Empty:** a dashed control-border box with one bold line and one sentence on how to add something.
- **Errors:** a message in the danger colour directly under the form that caused it, saying what to do next. Raw server errors never reach the screen; an ended session goes to sign-in.

### Hero photograph
- **Source:** the supplied 3840 by 2160 orbit photograph. The pixels are used as supplied; the live scene adds light and motion on top (atmosphere, sun, cloud flow) but never regrades or retouches the photograph.
- **Derivatives:** made by `site/scripts/build-hero-images.mjs` as AVIF and WebP at 960, 1440, 1920, 2560 and 3840px wide, plus phone crops at 780 and 1170px. A 24px blurred copy is inlined so the horizon is present before the photograph loads. The live scene uses the 1920 or 2560 WebP as its texture.
- **The limb:** a circle fitted to the photograph (in 1920 by 1080 pixels: centre 1872.8, 5941.6; radius 5280.3). The atmosphere, the sun and the orbit track are placed on it, so they sit on the real horizon.
- **Placement:** homepage hero only, under the solid header. Decorative, with an empty text alternative.

### Named Rules
**The One Primary Rule.** One primary action per view: a white pill in the hero, a solid button on library pages. A second action beside it is outlined. Two primaries never sit side by side.

**The Untouched Logo Rule.** The header logo is pixel-fitted. Never scale it, transform it, or set its size from CSS. The logo is ink or white only: no gradient, glow, outline or tint.

**The One Photograph Rule.** The orbit photograph is the only image in the system. Its pixels are used as supplied, only in the homepage hero, and only under a solid header.

## Do's and Don'ts

### Do:
- **Do** build dark surfaces from ink (#0B0C12), white, slate (#151821) and muted (#A3A6AD) only, with hairlines at #2C2E34 and control borders at #66686F.
- **Do** build light surfaces from paper (#F4F5F7), white, sunk grey (#E8EAEE), ink and the two text greys (#2B2F3A, #5A5F6B), with hairlines at #DCDFE5 and control borders at #808693.
- **Do** keep the header and the homepage ink in both the light and the dark setting.
- **Do** set the header as the AtlasScope lockup, a 1px divider, then "Agent Kit", in that order.
- **Do** set every command and id in Geist Mono; that is what marks it.
- **Do** use one primary action per view and an outlined button for the second.
- **Do** put the install command and the logo on a solid colour.
- **Do** offset sticky columns and jump targets by `--header-h`.
- **Do** hold paragraphs to 52 characters.
- **Do** show a full command on phones, wrapped, so it can be read before it is pasted.
- **Do** name Copy buttons by what they copy, and show a plain message next to a form when it fails.
- **Do** read counts from generated content.

### Don't:
- **Don't** add a second accent, or use the warm colour as a surface, a headline, a link or decoration.
- **Don't** use a section hue as a fill, resting border, text colour or card tint; the six hues are small dots and a hover border.
- **Don't** use the danger colour for anything but destruction and errors.
- **Don't** give a callout a coloured side border.
- **Don't** place the AtlasScope logo on the photograph or on any image.
- **Don't** scale, transform, recolour, outline or shade the header logo, and don't retype the wordmark in live text.
- **Don't** put a small label above a heading.
- **Don't** add a second image, regrade or retouch the orbit photograph, or use it anywhere but the homepage hero.
- **Don't** put two primary buttons in one view.
- **Don't** animate text into place; only the photograph moves, once, on load.
