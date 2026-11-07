# 0002. Keep each system's ids; no cross-links between screens

Date: 2023-06-02
Status: Accepted

## Context

During the pilot we joined requests, work orders, portal jobs and invoices using the nightly export from the dispatch spreadsheet. The export was often a day stale and sometimes mapped a portal job to the wrong work order. One vendor was paid twice for the same visit because the invoice screen showed a link to the wrong request.

Each upstream system is the source of truth for its own records and id scheme (REQ, WO, VJ, INV). The only reliable mapping between them is the parent id each system stores itself.

## Decision

Each screen shows its own record ids and the immediate parent id it received from the upstream system, as plain text with a copy button. Screens do not link to records owned by another system and do not show data joined across more than one hop. Staff move between screens by copying the id and searching for it.

## Consequences

Finding everything about one request takes several searches. In exchange, nothing on screen depends on a join we cannot trust.
