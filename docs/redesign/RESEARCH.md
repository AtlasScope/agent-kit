# Benchmark research for the AtlasScope site redesign

24 November 2026 · research only, no site code changed · base `main` at `118506c`

This brief feeds the design-system owner and the page-family builders. It builds on the design dossier (v0.9 roadmap, site experience architecture, First Light study, PR #124 review) and does not reopen its decisions: Fable owns Home art and the Home to Install hand-off, the logo stays, green is a signal and not a wash, Orbital Neutral is the starting palette. The dossier's earlier precedent notes on Resend, Vercel and T3 Code were text-only. This pass looked at the live sites and measured them.

Every claim below points to an annotated capture in [`research/img/`](research/img/). Yellow numbers on each image match the notes under it.

## How this was captured, and what it does not prove

- Sites were opened live in the Claude desktop app's built-in browser on the founder's computer, which is Chromium on Windows. Desktop captures are at a 1024 CSS px viewport (saved at 800 px wide). Phone captures use the pane's 390 px emulation with an Android user agent.
- None of this is Safari, WebKit, a Mac or an iPhone. Font rendering, backdrop blur and scroll behaviour will differ on Apple hardware. Physical-device validation is still owed by the QA workstream.
- The cloud container's network blocks these sites, so no Playwright runs, no Lighthouse numbers and no frame timings were collected. Type sizes, weights, tracking and colours come from `getComputedStyle` on the live pages.
- Signed-in sessions on Resend and Vercel existed in that browser. Dashboard screens were not captured, and the account avatar is blacked out on Vercel captures.
- Sites studied: Apple, Resend, Vercel (home, templates, docs), T3 Code, Linear, Raycast (store and an extension page), and skills.sh, the closest direct comparator. AtlasScope production was captured with the same setup as the "before" baseline.

## What AtlasScope already gets right

Keep these. Several are better than the benchmarks.

1. **A real request routed to a real skill** in the hero (`/design why does my dashboard look like a school project → refactoring-ui`). None of the benchmarks shows its product making a decision this directly. See `atlasscope-home-6s` note 3.
2. **Kit rows** on `/kits`: name, count, the job in one sentence, the entry command in mono. This is the best browsing pattern on the site and the model for the rest of the library. See `atlasscope-kits`.
3. **One paste message on `/install`** that works in every agent, with per-agent commands behind tabs. skills.sh reaches for the same idea with its Command / Prompt toggle. See `atlasscope-install-5500ms`, `skillssh-detail`.
4. **Facts on prompt cards**: "Use when", "You get", "Requires", "Changes code?". The "Changes code?" fact is a trust signal nobody else shows. The problem is presentation (four labelled rows per card), not the content.
5. **Search is fast and already returns kind labels.** It needs a palette shell, not a new engine. See `atlasscope-search`.
6. **Montserrat 600 page titles** tie headings to the wordmark. The measured h1 (44.7 px, -3.5% tracking) sits comfortably next to Vercel and Linear.

## Where AtlasScope falls behind today

| # | Problem | Evidence |
|---|---|---|
| 1 | Green means link, success, status light, primary fill and focus ring at once. DESIGN.md says "no accent hue"; runtime fills the hero CTA, the Copy buttons and the search focus ring with green. | `atlasscope-home-6s` 2, 4 · `atlasscope-prompts-cards` 2 · `atlasscope-search` 1 |
| 2 | The header carries eight elements on a phone; Sign in is the loudest. Divider, "Agent Kit", LED and green-outlined Sign in compete with the logo on desktop. | `atlasscope-mobile-prompts` 1 · `atlasscope-mobile-home-4s` 2 |
| 3 | Content waits for choreography. Home on a phone shows no words at 4 s; a direct visit to `/install` shows no message at 2.5 s. | `atlasscope-mobile-home-4s` 1 · `atlasscope-install-2500ms` 1 |
| 4 | `/prompts` cards are small forms: four labelled facts, two equal buttons, two alternative links, nine times. | `atlasscope-prompts` 3 · `atlasscope-prompts-cards` 1 |
| 5 | Prompt detail has two copy actions for one payload and an internal id (`M03`) in the meta line. | `atlasscope-prompt-detail` 1, 4 |
| 6 | `/skills` is a card grid of name, author and three clamped lines. Nothing tells you how to install one skill or which agents it runs in. | `atlasscope-skills` 1 |
| 7 | Intro paragraphs drop to 12.8 px and read as fine print. | `atlasscope-prompts` 2 |
| 8 | `/install` puts a perspective grid and glow behind a page whose job is reading and copying. | `atlasscope-install-2500ms` 2 |

## Measured type and colour on the benchmarks

All on dark, desktop viewport 1024 CSS px.

| Site | Display face | h1 size / line / tracking | h1 weight | Section heading | Body / lead | Primary text | Secondary text | Header |
|---|---|---|---|---|---|---|---|---|
| Resend | Domaine (serif) | 96 / 96 / -1% | 400 | ABC Favorit 56 / 67, -5% | Inter 16/24; lead 18/27 | #F0F0F0 on #000 | #A1A4A5 | 58 px, transparent, sticky, no rule |
| Vercel | Geist | 64 / 64 / -6% | 400 | 56 / 56, weight 450 | Geist Mono 16/24 as lead | #EDEDED on #000 | #A1A1A1 | 64 px, hairline #1F1F1F |
| Linear | Inter Variable | 56 / 61.6 / -2.2% | 510 | 40 / 44, 510, grey | 15/24 | #F7F8F8 on #08090A | #8A8F98 | 73 px, blur(20px), rule rgba(255,255,255,.08) |
| T3 Code | system (SF / Segoe) | 57.3 / 60.2 / -3% | 600 | 41 / 43, 600 | 16/24.8 | #F5F5F5 on #000 | #A3A3A3 | transparent, no rule |
| Apple | SF Pro Text | n/a on captured page | | | 17/25, -0.374px | #F5F5F7 | #86868B | 44 px |
| **AtlasScope** | Montserrat | 44.7 / 46.9 / -3.5% | 600 | Geist 22.1 / 26.6, **650** | Geist 16; lead 19/29.5 | near-white on near-black | #A3A6AD | 57 px, hairline, green underglow |

What the numbers say:

- **Display weight goes down as size goes up.** Resend, Vercel and Linear set their largest type at 400 to 510. AtlasScope's Montserrat 600 is fine for the h1 because it echoes the wordmark, but Geist section headings and card titles at 650 make every page feel loud. Recommend Geist 550 to 600 for headings and titles, 500 for UI labels.
- **Tracking tightens with size.** Vercel goes to -6% at 64 px. AtlasScope's -3.5% on the h1 is in range; section headings can go to -2%.
- **Secondary grey converges on about #A1A1A1 to #A3A3A3** on pure or near black. AtlasScope's #A3A6AD already matches; keep it.
- **Nobody uses a coloured primary fill on dark.** Resend uses an outlined dark pill, Vercel a white pill, Linear a light grey pill, Raycast a light button. T3 Code's blue download button is the exception and it is their only coloured element.
- **No benchmark puts a glow, underglow or status light in its header.**

## Patterns worth adopting, by area

### Shell and navigation

- **Fewer things in the bar.** Resend, Vercel and Linear show grey 14 px links (weight 500) and one outlined or light CTA. Apple's phone bar is logo, search, bag and menu. See `resend-home-desktop` 3, `apple-mobile-home`.
- **Phone menu as a full sheet with large type.** Apple sets items at about 24 px / 600 with no icons and drills into sections with a back chevron instead of nesting accordions. See `apple-mobile-menu`, `apple-mobile-menu-drill`.
- **Breadcrumb repeated at the top of the footer**, so the bottom of a long detail page still says where you are. See `apple-footer-breadcrumb` 1.
- **Search field as palette trigger with a visible keycap.** See `vercel-docs-shell` 1, `raycast-store-search` 1, `skillssh-leaderboard` 2.

Recommendation for the shell owner: desktop bar is lockup (no divider, no LED) · Start · Prompts · Skills · Kits · Fix · search trigger with `/` keycap · GitHub mark · Sign in as plain text · Install as the single light pill. Phone bar is symbol, search, menu; Install and Sign in move into the sheet, with Install as the sheet's first, largest item. Header has a hairline and no glow.

### Search and keyboard discovery

The Vercel docs palette (`vercel-docs-palette`) is the closest model: centred modal, Esc keycap, a type icon on every row, a kind badge on the right, matched terms highlighted in one colour.

For AtlasScope, keep the existing index, `/` shortcut, arrows, Enter and Escape, and add:

- Results grouped by kind (Prompts, Skills, Kits, Fix) with a small type mark per row, and the entry command in mono where one exists.
- Match highlighting in the foreground colour at full weight, not in green.
- A footer row of key hints: ↑↓ move, ↵ open, ⌘↵ copy, esc close.
- **Copy from the palette.** ⌘↵ (Ctrl↵ elsewhere) copies the highlighted prompt's exact payload or skill's install command without leaving the page, with the same truthful success or blocked state as CopyButton. No benchmark does this and it matches how the site is used: copy, paste, leave.
- An empty state that lists the "Best starting points" jobs, so an empty query is still useful.

### Library browsing

- **Rows beat cards for things people scan and compare.** skills.sh runs its whole catalogue as a dense ranked table under one search field. AtlasScope's own kit rows already prove this. Vercel's template cards work only because each has a preview image, which prompts don't have. See `skillssh-leaderboard`, `atlasscope-kits`, `vercel-templates-catalog`.
- **Search and filters on the title row.** Vercel keeps them side by side even at 390 px. See `vercel-templates-catalog` 2, `vercel-templates-mobile` 1.
- **Apple's aligned comparison**: identical structure across columns, a dash for "not included". Useful for comparing the five kits. See `apple-choose-tiles`, `apple-compare-specs`.

Recommendation for the prompt library: one row per prompt with title, one-line "use when", section dot, an effect chip ("Reads only" / "Changes code"), and a single copy icon that appears on hover and keyboard focus and is always visible on touch. Details is the row link itself, not a second button. Keep "Best starting points" but render it as a compact job picker (job name → one recommended entry) above the rows rather than nine fact cards. Facts like "You get" and "Requires" move to the detail page where there is room.

### Detail pages and copy

- **One primary per page.** Raycast's extension page has Install and Share, and a meta row of author, installs and type split by hairlines. See `raycast-detail-header` 1, 2.
- **Segmented tabs for depth.** Raycast uses Overview / Commands / Version History. For a skill: Overview / SKILL.md / Source and credit. See `raycast-detail-header` 3.
- **Summary panel first, full file below, facts in a right column.** See `skillssh-detail` 2, 3.
- **Same install, two forms.** skills.sh toggles Command and Prompt on one card. AtlasScope already has both forms (paste message and per-agent commands) on `/install`; put the toggle on every skill and kit page. See `skillssh-detail` 1.
- **Agent strip with the exact command per agent.** T3 Code lists each agent with its mark and its auth command in mono. AtlasScope can do the same for install commands, using the tested dates already in `site/lib/site.ts` and nothing invented. See `t3-agent-strip` 1.
- **Copy lives in the card's corner as an icon button**, not as a second large button elsewhere. See `resend-code-tabs` 3, `vercel-docs-shell` 4.

Proposed prompt detail anatomy (wide screens):

```
Crumbs
Title                                             ┌ Facts ─────────────┐
Lead (what it does)                               │ Effect  Reads only │
Use it when …                                     │ Requires …         │
                                                  │ Section ● …        │
┌ Prompt ───────────────────────── [Copy] [Star] ┐│ Source / license   │
│ exact payload in Geist Mono                    ││ Markdown twin      │
└────────────────────────────────────────────────┘└────────────────────┘
Related: same job · next step · router that picks it
```

The copy button in the payload card's header is the page's only copy action. On a phone the card comes straight after the lead and the facts follow it.

### Install

- Keep the one paste message as the hero of `/install`. It is clearer than any benchmark's install surface.
- Drop the floor grid and glow on the direct route. Resend and Vercel put install commands on plain black with a hairline card. The dossier already asks for this; the captures confirm it reads calmer. See `atlasscope-install-2500ms` 2, `vercel-docs-shell` 3.
- One green signal for "copied": the label in the card bar changes to "On your clipboard" with a small check. The button stays neutral; the border does not turn green.
- Direct visits paint the message in the first frame. Any entrance motion belongs to the Home to Install hand-off, which Fable owns.

### Product UI as illustration

Resend, Vercel, T3 Code, Linear and Raycast all illustrate features with their own interface rather than with drawings. AtlasScope's interior pages have no illustrations and do not need art. Where a page needs a visual (Start, Learn, kit pages), use a real fragment: a routed request, a terminal card, a SKILL.md excerpt. See `resend-product-as-illustration` 1, `t3-product-as-hero` 1, `raycast-detail-body` 1.

### Two-tone leads

Linear and Vercel write a section's opening sentence in two tones: the claim in the foreground colour, the elaboration in grey, same size. It gives hierarchy inside one sentence and removes the need for a heading plus a small paragraph. Use it for section intros like "Best starting points" instead of a 12.8 px paragraph. See `linear-two-tone-statement` 1, `vercel-home-section` 1.

## The entrance tax, and the opening it leaves

Four of the benchmarks hide their headline after load: T3 Code still animating at 5 s on a phone, Resend near 10% opacity at 3 s, Linear empty at 3 s on desktop. AtlasScope does the same on Home and on direct `/install`. See `t3-mobile-5s-entrance`, `resend-mobile-3s-entrance`, `linear-3s-entrance`, `atlasscope-mobile-home-4s`.

The opening: be the developer-tool site whose words and primary action are on screen in the first frame on every route, with motion layered on afterwards. On Home that is Fable's call, so it goes to them as a finding, not a change. On every interior page it should be a rule in the design contract: no content waits on an animation.

## What AtlasScope can own

These are not things the benchmarks do. Each uses data the site already has.

1. **Request in, skill out, everywhere.** The routing example is the identity. Carry it into search (a plain-language query shows which router would take it and the skill pages it links to, using existing router and section data only), into kit pages (two or three real requests per router, from `tests/routing/cases.json` as the hero does), and into empty states.
2. **The effect chip.** "Reads only" or "Changes code" on every prompt row and detail page, from the existing "Changes code?" field. A one-glance safety signal no catalogue shows.
3. **Mono means pasteable.** DESIGN.md already says anything a visitor can type or paste is in Geist Mono. Make it absolute: no decorative mono labels (Linear's style), so mono always means "this goes into your agent".
4. **Copy without navigating.** From the palette (⌘↵), from a row (hover or focus icon), from the detail card. One CopyButton component and one success state everywhere.
5. **Instant pages.** No entrance on interior routes, no hidden first paint, content-first on phones.
6. **Honest facts instead of social proof.** Benchmarks lean on install counts, stars and customer logos. AtlasScope has none and must not invent them. Its proof is author, license, pinned source, tested date and a real routed example. Give those the facts column skills.sh gives to install counts.

## Notes for the design-system contract

- **Colour roles.** Neutral primary (white pill on dark, ink on light). Green (#4BF0A8 or the current LED green, whichever passes contrast in both themes) only for a completed state: copied, tested, done step. Links neutral with an underline; hover raises contrast. Section hues stay as dots. Warm accent for starred and saved stays as DESIGN.md describes it. Focus is the existing 2 px ring in the foreground colour, with no glow.
- **Type.** Montserrat 600 for h1 only. Geist 550 to 600 for section headings and titles, 500 for nav and buttons, 400 body at 16/1.55. Nothing read as content below 14 px; meta at 13 px. Two-tone leads for section intros.
- **Surfaces.** Near-black ground, one raised tone, hairlines. No gradients, glows or grids on interior pages.
- **Controls.** 40 px desktop buttons, 44 px touch, radius consistent across buttons, inputs and cards. Copy as a corner icon button in a card header.
- **Motion.** Press feedback under 120 ms, hover 120 to 180 ms, palette and menu 180 to 260 ms (from the dossier's motion section). No route entrances.

## Do not copy

- Resend's serif display or its 3D object. AtlasScope's display voice is Montserrat, tied to the wordmark.
- Vercel's triangle-and-glow hero device, or a centred-glow hero of any kind on interior pages.
- T3 Code's floating partner logos and star count in the header.
- skills.sh's leaderboard, sparklines and install counts. No equivalent data exists.
- Raycast's purple gradient wash and glass nav pill.

## Captures

Each capture with its numbered notes, AtlasScope first, then the benchmarks. Third-party captures are reduced-size screenshots kept for design critique.

### atlasscope-home-6s

![atlasscope-home-6s](research/img/atlasscope-home-6s.jpg)

### atlasscope-mobile-home-4s

![atlasscope-mobile-home-4s](research/img/atlasscope-mobile-home-4s.jpg)

### atlasscope-prompts

![atlasscope-prompts](research/img/atlasscope-prompts.jpg)

### atlasscope-prompts-cards

![atlasscope-prompts-cards](research/img/atlasscope-prompts-cards.jpg)

### atlasscope-prompt-detail

![atlasscope-prompt-detail](research/img/atlasscope-prompt-detail.jpg)

### atlasscope-skills

![atlasscope-skills](research/img/atlasscope-skills.jpg)

### atlasscope-kits

![atlasscope-kits](research/img/atlasscope-kits.jpg)

### atlasscope-search

![atlasscope-search](research/img/atlasscope-search.jpg)

### atlasscope-install-2500ms

![atlasscope-install-2500ms](research/img/atlasscope-install-2500ms.jpg)

### atlasscope-install-5500ms

![atlasscope-install-5500ms](research/img/atlasscope-install-5500ms.jpg)

### atlasscope-mobile-prompts

![atlasscope-mobile-prompts](research/img/atlasscope-mobile-prompts.jpg)

### resend-home-desktop

![resend-home-desktop](research/img/resend-home-desktop.jpg)

### resend-code-tabs

![resend-code-tabs](research/img/resend-code-tabs.jpg)

### resend-product-as-illustration

![resend-product-as-illustration](research/img/resend-product-as-illustration.jpg)

### resend-mobile-3s-entrance

![resend-mobile-3s-entrance](research/img/resend-mobile-3s-entrance.jpg)

### vercel-templates-catalog

![vercel-templates-catalog](research/img/vercel-templates-catalog.jpg)

### vercel-templates-mobile

![vercel-templates-mobile](research/img/vercel-templates-mobile.jpg)

### vercel-docs-shell

![vercel-docs-shell](research/img/vercel-docs-shell.jpg)

### vercel-docs-palette

![vercel-docs-palette](research/img/vercel-docs-palette.jpg)

### vercel-home-section

![vercel-home-section](research/img/vercel-home-section.jpg)

### t3-hero

![t3-hero](research/img/t3-hero.jpg)

### t3-agent-strip

![t3-agent-strip](research/img/t3-agent-strip.jpg)

### t3-product-as-hero

![t3-product-as-hero](research/img/t3-product-as-hero.jpg)

### t3-mobile-5s-entrance

![t3-mobile-5s-entrance](research/img/t3-mobile-5s-entrance.jpg)

### apple-choose-tiles

![apple-choose-tiles](research/img/apple-choose-tiles.jpg)

### apple-compare-specs

![apple-compare-specs](research/img/apple-compare-specs.jpg)

### apple-footer-breadcrumb

![apple-footer-breadcrumb](research/img/apple-footer-breadcrumb.jpg)

### apple-mobile-menu

![apple-mobile-menu](research/img/apple-mobile-menu.jpg)

### apple-mobile-menu-drill

![apple-mobile-menu-drill](research/img/apple-mobile-menu-drill.jpg)

### linear-hero

![linear-hero](research/img/linear-hero.jpg)

### linear-two-tone-statement

![linear-two-tone-statement](research/img/linear-two-tone-statement.jpg)

### linear-3s-entrance

![linear-3s-entrance](research/img/linear-3s-entrance.jpg)

### raycast-store-search

![raycast-store-search](research/img/raycast-store-search.jpg)

### raycast-detail-header

![raycast-detail-header](research/img/raycast-detail-header.jpg)

### raycast-detail-body

![raycast-detail-body](research/img/raycast-detail-body.jpg)

### skillssh-leaderboard

![skillssh-leaderboard](research/img/skillssh-leaderboard.jpg)

### skillssh-detail

![skillssh-detail](research/img/skillssh-detail.jpg)
