# Experience map: fernway-helpdesk

Frameworks: react-router@6.28.0 · State libraries: zustand
Files scanned: 30 · Pages: 18 · Navigation references: 50 · Signals: 11

Signals are candidates found by static analysis. Each needs confirming in code or in the running app before it is reported as a defect.

## Routes

| Path | Kind | File | Inbound | Layouts |
|---|---|---|---|---|
| `/settings` | redirect | src/pages/settings/SettingsArea.tsx:70 |  | 2 |
| `/` | layout-route | src/layouts/AppLayout.tsx | 7 | 0 |
| `/` | page | src/pages/Dashboard.tsx | 7 | 1 |
| `/settings/*` | mount | src/pages/settings/SettingsArea.tsx:75 |  | 2 |
| `/*` | redirect | src/router.tsx:69 |  | 1 |
| `/archive` | page | src/pages/Archive.tsx | 0 | 1 |
| `/customers` | prefix | src/router.tsx:45 | 4 | 1 |
| `/customers` | page | src/pages/Customers.tsx | 4 | 1 |
| `/customers/:customerId` | page | src/pages/Customers.tsx | 2 | 1 |
| `/dashboard` | redirect | src/router.tsx:34 |  | 1 |
| `/home` | redirect | src/router.tsx:33 |  | 1 |
| `/inbox` | page | src/pages/Inbox.tsx | 3 | 1 |
| `/knowledge` | prefix | src/router.tsx:52 | 3 | 1 |
| `/knowledge` | page | src/pages/Knowledge.tsx | 3 | 1 |
| `/knowledge/:slug` | page | src/pages/Knowledge.tsx | 1 | 1 |
| `/knowledge/saved-replies` | page | src/pages/SavedReplies.tsx | 2 | 1 |
| `/settings/macros` | page | src/pages/settings/SettingsArea.tsx:74 | 1 | 2 |
| `/settings/notifications` | page | src/pages/settings/SettingsArea.tsx:73 | 1 | 2 |
| `/settings/profile` | page | src/pages/settings/SettingsArea.tsx:71 | 3 | 2 |
| `/reports` | prefix | src/router.tsx:60 | 3 | 1 |
| `/reports` | page | src/pages/Reports.tsx | 3 | 1 |
| `/reports/billing` | page | src/pages/Reports.tsx | 1 | 1 |
| `/settings/*` | mount | src/pages/settings/SettingsArea.tsx |  | 1 |
| `/sign-in` | page | src/pages/SignIn.tsx | 4 | 0 |
| `/settings/team` | page | src/pages/settings/SettingsArea.tsx:72 | 1 | 2 |
| `/tickets` | layout-route | src/layouts/TicketsLayout.tsx | 5 | 1 |
| `/tickets` | page | src/pages/TicketList.tsx | 5 | 2 |
| `/tickets/:ticketId` | page | src/pages/TicketDetail.tsx | 3 | 2 |
| `/tickets/status/:status` | page | src/pages/TicketsByStatus.tsx | 1 | 2 |

## Redirects and guards

- navigate-element: `(render)` → `profile` — src/pages/settings/SettingsArea.tsx:70
- render-redirect: `(render)` → `/sign-in` — src/router.tsx:20
- navigate-element: `(render)` → `/dashboard` — src/router.tsx:33
- navigate-element: `(render)` → `/` — src/router.tsx:34
- navigate-element: `(render)` → `/` — src/router.tsx:69
- redirect: `/settings` → `/settings/profile` — src/pages/settings/SettingsArea.tsx:70
- redirect: `/*` → `/` — src/router.tsx:69
- redirect: `/dashboard` → `/` — src/router.tsx:34
- redirect: `/home` → `/dashboard` — src/router.tsx:33
- guard redirect → `/sign-in` (drops destination) — src/router.tsx:20

## Persistent chrome

| Component | Routes covered | Destinations | Active state |
|---|---|---|---|
| src/components/TopNav.tsx | 17 | 5 | library |
| src/components/Sidebar.tsx | 17 | 7 | prefix |
| src/components/MobileHeader.tsx | 17 | 3 | none |
| src/components/NewTicketDialog.tsx | 17 | 1 | none |
| src/pages/settings/SettingsArea.tsx | 4 | 4 | library |
| src/layouts/TicketsLayout.tsx | 3 | 1 | exact |

## Signals

### Information architecture

- **ia-1** No in-app path reaches /archive
  - No link, navigation call, redirect or guard targets this route. It can only be reached by typing the URL or from outside the app.
  - Evidence: src/pages/Archive.tsx
  - Confirm: Search for dynamic hrefs that could build this path; crawl the running app to confirm.

### Routing

- **routing-1** Links point at /reports/weekly, which no route or redirect serves
  - 1 reference(s). Users get a not-found page.
  - Evidence: src/pages/Dashboard.tsx:39
  - Confirm: Open /reports/weekly in the running app.
- **routing-2** 1 URL prefix(es) have no page
  - Removing the last segment from a URL leads to a 404 at: /settings
  - Confirm: Visit each prefix in the running app.
- **routing-3** Redirect chain: /settings → /settings/profile → /
  - 2 hops. Each hop costs a round trip and an extra history decision; point /settings straight at /.
  - Evidence: src/pages/settings/SettingsArea.tsx:70
  - Confirm: curl -sI the first URL and count Location headers.
- **routing-4** Redirect chain: /home → /dashboard → /
  - 2 hops. Each hop costs a round trip and an extra history decision; point /home straight at /.
  - Evidence: src/router.tsx:33
  - Confirm: curl -sI the first URL and count Location headers.
- **routing-5** Guard redirect to /sign-in does not carry the requested URL
  - A signed-out user who opens a deep link is sent to the guard target with no record of where they were going, so after signing in they land on a default page.
  - Evidence: src/router.tsx:20
  - Confirm: Signed out, open a protected deep link, sign in, and check where you land.

### Chrome and navigation

- **chrome-1** 6 destination(s) are linked from more than one persistent nav system
  - Shared: /, /tickets, /customers, /knowledge, /reports, /settings/profile. Two systems claiming the same job means two active states to keep in sync and no clear owner for where something lives.
  - Evidence: src/components/TopNav.tsx, src/components/Sidebar.tsx, src/components/MobileHeader.tsx, src/pages/settings/SettingsArea.tsx
  - Confirm: Visit a nested page and compare which item each system highlights.
- **chrome-2** Persistent nav systems compute "current" differently (library vs prefix vs none)
  - On a nested route one system shows the section as current and another does not.
  - Evidence: src/components/TopNav.tsx (library), src/components/Sidebar.tsx (prefix), src/components/MobileHeader.tsx (no active state), src/pages/settings/SettingsArea.tsx (library)
  - Confirm: Open a nested page (e.g. a detail route) and check both systems.
- **chrome-3** /settings/profile is labelled "Settings" and "Profile" in different places
  - Different names for one destination make users think they are different places.
  - Evidence: src/components/Sidebar.tsx:21, src/pages/settings/SettingsArea.tsx:31
  - Confirm: Confirm in the UI.

### Continuity and state

- **continuity-1** /tickets: sort live only in component memory
  - Refresh, Back from a child page, opening in a new tab and sharing the link all lose this state.
  - Evidence: src/pages/TicketList.tsx:13
  - Confirm: Change it, open a child page, press Back; then refresh.
- **continuity-2** /tickets/:ticketId: tab live only in component memory
  - Refresh, Back from a child page, opening in a new tab and sharing the link all lose this state.
  - Evidence: src/pages/TicketDetail.tsx:19
  - Confirm: Change it, open a child page, press Back; then refresh.

## Unresolved dynamic targets (5)

These navigation targets are computed at runtime; a crawl or journey run resolves them.

- src/components/Breadcrumbs.tsx:13 `c.to`
- src/components/MobileHeader.tsx:16 `item.to`
- src/components/Sidebar.tsx:18 `item.to`
- src/components/TopNav.tsx:12 `item.to`
- src/pages/settings/SettingsArea.tsx:63 `item.to`
