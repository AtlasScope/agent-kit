# Design skill catalog

Every design skill this library knows, by pack. Generated from the Design Skills Field Guide; update both together. Skills that ship in the design-kit plugin may be namespaced `design-kit:<name>`. `mode` says what a skill does to files: edits, report (reads only), advice, auto (runs inside another skill, never typed).

## Impeccable

The broadest design toolkit. One skill, /impeccable, with about two dozen sub-commands for building, reviewing and refining real UI, on the web and in native iOS and Android apps. It reads PRODUCT.md and DESIGN.md in your project before every task, and checks UI edits automatically with its design detector.

- Best for: Ongoing work in a real project, where every design pass should know your users and brand.
- Skip it for: Throwaway one-off pages, or any project where you have not run init yet.

| Command | What it does | Mode |
|---|---|---|
| `/impeccable` | With nothing after it: reads this project's state and suggests the next command, leading with init if there is no PRODUCT.md. | advice |
| `/impeccable init` | One-time project setup. Interviews you, then writes PRODUCT.md (users, brand, principles) that every other command reads. | edits |
| `/impeccable shape` | Plan the UX and UI before any code. Short interview, then a design brief you confirm. For a new page or a new look it goes on to direction comps: three image mockups to pick from, then a build matched to the one you chose. | advice |
| `/impeccable document` | Writes DESIGN.md from the code you already have: colors, type, spacing, components. | edits |
| `/impeccable extract` | Pulls repeated patterns into shared tokens and components. Use when styles have drifted. | edits |
| `/impeccable critique` | UX review: hierarchy, information architecture, cognitive load, with scoring and persona tests. | report |
| `/impeccable audit` | Technical checks: accessibility, performance, theming, responsive, anti-patterns. Scored P0 to P3. Checks native apps against Apple's and Google's platform rules. | report |
| `/impeccable polish` | Final pass before shipping: alignment, spacing, consistency, small details. | edits |
| `/impeccable bolder` | Makes a safe or bland design more distinctive without breaking usability. | edits |
| `/impeccable quieter` | Calms a loud or overstimulating design. | edits |
| `/impeccable distill` | Removes what is not needed. Declutters. | edits |
| `/impeccable harden` | Makes it production-ready: error states, long text, translations, odd data. | edits |
| `/impeccable onboard` | Designs first-run flows, empty states and activation moments. | edits |
| `/impeccable animate` | Adds purposeful motion and micro-interactions as part of a design pass. | edits |
| `/impeccable colorize` | Adds strategic color to a flat or gray interface. | edits |
| `/impeccable typeset` | Fixes font choice, hierarchy, sizing and readability. | edits |
| `/impeccable layout` | Fixes spacing, rhythm and weak hierarchy. | edits |
| `/impeccable delight` | Adds personality and small memorable touches. | edits |
| `/impeccable overdrive` | Pushes past convention: shaders, spring physics, scroll-driven effects. For wow moments. | edits |
| `/impeccable clarify` | Rewrites confusing UX copy, labels and error messages. | edits |
| `/impeccable adapt` | Makes a design work across screen sizes, devices and platforms, including SwiftUI, Compose, React Native and Flutter apps. | edits |
| `/impeccable optimize` | Finds and fixes slow loading, janky rendering, heavy images and bundles. | edits |
| `/impeccable live` | Pick an element in your running dev server and get HTML and CSS variants hot-swapped in place. | edits |
| `/impeccable generate` | Name an element and a direction; get N variants to cycle through and accept. | edits |
| `/impeccable hooks on|off|status` | Controls the automatic design check that runs after UI file edits. Also takes ignore-rule, ignore-file, ignore-value and reset to quiet a finding you have accepted. | edits |
| `/impeccable doctor` | Reports and repairs drift between PRODUCT.md, DESIGN.md and the installed version. | edits |
| `/impeccable pin <command>` | Creates a standalone shortcut, so /audit works without the /impeccable prefix. Unpin removes it. | edits |

## Impeccable helper agents

Helpers that ship inside Impeccable and run behind the scenes. Impeccable hands each one a single narrow job during a bigger command, so its own long build thread is not the one judging or tidying the work. You never type these.

- Best for: Knowing what is happening when a build pauses for a review, writes DESIGN.md, or turns an image comp into real assets.
- Skip it for: Calling them yourself. They expect files and specs that only an Impeccable run prepares.

| Command | What it does | Mode |
|---|---|---|
| `Finish reviewer` | Fresh eyes on a finished build. Reads the desktop and phone screenshots, the approved comp and the direction Impeccable agreed with you, then returns one verdict (ship, fix, rebuild or recapture the screenshots) and an ordered list of fixes. It edits nothing. | auto |
| `Documenter` | Writes or updates DESIGN.md from what was actually built, not from the plan. If the build drifted from the plan, the build wins. It will not record a banned element as a design rule. | auto |
| `Asset producer` | Turns an approved image comp into clean, reusable image files (a hero picture, an illustration, a texture) at full resolution, with the page text removed and transparency where needed. It copies the comp; it does not invent new art. | auto |
| `Manual edit applier` | In live mode, when you retype text on the page in the browser and click Apply, it finds that exact text in your source files and changes only that. | auto |

## Router

The design-kit router itself.

- Best for: Not knowing which design skill fits the job.
- Skip it for: When you already know the skill you want.

| Command | What it does | Mode |
|---|---|---|
| `/design` | One command for design work. Say what you want; it picks the one right skill or recipe from this guide, says why, and starts it. /design next resumes a recipe. | edits |

## Built into Claude

Skills that come with Claude itself, so they are on every Claude surface without installing anything.

- Best for: Charts, dashboards and stat tiles that read as one system in light and dark.
- Skip it for: Choosing what data to show. It designs the chart, not the analysis.

| Command | What it does | Mode |
|---|---|---|
| `/dataviz` | Picks the right chart form, builds an accessible palette with a validator, and sets marks, axes and tooltips. | edits |

## Wondelai UX design

Book-based design skills from wondelai: Refactoring UI, web typography, usability heuristics, microinteractions, Don Norman's principles, Apple's HIG, retention and habit design. Plain text only; nothing runs.

- Best for: Type choices, visual hierarchy fixes and usability audits grounded in a named method.
- Skip it for: Choosing a page's whole look. Impeccable and Hallmark own that.

| Command | What it does | Mode |
|---|---|---|
| `/web-typography` | Picks and pairs typefaces, sets the type scale, line height and font loading. | edits |
| `/refactoring-ui` | Fixes visual hierarchy, spacing, color and depth using the Refactoring UI method. | edits |
| `/microinteractions` | Designs the small moments: triggers, feedback, loops and modes for buttons, toggles and loading. | edits |
| `/top-design` | Awwwards-style immersive sites: scroll storytelling, parallax, cinematic motion. | edits |
| `/ios-hig-design` | Native iPhone and iPad layouts that follow Apple's Human Interface Guidelines. | edits |
| `/ux-heuristics` | A usability audit against Nielsen's heuristics, with a cognitive walkthrough. | report |
| `/steve-jobs-design-review` | A ruthless simplicity and focus review of a design or feature. | report |
| `/design-everyday-things` | Why something is confusing: affordances, signifiers, feedback, error prevention. | advice |
| `/improve-retention` | Diagnoses why people sign up and drift away, using behavior design. | advice |
| `/hooked-ux` | Designs habit loops: trigger, action, reward, investment. | advice |
| `/lean-ux` | Turns a design debate into a hypothesis and a quick experiment. | advice |

## Color skills

Two color specialists. oklch-skill is short and practical; color-expert is a deep reference of about 200 files on color science and contrast.

- Best for: Building a palette scale, dark mode, fixing contrast, and Tailwind v4 color tokens.
- Skip it for: Choosing a brand's mood from scratch. Start with Impeccable colorize or a studio, then tune here.

| Command | What it does | Mode |
|---|---|---|
| `/oklch-skill` | Converts colors to OKLCH, builds palette scales and dark mode, fixes contrast, writes Tailwind v4 theme scales. | edits |
| `/color-expert` | Color science on tap: APCA and WCAG contrast, palette methods, color names and history. | advice |

## UX writing

Interface copy rules from a staff content designer: errors, empty states, buttons, voice and tone, with concrete length limits.

- Best for: Writing new interface copy from scratch, or a full copy pass on a flow.
- Skip it for: A quick label fix inside a design pass. /impeccable clarify is enough there.

| Command | What it does | Mode |
|---|---|---|
| `/ux-writing` | Writes or edits interface copy for clarity, brevity and tone. | edits |

## Marketing copy

Landing-page and conversion skills from coreyhaines31/marketingskills. Each reads one shared product-marketing file first, so write that once per project.

- Best for: Landing page headlines, value props and calls to action that hold up.
- Skip it for: Prose that is not selling anything. Use the writing skills.

| Command | What it does | Mode |
|---|---|---|
| `/product-marketing` | Interviews you once and writes the product-marketing file the other two read. | edits |
| `/copywriting` | Writes or rewrites page copy. Bans AI tells and asks for claims you can back up. | edits |
| `/cro` | Finds why a page or form does not convert and what to change first. | report |

## SwiftUI Pro

Paul Hudson's rules for modern SwiftUI: views, navigation, data flow, design and accessibility. Plain text only.

- Best for: Reviewing or writing SwiftUI for an iPhone app.
- Skip it for: Web work. Swift language questions go to /write-swift.

| Command | What it does | Mode |
|---|---|---|
| `/swiftui-pro` | Reviews SwiftUI code against modern APIs and best practice. | report |

## Interface Design

Craft-first design for dashboards, admin panels, SaaS apps and tools. Saves your decisions to .interface-design/system.md so spacing, depth and patterns stay the same across sessions.

- Best for: Dashboards, admin screens, tables, settings and other product UI.
- Skip it for: Marketing and landing pages. Use Hallmark or Impeccable for those.

| Command | What it does | Mode |
|---|---|---|
| `/interface-design` | Builds or refines product UI. Suggests a direction, asks you to confirm, builds, then offers to save the system. | edits |
| `/interface-design:design-review` | Strict multi-pass review of craft and hierarchy, with severity scores and an approval bar. Judges first, only rebuilds if you ask. | report |
| `/interface-design:design-deslop` | Fast pass over a branch that strips the tells of AI-made UI: flat hierarchy, identical cards, defaulted type, timid color. | edits |
| `design status / audit / extract` | Plain-language requests it understands: summarize the saved system, check files for drift, or find repeated values to turn into patterns. | report |

## Hallmark

Makes new websites and pages look designed rather than generated. Enforces a fixed quality floor, deals a visual direction so builds do not look alike, and runs a lint before handing back.

- Best for: New landing pages and websites that must not look templated.
- Skip it for: Small tweaks to an existing design. It only touches existing pages when you say redesign.

| Command | What it does | Mode |
|---|---|---|
| `/hallmark <prompt>` | Designs a new page. Asks material, audience, use and tone once, then builds hero first. | edits |
| `/hallmark redesign <path>` | Full redesign of an existing page, keeping content and wiring. | edits |
| `/hallmark audit <path>` | Report only. Checks a page against the Hallmark quality floor. | report |
| `Genre families` | It picks from four looks: atmospheric, editorial, modern-minimal, playful. Name one to steer it. | advice |

## Emil Kowalski skills

Motion, polish and frontend craft from Emil Kowalski. The review, find and improve skills are read-only and do not change code unless you ask.

- Best for: Animation, component polish, worst-case testing and library choices.
- Skip it for: Choosing a whole page's visual direction. Hallmark and Impeccable handle that.

| Command | What it does | Mode |
|---|---|---|
| `/emil-design-eng` | The core philosophy: polish, component design, invisible details. Reviews in a fixed format. | report |
| `/apple-design` | Apple-style fluid, physical interfaces for the web: gestures, springs, sheets, translucency, typography. | edits |
| `/break-ui` | Feeds a component the worst realistic data (long names, emoji, zero items, huge numbers) behind a toggle and reports what broke. | edits |
| `/prototype` | Builds 3 genuinely different versions behind a picker. Add x5 for more. Then riff or keep. | edits |
| `/animate` | Builds an animation in the right order: should it animate, purpose, tool, properties, easing, interruption, reduced motion. | edits |
| `/animate-expo` | Same idea for React Native and Expo: Reanimated, gestures, sheets, haptics. | edits |
| `/animation-vocabulary` | Turns a vague description into the right term for prompting. | advice |
| `/review-animations` | Strict review of motion code against Emil's ten standards. Default is to flag. | report |
| `/find-animation-opportunities` | Read-only sweep for places that should animate, with exact values. Rejects the rest. | report |
| `/improve-animations` | Audits all motion in a codebase and writes plans for other agents. Variants: quick, deep, a focus like performance, plan, execute, reconcile. | report |
| `/animation-performance` | Fixes janky or dropped-frame animation. Composite-only properties, CSS vs JS, will-change. | edits |
| `/pick-ui-library` | Opinionated library picks for numbers, OTP, charts, command menus, drag and drop, toasts, state, styling. | advice |
| `/ask-sonner` | Sonner toast library: setup, promise toasts, styling, and fixes for toasts that do not show. | advice |
| `/mobile-native` | Makes a web app feel native on a phone: tap flashes, 100vh bug, input zoom, notch, pull-to-refresh. | edits |
| `/write-swift` | Modern Swift: Swift 6 concurrency, value types, Swift Testing, ARC and performance. | edits |

## Web Design Guidelines

A pre-ship audit. Fetches Vercel's current Web Interface Guidelines each time and checks your files against them, reporting terse file:line findings.

- Best for: A fast rules checklist (accessibility, forms, focus, motion, copy) before shipping.
- Skip it for: When you are offline, or want taste-level critique rather than rule checks.

| Command | What it does | Mode |
|---|---|---|
| `/web-design-guidelines <file-or-pattern>` | Reviews the files you name for accessibility, UX and interface best practices. | report |

## Anthropic example-skills

Anthropic's reference skills. Call them as example-skills:<name> followed by what you want.

- Best for: Quick themes, art, GIFs, and Playwright tests of a local app.
- Skip it for: Setting the visual direction of production UI. Hallmark and Impeccable are stronger there.

| Command | What it does | Mode |
|---|---|---|
| `example-skills:frontend-design` | Distinctive look for new UI: aesthetic direction, type, avoiding template defaults. | edits |
| `example-skills:theme-factory` | Applies one of 10 preset themes (arctic-frost, ocean-depths, midnight-galaxy, golden-hour and others) or makes a new one. | edits |
| `example-skills:canvas-design` | Original posters and static art as PNG or PDF, from a written design philosophy. | edits |
| `example-skills:brand-guidelines` | Applies Anthropic's own colors and fonts to an artifact. | edits |
| `example-skills:algorithmic-art` | Generative art in p5.js with seeded randomness and tunable parameters. | edits |
| `example-skills:slack-gif-creator` | Animated GIFs sized and validated for Slack. | edits |
| `example-skills:webapp-testing` | Tests a local web app with Playwright: screenshots, console logs, UI behavior. | report |
| `example-skills:web-artifacts-builder` | Multi-component claude.ai artifacts with React, Tailwind and shadcn/ui. Not for simple pages. | edits |

## Fix writing

One command for text you dislike. It works out what kind of text it is, reads the project's voice and vocabulary, picks the right rules from Humanizer, Sepia, Stop Slop or Impeccable clarify, and scores it with slop-guard before and after.

- Best for: Any section of text where you just want it fixed and do not want to pick a skill.
- Skip it for: A whole docs folder at once. Run Vale first to find the worst files.

| Command | What it does | Mode |
|---|---|---|
| `/fix-writing` | Paste the text or point at a file and line range. Everything else is picked for you. | edits |

## Humanizer

Rewrites AI-sounding prose so it reads like a person wrote it, without changing what it says. Based on Wikipedia's list of signs of AI writing.

- Best for: PR descriptions, READMEs, release notes, landing copy and emails that read as machine-made.
- Skip it for: UI labels and error messages (use /impeccable clarify), or whole folders of docs (use Vale to find the problems first).

| Command | What it does | Mode |
|---|---|---|
| `/humanizer` | Strips the tells: not-X-but-Y contrasts, one-line closers, staged openers, forced lists of three, dashes everywhere, inflated claims, sales language, stock AI words, bold labels, filler. | edits |

## Vale

A prose linter for Markdown in a repo, using the ai-tells package (about 140 rules for AI writing patterns).

- Best for: Checking every doc in a repo at once, and stopping new AI-sounding prose from creeping in.
- Skip it for: Rewriting one paragraph by feel. Humanizer is quicker for that.

| Command | What it does | Mode |
|---|---|---|
| `/vale:setup` | Installs Vale, writes .vale.ini, syncs styles and does a first run. Only for a repo with no config yet. | edits |
| `/vale:triage` | Turns a huge first run into a decision per rule: fix, downgrade or switch off. Gives a short ordered plan. | report |
| `/vale:fix` | Runs Vale and fixes error-level alerts, one pull request per file. Leaves warnings and suggestions for you. | edits |
| `/vale:vocab` | Adds your own terms (product names, APIs, jargon) to a vocabulary so spell check stops flagging them. | edits |
| `/vale:ci` | Runs Vale automatically: GitHub Actions, a pre-commit hook or another runner. | edits |
| `vale <path>` | The linter itself, run in a terminal from the repo root. | report |

## Stop Slop

A strict rulebook Claude follows while it writes, so the tells never land. Scores the draft 1 to 10 on directness, rhythm, trust, authenticity and density, and revises below 35 of 50.

- Best for: Writing something new that has to sound human from the first draft: posts, landing copy, bios, emails.
- Skip it for: Technical docs and anything with real uncertainty. It bans all adverbs, em dashes and hedging, which can strip correct caveats. Use Humanizer or Sepia there.

| Command | What it does | Mode |
|---|---|---|
| `/stop-slop` | Writes or rewrites under the rules: no filler openers, no not-X-but-Y, no passive voice, no lists of three, varied sentence length. | edits |

## Sepia

Research-based de-AI writing that fixes the shape of a piece, not just its words. Has separate rules for release notes, PR and issue replies, code-review comments, postmortems, tickets, technical articles and fiction.

- Best for: Professional writing with a known format, where the structure gives it away: release notes, PR replies, incident write-ups.
- Skip it for: A quick one-paragraph cleanup. Humanizer is faster.

| Command | What it does | Mode |
|---|---|---|
| `/sepia:sepia` | Picks the right operation and document rules for you. | edits |
| `/sepia:sepia-review` | Diagnoses the AI tells without changing anything. | report |
| `/sepia:sepia-refactor` | Minimal edits in place. Keeps your structure. | edits |
| `/sepia:sepia-recreate` | Full rewrite from the same facts. | edits |
| `/sepia:sepia-write` | Writes a new piece under the rules for its format. | edits |
| `/sepia:sepia-hemingway` | Fiction in a spare Hemingway voice. | edits |

## slop-guard

A rule-based linter that scores text 0 to 100 for formulaic AI writing. No AI judge, so the same text gets the same score every time.

- Best for: A quick objective check on a draft, a README, or a whole docs folder before you ship it.
- Skip it for: Repo-wide style rules you want enforced on every PR. Vale does that.

| Command | What it does | Mode |
|---|---|---|
| `/slop-guard` | Runs the linter on a file, folder or pasted text and explains the top problems. | report |
| `sg -v <path>` | The linter itself, in a terminal. | report |
