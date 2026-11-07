# Report G

## Final chat message

Staff aren't hitting a bug. They're doing extra work because the app is organised around where patient data used to come from, not around the patient. I tested it in the running copy as front desk and as a clinician, and I didn't change the app.

**What staff run into**
- **One patient, three sections.** Checking one patient means visiting Patients, Intake forms and Insurance, and each repeats the same header. The split exists because intake, insurance and notes used to come from three outside systems (ADR 0001). Those feeds were switched off in the spring, so the reason is gone.
- **Lists forget their place.** I searched Patients for "Okoro", opened a row and pressed Back, and the search was empty again. The Insurance filter reset the same way, and the patient's Appointments tab resets on refresh.
- **Getting lost.** The sidebar stops highlighting a section once you open a detail page. On a phone, nothing is highlighted for anything under "More". A pasted link opened while signed out loses its destination at sign-in. The "Back to Today" button in check-in adds a new history entry, so Back then returns to the check-in step you just left.

**One patient-safety bug:** a half-written visit note carries over to the next patient. In the test, a draft typed for Hector appeared unchanged in Chloe's editor after "Next: Chloe". "Sign note" files whatever is on screen under the patient being shown, so a note could land in the wrong chart. I'd fix this first.

**What I recommend**
1. Keep each note draft with its own patient.
2. Put search, filters and the patient tab in the URL so Back and refresh keep them.
3. Use one rule for highlighting the current section, in both the sidebar and the phone bar.
4. Fix the check-in exit link and make sign-in return to the link you came from.
5. Make the patient record the one place for everything about a person, with Intake, Insurance and (clinicians only) Notes as tabs. Keep Intake and Insurance as filtered patient lists, since the desk works through them each morning.

Keep Today separate from Schedule, as the README argues, and keep ADR 0002's rule that notes are clinician-only. I'd overturn ADR 0001, since its own text says to revisit once the systems were consolidated. The report has the full order of fixes and what each means for existing links.

**One decision for you:** should Intake, Insurance and Notes become tabs on the patient record? I say yes. The desk lead should confirm that they use the Intake and Insurance lists as morning to-do lists, because that decides whether those lists stay in the sidebar.

**Not checked:** I didn't test the waiting-room board, tablet width or page load times. Nothing about "slow" is a load-time problem as far as I can tell.

The in-memory data will lose check-in status and notes on refresh. The README calls that a pilot choice, so I noted it rather than counting it as a defect. The review folder isn't gitignored, and I left `.gitignore` alone.

The report is at `.experience-architecture/2026-11-07/report.md` in the app folder, with the browser test logs under `journeys/` and `journeys-mobile/` beside it.

## File: transitions.md

# Journey verification

1 run(s), 5 steps. Checks: 0/1 met. Anomalies: 4 (0 defect, 2 likely, 0 judgment, 2 info).

## Failed checks

| Journey | Viewport | Step | Check | Expected | Observed |
|---|---|---|---|---|---|
| mobile-reach-insurance | mobile | 4 | activeNav | {"text":"Insurance"} | [] |

## Anomalies

### overlay-without-history (likely) — mobile-reach-insurance, step 1, mobile

- Start: `/today` "Today"
- Action: click role=button[name='More']
- Expected: opening an overlay adds a history entry (so Back closes it) or leaves history alone and closes on Escape
- Observed: opened "More destinations" with none

### focus-lost-after-overlay (likely) — mobile-reach-insurance, step 2, mobile

- Start: `/today` "Today" with "More destinations" open
- Action: click role=link[name='Insurance']
- Expected: focus returns to the control that opened the overlay
- Observed: focus left on <body>

### focus-not-managed (info) — mobile-reach-insurance, step 2, mobile — seen 2× (mobile-reach-insurance#2, mobile-reach-insurance#3)

- Start: `/today` "Today" with "More destinations" open
- Action: click role=link[name='Insurance']
- Expected: focus moves to the new page heading or main region
- Observed: focus left on <body>

### title-stale (info) — mobile-reach-insurance, step 3, mobile

- Start: `/insurance` "Insurance"
- Action: click table >> role=link >> nth=0
- Expected: document title follows the page
- Observed: title stays "Insurance · Kestrel"


## File: transitions.md

# Journey verification

10 run(s), 51 steps. Checks: 1/8 met. Anomalies: 13 (4 defect, 6 likely, 1 judgment, 2 info).

## Failed checks

| Journey | Viewport | Step | Check | Expected | Observed |
|---|---|---|---|---|---|
| one-patient-picture | desktop | 8 | field Search patients | "Okoro" | "" |
| one-patient-picture | desktop | 8 | sameAs searched | "no difference" | [{"what":"field \"Search patients\"","before":"Okoro","after":""}] |
| list-filter-return | desktop | 4 | sameAs filtered | "no difference" | [{"what":"pressed","before":["Verified","Any clinician"],"after":["All statuses","Any clinician"]},{"what":"field \"Filter by Eligibility\"","before":"verified","after":"all"}] |
| patient-tab-refresh | desktop | 3 | tab | "Appointments" | ["Details"] |
| nested-active-nav | desktop | 1 | activeNav | {"text":"Patients"} | ["tablist#2: Details","nav:Main: Patients"] |
| nested-active-nav | desktop | 3 | activeNav | {"text":"Schedule"} | ["tablist:Schedule view: Week","nav:Main: Schedule"] |
| nested-active-nav | desktop | 5 | activeNav | {"text":"Today"} | ["nav:Main: Today"] |

## Anomalies

### restoration-divergence (defect) — one-patient-picture, step 7, desktop

- Start: `/patients` "Patients"
- Action: Back
- Expected: returning to /patients restores the view the user left
- Observed: field "Search patients": "Okoro" → ""

### restoration-divergence (defect) — list-filter-return, step 3, desktop

- Start: `/insurance` "Insurance"
- Action: Back
- Expected: returning to /insurance restores the view the user left
- Observed: pressed: ["Verified","Any clinician"] → ["All statuses","Any clinician"]; field "Filter by Eligibility": "verified" → "all"

### refresh-divergence (defect) — patient-tab-refresh, step 2, desktop

- Start: `/patients/p-102` "Ben Okoro"
- Action: Reload
- Expected: refresh shows the same view
- Observed: tabs: ["Appointments (2)"] → ["Details"]

### deep-link-loss (defect) — cold-signed-out, step 1, desktop

- Start: `/insurance/p-102` "Insurance · Ben Okoro"
- Action: ColdOpen
- Expected: the sign-in page remembers /insurance/p-102
- Observed: a signed-out recipient was sent to /login with no return address

### in-app-back-push (likely) — checkin-flow, step 6, desktop

- Start: `/today/a-505/arrived`
- Action: click role=link[name='Back to Today']
- Expected: returning to /today reuses the existing entry (history.back) so state is restored and Back does not loop
- Observed: pushed a new /today entry; browser Back now returns to /today/a-505/arrived

### overlay-without-history (likely) — appt-cancel-dialog, step 1, desktop — seen 2× (appt-cancel-dialog#1, appt-cancel-dialog#3)

- Start: `/schedule/appointments/a-505` "Diabetes check"
- Action: click role=button[name='Cancel appointment']
- Expected: opening an overlay adds a history entry (so Back closes it) or leaves history alone and closes on Escape
- Observed: opened "Cancel this appointment? Farid · Fri, No" with none

### focus-lost-after-overlay (likely) — appt-cancel-dialog, step 2, desktop

- Start: `/schedule/appointments/a-505` "Diabetes check" with "Cancel this appointment? Farid · Fri, No" open
- Action: press Escape
- Expected: focus returns to the control that opened the overlay
- Observed: focus left on <body>

### back-stayed-on-page (likely) — schedule-links, step 3, desktop

- Start: `/schedule/week?date=2026-11-13` "Schedule"
- Action: Back
- Expected: Back returns to the previous place
- Observed: Back only changed ?date=2026-11-13 → ?date=2026-11-06 on /schedule/week

### cold-open-differs (likely) — notes-draft-leak, step 0, desktop

- Start: `blank`
- Action: coldOpen /notes
- Expected: a clinician browser opening /notes sees what the sender saw
- Observed: h1: null → "Visit notes"; pressed: [] → ["Any clinician"]

### cold-open-differs (likely) — cold-other-role, step 1, desktop

- Start: `/patients/p-102` "Ben Okoro"
- Action: coldOpen /notes/p-102
- Expected: a same browser opening /notes/p-102 sees what the sender saw
- Observed: h1: "Ben Okoro" → "Visit notes are for clinicians"; tabs: ["Details"] → []

### view-state-push (judgment) — schedule-links, step 2, desktop

- Start: `/schedule/week?date=2026-11-06` "Schedule"
- Action: click role=link[name='Next']
- Expected: a view change that replaces the current entry
- Observed: push: ?date=2026-11-06 → ?date=2026-11-13

### focus-not-managed (info) — one-patient-picture, step 2, desktop — seen 18× (one-patient-picture#2, one-patient-picture#3, one-patient-picture#4, one-patient-picture#5, one-patient-picture#6, one-patient-picture#7)

- Start: `/patients` "Patients"
- Action: click role=link[name=/Okoro/]
- Expected: focus moves to the new page heading or main region
- Observed: focus left on <body>

### title-stale (info) — list-filter-return, step 2, desktop — seen 3× (list-filter-return#2, list-filter-return#3, notes-draft-leak#3)

- Start: `/insurance` "Insurance"
- Action: click table >> role=link >> nth=0
- Expected: document title follows the page
- Observed: title stays "Insurance · Kestrel"


## File: summary.md

# Experience map: kestrel

Frameworks: next@15.3.3 · State libraries: none detected
Files scanned: 72 · Pages: 31 · Navigation references: 88 · Signals: 16

Signals are candidates found by static analysis. Each needs confirming in code or in the running app before it is reported as a defect.

## Routes

| Path | Kind | File | Inbound | Layouts |
|---|---|---|---|---|
| `/` | page | src/app/page.tsx | 2 | 1 |
| `/board` | page | src/app/(kiosk)/board/page.tsx | 1 | 2 |
| `/help` | page | src/app/(staff)/help/page.tsx | 2 | 2 |
| `/insurance` | page | src/app/(staff)/insurance/page.tsx | 3 | 2 |
| `/insurance/:patientId` | page | src/app/(staff)/insurance/[patientId]/page.tsx | 4 | 2 |
| `/insurance/payers` | page | src/app/(staff)/insurance/payers/page.tsx | 1 | 2 |
| `/intake` | page | src/app/(staff)/intake/page.tsx | 3 | 2 |
| `/intake/:patientId` | page | src/app/(staff)/intake/[patientId]/page.tsx | 5 | 2 |
| `/intake/templates` | page | src/app/(staff)/intake/templates/page.tsx | 1 | 2 |
| `/login` | page | src/app/login/page.tsx | 1 | 1 |
| `/messages` | page | src/app/(staff)/messages/page.tsx | 3 | 2 |
| `/messages/:threadId` | page | src/app/(staff)/messages/[threadId]/page.tsx | 1 | 2 |
| `/notes` | page | src/app/(staff)/notes/page.tsx | 3 | 3 |
| `/notes/:patientId` | page | src/app/(staff)/notes/[patientId]/page.tsx | 3 | 3 |
| `/notes/:patientId/:visitId` | page | src/app/(staff)/notes/[patientId]/[visitId]/page.tsx | 1 | 3 |
| `/patients` | page | src/app/(staff)/patients/page.tsx | 5 | 2 |
| `/patients/:id` | page | src/app/(staff)/patients/[id]/page.tsx | 6 | 2 |
| `/patients/:id/edit` | page | src/app/(staff)/patients/[id]/edit/page.tsx | 1 | 2 |
| `/patients/new` | page | src/app/(staff)/patients/new/page.tsx | 1 | 2 |
| `/schedule` | page | src/app/(staff)/schedule/page.tsx | 7 | 2 |
| `/schedule/appointments/:id` | page | src/app/(staff)/schedule/appointments/[id]/page.tsx | 3 | 2 |
| `/schedule/appointments/:id/reschedule` | page | src/app/(staff)/schedule/appointments/[id]/reschedule/page.tsx | 1 | 2 |
| `/schedule/new` | page | src/app/(staff)/schedule/new/page.tsx | 2 | 2 |
| `/schedule/week` | page | src/app/(staff)/schedule/week/page.tsx | 1 | 2 |
| `/settings` | page | src/app/(staff)/settings/page.tsx | 2 | 2 |
| `/settings/clinicians` | page | src/app/(staff)/settings/clinicians/page.tsx | 1 | 2 |
| `/settings/rooms` | page | src/app/(staff)/settings/rooms/page.tsx | 1 | 2 |
| `/today` | page | src/app/(staff)/today/page.tsx | 3 | 2 |
| `/today/:apptId` | page | src/app/(staff)/today/[apptId]/page.tsx | 0 | 2 |
| `/today/:apptId/:step` | page | src/app/(staff)/today/[apptId]/[step]/page.tsx | 3 | 2 |
| `/waitlist` | page | src/app/(staff)/waitlist/page.tsx | 2 | 2 |

## Redirects and guards

- redirect: `/calendar` → `/agenda` (permanent) — next.config.ts:7
- redirect: `/calendar/:date` → `/agenda/:date` (permanent) — next.config.ts:8
- redirect: `/agenda` → `/schedule` (permanent) — next.config.ts:9
- redirect: `/agenda/:date` → `/schedule` (permanent) — next.config.ts:10
- redirect: `/patient/:id` → `/patients/:id` (permanent) — next.config.ts:11
- render-redirect: `(render)` → `/today/${apptId}/arrived` — src/app/(staff)/today/[apptId]/page.tsx:5

## Persistent chrome

| Component | Routes covered | Destinations | Active state |
|---|---|---|---|
| src/components/AppShell.tsx | 28 | 1 | none |
| src/components/MobileNav.tsx | 28 | 10 | prefix |
| src/components/Sidebar.tsx | 28 | 10 | exact + aria-current |
| src/app/(staff)/notes/layout.tsx | 3 | 1 | none |

## Signals

### Information architecture

- **ia-1** No statically resolvable link reaches /today/:apptId
  - No literal link, redirect or guard targets this route, but 10 navigation target(s) are computed at runtime and may reach it. Treat as unconfirmed until a crawl or code read settles it.
  - Evidence: src/app/(staff)/today/[apptId]/page.tsx
  - Confirm: Check the unresolved dynamic targets in summary.md; crawl the running app to confirm.
- **ia-2** /insurance and /patients are both built on <PatientListTable>
  - They read the same records and fields but present them differently. Often one should be a filter, tab or mode of the other. This is a design question, not a defect.
  - Evidence: src/app/(staff)/insurance/page.tsx, src/app/(staff)/patients/page.tsx
  - Confirm: Decide whether users think of these as one place.
- **ia-3** /notes and /patients are both built on <PatientListTable>
  - They read the same records and fields but present them differently. Often one should be a filter, tab or mode of the other. This is a design question, not a defect.
  - Evidence: src/app/(staff)/notes/page.tsx, src/app/(staff)/patients/page.tsx
  - Confirm: Decide whether users think of these as one place.
- **ia-4** /schedule/appointments/:id/reschedule and /schedule/new are both built on <SlotPicker>
  - They read the same records and fields but present them differently. Often one should be a filter, tab or mode of the other. This is a design question, not a defect.
  - Evidence: src/app/(staff)/schedule/appointments/[id]/reschedule/page.tsx, src/app/(staff)/schedule/new/page.tsx
  - Confirm: Decide whether users think of these as one place.

### Routing

- **routing-1** 1 URL prefix(es) have no page
  - Removing the last segment from a URL leads to a 404 at: /schedule/appointments
  - Confirm: Visit each prefix in the running app.
- **routing-2** Redirect chain: /calendar → /agenda → /schedule
  - 2 hops. Each hop costs a round trip and an extra history decision; point /calendar straight at /schedule.
  - Evidence: next.config.ts:7
  - Confirm: curl -sI the first URL and count Location headers.
- **routing-3** Redirect chain: /calendar/:date → /agenda/:date → /schedule
  - 2 hops. Each hop costs a round trip and an extra history decision; point /calendar/:date straight at /schedule.
  - Evidence: next.config.ts:8
  - Confirm: curl -sI the first URL and count Location headers.

### Chrome and navigation

- **chrome-1** 10 destination(s) are linked from more than one persistent nav system
  - Shared: /today, /schedule, /patients, /intake, /insurance, /notes, /waitlist, /messages, /settings, /help. Two systems claiming the same job means two active states to keep in sync and no clear owner for where something lives.
  - Evidence: src/components/MobileNav.tsx, src/components/Sidebar.tsx
  - Confirm: Visit a nested page and compare which item each system highlights.
- **chrome-2** Persistent nav systems compute "current" differently (prefix vs exact)
  - On a nested route one system shows the section as current and another does not.
  - Evidence: src/components/MobileNav.tsx (prefix), src/components/Sidebar.tsx (exact)
  - Confirm: Open a nested page (e.g. a detail route) and check both systems.
- **chrome-3** src/components/Sidebar.tsx only marks an item current on an exact URL match
  - Sections with child pages lose their highlight one level down: /today, /schedule, /patients, /intake, /insurance, /notes, /messages, /settings.
  - Evidence: src/components/Sidebar.tsx
  - Confirm: Open /today/<child> and check the item.
- **chrome-4** /patients is labelled "Go to Patients" and "Patients" in different places
  - Different names for one destination make users think they are different places.
  - Evidence: src/app/(staff)/notes/layout.tsx:13, src/components/MobileNav.tsx:13, src/components/Sidebar.tsx:13
  - Confirm: Confirm in the UI.
- **chrome-5** src/components/AppShell.tsx offers 1 destinations; desktop chrome offers 10
  - Not reachable from the small-screen navigation: /today, /schedule, /patients, /intake, /insurance, /notes, /waitlist, /messages, /settings, /help.
  - Evidence: src/components/AppShell.tsx
  - Confirm: At 390px wide, try to reach each missing section.

### Continuity and state

- **continuity-1** src/components/ClinicStore.tsx keeps state above /insurance/:patientId
  - State named state survives when the user switches from one /insurance/:patientId to another. Anything entity-specific in it will leak between entities.
  - Evidence: src/components/ClinicStore.tsx:46
  - Confirm: Enter something on one /insurance/:patientId, go to another, and check.
- **continuity-2** src/components/NoteDraft.tsx keeps state above /notes/:patientId
  - State named draft survives when the user switches from one /notes/:patientId to another. Anything entity-specific in it will leak between entities.
  - Evidence: src/components/NoteDraft.tsx:13
  - Confirm: Enter something on one /notes/:patientId, go to another, and check.
- **continuity-3** /today/:apptId/:step: the in-app way back pushes /today instead of going back
  - It creates a new /today entry with fresh state (filters, scroll) and leaves the detail page behind it, so browser Back afterwards returns to the detail page.
  - Evidence: src/components/CheckInStep.tsx:42
  - Confirm: On /today, change a filter and scroll, open an item, use the in-app back control, then press browser Back.
- **continuity-4** src/components/AppointmentActions.tsx opens an overlay from component state (confirm)
  - The overlay cannot be linked to and Back does not close it. Fine for transient confirmations; wrong for things users create, share or return to.
  - Evidence: src/components/AppointmentActions.tsx:23
  - Confirm: Open it, then press Back; open it and navigate elsewhere.

## Unresolved dynamic targets (10)

These navigation targets are computed at runtime; a crawl or journey run resolves them.

- src/app/page.tsx:6 `role === "clinician" ? "/schedule" : "/today"`
- src/components/MobileNav.tsx:29 `item.href`
- src/components/MobileNav.tsx:41 `item.href`
- src/components/ScheduleNav.tsx:15 `q(addDays(date, -step))`
- src/components/ScheduleNav.tsx:17 `q(addDays(date, step))`
- src/components/ScheduleNav.tsx:19 `q(clinicDay(0))`
- src/components/Sidebar.tsx:19 `item.href`
- src/components/Sidebar.tsx:32 `item.href`
- src/components/SlotPicker.tsx:55 `returnTo`
- src/components/ui.tsx:20 `back.href`


## File: report.md

# Kestrel: why it feels slow and easy to get lost in

Reviewed 2026-11-06 against the dev copy at localhost:5700 (front desk and clinician sessions). The app was not changed.

## 1. Verdict

Nothing is broken, but staff are doing extra work. Kestrel is organised around where patient data *used to come from* (PaperTrail, ClaimBridge, Halcyon) instead of around the patient. To answer "is Mr. Okoro ready?" the desk visits three sections (Patients, Intake forms, Insurance), and each one re-shows the same patient header. Every list forgets its search and filter when you open a row and come back, so each hop also costs a re-search. The sidebar stops showing where you are as soon as you open a detail page.

Those outside feeds were switched off at the spring 2026 cutover, so the structure no longer has a reason to exist. I recommend:

1. Fix a patient-safety bug first (a half-written clinical note follows the clinician to the next patient).
2. Make lists, tabs and filters survive Back and refresh.
3. Fold Intake, Insurance and Notes into the patient record as tabs.

Keep Today separate from Schedule, as the README argues.

## 2. Root causes (most user impact first)

### Cause A. The patient is split across sections by a retired data-source boundary
ADR 0001 gave each outside system its own top-level section. Its own text says "revisit if the clinic consolidates these systems", and the README confirms they were consolidated. What users now get:

- Intake, Insurance and Notes each repeat the patient header and link sideways to each other. Patients links to Intake, Insurance and Notes, and Intake and Insurance link to each other. There is no single place for the patient.
- Eight sidebar items, of which `Patients`, `Intake forms`, `Insurance` and `Visit notes` are the same people.
- `/insurance`, `/intake`, `/notes` and `/patients` are four lists of the same patients (`PatientListTable`, `src/components/PatientListTable.tsx`).

**Design judgment, impact high** (it hurts the desk, who ask about one patient at a time all day). Evidence: code (`src/app/(staff)/insurance/[patientId]/page.tsx`, `intake/[patientId]/page.tsx`, `PatientRecord.tsx` "Also on file"); the sidebar list in `src/components/nav.ts`.

### Cause B. Where you are in a list, tab or filter is not kept anywhere that survives navigation
There is no rule for what lives in the address bar. Schedule follows the rule (`?date=`, `?clinician=`). The patient lists, tabs and notes do not.

#### Lists forget search and filter on return
Class: Defect (reproduced) · Area: continuity · Impact: high
Start: `/patients`, search "Okoro" (journey `one-patient-picture`). Same on `/insurance` with the Eligibility filter set to Verified (`list-filter-return`).
Action: open a row, press Back.
Expected: the list as left.
Observed: search field `Okoro` becomes empty. The filter returns from "Verified" to "All statuses".
Cause: query, status and clinician are `useState` in `src/components/PatientListTable.tsx:34-36`; nothing writes them to the URL.
Impact: this is the most-repeated move in the app (front desk work through the Intake and Insurance queues).
Fix direction: put `?q=&status=&clinician=` in the URL and replace the entry while typing.

#### Patient tab is lost on refresh and can't be linked
Class: Defect (reproduced) · Impact: medium
Start: `/patients/p-102`, Appointments tab, then refresh.
Observed: returns to Details (`patient-tab-refresh`).
Cause: `tab` is `useState` (`src/components/PatientRecord.tsx:30`). Also the page shows "Loading patient…" for unknown ids instead of a not-found.
Fix: `?tab=`, replaced when switching.

#### Sign-in drops the destination
Class: Defect (reproduced) · Impact: medium
Start: signed-out person opens a pasted `/insurance/p-102`.
Observed: sent to `/login` with no return address; after sign-in, `src/app/login/page.tsx` always goes to `/schedule`.
Cause: `src/middleware.ts` clears the query and the login ignores one.
Fix: pass `?next=` (same-site paths only) and honour it.

#### "Back to Today" in check-in loops
Class: Defect (reproduced) · Impact: medium
Start: `/today` → Check in → Next → Next (insurance, forms). Back twice, then the "Back to Today" button.
Observed: a new `/today` entry is pushed; browser Back then returns to `/today/a-505/arrived` (`checkin-flow`).
Cause: `src/components/CheckInStep.tsx:42` links to `/today`; `finish()` at line 35 does `router.push("/today")`, which has the same effect after finishing.
Note: the step-to-step history pushes are deliberate (README, tablet swipe-Back) and I would not change them. Only the way *out* of check-in should go back or replace.

#### Week view: Back changes the date instead of leaving
Class: Design judgment · Impact: low
Back after "Next week" only moves `?date=` back (`schedule-links`, `ScheduleNav.tsx`). This is reasonable for a calendar; I would leave it unless the desk complains.

### Cause C. A clinical note draft is shared across all patients (safety)
Class: Defect (reproduced) · Impact: **high**
Start: clinician at `/notes/p-108` (Hector), types a draft.
Action: click "Next: Chloe →" (the intended click-through between exam rooms).
Observed: Chloe's editor opens with the identical 19-character text (same fingerprint `#0edace` before and after, journey `notes-draft-leak`).
Cause: one `draft` string in `NoteDraftProvider`, mounted for the whole notes section (`src/app/(staff)/notes/layout.tsx`, `src/components/NoteDraft.tsx:13`). It is not keyed by patient. "Sign note" then files it under whichever patient is on screen (`NoteEditor.tsx:25`).
Why it matters: a note about one patient can be signed into another patient's chart. Clinicians who "click through to the next patient" (README) are exactly the ones exposed. The editor also says "Draft not saved", so nothing survives a refresh.
Fix: key drafts by patient id (store `Record<patientId, string>`), and persist them (the server, or at minimum browser storage). Check the privacy implication with the privacy officer under ADR 0002.

### Cause D. Two navigation systems that disagree, and neither shows depth

#### Sidebar loses the section on any detail page
Class: Defect (reproduced) · Impact: medium
`src/components/Sidebar.tsx:13` uses exact match. On `/patients/p-102`, `/schedule/week` and `/today/a-505/arrived` the sidebar item is not marked current. In the journey, "Patients" was reported unmarked on the detail page, as were Schedule (week) and Today (check-in).
The phone bar (`MobileNav.tsx`) uses prefix matching, so the two systems disagree. On a phone, anything under the "More" menu (Intake, Insurance, Notes, Settings, Help) highlights nothing at all (`mobile-reach-insurance`): the reader sees no sign of where they are.
Small things: "Go to Patients" vs "Patients"; document title stays "Insurance · Kestrel" on a patient's insurance page; focus is left on `<body>` after each navigation and when a dialog closes (accessibility, 13+ occurrences).
Fix: one shared `isActive` (prefix) used by both; set page titles on detail pages; move focus to the main heading.

### Cause E. Smaller items
- Cancel and no-show confirmations are not addressable: **intentional** (README), proven consistent — refresh closes the dialog. Keep. Fix only the focus return to the button that opened it.
- Redirect chains `/calendar → /agenda → /schedule` (`next.config.ts:7-8`) cost two hops, and `/agenda/:date` and `/calendar/:date` drop the date. Point them straight at `/schedule?date=:date`. Low impact; the old links are only bookmarks.
- `/schedule/appointments` (no id) is a 404. Low.
- `/today/:apptId` has no inbound link and only redirects to the first step. Harmless.

## 3. Structure verdict: **part of the cause**

Cause A is structural; B, C and D are local. A patient-centred record removes the sideways hops and the four duplicate lists, and makes B and D easier to fix once (one list and one set of tabs to get right).

**End state, in two sentences.** *Patients* is the one place for anything about a person, with tabs Overview, Appointments, Intake, Insurance and (clinicians only) Notes at `/patients/:id?tab=`, plus a "ready for visit?" summary at the top. Intake and Insurance stay reachable as **work queues** (filtered views of the patient list, e.g. `/patients?needs=intake` or `/patients?eligibility=failed`), because the desk really does work through them each morning; the separate `/intake/:id` and `/insurance/:id` pages go away and redirect.

What to keep:
- **Today stays separate from Schedule.** The README's tablet reasoning holds; I found nothing contradicting it. The problem on Today is only the exit link.
- **ADR 0002 stays**, and the structure change must keep it: the Notes tab and its content are checked for a clinician role at the point they render (the server check, not just a hidden tab), `/board` stays isolated and link-free, and intake stays under the patient.
- **ADR 0001**: recommend **overturning** it. Its stated trigger ("revisit if the clinic consolidates") has happened.
- Template/payer/settings pages (`/intake/templates`, `/insurance/payers`, `/settings/*`) are admin, not patient work, and should move under Settings.

## 4. What was proven how

Reproduced in a browser (Playwright, dev copy, front desk and clinician cookies, writes blocked): list search and filter lost on Back; patient tab lost on refresh; sign-in drops the link; "Back to Today" loop; note draft carried to the next patient; sidebar not marking the current section; unmarked sections on phone's More menu; date Back behaviour.
Read in code only: store is in memory only (`ClinicStore.tsx`), so check-in status, edits and signed notes vanish on refresh (the README says this is the pilot's design, so it is not a defect now, but it will be the first thing that matters at go-live); signed note filing; redirect chains (not curled).
Not checked: the `/board` TV screen, tablet width, other roles' permission edge cases beyond one front-desk request to `/notes` (shows the "for clinicians" message correctly — but it is hidden by the layout, not the data layer, so confirm how real data will be gated), performance/loading time (the complaint "slow" is about steps, not load time; I did not time pages).
Dropped signals: `chrome-5` (the phone bar has Today, Schedule, Patients, Messages and More, so everything is reachable). `ia-4` (booking and reschedule share a picker, fine).

## 5. Current structure
- Site map: `.experience-architecture/2026-11-07/map/sitemap-current.mmd`
- Navigation graph: `.experience-architecture/2026-11-07/map/nav-graph.mmd`
- Route table: `.experience-architecture/2026-11-07/map/summary.md`
- Journeys and transitions: `.experience-architecture/2026-11-07/journeys/` (`transitions.md`, `transitions.mmd`, `journeys.json` to re-run with `ea journey journeys.json --ci`); phone run in `journeys-mobile/`.

Note: `.experience-architecture/` is not gitignored; I did not edit `.gitignore`.

## 6. Recommended fixes, in order

| # | Change | Size | Links/bookmarks |
|---|---|---|---|
| 1 | Key the note draft per patient and persist it | small | unaffected |
| 2 | Put list search/filters and patient tab in the URL (`replace`) | small–medium | unaffected, new params optional |
| 3 | One shared active-state rule for both navs; also highlight "More" items on phone | small | unaffected |
| 4 | Check-in exit: "Back to Today" and Finish use back or replace, not push | small | unaffected |
| 5 | Sign-in `?next=` | small | unaffected |
| 6 | Titles, focus after navigation and dialog close; "Go to Patients" label | small | unaffected |
| 7 | Flatten the calendar redirects, carry the date | small | old links still work |
| 8 | Patient record with Intake, Insurance, Notes tabs; Intake and Insurance lists become filtered Patient views; admin pages under Settings | medium–large | `/intake/:id`, `/insurance/:id`, `/notes/:id` redirect to `/patients/:id?tab=`; `/patient/:id` already redirects |

Items 1–7 are safe under any later structure. Do them before 8, since 8 reuses the URL-state rule from 2.

## 7. Decisions for the owner

1. **Fold Intake, Insurance and Notes into the patient record?** Recommended yes, keeping the morning queues as filtered lists. The ask for the desk lead: do they use the Intake and Insurance lists *as to-do queues* (yes per README), and so want them in the sidebar?
2. **Where should unsaved note drafts live?** Recommend on the server per patient, so a laptop closing doesn't lose a note, subject to the privacy officer's agreement.
3. **When does the pilot's in-memory data go away?** Not a UX choice, but it determines whether item 8 is worth doing before or after real storage.

