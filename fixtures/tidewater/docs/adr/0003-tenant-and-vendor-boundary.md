# 0003. Tenants and vendors never see the staff app

Date: 2023-09-11
Status: Accepted

## Context

Tenants keep asking "when is someone coming?" and vendors want to see job details. Both groups already have their own channel: tenants receive SMS and email from Tenant Comms, and vendors use their own portal, which we sync with.

Staff screens show things neither group may see: other tenants' names and units, access notes and entry codes, vendor quotes and invoice amounts, supervisor decisions, and staff names. Showing a tenant another unit's details is a privacy breach under our lease terms, and quotes are commercially confidential under the vendor agreements.

## Decision

- The tenant status page (`/status/:token`) is a separate surface. It renders outside the staff layout, has no staff navigation, is reached only with a per-request token (never a REQ number), and shows only: summary, building and unit, reported date, stage, the dated history of visits and progress, and whether someone must be home.
- It repeats the stage and visit history that staff see so tenants can check for themselves instead of calling. That repetition is the point of the page.
- Vendors get nothing from Tidewater directly. They see what the portal shows them.
- Any new field on a tenant or vendor surface needs sign-off from the Residential Ops lead and the privacy officer.

## Consequences

Staff and tenant views of the same request will always differ, and changes to the stage model must be made in both places.
