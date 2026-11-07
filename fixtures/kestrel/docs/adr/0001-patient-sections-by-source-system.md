# ADR 0001: Patient information split into sections by source system

- Status: Accepted
- Date: 2024-09-18
- Deciders: Clinic manager, front-desk lead, contractor team

## Context

Kestrel started as a scheduling tool. Patient information beyond demographics came from three outside systems, each synced in on its own timetable:

- **Intake answers** from PaperTrail, the forms vendor, pulled every 30 minutes.
- **Coverage and eligibility** from the ClaimBridge clearinghouse feed, pushed nightly with ad-hoc rechecks.
- **Visit notes** from Halcyon, the old EHR, read-only, mirrored hourly.

Each feed failed in its own way. When ClaimBridge was late, a combined patient page showed half-empty coverage next to fresh intake answers, and staff could not tell which part was stale. Each vendor also had its own support contact and its own definition of "patient" (PaperTrail keyed on phone number, ClaimBridge on member ID).

## Decision

Give each source system its own top-level section (Intake forms, Insurance, Visit notes) with its own patient list, last-sync time and error state. The Patients section holds only what Kestrel itself owns: demographics, contact details and appointments. Pages link across sections by patient ID.

## Consequences

- A broken feed only affects its own section, and the section shows when it last synced.
- Staff move between sections to see one patient's full picture. We accept this while the feeds are separate.
- Revisit if the clinic consolidates these systems.
