# ADR 0003: Fifteen-minute slot grid

- Status: Accepted
- Date: 2025-02-10
- Deciders: Clinic manager, clinicians

## Context

Appointment lengths at the clinic are 20, 30 or 45 minutes. The old calendar used a 5-minute grid, which made the booking screen long and let people book odd lengths by accident.

## Decision

Booking offers start times on a 15-minute grid between opening and closing. Appointment length comes from the appointment type and is not limited to multiples of 15. A slot is free if the whole appointment fits without overlapping another booking for that clinician.

## Consequences

- Some 20-minute visits leave a 10-minute gap before the next 15-minute start. Clinicians use it for notes.
- The schedule board draws appointments at their real length, so blocks do not always line up with grid lines.
