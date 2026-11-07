# Integrations

## Carrier tracking links (`/track/<ref>`)

Carriers that integrate over EDI or our carrier API send their own status emails to shippers. Those
emails contain a link of the form `https://<host>/track/<PRO number or customer PO>`. We do not control
those templates and cannot change links that are already in people's mailboxes, so this route must
stay stable.

`src/app/track/[ref]/route.ts` looks the reference up across all workspaces, works out which workspace
owns the shipment, and redirects to `/w/<workspace>/shipments/<id>/tracking`. The route is excluded
from the auth middleware because it reveals nothing by itself; the page it redirects to is protected
as usual, so a signed-out reader goes through `/login` and comes back to the tracking tab.

Examples (seed data): `/track/SHP-1004`, or any PRO number shown on a shipment's Summary tab.

## Search API (`/api/search`)

Used by the command palette. Read-only, session required.
