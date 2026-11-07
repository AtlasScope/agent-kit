# Meridian scoring

Scored against `meridian-key.json`. A defect counts when the report names the cause, or names the symptom with a location precise enough to act on. Each decoy a report falls for subtracts one from its defect count. Structural items: 1 means the overlap or split is named and the fix matches the key's intent. ½ means it is named but the fix is generic or doesn't address it. 0 means it is missing. Ratings run 1-5 in this order: Ev = evidence, RC = root-cause grouping, Act = actionability, Own = owner clarity. False claims are only those the source contradicts.

S1 rule I applied: 1 = the notifications split is named and the fix is one notifications place, or cross-links plus consistent naming (the key's minimum). ½ = the split is named but the fix is a generic "settings by scope" consolidation. 0 = the split isn't identified.
S2 rule: 1 = the overlap is named and the fix merges the areas into one analytics section, with the rail and sidebar aligned. ½ = the overlap is named with no merge, or the merge is declined. 0 = the content overlap isn't identified (fixing the highlight or the naming alone doesn't count).

## Broad scenario ("navigation confusing, app forgets where they were")

| Rpt | Defects (net /15) | Ids found | S1 | S2 | Decoys | Ev | RC | Act | Own | False claims |
|---|---|---|---|---|---|---|---|---|---|---|
| A | 11 | M2 M3 M4 M5 M6 M7 M8 M9 M11 M13 M15 | 0 | 1 | 0 | 5 | 5 | 5 | 4 | 1 |
| B | 11 | M2 M3 M4 M5 M6 M7 M8 M9 M11 M13 M15 | 0 | 1 | 0 | 4 | 5 | 4 | 4 | 0 |
| C | 14 | M1-M11 M13 M14 M15 | ½ | 1 | 0 | 4 | 4 | 5 | 4 | 0 |
| D | 9 | M2 M3 M4 M5 M7 M9 M11 M13 M15 | ½ | ½ | 0 | 4 | 4 | 4 | 5 | 1 |
| E | 14 | M1-M11 M13 M14 M15 | ½ | ½ | 0 | 4 | 4 | 5 | 4 | 1 |
| F | 12 | M2-M11 M13 M15 | 1 | 1 | 0 | 4 | 4 | 4 | 4 | 1 |
| G | 11 (12 raw - 1) | M1-M10 M13 M15 | ½ | 0 | 1 (X2) | 5 | 5 | 5 | 3 | 1 |
| H | 13 | M1-M11 M13 M15 | 1 | ½ | 0 | 5 | 5 | 5 | 4 | 0 |
| I | 13 | M1-M11 M13 M15 | 1 | 0 | 0 | 5 | 5 | 5 | 3 | 1 |

No report found M12 (the invoice list's scroll position is lost because the table scrolls inside an inner pane). Only C and E found M14 (Partners duplicates Carriers). Every report kept the documented behaviour for X1 (Assign dialog), X3 (`/track`) and X4 (tab history).

### Broad notes

**A.** Browser journeys reproduce most of its claims (13 runs), and it marks clearly what it only read in code. It misses the inbox workspace bug (M1), invoice tabs (M10) and Partners vs Carriers (M14). S1 is 0: its "settings in three places" point is about account pages being hard to find, and it never names the notifications split. S2 is 1: it recommends one Analytics area and asks the owner to decide. False claim: it says the account and org pages have "no obvious path" and recommends making them reachable, but AccountNav and OrgNav link every one of them. It also says ADR 0004 requires push, which the ADR doesn't say. I didn't count that.

**B.** It groups the problems into three causes: the view isn't in the URL, the workspace is treated as background context, and four menus disagree. It reproduced the main items in a browser, and it marks sign-in as code plus curl. It misses M1, M10 and M14. S1 is 0 because the settings point is about duplicate General and Members pages. S2 is 1: merge into Analytics with tabs, one sidebar item, and redirects. It explicitly accepts `/org/shipments` as a legitimate cross-workspace view. Small slips that I didn't count: it calls the redirect a 301 (it is a 308) and writes "Organizat." where the code produces "Organiza.".

**C.** It has the widest coverage (14/15) and checked everything with curl. It states plainly that it didn't use a browser and lists which items need a manual check. It explicitly leaves the Assign dialog alone. On X2, the chat message lists "All shipments duplicates" among the causes of confusion, but the report cites the README rationale and only asks for a decision on consistency. I didn't penalise it, but it is borderline. S1 is ½: one Settings area with Personal, Workspace and Organization sections replacing the three notifications pages, which keeps scope as the place. S2 is 1: merge under Analytics and drop the separate rail item. It flagged no false claims and has a good verification checklist.

**D.** Its chat message is the clearest for an owner. It misses M1 (it mentions inbox links only in the sign-in context), M6, M8 (it says parent URLs 404 but never ties that to breadcrumbs), M10 and M14. S1 is ½ (one Settings area with three scope sections). S2 is ½ (it notes the overlap but says "nothing proves it hurts"). Its `/org/shipments` advice keeps the page and asks for one shared component, so no penalty. False claim: it lists billing, audit log, API tokens and `/w/<ws>/settings/*` as having "no visible link anywhere" and turns that into an owner decision, but OrgNav, AccountNav and the sidebar all link them.

**E.** It has the same coverage as C (14/15) from code plus curl, with severity and fix for each item. S1 is ½ ("one home for settings, one name per kind of notification"). S2 is ½ (the overlap is named, but the only fix is the highlight bug). It accepts the README rationale for `/org/shipments` and recommends no merge. False claim: it says `/w/acme` is redirected to Overview by the catch-all, but `[...rest]` needs at least one segment, so `/w/acme` is a 404.

**F.** It misses M1 (the inbox), M12 and M14. "Carriers, Locations and Partners ... unclear differences" doesn't say Partners shows the same carriers. It has a strong "deliberate, don't fix" section covering X1, X3 and X4. S1 is 1: rename by scope and cross-link the three notifications pages, which is the key's minimum. S2 is 1 (one Analytics entry, listed in the fix order). False claim: it recommends adding a workspace column to `/org/shipments`, which already has one (it also writes "Organizat." for the truncation).

**G.** It has the strongest architecture sections (state ownership table, migration path), but its chat message is long and technical. It misses M11: it covers drafts lost on refresh, not drafts leaking between shipments. Decoy X2: the chat message calls `/org/shipments` "a second, less capable copy", and the report recommends merging it into the workspace list as a scope toggle. It acknowledges the README reason but overrides it, so I counted it. S1 is ½ (notifications named in three places; the fix is one Settings home with three scopes). S2 is 0: it suggests grouping the three as "Analytics" in the sidebar, which they already are, and never names the content overlap. False claim: it says the mobile menu drops the Dashboards vs Reports distinction, but both items are in MOBILE_NAV.

**H.** Browser probes reproduce its claims, including the note-draft leak with captured text. It misses M12 and M14. S1 is 1 ("merging the three notification pages into one page with three sections", plus scope labels). S2 is ½: it names the three-way split but recommends keeping all three and fixing the highlight. It keeps `/org/shipments` and asks the owner about access rules. Its claim that the workspace settings sub-pages are unreachable on mobile is correct, since the settings layout has no sub-nav. No false claims found.

**I.** It has the same coverage as H with reproduced journeys. It argues against merging `/org/shipments` on ADR 0001 grounds and leaves the call to the owner, so no penalty. S1 is 1 (cross-link the three notifications pages). S2 is 0: it only aligns naming and the Reports highlight. False claim: its route map lists `/share/[code]` as a public share page, but the middleware protects it. Its chat message carries file and line references, which makes it harder for an owner to read.

## Narrow scenario (signed-out colleague, filtered list and single shipment)

| Rpt | Defects found | Ids | Both causes (M2 + M3) | Safe fix (same-origin) | Decoys | Ev | RC | Act | Own | False claims |
|---|---|---|---|---|---|---|---|---|---|---|
| A | 3 | M2 M3 M4 | Yes | Yes (`new URL` origin check, `//` and `/\` cases tested) | 0 | 4 | 5 | 5 | 4 | 0 |
| B | 3 | M2 M3 M4 | Yes | Yes (single `/`, not `//` or `/\`, no scheme) | 0 | 4 | 5 | 5 | 4 | 0 |
| C | 2 | M2 M3 | Yes | Yes (`new URL` and origin equality, regression cases) | 0 | 4 | 5 | 5 | 4 | 0 |
| D | 4 | M2 M3 M4 M9 | Yes | Yes (same-origin, or a prefix allow-list; rejects `//` and absolute URLs) | 0 | 4 | 4 | 5 | 4 | 0 |
| E | 3 | M2 M3 M4 | Yes | Yes (single `/`, not `//` or `/\`) | 0 | 4 | 5 | 5 | 5 | 1 |
| F | 4 | M2 M3 M4 M9 | Yes | Yes (single `/`, no `//`, backslash or scheme) | 0 | 4 | 4 | 5 | 4 | 0 |
| G | 3 | M2 M3 M4 | Yes | Yes (single `/`, no `//` or scheme, shared validator) | 0 | 4 | 5 | 5 | 4 | 0 |
| H | 3 | M2 M3 M4 | Yes | Yes, but it only says "proper same-origin check" without details | 0 | 3 | 4 | 4 | 4 | 0 |
| I | 4 | M2 M3 M4 M9 | Yes | Yes (single `/`, not `//` or `/\`, also checked on the server) | 0 | 4 | 5 | 5 | 4 | 1 |

All nine reports reached the key's diagnosis. The query string is dropped in `middleware.ts` (M3), and the login form honours only `/w/` destinations, which bounces `/share/<code>` to `/workspaces` (M2). All nine also note that a plain `/w/.../shipments/<id>` link would have survived, so the single-shipment link was most likely a share link. Every report except C also flagged the hard-coded `acme` legacy redirect (M4). D, F and I also flagged that the list's filters never reach the URL (M9). That is a real contributing cause, because a link copied from the address bar has no filter in it. No report fell for a decoy. Several correctly state that `/track` works and should stay outside the sign-in middleware.

### Narrow notes

**A.** It is tight and correct, with curl output for each case. Its fix parses `next` with `new URL(...)` against the current origin, and it lists hostile test values. It also notes that `/track` keeps working only because its destination is under `/w/`.

**B.** It matches A and adds the `/shipments/:id` 404, the note that the 308 gets cached, and an "already signed-in user on /login" observation. It warns explicitly not to just delete the check.

**C.** It has the best explanation of the root cause: the code that writes the return address and the code that checks it disagree. It offers a same-day workaround for the colleague and an alternative it considered (exempting `/share`), and recommends doing the redirect on the server. It doesn't mention M4. Its note that share codes have no access check beyond being signed in is accurate.

**D.** It treats the never-written filters (M9) as a third defect and recommends `router.replace` with search-box handling. It is honest that the final landing page is inferred from code. As an alternative it offers a prefix allow-list (`/w/`, `/org/`, `/account/`, `/share/`), which is also safe. It hedges on M4 ("verify before acting").

**E.** Its chat message is the clearest for an owner. Its decision question about multi-workspace users is a little forced. False claim: it says `/track/<ref>` "redirects to `/w/acme/shipments/<ref>/tracking`", but the route looks up the shipment's own workspace (and the same line says it will only "return correctly" after fix 1, though it already does).

**F.** It covers M2, M3, M4 and M9, and adds that `/track` drops the query (true). It asks the owner whether `/track` should land on Tracking. That is a reasonable question but off the topic of the complaint.

**G.** It recommends one shared function to build and check the return address, plus regression checks for five URLs. It has a clear "check this one" ask about which link was sent.

**H.** It is the shortest. It has only a chat message, and the report was saved outside the repo. The diagnosis is correct and adds the M4 case for a `/shipments/<id>` link. The fix names a same-origin check without saying what the check is. It offers a workaround (sign in first).

**I.** It covers the same ground as F with a good list of what it ran versus what it only read. False claim: it calls the `/w/` prefix check "too weak to be a real guard". A `next` that starts with `/w/` can only point at a path on the same site, so the check is narrow but not weak. Its line "one small change fixes both" is also inaccurate, since its own list gives two separate fixes.
