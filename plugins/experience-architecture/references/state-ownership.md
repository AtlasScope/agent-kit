# Where state belongs

Decide from how the user expects the experience to behave, not from a rule about URLs. The same control (a tab, a filter, a panel) belongs in different places in different products. Work out the expectation first, then pick the home that delivers it.

## Five questions about the experience

For each piece of state on a screen (which thing is shown, tab, filter, sort, search, selection, open panel, scroll, typed input, workspace), answer from the user's side:

| Question | If the answer is yes |
|---|---|
| If I send this link to a colleague, should they see this too? | It belongs in the URL: the path for *which thing*, the query for *how it is shown* |
| If I press Back, should this be undone? | The change creates a history entry (push) |
| If I refresh, should it still be here? | URL, `history.state`, `sessionStorage` or the server; never component memory alone |
| If I come back tomorrow, or on my phone, should it be here? | A saved preference: server for every device, `localStorage` for this one |
| If I switch to another record, should it come with me? | Yes: hold it above the record (layout, store). No: key it by record id |

If every answer is no, the state is transient and component memory is the right place: an open menu, a hover card, a half-dragged item.

Sources for the answers, best first: what the product already promises (a "Copy link" button, a share sheet, notification emails with deep links), how similar screens in the same product behave, the user's job (a support agent working a queue shares filtered views; someone browsing a small settings page does not), conventions of the platform users come from, and only then general convention. When the answers are genuinely open, the choice is a product decision: present it with what each option feels like, and do not call the current choice a defect.

## Homes and what they give you

| Home | Back/Forward | Refresh | Shared link or new tab | Scope |
|---|---|---|---|---|
| URL path | yes | yes | yes | per history entry |
| URL query | yes | yes | yes | per history entry |
| URL hash | yes | yes | yes | per entry; not sent to the server |
| `history.state`, router scroll restoration | yes | yes, same tab | no | per entry, per tab |
| Component memory | only while mounted | no | no | one mount |
| Global client store | within the session, not tied to entries | no | no | per tab |
| `sessionStorage` | yes | yes | no | per tab |
| `localStorage`, IndexedDB | yes | yes | no | every tab of this browser, shared |
| Server preference | yes | yes | no, but follows the user to other devices | the user |
| Server entity | yes | yes | yes, to people with access | the entity |

Two traps fall out of the table. State in memory or a store looks right in a click-through demo and disappears on refresh, cold open and often Back. State in `localStorage` leaks between tabs, so a second tab silently changes what the first one shows next time.

## Common cases, with what flips the answer

| State | Usual answer | What flips it |
|---|---|---|
| Which record or section | path | nothing; identity in the query beside siblings that use the path is inconsistent |
| Tabs on a record | query or path when people link to a tab or think of it as somewhere they went (Settings → Billing, a ticket's Activity); local state when the tabs are views of one small thing (chart or table) | a tab users never share and toggle constantly; a tab that is really a separate task |
| Filters, sort, search on a work list | query, replaced while the user adjusts, so Back leaves the list rather than replaying every change | a tiny list where nobody would share the view (local is fine); saved views (server) |
| Panel or drawer showing a record | addressable (query, or an intercepting/parallel route) when people discuss or link to the record, with Back closing it | a quick glance nobody links to, closed by Escape and outside-click |
| Create or edit form in an overlay | local, with protection against losing typed input | linked from emails or docs ("new ticket"), then addressable |
| Typed but unsaved input | kept per record (keyed by id) and warned about before it is lost | short throwaway input, like a search box that is already in the URL |
| Scroll, expanded rows | per history entry (router restoration, `history.state`) | an infinite feed where restoring position needs the loaded items too |
| Workspace, organisation, tenant | path when records belong to one workspace and links cross workspaces | a user who only ever has one workspace (session is fine) |
| Pagination | query, pushed when pages are places people return to | infinite scroll, or pages nobody returns to (replace) |
| Dismissed banners, density, sidebar collapsed | preference (local or server), read where it does not remount | nothing |
| Sign-in | cookie or server | never in the URL |

## Push or replace

Push when the user would describe the change as going somewhere: opening a record, moving to another section, opening an addressable panel, the next step of a multi-step flow. Replace when they would describe it as adjusting where they are: refining a filter, typing a search, normalising a URL, redirecting. Close a pushed panel with `history.back()` so Back does not reopen it. Redirects after an action (save, create, sign-in) replace, so Back does not resubmit or bounce.

An in-app "← Back to list" should return to the list as the user left it: use `history.back()` when the previous entry is that list, and link to the list's URL (with its query) otherwise, never a bare push to the unfiltered list.

The defect is inconsistency or contradiction: similar screens in one product doing different things, or behaviour that breaks an expectation the product itself sets. A product that pushes tab changes everywhere is making a choice; a product where Back closes the panel on one screen and leaves the page on the next is broken.

## Restoration rules

- Back and Forward restore the view the user left: filters, tab, scroll, expanded rows, any open panel that was a history entry. In Next.js App Router, `<Link>` restores scroll by default; React Router data routers need `<ScrollRestoration />`.
- A new navigation starts at the top, and focus moves to the new page's heading or main region, or a route announcer tells screen readers where they are.
- Closing an overlay returns focus to the control that opened it.
- Switching records resets record-specific state. Key components by record id when the framework reuses them.
- Refresh shows the same view. Anything that changes on refresh lives somewhere the user did not expect.

## Direct entry, new tabs and other accounts

Every URL a user can see should work when pasted into a fresh browser:

- signed out: redirect to sign-in carrying the destination (`?next=`, validated as same-origin) and return there afterwards;
- as another person with access: the same thing, minus personal preferences;
- as someone without access: a clear "you don't have access" inside the app's chrome, unless hiding existence is a deliberate security choice;
- unknown URLs: a not-found page with a way forward. Silently redirecting home hides broken links.

Anything users click to go somewhere (rows, cards, breadcrumbs, menu items) should be a real link, so Cmd/Ctrl-click, middle-click, "copy link" and bookmarking work.
