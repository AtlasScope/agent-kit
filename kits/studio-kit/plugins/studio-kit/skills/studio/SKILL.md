---
name: studio
description: Use only when the user explicitly invokes /studio or $studio. Opens a live design studio page for a button, a colour palette, typography, or several together: finished looks and every option drawn for real, compare, undo, ask for more, then a proposal sent to chat. Never changes the application until the user approves. Ordinary design requests must not activate it.
disable-model-invocation: true
metadata:
  short-description: Live studio for choosing how buttons, colours and type look
  author: AtlasScope/agent-kit
---

# Studio

The user names a project and what they want to explore: one thing ("the install button"), several ("our colours and type"), or nothing in particular. They get one live page. On the left a preview: on its own, in an example page with the project's words, pinned versions side by side, or every state at once. On the right, the studios they asked for as tabs, a short list of what can change, and every choice drawn with the real thing rather than named. They pick a finished look or go straight to one property, fine-tune with sliders, undo, pin up to three versions, and ask for things that are not there. **Review** shows what changed, before and after, and sends a proposal to the chat.

The page is the deliverable. A written list of recommendations, or a static file with no way to reach you, is a failure.

`<skill>` below is the folder this file is in (in a Claude Code plugin, `${CLAUDE_PLUGIN_ROOT}/skills/studio`). `scripts/studio.mjs` needs only Node 18 or later. It builds the page, serves it from this computer and passes messages between the page and you. A page is one self-contained `index.html` with a `PROJECT` block you fill, a `MORE` block you extend, and an engine you leave alone.

## Studios

`node <skill>/scripts/studio.mjs list` prints what exists. Today: `button` (shape, material, colour, words, hover and press, movement, choosing an option, after press), `palette` (a whole coordinated set of colours and each role in it) and `type` (typefaces, sizes, spacing). They share one page, one preview and one saved session. Where it makes sense one follows another: the button can take the palette's accent colour and the typography studio's lettering, and stops following the moment the user picks something else.

Build only the studios asked for. "The checkout button" is `button`. "Our colours" is `palette`. "The whole look" is all three.

## Gates

- Building or changing a studio never changes the application. A proposal changes it only after the user says, in the chat, to build it. Pressing Send to chat is not that permission.
- "Today" is measured, never guessed: computed styles in the running page first, then the project's CSS, tokens and components. Record how each value was found in `PROJECT.sources` when it was not measured in a running page. Leave out what you could not find; the page then says "not measured" instead of pretending.
- Never hide, mark or warn about a choice because it differs from how the project is built today. Write how it is built today into `PROJECT.system`; the proposal carries that as context.
- The page only ever warns about real problems (words that cannot be read, a target too small to tap), never about taste.
- No review pass by another model unless the user asks.

## Run it

1. **Read the project.** For each studio asked for, find what exists: the component and its siblings, shared classes and tokens, the page background, fonts, the real words (headline, a paragraph, link names, field labels, list rows), what happens after pressing, and how the design system builds these today. No existing design means `measured:false` and the clean start, which is made to look good as it is.

2. **Make the studio.** `node <skill>/scripts/studio.mjs new <primary checkout>/.artifacts/design/<slug> --modules button,palette,type` (list only the ones wanted). The primary checkout is the parent of `git rev-parse --path-format=absolute --git-common-dir`, never a worktree. Make sure `.artifacts/` is ignored by git. Outside a repository use a `studio/<slug>` folder in the user's documents. Then fill only the `PROJECT` block at the top of its `index.html`:
   - `id`: a steady id such as `acme/checkout-button`. `name`: the project. `noun`: what the button is called ("install button").
   - `measured`: true when `today` holds found values. The first look is then "Today" and today's choices carry a "now" tag.
   - `brand`: `[plain name, oklch hue, chroma, lightness]` of today's button colour, converted from hex.
   - `column`: width in px of the content column the button sits in on a computer. `pageBg`, `font`, `fontCss`: the page background, the button's font stack, and optional `@font-face` or `@import` CSS so that font loads. A font file copied into the studio folder is served beside the page.
   - `labels`: today's wording first, then 4 to 6 real alternatives in the product's voice, each `['text', 'why it fits']`. `subs`: optional second lines.
   - `action`: `done` (the word after pressing), `copy` (text the preview copies, only if the real button copies), `nextLine`, `nextSteps`, `cta`.
   - `choices`: when the button carries a choice (agent, plan, workspace): `noun` and `items` as `[name, colour, letter, description]`. With no items those parts drop out. `secondary`: quieter actions beside it.
   - `system`: how the project builds this today, as plain sentences. `today`: found values keyed like `DEFAULTS` (list at the end). `sources`: per key, how it was found. `dropSteps`: group ids that make no sense here (`motion`, `split`, `confirm`, `menu`).
   - `context`: the project's own words for the example page: `eyebrow`, `headline`, `body`, `links`, `secondary`, `field`, `placeholder`, `hint`, `rows` as `[title, detail, tag]`, `code`. Without them the page shows stand-in words and says so.
   - `palette` and `type`: read `references/palette.md` or `references/type.md` first when that studio is in the page.
   - A found value with no matching choice: add it to `MORE` with `{setup:true}` and its CSS, and set `today` to it.

3. **Check.** `node <skill>/scripts/studio.mjs check <dir>` must print `OK`.

4. **Open it.** `node <skill>/scripts/studio.mjs open <dir>` prints `URL: ...`; add `--at button/material` or `--at palette` to open straight where the user pointed. Open it in your own browser panel, or give the link if you have none. The address stays the same across restarts. Confirm the first look reproduces today's design, there are no console errors, and the Computer and Phone views both look right. If you can run JavaScript in the page, `studioCheck()` lists choices that draw exactly like another; fix or remove any you added.

5. **Listen.** Start `node <skill>/scripts/studio.mjs wait <dir>` in the background. It exits with one of:
   - `MORE: {json}`: a request for more choices. Handle it as below, then start `wait` again.
   - `MODULE: name`: the user wants another studio in the workspace. Read the project for it, run `studio.mjs add <dir> <name>`, fill its part of `PROJECT`, run `check`, start `wait` again. The page reloads on its own and keeps every pick.
   - `SPEC:` ... `END SPEC`: a proposal. Treat it as the user pasting it into the chat. Say what you received and what it would touch. Build only when they say so.
   - `PAGE ERROR: ...`: your last edit broke the page, or the page hit an error. The page keeps showing the last working version. Fix it, run `check`, start `wait` again.
   - `NO_REQUEST` (exit 3) after 30 quiet minutes: start it again while the work is open, or stop.
   Requests made while you are not waiting are kept and handed over at the next `wait`. The page says "Agent listening" only while a `wait` runs, and says how many requests are waiting otherwise. If the user says "check the studio", run `wait`.

6. **Hand over** in a few plain lines: the link; what today's design was found to be and how; what you could not find; what you left out and why. Then: "Pick a look or open any part on the right. Pin versions to compare them. Ask for anything that is not there. Review sends me a proposal; I build nothing until you tell me to."

`state <dir>` prints the current picks, pins and where the user is. `stop` ends the server. `refresh` rebuilds an existing studio from the skill's current engine, keeping its `PROJECT`, `MORE`, added CSS and icons.

## When they ask for more

```text
MORE: {"id":"r1","module":"button","step":"material","stepName":"Material","control":"material","controlName":"Material","wish":"brushed metal, like a laptop","intent":"","current":"satin","existing":["solid","satin",...],"pinned":["A · Clear glass"]}
```

`control` is null when the request is about a whole group, and `step` is `looks` when it is about finished looks. `intent` is `like` (more in the spirit of the current one), `different` (unlike everything there) or `what` (what else could change that the studio does not offer). Run `state` for the other picks.

Add 2 to 4 choices that fit, look clearly different from everything in `existing` and from each other, and work with the current picks. Edit only the studio's `index.html`:

- In `MORE`: `key: [[value, 'Plain name', 'One short plain sentence.', {optional}], ...]`. Button keys are bare (`material`) or `button.material`; the others are `palette.<key>` and `type.<key>` (their references say what can be added). Colours: `swatch: [['Name', hue, chroma, lightness, 'Sentence.']]`. A whole look: `look: [['id', 'Name', 'Sentence.', {set:{...}}]]`. Optional: `set:{key:value}` brings other values with it; `onlyWith:{material:['glass']}` hides it where it would not show; `setup:true` for project values that are not new.
- A button choice needs CSS in `<style id="more-css">`: material `.m-NAME`, main movement `.i-NAME` (its `.fx` child is a clipped layer), light layer `.l-NAME`, hover `.h-NAME:hover` (inside `@media (hover:hover)`), press `.p-NAME:active` (use `!important` on transform), icon movement `.if-NAME`, entrance `.e-NAME`, shape `.sh-NAME` (or `set:{rr:...}`), keyboard outline `.f-NAME`, background `.device[data-bg=NAME]` (listed in `MORE.bg`), list style `.menu.NAME`. Animate whole-button movement with `translate`, `scale` or `rotate`, not `transform`. Use the engine's variables (`--ac`, `--ach`, `--acl`, `--h`, `--r`, `--spd`, `--dp`, `--on`) so colour, size and speed follow the picks.
- An icon needs `<symbol id="i-NAME" viewBox="0 0 24 24">` after the `MORE ICONS` comment. A new after-press flow or layout needs a function in `MORE_JS.confirm[NAME]` or `MORE_JS.split[NAME]`.
- Every name is plain and every sentence short. No design jargon in anything the user reads.
- A new group of controls, or a new studio, is a change to the skill (`src/`), not to a page. Say so and offer it.

Run `check`, then start `wait` again. Saving the file is enough: the page notices, reloads, keeps every pick, pin and undo step, opens where the new choices are and marks them with a green dot. Look at them in the browser before saying they are there.

If the page is open without the server, its buttons copy a message instead and the user pastes it to you. Make the same edit; they reload, and the browser has kept their picks.

## When a proposal arrives

It is intent, not code. It names the reach the user chose: **only this one**, **every one like it**, or **the design system**. Honour it: do not widen a one-place change into the shared styles, and do not special-case one button when they chose the system. Each line gives the plain choice and the engine value; `[unchanged]` marks today's values; "starting value, not measured" marks a before-value that was never found in the project, so check it in the source rather than trusting it. "To check" lists real problems the page saw; raise them. Map every line onto the project's own tokens and components, reconcile with the current source and any uncommitted work, honour reduced motion, and ship it the way the project ships changes. Never paste studio CSS into the product. Say in plain words what in the system changed.

## In a cloud session

A remote machine's local server is out of the user's reach. Steps 1 to 3 are the same; then `node <skill>/scripts/studio.mjs cloud <dir>` writes `<dir>/cloud.html`. Publish it with the Artifact tool (capabilities `{"db": {}}`); it is private to the user. There is no `wait`: the page saves picks and requests in its own store and copies a message to paste. When the user pastes one or says "check the studio", read the `requests` collection (each has `kind`: `more`, `module`, `spec` or `error`), handle it, delete what you handled, run `check` and `cloud` again and publish the same path. Fonts load there only from Google Fonts. This path has not been proven end to end; if publishing or the store is not available, give the user `index.html` to open as a file, which works offline with copy and paste.

## Traps

- Judge with the preview's own controls: Phone, Tablet and Computer, the project's background, In a page, and Less motion. Review records which the user looked at.
- `today` keys that are not in `DEFAULTS` are ignored, and a value that is not a choice becomes a "Today" choice. Check that the first look reproduces the real design.
- An added class must not set `transition` on the button itself; it replaces the built-in fades. `check` flags it.
- Spinning edges and sweeping light turn a registered angle, `--a`; an added effect can use `from var(--a)` with `animation: spin ...`.
- The example page is an example. Do not present it as the real product, and do not put anything in `context` that is private.
- Text the real button copies is never shown in the studio unless the project already shows it.

## DEFAULTS keys for the button's `today`

`shape` pill, squircle, soft, sharp, blob, leaf, circle · `h` px · `rr` corner px (soft) · `pad` side space as a share of height (.2 to .9) · `width` hug, fill · `material` solid, satin, glass, outline, tint, ink, gborder, chrome, gel, slab, neo, neon, pastel, brutal, bevel, holo, mesh, frost, smoked, dashed · `depth` 0 to 100 · `gloss` 0 to 1 · `rim` 0 to 1 · `blur`, `fa`, `tint` (glass) · `swatch`, `H`, `C`, `L` (default to `brand`) · `cmode` solid, duo, rainbow · `H2` · `tc` auto, dark, white · `idle` none, sheen, breathe, orbit, prism, aurora, bob, sonar, shimmer, dot, sparkle, smoke, blob, beat, scan, caustic, wave, bubbles, underglow, march, glare, jelly, sway, flicker, pan · `idle2` none, sparkle, scan, bubbles, glare, edge · `iconfx` none, nudge, bounce, pulse, spin · `spd` · `entrance` none, fade, up, scale, blur, spring · `hover` none, lift, rise, scale, glow, brighten, spot, shine, tilt, magnet, invert, wobble, nudge, ring · `press` sink, squish, bounce, flash, 3d, ring, ripple, hold · `focus` blue, accent, white, glow · `label` · `sub` · `font` project, ui, round, mono, serif · `case` normal, upper · `wt` 500, 600, 700 · `fs` · `trk` em · `icon` download, arrow, copy, sparkle, plus, bolt, terminal, box, cloud, none · `iconpos` left, right · `tile` none, tile · `isz` · `split` none, menu, inline, agent, switch, pair, segmented, dock, stack, logos, expand · `agent` index · `nagents` · `gap` · `divider` gap, line, none · `confirm` swap, burst, progress, spin, link, morph, page, sheet, toast, banner · `dur` s · `showagents` · `next` none, line, steps · `menuStyle` glass, solid, sheet, grid, pills, command · `mdens` compact, regular, roomy · `mw` · `menuR` · `micons`, `msubs`, `mkeys` · `manim` pop, slide, fade · `mhi` tint, solid, outline

## Changing the skill itself

The engine is built from `src/` by `scripts/lib/build.mjs`. Never edit a built `index.html` below the `MORE` block; edit `src/`, then run `refresh` on any open studio.

- `src/studio/`: the shell every studio shares. `core.js` opens with the contract a studio module meets. `controls.js`, `state.js` (picks, history, pins, saving), `scene.js` and `scene.css` (the example page and the properties modules paint it with), `frame.js` (the stage and its views), `panel.js` (navigator, tiles, Looks, Review, the proposal), `connection.js`, `events.js`, `boot.js`, `colour.mjs` (Palette Builder's colour maths, kept identical to its `palette.mjs`).
- `src/<name>/`: one studio. `files.json` names its CSS and JS and its place in the tab order; nothing else needs to know it exists. A new studio is a new folder that meets the contract: a representative drawing, finished looks, the few decisions that matter, plain names, real warnings.
- `scripts/lib/server.mjs` (loopback only, keyed, last good page kept), `check.mjs`, `build.mjs` (also the claude.ai copy).
