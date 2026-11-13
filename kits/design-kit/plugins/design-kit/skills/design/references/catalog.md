# Design skill catalog

Generated from `library/library.json` by `kits/design-kit/scripts/build_references.mjs`; do not edit by hand.

Every design skill this library knows, by pack. Skills that ship in the design-kit plugin may be namespaced `design-kit:<name>`. `mode` says what a skill does to files: edits, edits after a yes (proposes, then writes once approved), report (reads only), advice, auto (runs inside another skill, never typed).

## Impeccable

The broadest design toolkit. One skill, /impeccable, with about two dozen sub-commands for building, reviewing and refining real UI on the web and in native iOS and Android apps. It reads PRODUCT.md and DESIGN.md in your project before every task, and its design detector checks UI edits automatically.

- Best for: Ongoing work in a real project, where every design pass should know your users and brand.
- Skip it for: Throwaway one-off pages, or any project where you have not run init yet.

| Command | What it does | Mode |
|---|---|---|
| `/impeccable` | Typed alone, it looks at where this project stands and suggests the next command. If there is no PRODUCT.md yet, it suggests init first. | advice |
| `/impeccable init` | One-time setup for a project. It asks you questions, then writes PRODUCT.md (who uses it, the brand, the guiding principles), which every other command reads. | edits |
| `/impeccable shape` | Plans how a page should work and look before any code is written. It asks a few questions and writes a design brief for you to approve. For a new page or a new look, it then makes three image mockups, you pick one, and it builds to match. | advice |
| `/impeccable document` | Writes DESIGN.md by reading the code you already have: colors, fonts, spacing and the building blocks of the interface. | edits |
| `/impeccable extract` | Finds styles that repeat across the app and turns them into shared settings and pieces. Use it when the look has drifted out of sync. | edits |
| `/impeccable critique` | Reviews how easy a screen is to use: what stands out, how things are organized, and how much it asks you to think. Gives scores and tests it from the view of different kinds of users. | report |
| `/impeccable audit` | Runs technical checks: accessibility, speed, light and dark themes, how it fits different screens, and common mistakes. Ranks problems from P0 (worst) to P3. Checks phone apps against Apple's and Google's rules. | report |
| `/impeccable polish` | The last pass before you ship. Fixes alignment, spacing, consistency and small details. | edits |
| `/impeccable bolder` | Makes a safe or bland design stand out more, without making it harder to use. | edits |
| `/impeccable quieter` | Tones down a design that is too loud or busy. | edits |
| `/impeccable distill` | Removes what isn't needed so the screen is less cluttered. | edits |
| `/impeccable harden` | Gets a screen ready for real use: error messages, very long text, other languages and unusual data. | edits |
| `/impeccable onboard` | Designs what new users see first, what empty screens show, and the moments that get people to start using the product. | edits |
| `/impeccable animate` | Adds motion that has a purpose, plus small animated responses to clicks and taps, as part of a design pass. | edits |
| `/impeccable colorize` | Adds color in chosen places to an interface that looks flat or gray. | edits |
| `/impeccable typeset` | Fixes the font choice, which text stands out most, text sizes and how easy it is to read. | edits |
| `/impeccable layout` | Fixes spacing, the visual rhythm of a page, and screens where nothing clearly stands out. | edits |
| `/impeccable delight` | Adds personality and small touches people remember. | edits |
| `/impeccable overdrive` | Goes beyond the usual with advanced graphics, bouncy realistic motion and effects that react as you scroll. For moments meant to impress. | edits |
| `/impeccable clarify` | Rewrites confusing on-screen text, labels and error messages. | edits |
| `/impeccable adapt` | Makes a design work on different screen sizes, devices and platforms, including phone apps built with SwiftUI, Compose, React Native and Flutter. | edits |
| `/impeccable optimize` | Finds and fixes slow loading, choppy scrolling or drawing, large images and too much code sent to the browser. | edits |
| `/impeccable live` | Click an element in the app running on your computer and see different versions of it swapped in right away. | edits |
| `/impeccable generate` | Name an element and the change you want, and get as many versions as you ask for to flip through and pick from. | edits |
| `/impeccable hooks on|off|status` | Turns on or off the design check that runs on its own after you edit interface files, or shows its status. It can also ignore a rule, file or value you have accepted, or reset those choices. | edits |
| `/impeccable doctor` | Finds and fixes places where PRODUCT.md, DESIGN.md and the installed version no longer match. | edits |
| `/impeccable pin <command>` | Makes a shortcut so a command like /audit works without typing /impeccable first. Unpin removes the shortcut. | edits |

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
| `/design` | One command for any design work. Say what you want and it picks the one right skill or recipe from this guide, tells you why, and starts it. /design next picks a recipe back up. | edits |
| `/ios-safari` | Proves how a web app really behaves in Safari on iPhone: records the iOS Simulator during flings, loads, text-size changes, sheets and the keyboard, steps through the frames, then fixes what they show and lists what still needs a real phone. | edits |

## Built into Claude

Skills that come with Claude itself, so they are on every Claude app without installing anything.

- Best for: Charts, dashboards and stat tiles that look like one set in both light and dark mode.
- Skip it for: Choosing what data to show. It designs the chart, not the analysis.

| Command | What it does | Mode |
|---|---|---|
| `/dataviz` | Picks the right kind of chart, builds a color set that works for everyone and checks it with a tool, then sets the shapes, axes and hover labels. | edits |

## Wondelai UX design

Design skills from wondelai based on books and known methods: Refactoring UI, web typography, usability rules of thumb, microinteractions, Don Norman's principles, Apple's design guidelines (HIG), and retention and habit design. Plain text only; nothing runs.

- Best for: Font choices, fixing what stands out on a page, and usability checks based on a named method.
- Skip it for: Choosing a page's whole look. Impeccable and Hallmark own that.

| Command | What it does | Mode |
|---|---|---|
| `/web-typography` | Picks fonts and pairs them, then sets text sizes, line spacing and how fonts load. | edits |
| `/refactoring-ui` | Fixes what stands out, spacing, color and depth using the method from the book Refactoring UI. | edits |
| `/microinteractions` | Designs the small moments, like how buttons, switches and loading indicators react, what sets them off, and how they repeat or change. | edits |
| `/top-design` | Builds showpiece websites like the ones that win Awwwards: stories told as you scroll, layers that move at different speeds, and movie-like motion. | edits |
| `/ios-hig-design` | Designs iPhone and iPad screens that follow Apple's Human Interface Guidelines. | edits |
| `/ux-heuristics` | Checks how easy something is to use against Nielsen's well-known usability rules, and walks through it step by step as a new user would. | report |
| `/steve-jobs-design-review` | A harsh review of a design or feature that pushes for simplicity and focus. | report |
| `/design-everyday-things` | Explains why something is confusing: whether it shows how to use it, gives feedback, and helps people avoid mistakes. | advice |
| `/improve-retention` | Works out why people sign up and then stop coming back, using what is known about how habits and behavior work. | advice |
| `/hooked-ux` | Designs habits people repeat: a prompt, an action, a reward, and something they put in that brings them back. | advice |
| `/lean-ux` | Turns a design argument into a clear guess you can test with a quick experiment. | advice |

## Color skills

Two color specialists. oklch-skill is short and practical; color-expert is a deep reference of about 200 files on color science and contrast.

- Best for: Building a palette scale, dark mode, fixing contrast, and Tailwind v4 color tokens (named color settings).
- Skip it for: Choosing a brand's mood from scratch. Start with Impeccable colorize or a studio, then fine-tune here.

| Command | What it does | Mode |
|---|---|---|
| `/oklch-skill` | Converts colors to OKLCH, a color system, then builds color scales and dark mode, fixes text that is hard to read against its background, and writes Tailwind v4 color settings. | edits |
| `/color-expert` | Answers color questions: contrast checks (APCA and WCAG), ways to build a palette, and color names and history. | advice |

## UX writing

Rules for the words inside an app, from a staff content designer: error messages, empty screens, buttons, voice and tone, with set length limits.

- Best for: Writing new interface copy from scratch, or a full copy pass on a flow.
- Skip it for: A quick label fix inside a design pass. /impeccable clarify is enough there.

| Command | What it does | Mode |
|---|---|---|
| `/ux-writing` | Writes or edits the words in an app so they are clear, short and in the right tone. | edits |

## Marketing copy

Landing-page and sign-up skills from coreyhaines31/marketingskills. Each reads one shared product-marketing file first, so write that once per project.

- Best for: Landing page headlines, value statements and calls to action that hold up.
- Skip it for: Writing that is not selling anything. Use the writing skills.

| Command | What it does | Mode |
|---|---|---|
| `/product-marketing` | Asks you questions once and writes the product-marketing file that /copywriting and /cro both read. | edits |
| `/copywriting` | Writes or rewrites the words on a page. It bans phrases that sound written by AI and asks you to back up every claim. | edits |
| `/cro` | Finds why a page or form doesn't get people to sign up or buy, and what to change first. | report |

## SwiftUI Pro

Paul Hudson's rules for modern SwiftUI: views, navigation, how data moves, design and accessibility. Plain text only.

- Best for: Reviewing or writing SwiftUI for an iPhone app.
- Skip it for: Web work. Swift language questions go to /write-swift.

| Command | What it does | Mode |
|---|---|---|
| `/swiftui-pro` | Reviews SwiftUI code (Apple's app-building toolkit) against current methods and best practice. | report |

## Interface Design

Careful design for dashboards, admin panels, SaaS apps and tools. Saves your decisions to .interface-design/system.md so spacing, depth and patterns stay the same across sessions.

- Best for: Dashboards, admin screens, tables, settings and other product screens.
- Skip it for: Marketing and landing pages. Use Hallmark or Impeccable for those.

| Command | What it does | Mode |
|---|---|---|
| `/interface-design` | Builds or improves app screens. It suggests a direction, asks you to confirm, builds it, then offers to save the design system for reuse. | edits |
| `/interface-design:design-review` | A strict review, in several passes, of a screen's craft and what stands out first, with severity scores and a pass bar. It judges first and rebuilds only if you ask. | report |
| `/interface-design:design-deslop` | A quick pass over a branch that removes signs a UI was made by AI: nothing stands out, identical cards, default fonts, timid color. | edits |
| `design status / audit / extract` | Plain requests it understands: summarize the saved design system, check files for drift from it, or find repeated values worth turning into shared patterns. | report |

## Hallmark

Makes new websites and pages look designed instead of generated. It holds every build to a fixed minimum quality, assigns a visual direction so builds don't all look alike, and runs a check before handing back.

- Best for: New landing pages and websites that must not look templated.
- Skip it for: Small tweaks to an existing design. It only touches existing pages when you say redesign.

| Command | What it does | Mode |
|---|---|---|
| `/hallmark <prompt>` | Designs a new page. It asks once about material, audience, use and tone, then builds the big top section (the hero) first. | edits |
| `/hallmark redesign <path>` | Fully redesigns an existing page while keeping its content and how it is wired up. | edits |
| `/hallmark audit <path>` | Report only. Checks a page against Hallmark's minimum quality bar. | report |
| `Genre families` | It picks from four looks: atmospheric, editorial, modern-minimal, playful. Name one to steer it. | advice |

## Emil Kowalski skills

Motion, polish and frontend craft from Emil Kowalski. The review, find and improve skills only read and do not change code unless you ask.

- Best for: Animation, polishing components, testing worst cases and choosing libraries.
- Skip it for: Choosing a whole page's visual direction. Hallmark and Impeccable handle that.

| Command | What it does | Mode |
|---|---|---|
| `/emil-design-eng` | Emil's core approach to polish, component design and the small details users never notice. Reviews in a fixed format. | report |
| `/apple-design` | Apple-style smooth, physical-feeling web interfaces: gestures, springy motion, slide-up sheets, see-through layers, typography. | edits |
| `/break-ui` | Fills a component with the worst realistic data (long names, emoji, zero items, huge numbers) behind an on/off switch and reports what broke. | edits |
| `/prototype` | Builds 3 truly different versions you can switch between. Add x5 for more. Then try variations or keep one. | edits |
| `/animate` | Builds an animation in order: should it animate, why, which tool, what moves, how it speeds and slows, what happens if interrupted, and a version for people who turn motion off. | edits |
| `/animate-expo` | The same idea for phone apps built with React Native and Expo: Reanimated, gestures, slide-up sheets, haptics (vibration feedback). | edits |
| `/animation-vocabulary` | Turns a vague description of motion into the right term to use in a prompt. | advice |
| `/review-animations` | Strict review of animation code against Emil's ten standards. It flags problems by default. | report |
| `/find-animation-opportunities` | Read-only sweep for places that should animate, with exact settings. It rules out the rest. | report |
| `/improve-animations` | Checks all motion in a codebase and writes plans for other agents to carry out. Variants: quick, deep, a focus like performance, plan, execute, reconcile. | report |
| `/animation-performance` | Fixes animation that stutters or drops frames. Covers properties the browser can animate cheaply, CSS vs JavaScript, and the will-change hint. | edits |
| `/pick-ui-library` | Opinionated library picks for numbers, one-time login codes, charts, command menus, drag and drop, pop-up notices (toasts), app state and styling. | advice |
| `/ask-sonner` | The Sonner pop-up notice (toast) library: setup, notices that track a running task, styling, and fixes for toasts that do not show. | advice |
| `/mobile-native` | Makes a web app feel like an installed app on a phone: tap flashes, the full-screen height bug, inputs that zoom the page, the notch, pull-to-refresh. | edits |
| `/write-swift` | Modern Swift for Apple apps: Swift 6 concurrency (code safely running at the same time), value types, Swift Testing, memory management (ARC) and performance. | edits |

## Motion kit

One command for interface motion, written for Agent Kit. It measures before it judges: a motion inventory from the code and frame-by-frame captures from a real browser. It runs only when you type it.

- Best for: Deciding how a product should move, building one animation properly, and reviewing or fixing existing motion with evidence.
- Skip it for: Layout, color and type problems, and WebGL or 3D showpieces.

| Command | What it does | Mode |
|---|---|---|
| `/motion` | One command for anything that moves. Say what you want and it picks the mode (set up, storyboard, build, review or fix), says which, and starts. Typed alone, it reports how the project moves today and suggests three next steps. | edits |
| `/motion setup` | Reads how the project moves today and proposes one small set of durations, curves and springs, showing which existing values fold into which. After you approve, it writes MOTION.md and the token file. It changes no animations. | edits after a yes |
| `/motion storyboard` | Plans a sequence before any code: each beat with its timing and reason, the total length, the reduced-motion version and what shows if nothing plays. Then waits for your yes. | advice |
| `/motion build` | Builds one animation from a one-line spec: the lightest tool that works, the project's own values, the interrupted case and a reduced-motion version. Then captures it frame by frame to check the result. | edits |
| `/motion review` | Read-only review backed by a code inventory and frame captures. Lists motion to cut first, then what is broken, wrong or rough, then where motion is missing, each with its file and what it should be. | report |
| `/motion fix` | Reproduces motion that stutters, flickers, restarts or feels slow, names the cause with a measurement, makes the smallest change and captures it again. | edits |

## Web Design Guidelines

A check before you ship. It downloads Vercel's current Web Interface Guidelines each time, checks your files against them, and reports short findings with file and line numbers.

- Best for: A fast rules checklist (accessibility, forms, focus, motion, copy) before shipping.
- Skip it for: When you are offline, or want a judgment on taste instead of rule checks.

| Command | What it does | Mode |
|---|---|---|
| `/web-design-guidelines <file-or-pattern>` | Reviews the files you name for accessibility, usability and interface best practices. | report |

## Anthropic example-skills

Anthropic's sample skills. Call them as example-skills:<name> followed by what you want.

- Best for: Quick themes, art, GIFs, and Playwright tests (automated browser clicks) of an app running on your computer.
- Skip it for: Setting the visual direction of real product UI. Hallmark and Impeccable are stronger there.

| Command | What it does | Mode |
|---|---|---|
| `example-skills:frontend-design` | Gives new UI a distinctive look: a visual direction, font choices, and avoiding template defaults. | edits |
| `example-skills:theme-factory` | Applies one of 10 preset themes (arctic-frost, ocean-depths, midnight-galaxy, golden-hour and others) or makes a new one. | edits |
| `example-skills:canvas-design` | Makes original posters and still art as PNG or PDF, starting from a written design philosophy. | edits |
| `example-skills:brand-guidelines` | Applies Anthropic's own colors and fonts to an artifact. | edits |
| `example-skills:algorithmic-art` | Art drawn by code in p5.js, with repeatable randomness and settings you can adjust. | edits |
| `example-skills:slack-gif-creator` | Makes animated GIFs sized and checked to work in Slack. | edits |
| `example-skills:webapp-testing` | Tests a web app running on your own computer with Playwright (a browser robot): screenshots, console logs, how the UI behaves. | report |
| `example-skills:web-artifacts-builder` | Builds claude.ai artifacts with many parts, using React, Tailwind and shadcn/ui. Not for simple pages. | edits |

## Fix writing

One command for text you dislike. It works out what kind of text it is, reads the project's voice and word list, picks the right rules from Humanizer, Sepia, Stop Slop or Impeccable clarify, and scores it with slop-guard before and after.

- Best for: Any section of text you just want fixed without picking a skill.
- Skip it for: A whole docs folder at once. Run Vale first to find the worst files.

| Command | What it does | Mode |
|---|---|---|
| `/fix-writing` | Paste the text or point at a file and line range. It picks the right tools and rules for you. | edits |

## Humanizer

Rewrites AI-sounding writing so it reads like a person wrote it, without changing what it says. Based on Wikipedia's list of signs of AI writing.

- Best for: PR descriptions, READMEs, release notes, landing copy and emails that read as machine-made.
- Skip it for: UI labels and error messages (use /impeccable clarify), or whole folders of docs (use Vale to find the problems first).

| Command | What it does | Mode |
|---|---|---|
| `/humanizer` | Removes signs of AI writing: not-X-but-Y contrasts, one-line closers, staged openers, forced lists of three, dashes everywhere, inflated claims, sales language, stock AI words, bold labels, filler. | edits |

## Vale

A writing checker for Markdown files in a repo, using the ai-tells package (about 140 rules for AI writing patterns).

- Best for: Checking every doc in a repo at once, and stopping new AI-sounding writing from creeping in.
- Skip it for: Rewriting one paragraph by feel. Humanizer is quicker for that.

| Command | What it does | Mode |
|---|---|---|
| `/vale:setup` | Installs Vale (a writing checker), writes .vale.ini, downloads its style rules and does a first run. Only for a repo with no Vale setup yet. | edits |
| `/vale:triage` | Turns a huge first run into a decision for each rule: fix, downgrade or switch off. Gives a short plan in order. | report |
| `/vale:fix` | Runs Vale and fixes the error-level problems, one pull request per file. Leaves warnings and suggestions for you. | edits |
| `/vale:vocab` | Adds your own terms (product names, APIs, jargon) to a word list so spell check stops flagging them. | edits |
| `/vale:ci` | Sets Vale to run automatically: in GitHub Actions, as a check before each commit, or in another runner. | edits |
| `vale <path>` | The Vale checker itself, run in a terminal from the repo's main folder. | report |

## Stop Slop

A strict rulebook Claude follows while it writes, so AI tells never make it in. It scores the draft 1 to 10 on directness, rhythm, trust, authenticity and density, and revises anything under 35 of 50.

- Best for: Writing something new that has to sound human from the first draft: posts, landing copy, bios, emails.
- Skip it for: Technical docs and anything with real uncertainty. It bans all adverbs, em dashes and hedging, which can remove correct warnings. Use Humanizer or Sepia there.

| Command | What it does | Mode |
|---|---|---|
| `/stop-slop` | Writes or rewrites text under its rules: no filler openers, no not-X-but-Y, no passive voice, no lists of three, varied sentence length. | edits |

## Sepia

Research-based de-AI writing that fixes how a piece is built as well as its words. Has separate rules for release notes, PR and issue replies, code-review comments, incident write-ups (postmortems), tickets, technical articles and fiction.

- Best for: Professional writing with a known format, where the structure gives it away: release notes, PR replies, incident write-ups.
- Skip it for: A quick one-paragraph cleanup. Humanizer is faster.

| Command | What it does | Mode |
|---|---|---|
| `/sepia:sepia` | Picks the right operation and document rules for you. | edits |
| `/sepia:sepia-review` | Points out the signs of AI writing without changing anything. | report |
| `/sepia:sepia-refactor` | Makes small edits in place and keeps your structure. | edits |
| `/sepia:sepia-recreate` | Rewrites the whole piece from the same facts. | edits |
| `/sepia:sepia-write` | Writes a new piece under the rules for its format. | edits |
| `/sepia:sepia-hemingway` | Fiction writing in a spare, Hemingway-style voice. | edits |

## slop-guard

A rule-based checker that scores text 0 to 100 for formulaic AI writing. No AI does the judging, so the same text gets the same score every time.

- Best for: A quick, objective check on a draft, a README, or a whole docs folder before you ship it.
- Skip it for: Repo-wide style rules you want enforced on every PR. Vale does that.

| Command | What it does | Mode |
|---|---|---|
| `/slop-guard` | Runs the slop-guard checker on a file, folder or pasted text and explains the top problems. | report |
| `sg -v <path>` | The slop-guard checker itself, run in a terminal. | report |
