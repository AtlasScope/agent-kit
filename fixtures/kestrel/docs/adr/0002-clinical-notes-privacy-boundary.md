# ADR 0002: Clinical notes stay behind a clinician-only boundary

- Status: Accepted
- Date: 2024-11-04
- Deciders: Medical director, clinic manager, privacy officer

## Context

Front-desk staff need appointments, contact details, intake status and insurance to do their jobs. They do not need clinical notes, and the clinic's minimum-necessary policy says they should not see them. The waiting room has a TV that shows who is waiting, in full view of other patients.

## Decision

1. Visit-note content and visit history are visible only to clinician accounts. Any screen that shows a patient to a front-desk account omits note text, diagnoses and history. This holds wherever patient information is shown, including any future combined patient view.
2. The waiting-room board (`/board`) shows a ticket number, first name and last initial, and a room when the patient is called. It never shows full names, dates of birth, clinicians, visit reasons or anything from intake or insurance. It is a separate screen from Today and Schedule and has no links or navigation, so nothing can be opened from the TV.
3. Intake answers are visible to front desk (they help patients fill them in), but appear under the patient and never on shared screens.

## Consequences

- The board duplicates part of the day's list with less on it. That is the point.
- Front-desk navigation hides Visit notes; the section itself refuses front-desk accounts.
- Any change that moves notes into a shared view needs a role check at that view, reviewed with the privacy officer.
