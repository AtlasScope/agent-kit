# Design contract for the site redesign

The working agreement between the lanes that redesign `site/`. It says which files each lane may edit, which APIs are frozen, and the rules every page family follows so the site reads as one product. `DESIGN.md` remains the long-form design record; this file is the short contract.

Integration branch: `redesign/integration`. Design-system branch: `redesign/design-system`. Page lanes branch from `redesign/integration` and merge back into it, never into `main`.

## Stylesheets

`site/app/globals.css` is only an index. It imports `site/app/styles/*.css` in this order, and the order is part of the cascade (later files win ties):

| File | Holds | Owner |
|---|---|---|
| `tokens.css` | Custom properties only: colour, type, space, shape, depth, motion, legacy aliases | Design system |
| `base.css` | Element defaults, focus, selection, container, skip link, reduced motion | Design system |
| `primitives.css` | Buttons, copy, chips, tags, inputs, kbd, menus, stars, dots, LED, code blocks | Design system |
| `shell.css` | Header, navigation, menu sheet, header search field and results, footer | Design system (search results: search lane, see below) |
| `layout.css` | Page scaffolding: `.page`, `.page-head`, `.section`, `.sec-head`, `.list`, `.grid` | Design system |
| `guides.css` | Start and Learn guides, welcome offer | Start/Learn/Fix lane |
| `docs.css` | About, Privacy, Terms | Utility lane |
| `account.css` | Sign in, Collections | Collections/account lane |
| `quiet.css` | The dark stage behind `/install` and `/start` | Install lane, coordinated with Fable |
| `library.css` | Tiles, rows, prompt and skill cards, starting points, browse index | Prompt browsing lane (cards shared with skills browsing, see Cards.tsx) |
| `detail.css` | Facts, credit, prose, two-column detail, kit contents, kit install | Detail lanes (prompt detail and skill/kit detail share it; coordinate) |

Route-only CSS stays beside its route: `app/launch.css` (Home, Fable), `app/install/install.css` (Install), `app/start/start.css` (Start). A lane that needs new page CSS adds a colocated file for its route (for example `app/fix/fix.css`, imported from that route's page) instead of growing a shared file.

The split from the old single `globals.css` was mechanical: rules moved between files only where the cascade order of every overlapping rule stayed the same, and 32 production-build captures (10 routes, desktop and phone, light and dark) were pixel-identical before and after.

## Shared files only the design system edits

- `site/app/layout.tsx`
- `site/app/globals.css` and `site/app/styles/{tokens,base,primitives,shell,layout}.css`
- `site/components/Nav.tsx`, `NavLinks.tsx`, `NavMenu.tsx`, `Footer.tsx`, `AtlasScopeLogo.tsx` (generated, never hand-edited), `CopyButton.tsx`, `Crumbs.tsx`, `Pop.tsx`
- `DESIGN.md`, this file

Need a change in one of these? Ask the design-system lane with the exact selector or prop you need. Don't patch around it with a higher-specificity override in your own file.

`site/components/Search.tsx` and the `.search`/`.results` rules in `shell.css` belong to the search lane once it starts. The header slot it sits in (size, position, breakpoints) stays with the design system.

## Frozen APIs

These are used across page families and by the homepage handoff. Their exported names, props and output must not change without the coordinator's sign-off. Styling around them is fine.

- `components/Cards.tsx`: `PromptCard`, `PromptCards({ slugs, rank })`, `SkillCards({ names, kit })`, `StartCard`, `firstSentence`.
- `components/CopyButton.tsx`: `CopyButton({ text, label, className, icon, name })`, its `data-copied` attribute and its live-region label text.
- `lib/copy.ts`: everything. It composes the exact prompt payloads people copy.
- `lib/site.ts`: `SITE`, `INSTALL_MESSAGE`, `kitInstallMessage`, `AGENTS` (install commands), `KITS`, `KIT_GUIDE`, `installMd`. Install commands and messages are byte-for-byte contracts.
- `components/install-choice.ts`: the Home to Install handoff (`saveHandoff`, `readHandoff`, `clearHandoff`, `lastAgent`, `commandFor`, `AGENT_KEY` and the session key it writes). Fable's homepage track depends on it.
- URLs, markdown twins (`/…​.md`, `/llms.txt`, `/llms-full.txt`), `sitemap.ts`, `robots.ts`, metadata titles and canonicals.

## Off limits

The homepage artwork, renderer and composition (`components/orbit/`, `components/LaunchHero.tsx`, `app/launch.css`, `app/page.tsx`) and the Home to Install transition belong to Fable's track. The `:root:has(.home, .quiet)` token block in `tokens.css` keeps the stage palette as it was on `main` so the homepage does not change underneath that work.

## Rules for page families

1. Use tokens, never raw values. Colours come from `--c-*` (or, in older CSS, the `--color-*` aliases). Sizes from `--type-*`, spacing from `--space-N`, radii from `--radius-*`, durations from `--dur-*`. A raw hex or pixel value in a page file needs a comment saying why.
2. Use primitives before writing new controls: `.btn` (`--primary`, default, `--ghost`, `--danger`, `--sm`, `--lg`), `.iconbtn`, `.input`, `.chip`, `.tag`, `.kbd`, `.block` (code with a head and Copy), `.cmdline`, `.menu__pop`, `.led`. If a primitive is missing, ask for it.
3. Colour means something. Green (`--c-signal`) only for a state that is true now: copied, tested, finished, current. Never a fill, a wash, a border glow or a large text colour. Amber (`--c-warm`) for what the visitor kept or chose. Red only for destructive actions and errors. The main action is neutral (ink on light, white on dark).
4. Hairlines before shadows, flat before glass. No gradients, glows, neon edges or decorative blur on interior pages.
5. One `h1` per page in the display face; `h2`/`h3` in the body face at the token sizes.
6. Hover only on `(hover: hover) and (pointer: fine)`. Touch targets at least 44px on `(pointer: coarse)`. Every interactive element keeps the global focus ring.
7. Motion answers a press. Use `--dur-*` and `--ease-out`; multiply translate distances by `var(--travel)` so reduced motion removes travel. Nothing on an interior page animates by itself.
8. Keep copy, payloads, counts, attribution and URLs exactly as they are. This redesign does not rewrite content.
9. Light and dark both ship. Check every change in both, at 390px and 1440px, before asking for review.
10. Evidence with every merge request: before and after captures at matching sizes, and which checks you ran.
