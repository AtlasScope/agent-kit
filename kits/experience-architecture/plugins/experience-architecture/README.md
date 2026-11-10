# Experience Architecture

A plugin for Claude Code, Codex and Cursor for understanding and improving how a web app works as one continuous experience: the structure of its pages, the shape of its URLs, its navigation chrome, and what happens to the user's context as they move, go Back, refresh, switch records or arrive from a link.

You describe what feels wrong; it decides which investigations to run, proves what it finds in a real browser, and explains causes and choices in plain English. The technical decisions (where state should live, which routing pattern, how to stage a migration) are its job, not yours.

## Install

The plugin works in Claude Code (on your computer and in cloud sessions), Codex and Cursor. It needs Node 18 or later. Browser checks also use Playwright, which it looks for and asks before installing.

**Claude Code**

```bash
claude plugin marketplace add AtlasScope/agent-kit
claude plugin install experience-architecture@agent-kit
```

Update with `claude plugin marketplace update agent-kit` and `claude plugin update experience-architecture@agent-kit`.

**Claude Code cloud sessions.** Add this to the repo's `.claude/settings.json`, merged with anything already there:

```json
{
  "extraKnownMarketplaces": {
    "agent-kit": { "source": { "source": "github", "repo": "AtlasScope/agent-kit" } }
  },
  "enabledPlugins": { "experience-architecture@agent-kit": true }
}
```

**Codex**

```bash
codex plugin marketplace add AtlasScope/agent-kit
codex plugin add experience-architecture@agent-kit
```

**Cursor.** Cursor reads plain skill folders, so a script copies the skills into `~/.cursor/skills`. Run it from a clone; the same command works on Windows:

```bash
git clone https://github.com/AtlasScope/agent-kit.git
node agent-kit/kits/experience-architecture/plugins/experience-architecture/scripts/install-skills.mjs
```

It installs `/experience-architecture-diagnose`, `-rethink`, `-verify` and `-walkthrough`, and keeps the plugin's files in `~/.experience-architecture/plugin`. Rerun it after a `git pull` to update; add `--uninstall` to remove only what it installed. `--codex` writes the same folders to `~/.codex/skills` if you prefer that to the Codex plugin, and `--dir <path>` targets any other tool that reads skill folders.

To try it in Claude Code for one session without installing: `claude --plugin-dir <clone>/plugins/experience-architecture`.

## What it does

Three skills, and a fourth in preview. You rarely need to name them: describing the problem is enough.

| Skill | Ask it | What you get |
|---|---|---|
| `/experience-architecture:diagnose` | "The navigation feels broken and I don't know why." "Back does something weird on the orders page." "Do we have too many pages?" | The causes behind the symptoms, each proven in the browser or traced to the line of code; a verdict on whether the structure itself is the problem; the fixes and the one decision it needs from you. Add a focus word (structure, urls, navigation, continuity) to keep it narrow |
| `/experience-architecture:rethink` | "Should we restructure this?" "Give me options." | Which pages should exist, merge or go; two or three genuinely different structures (one ambitious) as a clickable prototype, described as what using each would feel like; a recommendation; a migration plan that keeps old links working. It changes the app only after you pick an option and say go |
| `/experience-architecture:verify` | "Prove this bug." "Did the redesign break anything?" | Browser journeys at desktop, phone and narrow widths, including shared links opened fresh (signed out, same user, another account) and links opened in new tabs; a regression suite you can run in CI |
| `/experience-architecture:walkthrough` (preview) | "It all works but it feels unfinished." "I keep adding things and it never comes right." "Walk through it with me." | A short brief of what the product is for and what people come to do; what using it is like, from a pass through the running app before any code is read, or from following you through a real task; what already works and should be kept; and for each job how big a change it needs, from leave it alone to rethink the product. Read-only |

Walkthrough is new and has not been through the comparison runs the other three have. It is the first part of a wider Product Experience direction: judging how a product looks, reads and flows as well as how its pages connect. Its level verdicts (leave, repair, clarify, recompose, restructure, reconceive) are defined in [`references/levels.md`](references/levels.md).

Behind the skills are four playbooks (page structure, URLs, navigation chrome, continuity) that Diagnose loads only when the question needs them, so a narrow question stays cheap. Everything is read-only by default.

## The `ea` toolkit

On the Bash PATH while the plugin is enabled (`node <plugin>/scripts/ea.mjs` works too). The skills run it; you can as well. It has no dependencies; browser commands use Playwright if it is available.

```
ea map <app-root>            static model: routes, layouts, chrome, nav graph, ~30 kinds of signal
ea crawl <url>               runtime link graph by page region, dead pages, active-state conflicts, duplicates, mobile nav
ea journey <spec.json>       step-by-step journeys with state snapshots, history reconstruction and anomaly checks
ea probe                     the snapshot script, for driving any browser tool by hand
ea transitions <log.json>    anomaly checks and transition map for hand-collected logs
ea prototype <proposal...>   clickable HTML prototype of one or more proposed structures
ea sitemap <model|proposal>  Mermaid site map
ea migrate <model> <mapping> URL migration coverage, redirects, regression journeys
```

Static discovery covers Next.js (App and Pages Router, route groups, parallel and intercepting routes, layouts and templates, `next.config` redirects, middleware guards), React Router (data-router objects, `<Route>` JSX, nested `x/*` mounts, `<Navigate>` redirects, loader guards), React Router 7 and Remix flat routes, and TanStack Router file routes. It follows path aliases, nav-config arrays and URL-helper functions. Other frameworks use the crawler and journeys, which work on any site.

## Requirements

- Node 18 or later.
- For `crawl` and `journey`: Playwright, resolved from the project, `$EA_PLAYWRIGHT_DIR`, or `~/.experience-architecture/runtime`. The plugin never installs it. Without it, the skills drive whatever browser tools the session has and analyse the snapshots with `ea transitions`.
- A running copy of the app for browser verification. Static analysis needs only the source.

## Output

Reports and artifacts go to `.experience-architecture/<date>-<topic>/` at the app root, or to the location your project's CLAUDE.md or AGENTS.md names for artifacts. Add it to `.gitignore`.

## Safety and privacy

- Read-only by default. It never edits, commits or changes `.gitignore` unless you ask for implementation after seeing the plan.
- Browser runs block requests that would change data (POST, PUT, PATCH, DELETE) unless a journey spec allows them, and skip logout and delete-style links.
- Journey logs keep typed values and cookie values as a length and fingerprint, including in step descriptions and error messages, mask secret-looking URL parameters, skip password and payment fields, and drop page text before writing. Screenshots are opt-in.
- Blocking write requests reduces risk but does not guarantee nothing changes: some apps change data through ordinary page loads or links. Point browser runs at a local or staging copy with test accounts.
- Reports are checked before they reach you: `ea refs` confirms every cited file and line exists, and findings are labelled verified (reproduced, or certain from code) or discovered (a lead).

## Limits

- Static signals are leads. Conditional rendering, CSS breakpoints, runtime data and unparseable code hide things from it; findings are confirmed in code or in the browser before they are reported.
- Route discovery for frameworks outside the list above is manual; the crawler only finds what is linked.
- Journeys cannot judge visual design, and they only exercise the paths someone wrote down. The automatic checks catch generic breakage, not product-specific promises.
- Accuracy, measured on synthetic apps (`tests/results/v0.2-comparison/`): its strength is structural judgment. Plain Claude or the standalone skill found more individual bugs on the larger apps, and long reports sometimes contain wrong details, and `ea refs` catches wrong file and line references but not every wrong statement about code.
- Very short questions ("quick one, keep it short") may be answered without the plugin's skills.
- Product choices (whether tabs should add history entries, whether two related views should merge) are presented as decisions with a recommendation, not as defects.
