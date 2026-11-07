# 0001. One top-level screen per back-office system

Date: 2023-04-18
Status: Accepted

## Context

Tidewater replaces four tools: the call-centre ticket queue, the dispatch spreadsheet, the vendor portal's admin screen and the AP clerk's invoice workbook. Each was used by a different group. The intake desk lived in the ticket queue, the dispatch desk in the spreadsheet, and the AP clerk in the workbook. The vendor portal sync was a manual job the dispatch lead ran each morning and checked for errors.

We want people to move over without retraining, one desk at a time.

## Decision

The top navigation has one item per system it replaces: Intake, Dispatch, Vendor Portal Sync, Billing Export. Each desk lands on the screen that matches the tool it used before, with the same columns and ids. Tenant Comms gets its own item because the SMS gateway has its own sending limits and log.

## Consequences

Each desk sees only its part of a request. Handoffs between desks happen by passing the work order number, as they do today. If the desks change, the navigation should be revisited.
