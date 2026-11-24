# Design contract for the site redesign

The working agreement between the lanes that redesign `site/`. It says which files each lane may edit, which APIs are frozen, and the rules every page family follows so the site reads as one product. `DESIGN.md` remains the long-form design record; this file is the short contract.

Integration branch: `redesign/integration`. Design-system branch: `redesign/design-system`. Page lanes branch from `redesign/integration` and merge back into it, never into `main`.

## Decisions

Taken for the redesign, from the founder's brief, the dossier (v0.9) and the benchmark research. Page lanes inherit them.

| Decision | Detail |
|---|---|
| Palette | Orbital Neutral: cool greys with almost no chroma, near-black dark (`#08090B` range), near-white light. Light and dark both follow the system; `:root[data-theme]` is reserved for a later toggle. |
| Main action | Neutral. Ink on light, white on dark. Green is no longer a button fill on interior pages. |
| Green | One job: a state that is true now (copied, tested, finished, current). Links, focus and buttons no longer use it. |
| Links | Text colour with a hairline underline that darkens on hover. |
| Focus | One 2px blue ring (`--c-focus`), offset 2px, no glow. |
| Header | Follows the page theme, translucent with blur over scrolled content, hairline below. No status LED, no green underglow. Install is in the bar on every page except Home and `/install`. Current section is a neutral pill. |
| Phone menu | Fills the screen: section links large, then Kits, Learn, Connect your agent, GitHub, About, then a full-width Install. GitHub leaves the bar under 40rem. |
| Type | Montserrat 600 for page titles only. Geist for everything else; section headings 600 (was 650). Geist Mono for payloads, commands and ids. |
| Section hues | Kept, as small flat dots (no gloss). |
| Home and the quiet stage | The dark stage covers Home and `/install` only. It keeps main's palette and button look, including the green main action, until Fable's track decides. Over Home only, the header also keeps main's look (the light after the product name, the lit bottom line, the outlined field, GitHub in the bar on phones); the Header row below applies everywhere else. `/start` follows the system light or dark like every other interior page. |
| First frame | Interior pages show real content in the first viewport: title, one line, then the thing itself. No hero blocks on interior pages. |

## Tokens

All in `site/app/styles/tokens.css`. Use these names in new CSS.

- **Surfaces:** `--c-canvas` (page), `--c-surface` (cards, code, menus), `--c-raised` (fills inside a surface, block heads), `--c-sunken` (wells), `--c-overlay` (translucent header).
- **Text:** `--c-fg` (headings, primary), `--c-fg-2` (body on surfaces), `--c-fg-3` (secondary and metadata, 4.5:1 or better), `--c-fg-4` (placeholders, decorative only).
- **Lines:** `--c-line` (hairlines), `--c-line-2` (stronger hairline, hover edges), `--c-edge` (control boundaries that must reach 3:1).
- **Roles:** `--c-primary`, `--c-on-primary`, `--c-primary-hover`, `--c-fill` and `--c-fill-2` (neutral selected/pressed tints), `--c-signal` (green state), `--c-signal-bright` (the LED), `--c-focus`, `--c-warm` and `--c-warm-soft`, `--c-danger` and `--c-on-danger`, section hues `--s-inv --s-db --s-think --s-ecmd --s-dcmd --s-recipe`.
- **Depth:** `--shadow-1` (resting control), `--shadow-2` (card), `--shadow-3` (popover, menu), `--shadow-inset`.
- **Type:** `--font-body`, `--font-display`, `--font-mono`; sizes `--type-display --type-h1 --type-h2 --type-h3 --type-lead --type-body --type-sm --type-xs --type-micro --type-code`, each with `--lh-*` and, for headings, `--tr-*` tracking; weights `--weight-regular/medium/semibold/bold`.
- **Space:** `--space-1` to `--space-24` on a 4px grid (1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24).
- **Shape:** `--radius-xs` 4, `--radius-sm` 6, `--radius-md` 10, `--radius-lg` 14, `--radius-xl` 20, `--radius-pill`.
- **Layout:** `--container`, `--gutter`, `--measure`, `--read`, `--header-h`, `--control-h`, `--control-h-sm`, `--control-h-lg`, `--tap`.
- **Motion:** `--ease-out`, `--ease-in-out`, `--ease-standard`; `--dur-instant` 80ms (press), `--dur-fast` 140ms (hover), `--dur-base` 200ms (copy state), `--dur-slow` 260ms (menus, search), `--dur-page` 320ms (content transitions); `--travel` (1, or 0 under reduced motion).

The older `--color-*`, `--space-xs…2xl`, `--text-*`, `--lift*`, `--led*` and `--accent-*` names still work and resolve to the tokens above. Don't add new uses of them.

## Stylesheets and owners

`site/app/globals.css` is only an index. It imports these `site/app/styles/*.css` files in this order, and the order is part of the cascade (later files win ties). Every lane has its own file; edit only yours.

| File | Holds | Owner |
|---|---|---|
| `tokens.css` | Custom properties only: colour, type, space, shape, depth, motion, legacy aliases, the stage palette | W1 design system |
| `base.css` | Element defaults, focus, selection, container, skip link, reduced motion | W1 |
| `primitives.css` | Buttons, copy, chips, tags, inputs, kbd, menus, stars, dots, LED, code blocks, text utilities | W1 |
| `shell.css` | Icon buttons, header, navigation, phone menu sheet, footer | W2 shell |
| `search.css` | Header search field and results popover | W3 search |
| `layout.css` | Page scaffolding: `.page`, `.page-head`, `.section`, `.list`, `.grid` | W1 |
| `library.css` | Cards, tiles, prompt and skill cards, starting points, browse index | W4 prompt browsing |
| `skills.css` | Selectors only skills and kits pages use (`.sec-head`, kit rows) | W6 skills and kits browsing |
| `detail-prompt.css` | Prompt-only detail blocks | W5 prompt detail |
| `detail-skill.css` | Facts, credit, prose, two-column detail, kit contents, kit install | W7 skill and kit detail |
| `guide.css` | Start and Learn guides, welcome offer | W8 |
| `reading.css` | About, Privacy, Terms | W10 accounts and utility pages |
| `account.css` | Sign in, Collections | W10 |
| `quiet.css` | The dark stage behind `/install` | W9 install |
| `overrides.css` | The 10 grouped rules whose selectors span several lanes' files. Loads last so they keep winning as they did in the single file | Coordinator |

A rule in `overrides.css` belongs to the coordinator. To change one, ask; the coordinator may move it into your file once the screenshot gate shows no change.

Route-only CSS stays beside its route: `app/launch.css` (Home, Fable), `app/install/install.css` (W9), `app/start/start.css` and `app/fix/fix.css` (W8). A lane that needs new page CSS for one route adds a colocated file for it instead of growing a shared file.

Both splits from the old single `globals.css` were mechanical. Rules moved only where the cascade order of every overlapping rule stayed the same, and production-build captures (16 routes; desktop light and dark, phone light, plus phone dark for two routes; 50 images) were pixel-identical before and after.

## Lanes and their files

| Lane | Files |
|---|---|
| W1 design system | `tokens.css`, `base.css`, `primitives.css`, `layout.css`, `app/design-system/**` (the contract page, `noindex`, not in the sitemap), `components/ui/**`, `CopyButton.tsx`, `Crumbs.tsx`, `Pop.tsx`, `DESIGN.md` (not the Homepage section), `app/layout.tsx` fonts and theme colour, this file |
| W2 shell | `Nav.tsx`, `NavLinks.tsx`, `NavMenu.tsx`, `AuthNav.tsx`, `Footer.tsx`, `components/shell/**`, `shell.css`, `app/layout.tsx` body structure, `app/not-found.tsx`. `AtlasScopeLogo.tsx` is generated and never hand-edited |
| W3 search | `Search.tsx`, `components/search/**`, `search.css`, `app/api/search/route.ts`, `lib/search.ts`. W2 renders `<Search />` and owns the slot's size, position and breakpoints |
| W4 prompt browsing | `app/prompts/page.tsx`, `components/prompts/AreaPage.tsx`, `components/prompts/browse/**`, `Cards.tsx`, `ScardMore.tsx`, `library.css` |
| W5 prompt detail | `components/prompts/PromptPage.tsx`, `components/prompts/detail/**`, `SaveMenu.tsx`, `Star.tsx`, `StarIcon.tsx`, `detail-prompt.css` |
| W6 skills and kits browsing | `app/skills/page.tsx`, `app/kits/page.tsx`, `KitRows.tsx`, `components/skills/browse/**`, `skills.css` |
| W7 skill and kit detail | `app/skills/[name]/page.tsx`, `app/kits/[kit]/page.tsx`, `components/skills/detail/**`, `detail-skill.css` |
| W8 Start, Learn and Fix | `app/start/**` (with `start.css`), `app/learn/**`, `app/fix/**`, `GuideProgress.tsx`, `StartWelcome.tsx`, `components/guide/**`, `guide.css` |
| W9 install | `InstallPage.tsx`, `components/install/**`, `app/install/**`, `quiet.css`. Never `install-choice.ts` or the handoff timing |
| W10 accounts and utility | `app/account/**`, `app/collections/**`, `app/sign-in/**`, `CollectionsView.tsx`, `ActionForm.tsx`, `components/auth/**`, `components/account/**`, `lib/clerk-appearance.ts`, `app/{about,privacy,terms,mcp-setup}/**`, `DocPage.tsx`, `reading.css`, `account.css` |
| Coordinator | `overrides.css`, `globals.css` (the import order), `lib/site.ts`, `lib/content.ts`, `lib/copy.ts`, `install-choice.ts`, `app/mcp/route.ts`, `next.config.ts`, `proxy.ts`, `package.json` |

Need a change in a file you don't own? Ask its owner with the exact selector or prop. Don't patch around it with a higher-specificity override in your own file.

## Smoke tests

Smoke files in `site/tests/smoke/` run in parallel, and each starts its own `next start`, so each needs its own port. Ports count down from 3999. Claim one here in the same pull request that adds the file.

| Port | File |
|---|---|
| 3999 | `journeys.smoke.mjs` |
| 3998 | `install.smoke.mjs` |
| 3997 | `library.smoke.mjs` |
| 3996 | `browse.smoke.mjs` |
| 3995 | `guides.smoke.mjs` |
| 3994 | `account.smoke.mjs` |
| 3993 | `design-system.smoke.mjs` |
| 3992 | `skill-kit-detail.smoke.mjs` |

## Frozen APIs

These are used across page families and by the homepage handoff. Their exported names, props and output must not change without the coordinator's sign-off. Styling around them is fine.

- `components/Cards.tsx`: `PromptCard`, `PromptCards({ slugs, rank })`, `SkillCards({ names, kit })`, `StartCard`, `firstSentence`.
- `components/CopyButton.tsx`: `CopyButton({ text, label, className, icon, name })`, its `data-copied` attribute (set while "Copied" shows), its `data-blocked` attribute (set while "Copy blocked: select the text" shows) and its live-region label text. Each press clears the previous state first, so a repeat result sets the attribute again. React to the attributes, not the label.
- `lib/copy.ts`: everything. It composes the exact prompt payloads people copy.
- `lib/site.ts`: `SITE`, `INSTALL_MESSAGE`, `kitInstallMessage`, `AGENTS` (install commands), `KITS`, `KIT_GUIDE`, `installMd`. Install commands and messages are byte-for-byte contracts.
- `components/install-choice.ts`: the Home to Install handoff (`saveHandoff`, `readHandoff`, `clearHandoff`, `lastAgent`, `commandFor`, `AGENT_KEY` and the session key it writes). Fable's homepage track depends on it.
- URLs, markdown twins (`/…​.md`, `/llms.txt`, `/llms-full.txt`), `sitemap.ts`, `robots.ts`, metadata titles and canonicals.

## Off limits

The homepage artwork, renderer and composition (`components/orbit/`, `components/LaunchHero.tsx`, `app/launch.css`, `app/page.tsx`) and the Home to Install transition belong to Fable's track. The `:root:has(.home, .quiet)` blocks in `tokens.css` and `primitives.css` keep the stage palette and button look as they were on `main`, so the homepage does not change underneath that work.

## Install and shared shell: the boundary with Fable

Home, its renderer and the Home to Install transition are Fable's. The interior pages, the Install body and the shared shell are ours. Where they meet:

| Area | Owner | Files and selectors |
|---|---|---|
| Homepage scene, words and Install button | Fable | `app/page.tsx`, `components/LaunchHero.tsx`, `components/orbit/**`, `app/launch.css` (`.launch*`, `.launch[data-leave]`), `lib/hero-blur.ts`, `HERO` in `lib/site.ts` |
| Home's header look | Fable decides; held as on main | The `:root:has(.home)` block in `shell.css` (solid bar, grey separator, lit bottom line, green light after the name, outlined field, Sign in ring). Kept here only so Home doesn't change while Fable works. Fable may change or take over that block. |
| Stage palette and button look | Fable decides; held as on main | The `:root:has(.home, .quiet)` blocks in `tokens.css` and `primitives.css`. They also cover /install. |
| Shared shell and branding | Ours | `components/Nav.tsx`, `components/Footer.tsx`, `shell.css` outside the Home block, the #150 logo (`AtlasScopeLogo.tsx` is generated by `design/atlasscope/source/export_site.py`; `LogoPixelGrid.tsx`, `.aslogo*`, `.wordmark*`, `.foot__logo`). |
| Install body | Ours (W9) | `app/install/page.tsx`, `app/install/install.css` (`.inst*`), `components/InstallPage.tsx`, `quiet.css` (`.quiet`, /install only). |
| The hand-off between them | Shared contract; change only together | `components/install-choice.ts` |

The hand-off, in order:

1. Home's Install button copies `INSTALL_MESSAGE` (`lib/site.ts`) inside the click. While `.launch[data-leave]` plays, `saveHandoff()` writes `{ message: true }` or `{ blocked: true }` with a timestamp to `sessionStorage["agent-kit:copied"]`. Then it calls `router.push("/install")`. Leaving the hand-off early calls `clearHandoff()`.
2. /install reads it with `readHandoff()` in a layout effect. The note is trusted for 10 seconds and read without being removed, so a remount still finds it. A `{ message }` note shows Copied at once. A `{ blocked }` note selects the message for a manual copy. Either one moves focus to the h1 and announces the result 600ms later. A note with any other shape claims nothing.
3. The arrival hooks on `main.quiet.inst` are:
   - `data-arrived`: set when a fresh note was read.
   - `data-load`: set by an inline script on a full page load only.
   - `data-agent`: the saved agent tab, set before paint.
   - `data-picked`: set once the visitor picks a tab.
   - `html[data-os]`: the paste keys, set before paint by `OS_SCRIPT`.
4. `.inst[data-arrived]:not([data-load]) .inst__in` plays the one settle (`inst-arrive`, 360ms, 1ms with reduced motion). Fable can restyle the landing through these hooks. Nothing else on /install should depend on how the visitor got there.
5. Both pages are dark in both themes, and `themeColor` is `#020302` on /install. `/#install` redirects to /install before paint (Home's inline script).

To change the note's shape, its key, its 10-second window or the arrival attributes, change `install-choice.ts`, `LaunchHero.tsx` and `InstallPage.tsx` in the same pull request, with Fable and W9 both reviewing.

## Rules for page families

1. Use tokens, never raw values. Colours come from `--c-*` (or, in older CSS, the `--color-*` aliases). Sizes from `--type-*`, spacing from `--space-N`, radii from `--radius-*`, durations from `--dur-*`. A raw hex or pixel value in a page file needs a comment saying why.
2. Use primitives before writing new controls: `.btn` (`--primary`, default, `--ghost`, `--danger`, `--sm`, `--lg`), `.iconbtn`, `.input`, `.chip`, `.tag`, `.kbd`, `.block` (code with a head and Copy), `.cmdline`, `.menu__pop`, `.led`, and `FloatingCopy` (`components/ui/FloatingCopy.tsx`: `FloatingCopy({ anchor, end?, target?, text, title, detail?, name?, label? })`, a fixed Copy bar that shows at the first pixel `anchor` slides under the header and hides again once `end` does; under the header on a computer, along the bottom on a phone; inert while hidden; a blocked press of the bar scrolls `target` (or `anchor`) back into view, selects `target`'s text and focuses it (without a target, the anchor's first control or the anchor), and the bar stays up while its "Copied" or "Copy blocked" message shows and while keyboard focus is in it; styled by `.fcopy`. Render the refs with the bar, since their refs are read on mount). If a primitive is missing, ask for it.
3. Colour means something. Green (`--c-signal`) only for a state that is true now: copied, tested, finished, current. Never a fill, a wash, a border glow or a large text colour. Amber (`--c-warm`) for what the visitor kept or chose. Red only for destructive actions and errors. The main action is neutral (ink on light, white on dark).
4. Hairlines before shadows, flat before glass. No gradients, glows, neon edges or decorative blur on interior pages.
5. One `h1` per page in the display face; `h2`/`h3` in the body face at the token sizes.
6. Hover only on `(hover: hover) and (pointer: fine)`. Touch targets at least 44px on `(pointer: coarse)`. Every interactive element keeps the global focus ring.
7. Motion answers a press. Use `--dur-*` and `--ease-out`; multiply translate distances by `var(--travel)` so reduced motion removes travel. Nothing on an interior page animates by itself.
8. Keep copy, payloads, counts, attribution and URLs exactly as they are. This redesign does not rewrite content.
9. Light and dark both ship. Check every change in both, at 390px and 1440px, before asking for review.
10. Evidence with every merge request: before and after captures at matching sizes, and which checks you ran.
