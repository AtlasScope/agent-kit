# Tidewater scoring (blind)

Scored against `tidewater-key.json`. I checked claims against `tidewater-app/` (README, ADRs 0001–0004, `src/`, seed data).

Column key:
- **Struct**: structural verdict match, 0–5, per the key's rubric. For narrow, the report has to answer the question, see the tab request as a symptom and recommend the request-centred record. A tab or card counts only as an explicit step toward that record.
- **Pages**: how many of the key's 13 page_verdicts the report gets right. **SNE**: how many of the 2 should_not_exist pages (/dispatch/assign, /overview-beta) it retires. For narrow, the count covers only the pages a report addresses. Most narrow reports address just 2–4.
- **Bugs**: which of B1 (Intake filters reset on Back), B2 (no nav item highlighted on detail pages because of `end`) and B3 (Tenant Comms lookup is case-sensitive and skips `normaliseId`) the report states as a finding in its body. A signal listed only in an appended static map, without confirmation, does not count.
- **Decoys**: how many of D1 (Approvals), D2 (confirm dialog not in URL) and D3 (tenant status page) the report falls for.
- **ADRs**: how many of the 4 key verdicts it matches (0001 overturn, 0002 overturn, 0003 respect, 0004 respect), and whether it answers the original rationale of 0001/0002.
- **Ev / Act / Own**: evidence, actionability and owner clarity, each 1–5.
- **False**: number of claims the source contradicts, or that have no support in it.

## Scenario: tidewater-broad

| Report | Struct | Pages /13 | SNE /2 | Bugs | Decoys | ADRs /4 (rationale answered) | Ev | Act | Own | False |
|---|---|---|---|---|---|---|---|---|---|---|
| A | 5 | 13 | 2 | B1, B3 | 0 | 4 (yes) | 5 | 5 | 4 | 1 |
| B | 5 | 13 | 2 | B1, B2 | 0 | 4 (yes) | 5 | 5 | 5 | 1 |
| C | 4 | 11 | 2 | B1, B2 | 0 | 2 (no) | 5 | 4 | 4 | 0 |
| D | 5 | 13 | 2 | B1 | 0 | 4 (yes) | 5 | 5 | 5 | 1 |
| E | 5 | 13 | 2 | B1 | 0 | 4 (yes) | 4 | 5 | 4 | 1 |
| F | 5 | 13 | 2 | B1, B3 | 0 | 4 (yes) | 4 | 5 | 4 | 3 |
| G | 4 | 11 | 2 | B1, B2 | 0 | 4 (yes) | 5 | 5 | 4 | 1 |
| H | 5 | 13 | 2 | B1, B2, B3 | 0 | 4 (yes) | 5 | 5 | 4 | 0 |
| I | 5 | 13 | 2 | B1, B2, B3 | 0 | 4 (yes) | 4 | 5 | 4 | 0 |
| J | 5 | 13 | 2 | none | 0 | 4 (yes) | 4 | 5 | 4 | 3 |
| K | 5 | 13 | 2 | B1, B2 | 0 | 4 (yes) | 5 | 5 | 5 | 1 |
| L | 4 | 9 | 2 | B1, B2 | 0 | 4 (yes) | 5 | 4 | 4 | 0 |

### Per-report notes (broad)

**A.** Code-only review that covers almost the whole key. It proposes `/requests/:REQ` with every stage inline and a "My day" landing page built from `followUpBy`, completions, approvals, emergencies and untold tenants. The nav becomes My day / All requests / Approvals / Billing export, with the board kept as a view. Overview (beta) is deleted and Assign Vendor is dropped as a nav item. It supersedes 0001 and 0002 and answers their reasons (desks merged; parent ids written at creation; `timelineForRequest` already joins). It keeps all three decoys and gives the right reasons. It finds B1 and B3. Its extra findings are accurate: `scheduleVisit` creates a VJ for phone-only vendors, `in_progress` is never set by the reducer, WO-3307 is awaiting approval with a date already set, and permissions are UI-only. Billing stays a primary nav item (minor). False/unsupported: "The 4B-leak you were looking at is gone" refers to something nothing in the source supports.

**B.** Ran browser journeys that reproduce B1 (on Back and on refresh), B2, the blank Assign Vendor form and the stale titles. The end-state table matches the key almost row for row: My work, `/requests/:REQ`, Dispatch kept as a board view, Approvals kept, Vendor Sync demoted to exceptions inside My work, Billing kept as the AP batch, status page unchanged, overview retired. It overturns 0002 and replaces 0001, answering both reasons, and respects 0003 and 0004. It keeps D2 explicitly, with the reason. False: it says the Dispatch board shows "for REQ-1043", but REQ-1043 has no work order.

**C.** Browser-verified on B1 and refresh. It reads B2 from the code. It recommends one job page with sections, retires Assign Vendor and Overview, and turns Vendor Sync into a queue. It does not say where the app should land. It also keeps Intake as its own queue instead of merging it into a request queue, and mentions "Waiting on me" only in passing (−1 on pages). It barely engages ADR 0001/0002 and never answers their stated reasons, which is the rubric's one-gap case and why it gets 4. It respects 0003 and 0004 and keeps all decoys. It flags its own `/intake/REQ-1001` test mistake honestly. No false claims.

**D.** Browser-verified, desktop and mobile. Its end-state table names Today (`/`), `/requests/:id`, the Work board kept as a view, Approvals, Billing as the batch step, and `/status` unchanged. It retires Assign Vendor, Overview and Vendor Sync/Tenant Comms as nav destinations, with redirects. It covers all ADRs with their reasons and asks Finance Systems to confirm. Bugs: B1 only. False: "Phone-only vendors don't appear at all". The seed has VJ-88110 and VJ-88112 for the phone-only vendors V-04 and V-05.

**E.** Strong. Today, Requests (Dispatch kept as a view), a request page, Approvals and Billing kept, status page unchanged, overview retired. It departs from 0001 and 0002 and answers their reasons. Its "Dispatch not active on /dispatch/assign" observation is the inverse case of B2 and does not cover detail pages, so B2 is not credited. It floats turning Overview into Today, then settles on replacing it. False/unsupported: the line references `WorkOrderDetail.tsx:849` and `AssignVendor.tsx:659` cannot exist (the files are 117 and 74 lines).

**F.** Code-only, with a full structural answer. It proposes a request page, a "Today" page scoped to `coordinator === user.name`, and a nav of Today / Requests / Approvals / Billing. Vendor Sync and Tenant Comms become panels, and Assign Vendor and Overview are removed. It finds B1 and B3, and handles the ADRs and decoys well. False claims: (1) "Phone-only vendors never appear" is contradicted by the seed; (2) "typing `req-1031` shows messages but no compose box" is wrong, because the message filter is also case-sensitive, so neither appears; (3) "accepting… with the work order… not visible" is wrong, because VendorJobDetail shows the WO id.

**G.** Ran probes. It confirms B1 (Intake and Vendor Sync), B2, the identity reset and titles. It proposes a request page with a "next action" card, a Today view as the landing page, and overturns 0001 and 0002 with a clear rationale table. It respects 0003 and 0004 and notes that the reducer does not enforce separation of duties. Gap: the proposed nav still keeps Dispatch and a renamed "Vendor updates" (the nightly-pull queue) as top-level system screens. That costs one rubric point and two pages. Unsupported: line references `TopNav.tsx:257-278`, `App.tsx:95-107` and `lookup.ts:344` are impossible (the files are 38, 38 and 73 lines).

**H.** Ran its own Playwright probe. It covers the whole key: `/today`, `/requests` with `?view=board`, `/requests/:reqId` with sections, Approvals and Billing kept, a redirect for every old URL, and 0001/0002 superseded with their reasons answered. It is the only broad report besides I that finds all three bugs. It considers folding Approvals into Requests and rejects that for the right reason. Its quick fixes say "remove the banner or promote" Overview, but the migration retires it. It adds a correct observation that Assign Vendor reassigns any WO number without checking status. No false claims.

**I.** Code-only, with precise citations. It has a state-ownership table, proposed routes with a redirect table, page verdicts that match the key almost exactly, and ADRs overturned with their reasons answered. It finds all three bugs. The safeguards section keeps D1–D3 and notes the reducer gap in `decideApproval`. No false claims.

**J.** Request page, My day landing page, header search, nav cut to My day / All requests / Approvals / Billing with Vendor Sync as a secondary health view, Overview deleted, Assign Vendor folded in. ADRs are handled well, including keeping the double-payment guard. None of the three bugs are stated (it mentions form-state loss but not the list-filter reset). False: (1) "Phone-only vendors, 3 of 7" (it is 2 of 7); (2) "don't appear on the screen at all" (they do); (3) "accessNotes… on IntakeDetail only" (WorkOrderDetail shows Access).

**K.** Browser-verified. Its end-state table covers My work (Joan lands on her approvals), Requests replacing Intake, Dispatch and Overview, a request page, Approvals and Billing kept, Vendor Sync reduced to a status line plus My work items, and the Tenant Comms log kept as a secondary view. It overturns 0001 and 0002 with reasons and keeps 0003 and 0004. Bugs: B1 and B2. False: the example status line "9 of 11 vendors on portal" (the seed has 5 of 7).

**L.** Browser-verified on B1, B2, refresh and titles. It recommends a request hub and a My day front page, retires Overview and demotes Assign Vendor. But it explicitly keeps Dispatch, WO detail and Vendor Sync and job detail as places to go, and defers any nav change. That is a request record added on top of the system-based nav: 4, not 5, and 9/13 pages. ADRs are handled correctly with reasons, and the decoys are kept. No false claims; line references are slightly off but plausible.

## Scenario: tidewater-narrow

| Report | Struct | Pages addressed (correct) | SNE /2 | Bugs | Decoys | ADRs /4 (rationale answered) | Ev | Act | Own | False |
|---|---|---|---|---|---|---|---|---|---|---|
| A | 3 | 2 | 0 | none | 0 | 3 (yes) | 4 | 4 | 4 | 0 |
| B | 5 | 8 | 0 | none | 0 | 4 (yes) | 4 | 5 | 5 | 1 |
| C | 2 | 2 | 0 | none | 0 | 3 (yes) | 3 | 3 | 3 | 0 |
| D | 2 | 2 | 0 | none | 0 | 3 (yes) | 4 | 4 | 4 | 0 |
| E | 3 | 2 | 0 | none | 0 | 3 (yes) | 5 | 5 | 3 | 0 |
| F | 4 | 7 | 1 | B1 | 0 | 4 (yes) | 3 | 4 | 4 | 1 |
| G | 3 | 2 | 0 | none | 0 | 3 (yes) | 4 | 4 | 3 | 0 |
| H | 2 | 2 | 0 | none | 0 | 3 (yes) | 4 | 3 | 3 | 0 |
| I | 2 | 2 | 0 | none | 0 | 3 (yes) | 3 | 3 | 2 | 0 |
| J | 5 | 5 | 0 | B2 | 0 | 3 (yes) | 4 | 5 | 4 | 1 |
| K | 4 | 4 | 0 | none | 0 | 3 (yes) | 4 | 4 | 4 | 0 |
| L | 1 | 1 | 0 | B1 | 0 | 0 (no) | 3 | 3 | 3 | 1 |

### Per-report notes (narrow)

Almost every report gets the local facts right. Messages are keyed by `requestId`. The WO page has no tabs. The "Remember to tell the tenant" line is a workaround. The `[date]`/`[window]` placeholders need prefilling. `message_tenant` gates sending. ADR 0003 is not triggered. ADR 0002's reason is gone. What separates the reports is whether they treat the ask as a symptom and point to the request record.

**A.** Says no to the tab. It names the ask as a symptom of ADR 0001's desk split and proposes a shared card on the WO and Intake detail pages. A request-centred page appears only as "if coordinators keep asking… its own review, not part of this change". So the record is named as a possible future, not recommended, and the card is not framed as a step toward it: 3. It handles ADR 0001 (revisit), 0002 (superseding ADR first, rationale answered) and 0003. It does not mention 0004.

**B.** Best fit to the rubric. Its answer is "add the tab, but build it as the first step toward a request page". The `TenantUpdates` component takes a `requestId` and later moves to `/requests/:id`. It adds a "Today" queue as home and makes Dispatch, Vendor Sync and Billing queues of that work. It retires the Tenant Comms send form and keeps the log. It lists all four ADRs with the right status. Weak spot: it says the Overview (beta) "could grow into" Today, which the key rejects, and it does not mention Assign Vendor. False: "tenant's name and phone are only on the Intake page" (Tenant Comms shows both).

**C.** Says yes, add it, with good adjustments (scope to the request, a shared composer, supersede 0002, also put it on IntakeDetail). It notes the nav is out of date but never recommends the request record. It does say the morning list needs a list view. 2.

**D.** Says yes, build it as a card, and amend ADR 0002 first with Residential Ops sign-off. It is careful and accurate but treats the ask as a reasonable feature, not a symptom. No request record. 2.

**E.** Says no to the tab and yes to a "Tell the tenant" section. It has the best edge case: don't prefill "visit booked" while the WO is `awaiting_approval`, because `timelineForRequest` hides the visit on the tenant page (WO-3307). It also checks correctly that every seed request has one WO. It calls the switching a symptom of the desk split and says folding Tenant Comms into request screens is "probably where the product ends up", but puts that out of scope. 3.

**F.** Recommends a request-aware section now, built to move into a single request page (option C) with "Needs me today", "All requests", Approvals and Billing export as the nav. It gives page verdicts, including retiring `/overview-beta`. All four ADRs are handled with reasons, and it states B1. It gets 4, not 5, because it builds its central "wrong record" argument on a false fact: "REQ-1031 has three [work orders] in the seed data". The seed has one (WO-3291). It also defers C to a separate decision.

**G.** Says "no to a tab, and no to stopping there". It recommends cards on the WO, Intake and Vendor job detail pages and keeps Tenant Comms as a log. The request-centred page appears only as an "alternative considered… better end state", which Step 1 "fits into". It is named but not recommended: 3. It flags the wrong-request privacy risk with a test.

**H.** Short. A section, not a tab, on the WO and Intake pages. It notes the nav revisit as "a separate, bigger decision". It has a correct seed check: REQ-1033, 1035, 1039 and 1041 have WOs and no tenant messages. No request record. 2.

**I.** Yes, with adjustments: a card, labelled by request, read-only for supervisors, a prefilled template and a shared composer. It says the tab "doesn't touch the nav". No request record. 2.

**J.** A request-level panel with its own URL, framed as "the first step toward a request-centred record". Its larger point: a request page plus a "what needs me today" list, because the morning questions span five screens. It finds B2 (`end` on every NavLink) and plans a fix for it. It handles 0001, 0002 and 0003; 0004 is not addressed. False: "the work order page is the only place the dates are visible" (Dispatch board cards show the date and window).

**K.** A section, built around `requestId` so it can move. Its end state is one request page, with Tenant Comms becoming an inbox of tenants who haven't heard from us. It names the symptom pattern across Assign Vendor, Approvals and Vendor Sync and puts the decision to the owner. It lacks an explicit landing "needs me" queue beyond the Tenant Comms inbox, so 4. It handles 0001, 0002 and 0003; 0004 is not mentioned. It correctly notes the seed has one WO per request.

**L.** Says yes to a card. Its "Structure verdict: Sound… this request doesn't call for restructuring… not recommending Rethink" is the opposite of the key, so 1. It does not mention any ADR. Its general "every list loses its state on Back" counts as B1. False: "Intake, Dispatch and Vendor Sync detail pages all use the same two-card layout" (VendorJobDetail is a single card).
