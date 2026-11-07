# Scoring: report P vs report Q against the lumen answer key

Scale: 1 = correct mechanism or user-visible symptom; 0.5 = partial; 0 = missed. Quotes are from the report (under 15 words).

## Key defects

| # | Defect | Area | P | P evidence | Q | Q evidence |
|---|---|---|---|---|---|---|
| 1 | IA-orphan-insights | ia | 1 | "Insights has no way in" (l.41) | 1 | "Insights has a page but no way to reach it." (l.35) |
| 2 | IA-members-split-across-branches | ia | 0.5 | "People vs Settings → Members. Both list the same people and roles." (l.89) | 0.5 | "People and Project Team show the same list (Team ignores the project)." (l.36) |
| 3 | IA-my-tasks-duplicates-task-filter | ia | 1 | "My tasks vs project Tasks with 'Only mine'. Same data, two places." (l.88) | 0 | not mentioned; My tasks appears only as a link origin (l.21) |
| 4 | IA-import-under-docs | ia | 1 | "hosts 'Import data' ... has nothing to do with docs" (l.90) | 1 | "'Import data' is a project/task CSV import but lives under Docs" (l.34) |
| 5 | ROUTING-dead-timeline-tab | routing | 1 | "'Timeline' goes to /projects/p1/timeline, which is a 404" (l.35) | 1 | "'Timeline' project tab is a dead end." (l.14) |
| 6 | ROUTING-redirect-chain-dashboard | routing | 1 | "Home never highlights and takes two redirects" (l.23) | 1 | "Home link takes two redirect hops." (l.18) |
| 7 | ROUTING-person-identity-query-vs-path | routing | 1 | "assignee link on every task row goes to /people?person=u1" (l.21) | 1 | "assignee link in task lists goes to a third form" (l.13) |
| 8 | ROUTING-person-builder-handle-vs-id | routing | 1 | "personUrl() builds /people/<handle> ... page looks people up by id" (l.20) | 1 | "link to /people/maya (handle), but the page looks people up by id" (l.13) |
| 9 | ROUTING-deep-link-lost-on-sign-in | routing | 1 | "hard-codes router.push('/projects') and never reads next" (l.46) | 1 | "Sign-in ignores next." (l.24) |
| 10 | ROUTING-modal-direct-entry-back | routing | 1 | "Open /projects/p1/tasks/t1 directly ... Close goes to about:blank." (l.80) | 1 | "Close button does router.back(), which with no history leaves the app" (l.21) |
| 11 | CHROME-workspace-choice-dropped | chrome | 1 | "workspace lives only in a ?ws= query param ... no link carries it" (l.54) | 1 | "The choice lives only in ?ws=. No link in the app carries it" (l.19) |
| 12 | CHROME-dual-nav-active-conflict | chrome | 1 | "On /settings/members both 'Profile' and 'Members' are active." (l.32) | 1 | "On /settings/members both Profile and Members are active." (l.17) |
| 13 | CHROME-tabs-docs-lose-project | chrome | 1 | "'Docs' goes to the global /docs" (l.36) | 1 | "Project 'Docs' tab leaves the project." (l.15) |
| 14 | CHROME-mobile-menu-stays-open | chrome | 1 | "stays open after you tap a destination" (l.92) | 1 | "Mobile menu stays open after you pick a page" (l.25) |
| 15 | CONT-task-status-filter-not-in-url | continuity | 1 | "Task status filter / useState / Lost on refresh" (l.63) | 1 | "The status filter is local state and resets." (l.20) |
| 16 | CONT-task-search-leaks-between-projects | continuity | 1 | "viewState.taskQuery is a module-level variable shared by every project" (l.69) | 1 | "stored in a module-level viewState object" (l.20) |
| 17 | CONT-invite-modal-history | continuity | 1 | "open uses replace, close uses push" (l.74) | 1 | "opens with replace and closes with push, so history gets odd" (l.39) |
| 18 | CONT-tabs-replace-history | continuity | 1 | "Back: you land on /projects, not on Tasks" (l.82) | 1 | "Tabs use replace, so Overview → Tasks → Team → Back" (l.22) |

Notes on partial scores:
- #2: both reports name only two of the three homes for people. P covers People and Settings/Members (and the roles overlap) but not the project Team tab. Q covers People and the project Team tab but frames it as a scoping bug, not as Members/roles being split, and never mentions Settings/Members.
- #17 for Q: the mechanism is exact; the consequence is vague ("history gets odd") and not verified. Scored 1 under the "correct mechanism" rule.
- #18 for P: P labels it "low, judgment" but reproduces it, so it is identified.

### Totals

| Area | Max | P | Q |
|---|---|---|---|
| ia | 4 | 3.5 | 2.5 |
| routing | 6 | 6 | 6 |
| chrome | 4 | 4 | 4 |
| continuity | 4 | 4 | 4 |
| **Total** | **18** | **17.5** | **16.5** |

## Extra claims not in the key (verified against source)

### Report P

| Claim | Verdict | Source check |
|---|---|---|
| Doc breadcrumbs link to non-existent prefixes (`/docs/specs` 404) | true extra | `docs/[...slug]/page.tsx` links every prefix; no doc with slug `['specs']` |
| `/projects/p1/tasks/t4` shows p2's task under Apollo; no projectId check | true extra | `tasks/[taskId]/page.tsx` calls `getTask(taskId)` only |
| Workspace ignored by Settings, People, Docs, My tasks; project pages do not check workspace | true extra | only `home` and `projects` call `getWorkspaceId`; My tasks lists p3's task |
| Task detail is a modal from project pages, a full page from Home/My tasks | true extra | interception lives only under `projects/[projectId]/@modal` |
| ProjectTabs show no active tab on task detail (exact match) | true extra | `ProjectTabs.tsx:15` exact compare |
| Invite Close drops other params such as `?person=` | true extra (minor) | `router.push(pathname)` |
| Mobile panel has no active state | true extra | `MobileMenu.tsx` sets no active class |
| "Only mine" pushes a Back stop per toggle; Back handled three ways | judgment | default Link push; defensible |
| Home vs Projects overlap; `/` and sign-in land on Projects | judgment | facts true (`app/page.tsx`, sign-in) |
| Unencoded `assigneeUrl` query, harmless today | judgment | true in code, P itself calls it harmless |
| Refresh in dialog: "project tab no longer highlighted" | false (minor) | with interception `usePathname` is already the task URL, so no tab is active in the modal either; "no longer" implies it was |

Counts: true extras 7, judgment 3, false 1.

Minor evidence drift: several cited line numbers are off by 1 to 3 (`urls.ts:11` is line 13, `data.ts:44` is 47, `sign-in/page.tsx:12` is 11, `InviteModal.tsx:15,24` are 14,23). Files and mechanisms are right.

### Report Q

| Claim | Verdict | Source check |
|---|---|---|
| No `not-found.tsx`; Timeline and `/nope` render a bare 404 without shell; in-app 404s give no way back | true extra | no `not-found.tsx` anywhere in `src/app` |
| ProjectTabs: no tab active on task page; Overview only on exact URL | true extra | exact compare in `ProjectTabs.tsx` |
| No sign-out; signed-in user can open `/sign-in` | true extra | middleware always passes `/sign-in`; no sign-out code |
| Mobile menu shows no current page | true extra | no active class |
| Hardcoded paths bypass builders (`/people/${p.id}`, `/docs/import`) | true extra | `people/page.tsx:23`, `docs/page.tsx:10` |
| `/docs/import` would shadow a doc with slug `import` | true extra (latent) | static segment wins over catch-all |
| Project Team ignores the project | true extra | `team/page.tsx` lists all `people` |
| Doc breadcrumbs link to segments that 404 | true extra | same as P |
| Every page title is "Lumen" | true extra | only root `metadata` exists |
| Modal has no Escape handling or focus trap | true extra | `Modal.tsx` has neither |
| Task detail modal vs full page depending on origin | true extra | same as P |
| `/` goes to Projects while nav Home goes elsewhere | judgment | facts true |
| Home and Projects show nearly the same cards | judgment | facts true |
| Mobile workspace switcher "cramped" | judgment | layout opinion, unverified |
| Invalid `ws` shows a "blank/incorrect selection" | false | validation does differ, but React selects the first option when no value matches, so the switcher shows Acme, matching the `getWorkspaceId` fallback |
| Smoke test asserting non-404 "would have caught bugs 2, 3 and 6" | false | bug 3 (`/docs`) and bug 6 (redirects end at 200 `/home`) both pass a non-404 check |

Counts: true extras 11, judgment 3, false 2.

## Quality ratings (1 to 5)

| Dimension | P | Q | Reason |
|---|---|---|---|
| Evidence quality | 5 | 3 | P gives start/action/expected/observed for most items, file:line citations, a verified-vs-read-only section and refutes the static map's false positives. Q tags some items "verified" but gives file names only and no reproduction steps. |
| Root-cause synthesis | 5 | 4 | P groups everything under four causes and adds a state-location table that explains the continuity bugs together. Q has a solid "structure problems" section but leaves the bugs as a flat list and links them to causes only loosely. |
| Actionability | 5 | 4 | P has an ordered, independently shippable plan, a safe `next` validation rule, and per-step browser regression checks. Q's fix list is concrete (shared `isActive`, typed route builders, smoke test) but has less verification detail, and its smoke test claim overstates coverage. |
| Architectural alternatives | 5 | 2 | P offers three distinct options (repair, workspace as URL root, work-centric rebuild) with costs, a consolidation matrix and the open questions that decide between them. Q offers only local choices (cookie vs path segment, modal vs page). |

## Qualitative difference

P is the stronger architecture review: it reproduces each defect step by step, explains the continuity bugs through one state table, and compares three real structural options with a migration plan. Q catches slightly more real secondary issues (missing not-found page, page titles, modal focus, Team not scoped to the project), but it misses the My tasks duplication, gives thinner evidence, and offers no structural alternative to choose between.
