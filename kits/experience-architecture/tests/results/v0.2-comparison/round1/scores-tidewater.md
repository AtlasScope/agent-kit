# Tidewater scoring (blind)

Scored against `tidewater-key.json`. Claims were checked against `tidewater-app/` (README, ADRs 0001–0004, `src/`, seed data).

Conventions:
- Page verdicts are out of 15: the 13 `page_verdicts` plus the 2 `should_not_exist`. A verdict counts when the report's end-state treatment matches the key. Billing Export counts if the report keeps it as a batch screen and shows invoice status on the request, even if it stays in the nav. Overview (beta) counts if the final structure removes or redirects it, even where the report hedges ("or evolve it into Requests"). Those hedges are flagged in the notes.
- Bugs: B1 = Intake filters reset on Back; B2 = no nav item highlighted on detail pages (`NavLink end`); B3 = case-sensitive Tenant Comms lookup. ½ = adjacent symptom only.
- Decoy falls: D1 Approvals, D2 Accept-completion dialog not in the URL, D3 tenant status page.
- ADRs: verdicts matched out of 4 (overturn 0001 and 0002, respect 0003 and 0004). "Rationale" = the report answered the original reasons (desks / manual sync for 0001; stale spreadsheet join for 0002).
- Ratings are 1–5. Evid = evidence, Act = actionability, Owner = owner clarity.

## Broad scenario ("five tabs open")

| Report | Structural (0-5) | Page verdicts (/15) | Bugs (/3) | Decoy falls | ADRs (/4) · rationale | Evid | Act | Owner | False/unsupported |
|---|---|---|---|---|---|---|---|---|---|
| A | 5 | 15 | 3 (B1 B2 B3) | 0 | 4 · yes | 5 | 5 | 4 | 0 |
| B | 5 | 15 | 3 (B1 B2 B3) | 0 | 4 · yes | 5 | 5 | 4 | 0 |
| C | 5 | 15 | 2 (B1 B3) | 0 | 4 · yes | 4 | 4 | 4 | 0 |
| D | 4 | 11 | 2 (B1 B2) | 0 | 4 · yes | 5 | 4 | 5 | 1 |
| E | 5 | 15 | 2 (B1 B3) | 0 | 4 · yes | 4 | 4 | 4 | 1 |
| F | 5 | 15 | 0 | 0 | 4 · yes | 3 | 4 | 4 | 3 |
| G | 4 | 13 | 2 (B1 B2) | 0 | 4 · yes | 4 | 5 | 4 | 1 |
| H | 5 | 15 | 1.5 (B1, B2 ½) | 0 | 4 · yes | 4 | 4 | 5 | 2 |
| I | 3 | 12 | 2 (B1 B2) | 0 | 2 · no | 4 | 3 | 4 | 1 |

### Per-report notes (broad)

**A.** Gives the full key answer. It proposes `/requests/:id` with every stage as a section, a per-coordinator "Today" landing page, and a five-item nav (Today, Requests, Approvals, Invoices, Messages). It has a redirect table for every old route, retires Assign Vendor and Overview (beta), and has a phased migration. It overturns ADRs 0001 and 0002 against their stated reasons and keeps the lesson of the double payment. It keeps all three decoys with their reasons. Bugs: B1, B2 and B3, all code-only with steps to confirm. Extra findings that hold: the reducer does not enforce requester ≠ approver, and every tab is titled "Tidewater". Overview hedge: "Remove it, or evolve it into the Requests list"; the final map redirects it. Invoices stays in the primary nav. Small imprecision: Intake drops a request at the scheduled stage, not "once it has a work order" (REQ-1042 has WO-3307 and is still listed). Not counted.

**B.** Same structure as A. Some findings were observed in the browser: the filter lost on Back, no nav highlight on detail pages, identical titles, and the empty Assign Vendor field coming from a work order. Its Today queues match the README. Billing becomes a batch screen. `/tenant-comms` redirects to the request (no global log, which the key allows). Overview hedge: Phase 1 says "remove the banner, or promote the page", and the final redirects retire it. Extra findings that hold: Assign Vendor reassigns any work order regardless of status, and the page overflows at 390px. No contradicted claims.

**C.** Has the full structure: a request page, a "My day" landing page, a header search, and a trimmed nav where the board survives as a view of All requests. ADRs 0001 and 0002 are superseded with reasons. Decoys are kept. Bugs: B1 and B3; it misses the nav highlight. Good extra findings that check out: `scheduleVisit` creates a vendor job for phone-only vendors (Apex VJ-88110), which contradicts the Vendor Sync footer; the reducer never sets `in_progress`; `needs_return` is not reflected on the work order; the detail-page `useState` initialisers will go stale once cross-links exist; WO-3307 is awaiting approval but already has a date. One stray, garbled sentence ("The 4B-leak you were looking at is gone"), not counted.

**D.** States the structural cause clearly ("this is the main cause") and proposes a request hub plus a "My day" front page. Its page-verdict table keeps Dispatch, the work order detail page and Vendor Sync with its job detail as top-level system screens, with "the system screens remain as places to go", and it defers the nav change to a later step. That is short of the key's merges and why it scores 4 and 11/15. Kept-as-is verdicts that miss: `/dispatch`, `/dispatch/:id`, `/vendor-sync` and `/vendor-sync/:id`. Bugs B1 and B2 were reproduced in the browser, plus a refresh losing the Dispatch search; B3 is missed. All decoys kept. ADRs are handled well and put to the owner as a decision. False/unsupported: several line citations are wrong (`IntakeDetail.tsx:117-120` is actually about lines 141-145; `TopNav.tsx:35` is line 29; `WorkOrderDetail.tsx:57-60, 90`). Counted as 1.

**E.** Has the full structure: a request page, a Today page scoped to `coordinator === user.name` with the five README queues, a nav of Today · Requests · Approvals · Billing, Vendor Sync and Tenant Comms as panels, Assign Vendor as a section, and the beta deleted. Supersedes ADRs 0001 and 0002 with reasons and keeps the decoys. Bugs: B1 and B3 (`req-1031`); misses B2. Extra findings that hold: requester ≠ approver is not enforced in the reducer; Dispatch does not sort emergencies first. False: "Phone-only vendors never appear" on Vendor Sync. Apex is phone-only and appears through VJ-88110.

**F.** Has the correct structural diagnosis and target: a request page with every action, a "My day" landing page, one search, a nav of My day · All requests · Approvals · Billing, and Vendor Sync demoted to a secondary health view. ADRs are handled well and the decoys are kept. It finds none of the three key bugs; it mentions form state resetting, which is not B1. False or unsupported claims (3): "3 of 7" vendors are phone-only (the seed has 2: V-04 and V-05); phone-only jobs are "invisible" on Vendor Sync (VJ-88110 is shown); `accessNotes` appear "on IntakeDetail only" (the work order page shows Access). It also says "four old desks", where the README describes two desks plus an AP clerk.

**G.** Gets the structure right in the main: a request page as the spine, a "needs me today, filtered to me" landing page, and ADR 0002 and the nav part of ADR 0001 overturned with a good rationale table. Its proposed nav keeps Dispatch and a renamed "Vendor updates" as top-level batch queues, which is why it scores 4 and loses `/dispatch` and `/vendor-sync`. Its browser probes are thorough: filters lost on Back for Intake and Vendor Sync, Assign Vendor and Tenant Comms losing their input, no nav highlight, identical titles. Bugs B1 and B2; misses B3. D2 is handled correctly: Back does not close the dialog, which it calls an acceptable trade-off. Separation of duties is enforced only in the UI, which holds. False: the line citations are invented (`TopNav.tsx:257-266`, `App.tsx:95-107`, `lookup.ts:344`, `TopNav.tsx:272-278`; these files are 30–75 lines long). Counted as 1.

**H.** Has the full structure: a Today landing page, a Requests list replacing Intake and the separate lists (with Dispatch as a stage view), a request page, and Approvals and Billing Export kept as separate cross-request screens. Supersedes both ADRs with reasons and kept D2 after checking its reasoning. Overview hedge: "Retire it, or turn it into the Today view"; the quick fix removes it. Bugs: B1 was reproduced. For B2 it reports only that Dispatch is not highlighted on `/dispatch/assign`; it does not cover detail pages (½). It misses B3. False (2): `/dispatch/WO-3291` "shows Unassigned · Assign Vendor", but WO-3291 is done with Brightline assigned (WO-3310 is the unassigned one); invented line numbers (`WorkOrderDetail.tsx:849`, `AssignVendor.tsx:659`). The owner message is plain, with a single clear decision.

**I.** Diagnoses the structure correctly ("main cause") and proposes a job page with sections, with Assign Vendor and Tenant Comms becoming sections and Vendor Sync becoming a queue. Gaps:
- It never engages ADR 0001 or 0002, so their rationale goes unanswered.
- There is no "needs me today" landing page; "Waiting on me" appears once as one of several queues, and `/` is not addressed.
- It keeps Intake and the Dispatch board as entry queues.
- It offers "link the pages and pre-fill the forms gets most of the benefit" as a reasonable alternative, which leans toward the "cross-links only" answer the key rejects.

Bugs: B1 was reproduced; B2 is code-only; B3 is missed. All decoys kept, with the reason for D2 given. Good catch: detail forms are not keyed by record id. Line citations are slightly off (e.g. it puts the VendorJobDetail comment at lines 18-22 when it is at 14-17). Counted as 1.

## Narrow scenario ("Tenant updates" tab)

For this scenario, page verdicts count the key items each report addresses: `/tenant-comms` merged into a request-level Tenant updates section with an optional log, `/dispatch/:id` merged into the request record, and the `/` needs-me queue.

| Report | Structural (0-5) | Page verdicts (relevant) | Bugs (/3) | Decoy falls | ADRs (/4) · rationale | Evid | Act | Owner | False/unsupported |
|---|---|---|---|---|---|---|---|---|---|
| A | 2 | 1 (tenant-comms scoped to request) | 0 | 0 | 3 · yes | 3 | 4 | 4 | 0 |
| B | 5 | 3 (tenant-comms, dispatch/:id → request page, needs-me list) | 1 (B2) | 0 | 3 · yes | 4 | 5 | 4 | 0 |
| C | 3 | 1 (tenant-comms section + log) | 0 | 0 | 3 · yes | 5 | 5 | 4 | 0 |
| D | 2 | 1 (tenant-comms embed + log) | 0 | 0 | 2 · partly | 3 | 4 | 4 | 0 |
| E | 1 | 1 (tenant-comms embed + log) | 1 (B1, via "lists lose state on Back") | 0 | 0 · no | 3 | 4 | 4 | 2 |
| F | 2 | 1 (tenant-comms embed + log) | 0 | 0 | 3 · yes | 4 | 4 | 4 | 0 |
| G | 3 | 1 (tenant-comms card on WO and Intake + log) | 0 | 0 | 3 · yes | 4 | 4 | 4 | 0 |
| H | 2 | 1 (tenant-comms section on WO and Intake + log) | 0 | 0 | 3 · yes | 4 | 3 | 4 | 0 |
| I | 4 | 2 (tenant-comms, request-centred page as end state) | 0 | 0 | 3 · yes | 4 | 5 | 4 | 0 |

ADR 0004 was not relevant to the narrow question, so 3/4 (0001, 0002, 0003) is the effective ceiling for a good narrow answer.

### Per-report notes (narrow)

**A.** "Yes, add it, but not as a bare tab." It does a lot right: scopes the tab to the request, prefills `[date]`/`[window]`, keeps `message_tenant` and supersedes ADR 0002 with its reason. It notes that the nav no longer matches the desks and that the morning "who hasn't heard from us" needs a list. It never recommends the request-centred record or frames the tab as interim, so it stops at "the tab won't fix everything". No false claims.

**B.** The best narrow answer. Its recommendation is a request-level panel "as the first step toward a request-centred record". It names the structural fix (`/requests/:id` plus a "what needs me today" list) as the longer-term change and explains why one tab answers only one of the five morning questions. It supersedes ADR 0002 and asks for 0001 to be revisited, with 0003 untouched. It wants the tab state in the URL, warns about draft loss and double sends, and flags B2 as made worse by sub-routes. A link to `/tenant-comms?request=` is offered as a fallback. This meets the key's "tab only as an explicit interim step".

**C.** "No to the tab as such", recommending a section under Schedule visit. It recognises the request as a symptom ("Coordinators switching to Tenant Comms is the symptom"). It calls folding Tenant Comms into every request screen "probably where the product ends up" but scopes that out, so the request-centred record is acknowledged without being recommended. Its evidence is excellent: WO-3307 is awaiting approval with a date already set, so a "visit booked" prefill would contradict the tenant page (verified against `timelineForRequest`). It also verifies that every seeded request has one work order and respects SMS gateway limits. It keeps "no clickable cross-system links" for now, a cautious reading of ADR 0002.

**D.** "Yes, add it, with a few adjustments" (as a card, labelled by request, read-only for supervisors, prefilled, shared composer). On ADR 0001 it says "a tab on the work order page doesn't touch the nav" and moves on. It does not treat the request as a symptom and does not mention a request-centred record. ADR 0002 is superseded with a reason. No false claims.

**E.** A card, not a tab. It explicitly declares "Structure verdict: Sound. The pages are in the right places… I'm not recommending Rethink", which is the opposite of the key's conclusion. It has no ADR discussion. Its Assign Vendor nav observation is a correct side note. False or unsupported (2): "Intake, Dispatch and Vendor Sync detail pages all use the same two-card layout" (VendorJobDetail is a single card); "Sound" contradicts the README's July 2025 reorganisation and ADR 0001's own "revisit" clause.

**F.** Yes, as a card. It argues ADR 0002 should be amended first, with a correct rationale, and cites ADR 0001's desks-merged clause. It never connects the request to a needed restructure or mentions a request-centred record. The scoping is solid (request-labelled, shared composer, prefill, Joan read-only). No false claims.

**G.** "No, don't add it as a tab." It states that the request "is a symptom of" the desk-based nav. It recommends a shared card on the work order and Intake request pages and a superseding ADR for 0002, and checks SMS gateway limits. A request-centred page appears only conditionally ("if coordinators keep asking… for its own review"), so the record is acknowledged without being recommended. No false claims.

**H.** A section, not a tab, on the work order and Intake pages. It notes that the nav follows the old desks and that ADR 0001 says to revisit, but calls that "a separate, bigger decision". It has no request-centred record. Its seed check is accurate: REQ-1033, 1035, 1039 and 1041 have work orders and no tenant message. Short and clear, but thin on next steps.

**I.** A card, not a tab, and explicitly "no to stopping there". It calls the request "a symptom of the nav still being organised around desks that no longer exist". It recommends reusing the card on Intake and Vendor job detail, and names a request-centred page as "the better end state", with Step 1 fitting into it later. It frames the card as the first step and the record as the destination, though as an "alternative considered" and not a firm recommendation, so it scores 4, not 5. ADRs 0001, 0002 and 0003 are handled with reasons. Good risk note: a card keyed to the wrong request is a privacy breach.

## Observations across reports

- No report in either scenario fell for any decoy. All of them kept Approvals, the accept-completion dialog out of the URL, and the tenant status page.
- B3 (case-sensitive Tenant Comms search) separates the broad reports: only A, B, C and E found it. B2 was found by A, B, D, G and I, and partly by H.
- In the narrow scenario most reports improved the tab (as a card or section, labelled by request, with prefill and a shared composer). Only B and I tied it to the request-centred record as the destination, and E actively endorsed the current structure.
