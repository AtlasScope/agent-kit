# Kestrel scoring (blind)

Scored against `kestrel-key.json`. Claims were spot-checked against `kestrel-app/` source (MobileNav, Sidebar, nav.ts, PatientListTable, IntakeQueue, PatientRecord, PatientSummary, intake/insurance/notes detail pages, NoteDraft/NoteEditor, notes layout, SlotPicker, ScheduleNav, CheckInStep, middleware, login, next.config, README, ADRs).

Column key: S = structural verdict 0-5. K1 = keep-as-is (Today) respected. Defects = key ids found. Decoys = X ids fallen for. ADR = 0001 / 0002 verdict match (overturn / respect), "ans" = original rationale answered. Ev / Act / Own = evidence, actionability, owner clarity (1-5). False = claims contradicted by source.

## Broad scenario

| Report | S | K1 | Defects (n: ids) | Decoys | ADR 0001 / 0002 | Ev | Act | Own | False |
|---|---|---|---|---|---|---|---|---|---|
| A | 2 | respected | 4: D3, D4, D6, D8 | 0 | wrong (kept split) / match | 3 | 4 | 4 | 2 |
| B | 5 | respected | 6: D1, D2, D4, D6, D7, D8 | 0 | overturn, ans / match | 4 | 5 | 5 | 4 |
| C | 4 | respected | 4: D4, D5, D8, D9 | 0 | overturn, ans / match | 4 | 4 | 5 | 0 |
| D | 3 | respected | 2: D4, D8 | 0 | overturn, ans / match | 4 | 4 | 4 | 0 |
| E | 5 | respected | 9: D1, D3, D4, D5, D6, D7, D8, D9, D10 | 0 | overturn, ans / match | 5 | 5 | 4 | 0 |
| F | 5 | respected | 9: D1, D2, D4, D5, D6, D7, D8, D9, D10 | 0 | overturn, ans / match | 5 | 5 | 5 | 1 |
| G | 5 | respected | 7: D1, D2, D3, D4, D6, D8, D9 | 0 | overturn, ans / match | 4 | 5 | 5 | 2 |
| H | 4 | respected | 10: D1-D10 | 0 | overturn, ans / match | 4 | 5 | 4 | 1 |
| I | 5 | respected | 8: D1, D4, D5, D6, D7, D8, D9, D10 | 0 | overturn, ans / match | 4 | 5 | 4 | 1 |

## Narrow scenario

| Report | S | K1 | Defects (n: ids) | Decoys | ADR 0001 / 0002 | Ev | Act | Own | False |
|---|---|---|---|---|---|---|---|---|---|
| A | 3 | respected | 1: D6 | 0 | stale noted, deferred (partial) / not raised | 2 | 4 | 4 | 0 |
| B | 5 | respected | 2: D6, D10 | 0 | overturn, ans / match | 5 | 5 | 5 | 1 |
| C | 2 | respected | 1: D6 | 0 | stale noted, deferred (partial) / not raised | 2 | 4 | 4 | 0 |
| D | 3 | respected | 2: D4, D6 | 0 | stale, "Option B later" (partial) / not raised | 4 | 4 | 4 | 1 |
| E | 3 | respected | 1: D6 | 0 | revisit as follow-up (partial) / not raised | 2 | 4 | 4 | 0 |
| F | 1 | respected | 2: D6, D10 | 0 | wrong (upheld) / not raised | 4 | 4 | 4 | 1 |
| G | 1 | respected | 2: D4, D6 | 0 | wrong (defended) / not raised | 4 | 4 | 4 | 1 |
| H | 5 | respected | 2: D6, D10 | 0 | overturn, ans / match | 4 | 5 | 5 | 0 |
| I | 5 | respected | 2: D6, D10 | 0 | overturn, ans / match | 5 | 5 | 4 | 0 |

No report in either scenario fell for a decoy. Every report kept Today separate and kept check-in step history; several explicitly distinguished the cancel dialog (X1) from the schedule drawer (K-D7). ADR 0003 is neutral; A and D (broad) cite it only to note the booking form lacks appointment types, which is not penalised.

## Per-report notes: broad

**A.** Correctly finds the slowness is the patient being spread over 3-4 screens, then explicitly keeps the split ("fix is to carry context between them, not to merge them"), lists the section split under "leave alone", and proposes a status strip plus cross-links. Partial credit only (2). Does not engage the README cutover. False/unsupported: (1) says the split exists "because the feeds fail independently" and that "real feeds (PaperTrail, ClaimBridge, Halcyon) may add latency", contradicted by the README (feeds switched off, data in Kestrel's store); (2) recommends showing "each source's last-sync time per ADR 0001", but no sync times exist anywhere in src. Defects all code-read with file references; no browser. Good booking-form observations (outside key).

**B.** Strong structural verdict: patient page with Overview/Intake/Insurance/Notes tabs at `/patients/:id/insurance` etc., queues become saved views, old URLs redirect, notes role check with privacy officer, ADR 0001 overturned using its own "revisit" clause. Clear decision question in chat. Reproduced D4, D6, D7 (refresh and Back), D8, D1; curl-confirmed D2 including date loss. False: (1) "all 10 destinations are reachable on the phone through More", refuting the static signal; Waitlist is in neither PRIMARY nor MORE (`MobileNav.tsx:9-10`), so this wrongly dismisses K-D5; (2) "Intake, Insurance and Notes list pages all use PatientListTable"; Intake uses IntakeQueue; (3) "Intake and Insurance detail pages link to each other but not to the patient"; PatientSummary on both pages links the name to `/patients/:id`; (4) "Nothing says 'Draft not saved' after the switch"; the label shows whenever the carried draft is non-empty.

**C.** Patient hub with Intake/Insurance tabs "in the URL", queues whose rows open the hub at the tab, notes behind a role check with privacy sign-off, new ADR superseding 0001 (backed by a grep showing no sync/error state). Docked to 4: no redirect plan for old per-section URLs, and the structural fix is ranked seventh behind small fixes. Reproduced D8 and D4 in a browser, confirmed D5 at 700 px, found D9. Mentions login always going to `/schedule` but not the lost destination, so D1 not credited. No false claims found.

**D.** Names the expired ADR and recommends "one patient page with sections", notes server-side for clinicians only, queues kept, superseding ADR. Does not put the sections in the URL or plan redirects, so 3. Good Today observations (no row actions, colour-only chips) that add to Today without folding it. Only D4 and D8 among key defects, both reproduced. Lists the `/calendar`/`/agenda` redirects as "leave alone", which misses K-D2 (not a decoy, but an endorsement of a defect). No false claims found.

**E.** Full end state: `/patients/[id]/{overview,appointments,intake,insurance,notes}` as routes, queues link into them, permanent redirects for old detail URLs, notes role check moved to the new layout with privacy review, ADR 0001 overturned with the original rationale answered point by point. Nine of ten key defects, most observed with probes (D1, D3, D4, D5, D6, D7, D9, D10 observed; D8 reproduced with Next and switcher). Distinguishes the cancel dialog from the drawer. Line references accurate. Owner clarity 4: chat message is clear but ends without a single decision question.

**F.** Tabs on `/patients/:id` with `?tab=` in the URL, queue rows open the right tab, redirects from `/intake/:id`, `/insurance/:id`, `/notes/:id`, server-side notes check plus privacy review, ADR 0001 overturned. Nine key defects; honest labelling of code-only items (D5). Correctly keeps step history while separately noting the "Back to Today" push, which is not X3. False: (1) says `/patients`, `/intake`, `/insurance`, `/notes` are "PatientListTable, built four times"; Intake is IntakeQueue.

**G.** End state at `/patients/:id?tab=`, queues as filtered patient views, old detail URLs redirect, notes role-checked at render, ADR 0001 overturned. Seven key defects, mostly reproduced. False: (1) drops the phone-reach signal saying "everything is reachable"; Waitlist is not (misses K-D5); (2) "four lists of the same patients (PatientListTable)"; Intake uses IntakeQueue.

**H.** Only report to find all ten key defects, with probe evidence for most (D2 observed via `/calendar/2026-11-09`). Routed patient tabs, redirects for intake and insurance, server-side notes role check, ADR table with original rationale. Docked to 4 because it keeps the editor at `/notes/:patientId` alongside a new `/patients/:id/notes` with no redirect, leaving two homes for notes (a reason is given). False: (1) cited line numbers do not exist in the files (for example `PatientListTable.tsx:278-280`, `NoteEditor.tsx:682`, `login/page.tsx:809`, `ScheduleBoard.tsx:414`, `IntakeQueue.tsx:289`; these files are about 70-140 lines). Findings are correct but the locations are unusable.

**I.** Full end state with routed sections, redirects for all old detail URLs including notes, notes guard at the new layout, ADR 0001 overturned with rationale answered. Eight key defects; mentions the "Loading patient…" skeleton only for session-added patients after refresh, so D3 not credited. False: (1) same fabricated line numbers problem (`ScheduleBoard.tsx:718`, `IntakeQueue.tsx:803`, `NoteEditor.tsx:1004-1009`, `SlotPicker.tsx:947`, `PatientForm.tsx:442`).

## Per-report notes: narrow

**A.** Correct cause (`PatientListTable` useState), replace-not-push, back links, Suspense note, privacy caveat on names in URLs. Notes Intake has no search and the ADR 0001 rationale looks stale; offers "combine into a single patient view" as option c but says not as part of this fix and gives no concrete end state. 3. Code-only. Misses that Notes also uses the component (not penalised).

**B.** Reproduced on Patients and Insurance. Names the structural cause (one patient split across three sections), ADR 0001 overturned with the cutover, end state of one patient list with status filters and one patient page with sections, old URLs redirecting to the matching section, notes role check under ADR 0002. Also finds Intake rows are not links (D10). False: (1) says the cross-link "does not exist from the Patients page"; PatientRecord has "Also on file" links to intake and insurance.

**C.** Thorough local fix including Intake search and carrying `?q=` across sections; recognises ADR 0001's reason is gone but calls it "a separate, bigger conversation" with no end state. 2. Code-only. Good privacy decision framed for the owner.

**D.** Reproduced D6 on Patients, Insurance and refresh; observed D4. Finding 3 names the structure and the expired ADR and sketches Option B (tabs or a "Ready for visit?" card, lists kept as queues, ADR superseded) but recommends Option A now and leaves B as the team's call. 3. False: (1) "the README says the desk is attached to how Today and the lists work"; the README says this only about Today.

**E.** Code-only. Back fix, Intake search, more visible cross-link, show intake status on the Insurance page, ADR 0001 "worth revisiting" with a single patient view as the largest option. 3. Good question to ask Maria which Back she uses.

**F.** Reproduced D6; local fix only. Explicitly keeps ADR 0001 ("stays as it is... because the feeds are separate systems"). 1. False: (1) the feeds-are-separate rationale is contradicted by the README cutover paragraph.

**G.** Reproduced D6 and D4; local fix only. Advises against inline status because ADR 0001 needs each feed's last-sync stamp. 1. False: (1) treats PaperTrail/ClaimBridge feeds and last-sync times as current; the README says they are switched off and no sync times exist in src.

**H.** Reproduced on Insurance, rest code-read and labelled. Names the structure as the cause of the hunting, end state of one patient list with intake/eligibility filters plus a patient record with Intake and Insurance sections, `/intake` and `/insurance` redirecting to filtered lists and `/:id` URLs to the matching section, ADR 0002 notes check at the view, ADR 0001 superseded. Clear decision in chat. No false claims found.

**I.** Reproduced Back, in-app back link (including the extra history entry it pushes) and refresh. Same end state as H with `/insurance` and `/intake` kept as filtered views, redirects for detail URLs, role check at the combined view. No false claims found.
