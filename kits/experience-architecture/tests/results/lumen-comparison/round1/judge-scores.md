# Scoring: report X vs report Y against the lumen answer key

Scale: 1 = correct mechanism or user-visible symptom, 0.5 = partial, 0 = missed.

## Key defects

| Key defect | X | X evidence | Y | Y evidence |
|---|---|---|---|---|
| IA-orphan-insights | 1 | "Insights has a page but no way to reach it." | 1 | "/insights exists and works but is linked from nowhere" |
| IA-members-split-across-branches | 0.5 | "People and Project Team show the same list (Team ignores the project)." Names two of three places; no /settings/members, no "where do I manage a teammate/role" | 0 | Nothing on People vs Members vs Team (members page appears only in highlight bugs) |
| IA-my-tasks-duplicates-task-filter | 0 | Only "Home and Projects show nearly the same cards." | 0.5 | "My tasks shows tasks. One landing with a 'mine' toggle" — sees overlap, ties it to Home/Projects, not to the Tasks assignee=me filter |
| IA-import-under-docs | 1 | "'Import data' is a project/task CSV import but lives under Docs" (rec: move to Settings) | 1 | "/docs/import ... lives under Docs but is about projects and tasks" |
| ROUTING-dead-timeline-tab | 1 | "'Timeline' project tab is a dead end ... bare 404" | 1 | "Project 'Timeline' tab is a 404" |
| ROUTING-redirect-chain-dashboard | 1 | "Nav href /dashboard → /overview → /home" + "Home is never highlighted" | 1 | "/dashboard → /overview → /home ... 'Home' nav item is not highlighted" |
| ROUTING-person-identity-query-vs-path | 1 | "assignee link in task lists goes to a third form, /people?person=u1" | 1 | "assignee link goes to /people?person=u1 ... A third URL shape" |
| ROUTING-person-builder-handle-vs-id | 1 | "link to /people/maya (handle), but the page looks people up by id" | 1 | "personUrl() ... builds /people/<handle> ... route looks up by id" |
| ROUTING-deep-link-lost-on-sign-in | 1 | "Middleware builds ?next=... but the sign-in page always pushes /projects" | 0 | Not reported (only mentioned "beyond the sign-in redirect" as untested) |
| ROUTING-modal-direct-entry-back | 1 | "full page's 'Close' button does router.back() ... leaves the app" | 1 | "Open a task link directly ... Close leaves the app or does nothing." |
| CHROME-workspace-choice-dropped | 1 | "choice lives only in ?ws=. No link in the app carries it" | 1 | "?ws is added by WorkspaceSwitcher ... no link ... keeps it" |
| CHROME-dual-nav-active-conflict | 1 | "Active state is pathname === href" + "On /settings/members both Profile and Members are active" | 1 | "LeftNav.tsx:14 compares pathname === item.href" + "SettingsNav ... uses startsWith" |
| CHROME-tabs-docs-lose-project | 1 | "Project 'Docs' tab leaves the project. It goes to global /docs" | 1 | "lands on /docs ... project heading and tabs are gone" |
| CHROME-mobile-menu-stays-open | 1 | "Mobile menu stays open after you pick a page (verified)" | 1 | "keeps its own open state and never closes on navigation" |
| CONT-task-status-filter-not-in-url | 1 | "The status filter is local state and resets." | 1 | "reload ... status 'all' ... status and query are not in the URL" |
| CONT-task-search-leaks-between-projects | 1 | "query is stored in a module-level viewState object ... reappears" | 1 | "viewState.taskQuery is a module variable shared by every project" |
| CONT-invite-modal-history | 1 | "invite dialog also opens with replace and closes with push" (mechanism exact; symptom only "history gets odd") | 1 | "Close ... browser Back ... dialog is open again" + replace/push cause |
| CONT-tabs-replace-history | 1 | "Tabs use replace, so Overview → Tasks → Team → Back" leaves project | 1 | "Back returns to whatever was before Overview ... Tabs use replace" |

### Totals

| Area (max) | X | Y |
|---|---|---|
| IA (4) | 2.5 | 2.5 |
| Routing (6) | 6 | 5 |
| Chrome (4) | 4 | 4 |
| Continuity (4) | 4 | 4 |
| **Total (18)** | **16.5** | **15.5** |

Note on X invite-modal: scored 1 because the mechanism is stated exactly; a stricter reading (symptom vague) would give 0.5 and X = 16.

## Extra claims not in the key (verified against source)

### Report X

| Claim | Verdict | Source check |
|---|---|---|
| No `not-found.tsx`; unknown URLs give a bare 404 with no shell | true extra | No not-found file anywhere in src. The "in-app 404s keep the shell" detail is runtime-only, not checkable from source |
| Only Home and Projects read `ws`; other pages ignore workspace | true extra | Only home/page.tsx and projects/page.tsx call getWorkspaceId |
| Task opens as modal from project pages, full page from Home/My tasks | true extra | `@modal/(.)tasks` lives under projects/[projectId]; links from /home and /my-tasks are not intercepted |
| No project tab highlighted on a task page; Overview exact-only | true extra | ProjectTabs.tsx:15 exact match |
| No sign-out; signed-in user can still open /sign-in | true extra | No sign-out in src; middleware.ts:5 passes /sign-in unconditionally |
| Mobile menu shows no current page | true extra | MobileMenu.tsx renders links with no active class |
| Doc breadcrumbs link to non-existent /docs/specs | true extra | docs/[...slug] breadcrumb links each prefix; no doc with slug ['specs'] |
| Every page title is "Lumen" | true extra | Only root layout sets metadata |
| No Escape handling or focus trap in modal/dialogs (code-read) | true extra | Modal.tsx and InviteModal.tsx have no key handling |
| Hardcoded paths bypass URL builders | true extra | people/page.tsx:23 `/people/${p.id}`, docs/page.tsx:10 `/docs/import` |
| /docs/import would shadow a doc with slug `import` | judgment | Static route wins over catch-all; no such doc exists, latent only |
| Home and Projects show nearly the same cards | judgment | True content overlap; product call |
| `/` redirects to /projects while nav Home is /home | judgment | app/page.tsx:4; a consistency opinion |
| Workspace switcher crowds the mobile top bar | judgment | Layout opinion |
| Invalid `ws` shows a blank/incorrect selection because switcher and getWorkspaceId validate differently | false | Validation does differ, but a controlled select with an unknown value shows the first option (Acme) and getWorkspaceId also falls back to Acme, so the visible result matches |

Counts: 10 true extra, 4 judgment, 1 false.

### Report Y

| Claim | Verdict | Source check |
|---|---|---|
| "Only mine" lost when switching tabs and back | true extra | projectTabUrl builds links with no query string |
| Project from another workspace opens while switcher says Acme; My tasks/People/Docs/Insights ignore workspace | true extra | No workspace check in project layout; only Home/Projects read ws |
| Task opens as modal from project pages, full page from Home/My tasks; left nav highlights nothing there | true extra | Same as X |
| Modal overlay covers left nav; no backdrop-click or Esc close | true extra | `.overlay { position: fixed; inset: 0 }`, no onClick or key handler |
| Mobile menu is a second nav copy with no active state | true extra | MobileMenu.tsx |
| Doc breadcrumbs link to /docs/specs (404) | true extra | Same as X |
| Import's only entry is a bare text link on Docs index | judgment | docs/page.tsx:10; true, but an IA opinion layered on the key item |
| `/` redirects to /projects, not Home | judgment | Same as X |
| Home vs Projects vs My tasks overlap (Option C) | judgment | Partly credited on IA-my-tasks; rest is product opinion |

Counts: 6 true extra, 3 judgment, 0 false.

Evidence accuracy note for Y: several cited line numbers are off by 2 to 5 lines (SettingsNav startsWith is :12 not :15; TaskFilters useState :16 not :15; InviteModal replace :14 and push :23, cited :17 and :28; ProjectTabs replace :15 not :19; urls.ts docs tab :8 not :7, personUrl :13 not :11; people/page.tsx link :23 not :28; nav.ts timeline :17 not :14). The files and mechanisms are right; the line numbers are not. LeftNav.tsx:14 and Modal.tsx:9 are correct. Its "793 lines, 40 files" is 793 lines, 39 files.

## Quality ratings (1-5)

| Dimension | X | Y | Reason |
|---|---|---|---|
| Evidence quality | 3 | 4 | X: file names and "verified" flags, almost no line numbers, no step-by-step repros. Y: start/action/expected/observed blocks for most items, file:line citations, but many line numbers are off |
| Root-cause synthesis | 4 | 5 | X lists 5 structural problems after a flat bug table. Y organizes the whole report under 3 causes (state ownership, per-layer active/destination logic, links vs routes) with each symptom filed under its cause |
| Actionability | 4 | 4 | X: fix-now / decide / prevent tiers, shared isActive, typed route builders, nav-href smoke test. Y: staged rollout, URL param schema, concrete Playwright journey list, open questions for product calls |
| Architectural alternatives | 2 | 4 | X offers point choices (cookie vs path segment, modal vs page) without alternative structures. Y gives three options (tidy in place, workspace in path, merged landing) with cost, risk and when each is worth it |

## Qualitative difference

X finds slightly more of the key (it alone catches the lost sign-in deep link) and more true extras, as a dense, verified bug table followed by a short structure list. Y finds one fewer key defect but explains the app better: each defect comes with a reproduction and is filed under a root cause, and the fixes are framed as alternative architectures with tradeoffs. Several of Y's line citations are wrong.
