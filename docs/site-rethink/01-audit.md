# Site audit, before the rethink

Date: 2026-11-09. Phase 1 of the site rethink. Nothing was changed in the site for this audit.

## How this was checked

- Ran the site locally from `main` and loaded 29 routes at 1440 px and 390 px wide in Chromium (dark theme), recording status, headings, page length, link count and sideways overflow, with a screenshot of each.
- Read the code for the header, homepage, `/start`, `/learn`, `/account`, `/collections` and the MCP setup page.
- Checked the live site's response for `/privacy`, `/terms`, `/about`, `/account` and `/sign-in`.
- Measured the header logo at device scale 1, 1.25, 1.5 and 2 and enlarged each capture six times with no smoothing.

Limits: the local copy has no Clerk or database keys, so `/account`, `/sign-in` and `/collections/<id>` return 404 locally. The signed-in walk is from the code and from the live site's signed-out behaviour. Nobody signed in for this audit. The light theme was read in the CSS, not walked page by page.

## The three people

- **Beginner**: has never used an AI coding agent. Does not know what an agent, skill, prompt, plugin or MCP server is.
- **Developer**: uses an agent daily, wants one specific prompt or skill, and wants to copy or install it and leave.
- **Returning user**: signed in, has starred items and collections, comes back to reuse them.

## What each page is for, and where each person gets lost

| Page | Its job | Beginner | Developer | Returning user |
|---|---|---|---|---|
| `/` | Say what Agent Kit is and get it installed | Lost at once. The first things on the page are `/database`, `/design`, `/engineer` and `npx skills add`, with no line saying what an agent or a skill is. The only way to the beginner guide is the word "Start" in the header. | Mostly served: install command is high on the page. The six agent tabs and two lines of small print under the command slow the first read. | Nothing on the page is for them. Their saved items are behind a header button. |
| `/start` and its 8 steps | Take someone from nothing installed to a small app at a public address | The best page on the site for this person. Three problems: it says what an agent is only inside step 1; the need for a paid Claude plan appears only inside step 1; and the page itself says it has not been tested with a first-time user. | Not for them, and correctly offers "I already use an agent". | Not for them. |
| `/learn` and its 5 lessons | Explain agents, asking, prompts, skills and checking a change | Hard to find. It is not in the header or the footer; the only links are at the bottom of `/start` and after step 8. The lesson "What a coding agent does" comes after the reader has already built and published an app. | Not for them. | Not for them. |
| `/prompts` | Browse all 239 prompts | Overwhelming. | The page is 21,700 px tall on desktop and 59,400 px on a phone, with 553 links and no filter on the page. The "Best starting points" cards at the top are good. Finding one known prompt depends on header search. | No way to see only their starred prompts here. |
| `/prompts/<area>` and `/prompts/<prompt>` | One area, or one prompt with a Copy button | Prompt pages are clear once reached. | Good: Copy is the first action, with what it returns and when to skip it. Area pages and prompt pages share one URL level, which is fine as long as slugs never clash (the build already stops if they do). | Star and "Save to" are here. |
| `/skills` | Browse all 61 skills | Skill names are folder names (`animate-expo`, `ask-sonner`) and the descriptions are written for an agent ("Use when the user wants to..."), cut off after three lines. | Works with search. No filter by job or author on the page. | Same as developer. |
| `/skills/<name>` | One skill: what it does, install, the full SKILL.md, credit and license | Long and technical. | Good. One defect: the page has two top-level headings, the skill name and the SKILL.md's own title, which screen readers announce as two page titles. | Same. |
| `/kits`, `/kits/<kit>` | The four installable bundles | "Kit" and "plugin" are used for the same thing; the homepage tile says "4 plugins". | Fine. | Fine. |
| `/fix`, `/fix/<problem>` | Start from a symptom, get prompts in order | Symptoms are in plain words, which helps, but all 18 assume an existing codebase or database. | Good. It overlaps with "Best starting points" on `/prompts`: two different "start from your problem" lists. | Fine. |
| `/mcp-setup` | Connect the library to an agent | Not for them. | Clear. Only linked from the bottom of the homepage and the footer. | Fine. |
| `/account` | Starred items and collections | Not for them. | Not for them. | The same place has three names: the header button says "Starred", the page says "Your collections", the breadcrumb on a collection says "Collections". Share, Rename and Delete sit in one row with inline styling; Delete has no confirmation. There is nothing for the account itself (email, export, delete account) beyond Clerk's avatar menu. |
| `/collections/<id>` | One collection, private or shared | Not for them. | A shared collection is a good landing page: one install command for its skills. | Fine. |
| `/sign-in` | Clerk sign-in | No page explains why to make an account before asking for one. | Same. | Fine. |
| `/privacy`, `/terms`, `/about` | Do not exist | 404 on the live site. The site takes sign-ins and stores collections, so privacy and terms are owed. Nothing says who AtlasScope is. | Same. | Same. |
| 404 page | Recover | Offers prompts, skills and fix. No link to `/start` or home. | Fine. | Fine. |
| `/llms.txt`, `.md` twins, sitemap | Serve agents and crawlers | Not for people. | Working: 200 for all three. | Not for people. |

## Problems that cut across pages

1. **The homepage speaks to one person.** It assumes the reader already runs a coding agent. A beginner has no door on the page, and a returning user has no shortcut.
2. **Six nouns for the content.** Prompt, command, recipe, skill, kit and plugin all appear in the header, tiles and page intros. The repo's own `GLOSSARY.md` settles these terms and says which to avoid, but the site does not use it or show it.
3. **The header is too heavy on a phone.** At 390 px wide it is 151 px tall (logo row, a sideways-scrolling link row that cuts off "Fix a proble", then search) and stays stuck to the top, taking 18% of the screen on every page.
4. **The first visit hides the page for about 3.5 seconds.** The typing animation in the hero holds back and disables everything under the headline until it finishes or the visitor clicks. It belongs to the old "prompt box" idea.
5. **One tile shouts.** "Fix a problem" is a solid bright green block; it outweighs the install command and the headline on the homepage.
6. **A count is typed by hand.** `site/lib/site.ts` says "Copies all 61 skill folders" as fixed text. Every other count is read from the generated content. This one will go stale when the catalog changes.
7. **Two ink colours.** The site's dark background is a warm `#0A0A09` and its ink `#0B0A08`; the brand ink is the cooler `#0B0C12`. The orbit photo's sky is cool, so the warm background will show a seam where the photo ends.
8. **No analytics or monitoring.** There is no way to know which of the three people actually arrive, or whether a page is failing.

## Content gaps

- One plain sentence each for: what a coding agent is, what a skill is, what a prompt is, what a kit is. On the homepage or one click from it.
- What installing does to your machine, what it costs, and how to remove it.
- Why to make an account (star, collect, share one install command) shown before the sign-in prompt.
- Privacy and terms pages.
- Who makes this: a short About for AtlasScope.
- A way back into `/learn` from the header or footer.
- "What's new": the hero badge announces `/database`, but there is no page behind the idea of news.
- A tested `/start`. It needs one run with a real first-time user before the homepage sends beginners to it as the main path.

## The header logo on a Windows QHD screen

Confirmed on this side, with the same numbers the cloud session found.

| Device scale | Logo height in screen pixels | Top edge | Cap height | Gap between feet and band |
|---|---|---|---|---|
| 1 (100%) | 20.73 | 24.74 | 12.96 | 1.55 |
| 1.25 (125%) | 25.92 | 30.92 | 16.20 | 1.94 |
| 1.5 (150%) | 31.10 | 37.11 | 19.44 | 2.33 |
| 2 (Mac) | 41.47 | 49.48 | 25.91 | 3.11 |

At every scale the top edge, the cap line and the baseline fall between pixel rows, so each flat edge is drawn as two grey rows. In the enlarged capture at scale 1 the tops of the letters, the baseline and the band under the symbol are visibly soft, and the gap between the symbol's feet and its band is a grey smear. The cap height of 12.96 px is under the spec's 14 px minimum for the lockup. The header uses the regular symbol drawing at about 20 px where the spec asks for the small drawing below 40 px. The phone header's symbol has the same faults (19.95 px tall at a top of 20.51).

The fix direction in the brief is right. Two additions: make the header an opaque ink bar, which removes the translucent blur that can drop Windows text to grey-only smoothing and also answers the photo question below; and set the header's pixel sizes in whole CSS pixels chosen so that 125% and 150% also land on whole device pixels (a 16 px cap height gives 20 and 24 device pixels; 14 px gives 17.5 and 21, so 16 is the safer size).

## Decisions for Austin

1. **The orbit photo against the brand spec.** The spec says to keep the identity away from space imagery and never to set the logo over a photograph. Recommendation: use the photo as a hero backdrop only, under these rules, and add them to `SPEC.md` as a stated exception. The header is a solid, opaque ink bar and the photo starts below it. No logo, symbol or favicon-style mark is ever placed on the photo, and the symbol's band is never lined up with the planet's horizon. The headline and buttons sit in the black sky in the upper part of the picture; the horizon stays in the lower third and fades into solid ink before the next section. The photo appears on the homepage hero only, not on share images, icons or library pages. Cost: the Artemis resemblance noted in the spec gets a little closer on that one screen.
2. **What the header shows.** Options: (a) the full lockup, "AtlasScope / Agent Kit", as today; (b) the Orbit symbol plus "Agent Kit" in text; (c) "Agent Kit" with "by AtlasScope" small beneath. Recommendation: (b), with the AtlasScope wordmark moved to the footer. The product people came for is Agent Kit, the phone header already does this, and it frees about 110 px of header width for navigation. If you prefer (a), I will fit the lockup at a 16 px cap height, about 26 px tall and 159 px wide.
3. **Who the hero is written for.** Recommendation: the working developer, with a second button of equal clarity for beginners ("New to coding agents? Start here") that goes to `/start`. The library is the product, and `/start` is still untested with a first-time user. Cost: beginners are second on the page until `/start` has been tested.
4. **Dark or light.** The photo only works on black. Recommendation: the homepage is always dark; library and reading pages keep following the visitor's light or dark setting as they do now. Cost: a visitor in light mode sees a change of theme when they leave the homepage. The alternative is a dark-only site, which is simpler and closer to Linear and Resend but removes the light reading pages.
5. **One ink.** Recommendation: move the site's dark background and ink to the brand's cool `#0B0C12` family and drop the warm tint, so the photo, header and page are one colour.
6. **The typing animation.** Recommendation: remove it with the old headline. The new hero should be readable and clickable the moment it loads.
7. **The photo's colour.** The supplied photo is blue; the reference board is black and white. Recommendation: build with the photo as supplied, and at the Phase 4 checkpoint show a toned-down version beside it so you can pick by eye.
8. **Source images and git.** Recommendation: ignore `design/hero/inputs/` in git (the 6 MB photo and the v0.1 handoff) and commit only the optimized versions the site uses.
9. **Privacy and terms.** Recommendation: I draft both in plain language from what the site actually stores (Clerk account, collections in Neon, MCP call counts, Vercel logs), linked in the footer, and you have them read by someone qualified before relying on them.
10. **Analytics and monitoring.** Recommendation: Vercel Web Analytics and Speed Insights, which use no cookies. Turning them on is a Vercel project setting, so it needs your yes.
11. **Review passes.** The brief lists code review among the skills to use; your standing rule is no review pass unless you ask for one. Recommendation: I run typecheck, tests and build on each PR and leave review to the `codex-review` check, unless you name a reviewer for a specific PR.
