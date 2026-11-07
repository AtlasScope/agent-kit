# Lumen toolkit scoring

Inputs: answer-key.json (18 defects), map/summary.md (static A), map-fixed/summary.md (static B), crawl-desktop/crawl.md, crawl-mobile/crawl.md. Claims checked against fixtures/lumen source.

Config 1 = static A + both crawls. Config 2 = static B + both crawls. The crawls are the same in both configs.

Scoring: 1 = right place and a correct or clearly related mechanism. 0.5 = right place but wrong mechanism, or only a vague lead. 0 = nothing. A signal that is false about the place it names (for example "nothing links here" when something does) gets 0, even if it names the right file.

## Per-defect scores

| Defect | Area | Config 1 | Config 2 | Evidence |
|---|---|---|---|---|
| IA-orphan-insights | ia | 1 | 1 | A `ia-3`, B `ia-1` "No in-app path reaches /insights". Source confirms nothing links to it. |
| IA-members-split-across-branches | ia | 0.5 | 0.5 | Crawl `near-duplicate` /people ~ /projects/p*/team. Covers two of the three places and never mentions /settings/members (roles). It is a similarity score, not a finding about where people are managed. A `ia-5`/`ia-11` call /people and /settings/members orphans, which is false. |
| IA-my-tasks-duplicates-task-filter | ia | 0 | 0 | No near-duplicate between /my-tasks and /projects/*/tasks?assignee=me. A `ia-4` calls /my-tasks an orphan, which is false (LeftNav links it). |
| IA-import-under-docs | ia | 0 | 0 | Route listed, no signal. |
| ROUTING-dead-timeline-tab | routing | 1 | 1 | Crawl `dead-page` /projects/p1,p2,p3/timeline 404, linkedFrom nav:Project "Timeline". |
| ROUTING-redirect-chain-dashboard | routing | 1 | 1 | Static `routing-1` and crawl `redirect-chain` /dashboard → /overview → /home. Neither notes that Home is then never active. |
| ROUTING-person-identity-query-vs-path | routing | 0.5 | 0.5 | Static `routing-2` names assigneeUrl() in src/lib/urls.ts:14, the right function, but says the problem is missing encoding. Ids are u1..u3, so encoding is not a live problem. The crawl table shows both /people?person=u1 and /people/u1 returning 200 but raises no finding. |
| ROUTING-person-builder-handle-vs-id | routing | 0.5 | 0.5 | Crawl `dead-page` /people/maya, /people/dev, /people/ines 404 (both crawls). The symptom is right, but linkedFrom is empty, so it does not point at the task detail, modal or Team tab links or at personUrl(). Static B resolves personUrl (it leaves the unresolved list) but raises no signal. |
| ROUTING-deep-link-lost-on-sign-in | routing | 0 | 0 | Only A `ia-12` / B `ia-6` "No in-app path reaches /sign-in", which is false because middleware redirects there. Nothing about `next` being ignored. A lenient reading would give 0.5 in both configs. |
| ROUTING-modal-direct-entry-back | routing | 0 | 0 | The crawl loaded /projects/p1/tasks/t1 directly (200) and raised nothing. A `ia-7`/`ia-8` and B `ia-3`/`ia-4` call the task routes orphans, which is false (TaskList and Home link them). |
| CHROME-workspace-choice-dropped | chrome | 0 | 0 | B lists WorkspaceSwitcher in the chrome table (0 destinations) but raises no signal. |
| CHROME-dual-nav-active-conflict | chrome | 1 | 1 | Desktop crawl `active-state-mismatch`: on /projects/p1 the aside is unmarked; on /settings/members nav:Settings marks both /settings and /settings/members. B adds `chrome-2` (exact vs prefix) and `chrome-3` (LeftNav exact match), which are correct but add no score. |
| CHROME-tabs-docs-lose-project | chrome | 0.5 | 0.5 | Desktop crawl `duplicate-nav`: /docs is linked from aside and nav:Project. That is the right link, but it is framed as duplication, not as leaving the project and losing its header and tabs. |
| CHROME-mobile-menu-stays-open | chrome | 0 | 0 | The mobile crawl never opened the menu. It even lists the hidden aside as the nav region. B `chrome-5` names MobileMenu, but its claim is false (see below), so 0. |
| CONT-task-status-filter-not-in-url | continuity | 0 | 0 | Nothing. |
| CONT-task-search-leaks-between-projects | continuity | 0 | 0 | Nothing. |
| CONT-invite-modal-history | continuity | 0 | 0 | The crawl loaded /people?invite=1 and raised nothing. A only lists InviteModal `pathname` as unresolved. |
| CONT-tabs-replace-history | continuity | 0 | 0 | Nothing. |

## Totals

| Area | Max | Config 1 | Config 2 |
|---|---|---|---|
| ia | 4 | 1.5 | 1.5 |
| routing | 6 | 3 | 3 |
| chrome | 4 | 1.5 | 1.5 |
| continuity | 4 | 0 | 0 |
| **Total** | 18 | **6** | **6** |

Fixing the parser did not change the key score. Every key defect that B's new chrome signals touch was already scored from the desktop crawl. The fix's effect is on noise.

## False signals

Repeats of one finding type on the same underlying claim count once.

### Static A (11 false)

- `ia-1` /docs: LeftNav links it.
- `ia-2` /docs/*slug: the docs index and breadcrumbs link it.
- `ia-4` /my-tasks: LeftNav links it.
- `ia-5` /people: LeftNav links it.
- `ia-6` /projects/:id/tasks: ProjectTabs links it.
- `ia-7` and `ia-8`, the task modal and task page: TaskList and Home link them.
- `ia-9` /projects/:id/team: ProjectTabs links it.
- `ia-10` /settings: LeftNav and SettingsNav link it.
- `ia-11` /settings/members: SettingsNav links it.
- `ia-12` /sign-in: middleware redirects there.

### Static B (7 false)

- `ia-2`, `ia-3`, `ia-4`, `ia-5` and `ia-6`: the same false orphans as A for the tasks, task detail, team and sign-in routes. The parser fix did not resolve ProjectTabs `href` or `taskUrl`.
- `chrome-1`, "5 destinations linked from more than one persistent nav system": four of the five come from LeftNav and MobileMenu, which render the same primaryNav and are never visible together. The real part, /settings as both "Settings" and "Profile", is the same issue as `chrome-4`.
- `chrome-5`, "/settings/workspace, /settings/members not reachable from small-screen navigation": false. SettingsNav is in the settings layout and is not hidden at narrow widths, so both pages are one tap from /settings on mobile, the same as on desktop.

### Crawls (1 false, same in both configs)

- `embeds` "/home contains most of /projects" (info): Home is a workspace-filtered project summary by design, which is not a problem.

### Not counted

`routing-2` (unencoded assigneeUrl) is credited 0.5 above for locating the query-vs-path defect. On its own terms it is not a live problem, because the values are fixed ids. Count it as a 12th false signal for A and an 8th for B if partial credit should not offset it.

## True findings not in the key

### Crawls (3, same in both configs)

- `dead-page` /docs/specs: the breadcrumb on /docs/specs/launch-plan links /docs/specs, and no such doc exists, so it 404s. linkedFrom is empty, a crawler attribution gap.
- `near-duplicate` between /projects/p1/team, p2/team and p3/team: ProjectTeam ignores projectId and shows every person for every project.
- `no-visible-nav` on /projects/*/timeline (mobile crawl): the 404 for a missing project subpage renders the root not-found with no app chrome, so the user has no way back. It is reached through the timeline defect but is a separate gap (no not-found page inside the (app) layout).

### Static B only (1)

- `chrome-4`: /settings is labelled "Settings" in LeftNav and "Profile" in SettingsNav. This is a real label inconsistency.

## Summary

| | Key score /18 | ia /4 | routing /6 | chrome /4 | continuity /4 | False | True extra |
|---|---|---|---|---|---|---|---|
| Config 1 (static A + crawls) | 6 | 1.5 | 3 | 1.5 | 0 | 12 | 3 |
| Config 2 (static B + crawls) | 6 | 1.5 | 3 | 1.5 | 0 | 8 | 4 |

## Structural blind spot

The static pass only maps link targets, and the crawl only GETs each URL fresh and compares pages. The toolkit never clicks, types, refreshes, presses Back or carries state from one page to the next. So it cannot see any defect that lives in interaction sequences or client state:

- history replace and push (tabs, invite dialog, modal back)
- state that leaks or resets across navigation (search, status filter, the ?ws= workspace choice)
- open and closed UI state (mobile menu)

It also cannot see meaning-level IA problems such as import filed under Docs or My tasks duplicating a filter.
