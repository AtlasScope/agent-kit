# Report I

## Final chat message

I've written the review to `xa-review/report.md`. I didn't change the app. The probe specs, output and screenshots are in the same folder.

The server isn't slow (pages answer in 10–20 ms). The slowness is in how people move around the app, and the review's recommendations come out as five changes:

1. **Fix the visit-note draft first.** It's one shared buffer for every patient. I typed a note on Ana Ruiz, switched to Ben Okoro, and Ana's text was sitting in his note with "Sign note" enabled. A refresh also loses a draft with no warning. This is the only serious bug, and it affects the clinicians' "next patient" flow. The fix is to keep the draft per patient, save it, and warn before leaving.
2. **Make a patient one place.** Intake, Insurance, Notes and Patients are four sections, each with its own copy of the same patient list. "Is Mr. Okoro ready?" takes eight or more taps and two repeated searches. ADR 0001 split them by outside vendor feed, and the README says those feeds ended in spring 2026. I recommend one patient page with Overview, Appointments, Intake, Insurance and Notes sections. Intake and Insurance stay as work queues. The clinician-only check on notes (ADR 0002) moves with it.
3. **Put view state in the address bar.**
   - Patient tabs, list searches and filters, and the schedule drawer are all lost on Back or refresh.
   - Pressing Back with the drawer open leaves Schedule entirely instead of closing it.
4. **Make the sidebar highlight correctly.**
   - Nothing is highlighted on any detail page, because the sidebar matches exact paths only.
   - Waitlist is missing from the phone navigation, so it's unreachable there.
5. **Fix entry and return paths.**
   - Cancel buttons use browser Back, which leaves the app on a shared or bookmarked link.
   - Sign-in always lands on Schedule instead of the link you opened (found in the code, not tested in the browser).
   - Clinicians have to re-pick their own Schedule filter each time.

I kept the README's deliberate choices: Today stays separate, check-in steps keep adding history entries, and the cancel dialog stays non-addressable.

The pilot's in-memory store means any refresh drops check-ins and status changes. Booking and rescheduling only show a toast and don't save anything (code only, not tested because I blocked saves). Both need real saving before the structural work.

The report also covers the migration path, redirects for the old URLs, and open questions. One is whether the Schedule filter can default to "me", since the session user is hard-coded today.

The probes only read and clicked through the app: nothing was saved, and the note drafts I typed stayed in browser memory.

## File: summary.md

# Journey probe results

Base URL: http://localhost:5700

## CL1 draft carries across patients

1. goto /notes/p-101 -> `/notes/p-101` | title "Visit notes · Kestrel" | h1 "Visit notes · Ana Ruiz" | current nav [] | focus body
2. fill textarea -> `/notes/p-101` | title "Visit notes · Kestrel" | h1 "Visit notes · Ana Ruiz" | current nav [] | focus textarea "Visit note for Ana"
3. select select[aria-label='Switch patient'] -> `/notes/p-102` | title "Visit notes · Kestrel" | h1 "Visit notes · Ben Okoro" | current nav [] | focus body
4. snapshot patient 102 sees draft? -> `/notes/p-102` | title "Visit notes · Kestrel" | h1 "Visit notes · Ben Okoro" | current nav [] | focus body

No continuity drift detected.

**Orientation signals**

- /notes/p-101 marks no navigation item as current (aria-current).
- /notes/p-102 marks no navigation item as current (aria-current).
- document.title is "Visit notes · Kestrel" on 2 different URLs: /notes/p-101, /notes/p-102.

## CL2 draft on reload

1. goto /notes/p-101 -> `/notes/p-101` | title "Visit notes · Kestrel" | h1 "Visit notes · Ana Ruiz" | current nav [] | focus body
2. fill textarea -> `/notes/p-101` | title "Visit notes · Kestrel" | h1 "Visit notes · Ana Ruiz" | current nav [] | focus textarea "Visit note for Ana"
3. reload true -> `/notes/p-101` | title "Visit notes · Kestrel" | h1 "Visit notes · Ana Ruiz" | current nav [] | focus body

**Continuity drift**

- step 3, reload-not-restored
  - inputs: expected {"Visit note for Ana":"draft text","Switch patient":"p-101"}, got {"Visit note for Ana":"","Switch patient":"p-101"}

**Orientation signals**

- /notes/p-101 marks no navigation item as current (aria-current).

## CL3 draft survives leaving notes?

1. goto /notes/p-101 -> `/notes/p-101` | title "Visit notes · Kestrel" | h1 "Visit notes · Ana Ruiz" | current nav [] | focus body
2. fill textarea -> `/notes/p-101` | title "Visit notes · Kestrel" | h1 "Visit notes · Ana Ruiz" | current nav [] | focus textarea "Visit note for Ana"
3. click role=link[name='Schedule'] -> `/schedule` | title "Schedule · Kestrel" | h1 "Schedule" | current nav [Schedule] | tab [Day] | focus a "Schedule"
4. back true -> `/notes/p-101` | title "Visit notes · Kestrel" | h1 "Visit notes · Ana Ruiz" | current nav [] | focus a "Schedule"

**Continuity drift**

- step 4, back-not-restored
  - inputs: expected {"Visit note for Ana":"draft text","Switch patient":"p-101"}, got {"Visit note for Ana":"","Switch patient":"p-101"}

**Orientation signals**

- /notes/p-101 marks no navigation item as current (aria-current).

## CL4 schedule filter lost via nav

1. goto /schedule?clinician=c-okafor -> `/schedule?clinician=c-okafor` | title "Schedule · Kestrel" | h1 "Schedule" | current nav [Schedule] | tab [Day] | focus body
2. click .appt-block -> `/schedule?clinician=c-okafor` | title "Schedule · Kestrel" | h1 "Schedule" | current nav [Schedule] | tab [Day] | open [Appointment] | focus aside "Appointment"
3. click text=Open appointment -> `/schedule/appointments/a-500` | title "Appointment · Kestrel" | h1 "Blood pressure recheck" | current nav [] | focus body
4. click text=← Schedule -> `/schedule?date=2026-11-06` | title "Schedule · Kestrel" | h1 "Schedule" | current nav [Schedule] | tab [Day] | focus body
5. click role=link[name='Schedule'] -> `/schedule` | title "Schedule · Kestrel" | h1 "Schedule" | current nav [Schedule] | tab [Day] | focus a "Schedule"

No continuity drift detected.

**Orientation signals**

- /schedule/appointments/a-500 marks no navigation item as current (aria-current).
- document.title is "Schedule · Kestrel" on 3 different URLs: /schedule?clinician=c-okafor, /schedule?date=2026-11-06, /schedule.



## File: summary.md

# Journey probe results

Base URL: http://localhost:5700

## FD1 list search, drill in, Back

1. goto /patients -> `/patients` | title "Patients · Kestrel" | h1 "Patients" | current nav [Patients] | focus body
2. fill input[type=search] -> `/patients` | title "Patients · Kestrel" | h1 "Patients" | current nav [Patients] | focus input "Search patients"
3. click a.row-link -> `/patients/p-113` | title "Patient · Kestrel" | h1 "Mei Chen" | current nav [] | tab [Details] | focus body
4. back true -> `/patients` | title "Patients · Kestrel" | h1 "Patients" | current nav [Patients] | focus body

**Continuity drift**

- step 4, back-not-restored
  - inputs: expected {"Search patients":"chen","Filter by clinician":"all"}, got {"Search patients":"","Filter by clinician":"all"}

**Orientation signals**

- /patients/p-113 marks no navigation item as current (aria-current).

## FD2 patient tab, refresh, cold open

1. goto /patients/p-101 -> `/patients/p-101` | title "Patient · Kestrel" | h1 "Ana Ruiz" | current nav [] | tab [Details] | focus body
2. click role=tab[name='Contacts'] -> `/patients/p-101` | title "Patient · Kestrel" | h1 "Ana Ruiz" | current nav [] | tab [Contacts] | focus button "Contacts"
3. reload true -> `/patients/p-101` | title "Patient · Kestrel" | h1 "Ana Ruiz" | current nav [] | tab [Details] | focus body
4. snapshot after reload -> `/patients/p-101` | title "Patient · Kestrel" | h1 "Ana Ruiz" | current nav [] | tab [Details] | focus body

**Continuity drift**

- step 3, reload-not-restored
  - selectedTabs: expected ["Contacts"], got ["Details"]

**Orientation signals**

- /patients/p-101 marks no navigation item as current (aria-current).

## FD3 nav orientation on detail pages

1. goto /insurance/p-103 -> `/insurance/p-103` | title "Insurance · Kestrel" | h1 "Insurance · Chloe Park" | current nav [] | focus body
2. goto /schedule/appointments/a-505 -> `/schedule/appointments/a-505` | title "Appointment · Kestrel" | h1 "Diabetes check" | current nav [] | focus body
3. goto /today/a-505/insurance -> `/today/a-505/insurance` | title "Check-in · Kestrel" | h1 "" | current nav [] | focus body
4. goto /schedule/week -> `/schedule/week` | title "Week · Kestrel" | h1 "Schedule" | current nav [] | tab [Week] | focus body
5. goto /insurance/payers -> `/insurance/payers` | title "Payers · Kestrel" | h1 "Payers" | current nav [] | focus body

No continuity drift detected.

**Orientation signals**

- /insurance/p-103 marks no navigation item as current (aria-current).
- /schedule/appointments/a-505 marks no navigation item as current (aria-current).
- /today/a-505/insurance has no h1 (main heading).
- /today/a-505/insurance marks no navigation item as current (aria-current).
- /schedule/week marks no navigation item as current (aria-current).
- /insurance/payers marks no navigation item as current (aria-current).

## FD4 schedule drawer and Back

1. goto /schedule -> `/schedule` | title "Schedule · Kestrel" | h1 "Schedule" | current nav [Schedule] | tab [Day] | focus body
2. click .appt-block -> `/schedule` | title "Schedule · Kestrel" | h1 "Schedule" | current nav [Schedule] | tab [Day] | open [Appointment] | focus aside "Appointment"
3. back true -> `about:blank`

**Continuity drift**

- step 3, left-app: back took the user out of the app (now at about:blank).
- step 3, back-with-overlay: Back navigated away from /schedule while an overlay was open (Appointment). Users usually expect Back to close it.

## FD5 intake row is a link?

1. goto /intake -> `/intake` | title "Intake forms · Kestrel" | h1 "Intake forms" | current nav [Intake forms] | focus body
2. openInNewTab tbody tr -> `/intake` | title "Intake forms · Kestrel" | h1 "Intake forms" | current nav [Intake forms] | focus body
   - Target is not a real link: middle-click and Cmd/Ctrl-click cannot open it in a new tab.

No continuity drift detected.

## FD6 cancel after deep link leaves app

1. goto /patients/new -> `/patients/new` | title "Add patient · Kestrel" | h1 "Add patient" | current nav [] | focus body
2. coldOpen true -> `/patients/new` | title "Add patient · Kestrel" | h1 "Add patient" | current nav [] | focus body
3. click text=Cancel -> `about:blank`

**Continuity drift**

- step 3, left-app: Clicking text=Cancel took the user out of the app (now at about:blank).

**Orientation signals**

- /patients/new marks no navigation item as current (aria-current).

## FD7 narrow viewport reach Waitlist

1. viewport {"width":390,"height":844} -> `about:blank`
2. goto /today -> `/today` | title "Today · Kestrel" | h1 "Today" | current nav [] | focus body
3. click button:has-text('More') -> `/today` | title "Today · Kestrel" | h1 "Today" | current nav [] | open [More destinations] | focus button "More"
4. snapshot more sheet -> `/today` | title "Today · Kestrel" | h1 "Today" | current nav [] | open [More destinations] | focus button "More"

No continuity drift detected.

**Orientation signals**

- /today marks no navigation item as current (aria-current).

## FD8 tablet width

1. viewport {"width":1024,"height":700} -> `about:blank`
2. goto /today -> `/today` | title "Today · Kestrel" | h1 "Today" | current nav [Today] | focus body
3. snapshot tablet today -> `/today` | title "Today · Kestrel" | h1 "Today" | current nav [Today] | focus body
4. goto /today/a-505/arrived -> `/today/a-505/arrived` | title "Check-in · Kestrel" | h1 "" | current nav [] | focus body
5. snapshot tablet checkin -> `/today/a-505/arrived` | title "Check-in · Kestrel" | h1 "" | current nav [] | focus body

No continuity drift detected.

**Orientation signals**

- /today/a-505/arrived has no h1 (main heading).
- /today/a-505/arrived marks no navigation item as current (aria-current).

## FD9 check-in step Back

1. goto /today -> `/today` | title "Today · Kestrel" | h1 "Today" | current nav [Today] | focus body
2. click text=Check in >> nth=0 -> `/today/a-505/arrived` | title "Check-in · Kestrel" | h1 "" | current nav [] | focus body
3. click text=Next: Insurance -> `/today/a-505/insurance` | title "Check-in · Kestrel" | h1 "" | current nav [] | focus body
4. click text=Next: Forms -> `/today/a-505/forms` | title "Check-in · Kestrel" | h1 "" | current nav [] | focus body
5. back true -> `/today/a-505/insurance` | title "Check-in · Kestrel" | h1 "" | current nav [] | focus body
6. back true -> `/today/a-505/arrived` | title "Check-in · Kestrel" | h1 "" | current nav [] | focus body

No continuity drift detected.

**Orientation signals**

- /today/a-505/arrived has no h1 (main heading).
- /today/a-505/arrived marks no navigation item as current (aria-current).
- /today/a-505/insurance has no h1 (main heading).
- /today/a-505/insurance marks no navigation item as current (aria-current).
- /today/a-505/forms has no h1 (main heading).
- /today/a-505/forms marks no navigation item as current (aria-current).
- document.title is "Check-in · Kestrel" on 3 different URLs: /today/a-505/arrived, /today/a-505/insurance, /today/a-505/forms.

## FD10 deep link wall

1. goto /insurance/p-103?x=1 -> `/insurance/p-103?x=1` | title "Insurance · Kestrel" | h1 "Insurance · Chloe Park" | current nav [] | focus body
2. coldOpen true -> `/insurance/p-103?x=1` | title "Insurance · Kestrel" | h1 "Insurance · Chloe Park" | current nav [] | focus body

No continuity drift detected.

**Orientation signals**

- /insurance/p-103?x=1 marks no navigation item as current (aria-current).



## File: report.md

# Experience architecture review: Kestrel

2026-11-06 · Scope: every staff surface (Today and check-in, Schedule, Patients, Intake, Insurance, Visit notes, Waitlist, Messages, Settings, Help) plus login and the `/board` kiosk (code only) · Evidence: dev copy at http://localhost:5700 driven with Playwright as front desk and as clinician, plus a read of all of `src/` · Commit `969f2b4`

No application code was changed. Probing was read-only (`blockMutations: true`). The only things written are in `xa-review/`.

## Summary

Nothing is broken, and the server is not slow: pages answer in 10–20 ms. The slowness staff feel is a navigation cost. Everything the desk asks about one patient lives in four separate sections, each with its own copy of the same patient list, and each list forgets your search the moment you leave it. Almost all view state (tabs, search, filters, the schedule drawer) lives in component memory, so Back and refresh throw it away. The sidebar highlights only exact top-level paths, so on any detail page nothing is highlighted and people lose their place.

One finding is more serious than "annoying": the visit-note draft is a single shared buffer, so switching from one patient to the next carries the first patient's draft into the second patient's note, ready to sign.

Top recommendations, in priority order:

1. **Fix the note draft now** (C1). Key it to the patient, persist it, warn before leaving. Safe under any end state.
2. **Make a patient one place** (A1). Patient page with Overview / Appointments / Intake / Insurance / Notes as routed sections. Intake and Insurance remain as work queues. This overturns ADR 0001, whose premise ended with the spring 2026 cutover.
3. **Put view state in the URL** (B1): patient section, list search and filters, intake Open/All, and the schedule drawer (`?appt=`), so Back closes the drawer instead of leaving Schedule.
4. **Derive the sidebar and mobile nav from one route-prefix definition** (D1). Fixes "nothing highlighted" on 5 of 6 families of detail pages and the Waitlist that is unreachable on a phone.
5. **Fix entry and return paths** (E1): sign-in returns to the requested URL, Cancel buttons link to a parent instead of `history.back()`, clinicians get their own Schedule filter by default.

Constraints from the README respected throughout: Today stays its own screen, check-in steps keep pushing history, and the cancel/no-show dialog stays non-addressable.

## Current architecture

### Route and surface map

```
/login                                  public; always lands on /schedule afterwards
/                                       redirect: clinician -> /schedule, front desk -> /today
/board                                  kiosk, no chrome (ADR 0002); linked only from Settings
(staff shell: topbar + sidebar + mobile tabs + ClinicStore)
/today                                  grouped list; no row links except "Check in"
  /today/[apptId]  -> redirect /arrived
  /today/[apptId]/[arrived|insurance|forms|ready]   routed steps, history pushed
/schedule ?date ?clinician              day grid; row click opens in-memory Drawer (no URL)
  /schedule/week ?date ?clinician
  /schedule/new ?patient ?clinician ?date
  /schedule/appointments/[id]           cancel / no-show dialog (not addressable, by design)
    /reschedule
/patients                               list; search + clinician filter in memory
  /patients/new, /patients/[id] (tabs in memory), /patients/[id]/edit
/intake                                 queue; Open/All in memory; rows are <tr onClick>
  /intake/[patientId], /intake/templates
/insurance                              same PatientListTable as /patients + status filter
  /insurance/[patientId], /insurance/payers
/notes                                  clinician-only layout guard (ADR 0002)
  /notes/[patientId]                    editor + history; draft in layout context
  /notes/[patientId]/[visitId]
/waitlist, /messages, /messages/[threadId], /settings(+/clinicians,/rooms), /help
```

Not reachable from navigation: `/board` (Settings link only, and no way back by design), `/intake/templates`, `/insurance/payers`, `/settings/*` (one level down), and **`/waitlist` on narrow screens** (D2).

### Chrome and navigation dependencies

| Element | Reads | Behaviour |
|---|---|---|
| Sidebar (`Sidebar.tsx:13`) | `usePathname()`, `pathname === item.href` | Exact match only. Highlights nothing on any child route. |
| Mobile tabs (`MobileNav.tsx:35`) | `pathname.startsWith(href)` | Different rule from the sidebar. No `aria-current`. "More" never shows active when you are on a More destination. Waitlist is in neither `PRIMARY` nor `MORE` (`MobileNav.tsx:9-10`). |
| Back link (`PageHeader`) | explicit `href` | Good: logical parents. Loses query state (appointment page goes to `?date=` only, dropping `clinician`). |
| Cancel buttons (`PatientForm.tsx:442`, `SlotPicker.tsx:947`) | `router.back()` | Leaves the app when the page was opened cold. |
| Sign-out, role switch, Board link | Settings only | Sign-out is two taps deep. |
| Unread badge | server layout, `threads.filter(unread)` | Computed per request; nothing marks a thread read. |

### State ownership

| State | Lives in | Should live in | Back / refresh / shared link |
|---|---|---|---|
| Schedule date, clinician | URL query | URL (correct, per README) | yes / yes / yes |
| Schedule drawer selection | `useState` in `ScheduleBoard.tsx:718` | URL `?appt=` | no / no / no |
| Patient tab | `useState` in `PatientRecord.tsx:107` | path segment | no / no / no |
| Patient list search, status and clinician filters | `useState` in `PatientListTable.tsx:241-243` (used by Patients, Insurance, Notes) | URL query | no / no / no |
| Intake Open/All | `useState` `IntakeQueue.tsx:803` | URL query | no / no / no |
| Note draft | one `useState` in `NoteDraftProvider` mounted in `notes/layout.tsx` | per patient, persisted | shared across patients / lost / lost |
| Appointment, intake, eligibility changes | in-memory `ClinicStore` in the staff layout | server (pilot artifact, see below) | lost on refresh |
| Check-in step | path | path (correct, per README) | yes / yes / yes |

## Findings

### C1 One note draft shared by every patient (Severe; Continuity, wrong-entity)
- **Observed:** probe CL1. As clinician, type a draft on `/notes/p-101` (Ana Ruiz), use "Switch patient" to `/notes/p-102` (Ben Okoro). Ben's textarea contains Ana's text, and "Sign note" is enabled. CL2: reload loses the draft with no warning. CL3: leave to Schedule and press Back and the draft is gone, because the provider unmounts.
- **Implementation:** `NoteDraft.tsx:15` holds one string; `notes/layout.tsx:16` wraps all patients in it; `NoteEditor.tsx:1004-1009` signs `draft` against whatever `patientId` is on screen. The README says clinicians write the note in the exam room and then "click through to the next patient", which is exactly this path (the "Next:" button and the switcher).
- **Symptoms:** a note can be signed on the wrong patient; an unsigned note is silently lost on refresh, Back or nav.
- **Root cause:** draft state is owned by the layout, not by the patient it belongs to, and nothing persists or guards it.

### A1 One patient, four sections, four copies of the same list (Major; Structure)
- **Observed (code and probe FD1, FD3):** a patient's picture is split across `/patients/[id]`, `/intake/[id]`, `/insurance/[id]` and `/notes/[id]`. Each section opens with the same `PatientListTable` (Patients, Insurance, Notes all use it; Intake has a near copy). Answering the desk's own example question, "is Mr. Okoro ready to be seen?", means: Intake, search "okoro", open; back (search is gone, FD1); Insurance, search "okoro" again, open. Today shows Forms and Insurance as red/green chips but they are not links, so the desk can see a problem and cannot go to it. The same patient has cross-links in five places (`PatientRecord.tsx:195`, appointment page, schedule drawer, and the "→" footers on intake and insurance), which is the symptom of a missing hub.
- **Root cause:** ADR 0001 (2024) split sections by source system because three vendor feeds failed independently. The README states that since the spring 2026 cutover all three are Kestrel's own data and the PaperTrail and ClaimBridge feeds are off. The structure still mirrors systems that no longer exist. ADR 0001 itself says "Revisit if the clinic consolidates these systems."
- **Symptoms:** slow lookups, repeated searches, "where was that?" The two real jobs (chase missing forms, chase failed eligibility) are queue jobs, and those queues are the part worth keeping.

### B1 View state is component memory, not URL (Major; Continuity)
- **Observed:** FD1: search "chen", open Mei Chen, Back: search box empty. FD2: choose Contacts tab, reload: back on Details; the tab cannot be shared. FD4: open an appointment in the Schedule drawer, press Back: leaves Schedule entirely (to `about:blank` in the probe) with the drawer open. The README's own rule is that Schedule date and clinician belong in the address bar; the drawer and every other view state do not follow it.
- **Implementation:** see the state table. The drawer is `ScheduleBoard.tsx:718`; tabs `PatientRecord.tsx:107`; filters `PatientListTable.tsx:241`.
- **Root cause:** one convention (URL for Schedule) was not extended to the rest.

### D1 Sidebar current-state uses exact path match (Major; Orientation)
- **Observed:** FD3 and every detail probe: `/insurance/p-103`, `/schedule/appointments/a-505`, `/schedule/week`, `/insurance/payers`, `/patients/p-113`, `/notes/p-101`, `/today/a-505/*` all report no current nav item. Check-in pages also have no `h1` (patient name is an `h2`), and three check-in URLs share the title "Check-in". Detail pages share one title ("Patient", "Appointment", "Message") regardless of who. `/schedule/week` has `<h1>Schedule</h1>` and title "Week".
- **Implementation:** `Sidebar.tsx:13` (`pathname === item.href`).
- **Root cause:** chrome matches strings instead of route families, and the mobile bar uses a different rule (`startsWith`), so the two navs disagree.

### D2 Waitlist unreachable on phone-width screens (Major; Structure/Dependency)
- **Observed:** FD7 at 390 px: tabs are Today, Schedule, Patients, Messages, More; More lists Intake, Insurance, Settings, Help. No Waitlist. At 1024 px the sidebar shows it (FD8).
- **Implementation:** `MobileNav.tsx:9-10` hard-codes two id lists that omit `/waitlist`, a second copy of the nav in `nav.ts`.

### E1 Entry and return paths lose where you were (Major; Dependency)
- **Observed, FD6:** opening `/patients/new` cold and pressing Cancel leaves the app. `PatientForm.tsx:442` and `SlotPicker.tsx:947` use `router.back()` as an "up" control.
- **Code-only (confirm by signing in from a deep link):** `middleware.ts:16-18` redirects to `/login` and drops both path and query; `login/page.tsx:25` then always goes to `/schedule`, even for front desk, whose home (`app/page.tsx`) is `/today`. A shared link to `/insurance/p-103` lands on Schedule after sign-in.
- **Observed, CL4:** clinician filters to themselves, opens an appointment, uses "← Schedule": URL is `/schedule?date=…` without the clinician. The sidebar "Schedule" link also resets to no date and no clinician. The README says clinicians work from Schedule filtered to themselves; nothing remembers that, and the session knows the user name (`session.ts`).

### Minor
- Intake rows are `<tr onClick={router.push}>` (`IntakeQueue.tsx:834`): no middle-click or new tab (FD5), not keyboard-focusable.
- Check-in "Finish" is available from any step and "Details confirmed" does not gate anything; Finish pushes `/today` so Back returns to the Ready step. Confirm with the desk whether the steps are meant to be mandatory.
- Appointment status moves forward from three places (drawer, appointment page "Mark arrived", Today check-in) with different subsets of statuses.
- Booking and rescheduling only toast (`SlotPicker.tsx:890-895`); they never write to the store, so a booked appointment does not appear on Schedule (code-only, not exercised because mutations were blocked).

**Pilot artifact, flagged so it is not mistaken for a design choice:** all edits live in `ClinicStore` memory (README says so). A refresh, a second tab, or the tablet app being restarted drops every check-in and status change, and a patient added in this session shows "Loading patient…" forever after refresh (`PatientRecord.tsx:110`). That is acceptable for a demo but must be replaced by server writes before the structural work, because several fixes below assume state survives reload.

## Problem interaction sequences

**1. Wrong-patient draft (clinician).**
1. Dr. Okafor finishes Ana Ruiz's visit and types a note on `/notes/p-101`.
2. She taps "Next: Ben Okoro" (or the switcher) before signing.
3. Ben's page opens with Ana's text in the box, "Sign note" enabled, and a muted "Draft not saved".
4. One tap signs it to Ben.

**2. "Is Mr. Okoro ready?" (front desk).**
1. Today shows Insurance green, Forms red for him; neither chip is tappable.
2. Intake > type "okoro" > open row > see form is Sent > Mark complete or remind.
3. Back: list is reset. Insurance > type "okoro" again > open.
4. Patient demographics are a third place; clinician notes, a fourth, hidden. Eight or more taps and two repeated searches for one patient.

**3. Drawer and Back (clinician).**
1. Schedule, filtered to Okafor; tap an appointment; drawer opens, URL unchanged.
2. Press Back to close it: leaves Schedule to the previous page instead.
3. Re-enter via Schedule in the sidebar: clinician filter and date are gone.

**4. Shared link.**
1. A colleague sends `/insurance/p-103`. Signed-out: redirected to `/login`, then dropped on Schedule with no memory of the link.
2. Signed in: page opens with no nav item highlighted, and "Cancel"-type buttons use history.

## Proposed architecture

### Route and surface map (proposed)

```
/patients                                  list; ?q ?clinician in URL           (changed)
/patients/[id]                             Overview: next visit, forms, insurance,
                                           contact; the "ready?" answer         (changed)
/patients/[id]/appointments                (was a tab)                          (added)
/patients/[id]/intake                      (moved from /intake/[id])            (moved)
/patients/[id]/insurance                   (moved from /insurance/[id])         (moved)
/patients/[id]/notes[/visitId]             clinician only, enforced here        (moved)
/patients/[id]/edit                        unchanged
/intake      ?show=open|all                work queue; rows are real links to /patients/[id]/intake
/insurance   ?status=...                   work queue (failed / pending first)
/notes                                     clinician "my patients today" queue; no all-patient list
/schedule    ?date ?clinician ?appt=       drawer addressable; clinician default = self
/today ...                                 unchanged; chips link to the patient sections
```

Retired top-level detail routes redirect permanently:
`/intake/:id` to `/patients/:id/intake`, `/insurance/:id` to `/patients/:id/insurance`, `/notes/:id` and `/notes/:id/:visitId` to `/patients/:id/notes` and `…/notes/:visitId`.

### Navigation and chrome (proposed)
- One `NAV_ITEMS` definition with a `match` prefix list per item (`/patients/*` matches Patients; `/schedule/*` matches Schedule; `/today/*` matches Today). Sidebar and mobile bar both render from it and both set `aria-current`.
- Mobile: Today, Schedule, Patients, Messages, More, where More is generated as "everything not primary" so a new item cannot go missing.
- Patient header (name, MRN, DOB, flags) and the section tabs are one component shared by all `/patients/[id]/*` routes, so every patient surface shows the same orientation.
- Detail page titles and h1 carry the entity ("Ben Okoro · Insurance"); check-in gets an h1.
- Move Sign out into the topbar user chip.

### Decisions overturned
- **ADR 0001 (sections by source system).** Rationale: independent vendor feeds with their own staleness and failure modes. No longer holds: the README says intake, coverage and notes are now Kestrel's own data since the spring 2026 cutover, and the ADR itself says to revisit on consolidation. Cost today: the cross-section hopping in sequence 2. Replacement: one patient hub with sections; the only genuinely independent freshness signal left is the eligibility "Last checked" date, which stays visible on the Insurance section and queue.
- Nothing in the README's "on purpose" list is overturned.

### Safeguards preserved
- **ADR 0002 (clinician-only notes).** The role check moves with the route: a `/patients/[id]/notes` layout performs the same server-side `getRole()` refusal that `notes/layout.tsx` does now. The Notes tab and any note text or visit history are omitted from Overview and other sections for front desk. Redirects from old `/notes/*` land on the same refusal. Needs a privacy-officer review, as ADR 0002 requires for anything that touches a combined patient view.
- **`/board`** is untouched: still separate, no links.
- **Cancel / no-show confirmation** stays a non-addressable dialog; no change.
- **Note drafts** gain a leave warning; sign still requires an explicit action on the matching patient.
- **Auth:** return-to after login must accept relative paths only (reject absolute URLs) to avoid an open redirect.

## Page-level recommendations

| Surface | Rec | Detail | Findings |
|---|---|---|---|
| Visit notes editor | change | Draft keyed by `patientId` in sessionStorage (server later); show whose note it is; warn on leave; disable Sign unless the draft belongs to this patient | C1 |
| Patient record | change/merge | Routed sections (above); absorbs intake, insurance, notes detail | A1, B1 |
| `/intake`, `/insurance` | change | Keep as queues; default to "needs attention"; filters in URL; rows are `<Link>` | A1, B1, minor |
| `/notes` | change | Clinician's patients for today instead of a second all-patients list | A1 |
| Schedule drawer | change | `?appt=ID`, push on open, Back/Esc closes, include Reschedule/Cancel links so the drawer stops being a partial copy of the appointment page | B1, minor |
| Schedule nav and clinician default | change | Clinician accounts default `?clinician=` to self (URL wins); sidebar Schedule keeps last date for the session only; appointment back-link carries `clinician` | E1 |
| Sidebar and mobile nav | change | One definition, prefix match, `aria-current`, Waitlist reachable | D1, D2 |
| Login and middleware | change | `?next=` round trip (relative only); front desk default to `/today` | E1 |
| Cancel buttons | change | `<Link>` to explicit parent (`/patients`, `/patients/[id]`, appointment page) | E1 |
| Today | keep, add | Keep separate and tablet-first. Make the Insurance and Forms chips link to the patient's sections; add a "Patient" link | A1 |
| Waitlist | keep for now | Candidate to fold into Schedule later; see open questions | — |
| Settings | change | Surface Sign out in the topbar; Board link stays | minor |

## Tradeoffs and alternatives considered

- **Patient hub vs. keep four sections and add cross-links or a patient switcher.** Cross-links already exist in five places and the hopping persists, so I rejected more of the same. Cost of the hub: moving routes, redirects, and a privacy review for notes. Benefit: one list, one search, one header.
- **Patient sections as tabs in the URL (chosen) vs. one long page.** One page would put intake answers and notes in front of front desk by default and makes the ADR 0002 boundary harder to reason about. Separate routes let the notes guard stay a single layout check.
- **Drawer as `?appt=` (chosen) vs. a routed page for every appointment.** A query param keeps the glance-and-act behaviour on the grid and makes Back close it; the existing appointment page remains the full view.
- **Persisting tab/filter in localStorage vs. URL.** localStorage leaks across tabs and cannot be shared; the URL fixes Back, refresh and sharing together.
- **Merging Today into Schedule.** Rejected; the README documents why (tablet-first, the 2025 "tablet mode" failure). Today only gains links.

Costs accepted: URL migration for intake, insurance and notes (redirects cover bookmarks and any texts or emails already sent), retraining the desk on where Intake and Insurance detail now live, and analytics page-view remapping.

## Migration path

**Phase 0 (safe under any end state, ship first).**
- C1 note draft fix; E1 `router.back()` Cancel buttons; `?next=` and front-desk home; intake rows to links; check-in h1 and distinct titles; sidebar prefix match and mobile Waitlist (D1, D2).
- Replace `ClinicStore` memory with server writes (prerequisite for trusting any refresh).
- Verify with probes CL1–CL3, FD3, FD5, FD6, FD7, FD10.

**Phase 1 (URL state, no route moves).** Filters and Open/All to query; drawer `?appt=`; clinician default filter; carry `clinician` on back-links. Verify FD1, FD4, CL4.

**Phase 2 (patient hub).** Add `/patients/[id]/{appointments,intake,insurance,notes}` behind a flag; role guard on notes; Overview with readiness; Today chip links. Then switch nav links, enable 308 redirects from the old detail URLs, keep `/intake` and `/insurance` queues. Map analytics events old to new. Verify FD1–FD3, FD9 and re-run the role checks as front desk against every `/notes` path.

**Phase 3 (optional).** Fold Waitlist into Schedule; make `/notes` the clinician's day queue.

Keep `probes-frontdesk.json` and `probes-clinician.json` as regression checks; update expected URLs after Phase 2.

## Open questions

1. Do clinicians have a stable identity in the session so "default to me" can work (today the name is hard-coded in `session.ts`)?
2. Should check-in steps be mandatory (gate Finish on confirmed details and insurance)? Ask the desk.
3. Should Waitlist stay top-level? It has 17 lines of page and no link to booking; its cancel-offer flow is described in the cancel dialog but lives elsewhere.
4. Privacy officer sign-off on notes living under `/patients/[id]/` (ADR 0002 requires it).
5. Observations that would change the plan: if staff say the four-section structure is actually how they think about the work, run Phase 0 and 1 only. Not observed: the booking write path, sign-in return behaviour (code-only), and how many desk users work on the tablet versus a desktop.

## Appendix
- Probe specs: `xa-review/probes-frontdesk.json`, `xa-review/probes-clinician.json` (storage states `auth-fd.json`, `auth-cl.json` set the demo cookies)
- Output and screenshots: `xa-review/probe-output-frontdesk/`, `xa-review/probe-output-clinician/` (`summary.md`, `results.json`, `screenshots/`)
- Evidence key: FD1 list drill-in, FD2 tab refresh, FD3 nav orientation, FD4 drawer Back, FD5 new tab, FD6 Cancel deep link, FD7 narrow viewport, FD8 tablet, FD9 check-in Back (passed, matches README), FD10 deep link; CL1 draft across patients, CL2 draft reload, CL3 draft on leaving, CL4 schedule filter
- State changed in the environment: none (mutations blocked; no edits, bookings or notes saved). Some probes typed into the note textarea; those drafts were in browser memory only.

