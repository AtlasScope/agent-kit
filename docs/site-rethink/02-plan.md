# Site rethink plan

Date: 2026-11-09. Phase 2. Builds on [01-audit.md](01-audit.md). Austin accepted all eleven recommendations from the audit; they are treated as settled here.

## Settled

| # | Decision |
|---|---|
| 1 | The orbit photo is the homepage hero backdrop only. Solid ink header, photo starts below it, no mark on the photo, text in the black sky. Recorded in `SPEC.md` as an exception. |
| 2 | Header shows the Orbit symbol plus "Agent Kit" in text. The AtlasScope wordmark moves to the footer. |
| 3 | The hero is written for the working developer, with a clear second button for beginners. |
| 4 | Homepage is always dark. Library pages follow the visitor's light or dark setting. |
| 5 | One cool ink, `#0B0C12`, replaces the warm dark. |
| 6 | The typing animation goes. |
| 7 | Build with the photo as supplied; show a toned-down version beside it at the hero checkpoint. |
| 8 | `design/hero/inputs/` is ignored by git. Only optimized images are committed. |
| 9 | Privacy and terms are drafted from what the site stores, then read by someone qualified. |
| 10 | Vercel Web Analytics and Speed Insights, switched on by Austin. |
| 11 | Typecheck, tests and build on each PR. No extra review pass unless Austin names one. |

## 1. User flow

### How the homepage routes each person

The hero has one headline, one sentence, and two buttons. Directly under it, still visible on a laptop without scrolling, is a row of three doors.

| Person | What they see first | Where it takes them |
|---|---|---|
| Developer | Primary button, "Install Agent Kit" | Scrolls to the install command just below the hero: pick your agent, copy one command. Header search is one keypress away (`/`). |
| Beginner | Second button, "New to coding agents? Start here" | `/start` |
| Returning user | "Collections" in the header when signed in, and a one-line strip above the doors: "Your collections" with the names of the last three | `/account` or the collection |

The three doors, in this order:

1. **I have a problem in my code**: goes to `/fix`.
2. **I know what I want**: puts the cursor in search, with links to Prompts and Skills.
3. **I've never used a coding agent**: goes to `/start`.

The doors are plain cards of equal weight. The solid green tile goes.

### `/start`, rebuilt as the beginner path

Today the guide explains what an agent is inside step 1, reveals the paid plan inside step 1, and makes the reader set up two accounts before anything works. The rebuilt order puts the explanation and the cost first and the first result as early as possible.

| Order | Page | Changes from today |
|---|---|---|
| Before you start | What a coding agent is | The first lesson from `/learn`, moved to the front. Two minutes. |
| Before you start | What you need | New, short. A computer, about an hour, a paid Claude plan (or an agent you already pay for), two free accounts later on. |
| 1 | Pick your agent | As today. |
| 2 | Make the app | Moved up. Uses a plain folder, so the reader sees a working app before creating any account beyond the agent's. This is the first working result. |
| 3 | Improve it with Agent Kit | As today. |
| 4 | Set up GitHub and Vercel | Moved down, to the point where it is needed. |
| 5 | Save it | Adjusted: GitHub Desktop adds the existing folder. |
| 6 | Publish it | As today. |
| 7 | Check it on your phone | As today. |
| 8 | Make a change on your own | As today. |
| After | Four short lessons | Asking, prompts, skills, checking a change. |
| After | Where to go in the library | The three starter skills, then `/fix` and Prompts. |

Each step keeps its "You should see" and "If something's off" sections. The hub shows which steps are done, remembered in the browser. The note that the guide is untested stays until one real first-time user has run it; that test is listed under open items.

## 2. Information architecture

### Header

Desktop: symbol and "Agent Kit" · Start · Prompts · Skills · Fix a problem · search · Collections or Sign in · GitHub icon.

Phone: one 56 px row with symbol and "Agent Kit", a search button and a menu button. Search opens full width; the menu opens a sheet with the same links. This replaces the 151 px three-row header.

The header is a solid ink bar in both themes, so the white symbol always sits on ink and only one logo rendering has to be pixel-fitted.

### Page hierarchy

```
/                         Home
/start                    Beginner path (hub)
  /start/<step>           8 steps
  /learn/<lesson>         5 lessons, listed on /start
/prompts                  All prompts, with an on-page filter
  /prompts/<area>
  /prompts/<prompt>
/skills                   All skills; kits introduced at the top
  /skills/<name>
/kits, /kits/<kit>        Kept, linked from Skills and the footer
/fix, /fix/<problem>      Start from a symptom
/mcp-setup                "Connect your agent", linked from install and footer
/account                  Collections
  /account/settings       New: email, export, delete account
/collections/<id>         One collection
/sign-in
/about, /privacy, /terms  New, in the footer
```

### What merges, moves or goes

| Route | Change | Redirect |
|---|---|---|
| `/learn` (the index) | Merges into `/start`, which lists the lessons | `/learn` to `/start#lessons`, permanent |
| `/learn/<lesson>` | Stays at the same URL | None |
| `/start/<step>` | Same URLs, new order | None |
| `/kits` | Leaves the header, stays as a page | None |
| `/account` | Same URL. Called "Collections" everywhere: header, page title, breadcrumb | None |
| `/mcp-setup` | Same URL, labelled "Connect your agent" | None |
| `/privacy`, `/terms`, `/about`, `/account/settings` | New | None |

No library URL changes, so `llms.txt`, the `.md` twins, the sitemap and the MCP server need only the new pages added.

### Footer

Left: the AtlasScope wordmark on ink, pixel-fitted, and one line on licences. Right, three short groups: Library (Prompts, Skills, Kits, Fix a problem), Use it (Start, Connect your agent, GitHub, llms.txt), AtlasScope (About, Credits, Privacy, Terms).

## 3. Content

### Homepage message order

1. What it is, in one sentence (hero).
2. How to get it (install command).
3. Where to start, by who you are (three doors).
4. What is in it: prompts, skills and kits, each with a one-line definition taken from `GLOSSARY.md` and a count read from the generated content.
5. What using it looks like: the existing example run, shown still, with a Play button.
6. Who wrote the skills, with credit links.
7. Use it from your agent (MCP).

### Hero headline and subhead options

Counts are written here as `{skills}` and `{prompts}`; the page reads them from the generated content.

| # | Headline | Subhead |
|---|---|---|
| A | Give your coding agent better instructions. | Agent Kit is a free library of {skills} skills and {prompts} prompts for Claude Code, Codex and Cursor. Install it once, describe the job in plain words, and your agent follows a written method for it. |
| B | Skills and prompts for your coding agent. | {skills} skills and {prompts} prompts, free and open. Install a kit, type `/design` or `/engineer`, and say what you need in plain words. |
| C | Describe the job. Your agent gets the method. | Agent Kit adds {skills} skills to Claude Code, Codex or Cursor. Type one command, describe what you want, and it picks the skill that fits and tells you which one. |
| D | A working library for coding agents. | Prompts to copy, skills to install and a guide for your first app. It's free, and every skill credits its author. |
| E | Your agent is only as good as what you tell it. | Agent Kit gives it {skills} skills and {prompts} prompts to work from, written by people who do those jobs. Free for Claude Code, Codex and Cursor. |

Recommendation: A. It says what the product does for the reader without a comparison to a team or a promise about results. B is the safest fallback and the best for search. E is the closest to the old register and I would not pick it.

Buttons under any of them: "Install Agent Kit" and "New to coding agents? Start here".

### Copy each key page needs

| Page | Needs |
|---|---|
| `/start` | New title and intro that name the outcome and the cost up front: "Build your first app with a coding agent. About an hour. You need a paid Claude plan, or an agent you already use." The new "What you need" page. Reordered step text for steps 2, 4 and 5. |
| `/prompts` | A one-line definition of a prompt under the title. Filter label and empty result text ("Nothing matches. Try the symptom in plain words."). |
| `/skills` | A one-line definition of a skill and of a kit. Cards show the first sentence of the description in full. The descriptions themselves come from the other project and are not edited here. |
| `/fix` | A line saying these assume you already have a codebase, with a link to `/start` for people who do not. |
| `/account` | One name, "Collections". An empty state that explains starring. A confirmation before Delete: "Delete this collection? Its items stay in the library. This can't be undone." |
| `/sign-in` | Two lines above the form on why an account helps: star, collect, share one install command. |
| `/about` | Who AtlasScope is, what Agent Kit is, how to contribute, the words the site uses (from `GLOSSARY.md`). |
| `/privacy` | What is stored and where: the account (Clerk), collections (Neon), MCP call counts, server logs and page analytics (Vercel). No ads, no sale of data. How to export or delete. |
| `/terms` | Free, provided as is. Each skill keeps its author's licence. Acceptable use of the MCP server and its limits. |
| 404 | Add Home and Start to the three links. |

## 4. Design system

The system extends `site/app/globals.css`. Every token below is an existing variable given a new value, or a new variable beside the existing ones. Nothing is renamed, so pages keep working PR by PR.

### Colour

Dark theme (the homepage always; library pages when the visitor's system is dark):

| Variable | Now | New | Note |
|---|---|---|---|
| `--color-paper` | `#0A0A09` | `#0B0C12` | Brand ink |
| `--color-paper-2` | `#1A1917` | `#151821` | Brand slate, raised panels |
| `--color-paper-3` | `#2A2825` | `#1E222D` | Pressed and hover |
| `--color-ink` | `#FFFFFF` | `#FFFFFF` | |
| `--color-ink-2` | `#E2DED6` | `#D9DCE3` | 14.5:1 on ink |
| `--color-muted` | `#B3AC9F` | `#A3A6AD` | Brand muted, about 8:1 on ink |
| `--color-rule` | `#34312C` | `#232733` | Hairlines |
| `--color-rule-2` | `#4C4740` | `#3A3F4D` | Control borders |
| `--color-accent`, `--color-accent-ink` | white, `#0B0A08` | white, `#0B0C12` | The white pill button |

Light theme (library pages when the visitor's system is light):

| Variable | Now | New |
|---|---|---|
| `--color-paper` | `#ECEAE4` | `#F4F5F7` |
| `--color-paper-2` | `#FFFFFF` | `#FFFFFF` |
| `--color-paper-3` | `#E2DED5` | `#E8EAEE` |
| `--color-ink` | `#0B0A08` | `#0B0C12` |
| `--color-ink-2` | `#3A362F` | `#2B2F3A` |
| `--color-muted` | `#5E594F` | `#5A5F6B` |
| `--color-rule`, `--color-rule-2` | `#D6D1C7`, `#B9B3A6` | `#DCDFE5`, `#BFC4CE` |

Accent colour: none. Austin set the homepage palette on 2026-11-09 as the four brand colours only: ink `#0B0C12`, white, slate `#151821` and muted `#A3A6AD`. Lines are muted at reduced strength over ink (22% for hairlines, 60% for control borders, which keeps 3:1). Amber is removed: commands are marked by Geist Mono in the text colour, and the focus ring is white on dark and ink on light. The six section hues stay as small dots on library pages and do not appear on the homepage.

New variables: `--color-header` (always `#0B0C12`) and `--color-header-ink` (always white), so the header is the same bar in both themes.

### Type

- **Display: Montserrat 600.** Used for the hero headline, page titles and homepage section headings. It is the typeface of the logo, so the name in the header and the headline under it match, which is what makes the reference board read as one system. Loaded through `next/font` at one weight. `--font-display` already exists and currently points at the body font; it is repointed.
- **Interface and body: Geist.** Kept. It is already loaded, it has a matching monospace for commands, and it is hinted well on Windows, which matters given the fuzzy-logo complaint. Switching to Inter would add a download and a restyle of every page for a difference few readers would see. The brand spec names Inter for AtlasScope surfaces and already notes that Agent Kit uses Geist as a site decision.
- **Code: Geist Mono.** Kept.

| Step | Size | Line height | Face | Tracking |
|---|---|---|---|---|
| Hero | clamp(2.5rem, 4vw + 1rem, 4.5rem) | 1.05 | Montserrat 600 | -0.02em |
| Page title | clamp(2rem, 2.6vw + 1rem, 3rem) | 1.1 | Montserrat 600 | -0.02em |
| Section heading | 1.5rem | 1.25 | Montserrat 600 | -0.01em |
| Card title | 1.0625rem | 1.3 | Geist 600 | -0.015em |
| Lead | `--text-lead` (as now) | 1.5 | Geist 400 | 0 |
| Body | 1rem | 1.55 | Geist 400 | 0 |
| Small | 0.875rem | 1.45 | Geist 400 | 0 |
| Label | 0.75rem, capitals | 1.3 | Geist 500 | 0.08em |

The Label step is the board's small spaced capitals ("BY ATLASSCOPE"), used sparingly: section eyebrows on the homepage and the footer group titles.

### Spacing, radius, elevation, motion

- **Spacing:** the existing scale (8, 12, 16, 24, 40, 64) plus `--space-3xl: 96px` for the gap between homepage sections.
- **Radius:** `--radius: 12px` for cards and panels (as now), 999 px for buttons and chips (as now), and a new `--radius-sm: 8px` for inputs and menus.
- **Elevation:** on dark, depth comes from the slate panel colour and a hairline, with no shadow. The existing `--lift` shadows stay for light-theme cards and for floating things in both themes (search results, menus).
- **Motion:** the existing `--ease-out` and durations. The hero text fades up once over 220 ms, in CSS, and is readable and clickable from the first frame. Hover and press changes take 120 ms. No parallax, no scroll-driven effects, no typing. Under `prefers-reduced-motion` nothing moves.

### Imagery

- One photograph on the site: the orbit horizon, on the homepage hero.
- The header above it is solid ink. The photo's top and bottom fade into `#0B0C12`, so there is no visible edge.
- No logo, symbol or icon on the photo. The symbol's band is never lined up with the horizon.
- Text sits over the black sky only. Behind the text block there is a soft ink gradient so contrast holds at every width; the checked target is 7:1 for the headline and subhead.
- On phones the picture is cropped to keep the lit rim and the storm on the right, with the horizon in the bottom third.
- Share images, icons and library pages stay photo-free.

Delivery: a small script in `design/hero/` writes AVIF and WebP files at 960, 1440, 1920, 2560 and 3840 px wide, a portrait crop at 780 and 1170 px, and a 24 px blurred placeholder, into `site/public/hero/`. The page uses a `<picture>` element with explicit width and height, `fetchpriority="high"` and the placeholder as the background, so nothing shifts while it loads. Fixed files are used in place of the on-demand image optimizer because the crops are art-directed and the files never change.

### Components the hero and nav need

| Component | Notes |
|---|---|
| Header logo | Generated from the design source. Small symbol drawing, whole-pixel height, explicit width and height, no transforms. Variants for 125% and 150% screens. |
| Header | Solid ink, 56 px. Desktop links; phone search button and menu button. |
| Menu sheet | Phone only. Closes on Escape and on link press, traps focus while open. |
| Hero | Picture, gradient, headline, subhead, two buttons. |
| Button | White pill (primary) and outlined pill (secondary), 48 px tall in the hero, 40 px elsewhere. Reuses `.btn`. |
| Install command | The existing agent tabs and command, tightened: one line of small print, the rest behind "What this does". |
| Door card | Three across on desktop, stacked on phone. Title, one line, arrow. |
| Footer | Wordmark and three link groups. |

## 5. PR sequence

Each PR is on a fresh branch from current `main`, passes typecheck, tests and build, and can ship alone. The smoke journeys are updated in the PR that changes what they click. Search tests run on every PR that touches the header, search or the prompts page.

| # | PR | Holds | Depends on |
|---|---|---|---|
| 1 | Pixel-fitted header logo | `export_site.py` writes a header logo with the small symbol at a whole-pixel size and per-scale variants; header becomes opaque; favicon and footer wordmark checked the same way. Before and after captures at 100%, 125%, 150% and 200%. | None |
| 2 | Cool ink and display type | New token values, Montserrat for display, `--color-header`. No layout change. | None |
| 3 | Hero landing | Image script and optimized files, new hero, install strip, three doors, typing animation removed, the hand-typed "61" read from content, `.gitignore` entry for the inputs, the `SPEC.md` exception. | 2 |
| 4 | Rest of the homepage | What is in it (with glossary definitions), still example with Play, credits, MCP, the signed-in collections strip. | 3 |
| 5 | Header and phone menu | New link set, one-row phone header with search and menu, "Collections" label. | 1 |
| 6 | `/start` rebuilt | New order, the two "before you start" pages, lessons listed on the hub, progress marks, `/learn` redirect. | None |
| 7 | Footer, About, Privacy, Terms | New footer, three new pages, 404 links, sitemap and `llms.txt` entries. | 2 |
| 8 | Collections and account | One name, empty states, Delete confirmation, `/account/settings`, sign-in intro. | 5 |
| 9 | Library browsing | On-page filter for `/prompts`, first-sentence skill cards, kit intro on `/skills`, single page title on skill pages. | None |
| 10 | Analytics | Web Analytics and Speed Insights components. Needs Austin to switch both on in the Vercel project first. | None |

## Open items for Austin

1. **Headline.** Recommendation: option A.
2. **The new `/start` order**, which moves "Make the app" ahead of the GitHub and Vercel setup. Recommendation: yes. Cost: steps 4 and 5 need rewritten instructions, and the guide still needs one run with a real first-time user before the untested note comes off.
3. **Kits out of the header**, kept as pages and linked from Skills and the footer. Recommendation: yes. It takes one of the six content nouns out of the first thing people read.
4. **Ink header on light pages too.** Recommendation: yes. One header everywhere, and one logo to keep sharp.
5. **Who reads the privacy and terms drafts** before they are relied on. This one is yours to arrange; the drafts ship marked with their date either way.

## Added after review: design system, Impeccable and Claude Design

Austin asked for the Impeccable skill to drive the design work, for a real design system, and for Claude Design to be used alongside. This section records what that changes.

### What now exists

- `PRODUCT.md` at the repo root: the product record Impeccable reads before any design work. Written from Austin's answers on 2026-11-09. Success is kits installed, prompts copied and AtlasScope becoming known. The exact positioning line is still open.
- `.impeccable/config.json`: landing and showcase pages are built comp-first. A picture of the page is agreed before code, and the build has to match it. Library, account and reading pages are built in code.
- A design system in Claude Design, "Agent Kit Design System": the brand book, colour tokens for dark and light, the type scale, spacing, radius, both logo families and the hero photograph. It has no components yet. Those are added from the shipped header, hero, buttons, install command, cards and footer.
- A Claude Design canvas, "Agent Kit Hero Comps": three compositions of the homepage's first screen at 1440 × 900, using the real photo, logo, type and colours.

Both Claude Design pages are private to Austin's account. This session has no image generator, so the comps are real layouts on the canvas and stand in for the generated pictures Impeccable would otherwise make.

### The three hero compositions

| | Composition | What it bets on |
|---|---|---|
| A | Horizon rail. Everything hangs from one left edge in the black sky. A solid strip along the bottom holds the install command, the three counts and the "tested with" line. | The developer can install without scrolling, and the counts and test date do the persuading. |
| B | Command first. The search box is the hero, shown answering a plain request with a prompt and two skills from the real search. | The product's own mechanism, "describe the job and get the method", is demonstrated in the first screen. |
| C | Centred classic. Headline, sentence and two buttons centred over the horizon, with the three doors along the bottom. | Familiar and safe. Closest to the reference board and to Linear and Resend. |

A is the direction Impeccable's roll assigned. B is my own first choice. C is the category standard, offered as the quiet alternative.

### What this changes in the plan

1. **Header logo.** Corrected by Austin on 2026-11-09: AtlasScope is the brand, Agent Kit is its first product, and atlasscope.dev is the Agent Kit site. The header carries the AtlasScope lockup, a hairline divider, then "Agent Kit" in Geist 500. The stacked-tile Agent Kit mark in `design/agent-kit/` is not used in the header. The pixel-fitting work in PR 1 applies to the AtlasScope lockup at a 24px box.
2. **Control borders.** `--color-rule-2` becomes `#66686F` dark (muted at 60% over ink) and `#808693` light, replacing the values in section 4, so input and outlined-button borders reach 3:1 against the page.
3. **Order of work.** PR 3 (hero landing) is built comp-led from the composition Austin picks. When it ships, Impeccable writes `DESIGN.md` and `.impeccable/design.json` from the built page, and the Claude Design system gains its components. Every later PR is built from that system and checked against it, which is what keeps the library, account and legal pages consistent with the homepage.
4. **Files to commit with PR 2 or 3:** `PRODUCT.md`, and later `DESIGN.md`, `.impeccable/design.json` and `.impeccable/surfaces/`. `.impeccable/config.json` is ignored by Austin's global git settings, so the comp-first choice stays on this Mac.
