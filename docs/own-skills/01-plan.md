# Writing our own skills: what it would take

Written 2026-11-10. This explores replacing the 49 borrowed skills, and the outside plugins the routers call (Impeccable first among them), with skills written for Agent Kit. It recommends an approach and an order. `motion-kit`, added in the same change, is the first one built this way and serves as the worked example.

Nothing here removes or demotes a borrowed skill. Those decisions are listed at the end.

## What is borrowed today

| Author | Skills | Words of instruction and reference | Ships scripts |
|---|---|---|---|
| meodai (`color-expert`) | 1 | 389,000 | No |
| Wondel.ai | 11 | 145,000 | No |
| Hallmark contributors | 1 | 101,000 | 10 |
| Emil Kowalski | 15 | 44,000 | No |
| Corey Haines | 3 | 17,000 | No |
| Matt Pocock | 14 | 12,000 | 2 |
| Paul Hudson (`swiftui-pro`) | 1 | 10,000 | No |
| Christopher Greer (`ux-writing`) | 1 | 9,000 | No |
| Jakub Krehel (`oklch-skill`) | 1 | 2,400 | No |
| Hardik Pandya (`stop-slop`) | 1 | 2,000 | No |

That is about 730,000 words in 49 skills. More than half is one color reference library.

The routers also send work to plugins Agent Kit does not ship. Impeccable accounts for 27 of the design commands in the library, more than any other source, and is the first pick in most `/design` situations. Interface Design, Humanizer, Sepia, Vale, slop-guard, Web Design Guidelines and Anthropic's example skills make up the rest.

So "our own version of everything" has two parts: the 49 skills in the kits, and the commands the routers depend on from outside.

## What the borrowed set does well and where it falls short

Reading the descriptions and sizes, and using the library's own audit:

- **Depth from practitioners.** Emil Kowalski's motion skills, Paul Hudson's SwiftUI review and the color library carry knowledge that took their authors years. A rewrite has to earn its place against that.
- **Overlap.** Nine skills and one Impeccable command cover motion, and several more cover reviewing a built screen. The library needs more than twenty overlap clusters and a router to pick between them. The user pays for that in choices.
- **Uneven shape.** Some skills are 150 characters (`grill-me`), some are 40,000 words. Some edit, some only report, some reply with one line and wait. The catalog has to label each one.
- **Book summaries.** Most of the Wondel.ai skills are built on a named book or framework (the Hook Model, Refactoring UI, Lean UX, The Design of Everyday Things). They are useful as reference and less direct as instructions for doing a job.
- **Little measurement.** Three of the 49 ship any script, and one of those (Hallmark) checks its own output. The rest ask the agent to judge by reading. An agent reviewing type, contrast, spacing or motion from source alone is guessing at what the user sees.
- **No shared project memory.** Impeccable has PRODUCT.md and DESIGN.md. Nothing else in the set reads or writes a project file, so every run starts from zero.
- **Dependence.** The best `/design` routes need a plugin the user has to find and install separately, and a change upstream changes Agent Kit's behaviour.

The last three are the case for writing our own. They are also where Agent Kit's existing original work already differs: `experience-architecture` ships a toolkit and fixtures, `viewport-proof` ships a geometry check and a proof sheet, and the prompt library asks every investigation for evidence and says when to skip it.

## Rules for writing an original

`CONTRIBUTING.md` already says not to reword someone else's skill to make it look original. The borrowed licenses (MIT, and CC BY 4.0 for the color library) would allow adaptation with credit, so this is a standard Agent Kit sets for itself. To keep to it:

1. **Start from the job and from primary sources.** Specifications, platform documentation, accessibility criteria, the published books and papers. Facts and methods are free to use; another author's wording, structure and examples are not.
2. **Do not open the borrowed skill's body while writing its replacement.** Its one-line description is enough to know the job. `motion-kit` was written this way and its README says so.
3. **Name sources.** Each original skill lists what its claims rest on. A method that belongs to a person (the Hook Model, Refactoring UI) is credited as a source and not repackaged as a skill named after their book.
4. **If anything is adapted, credit it** in THIRD_PARTY.md, the same as a copy.
5. **Have a point of view.** A rewrite that says the same things in different words adds nothing. Each original should make decisions the borrowed set leaves open.

## What an Agent Kit original looks like

`motion-kit` sets the pattern. Each original skill has:

| Part | In motion-kit | Why it matters |
|---|---|---|
| One command, plain words in | `/motion` picks setup, storyboard, build, review or fix and says which | The user stops choosing between nine skills |
| A project file | `MOTION.md`: the product's values and rules | Later runs follow decisions already made |
| Measurement | A code inventory, frame-by-frame browser captures, a spring calculator, with tests | The agent checks what it cannot see by reading |
| A notation | One spec line per animation | Reviews can be checked; handoffs are exact |
| A stated judgment | Six jobs, frequency sets intensity, three registers, cut before adding | It decides things; it does not list considerations |
| An honest ending | Three closing lines: what was measured, what was left unchecked, what to feel by hand | Matches "never claim more than was tested" |

The size is a useful comparison. The nine borrowed motion skills total about 39,000 words. `/motion` is about 17,000 words with three scripts and 51 tests, and adds a project file, storyboarding and browser proof.

## Proposed set

Replace by job. Fifteen commands would cover what 49 skills and the outside plugins cover now, and a one-for-one copy would keep the overlap.

### Design

| Own command | Job | Replaces or absorbs | Measurement it would ship | Effort |
|---|---|---|---|---|
| `/motion` (built) | How the interface moves | `animate`, `improve-animations`, `review-animations`, `find-animation-opportunities`, `animation-performance`, `microinteractions`, the motion parts of `apple-design`, Impeccable `animate` | Inventory, filmstrip, spring calculator | Done; needs a recorded trial |
| `/design setup` | Who the product is for and what the design system is | Impeccable `init`, `document`, `extract`, `doctor`; `product-marketing` | Token and style inventory from code (colors, sizes, radii, shadows, with counts) | Medium |
| `/design shape` | Plan a screen before code | Impeccable `shape`; `prototype`; Impeccable `live` and `generate` | Variant picker page | Medium |
| `/design review` | Judge a built screen | Impeccable `critique` and `audit`; `ux-heuristics`; `steve-jobs-design-review`; `design-everyday-things`; Interface Design review; Web Design Guidelines | Screenshots at set viewports, contrast of rendered text, tap-target sizes, heading and landmark outline. `viewport-proof`'s geometry check already does part of this | Large |
| `/type` | Typography | `web-typography`; Impeccable `typeset` | Rendered type scale, characters per line, font loading behaviour | Medium |
| `/color` | Palettes, themes, contrast | `oklch-skill`; `color-expert`; Impeccable `colorize` | Palette extraction, contrast matrix, gamut check | Medium, if the 389,000-word reference stays borrowed as optional depth |
| `/layout` | Hierarchy, spacing, density | `refactoring-ui`; Impeccable `layout`, `polish`, `distill`, `quieter`, `bolder` | Spacing histogram, alignment check | Large. This is where taste is hardest to write down |
| `/harden` | Real data, small screens, native feel on phones | `break-ui`; `mobile-native`; Impeccable `harden` and `adapt` | Worst-case data toggle, overflow and truncation check | Medium |
| `/words` | Interface copy and page copy | `ux-writing`; `copywriting`; `stop-slop`; `fix-writing` (already ours); Impeccable `clarify`; Humanizer; Sepia | A pattern scan for stock phrasing, reading level | Medium. `fix-writing` already routes this |
| `/page` | A new page that looks designed | `hallmark`; `top-design`; `cro` | Hallmark's linting and screenshot scripts set the bar | Largest. Do last |

### Engineering

| Own command | Job | Replaces or absorbs | Notes | Effort |
|---|---|---|---|---|
| `/diagnose` | Find the cause of a bug or slowdown | `diagnosing-bugs` | The library's 50 investigation prompts are already original and evidence-first; this is the loop that runs them | Medium |
| `/test-first` | Red, green, refactor | `tdd` | | Small |
| `/interview` | Stress-test a plan, optionally writing decisions down | `grill-me`, `grill-with-docs`, `grilling`, `to-questionnaire`, `domain-modeling`, `wait-what` | Six small skills, 9,000 characters in total | Small |
| `/architecture` | Find code that is hard to change | `improve-codebase-architecture`, `codebase-design` | Could ship a dependency and churn scan | Medium |
| `/retro`, `/research`, `/wizard` | Session review, primary-source research, a guided setup script | The three of the same name, plus `writing-for-agents` as shared reference | | Small each |

### Keep borrowed

Some skills are better left as they are, credited:

| Skill | Why |
|---|---|
| `swiftui-pro`, `write-swift`, `ios-hig-design`, `animate-expo` | Fast-moving platform facts from specialists. Getting them wrong ships bugs. `/motion` covers native motion at a lighter depth and says so |
| `color-expert`'s reference library | A research collection to consult. `/color` can point to it |
| `ask-sonner`, `pick-ui-library` | One author's own library and own recommendations. There is nothing to rewrite |
| `hooked-ux`, `improve-retention`, `lean-ux` | Product strategy from named books, outside what a coding agent is asked for most days. Revisit if there is ever a `/product` command |
| `animation-vocabulary` | A glossary. `/motion` does not replace it |

That leaves about 14 skills borrowed and credited, and the routers no longer need any outside plugin for their first pick.

## Order of work

1. **Run `/motion` on real projects** and record the results before promoting it. The `/design` router lists it as an alternative today.
2. **`/interview`, `/test-first`, `/retro`.** Small, and they make engineering-kit mostly original quickly.
3. **`/design setup` with our own PRODUCT.md and DESIGN.md schema.** Everything else in design reads these, and it removes the hardest dependency on Impeccable. PRODUCT.md in this repo currently carries an Impeccable schema marker; decide whether to stay compatible with it.
4. **`/design review`**, building on `viewport-proof`. Reviews are where measurement pays most.
5. **`/type`, `/color`, `/harden`, `/words`.** Each is self-contained.
6. **`/layout`, `/design shape`, `/diagnose`, `/architecture`.**
7. **`/page`.**

Each one follows the same steps: write it from sources, ship scripts with tests, add library entries with honest audit scores, list it as an alternative in the router, run it against the borrowed skill on fixtures it was not tuned on, record the run, and only then change the router's first pick. `experience-architecture` already has a comparison harness and blind-written fixtures that can be reused for this.

## Costs and risks

- **Quality.** The borrowed authors are specialists. An original that is merely different is a regression. The comparison run is the guard, and it needs a person's eyes as well as a script.
- **Upkeep.** Borrowed skills are updated by re-reading upstream. Originals are Agent Kit's to keep current, including platform facts that change every year. Fifteen commands with scripts is a real maintenance load for one person.
- **Positioning.** The README and the site say that most of these skills are other people's work and credit them prominently. A mostly original kit is a different product claim. PRODUCT.md's principle "credit every author and keep every licence visible" still holds for whatever stays borrowed, and for sources.
- **Paraphrase.** The pressure when rewriting 49 skills is to rewrite them. The rules above exist to prevent that, and a consolidated set of fifteen makes it harder to do by accident.
- **Reach.** Scripts that need Node and a browser work in Claude Code, Codex and Cursor on a computer. They do not run in a claude.ai chat upload. Each skill has to stay useful without its scripts.

## Decisions for the owner

1. **Replace or sit alongside?** Recommended: sit alongside until a recorded comparison favours the original, then make it the first pick and keep the borrowed skill installed and credited for one release before deciding whether to drop it.
2. **Consolidate or mirror?** Recommended: consolidate to about fifteen commands by job, as above. Mirroring 49 skills one for one would reproduce the overlap the router exists to manage.
3. **Stay compatible with Impeccable's PRODUCT.md and DESIGN.md?** Recommended: read them if present, write our own schema. Users who already ran Impeccable keep their files.
4. **One design plugin or several?** `motion-kit` is separate because it was asked for as its own plugin and works with nothing else installed. Recommended for the rest: put the design originals in design-kit, so one install covers them.
5. **What to build next.** Recommended: `/interview` and `/test-first` (small), then `/design setup`.

## About the prompt library as a reference

The published Prompt Library artifact and `library/library.json` supplied the format the new motion prompts follow: a title that names the problem in plain words, the prompt itself, what it finds, the evidence to ask for, when to skip it, and what agents tend to get wrong. Six motion investigations (MO01 to MO06) were added in that shape. They work in any agent with nothing installed.

The artifact is built with a private overlay that is not in this repository, so it was not republished. `library/dist/prompt-library.html` has the new entries.
