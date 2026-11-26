---
name: studio
description: Use only when the user explicitly invokes /studio or $studio. Opens a live design studio page for a button, a colour palette, typography, or several together: finished looks and every option drawn for real, compare, undo, ask for more, then a proposal sent to chat. Never changes the application until the user approves. Ordinary design requests must not activate it.
disable-model-invocation: true
metadata:
  short-description: Live studio for choosing how buttons, colours and type look
  author: AtlasScope/agent-kit
---

# Button studio

Austin names a project and a button ("the install button", "our checkout button"). He gets one live page: a preview of the button on the left, and on the right a step bar with one step on screen at a time. He picks, presses **Next** (which marks the step done) and moves on; changing an earlier step turns the later finished ones amber so he rechecks them. The preview opens on the kind of device he is using (phone, tablet or computer), at actual size, and can switch to the others; a full-width button fills a phone's width or the project's content column, never the whole preview. Any category can be widened with **Add more choices**, which reaches you. The last step, **Review**, lists every choice with a Change link and ends in **Send to chat**. The page is the deliverable. A written list of recommendations, or a static HTML file with no way to reach you, is a failure.

Everything lives in this skill's folder. `scripts/studio.mjs` (needs only Node) builds the page, serves it from this computer and passes messages between the page and you. In a cloud session the same page is published on claude.ai instead (see **In a cloud session**). The page it builds is one self-contained `index.html` with a `PROJECT` block you fill, a `MORE` block you extend, and an engine you leave alone.

## Decisions that are locked

- The studio keeps its own look. It is a standalone page, not a preview of the project's running site.
- The project only influences it. Existing buttons set the starting point: measured look, colour, wording and choices. No buttons means the generic start, which is designed to look good as is.
- Every choice has a plain-word name and one short plain sentence. No design jargon in names (not "squircle", "satin", "caustics", "oklch"). Hold anything you add to the same bar.
- Every category and every step has **Add more choices**.

## Gates

- Building the studio never changes the application. His spec changes it only when he says to build.
- "Today" is measured, never guessed: from the project's CSS, tokens, components or computed styles in the running page. Say which values you could not measure and what you used.
- The studio can change the project's design system. Never hide, mark or warn about a choice because it differs from how the project's buttons are built today. Write how they are built today into `PROJECT.system`; the spec passes it on as context, with the instruction to update or add to the design system where his choices differ.
- No review pass by another model unless he asks.

## Run it

1. **Find the buttons.** Search the project for the button he named and its siblings. Read the shared button classes and tokens, the page background, the font, the wording (copy files), what happens after pressing, and how the design system builds buttons today. If there are no buttons, skip to step 2 and leave `measured:false`.

2. **Make the studio.** Run `node <skill>/scripts/studio.mjs new <primary checkout>/.artifacts/design/<slug>`. The primary checkout is the parent of `git rev-parse --path-format=absolute --git-common-dir`, never a worktree. Make sure `.artifacts/` is ignored by git. Outside a repo, use `~/Documents/Claude/Projects/<project>/<slug>/`. Then fill only the `PROJECT` block at the top of its `index.html`:
   - `name`, `noun`: "League Complaint Box", "File it button".
   - `measured`: true when `today` holds measured values. The first starting point is then "Today", today's values carry a "now" tag, and a measured value that matches no choice appears as a "Today" choice.
   - `brand`: `[plain name, oklch hue, chroma, lightness]` of today's colour, converted from hex. Wide-gamut screens show oklch slightly brighter than the hex; say so in the handoff.
   - `column`: the width in px of the content column the button sits in on a computer (a form, a hero), measured; a full-width button fills this on Computer and Tablet. Default 440.
   - `pageBg`, `font`, `fontCss`: the page background (adds a "Your page" background and starts there), the button's font stack (adds "Your project's" lettering), and optional `@font-face` CSS. A font file copied into the studio folder is served beside the page.
   - `labels`: today's wording first, then 4 to 6 real alternatives in the product's voice, each `['text', 'why it fits']`. `subs`: optional second lines in the same shape.
   - `action`: `done` (the word after pressing: "Filed", "Copied", "Added"), `copy` (text the preview puts on the clipboard, if the real button copies), `nextLine`, `nextSteps` (`{choice}` becomes the picked option), `cta` (the next step's button).
   - `choices`: when the button can carry a choice (agent, plan, workspace): `noun` and `items` as `[name, colour, letter, one-line description]`. With no items the choosing and list steps drop out on their own.
   - `secondary`: quieter actions that can sit beside it.
   - `system`: how the project's buttons are built today, as plain sentences ("Buttons are flat, with no shadows."). Context for whoever builds the spec, never a limit on the page.
   - `today`: measured values keyed like `DEFAULTS` (list below). Leave a key out to keep the default.
   - `dropSteps`: step ids to leave out (`motion`, `split`, `confirm`, `menu`) when they make no sense for this button.
   - A measured look with no matching choice (for example "shrinks and dims" when pressed): add it to `MORE` with `{setup:true}` and its CSS (see below), and set `today` to its value.

3. **Check.** `node <skill>/scripts/studio.mjs check <studio dir>` must print `OK`.

4. **Open it live.** `node <skill>/scripts/studio.mjs open <studio dir>` prints `URL: ...`. Open that URL in your own browser panel, or give it to him if you have none. The address stays the same across restarts. Confirm the page shows today's button with no console errors, and that the Computer and Phone views both look right.

5. **Listen.** Start `node <skill>/scripts/studio.mjs wait <studio dir>` in the background. It exits with one of:
   - `MORE: {json}`: he asked for more choices. Handle it as below, then start `wait` again.
   - `SPEC:` ... `END SPEC`: his finished choices. Treat it as him pasting it into the chat. Confirm what you received, and build only when he says so.
   - `PAGE ERROR: ...`: your last edit broke the page, or the page hit an error. The page keeps showing the last working version and tells him so. Fix it, run `check`, start `wait` again.
   - `NO_REQUEST` (exit 3) after 30 quiet minutes: start it again while the work is open, or stop.
   Requests he makes while you are not waiting are kept and handed over at the next `wait`. The page shows "Agent listening" while a `wait` runs and "Connected" between them; it hears about your edits and your `wait` at once.

6. **Hand over** in a few plain lines: the link; what today's button measured as; anything you could not measure; which steps you dropped and why. Then how to use it: "Pick something in each step and press Next. Switch Phone, Tablet and Computer under the preview to see it at real size. Use Add more choices anywhere. On Review, press Send to chat."

`node <skill>/scripts/studio.mjs state <dir>` prints his current picks. `stop` ends the server. `refresh` rebuilds an existing studio from the skill's current engine, keeping its `PROJECT`, `MORE`, added CSS and icons; run it after the skill changes.

## In a cloud session

A cloud session runs on a remote machine: `open` would start a server you cannot reach, and `wait` would never hear anything. Publish the same page on claude.ai instead. Steps 1 to 3 are the same; then:

4. **Publish.** `node <skill>/scripts/studio.mjs cloud <studio dir>` writes `<studio dir>/cloud.html` and prints its title and capabilities. Publish it with the Artifact tool: `file_path` that `cloud.html`, `capabilities: {"db": {}}`, icon `button`. It is private to him. Give him the link. The page saves his picks and requests in its own store on claude.ai, where you read them with the ArtifactData tool, and shows "Saved on this page".
5. **Requests.** There is no `wait`. Add more choices and Send to chat copy a message for him to paste in the chat and also save it on the page. When he pastes one, or says to check the studio, read the `requests` collection (`ArtifactData list`). Each document has a `kind`: `more` (the same fields as a `MORE:` request, plus `words`), `spec` (`text` is the spec) or `error`. Handle it as in the local mode, then delete the documents you handled (`batch` delete, each pinned with its `version`).
6. **After an edit**, run `check`, then `cloud` again, and publish the same `cloud.html` path again with no `capabilities` (the stored ones carry over). Open copies update on their own, keep his picks from the page's store, open the step and mark new choices with a green dot.

His picks are the `studio/state` document (`ArtifactData get`, collection `studio`, id `state`): the same snapshot `state` prints locally, under `S`. Fonts load on claude.ai only from Google Fonts; another `fontCss` source falls back to the system face, so say so if the project's face is elsewhere. Never put `cloud.html` in the repo: it lives in the studio folder under `.artifacts/`, like `index.html`.

This skill lives in `~/.claude/skills` on his computer. A cloud session only has it once it is in the repository or a plugin.

## Add more choices

He opens it from a category (the "Add more choices" link beside its name) or a whole step (the link under the step), optionally types what he wants, and presses Send to chat. You receive:

```text
MORE: {"step":"shape","stepName":"Shape and size","control":"shape","controlName":"Shape","wish":"something like a ticket stub","current":"blob","existing":["pill","squircle",...]}
```

`control` is null for a whole-step request; `existing` then lists each category's values. Run `state` if you need his other picks.

Add 2 to 4 choices that fit the wish (or, with no wish, fill a real gap), look clearly different from everything in `existing` and from each other, and work with his current picks. Edit only the studio file:

- In the `MORE` script: `key: [[value, 'Plain name', 'One short plain sentence.', {optional}], ...]`. Colours: `swatch: [['Name', hue, chroma, lightness, 'Sentence.']]`. Optional: `set:{key:value}` changes other values with it; `onlyWith:{material:['glass']}` hides it where it would not show; `setup:true` for project values that are not new.
- A look needs CSS in `<style id="more-css">`: material `.m-NAME`, main movement `.i-NAME` (on the button; its `.fx` child is a clipped layer for effects inside it), light layer `.l-NAME` (on its own clipped layer element; draw with `::before`/`::after`), hover `.h-NAME:hover` (inside `@media (hover:hover)`), press `.p-NAME:active` (use `!important` on transform, as the engine does), icon movement `.if-NAME`, entrance `.e-NAME`, shape `.sh-NAME` (or `set:{rr:...}`), keyboard outline `.f-NAME`, background `.device[data-bg=NAME]` (backgrounds go in `MORE.bg` as `[value, 'Name', 'Sentence']` and appear in the background menu), list style `.menu.NAME`. Animate whole-button movement with `translate`, `scale` or `rotate`, not `transform`, so hover and press still work on top. Use the engine's variables (`--ac`, `--ach`, `--acl`, `--h`, `--r`, `--spd`, `--dp` for shadow) so colour, size and speed follow his picks. The Fine-tune sliders for a material (shadow, shine, blur) only show for built-in materials; a new material should look right without them.
- An icon needs `<symbol id="i-NAME" viewBox="0 0 24 24">` after the `MORE ICONS` comment.
- A new after-press flow or layout needs a function in `MORE_JS.confirm[NAME]` (gets `{btn, done, note, later, reset, burst, S, D}`) or `MORE_JS.split[NAME]` (gets helpers, returns HTML).
- Labels: add to `MORE.label` as `['text','text','why it fits']`.
- New categories are out of scope for this block; if he asks for one, tell him it needs a change to the skill (`src/button/catalogue.js`).

Run `check`, then start `wait` again. Saving the file is enough: the page notices, reloads on its own, keeps every pick and lock, opens the step and marks the new choices with a green dot. Look at the new choices in the browser before saying they are there; a choice that draws the same as an existing one is a dead option, so fix or remove it.

If the page is open without the server (a plain file, or the server stopped), Add more choices and Send to chat copy a message instead and he pastes it to you. Make the same edit; he reloads, and the browser has kept his picks.

## When the spec arrives

The spec is intent, not code. Each line names the plain choice and the engine value, for example `Material: Flat colour (solid)`. `[unchanged]` marks values that are today's. A line starting "The project's buttons today" repeats `PROJECT.system`: where his choices differ from it, the design system changes. Update or add the shared tokens and button styles so the new look is part of the system, not a one-off on this button, and say in plain words what in the system changed. Map each line onto the project's own tokens and components, reconcile with the current source, honour reduced motion, and ship it the way the project ships changes. Never paste studio CSS into the product.

## Traps

- Judge with the preview toolbar: Phone, Tablet and Computer, the project's background, and Less motion, not one view. The label in the preview's corner says the width and whether it is actual size; Review records which views he looked at.
- `today` keys that are not in `DEFAULTS` are ignored, and a value that is not a choice becomes a "Today" choice. Check that the Today starting point reproduces the measured button.
- The preview follows the computer's reduced-motion setting at first; the Less motion switch under the preview turns movement on for judging. The studio's own controls never animate when reduced motion is on.
- Phones have no hover. The Hover step says so; descriptions still explain each choice.
- A prompt or message the real button copies is never displayed in the studio unless the project already shows it.
- An added class must not set `transition` on the button itself (`.p-NAME{transition:...}`): it replaces the built-in fades and every hover and press effect snaps. `check` flags it. Set timing only under `:active` or `:hover`.
- Spinning edges and sweeping light turn a registered angle, `--a` (`@property` in `button.css`). An added effect that spins a `conic-gradient` can use `from var(--a)` with `animation: spin ...`.

## DEFAULTS keys for `today`

`shape` pill, squircle, soft, sharp, blob, leaf, circle · `h` px · `rr` corner px (soft) · `pad` side space as a share of height (.2 to .9) · `width` hug, fill · `material` solid, satin, glass, outline, tint, ink, gborder, chrome, gel, slab, neo, neon, pastel, brutal, bevel, holo, mesh, frost, smoked, dashed · `depth` 0 to 100 · `gloss` 0 to 1 · `rim` 0 to 1 · `blur`, `fa`, `tint` (glass) · `swatch`, `H`, `C`, `L` (default to `brand`) · `cmode` solid, duo, rainbow · `H2` · `tc` auto, dark, white · `idle` none, sheen, breathe, orbit, prism, aurora, bob, sonar, shimmer, dot, sparkle, smoke, blob, beat, scan, caustic, wave, bubbles, underglow, march, glare, jelly, sway, flicker, pan · `idle2` none, sparkle, scan, bubbles, glare, edge · `iconfx` none, nudge, bounce, pulse, spin · `spd` · `entrance` none, fade, up, scale, blur, spring · `hover` none, lift, rise, scale, glow, brighten, spot, shine, tilt, magnet, invert, wobble, nudge, ring · `press` sink, squish, bounce, flash, 3d, ring, ripple, hold · `focus` blue, accent, white, glow · `label` · `sub` · `font` project, ui, round, mono, serif · `case` normal, upper · `wt` 500, 600, 700 · `fs` · `trk` em · `icon` download, arrow, copy, sparkle, plus, bolt, terminal, box, cloud, none · `iconpos` left, right · `tile` none, tile · `isz` · `split` none, menu, inline, agent, switch, pair, segmented, dock, stack, logos, expand · `agent` index · `nagents` · `gap` · `divider` gap, line, none · `confirm` swap, burst, progress, spin, link, morph, page, sheet, toast, banner · `dur` s · `showagents` · `next` none, line, steps · `menuStyle` glass, solid, sheet, grid, pills, command · `mdens` compact, regular, roomy · `mw` · `menuR` · `micons`, `msubs`, `mkeys` · `manim` pop, slide, fade · `mhi` tint, solid, outline · `bg` page, black, light, cool, warm, aurora, sunset, paper, grid, checker

## Changing the skill itself

The engine is built from `src/`, concatenated by `scripts/lib/build.mjs` in the order listed there. Never edit a built `index.html` below the `MORE` block; edit `src/`, then run `refresh` on any open studio.

- `src/studio/`: the parts every studio shares, independent of buttons. `core.js` (helpers, project settings, server link; its header lists what a kind of studio must provide), `controls.js`, `state.js` (saving; the newer of the browser and server copies wins), `frame.js` (device preview), `panel.js` (steps, Review, spec), `connection.js`, `events.js`, `boot.js`, `studio.css`, `body.html`.
- `src/button/`: what makes it a button studio. `catalogue.js` (every step, choice and plain explanation, defaults, starting points), `preview.js` (drawing the button, layouts, after-press flows), `button.css`, `icons.svg`.
- `src/project.js` and `src/more.js`: the blank `PROJECT` and `MORE` blocks a new studio starts with.
- `scripts/lib/server.mjs` (local server), `check.mjs` (what `check` enforces), `build.mjs` (also `cloudPage`, the claude.ai copy). In `src/studio/`, `CLOUD` and `STORE` in `core.js` switch saving and sending to the claude.ai store; nothing else differs between the two modes.

A new kind of studio gets its own folder beside `src/button/` with the same contract, and the build order names it. Keep every choice to a plain name and one plain sentence.

