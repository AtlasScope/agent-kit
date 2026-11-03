# Situations and overlaps

What the user says, mapped to the usual pick and the alternative. Then how to choose between skills that cover the same job. Generated from the Design Skills Field Guide.

## Start a project

Once per repo, before any design pass. Everything after reads what this writes.

| Situation | Pick | Or |
|---|---|---|
| Teach Claude who the users are and what the brand is | `/impeccable init` |  |
| Write down the design system the code already has | `/impeccable document` |  |
| Styles have drifted into copies of each other | `/impeccable extract` |  |
| Repo docs need a prose linter | `/vale:setup` |  |
| Get a design check after every UI edit | `/impeccable hooks on|off|status` |  |
| Not sure where to start in this project | `/impeccable` |  |

## Plan

Before code. Agree the job of the screen and see options.

| Situation | Pick | Or |
|---|---|---|
| Plan a new screen before writing code | `/impeccable shape` |  |
| See a few real directions before committing | `/prototype` | `/impeccable generate` |
| Choose a library for a task | `/pick-ui-library` |  |
| Don't know the name for an effect | `/animation-vocabulary` |  |
| Settle a design argument with a quick test | `/lean-ux` |  |
| Understand why people stop coming back | `/improve-retention` | `/hooked-ux` |

## Build

Pick the builder by what the thing is.

| Situation | Pick | Or |
|---|---|---|
| A marketing or landing page | `/hallmark <prompt>` | `example-skills:frontend-design` |
| A dashboard, admin screen or tool | `/interface-design` |  |
| First-run flow or empty states | `/impeccable onboard` |  |
| One interaction that has to feel exactly right | `/animate` | `/impeccable animate` |
| Touch, drag, sheets and springs | `/apple-design` |  |
| A native iPhone screen | `/ios-hig-design` | `/swiftui-pro` |
| A chart or dashboard tile | `/dataviz` |  |
| A big multi-view artifact | `example-skills:web-artifacts-builder` |  |
| A real image: hero, illustration, texture | `/image` |  |

## Review

Get a second opinion before changing anything. Most of these only report.

| Situation | Pick | Or |
|---|---|---|
| This page kind of stinks. Tell me why. | `/impeccable critique <page>` |  |
| Rethink it, even if it breaks the design system | `/impeccable critique <page>, ignore DESIGN.md` | `/prototype <page> x3` |
| Review a whole screen's UX | `/impeccable critique` | `/interface-design:design-review` |
| Review one component's polish | `/emil-design-eng` |  |
| Accessibility and best-practice rules | `/web-design-guidelines <file-or-pattern>` | `/impeccable audit` |
| See what breaks with ugly data | `/break-ui` |  |
| Click through the real flow in a browser | `example-skills:webapp-testing` |  |
| Check existing motion | `/review-animations` |  |
| Be brutal about it, then fix the easy things | `/harsh-review` | `/steve-jobs-design-review` |
| A usability audit by the book | `/ux-heuristics` |  |
| Prove it works at every screen size | `/viewport-proof` |  |

## Refine the look

It works, but doesn't look right yet.

| Situation | Pick | Or |
|---|---|---|
| It looks AI-generated | `/interface-design:design-deslop` | `/impeccable bolder` |
| Too busy or cluttered | `/impeccable distill` | `/impeccable quieter` |
| Type feels off | `/impeccable typeset` | `/web-typography` |
| Palette scale, dark mode or contrast | `/oklch-skill` | `/color-expert` |
| Spacing and rhythm feel off | `/impeccable layout` |  |
| Flat and gray | `/impeccable colorize` |  |
| Tune one element live in the running app | `/impeccable live` |  |
| Find where motion would help | `/find-animation-opportunities` |  |
| Add a little personality | `/impeccable delight` |  |
| Buttons and toggles feel dead | `/microinteractions` | `/impeccable animate` |
| Make it cinematic | `/top-design` | `/impeccable overdrive` |
| Hierarchy looks amateur | `/refactoring-ui` | `/impeccable layout` |

## Harden and ship

Edge cases, speed, phones, and the last pass.

| Situation | Pick | Or |
|---|---|---|
| Edge cases, errors, loading and empty states | `/impeccable harden` |  |
| Confusing labels and error messages | `/impeccable clarify` | `/ux-writing` |
| Landing copy that has to convert | `/copywriting` | `/cro` |
| Make a web app feel native on iPhone | `/mobile-native` | `/impeccable adapt` |
| A native iOS or Android app follows the platform rules | `/impeccable audit` | `/impeccable adapt` |
| Slow page or heavy bundle | `/impeccable optimize` |  |
| Animation stutters | `/animation-performance` |  |
| Final pass before shipping | `/impeccable polish` |  |

## Words

READMEs, PR bodies, docs and emails.

| Situation | Pick | Or |
|---|---|---|
| I hate how this text reads. Just fix it. | `/fix-writing` |  |
| Write something new that can't sound like AI | `/stop-slop` | `/sepia:sepia-write` |
| This text sounds like AI wrote it | `/humanizer` | `/sepia:sepia-refactor` |
| Release notes, PR replies or a postmortem | `/sepia:sepia` |  |
| How AI-sounding is this draft, by the numbers? | `/slop-guard` |  |
| Find AI-sounding prose across a repo | `vale <path>` | `/vale:triage` |
| Fix the error-level alerts | `/vale:fix` |  |
| Vale flags a correct product name | `/vale:vocab` |  |
| Lint docs on every pull request | `/vale:ci` |  |

## Which one, when several fit

### Review a built UI

- `/impeccable critique`: UX and hierarchy, scored, persona tests
- `/interface-design:design-review`: strict craft review with an approval bar
- `/emil-design-eng`: component-level polish
- `/hallmark audit <path>`: marketing pages against Hallmark's floor

Pick: Critique for whole-screen UX. Design-review for app UI you want held to a high bar. Emil for a single component. Hallmark audit only for pages Hallmark would build.

### Rule and accessibility checks

- `/web-design-guidelines <path>`: Vercel's live rules, file:line
- `/impeccable audit`: a11y, performance, theming, P0 to P3

Pick: Guidelines for a quick, objective checklist. Audit when you also want performance and theming checked and prioritized.

### Build a new page

- `/hallmark <prompt>`: marketing pages, varied genres
- `/interface-design`: product UI with a saved system
- `example-skills:frontend-design`: lightweight, no project setup
- `/impeccable shape`: project-aware once init has run

Pick: Hallmark for anything public-facing. Interface Design for tools and dashboards. Frontend-design for quick throwaways.

### Animation

- `/animate`: deep build, Emil's decision order
- `/impeccable animate`: motion as part of a design pass
- `/apple-design`: gesture-driven, physical motion

Pick: /animate for one interaction you want exactly right. Impeccable animate for a light pass over a screen. Apple-design when touch and drag are involved.

### Variants to choose from

- `/prototype`: 3+ different versions of a new thing
- `/impeccable generate`: N variants of an existing element
- `/impeccable live`: hot-swapped variants in your dev server

Pick: Prototype when the idea is new. Generate or live when the element exists and you are tuning it.

### Make it less generic

- `/interface-design:design-deslop`: strips AI-made tells
- `/impeccable bolder`: adds a point of view
- `/impeccable delight`: small personality touches

Pick: Deslop first to remove the defaults, then bolder. Delight last, and sparingly.

### Fix AI-sounding writing

- `/fix-writing`: picks the right one of these for you
- `/humanizer`: rewrites one piece of text
- `/stop-slop`: strict rules while writing new text
- `/sepia:sepia`: format-aware: release notes, PR replies, postmortems
- `/slop-guard`: scores only, never edits
- `/vale:fix`: rule-based fixes across a repo
- `/impeccable clarify`: UI copy, labels and errors

Pick: Not sure? /fix-writing chooses. Stop-slop to write clean from the start. Humanizer to fix a draft, especially one with facts. Sepia when the format matters. Slop-guard to measure. Vale across many files. Clarify for words in the interface.

### Be critical about a design

- `/impeccable critique`: scored UX review, fixes nothing
- `/harsh-review`: blunt, evidence-backed, ships small fixes
- `/steve-jobs-design-review`: simplicity and focus, nothing else
- `/ux-heuristics`: usability by Nielsen's rules
- `/interface-design:design-review`: craft bar for app UI

Pick: Critique to understand what is wrong. Harsh review when you want it said bluntly and the easy fixes done. Steve Jobs review for cutting scope. Heuristics for usability. Design-review for dashboards.

### Color and type

- `/impeccable colorize`: adds color in a design pass
- `/oklch-skill`: exact scales, dark mode, contrast
- `/impeccable typeset`: type in a design pass
- `/web-typography`: pairing, scale and font loading in depth

Pick: Impeccable for a pass over a screen. The specialists when you need exact values or a font decision.

### Words in the interface vs on the page

- `/impeccable clarify`: fixes copy inside a design pass
- `/ux-writing`: full microcopy rules: errors, empty states, tone
- `/copywriting`: selling copy on marketing pages
- `/fix-writing`: any prose, picks the right rules

Pick: Clarify for a quick pass. UX writing when the interface copy is the job. Copywriting when the page has to sell. Fix-writing for everything that is not interface or marketing.

### Phones and native apps

- `/impeccable adapt`: changes the layout to fit each size
- `/mobile-native`: web app feel on a phone: taps, notch, 100vh
- `/ios-hig-design`: Apple's patterns for a native app
- `/swiftui-pro`: reviews SwiftUI code
- `/viewport-proof`: proves it works, changes nothing

Pick: Adapt and mobile-native for web on phones. HIG and SwiftUI Pro for a real iPhone app. Viewport proof only to prove the result before shipping.
