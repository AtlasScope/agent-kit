# Playbook: navigation chrome

Loaded by Diagnose when sidebars, top bars, tabs, breadcrumbs, switchers or the mobile menu are in question.

Read `${CLAUDE_PLUGIN_ROOT}/references/evidence.md` first.

## Procedure

1. **Find the systems.** Use the static map from Diagnose (or run `ea map <app-root> --out <out>/map`). The chrome table in `summary.md` lists components rendered by layouts or templates, with route coverage, destinations and active-state strategy (exact, prefix, library, none). Add the chrome the scanner cannot see: conditional sub-navs, inspectors, command palettes, context switchers (workspace or account pickers), floating action areas. Read the layout components.

2. **Responsibility matrix.** One row per system:

   | System | Scope (routes) | Job | Destinations | Active-state rule | Changes when | Mobile form |
   |---|---|---|---|---|---|---|

   A healthy system has one job, such as "move between sections", "move within this record" or "act on the selection". Flag systems that share a job, destinations offered by two systems under different labels, systems whose content depends on another system's state (a switcher that silently changes what the sidebar means), and systems that vanish in exactly the places users need them (sub-nav hidden on detail pages).

3. **Active-state coordination.** For a list route, a record route, a nested tab and a settings page, check that every system agrees on where the user is. Exact-match strategies lose the highlight one level down; prefix matching on `/` highlights everywhere; a section reached from two systems highlights in only one. `ea crawl` reports `active-state-mismatch` per page shape from the rendered DOM, which is the ground truth.

4. **Context boundaries.** What context does each system carry (current record, filter, workspace), and does it survive moving between siblings, opening a child, and going back? Does a breadcrumb lead to the real parent the user came through, or to a URL prefix that may not be a page? Do breadcrumb labels use the product's names or raw URL segments?

5. **Responsive.** Run `ea crawl <url> --viewport mobile`, or journeys at `mobile` and any narrow width the product is used at (a 560px side panel, a split-screen tablet) checking `navVisible` and `activeNav`. Compare the mobile destinations with desktop (`mobile-nav-subset`). Check that the mobile menu closes on navigation and returns focus.

6. **Does the chrome fit the workflow?** Name the user's two or three core loops (triage a queue, work a record, configure). Count clicks and context switches per loop with the current chrome. Chrome that makes users understand the app's implementation (route groups surfaced as nav, admin and settings split by code ownership) is a design judgment worth reporting.

## Output

`<out>/chrome.md` holds the responsibility matrix, the per-route active-state table, findings, and a short "what the chrome should be" recommendation (Rethink develops it into options). Diagnose's report carries how many systems exist, which overlap, and the worst coordination failure.

Read-only playbook: it never edits the app.
