# Lumen navigation review

App: Next.js 15 App Router, 19 pages, run at http://localhost:3300 (signed in with the demo cookie). Source was not modified.

## Verdict

Navigation feels like a mess because the app has no single owner for "where am I". Three things that should agree don't: the **nav config** (`src/lib/nav.ts`), the **URL builders** (`src/lib/urls.ts`) and the **actual routes**. They were edited separately and have drifted. The result is links that 404 or go somewhere other than their label, active highlights that are wrong or missing, and state (workspace, task filters, dialogs) that follows no rule about whether it lives in the URL, in component state or in a module global.

Each page is fine on its own. Most problems are small and cheap to fix once there is one source of truth. I recommend **Option A: repair and consolidate the current structure** (about a day or two of work). Option B (one real model for workspace and projects) is worth doing afterwards if the product keeps growing.

## Root causes

### 1. Nav labels, URL helpers and routes were never reconciled

Each of these is a link or highlight that does not do what it says.

**Person links 404 (high).** Class: defect, reproduced.
- Start: `/projects/p1/team`. Action: click "Maya Chen".
- Expected: Maya's profile. Observed: 404 at `/people/maya`.
- Cause: `personUrl()` builds `/people/<handle>` (`src/lib/urls.ts:11`), but the page looks people up by id (`getPerson`, `src/lib/data.ts:44`) and the People list links to `/people/u1`. The same link appears in the task detail ("Assigned to ...") and `TaskList`.
- Third form: the assignee link on every task row goes to `/people?person=u1`, which is the list page with a banner, not a profile. One person has three URL shapes and only one of them works.

**Home never highlights and takes two redirects (medium).** Class: defect, reproduced.
- Click "Home": ends on `/home`, no nav item is active.
- Cause: `primaryNav` points Home at `/dashboard` (`src/lib/nav.ts:4`), which redirects to `/overview`, which redirects to `/home` (`next.config.ts:6-7`). `LeftNav` compares `pathname === item.href`, so `/home` never matches `/dashboard`.

**Left nav only highlights on exact matches (high).** Class: defect, reproduced.
- On `/projects/p1/team` the left nav shows nothing as current for Projects; on `/projects/p1/tasks/t1` neither the left nav nor the project tabs show anything. Cause: `pathname === item.href` in `LeftNav.tsx:14` and `ProjectTabs.tsx:15`.
- Insights, `/people/:id`, task detail and every nested settings page have the same gap.

**Settings sub-nav highlights two items at once (medium).** Class: defect, reproduced.
- On `/settings/members` both "Profile" and "Members" are active. Cause: `pathname.startsWith(item.href)` with Profile at `/settings` (`SettingsNav.tsx:12`).

**Project tabs: one dead, one leaves the project (high).** Class: defect, reproduced.
- "Timeline" goes to `/projects/p1/timeline`, which is a 404 (the tab is in `projectTabs` with no page behind it).
- "Docs" goes to the global `/docs` (`urls.ts:8`). The page header changes from the project name to "Docs", the project tabs disappear, and the highlighted item is the left-nav Docs. It reads as a tab but behaves as leaving the project.

**Doc breadcrumbs link to pages that don't exist (medium).** Class: defect, reproduced.
- On `/docs/specs/launch-plan`, the "specs" crumb goes to `/docs/specs`, which 404s. Cause: the breadcrumb links every path prefix (`docs/[...slug]/page.tsx:15`) but only some prefixes are docs.

**Insights has no way in (medium).** Class: defect, code-certain. `/insights` is not in `primaryNav` and nothing links to it.

**Task URL ignores the project (low).** Class: defect, reproduced. `/projects/p1/tasks/t4` shows task t4, which belongs to p2, under Apollo's header. The page never checks `task.projectId`.

**Sign-in drops the destination (high).** Class: defect, reproduced.
- Open `/projects/p1/tasks` signed out. Middleware sends you to `/sign-in?next=%2Fprojects%2Fp1%2Ftasks`, which is correct, but after signing in you land on `/projects`. `sign-in/page.tsx:12` hard-codes `router.push('/projects')` and never reads `next`. Every shared link loses its target for people who are not already signed in.

### 2. Workspace is global context with no home

**Workspace choice does not stick (high).** Class: defect, reproduced.
- Start: `/projects`. Action: switch the dropdown to "Side Projects" (URL becomes `?ws=side`, list shows Orchard notes). Click "Projects" in the left nav.
- Observed: URL is `/projects`, list shows Acme projects, and the dropdown has snapped back to Acme.
- Same on `/home?ws=side` → click the project: the project page shows the dropdown as Acme.
- Cause: workspace lives only in a `?ws=` query param (`WorkspaceSwitcher.tsx`), no link in the app carries it, and only Home and Projects read it. Settings, People, Docs and My tasks ignore it, so the switcher is a visible control that does nothing on most screens.
- This is the biggest structural problem: the switcher sits in the top bar and implies scope over the whole app, but nothing enforces it. Project pages do not check which workspace a project belongs to.

### 3. Page state has no rule for where it lives

| State | Lives in | Consequence |
|---|---|---|
| Workspace | `?ws=` on one page | Lost on the next click (above) |
| "Only mine" | `?assignee=me`, pushed | Each toggle adds a Back stop |
| Task status filter | `useState` | Lost on refresh and on any full-page navigation |
| Task search text | `useState` seeded from a module global (`view-state.ts`) | Survives client navigation, and leaks across projects |
| Invite dialog | `?invite=1` | See below |
| Project tab | pathname, `replace` | Back skips tabs |
| Task detail | Modal or full page depending on where you came from | See below |

**Search text follows you to other projects (medium).** Class: defect, reproduced. Type "press" in Apollo's Tasks, go to Projects, open Harbor, click Tasks: the box still says "press" and the list shows 0 tasks. Cause: `viewState.taskQuery` is a module-level variable shared by every project and every visit.

**Invite dialog and Back (medium).** Class: defect, reproduced.
- Open "Invite someone": URL becomes `/people?invite=1` using `replace`. Press Back and you leave People entirely (the dialog is not a history step).
- Click "Close" and the dialog closes using `push`; now press Back and the dialog reopens (`/people?invite=1`).
- Cause: open uses replace, close uses push (`InviteModal.tsx:15,24`). Both should be the same kind of step. Close also drops other params such as `?person=`.

**Task detail is a modal sometimes and a page other times (high).** Class: defect, reproduced.
- From a project's Overview or Tasks tab, a task opens as a dialog over the list (route interception). Back returns to the list with the status filter and search intact.
- From Home or My tasks, the same kind of link opens a full page (interception only exists under `/projects/[id]`). Same URL, different presentation.
- Refresh while viewing the dialog: the dialog is replaced by a full page, project tab no longer highlighted.
- Both variants have a "Close" button that calls `router.back()`. Open `/projects/p1/tasks/t1` directly (a shared link): Close goes to `about:blank`.

**Project tabs use replace (low, judgment).** Projects → Apollo → Tasks → Team, then Back: you land on `/projects`, not on Tasks. Defensible for tabs, but combined with "Only mine" pushing and the status buttons not touching history, the app handles Back three different ways.

### 4. Overlapping destinations and unclear hierarchy

Class: design judgment.
- **Home vs Projects.** Both list the user's projects (Home adds four recent tasks). Sign-in and `/` send people to Projects, so Home is a second front door that nothing points to by default.
- **My tasks vs project Tasks with "Only mine".** Same data, two places.
- **People vs Settings → Members.** Both list the same people and roles. Invite lives on People.
- **Docs.** Appears as a global item, as a project tab (that goes to the global page), and hosts "Import data", which imports projects and tasks from CSV and has nothing to do with docs.
- **Three navigation systems** (left rail, project tabs, settings sub-nav) look alike but follow different rules: exact vs prefix matching, replace vs push, and the project tabs are the only one with a destination that leaves its section.
- **Mobile.** The left rail is hidden under 800px and replaced by a "Menu" button. The panel has no active state and stays open after you tap a destination (reproduced on Docs and People). The project tabs and settings nav stay as they are.

## What was verified, and how

Reproduced in a browser (Playwright, desktop 1280px and mobile 390px, signed in with the demo cookie): every item marked reproduced above. Script: `.experience-architecture/2026-11-06/probe.mjs`. I ran no destructive actions.

Read in code only: Insights orphan, task/project mismatch (also reproduced), `next` param ignored (also reproduced), hierarchy and duplication points.

Not checked: keyboard focus after dialogs close, scroll restoration, screen-reader behavior, narrow-width layout of tabs, non-demo accounts or roles (there is no sign-out and no role gating in the code).

Static signals from the map, and what happened to them:
- **ia-1 to ia-12 ("no in-app path") are mostly refuted.** The map could not follow `item.href` and `projectTabUrl()`, so Docs, My tasks, People, Settings, Tasks, Team and task detail are all reachable. Only **Insights** is truly unreachable. `/sign-in` is correctly a public page.
- **routing-1 (redirect chain) is confirmed**, and it is the cause of the Home highlight bug.
- **routing-2 (unencoded query)** is real in the code but harmless today because only ids go in.
- 16 dynamic targets were exercised by the browser checks above. Map artifacts: `.experience-architecture/2026-11-06/map/` (`sitemap-current.mmd`, `nav-graph.mmd`, `summary.md`). I did not generate a transition map or prototype, since the app is small enough that the findings above do not need them.

`.experience-architecture/` is not in `.gitignore` (the repo shows it as untracked). I left `.gitignore` alone.

## Alternatives

**A. Repair and consolidate (recommended).** Keep the three-level structure. Make `nav.ts` the only source: each item carries `href`, a `match` prefix and its section, and `urls.ts` is the only place that builds paths. Fix the broken links, make active states prefix-based everywhere, remove Timeline or build it, move Docs out of project tabs (or make it a real project-scoped route), move Import to Settings or Projects. Decide the state table above and apply it. Cheapest and removes most symptoms; it does not resolve the Home/Projects or People/Members overlap by itself, so also pick one of each (below).

**B. Workspace as the URL root.** Move to `/w/:workspace/projects/:id/...`, with People, Docs, Settings and My tasks under the workspace. The switcher then actually scopes everything, links carry context for free, and project access can be checked against the workspace. Costs: every URL changes, so it needs redirects from the old paths (`/projects/:id`, `/p/:id`) and a migration of bookmarks. Worth it if the workspace boundary matters for permissions or if many workspaces are expected. Overkill for two.

**C. Work-centric rebuild.** Replace "Home / Projects / My tasks" with a single "Work" area (my tasks first, projects second) and merge People and Members into one Team area. Fewer top-level items and no duplicated front doors. Largest change in what users see; I would not do it without usage data on Home and Projects.

Consolidation matrix:

| Today | A | B | C |
|---|---|---|---|
| Home + Projects | Keep Projects as landing; either drop Home or give it a distinct job (activity) | Same, under workspace | Merge into Work |
| My tasks + Tasks "Only mine" | Keep both, one shared list component | Same | Merge |
| People + Settings/Members | Keep People for browsing; Members for roles; one list component, one profile URL | Same | Merge into Team |
| Docs (global + project tab) | One Docs area; remove tab or scope it | Docs under workspace | Same |
| Import | Move to Settings | Settings | Settings |
| Insights | Add to nav or delete | Add under workspace | Under Work |

## Recommendation and migration plan (Option A)

Order by user impact; each step is independently shippable.

1. **Fix the links that break (hours).** One person URL (`/people/:id`, pick one; update `personUrl` and `assigneeUrl`), point Home at `/home`, delete the dead redirect chain, hide or build Timeline, fix doc breadcrumbs to link only existing docs, honor `next` after sign-in (validate it starts with `/` and not `//`).
2. **Fix active states.** Prefix matching with a longest-match rule in `LeftNav`, `ProjectTabs`, `SettingsNav`; add the active state and close-on-navigate to `MobileMenu`.
3. **Give workspace a home.** Smallest honest version: store it in a cookie, read it in a shared helper on every page that lists things, and hide or disable the switcher on pages it does not affect. The proper version is Option B.
4. **Apply the state rule.** URL for anything shareable or that Back should restore (workspace, status, search, assignee, invite), using `replace` for filters and `push` for opening a dialog or a record; module globals removed.
5. **Single task presentation.** Either intercept task links everywhere, or never intercept. Make Close fall back to the project's task list when there is no in-app history. Check `task.projectId` against the URL.
6. **Remove duplicates** (Home vs Projects, Import's location, Insights) once you decide what each is for.

Regression checks, in the browser, per step: every nav item and tab lands on a 200 page and is highlighted on it and on its child pages; Home has no redirect; `/projects/p1/tasks/t1` as a direct link, then Close, stays in the app; signed-out deep link survives sign-in; workspace choice survives a nav click; Back after invite/close/filter behaves the same everywhere; mobile menu closes on selection.

## Open questions

1. What is Home for, if Projects is where people land? Which should be the default after sign-in?
2. Is workspace a hard boundary (permissions) or a filter? That decides between the cookie fix and Option B.
3. Is Timeline planned? If yes, keep the tab as a disabled item; if no, remove it.
4. Is Insights meant to be visible to everyone?
5. Should Docs be global or per project? Today it is both and works as neither.
