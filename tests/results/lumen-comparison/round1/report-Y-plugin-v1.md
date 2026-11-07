# Lumen navigation review

## Verdict

The navigation feels broken because the app has no single rule for where state and ownership live. The same things are tracked in different places depending on who wrote each screen: the URL, component state, a module-level variable, or nowhere. Three navigation layers (left nav, project tabs, settings nav) each decide "active" and "where does this go" on their own, and the destinations they point at don't always exist or don't match the page that's showing. The result is small, constant surprises: a tab that goes to a different section, a highlight that is missing or wrong, filters that vanish or leak into another project, and Back that skips or re-opens things.

Most of the individual bugs are cheap to fix. The causes are structural, so fix the causes first (section 2) or the bugs will return. I'd recommend Option A below: keep the current structure, give each concern one owner, and fix the dead links. Nothing here needs a redesign.

## How this was checked

- **Read in code:** every file under `src/` (793 lines, 40 files).
- **Reproduced in a browser:** Playwright against http://localhost:3300 at 1280px and 390px, signed in with the demo values. Scripts and results were run once, not saved as tests.
- **Not done:** `ea map` and the prototype/alternatives HTML. The app is small enough to read in full, so I skipped them. I didn't test Esc or keyboard behaviour in modals, or any authenticated-vs-signed-out edge cases beyond the sign-in redirect. No source was changed.

## Root causes

### 1. State has no owner (filters, workspace, overlays)

**Task filters are three different mechanisms in one toolbar.** Status is `useState` (`TaskFilters.tsx:15`), search text is a module-level variable (`view-state.ts`), "Only mine" is a URL param (`?assignee=me`).

```
### Search text leaks from one project into another
Class: Defect (reproduced) · Area: continuity · Impact: high
Start: /projects/p1/tasks, type "press" in search
Action: Projects → Harbor redesign → Tasks (client-side navigation)
Expected: Harbor's full task list, empty search box
Observed: search box still says "press", list shows nothing ("No tasks.")
Cause: viewState.taskQuery is a module variable shared by every project (view-state.ts:1, TaskFilters.tsx:16-20)
User impact: a project looks empty. Users will think data is missing.
Fix direction: put search and status in the URL (?q=&status=), drop view-state.ts.
```

```
### Filters disappear on refresh and can't be shared
Class: Defect (reproduced) · Area: continuity · Impact: medium
Start: /projects/p1/tasks with search "press" and status "done"
Action: reload
Expected: same filtered list (or a URL that says what it is)
Observed: search empty, status "all"; URL unchanged
Cause: status and query are not in the URL
User impact: no sharing a filtered view, no reliable return trips.
```

```
### "Only mine" is lost when you switch tabs and come back
Class: Defect (reproduced) · Area: continuity · Impact: low
Start: /projects/p1/tasks?assignee=me
Action: Overview tab, then Tasks tab
Expected: still filtered to mine
Observed: /projects/p1/tasks, unfiltered
Cause: tab links are built without the query string (ProjectTabs.tsx, urls.ts:6)
```

**Workspace is a URL param that nothing carries forward.**

```
### Switching workspace is forgotten at the next click
Class: Defect (reproduced) · Area: chrome/continuity · Impact: high
Start: /projects, switch dropdown to "Side Projects" (URL gets ?ws=side, list shows Orchard notes)
Action: My tasks, then Projects in the left nav
Expected: still in Side Projects
Observed: back in Acme Studio, dropdown reset, Apollo and Harbor shown
Cause: ?ws is added by WorkspaceSwitcher.tsx:14-17 only; no link in primary nav, tabs, task lists or project links keeps it.
User impact: the selector looks like a global setting but behaves like a per-page filter.
```

```
### A project in another workspace opens without complaint
Class: Design judgment (reproduced) · Area: IA · Impact: medium
Observed: /projects/p3/tasks (Side Projects) opens while the switcher says Acme Studio. My tasks, People, Docs and Insights ignore the workspace entirely.
Consequence: nobody can tell what "workspace" scopes. Decide whether it is a real boundary (put it in the path, e.g. /w/acme/...) or a filter on the Projects list only (then say so in the UI).
```

**Overlays use two different mechanisms and Back treats them inconsistently.**

```
### Closing the invite dialog leaves it one Back away
Class: Defect (reproduced) · Area: continuity · Impact: medium
Start: /people
Action: Invite someone (replace, ?invite=1), Close (router.push('/people')), browser Back
Expected: /people with no dialog
Observed: /people?invite=1, dialog is open again
Cause: open uses replace (InviteModal.tsx:17), close uses push (:28), so history is [/people?invite=1, /people]
```

```
### Task opens as a modal from some places and a full page from others
Class: Design judgment (reproduced) · Area: IA/continuity · Impact: medium
Observed: from the project Overview or Tasks tab the task opens in a modal (intercepting route); from My tasks and Home it opens as a full page with no overlay, under the project heading, and with the left nav highlighting nothing. Refreshing the modal also gives the full page.
Cause: the (.)tasks interception sits inside projects/[projectId] and only matches navigation from there.
Related, code-certain: the page's Close button is router.back() (Modal.tsx:9). Open a task link directly (shared URL, new tab) and Close leaves the app or does nothing.
Also reproduced: while the modal is open the overlay covers the left nav, so the only way out is Close. There is no backdrop or Esc handling in Modal.tsx.
```

### 2. Each nav layer decides "active" and "destination" on its own

```
### Left nav rarely shows where you are
Class: Defect (reproduced) · Area: chrome · Impact: high
Observed: on /projects/p1 and /projects/p1/tasks, "Projects" is not highlighted in the left nav; same for /settings/members (Settings not highlighted), /people/u1, /docs/handbook.
Cause: LeftNav.tsx:14 compares pathname === item.href (exact match), so every child page loses the highlight.
```

```
### Settings sub-nav always highlights "Profile"
Class: Defect (reproduced) · Area: chrome · Impact: medium
Observed: on /settings/members and /settings/workspace the active list is ["Profile","Members"] / ["Profile","Workspace"].
Cause: SettingsNav.tsx:15 uses startsWith and Profile's href is "/settings", a prefix of everything.
```

```
### Project "Docs" tab leaves the project
Class: Defect (reproduced) · Area: chrome/IA · Impact: high
Start: /projects/p1
Action: click the Docs tab
Observed: lands on /docs, the workspace-wide Docs page; project heading and tabs are gone, left nav does not highlight Docs on sub-pages, and the tab strip no longer applies.
Cause: urls.ts:7 maps the 'docs' tab to '/docs'. There is no per-project docs.
```

```
### Project "Timeline" tab is a 404
Class: Defect (reproduced) · Area: chrome · Impact: high
Start: /projects/p1, click Timeline
Observed: 404 page. No route exists (nav.ts:14 lists it, nothing under projects/[projectId]/timeline).
```

```
### Tabs rewrite history, so Back skips the whole project
Class: Design judgment (reproduced) · Area: continuity · Impact: medium
Observed: Overview → Tasks → Team, then Back returns to whatever was before Overview, not Tasks. Tabs use replace (ProjectTabs.tsx:19).
Consequence: debatable by itself (tabs as replace is a reasonable pattern), but combined with the modal using real history entries the same screen mixes both behaviours. Pick one rule per kind of control.
```

```
### Mobile menu stays open after you choose a destination
Class: Defect (reproduced, 390px) · Area: chrome · Impact: medium
Observed: choose Docs in the Menu panel; page changes, panel is still open.
Cause: MobileMenu.tsx keeps its own open state and never closes on navigation. Also a second copy of the nav list with no active state at all.
```

### 3. Links and routes that don't agree with each other

```
### Person links 404
Class: Defect (reproduced) · Area: routing · Impact: high
Observed: /people/maya → 404; /people/u1 → Maya Chen. The list page links by id (people/page.tsx:28), but personUrl() in urls.ts:11 builds /people/<handle> (used by the task detail "Assigned to" link and the project Team tab), and the route looks up by id (people/[personId]/page.tsx:5).
User impact: Team tab and "Assigned to" links on every task lead to a 404.
```

```
### The assignee name in a task list doesn't open the person
Class: Defect (reproduced) · Area: routing · Impact: medium
Observed: assignee link goes to /people?person=u1, which shows the whole People list with a "Showing Maya Chen" line above it. A third URL shape for the same person.
```

```
### Home goes through two redirects
Class: Defect (reproduced) · Area: routing · Impact: low
Observed: nav href is /dashboard → /overview → /home (next.config.ts). Works, but three names for one page, and the "Home" nav item is not highlighted when you arrive.
```

```
### Orphans and dead ends
Class: Design judgment (reproduced) · Area: IA · Impact: low–medium
- /insights exists and works but is linked from nowhere (not in either nav).
- /docs/import ("Import data") lives under Docs but is about projects and tasks; the only link is a bare text link on the Docs index.
- Doc breadcrumbs link to /docs/specs, which 404s (no index for that folder).
- "/" redirects to /projects while the nav item named Home is a different page, so a new user lands on a page that isn't "Home".
```

## Current structure

```
/                         → redirect /projects
/home                     (nav: Home, via /dashboard→/overview→/home)
/projects                 /projects/[id]  (overview)
                          /projects/[id]/tasks   /tasks/[taskId] (page + modal)
                          /projects/[id]/team
                          /projects/[id]/timeline   ← does not exist
/my-tasks
/people                   /people/[id]   (but linked as /people/<handle> and /people?person=)
/docs                     /docs/[...slug]   /docs/import
/settings                 /workspace  /members
/insights                 (unlinked)
```

Persistent chrome: top bar (brand, workspace select, mobile Menu), left nav (6 items), project tab strip, settings sub-nav. Page-level state: URL params for workspace, assignee, invite, person; component state for task status; a module variable for task search.

## Options

**A. Tidy in place (recommended).** Keep the structure. Give each concern one owner:
1. Filters and search in the URL, replacing `view-state.ts`.
2. One `isActive(href)` helper used by left nav, tabs and settings, with a prefix match that handles `/settings` as an exact case.
3. One decision on workspace: either carry `ws` in every link via a single `href()` helper, or move it into the path.
4. Fix or remove dead links (Timeline, person URLs, `/dashboard`, `/docs/specs`).
5. Pick one overlay pattern (URL param opened with push and closed with back/replace, or intercepted route) and use it for both task and invite.

Cost: small, mostly local edits. Risk: low. Leaves the "Home vs Projects vs My tasks" overlap, which is a content question, not a bug.

**B. Workspace in the path.** Move everything under `/w/[workspace]/...`, so workspace is a real boundary, shareable, and impossible to lose. Costs a URL migration with redirects for all existing links, but removes the entire ?ws class of bugs and makes "what does workspace scope" answerable. Choose this if workspaces are real tenants (separate people, docs, settings). Not worth it if they are only a project grouping.

**C. Merge Home, My tasks and Projects into one landing page.** Three pages now answer "what should I look at"; Home shows projects and tasks, Projects shows projects, My tasks shows tasks. One landing with a "mine" toggle would cut the nav to People, Docs, Settings plus that. Bigger product call, not required for the bugs above. Only worth doing if analytics or interviews show people can't tell the three apart.

Why A first: it removes every reproduced defect without moving a URL. B can follow if the workspace answer is "real boundary". C is unrelated to the defects.

## Recommendation and rollout

1. Fix the three that send users to 404s or empty lists: Timeline tab, `personUrl`, search leak (the `view-state.ts` variable). Hours, not days.
2. Add the shared `isActive` helper and apply it to all three nav components; close the mobile menu on route change.
3. Move task filters into the URL (`?q=&status=&assignee=`), and carry them through tab links where they apply.
4. Decide the workspace question (open question 1) and implement A3 or B.
5. Make invite and task overlays follow one pattern; add Esc and backdrop close; make Close fall back to the parent URL when there is no history.
6. Remove or link Insights; move Import data out of Docs.

Verify with a short Playwright journey set (the scripts used here are a starting point): each left-nav item highlighted on its child pages; every tab loads; Back after open/close of each overlay returns to the page without it; refresh preserves task filters; workspace stays selected across five clicks; no link on any page returns 404 (crawl).

## Open questions

1. What does a workspace scope? Projects only, or people, docs and settings too?
2. Should the project Docs tab show docs for that project? If not, remove it.
3. Is Timeline planned? Hide it until it exists.
4. Should Home, Projects and My tasks stay separate pages?
5. Is Insights meant to be reachable?
6. Should a task have one canonical URL, with the modal as a presentation of it?
