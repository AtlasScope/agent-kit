# Blind scoring: Fieldbook reviews

Ratings are 1 to 5. "False" counts claims that the app source (README, server.py, public/*, docs/adr/*) contradicts. Line-number drift in code citations is recorded in the notes but not counted as a false claim. Claims about the reviewer's environment that the supplied source cannot confirm or refute (for example "node_modules is committed") are listed as unverifiable and not counted.

Fixture facts used for checking: Acme has 30 projects (15 active, 8 paused, 7 done) and 135 tasks (45 done). Globex has 8 projects (g1 to g8).

## Scenario 1: fieldbook-full (12 items)

| Report | Items passed | Evidence | Root causes | Structural judgment | Actionability | Owner clarity | False claims |
|---|---|---|---|---|---|---|---|
| A | 12/12 | 5 | 5 | 5 | 5 | 4 | 0 |
| B | 9/12 | 3 | 4 | 4 | 4 | 4 | 0 |
| C | 11/12 | 3 | 5 | 5 | 4 | 5 | 0 |
| D | 11/12 | 5 | 5 | 5 | 4 | 5 | 0 |
| E | 10/12 | 3 | 4 | 4 | 4 | 3 | 1 |
| F | 11/12 | 3 | 5 | 5 | 5 | 5 | 1 |
| G | 12/12 | 5 | 5 | 5 | 5 | 4 | 0 |
| H | 12/12 | 5 | 5 | 4 | 5 | 4 | 0 |
| I | 10/12 | 3 | 4 | 4 | 4 | 3 | 2 |

## Scenario 2: fieldbook-narrow (8 items)

| Report | Items passed | Evidence | Root causes | Structural judgment | Actionability | Owner clarity | False claims |
|---|---|---|---|---|---|---|---|
| A | 7/8 | 4 | 5 | 4 | 5 | 4 | 1 |
| B | 5/8 | 5 | 5 | 3 | 4 | 3 | 0 |
| C | 5/8 | 5 | 5 | 3 | 5 | 5 | 1 |
| D | 7/8 | 5 | 5 | 4 | 5 | 4 | 0 |
| E | 4/8 | 5 | 5 | 3 | 4 | 5 | 0 |
| F | 6/8 | 5 | 5 | 3 | 5 | 3 | 0 |
| G | 6/8 | 4 | 5 | 4 | 5 | 4 | 0 |
| H | 6/8 | 5 | 5 | 3 | 5 | 5 | 0 |
| I | 6/8 | 5 | 5 | 3 | 4 | 4 | 0 |

---

## Per-report notes: fieldbook-full

Item key: 01 filter lost on Back · 02 tabs/inspector not in URL · 03 history.back() Up link · 04 workspace not in URL · 05 nav current exact match · 06 static title · 07 mobile Reports / rows not links · 08 Team merge keeps gating · 09 overturns ADR-0005 · 10 routes + migration · 11 runtime evidence · 12 no archive.

### A (12/12)
- 01 pass: J1 probe, closure vars in renderProjects. 02 pass: J2/J4/J12. 03 pass: J6 cold open leaves app. 04 pass: localStorage, J7 Not found, X2 Globex link. 05 pass. 06 pass. 07 pass: both. 08 pass: one list in Settings, admin actions only, notes /team shows names, emails and roles to members. 09 pass: answers email-URL and router rationale. 10 pass: full /w/:ws route map, four phases with replace-redirects. 11 pass: 15 probe journeys. 12 pass.
- Strong separation of observed vs code-only (Archive marked code-only). Root causes per finding. Tradeoffs section rejects alternatives on reasons.
- Line citations are approximate ("~L218" etc.) and several are off by 5 to 20 lines. Summary says ADR-0003 is "partly overturned" while the body says it is honoured; minor inconsistency.
- Owner clarity: chat is plain about user impact but leans on terms like `localStorage` and `history.back()`; no explicit owner question in chat.
- False claims: none.

### B (9/12)
- 01 pass. 02 pass. 03 fail: says history.back() returns to /tasks; never says a direct-link arrival leaves the app. 04 pass. 05 pass. 06 pass: proposes per-route title, notes current lack of feedback (thin). 07 pass. 08 fail: recommends keeping both Team pages; does not raise /team exposing emails and roles to members. 09 pass: answers both ADR rationale points. 10 pass: concrete routes, ordered plan, states /projects/:id stays valid (no explicit redirect plan for the /w/ move). 11 fail: code only. 12 pass.
- Clearly labelled as code-derived. Good extra catches: async render race, unwired Settings fields, 45 done tasks out of 135 (correct).
- Structural: thoughtful on ADR-0008 (keeps it but makes the pages different), keeps 0003/0007.
- False claims: none. "You run 4401" is an environment remark, not checkable.

### C (11/12)
- 01 to 10 pass. 08: merges into /team with admin-only controls, notes /api/members returns names, emails and roles and /team shows them to everyone. 10: /w/:ws routes, "everything that exists today keeps working and redirects". 11 fail: explicitly not run. 12 pass.
- Best-organised code-only report: causes A to D with symptoms grouped, "code-certain" vs "likely" per finding, explicit structure verdict.
- index.html line citations are wrong (mobile menu is lines 21-26, not 14-19; sidebar 28-34; main tabindex is line 35). Substance is correct.
- Plan splits quick fixes from one structural block; the structural block is not internally sequenced.
- Owner clarity: very plain "What users hit" chat, one clear decision.
- False claims: none.

### D (11/12)
- 01 pass. 02 pass. 03 fail: notes history.back() only "does restore the URL"; the fix list implies the direct-link problem but never states it. 04 to 10 pass (08: one /team, Settings > Team only as admin section, notes API returns same data to anyone). 11 pass: 13 journeys desktop and mobile. 12 pass.
- Excellent evidence hygiene: a table of reproduced vs code-only vs not checked, and it discards a false "no visible nav" mobile signal with a reason.
- The "Back from a task drops you at the top of /tasks" finding rests on a window.scrollY check, but the app scrolls inside `<main>`, so that measurement could not show anything else. The conclusion is still true by code (main content is replaced), so not counted.
- Structural: raises Reports-folding and workspace-in-path as conditional owner decisions; good restraint.
- False claims: none.

### E (10/12)
- 01 to 10 pass (08: one /team with inline role controls, "the gate hides nothing that /team doesn't show"). 11 fail. 12 pass.
- Code-only, clearly labelled, with line citations that are mostly accurate. Adds useful server-model points (members not workspace-scoped, unknown workspace returns 200 []).
- Root causes start strong ("one pattern") but later sections become a flat issue list (vocabulary, badges, client structure).
- Owner clarity: chat is a dense technical bullet list (pendingTaskId, localStorage, history.back) with no single decision question.
- False claims (1): gives `"Paused: 7"` as what Reports shows; Acme has 8 paused projects. Unverifiable: "node_modules committed, ~366k lines".

### F (11/12)
- 01 to 10 pass (03: "from a pasted link... leaves the app"; 08: one /team, admin controls only, notes API returns list to anyone; 10: /w/:ws with legacy redirects and id lookup). 11 fail. 12 pass.
- Code-only with file:line and "code-certain/likely" labels. Catches subtle issues: pendingTaskId never cleared when project not found, second task open discards first comment, Back returns to archived project.
- Structure verdict explicitly rejects a redesign. Quick wins plus four ordered structural steps with sizes.
- Owner clarity: plain chat, one decision framed in user terms.
- False claims (1): "roughly 120 undifferentiated rows" on /tasks; actual is 135. Unverifiable: committed node_modules.

### G (12/12)
- All items pass. 08: one /w/:ws/team with role-gated actions, notes /team shows name, email and role to any member. 10: full /w/:ws map, five-phase migration, redirects from every old URL. 11: nine probe journeys.
- Clean state-ownership table, per-finding observed/implementation/root cause, alternatives with reasons, safeguards section. Archive and admin view labelled not observed.
- Owner clarity: chat is clear but has no explicit owner question; open questions sit in the report.
- False claims: none.

### H (12/12)
- All items pass. 08: one screen, admin controls, notes Dana sees every email and role at /team.
- Strong evidence (Forward-without-inspector probe, workspace reload stays broken) and a seven-step migration that puts server authorization early.
- Structural judgment docked: the summary's list says "Fold /tasks into Projects as a cross-project Tasks view", while the body keeps /tasks and explicitly rejects merging it. The summary also numbers two items "3".
- app.js line citations are frequently off (closeDrawer call cited as :164, actual 221; back button :108, actual 119).
- False claims: none against source; internal contradiction noted above.

### I (10/12)
- 01 to 07 pass. 08 fail: recommends one Team page with admin-only controls but never points out that /team already exposes member emails and roles to non-admins. 09 pass. 10 pass: query params plus /w/acme path, ordered work, /projects/:id stays canonical. 11 fail. 12 pass.
- Code-only, few precise locations (mostly function names). Good catches: async race, no res.ok checks, ADR numbering gaps.
- Root causes framed as three missing sources of truth; later priorities drift into general refactoring (module split, data layer) that is less tied to the complaint.
- Owner clarity: long technical chat, no decision question.
- False claims (2): "~150 rows for Acme" on /tasks (actual 135); "Reports shows `active: 12`" (actual 15 active). Unverifiable: committed node_modules.

---

## Per-report notes: fieldbook-narrow

Item key: 01 Back leaves project (observed) · 02 drawer has no history (openTask) · 03 no task URL + pendingTaskId · 04 task URL proposal · 05 tab in URL / revise ADR-0005 · 06 workspace localStorage as second cause · 07 /tasks opens over Overview · 08 staged changes keeping /projects/:id links.

### A (7/8)
- 01 to 04 pass. 05 fail: keeps ADR-0005 ("?tab= is a small addition later"). 06 pass: workspace as second cause with Globex link probe. 07 pass: "removes the odd 'Overview behind the inspector' state in Journey E". 08 pass: four-step migration, replace-redirects keep /projects/:id links.
- Rich probe evidence and code locations, plus a safeguard note on cross-workspace membership.
- False/unsupported (1): F1 describes Journey C as "Projects → p1 → Tasks tab → task → Back → about:blank", and the chat says Back from the inspector lands on about:blank. The probe actually started with a direct goto of /projects/p1, which is why it reached about:blank; from the Projects list Back would land on /projects. The repro is misdescribed and overgeneralised.
- Structural: weighs path vs query vs standalone task page and rejects each on reasons; proposes /w/ path, which is a large change for a narrow brief, but frames a smaller phase 1.

### B (5/8)
- 01 pass: repro table, Back to /projects. 02 pass. 03 pass. 04 pass: ?task=. 05 fail: says ADR-0005 needs no change. 06 pass: workspace caveat with prefix/ws= options. 07 fail: mentions defaulting a task link to Overview as acceptable, but not that /tasks opens the inspector over Overview today. 08 fail: change list is unordered and not staged (does say /projects/:id stays valid).
- Correct and useful point that the router's `\w+` pattern rejects task ids with hyphens. Includes a test plan.
- Owner clarity: chat is function-name heavy (openTask, pendingTaskId, navigate) with no clear owner decision.
- False claims: none.

### C (5/8)
- 01 to 04 pass. 05 fail: keeps ADR-0005, argues nobody shares a tab. 06 fail: workspace not mentioned (only "other workspaces not checked"). 07 fail: proposes Tasks tab on ?task= but does not note /tasks opens over Overview today. 08 pass: smallest-first list, "existing links are unaffected".
- Clear reproduced vs code-only labelling; plain owner message with one decision.
- False/unsupported (1): says a stale pendingTaskId "can open the wrong inspector later". Task ids are project-scoped (t-pN-k) and openTask looks only inside the rendered project, so a stale id can only reopen its own task when that project is next rendered, never a wrong one.

### D (7/8)
- 01 to 04 pass. 05 fail: ADR-0005 "kept for now", with a conditional ?tab= amendment. 06 pass: workspace switch probe plus code-only cross-user case, clearly labelled. 07 pass: F2 states the tab behind the drawer is Overview, not Tasks. 08 pass: five-step migration, existing /projects/:id links keep working.
- Good structure: state-ownership table, sequences, safeguards (server membership check), analytics note.
- Line citations marked approximate and some are well off (back button "~101", actual 119).
- False claims: none.

### E (4/8)
- 01 to 04 pass. 05 fail: keeps ADR-0005. 06 fail: no mention of workspace. 07 fail: discusses whether a link should switch to Tasks, but not that /tasks opens over Overview today. 08 fail: numbered fixes, but never says existing /projects/:id links keep working.
- Evidence is solid (journey failures for Back, Forward, refresh, cold open) and clearly split from code-only items.
- Narrowest coverage of the rubric; owner message is plain with one decision.
- False claims: none.

### F (6/8)
- 01 to 04 pass. 05 fail: explicitly argues against routing tabs. 06 pass: edge case notes links are not workspace-qualified and resolve against the localStorage workspace. 07 fail: notes a pasted link would show the drawer over Overview, but not the current /tasks behaviour. 08 pass: seven ordered steps, URL path stays /projects/:id.
- Best engineering insight in the set: once the drawer pushes history, render() would rebuild the page and reset the tab to Overview, so render() must skip rebuilds for drawer-only changes.
- Owner clarity: chat uses renderProject/render() internals and has no owner decision.
- False claims: none.

### G (6/8)
- 01 to 04 pass. 05 pass: summary recommends "a small, targeted amendment" (?tab=tasks) and answers the rationale (email-link cleanliness vs task links; "refresh shows Overview" is the reported bug class), while leaving the final call to the owner. 06 fail: workspace switch on a project page is noted, but not localStorage as a reason a pasted link opens the wrong thing. 07 fail. 08 pass: suggested order, old links keep working with no redirects.
- Probe evidence is good. Several line citations are wrong (back button cited as app.js:130, actual 119; /tasks click cited as 197-203, actual 173-176; Not found cited as 121, actual 105), which lowers evidence to 4.
- False claims: none counted (location errors only).

### H (6/8)
- 01 to 04 pass. 05 fail: "ADR-0005 respected". 06 pass: reproduced cross-workspace link, localStorage named. 07 fail: proposes selecting Tasks for deep links, but does not state /tasks opens over Overview today. 08 pass: smallest-first fixes, keeps the stable /projects/:id URL.
- Shares F's router-rebuild insight and reproduces "Back to projects" going to /tasks. Clear reproduced vs code-only section.
- Owner clarity: plain chat with one well-framed decision (cross-workspace links plus permission checks).
- False claims: none.

### I (6/8)
- 01 to 04 pass. 05 fail: says no conflict with ADR-0005. 06 pass: reproduced Globex link "Not found" with Acme saved. 07 fail: suggests Tasks tab as initial state for ?task= links, not the current /tasks behaviour. 08 pass: three ordered changes, project URL stays clean.
- Good repro table (row numbering skips 6 and 7, minor). Catches Back returning to an archived project's page.
- Owner clarity: chat is fairly plain and poses the workspace decision explicitly.
- False claims: none.
