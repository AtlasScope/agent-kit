# ADR 0003: Shipment and carrier record tabs are routes and push history

Status: accepted (2025-06)

## Context

We prototyped shipment tabs (Summary, Tracking, Documents, Charges, Activity) as `router.replace`
updates so that Back would leave the record in one step. In ride-alongs with dispatchers at two
customers, the most common sequence was: open Tracking, jump to Documents to read the BOL, press Back
to return to Tracking. With replace, Back threw them out to the list and they lost their place.

## Decision

Each record tab is its own route segment (`/shipments/<id>/tracking`, `/documents`, ...) and tab
links push a history entry. Back steps through the tabs the person visited. Tab links pass
`scroll={false}` so the record header stays put.

## Consequences

- Several Back presses may be needed to leave a record after visiting many tabs. Dispatchers told us
  that is what they expect; the breadcrumb and the sidebar are the fast way out.
- Every tab is deep-linkable and survives refresh.
