# Site redesign: code audit and workstreams

Planning record for the parallel redesign of the public site (`site/`). Checked against `origin/main` at `118506c` on 2026-11-24. No site code was changed to write it.

Sources: the repository, the Vercel project's deployment list, and the Drive design dossier v0.9 (READ FIRST, the Space archive's "Parallel site-wide implementation" section, and the cloud coordinator prompt). Where the dossier and this file differ on decomposition, this file adapts the dossier to the code as it is; the dossier's creative direction stands.

## 1. Framework and build

- Next.js 16 App Router, React 19, TypeScript, no CSS framework. Plain CSS, global, in four files (section 3).
- Fonts via `next/font/google` in `app/layout.tsx`: Geist (body), Montserrat 600 (display), Geist Mono.
- Content is built, not fetched: `scripts/build-content.mjs` reads `library/library.json`, every `kits/*/plugins/*/skills/*/SKILL.md`, `THIRD_PARTY.md` files and `CREDITS.md`, and writes `site/content/generated.json` (gitignored, ~2.1 MB). `predev`, `prebuild` and `pretest` run it. Current build: 282 listed prompts (308 pages), 33 areas, 66 skills (49 borrowed), 5 kits, 19 fix pages, 6 sections (`work, inv, plan, ecmd, dcmd, recipe`).
- Dependencies of note: `@clerk/nextjs` (accounts), `@neondatabase/serverless` (collections), `@vercel/analytics`, `@vercel/edge-config`, `marked`, `mcp-handler`. Playwright 1.63.0 is a dev dependency for smoke tests.
- `next.config.ts`: redirects (old `/prompts/A01` ids, retired and renamed areas, and account pages on `*.vercel.app` to production), `X-Robots-Tag: noindex` on `*.vercel.app`, and rewrites for markdown twins (`/prompts.md`, `/prompts/<slug>.md`, etc.).
- `proxy.ts`: Clerk middleware only on `/account`, `/collections`, `/sign-in`, `/api`. Library pages stay static.

## 2. Routes and their source files

| Route | Page file | Components and styles it pulls in |
|---|---|---|
| `/` | `app/page.tsx` | `LaunchHero`, `components/orbit/**`, `app/launch.css`, `lib/hero-blur.ts`, `HERO` in `lib/site.ts`. **Fable.** |
| `/install` | `app/install/page.tsx` | `InstallPage`, `install-choice.ts`, `AgentMark`, `app/install/install.css`, `AGENTS`/`INSTALL_MESSAGE` in `lib/site.ts` |
| `/start`, `/start/[step]` | `app/start/page.tsx`, `app/start/[step]/page.tsx` | `GuideProgress`, `StartWelcome`, `CopyButton`, `Crumbs`, `app/start/start.css`, `lib/start.ts` |
| `/learn`, `/learn/[lesson]` | `app/learn/**` | `GuideProgress`, `CopyButton`, `Crumbs`, `lib/lessons.ts` |
| `/prompts` | `app/prompts/page.tsx` | `Cards` (`StartCard`, `PromptCards`), `Crumbs`, `lib/starts.ts` |
| `/prompts/[slug]` (area page **and** prompt detail in one file) | `app/prompts/[slug]/page.tsx` (`AreaPage`, `PromptPage`) | `Cards`, `CopyButton`, `SaveMenu`, `Crumbs`, `lib/copy.ts` |
| `/skills`, `/skills/[name]` | `app/skills/**` | `Cards` (`SkillCards`), `CopyButton`, `SaveMenu`, `Crumbs` |
| `/kits`, `/kits/[kit]` | `app/kits/**` | `KitRows`, `Cards`, `CopyButton`, `Crumbs`, `KITS`/`KIT_GUIDE` in `lib/site.ts` |
| `/fix`, `/fix/[problem]` | `app/fix/**` | `Cards`, `Crumbs` |
| `/mcp-setup` | `app/mcp-setup/page.tsx` | `CopyButton`, `Crumbs` |
| `/about`, `/privacy`, `/terms` | `app/{about,privacy,terms}/page.tsx` | `DocPage` |
| `/sign-in` | `app/sign-in/[[...sign-in]]/page.tsx` | `auth/SignInForm`, `lib/clerk-appearance.ts` |
| `/account`, `/collections/[id]` | `app/account/{page,actions}.ts(x)`, `app/collections/[id]/page.tsx` | `CollectionsView`, `ActionForm`, `Pop`, `lib/collections.ts`, `lib/items.ts` |
| 404 | `app/not-found.tsx` | none |
| Machine routes | `app/api/search`, `app/api/me`, `app/mcp`, `app/md/**`, `app/llms*.txt`, `app/sitemap.ts`, `app/robots.ts` | `lib/search.ts`, `lib/markdown.ts`, `lib/md-response.ts`, `lib/mcp-guard.ts`. No visual change; must keep working. |

## 3. Shared components and styles

Global on every page (from `app/layout.tsx`): `Nav` (with `NavLinks`, `NavMenu`, `Search`, `AuthNav`, `AtlasScopeLogo`), `Footer`, `AuthGate`, the skip link, `Analytics`, and an inline signed-in hint script (`lib/auth-hint.ts`).

Used by several page families:

| File | Used by |
|---|---|
| `components/Cards.tsx` (`PromptCard(s)`, `SkillCards`, `StartCard`, `firstSentence`) | prompts hub, area pages, prompt detail, skills, skill detail, kit detail, fix detail, `CollectionsView` |
| `components/CopyButton.tsx` | prompt and skill detail, kit detail, start, learn, mcp-setup, `KitRows`, `CollectionsView` |
| `components/Crumbs.tsx` (also `JsonLd`, used by Home) | every interior page |
| `components/SaveMenu.tsx`, `Star.tsx`, `StarIcon.tsx`, `lib/me.ts` | prompt and skill detail, card stars |
| `components/GuideProgress.tsx` | start and learn |
| `components/AgentMark.tsx`, `install-choice.ts` | Home (`LaunchHero`) and `/install`: this is the Home→Install handoff contract |
| `lib/site.ts` | everything: `SITE`, `HERO` (Fable), `INSTALL_MESSAGE`, `AGENTS` (exact install commands), `KITS`, `KIT_GUIDE` |
| `lib/copy.ts` | builds the exact text a prompt copies. Treat as frozen. |

Styles:

- `app/globals.css` (771 lines, 11 lines over 300 chars). Light tokens on `:root`, dark under `prefers-color-scheme`, then an ink block `.ink, :root:has(.home, .quiet)` that forces the header, Home, `/install` and `/start` hub dark. After the base sections (Nav, Buttons, Library pages, Footer, Detail pages, Menu, Guide, Reading, Sign in, Collections) come dated override layers that cut across all of them: "Library look (2026-11-09)", "Polish (2026-11-10)", "Motion", "LED green", "Large screens", "Wide-colour finish" (P3), "Green as the one accent". Selectors from early sections are restyled near the end of the file, so the cascade order matters.
- `app/launch.css` (Home only, Fable), `app/install/install.css`, `app/start/start.css`.
- `DESIGN.md` at repo root documents tokens and components, and Fable's PR #124 edits it.

The design system lives in `globals.css`, `DESIGN.md` and the ink block. Changing a token in the ink block changes Home.

## 4. Data sources

All public data comes from `content/generated.json` through `lib/content.ts` (`prompts`, `listed`, `areas`, `sections`, `skills`, `kits`, `fixes`, `counts`, `authors()`, `copyText`, `skillInstall`). Starting points are in `lib/starts.ts`, the guide in `lib/start.ts`, lessons in `lib/lessons.ts`, and kit install text in `lib/site.ts`. Page work must not edit the source data (`library/`, `kits/`). That is the Keen and skills initiative.

## 5. Search

- `lib/search.ts` holds `makeSearch(prompts, skills)`, a pure weighted field ranker with stemming and an `INTENTS` synonym table that boosts named results. `tests/search.test.mjs` benchmarks it.
- `app/api/search/route.ts` returns the top 8, edge-cached for a day.
- The `/mcp` server uses the same `search()`, so a ranking change also changes MCP answers.
- `components/Search.tsx` is the header combobox: `/` focuses it, arrows, Enter and Escape work, results are real links, a polite live region announces counts, and on phones it is a button-revealed overlay through the `agent-kit:search` event that `NavMenu` dispatches.
- It indexes prompts and skills only. Kits, fix pages, lessons and guide steps are not searchable. There is no loading or error state (fetch errors are swallowed) and no recent or empty-query view.

## 6. Accounts and collections

- Clerk handles sign-in and Neon Postgres stores collections (`db/schema.sql`: `collections`, `collection_items`, `mcp_usage`). Without keys the site hides accounts.
- `lib/collections.ts` (server), `app/account/actions.ts` (server actions), `app/api/me` with `lib/me.ts` (the client's saved state for stars), `AuthGate` (opens sign-in when a signed-out visitor saves), `CollectionsView`, `SaveMenu`.
- Copying never requires an account. Keep it that way.
- **Testing limit:** `next.config.ts` redirects `/sign-in`, `/account` and `/collections` on `*.vercel.app` to production, because Clerk's production instance only runs on atlasscope.dev. Vercel previews cannot show signed-in states. Signed-in evidence needs a local run with Clerk development keys, or it stays labeled unverified.

## 7. SEO and metadata

- Root `metadata` (title template, description built from counts, OG site name, `text/markdown` alternate) and a viewport in `layout.tsx`. 21 pages set `metadata` or `generateMetadata`, most with `alternates.canonical`.
- `Crumbs` emits BreadcrumbList JSON-LD. Home emits Organization JSON-LD.
- `sitemap.ts` (git dates), `robots.ts` (all crawlers allowed, ADR 0001), `llms.txt`, `llms-full.txt`, markdown twins under `app/md/**` built from `lib/markdown.ts`, and a static `opengraph-image.png`.
- Rule for every workstream: keep each page's `metadata` export, canonical, `<h1>`, breadcrumbs and JSON-LD. Don't touch `lib/markdown.ts` or `app/md/**`.

## 8. Tests and CI

- Unit tests (`npm test`): `tests/{copy,hero,install,kits,orbit,search,starts}.test.mjs`.
- Smoke (`npm run smoke`): `tests/smoke/journeys.smoke.mjs`, Chromium against `next start` at 1440x900 and 390x844 (touch), plus a tablet menu journey. It covers home install copy, header reach and search, prompt copy, the prompt hub, skill install commands, the first-app guide, and the menu. It asserts on selectors and copy text, so redesigns will break it on purpose. Each break needs an equivalent new assertion, not a deletion.
- CI (`.github/workflows/ci.yml`, job `ci`): on `site/` changes it runs content, typecheck, unit tests, `next build` and smoke. Required checks are `ci`, `osv` and `codeql`.
- No WebKit runs, no visual regression, no axe checks. Section 11 adds them as review-lane tooling, not CI changes.

## 9. Preview deploys

Vercel project `agent-kit` is connected to the repository through Vercel's Git integration. Every pushed branch gets a preview: the deployment list shows READY previews for `claude/orbit-art` and `claude/keen-creative-kernel`, and production is `main@118506c`. So each workstream branch and the integration branch get preview URLs without any setup. Previews are `noindex` and send account routes to production (section 6).

## 10. Fable's work to avoid

| Branch | State | What it touches |
|---|---|---|
| `claude/orbit-art`, PR #124 draft, head `bd86598` | Active today, 2 commits ahead of main | `components/orbit/**` (adds `climate.ts`, `governor.ts`), `LaunchHero.tsx`, `app/launch.css`, `DESIGN.md` (4 lines), `lab/**`, `scripts/orbit-*.mjs`, `public/hero/**`, `lib/hero-blur.ts`, `tests/orbit.test.mjs` |
| `claude/procedural-celestial-homepage-84cd07` | Merged as #123; the branch is leftover | Same orbit and hero files |
| Fable's local MacBook work | **Not visible from the cloud.** The dossier says it is researching new approaches. | Assume the whole Home surface and the handoff |

Do not edit these files in any workstream: `app/page.tsx`, `components/LaunchHero.tsx`, `components/orbit/**`, `app/launch.css`, `lab/**`, `scripts/orbit-*.mjs`, `scripts/build-hero-images.mjs`, `public/hero/**`, `lib/hero-blur.ts`, `tests/orbit.test.mjs`, `tests/hero.test.mjs`, `HERO` in `lib/site.ts`. The handoff contract is `components/install-choice.ts` (`saveHandoff`, `readHandoff`, `clearHandoff`, `SHOWN`, `AGENT_KEY`) and must keep its exports and storage keys.

Stale branches not to build on: `site-header-menu`, `site-homepage-rest`, `site/atlasscope-logo` (Nov 9–10, no merge base with main). Merged leftovers: `claude/site-green-blend-b`, `claude/library-explore`.

Indirect coupling to Home that stays even without touching Fable's files: the ink token block, `.top`/`.ink` header styles, `body:has(main.home) .foot { display: none }`, and `JsonLd` from `Crumbs.tsx`. Any shell or token change must be screenshotted on Home at desktop and phone before it merges.

## 11. Workstreams

Each workstream gets its own branch from the integration branch, its own Vercel preview, and exclusive write ownership of the files listed. Anything outside its list is read-only to it. A change needed in someone else's file goes to that owner as a small request, or to the coordinator if it is shared.

### Wave 0: enabling refactors (coordinator, on `redesign/integration`, before fan-out)

These remove the collisions that would otherwise make parallel work impossible. None changes what a page looks like. Gate: pixel-identical before/after screenshots of every route family at 1440 and 390, in light and dark.

1. **Split `globals.css` in cascade order.** Turn it into a list of `@import`s, in the original order, of `app/styles/{tokens,base,shell,search,library,skills,fix,detail-prompt,detail-skill,guide,reading,account,quiet,overrides}.css`. `skills.css` takes the selectors only skills and kits pages use, `fix.css` the symptom rows, and the `/start` hub's `.quiet` rules go to `app/start/start.css` so W8 doesn't depend on W9. A dated override layer moves into the family file whose selectors it targets only where the screenshot gate proves no change. Every layer that can't move goes into `overrides.css`, imported **last** and owned by the coordinator, so it still wins over the family files the way it does today.
2. **Split `app/prompts/[slug]/page.tsx`**: move `AreaPage` to `components/prompts/AreaPage.tsx` and `PromptPage` to `components/prompts/PromptPage.tsx`. The route file keeps `generateStaticParams`, `generateMetadata` and the dispatch.
3. **Create family folders** `components/{ui,shell,search,prompts,skills,guide,install,account}/` so new components land in owned space.
4. **Freeze shared APIs**: `Cards.tsx` exports, `CopyButton` props, `Crumbs`/`JsonLd`, `lib/content.ts` exports, `lib/copy.ts`, `lib/site.ts` (`AGENTS`, `INSTALL_MESSAGE`, `kitInstallMessage`), `install-choice.ts`. Workstreams may add new components but not change these signatures without the coordinator.
5. **Capture baseline** (handed to R1 below, runs in parallel with 1–4): production `main@118506c` screenshots for every route family at 1440x900 @2x, 1280x800, 820x1180 (iPad emulation), 390x844 (iPhone emulation), light and dark, plus search, menu and copy states.

### Implementation lanes

| # | Workstream | Exclusive files | Can start before the design contract |
|---|---|---|---|
| W1 | **Design system and contract** | `app/styles/tokens.css`, `app/styles/base.css`, `app/design-system/**` (the contract page), `components/ui/**` (new primitives: Button, IconButton, Row, Tag, Kbd, Disclosure, CodeBlock, Toast or inline status), `components/CopyButton.tsx`, `DESIGN.md` (new sections only; leave the Homepage section and Fable's lines alone), `app/layout.tsx` font setup only | It is the contract. Ships v1 first (type scale and optical sizes, the Orbital Neutral palette as tokens with light and dark, spacing, radii, surfaces, focus ring, motion durations, and the primitives on a `/design-system` route, `noindex` and excluded from the sitemap; not `/_design`, because App Router treats `_` folders as private and gives them no route). Must keep the ink block's effect on Home unchanged unless Fable agrees. |
| W2 | **Global shell: header, menu, footer** | `components/Nav.tsx`, `NavLinks.tsx`, `NavMenu.tsx`, `AuthNav.tsx`, `Footer.tsx`, `components/shell/**`, `app/styles/shell.css`, `app/layout.tsx` (body structure only), `app/not-found.tsx` | Yes. Compare a flat nav (Start, Prompts, Skills, Kits, Fix) with a Library disclosure on real layouts; add a compact Install action; keep the native-dialog menu, `/` hint, 44px taps and history behaviour. Can prototype on current tokens. `AtlasScopeLogo.tsx` is generated: read-only, no scaling. |
| W3 | **Search and command palette** | `components/Search.tsx`, `components/search/**`, `app/styles/search.css`, `app/api/search/route.ts`, `lib/search.ts`, `tests/search.test.mjs` | Yes, nearly all of it. Add a ⌘K/Ctrl-K palette alongside `/`, an empty state (starting points, recent searches in localStorage), loading and error states, and kind and section metadata. Kits, fix pages and lessons go into a **separate palette index** (for example `makePaletteIndex`), not into `search()`. `/mcp` (`app/mcp/route.ts`, coordinator-owned) and the current `Hit` type assume every non-prompt hit is a skill, so new kinds in `search()` would send agents to `/skills/<kit>` and `get_skill`. Ranking changes also change `/mcp`, so any existing benchmark that changes needs coordinator sign-off. Mounting point in the header: agree it with W2 (W2 renders `<Search />`, W3 owns what it renders). |
| W4 | **Prompt library browsing** | `app/prompts/page.tsx`, `components/prompts/AreaPage.tsx`, `components/prompts/browse/**`, `components/Cards.tsx` and `components/ScardMore.tsx` (owner; others request), `app/styles/library.css` | Yes. Job-first index with section and area navigation, scannable rows in place of the card grid, filters by mode and kind from existing fields (`mode`, `sec`, `tags`). Information architecture and markup can go ahead on current tokens. Keep `/prompts#dcmd` and every area slug. |
| W5 | **Prompt detail and copy** | `components/prompts/PromptPage.tsx`, `components/prompts/detail/**`, `components/SaveMenu.tsx`, `Star.tsx`, `StarIcon.tsx`, `app/styles/detail-prompt.css` | Yes. Exact payload first with stable copy feedback (success, blocked with select-all fallback), when to use, prerequisites and risks (`mode`, `avoid`, `skip`, `tools`), provenance, related items, and recipe steps. `lib/copy.ts` is read-only and `tests/copy.test.mjs` must stay green. |
| W6 | **Skills and kits browsing** | `app/skills/page.tsx`, `app/kits/page.tsx`, `components/KitRows.tsx`, `components/skills/browse/**`, `app/styles/skills.css` | Yes. Group by kit and by job, show agent compatibility and borrowed versus original with credit, keep every kit install command exactly. |
| W7 | **Skill and kit detail** | `app/skills/[name]/page.tsx`, `app/kits/[kit]/page.tsx`, `components/skills/detail/**`, `app/styles/detail-skill.css` | Yes. Purpose, compatibility, install paths (`skillInstall`), contents, rendered SKILL.md typography, credit and license. Commands copy exactly. |
| W8 | **Start, Learn and Fix journeys** | `app/start/**` (including `start.css`), `app/learn/**`, `app/fix/**`, `components/GuideProgress.tsx`, `StartWelcome.tsx`, `components/guide/**`, `app/styles/guide.css`, `app/styles/fix.css` | Yes. Progressive guide with a visible next step, the Fix flow from symptom to an ordered route, and progress kept as it works today. `lib/start.ts`, `lib/lessons.ts` and `lib/starts.ts` content is read-only (no copy rewrites). The `/start` hub's own `.quiet` rules move to `start.css` in wave 0. The rules shared with `/install` stay in W9's `quiet.css`; W8 asks W9 for changes there. |
| W9 | **Direct install page (gated)** | `components/InstallPage.tsx`, `components/install/**`, `app/install/install.css`, `app/install/page.tsx`, `app/styles/quiet.css` (the rules `/install` and `/start` share; W9 owns it) | Proposal first. Fable owns the Home→Install motion and may be changing it locally. W9 builds the quiet page body (one paste action, truthful inline feedback, manual commands behind a disclosure) without touching `install-choice.ts`, the `readHandoff` effect, or timing. It merges only after the coordinator confirms with Fable that there is no overlap. `AGENTS` and `INSTALL_MESSAGE` are read-only. |
| W10 | **Accounts, collections and utility pages** | `app/account/**` (presentation only; actions keep their behaviour), `app/collections/**`, `app/sign-in/**`, `components/CollectionsView.tsx`, `ActionForm.tsx`, `Pop.tsx`, `components/auth/**` (presentation), `lib/clerk-appearance.ts`, `app/{about,privacy,terms,mcp-setup}/**`, `components/DocPage.tsx`, `components/account/**`, `app/styles/{reading,account}.css` | Yes. Make collections a returning-user workspace and give reading pages editorial typography. No legal text changes, no new backend, no gating of public copying. Signed-in work needs local Clerk development keys (section 6). |

Shared-file rules:

- `app/layout.tsx`: W1 owns the font imports and W2 owns the body markup. Anything else goes through the coordinator.
- `tests/smoke/journeys.smoke.mjs`: coordinator-owned. Workstreams add `tests/smoke/<lane>.smoke.mjs`, and a lane that breaks an existing journey sends the coordinator the replacement assertion.
- `lib/site.ts`, `lib/content.ts`, `lib/copy.ts`, `install-choice.ts`, `app/mcp/route.ts`, `app/styles/overrides.css`, `next.config.ts`, `proxy.ts`, `package.json`: coordinator only. No new dependencies without sign-off.
- `DESIGN.md`: W1 only, in sections that don't overlap Fable's edits in PR #124.

### Review lanes (did not implement what they review)

| # | Lane | Scope |
|---|---|---|
| R1 | **Baseline capture, then mobile, accessibility and interaction QA** | Owns `.artifacts/` captures and a `tests/qa/` harness (Playwright Chromium and WebKit, iPhone and iPad device emulation, axe, reduced motion, light and dark, 200% zoom, keyboard-only journeys, clipboard grant and deny). Runs the baseline in wave 0, then reviews each lane's preview. Labels everything as emulation. Physical iPhone, iPad and Safari runs come later on the founder's devices. |
| R2 | **Visual critique, performance and integration review** | Compares lanes against the W1 contract and the dossier (no generic card grids, glass, neon or decorative gradients), measures Lighthouse and Web Vitals on previews, checks bundle size changes, and reviews the integration branch as one site. Sends weak work back to its lane. |

### Order

```
Wave 0 (coordinator)  globals split, prompt page split, folders, API freeze  ─┐
R1 baseline captures (parallel with wave 0)                                   ─┤
                                                                               ▼
W1 contract v1 ──────────────► W1 refines with lane feedback
W2…W10 start now on structure, IA, behaviour, current tokens only ──► adopt contract v1 tokens and primitives
                                                                               ▼
R1 and R2 review each lane preview ──► lanes refine ──► coordinator merges into redesign/integration
                                                                               ▼
W9 merges only after Fable confirms no handoff overlap; then a final R2 pass on the integration preview
```

Before contract v1 lands, lanes may change markup, information architecture, routes' internal structure, interactions and copy placement, and use only existing tokens. They must not introduce new colours, font sizes, shadows or radii as literals. After v1, they consume `tokens.css` and `components/ui/**` and nothing else.

## 12. How this maps to the dossier's decomposition

| Dossier workstream | Here |
|---|---|
| Creative direction and shared design system | W1 |
| Global navigation, responsive shell, footer | W2 |
| Search and keyboard-first discovery | W3 |
| Prompt library browsing | W4 |
| Prompt detail and copy interactions | W5 |
| Skills and kits browsing | W6 |
| Skill and kit detail | W7 |
| Start, Learn and Fix | W8 |
| Direct installation experience | W9 (gated on Fable) |
| Collections, accounts, utility pages | W10 |
| Mobile, accessibility and interaction QA | R1 (also runs the baseline) |
| Visual critique, performance, integration | R2 |

Adjustments to the dossier's list, all driven by the code: wave 0 exists because `globals.css` and `app/prompts/[slug]/page.tsx` would otherwise force several lanes into one file. `Cards.tsx` has a single owner (W4) because six routes and `CollectionsView` render it. Fix joined Start and Learn because it is a short symptom-to-route flow on library components. The quiet-page styles that `/start` and `/install` share sit with W9, and the `/start` hub's own rules move to W8's `start.css`.

## 13. Open risks

- **Fable's local work is invisible.** The coordinator should ask the founder to confirm Fable's current branch before W2 or W1 merge any change that reaches Home through the ink block or header, and before W9 merges.
- **Signed-in states can't be verified on previews.** W10 and R1 need Clerk development keys locally, or that evidence stays labeled unverified.
- **Search ranking feeds `/mcp`.** Ranking changes need benchmark sign-off.
- **The globals split is the riskiest wave-0 step** because of cross-cutting override layers. The screenshot gate decides it. If a layer can't be moved without a visual diff, it goes to `overrides.css`, imported last, so the cascade is unchanged.
- **Smoke tests assert copy and selectors.** Expect intentional breaks, and replace each one with an equivalent assertion.
- **PRODUCT.md trust issues** (untested beginner guide, non-Claude install paths, draft privacy notice next to analytics) are product questions. Lanes must not rewrite those claims.
