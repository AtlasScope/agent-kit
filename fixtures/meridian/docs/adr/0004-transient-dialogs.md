# ADR 0004: Transient action dialogs stay out of the URL

Status: accepted (2025-09)

## Context

Some dialogs show a record (the exception quick view) and some only collect a single action, such as
**Assign** on the shipment list, which tenders a load to a different carrier.

## Decision

Dialogs that present a record are routes, so they can be linked and reopened. Dialogs that perform a
one-step action are plain client state: they are not given a URL, they do not add a history entry,
and a refresh simply closes them. Nobody shares a link to a half-filled tender form, and reopening one
from history after the load was already tendered caused duplicate tenders in v1.

## Consequences

- Back while the Assign dialog is open leaves the shipment list, same as without the dialog. Escape,
  Cancel or a click outside closes it.
