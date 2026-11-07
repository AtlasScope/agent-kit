# Kestrel

Kestrel is the scheduling and intake app for Kestrel Family Clinic: four clinicians, four exam rooms, a front desk of two (three on Mondays). This repo is the pilot build. Data is seeded in memory and saves only change what your browser session sees, so nothing here touches real patient records.

## Running it

```
npm install
npm run dev -- -p 3000
```

Open `/login` and sign in. Sign-in sets `kestrel_session=demo`; you can also set that cookie yourself. Pick **Front desk** or **Clinician** on the login screen, or switch later in Settings. Some screens look different depending on which one you pick.

## Who uses it and when

**Front desk (Maria, Dev, and Lou on Mondays).** The day starts at 7:45 with the phones. Between calls they work through Intake forms (who still hasn't filled in the pre-visit questionnaire) and Insurance (whose eligibility check failed or hasn't run). From 8:15 patients start arriving and the desk lives on the check-in tablet. Between arrivals they book follow-ups, move appointments, and answer patient messages. Most of their questions are about one patient at a time: "is Mr. Okoro ready to be seen?" means checking his appointment, his form and his insurance.

**Clinicians (Dr. Okafor, Dr. Brandt, Priya Saini NP, Jordan Hale PA).** They look at Schedule filtered to themselves before clinic and between patients, and they write and sign visit notes. Several write the note on a laptop in the exam room straight after the visit, then click through to the next patient.

**The waiting-room TV** runs `/board` full screen.

## Why Today is its own screen

Today looks like it repeats the Schedule, and in data terms it does: the same appointments for the same day. We keep it separate on purpose. The front desk does check-in on a 10-inch tablet propped at the counter, standing up, often while talking to the patient. Schedule is a clinician-by-time grid built for a desk monitor; at tablet width it scrolls sideways and the targets are tiny. Today is one column, grouped by where the patient is (expected, waiting, with clinician, finished), with big buttons and no grid. We tried a "tablet mode" toggle on Schedule in 2025 and the desk turned it off within a week because it reset whenever someone else used the tablet. Please don't fold Today back into Schedule without talking to the desk.

## Check-in on the tablet

The tablet runs Kestrel as a home-screen web app, which hides the browser toolbar. The only way back is the edge-swipe Back gesture. So each check-in step (confirm details, insurance, forms, ready) is its own address under `/today/<appointment>/<step>`, and moving forward adds a history entry. Swiping back goes to the previous step, which is exactly what the desk wants when a patient says "wait, that's my old address". This is deliberate; do not change the steps to replace history.

## Conventions

- **Dates and filters on Schedule live in the address bar** (`?date=`, `?clinician=`) so a clinician can bookmark their own day.
- **Cancel and no-show confirmations are not addressable.** The "Cancel this appointment?" dialog opens over the appointment page without changing the URL. A shared, bookmarked or refreshed link must never land someone on a primed cancel button. Refreshing with the dialog open simply closes it, and that is the intended behaviour.
- **Clinical notes are clinician-only** (see ADR 0002). Front-desk accounts get a "for clinicians" message under Visit notes.
- Times are clinic local time.

## Where things are

| Section | What it holds |
|---|---|
| Today | Check-in for the front-desk tablet |
| Schedule | Day and week views, appointments, booking |
| Patients | Demographics, contact details, appointments |
| Intake forms | Pre-visit questionnaires per patient |
| Insurance | Coverage and eligibility per patient |
| Visit notes | Clinician notes per patient (clinicians only) |
| Waitlist | Patients wanting an earlier slot |
| Messages | Patient and staff messages |

The patient sections follow ADR 0001. Since the spring 2026 cutover, intake answers, coverage and notes are all stored in Kestrel's own database (`src/lib/data.ts` in this pilot) instead of being synced in from PaperTrail, ClaimBridge and Halcyon. The PaperTrail contract ended in April and the ClaimBridge feed was switched off once our own eligibility check went live.

## Old links

Bookmarks from the previous calendar tool (`/calendar`, `/agenda`) still work and end up on Schedule. Old `/patient/<id>` links go to the patient.

## Design decisions

See `docs/adr/`.
