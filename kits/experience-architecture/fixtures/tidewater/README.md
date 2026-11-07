# Tidewater

Tidewater is the maintenance coordination tool for the east portfolio: Harbor View, Linden Court, Marlowe Flats and Seagrass Terrace, about 640 units in all. It is built and run by the Residential Ops tools team (three of us, plus whoever we can borrow from Finance Systems).

This repository is the front end. In this copy the data is seeded in memory (`src/data/seed.ts`) and nothing is written anywhere, so it is safe to click around.

## Who uses it

Four maintenance coordinators: Priya, Marcus, Dana and Luis. Joan Whitcombe supervises them and signs off on larger spend. Leasing and the building supers do not log in; they call or message a coordinator.

Until the 2025 reorganisation there were two desks. The intake desk took calls and triaged, then handed a work order number to the dispatch desk, who booked vendors, chased them, and passed finished jobs to the AP clerk. That split is gone. Since July 2025 every request has one coordinator from the tenant's first call until the vendor's invoice goes to accounting, and the `coordinator` on a request never changes unless someone is on leave. The AP clerk role was folded in at the same time, so coordinators also release invoices.

## A coordinator's day

A request moves through the same stages every time:

1. **Reported.** The tenant calls the maintenance line, uses the tenant portal or emails the maintenance inbox. A `REQ-` number is created.
2. **Triaged.** The coordinator sets category and priority (emergency within 4 hours, urgent within 48, routine within 7 days) and raises a `WO-` work order.
3. **Vendor scheduled.** The coordinator picks a vendor, enters the quote, and books a date and arrival window. Quotes over $1,500 wait for Joan first.
4. **Work in progress.** Portal vendors update their job (`VJ-` number) in the vendor portal; we pull those updates in every night at 5am. The pull has run on a schedule since mid-2024, so nobody runs or checks it by hand any more. Phone-only vendors call the coordinator.
5. **Work complete.** The coordinator reads the vendor's note and photos and accepts the completion.
6. **Invoiced.** The vendor's `INV-` invoice is released into the 6pm accounts payable export.

At each step the coordinator also keeps the tenant informed: when the request is received, when a visit is booked, when there is a delay, and when the work is done. Tenants get a link to their own status page with every message.

Coordinators work one request at a time. A typical morning is "what needs me today?": requests with a follow-up date of today, vendor jobs reported complete overnight, work orders whose approval came through, emergencies without a vendor, and tenants who have not heard from us since their visit was booked. Most of the team keeps a spreadsheet or a sticky note of REQ and WO numbers for their open requests so they can find them again on each screen.

## Screens

| Nav item | What it shows | Ids you will see |
|---|---|---|
| Intake | Requests not yet booked (reported or triaged), triage form, raise a work order | REQ |
| Dispatch | Work order board by status, schedule a visit | WO, REQ |
| Assign Vendor | Assign a vendor and quote to a work order | WO |
| Vendor Portal Sync | Jobs as reported by vendors in the portal, accept completion | VJ, WO |
| Tenant Comms | Messages to tenants, send an update | REQ |
| Billing Export | Invoices and the nightly AP export | INV, WO |
| Approvals | Spend approvals over $1,500 | WO, REQ |
| Overview (beta) | Open requests list, added in early 2024 | REQ |

The tenant status page (`/status/<token>`) is not in the nav. It is what tenants see from the link in our messages; open one from Tenant Comms to check what a tenant is looking at.

## Data

The dispatch spreadsheet was retired in 2024; work orders, portal jobs and invoices have been held in Tidewater's own store since then, written at the moment they are created rather than joined from an export. Every record in the store knows its parent: a work order has `requestId`, a vendor job and an invoice have `workOrderId`. `src/lib/lookup.ts` has the helpers to walk between them, including `timelineForRequest`, which builds the history shown on the tenant status page.

## Decisions

Architecture decisions are in `docs/adr/`. Read 0003 before changing anything a tenant or vendor can see.

## Running it

```
npm install
npm run dev -- --port 5173
```

`npm run build` type-checks and builds to `dist/`.

Use the "Signed in as" menu in the header to switch between coordinators and Joan. Permissions follow the selected person's role (`src/lib/permissions.ts`).
