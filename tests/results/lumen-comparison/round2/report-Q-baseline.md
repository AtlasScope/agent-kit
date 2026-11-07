# Lumen navigation review

Source read in full (`src/`), and the running app driven with Playwright at 1200px and 390px. Nothing in the app was modified.

## Summary

The navigation feels broken because it has no single source of truth. Routes, link targets, "active" checks, redirects and view state each live in a different place and disagree. There are several outright bugs (dead links, 404s, wrong highlighting) sitting on top of a few structural problems. The bugs are cheap to fix. The structural problems are what keep producing new bugs.

## Bugs (verified in the running app)

| # | What happens | Where |
|---|---|---|
| 1 | **Person links 404.** Tasks, project Team and similar pages link to `/people/maya` (handle), but the page looks people up by id (`u1`). `/people/maya` returns 404. The People list links to `/people/u1`, which works. The assignee link in task lists goes to a third form, `/people?person=u1`, which just shows a banner on the list. Three URL shapes for one thing. | `urls.ts` (`personUrl`, `assigneeUrl`), `people/page.tsx`, `people/[personId]/page.tsx`, `data.ts` (`getPerson` matches id only) |
| 2 | **"Timeline" project tab is a dead end.** It is in `projectTabs` but no route exists. Clicking it lands on a bare 404 with no app shell or way back except the browser button. | `nav.ts`, no `timeline/` folder |
| 3 | **Project "Docs" tab leaves the project.** It goes to global `/docs`. Nothing there is per-project, and the project header and tabs are gone. | `urls.ts` `projectTabUrl` |
| 4 | **Left nav never shows where you are on most pages.** Active state is `pathname === href`. Home's href is `/dashboard`, which redirects, so Home is never highlighted. Projects is not highlighted on `/projects/p1` or any child page. Only exact-match top-level pages light up. | `LeftNav.tsx` |
| 5 | **Settings sub-nav highlights Profile on every settings page.** Profile's href is `/settings`, and the check is `startsWith`. On `/settings/members` both Profile and Members are active. | `SettingsNav.tsx` |
| 6 | **Home link takes two redirect hops.** Nav href `/dashboard` → `/overview` → `/home`. `/` redirects to `/projects` instead, so the app's landing page and the nav's "Home" disagree. | `nav.ts`, `next.config.ts`, `app/page.tsx` |
| 7 | **Workspace switcher doesn't stick.** The choice lives only in `?ws=`. No link in the app carries it, so any navigation resets the dropdown to Acme Studio. Only Home and Projects read it at all; every other page ignores the workspace. An invalid `ws` shows a blank/incorrect selection (switcher and `getWorkspaceId` validate differently). | `WorkspaceSwitcher.tsx`, `data.ts` |
| 8 | **Task search leaks between projects and sticks around.** The query is stored in a module-level `viewState` object, so text typed in project 1's Tasks tab reappears (and filters to zero rows) in project 2. The status filter is local state and resets. "Only mine" is in the URL. Three storage mechanisms for one toolbar, none shareable or back-button friendly. | `TaskFilters.tsx`, `view-state.ts` |
| 9 | **Task detail behaves three ways.** From a project's Overview or Tasks tab it opens as a modal. From Home or My tasks (same link) it is a full page. Opened directly or from a pasted link, the full page's "Close" button does `router.back()`, which with no history leaves the app (verified: ended on `about:blank`). | `@modal/(.)tasks/...`, `tasks/[taskId]/page.tsx`, `Modal.tsx` |
| 10 | **Project tabs overwrite history.** Tabs use `replace`, so Overview → Tasks → Team → Back goes to whatever you were on before the project (verified), not the previous tab. | `ProjectTabs.tsx` |
| 11 | **No tab is highlighted on a task page,** and Overview is only active on the exact project URL. | `ProjectTabs.tsx` |
| 12 | **Sign-in ignores `next`.** Middleware builds `?next=...` but the sign-in page always pushes `/projects` (verified with `?next=/people`). Deep links through a login wall are lost. There is also no sign-out anywhere, and a signed-in user can still open `/sign-in`. | `middleware.ts`, `sign-in/page.tsx` |
| 13 | **Mobile menu stays open after you pick a page** (verified), shows no current page, and the workspace switcher shares the cramped top bar. | `MobileMenu.tsx` |
| 14 | **Unknown URLs render a bare 404 with no shell** (`/nope`, and the Timeline tab). In-app 404s (`/people/maya`, `/docs/specs`) keep the shell but have no helpful text or link back. There is no `not-found.tsx`. | app root |

## Structure problems behind the bugs

1. **Three disconnected sources of truth for navigation.** `nav.ts` (labels and hrefs), `urls.ts` (URL builders) and the real route folders. Nothing checks they agree, which is how Timeline, `/dashboard` and the person URLs drifted. Hardcoded strings (`/people/${p.id}`, `/docs/import`) bypass the builders.
2. **"Active" is computed ad hoc in each nav component** with three different rules (exact, `startsWith`, exact-with-replace). Each is wrong somewhere.
3. **Information architecture is muddled.**
   - Docs is both a global section and a project tab.
   - "Import data" is a project/task CSV import but lives under Docs, as a hardcoded `/docs/import` route that would also shadow a doc with the slug `import`.
   - Insights has a page but no way to reach it.
   - People and Project Team show the same list (Team ignores the project).
   - Home and Projects show nearly the same cards.
   - Doc breadcrumbs link to segments that don't exist (`/docs/specs` is 404).
4. **State has no consistent home.** Workspace, filters, invite dialog and task modal each use a different mechanism (query param, component state, module global, parallel route). The invite dialog also opens with `replace` and closes with `push`, so history gets odd.
5. **Every page has the title "Lumen".** Browser history, tabs and screen readers can't tell pages apart.

## Recommendations

### Fix now (small, low risk)
1. Make person URLs one thing: pick the handle (nicer), make `getPerson`/the page resolve it, and route People list, Team, assignee and task detail through `personUrl`. Drop `assigneeUrl` or point it at the profile.
2. Remove the Timeline tab (or build the page). Decide on project Docs: either remove the tab or make it a real `/projects/[id]/docs`.
3. Set Home's href to `/home` and delete the `/dashboard` and `/overview` redirect chain. Decide whether `/` goes to Home or Projects, and make nav match.
4. One shared `isActive(pathname, href)` helper: exact for leaf pages, prefix for sections (`/projects` active under `/projects/p1/...`). Give Settings Profile its own `/settings/profile`, or exact-match it.
5. Honor `next` after sign-in (validate it is a relative path), and add sign-out.
6. Close the mobile menu on navigation; show active state.
7. Add a root `not-found.tsx` that includes the shell or at least a link home. Add `metadata`/`generateMetadata` titles per page.

### Decide, then fix
8. **Task detail:** choose modal or page, not both. Recommended: keep the page as the real destination and make modal interception apply everywhere the link is used, or drop the modal. Either way, "Close" should go to the project's tasks list (link or `router.back()` with a fallback to it), never leave the app.
9. **Tabs:** use normal pushes so Back works, and compute active state by prefix.
10. **Workspace:** decide what it scopes. Recommended: store it in a cookie or a path segment (`/w/acme/projects`), and filter every list by it, rather than a query param that nothing preserves.
11. **Task filters:** put status, query and "mine" in the URL search params together and delete `view-state.ts`.
12. **Information architecture:** move Import to Settings (or a Projects action), surface or delete Insights, make project Team actually project-scoped, and fix doc breadcrumbs so only real pages link.

### Prevent recurrence
13. Define routes once, as typed builders (`routes.project(id)`, `routes.person(handle)`), and build the nav arrays from them. No raw path strings in components. A small Playwright smoke test that visits every nav href and tab and asserts non-404 would have caught bugs 2, 3 and 6.

## Suggested order
Items 1–4 and 7 fix most of what users feel, in a day or less. Items 8–11 need small product decisions first (modal vs page, what a workspace scopes); item 10 touches the most files.

## Not verified
Keyboard/focus behavior of the modal and dialogs (no Escape handling or focus trap is visible in the source) was read from code only. I did not test other browsers or real touch devices.
