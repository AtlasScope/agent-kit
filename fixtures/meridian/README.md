# Meridian

Meridian is the operations platform we build for freight brokers, 3PLs and shippers who run their own
transportation desk. It is where a dispatcher books a load, follows it to delivery, works the exceptions
when it goes wrong, and where finance matches the carrier's invoice to what was actually moved.

This repository is the web app. In this demo build all data is seeded in memory (`src/lib/data.ts`) and
every save changes client state only. Nothing is written anywhere.

## Who uses it

- **Dispatchers** live in Shipments and Exceptions all day. They switch between a handful of loads,
  flip between a shipment's Tracking, Documents and Activity tabs, and post notes for the next shift.
- **Operations managers** watch Overview, Insights and Dashboards, and own the alert rules and lane
  targets for their workspace.
- **Finance / AP** approve and dispute carrier invoices under Invoices.
- **Organization owners** manage members, billing, single sign-on and notification channels for the
  whole company under Organization.

## How it is organized

- `/w/<workspace>/...` is one operating unit (a region, a business line or a customer account). A
  person can belong to several. Everything operational is scoped to the workspace in the URL so links
  pasted into Slack or email open in the right place (see `docs/adr/0001-workspace-in-path.md`).
- `/org/...` is the company level. **All shipments** (`/org/shipments`) intentionally repeats the
  workspace shipment list: it is the only view that shows loads from every workspace at once, which
  account managers and the owner use for cross-region customers. Each row links into its own workspace.
- `/account/...` is the signed-in person: profile, email digests, preferences, security and personal
  API tokens.
- `/inbox` collects alerts from every workspace you belong to.
- `/track/<PRO or reference>` is the link carriers put in their status emails. See `docs/integrations.md`.

Navigation comes in layers: the dark global rail on the left, the workspace sidebar, record tabs on
shipments and carriers, and a command palette on ⌘K / Ctrl+K that searches shipments, carriers and
invoices across all workspaces.

Settings live in three places today: your own (`/account/notifications`, `/account/preferences`), the
workspace's (`/w/<ws>/settings/...`: general, members, alert rules, integrations, lane targets) and
the organization's (`/org/settings/...`: general, notification channels, single sign-on).

## Running it

```bash
npm install
npm run dev -- -p 3100
```

Open http://localhost:3100. You will be sent to `/login`; any password works and signing in sets the
`meridian_session=demo` cookie. To skip the form when scripting, send that cookie yourself:

```bash
curl -b "meridian_session=demo" http://localhost:3100/w/acme/shipments
```

Seed workspaces: `acme` (Acme Freight Midwest), `northwind` (Northwind Logistics), `harbor` (Harbor
Line Imports). Shipment IDs run from `SHP-1001` to `SHP-1078`, round-robin across the three.

Old links from Meridian v1 (`/tracking/<id>`, `/shipments/<id>`, `/settings/profile`, `/dashboard`)
are redirected in `next.config.ts`.

## Decisions

Architecture decision records live in `docs/adr/`. Read them before changing navigation behaviour;
several of our choices come from watching dispatchers work.
