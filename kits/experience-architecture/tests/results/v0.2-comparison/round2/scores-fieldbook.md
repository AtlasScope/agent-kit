# Blind scoring: Fieldbook reviews

Every claim was checked against `fieldbook-app/` (README, server.py, public/app.js, index.html, styles.css, ADRs 0003/0005/0007/0008). `archive-check.txt` reports archived=no for all 24 reports, so the "no archive" item passes everywhere. I did not open the mapping files.

Ratings are 1-5: Ev = evidence, RC = root causes, St = structural judgment, Act = actionability, Own = owner clarity. "False" counts claims the source contradicts.

Line numbers that are off by a few lines, or written as "~L", are counted against evidence rather than listed as false claims. One standard was used for everything. For example, when a report illustrates a point with a specific number (a status count, a row count), it is checked against the fixture data.

Fixture facts used in checking: Acme has 30 projects (15 active, 8 paused, 7 done) and 135 tasks, 45 of them done. Globex project ids are g1-g8. Archive only appends a line to archive.log, so DATA never changes. /api/members has no role check.

## Scenario 1: fieldbook-full (12 items)

Items: 1 filter lost on Back · 2 tabs and inspector not in URL · 3 history.back up-link · 4 workspace not in URL · 5 nav current is an exact match · 6 static title · 7 mobile menu or div links · 8 Team merge keeps gating · 9 overturns ADR-0005 · 10 routes and migration · 11 runtime evidence · 12 no archive

| Rpt | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | Pass | Ev | RC | St | Act | Own | False |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | P | P | P | P | P | P | P | P | P | P | P | P | 12/12 | 5 | 5 | 5 | 5 | 4 | 0 |
| B | P | P | F | P | P | P | P | F | P | F | F | P | 8/12 | 3 | 4 | 4 | 4 | 4 | 0 |
| C | P | P | P | P | P | P | P | P | P | P | P | P | 12/12 | 5 | 5 | 5 | 5 | 5 | 1 |
| D | P | P | P | P | P | P | P | F | P | P | P | P | 11/12 | 5 | 5 | 5 | 5 | 5 | 0 |
| E | P | P | P | P | P | P | P | P | P | P | P | P | 12/12 | 5 | 5 | 5 | 5 | 4 | 0 |
| F | P | P | P | P | P | P | P | P | P | P | P | P | 12/12 | 5 | 5 | 4 | 5 | 4 | 0 |
| G | P | P | P | P | P | P | P | P | P | F | F | P | 10/12 | 3 | 4 | 4 | 4 | 4 | 2 |
| H | P | P | F | P | P | P | P | P | P | P | P | P | 11/12 | 4 | 5 | 5 | 5 | 5 | 0 |
| I | P | P | P | P | P | P | P | P | P | P | F | P | 11/12 | 3 | 5 | 5 | 5 | 5 | 2 |
| J | P | P | P | P | P | P | P | F | P | P | P | P | 11/12 | 4 | 5 | 5 | 5 | 5 | 1 |
| K | P | P | P | P | P | P | P | P | P | P | F | P | 11/12 | 3 | 5 | 5 | 5 | 5 | 0 |
| L | P | P | P | P | P | P | P | F | P | F | F | P | 9/12 | 3 | 4 | 4 | 4 | 3 | 2 |

### How the borderline items were judged
- Item 8 passes only when the report recommends one Team screen, keeps management admin-only, and says outright that non-admins can already see the member list (emails and roles) on /team or through the API. Saying "both pages show the same list" without that is not enough (D, J, L). Keeping two pages (B) fails.
- Item 10 needs URL patterns, an ordered migration, and redirects or fallbacks for existing URLs written into the plan. Code-review reports that only list fixes with "/projects/:id stays valid" in passing fail (B, G, L).

### Per-report notes (full)

**A.** Ran 9 Playwright journeys with mutations blocked, and labels what was observed versus read in code (F8 and F9 are marked code-only). The state-ownership table and route table are strong. It answers ADR-0005 point by point and keeps ADR-0003, with redirects in a 7-step migration. Weaknesses: many line refs are off (app.js:108 for history.back, which is really 119; app.js:50-55 for markCurrentNav, really 53-58). The top recommendations number "3" twice and say to "fold /tasks into Projects", which the tradeoffs section later rejects. The chat message is dense with code terms (store.pendingTaskId, localStorage). No false behaviour claims.

**B.** Code-only, and says so up front. It is accurate: 45 done tasks out of 135 is correct, and it catches the async render race, the archive no-op, and that the project tab shows a check mark for done tasks while /tasks does not. Item 3 fails: it says "Back to projects" can return you to /tasks but never that it exits the app on a cold link. Item 8 fails: it leans toward keeping both Team pages and does not flag that members can see emails and roles. Item 10 fails: the suggested order has no redirects, even though the URL scheme moves the workspace into the path. Clear questions for the owner. No false claims.

**C.** Browser journeys plus code, with line refs that match the source exactly. It labels each finding as reproduced or code-certain, says what it did not check, and notes a journey that stopped early. Strong verdict and end-state table. It amends ADR-0005 using `?tab=` and answers both rationale points. Team is merged, and it explains that members can already read that list. The migration is ordered and states for each step whether existing links keep working. The chat message is plain English and ends with one decision. One false claim: folding Reports and dropping its sidebar item "would reopen ADR-0003 slot, not break it". ADR-0003 fixes five items and locks the labels.

**D.** 18 journeys at desktop and phone widths. It filters out runner noise (no-visible-nav) and is honest that the scroll check measured the wrong container. Good end state with `/w/:ws` and redirects. Overturns ADR-0005 and answers the email-link reasoning. Item 8 fails because it does not say that non-admins see emails and roles. The attached static-analysis summary.md contains false "route not served" signals. They are labelled as unconfirmed candidates and the report does not adopt them, so they are not counted. server.py:94 is off. No false claims.

**E.** Same probe style as A, with 9 journeys. Thorough, and it answers all three ADR-0005 rationale points, including "tabs are a presentation detail". It explicitly notes that /team shows emails and roles to any member. The migration has a flag and redirects. The chat message's "Back closes nothing... in the probe it left the app" sits under the /tasks bullet, but that probe (J5) started from a direct open, which is slight misattribution. In J2, the probe's step table shows a cold-open tab that disagrees with its own drift line, and the report repeats the drift line without flagging it. No false claims.

**F.** 15 journeys and a complete current and proposed route map, including the comment-draft data-loss finding. It proposes removing Team from the sidebar ("frees a slot"). The summary calls ADR-0003 "partly overturned" while the decisions section says "honoured in spirit". That is internally inconsistent, and it treats the locked-labels clause lightly, hence St 4. Line refs are written as "~L" and are inaccurate. No false behaviour claims.

**G.** Code-only with precise line refs. It has extra observations: [] returned for an unknown workspace, members not scoped to a workspace, the async race, and vocabulary drift between "Status" on projects and "Open/Done" on tasks. Items 10 and 11 fail. The order of work has no redirects, and nothing ran. The owner summary is reasonable but mixes in many small items. False claims (2): the example "Paused: 7" (Acme has 8 paused), and "Back to projects" going back to Reports, which cannot open a project. The node_modules and port remarks cannot be checked from the source and are not counted.

**H.** 13 journeys at two widths. It discards the no-visible-nav noise and is clear and well structured. Item 3 fails: it says history.back "restores the URL but not the state" but never that it leaves the app from a pasted link. The "scroll drops to top of /tasks" finding rests on a window.scrollY probe, and the app scrolls inside main, so that evidence cannot show anything (Ev 4). The conclusion itself is likely right. It frames the Reports and ADR-0003 question correctly as the owner's call. No false claims.

**I.** Code-only and labelled that way. Thorough, with a good catch: pendingTaskId is never cleared when the project is not found. It reverses ADR-0005 for the Tasks tab and the inspector, with legacy redirects. Item 11 fails. False claims (2): "roughly 120 undifferentiated rows" (it is 135), and folding Reports away "ADR-0003 allows this" (that ADR fixes the five items). A few line refs are off (server.py:70-71 for /api/members).

**J.** Browser journeys plus code, honest about a journey that failed on a bad selector and was rerun. Extra catch: /settings/bogus silently shows General. Item 8 fails: "two doors to one room, one locked" never says members can see emails and roles. Several line refs are wrong (closeDrawer at ":176", really 221; openTask at ":127-141", really 151-164). False claim (1): "Task checkbox... in the inspector do nothing". The inspector has no checkbox.

**K.** Code-only and labelled. Thorough, with sound causes, and it notes that /team shows names, emails and roles to everyone. The address model includes redirects. Item 11 fails. Several line refs are wrong (index.html:14-19 for the mobile menu, server.py:93-95). The decision is put clearly for the owner. No false claims.

**L.** Code-only. Broad, but a lot of it is general hygiene and refactoring (module split, data layer, badges). The structural argument is diluted, and workspace-in-path is offered only as an option. Item 8 fails (it does not say members can see emails and roles), as do item 10 (no routes table or redirects in the order of work) and item 11. The chat message lists problems but asks the owner for no decision. False claims (2): "~150 rows for Acme" (135), and "Reports shows active: 12" (Acme has 15 active).

## Scenario 2: fieldbook-narrow (8 items)

Items: 1 Back leaves the project (observed) · 2 drawer has no history · 3 no task URL plus pendingTaskId · 4 task URL proposal · 5 challenges ADR-0005 · 6 workspace as a second cause · 7 /tasks opens over Overview · 8 staged changes that keep /projects/:id working

| Rpt | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | Pass | Ev | RC | St | Act | Own | False |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | P | P | P | P | F | P | F | P | 6/8 | 5 | 5 | 3 | 5 | 5 | 0 |
| B | P | P | P | P | F | P | F | P | 6/8 | 5 | 5 | 3 | 5 | 4 | 0 |
| C | P | P | P | P | F | P | P | P | 7/8 | 5 | 5 | 4 | 5 | 4 | 0 |
| D | P | P | P | P | P | F | F | P | 6/8 | 4 | 5 | 4 | 4 | 4 | 0 |
| E | P | P | P | P | F | P | F | P | 6/8 | 5 | 5 | 3 | 5 | 5 | 0 |
| F | P | P | P | P | F | P | P | P | 7/8 | 5 | 5 | 4 | 5 | 4 | 0 |
| G | P | P | P | P | F | P | F | F | 5/8 | 4 | 5 | 3 | 4 | 4 | 1 |
| H | P | P | P | P | F | P | F | P | 6/8 | 5 | 5 | 3 | 5 | 5 | 0 |
| I | P | P | P | P | F | F | F | F | 4/8 | 4 | 3 | 2 | 4 | 4 | 0 |
| J | P | P | P | P | F | P | F | F | 5/8 | 4 | 5 | 3 | 4 | 4 | 0 |
| K | P | P | P | P | F | P | F | P | 6/8 | 5 | 5 | 3 | 5 | 5 | 1 |
| L | P | P | P | P | F | F | F | P | 5/8 | 4 | 4 | 2 | 4 | 4 | 0 |

### How the borderline items were judged
- Item 5: 11 of the 12 reports keep ADR-0005 and argue that the inspector is not a tab. Only D recommends an amendment, using `?tab=tasks`, and engages with the ADR's reasoning. Its chat message then hands that choice to the owner, so this is a lenient pass.
- Item 7 needs the report to say that opening a task from /tasks today lands on the Overview tab. Proposing that a `?task=` link should pre-select the Tasks tab does not count. Only C (F2) and F (the "Overview behind the inspector" state in Journey E) say it.
- Item 8 needs an ordered list of changes and an explicit statement that existing /projects/:id links keep working. G and I never state the second part, and J's changes are not sequenced.

### Per-report notes (narrow)

**A.** Six journeys, cleanly labelled. Best insight in the set: once the drawer gets a history entry, the router will rebuild the page and reset the tab on Back, so render() must become drawer-aware. It respects ADR-0005 with a reason ("a record view, not a tab") but treats the ADR mostly as a constraint. It does not note that /tasks opens over Overview. The workspace decision is put clearly for the owner. No false claims.

**B.** A compact reproduction table, including the useful check that `?task=` is currently ignored. Same drawer-aware render insight as A. It keeps ADR-0005 and accepts "drawer over Overview" as the cost, which is a reasoned position but does not challenge the ADR. The workspace point is only an edge case, and it never says the current /tasks flow lands on Overview. No question for the owner. No false claims.

**C.** Thorough probe and state table. It is the most complete on the /tasks to Overview mismatch, and proposes defaulting to the Tasks tab when `?task=` is present. It weighs ADR-0005 on the merits and keeps it, offering `?tab=` as an optional amendment. The migration explicitly keeps old links working. Line refs written as "~" are off (history.back at ~101, really 119). No false claims.

**D.** Probe-backed. It is the only report to recommend amending ADR-0005, but the chat message softens that into the owner's call. It never ties the workspace to localStorage or to pasted links (item 6), and does not note the Overview landing. Many line refs are wrong (app.js:130 for history.back, :197-203 for the /tasks click, :121 for Not found). No false behaviour claims.

**E.** Clear reproduction with a state ledger, honest about the cross-workspace result not being proven end to end, and about one journey ending on a blank page. It keeps ADR-0005. Fixes are sequenced and say that existing links keep working. Good decision prompts. No false claims.

**F.** Full probe set, a proposed `/w/:workspace` route map, and migration with redirects. It explicitly notes and fixes the "Overview behind the inspector" state from /tasks. It keeps ADR-0005. The chat line "From /tasks, Back skips the project entirely" is muddled wording. Calling the workspace problem "probably most of the 'never open the task' reports" is speculation, labelled with "probably". No false claims.

**G.** A reproduction table with gaps in its row numbering (rows 6-7 missing), and few line refs. Its causes are correct and it lays out the workspace options well. It never states that existing /projects/:id links keep working. False claim (1): "Back to projects" can go back to Reports, but Reports has no route into a project.

**H.** Six journeys, plain owner summary, and a sensible workspace-lookup proposal with an access caveat. It keeps ADR-0005 and recommends leaving the tab alone, so it misses the Overview landing. Fixes are in shipping order and old links keep working. No false claims.

**I.** The core cause is reproduced well, but it never mentions the workspace and localStorage cause. It keeps ADR-0005 and recommends leaving the drawer over whichever tab is showing. It does not say existing links keep working, and the owner decision it asks for is cosmetic. Weakest root-cause coverage in the set. No false claims.

**J.** A good reproduction table, including that `?task=` is ignored today, and the correct point that the router's `\w+` would reject task ids like t-p1-1 in a path segment. It keeps ADR-0005 and calls defaulting to Overview "acceptable". The recommendations are an unordered bullet list. No false claims.

**K.** Six journeys and a clear workspace "ask first" decision for the owner. Fixes are in ship order and old links keep working. It keeps ADR-0005. False claim (1): it puts quotes around ADR-0007 saying tasks are only reachable "through the project", and the ADR contains no such phrase. It also labels the filter reset as reproduced while saying it was not run.

**L.** The core cause is reproduced. It says other workspaces were "not checked" and never raises localStorage as a cause of dead links. It keeps ADR-0005 ("nobody pastes the Activity tab", which is an unsupported assertion). Its claim that a stale pendingTaskId "can open the wrong inspector" is overstated: it can only reopen that same task later. Not counted. Smallest-first fixes keep old links working. No false claims.
