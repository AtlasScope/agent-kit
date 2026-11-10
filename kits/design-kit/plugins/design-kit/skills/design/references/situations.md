# Situations and overlaps

Generated from `library/library.json` by `kits/design-kit/scripts/build_references.mjs`; do not edit by hand.

What the user says, mapped to the usual pick and the alternative. Then how to choose between skills that cover the same job.

## Start a project

Do these once per project, before any design work. Everything later reads what they write.

| Situation | Pick | Or |
|---|---|---|
| Teach Claude who the users are and what the brand is | `/impeccable init` |  |
| Write down the design system the code already has | `/impeccable document` |  |
| Styles have drifted into copies of each other | `/impeccable extract` |  |
| Repo docs need a prose linter | `/vale:setup` |  |
| Get a design check after every UI edit | `/impeccable hooks on|off|status` |  |
| Not sure where to start in this project | `/impeccable` |  |

## Plan

Before any code. Agree what the screen is for and look at a few options.

| Situation | Pick | Or |
|---|---|---|
| Plan a new screen before writing code | `/impeccable shape` |  |
| See a few real directions before committing | `/prototype` | `/impeccable generate` |
| Choose a library for a task | `/pick-ui-library` |  |
| Don't know the name for an effect | `/animation-vocabulary` |  |
| Settle a design argument with a quick test | `/lean-ux` |  |
| Understand why people stop coming back | `/improve-retention` | `/hooked-ux` |

## Build

Pick the builder that matches what you are making.

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

Get a second opinion before changing anything. Most of these only report back.

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

It works, but it doesn't look right yet.

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

Odd cases, speed, phones, and the final pass.

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

READMEs, pull request descriptions, docs and emails.

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

- `/impeccable critique`: Scores the whole screen's usability and layout, and tests it as different kinds of users
- `/interface-design:design-review`: A strict quality review with a pass-or-fail bar
- `/emil-design-eng`: Fine polish on one component
- `/hallmark audit <path>`: Checks marketing pages against Hallmark's minimum standard

Pick: Critique for a whole screen. Design-review for app screens you want held to a high bar. Emil for one component. Hallmark audit only for pages Hallmark would build.

### Rule and accessibility checks

- `/web-design-guidelines <path>`: Vercel's current rule list, with the file and line for each problem
- `/impeccable audit`: Accessibility, speed and light and dark themes, ranked from most to least urgent

Pick: Guidelines for a quick checklist with clear answers. Audit when you also want speed and themes checked and ranked.

### Build a new page

- `/hallmark <prompt>`: Marketing pages in many different styles
- `/interface-design`: App screens, saving the design rules for next time
- `example-skills:frontend-design`: Quick and light, nothing to set up first
- `/impeccable shape`: Knows your project once you have run init

Pick: Hallmark for anything the public will see. Interface Design for tools and dashboards. Frontend-design for quick throwaways.

### Animation

- `/animate`: Builds one animation carefully, following Emil Kowalski's order of decisions
- `/impeccable animate`: Motion as part of a broader design pass
- `/apple-design`: Motion that follows your finger: swipes, drags and springs

Pick: /animate for one interaction you want exactly right. Impeccable animate for a light pass over a screen. Apple-design when touch and drag are involved.

### Variants to choose from

- `/prototype`: Three or more different versions of something new
- `/impeccable generate`: Several versions of something that already exists
- `/impeccable live`: Swaps versions in live while your app runs

Pick: Prototype when the idea is new. Generate or live when the thing exists and you are fine-tuning it.

### Make it less generic

- `/interface-design:design-deslop`: Removes the signs that AI made it
- `/impeccable bolder`: Gives it a clear point of view
- `/impeccable delight`: Adds small touches of personality

Pick: Deslop first to remove the defaults, then bolder. Delight last, and only a little.

### Fix AI-sounding writing

- `/fix-writing`: Picks the right one of these for you
- `/humanizer`: Rewrites one piece of text
- `/stop-slop`: Strict rules while you write something new
- `/sepia:sepia`: Knows formats like release notes, pull request replies and incident write-ups
- `/slop-guard`: Gives a score only and never edits
- `/vale:fix`: Rule-based fixes across a whole repo
- `/impeccable clarify`: Words in the app: labels, buttons and error messages

Pick: Not sure? /fix-writing chooses. Stop-slop to write clean from the start. Humanizer to fix a draft, especially one with facts in it. Sepia when the format matters. Slop-guard to measure. Vale across many files. Clarify for words inside the app.

### Be critical about a design

- `/impeccable critique`: A scored usability review that changes nothing
- `/harsh-review`: Blunt, backed by evidence, and makes the small fixes
- `/steve-jobs-design-review`: Only about simplicity and focus
- `/ux-heuristics`: Usability checked against Nielsen's ten rules
- `/interface-design:design-review`: A quality bar for app screens

Pick: Critique to understand what is wrong. Harsh review when you want it said bluntly and the easy fixes done. Steve Jobs review to decide what to cut. Heuristics for usability. Design-review for dashboards.

### Color and type

- `/impeccable colorize`: Adds color as part of a design pass
- `/oklch-skill`: Exact color steps, dark mode and readable contrast
- `/impeccable typeset`: Fonts and text sizes as part of a design pass
- `/web-typography`: Choosing and pairing fonts, size steps and how fonts load, in depth

Pick: Impeccable for a pass over a screen. The specialists when you need exact values or a font decision.

### Words in the interface vs on the page

- `/impeccable clarify`: Fixes wording as part of a design pass
- `/ux-writing`: The full rules for small app text: errors, empty screens and tone
- `/copywriting`: Wording that sells on marketing pages
- `/fix-writing`: Any writing, and picks the right rules

Pick: Clarify for a quick pass. UX writing when the app's wording is the whole job. Copywriting when the page has to sell. Fix-writing for anything that isn't app text or marketing.

### Phones and native apps

- `/impeccable adapt`: Changes the layout to fit each screen size
- `/mobile-native`: Makes a web app feel like an app on a phone: taps, the notch, full-height screens
- `/ios-hig-design`: Apple's patterns for a real iPhone app
- `/swiftui-pro`: Reviews SwiftUI code
- `/viewport-proof`: Proves it works at each size and changes nothing

Pick: Adapt and mobile-native for websites on phones. HIG and SwiftUI Pro for a real iPhone app. Viewport proof only to prove the result before you ship.
