# Meridian scoring

Scored against `meridian-key.json` (15 defects M1-M15, structural S1-S2, decoys X1-X4). Net defects are the defects found minus one per decoy fallen for. Ratings run from 1 to 5. A false claim is a statement that the source in `meridian-app/` contradicts. Small line-number drift and miscounts are not counted.

How the structural problems were scored:
- **S1 = 1:** the report names the three-way notification split and proposes one notifications place, merging the three notification pages.
- **S1 = ½:** the report names the split but only cross-links or renames the pages, or proposes "one Settings area split by scope". That keeps the scope as the place, which the key argues against.
- **S2 = 1:** a merge into one Analytics section, with the duplicate pages retired or redirected.
- **S2 = ½:** the report sees the overlap but keeps all three areas, uses tabs only, or defers it.

How decoy X2 (/org/shipments) was scored:
- Penalised when the report recommends removing or merging the page (I, J).
- Not penalised when the report lists it as confusing but cites the README and keeps it (A, B, D, E).

## Broad scenario

| Report | Defects (net)/15 | IDs | S1 | S2 | Decoys | Evidence | Grouping | Actionability | Owner | False claims |
|---|---|---|---|---|---|---|---|---|---|---|
| A | 13 | M1-M11, M13, M15 | ½ | 0 | 0 | 5 | 5 | 5 | 4 | 1 |
| B | 14 | M1-M11, M13-M15 | ½ | ½ | 0 | 3 | 4 | 4 | 3 | 1 |
| C | 13 | M1-M11, M13, M15 | 1 | ½ | 0 | 5 | 5 | 5 | 4 | 0 |
| D | 13 | M1-M11, M13, M15 | 1 | 1 | 0 | 4 | 4 | 4 | 3 | 0 |
| E | 12 | M2-M10, M13-M15 | ½ | ½ | 0 | 4 | 4 | 4 | 4 | 1 |
| F | 11 | M2-M9, M11, M13, M15 | 0 | 1 | 0 | 4 | 4 | 4 | 4 | 2 |
| G | 9 | M2-M5, M7, M9, M11, M13, M15 | ½ | 0 | 0 | 5 | 4 | 4 | 4 | 1 |
| H | 12 | M2-M9, M11, M13-M15 | ½ | ½ | 0 | 5 | 4 | 4 | 4 | 0 |
| I | 11 (12 − 1) | M2-M9, M11, M13-M15 | 0 | ½ | 1 (X2) | 4 | 4 | 4 | 4 | 2 |
| J | 11 (12 − 1) | M1-M10, M13, M15 | ½ | 0 | 1 (X2) | 5 | 5 | 5 | 4 | 0 |
| K | 11 | M2-M9, M11, M13, M15 | 0 | ½ | 0 | 5 | 4 | 5 | 4 | 2 |
| L | 12 | M2-M11, M13, M15 | ½ | ½ | 0 | 3 | 4 | 4 | 3 | 1 |

No report found M12 (the invoice list loses its scroll position). No report fell for X1, X3 or X4.

### Per-report notes (broad)

**A**
- Misses M12, M14 and S2.
- M4 is credited on the hard-coded acme redirect for /shipments/:id; the report never names the /tracking chain.
- S1 gets ½ because it only proposes cross-linking the three pages, as a later change.
- X2 is borderline: it calls /org/shipments "a second, weaker list" but recommends keeping it, so no penalty.
- False claim: "Back then leaves the app entirely" (to about:blank). That came from a probe that started on a blank tab.

**B**
- Misses only M12, the widest recall of the twelve.
- S1 gets ½ for "one home for settings, one name per kind of notification".
- S2 gets ½: it sees the three analytics areas as one destination but only fixes the highlight.
- X2 is mentioned but not acted on, citing the README.
- Evidence is code and curl only, and the report says so.
- False claim: the /w/acme crumb is "redirected to Overview by the catch-all". It returns 404, because the catch-all needs another segment.

**C**
- Misses M12 and M14.
- S1 gets 1: it merges the three notification pages into one page with three sections.
- S2 gets ½: it names "Analytics split three ways" but keeps all three areas.
- Strongest evidence of the twelve, and it explains the about:blank probe artifact correctly.
- No false claims.

**D**
- Misses M12. M14 is not credited: "similar contents" is too generic.
- S1 gets 1: one settings entry with sections that replaces the three notification pages.
- S2 gets 1: one Analytics item with tabs, and the rail item removed.
- Minor slip in an example, not counted: it says the draft shows up on SHP-1002, but "next" from SHP-1001 is SHP-1004. The mechanism it gives is right.

**E**
- Misses M1, M11, M12 and M14.
- S1 gets ½: three settings scopes, with notifications never named.
- S2 gets ½: it proposes folding Insights into Overview or Reports.
- False claim: drafts are "keyed by exception id, so no mix-up". ShipmentNotes.tsx:16 uses the constant key "shipment-note".

**F**
- Misses M1, M10, M12 and M14.
- S1 gets 0: it treats settings as two levels and misses the three-way notification split.
- S2 gets 1: one Analytics section with redirects.
- False claims (2):
  - The rail has no current marker for Operations pages. railSectionFor marks them.
  - The rail truncates "Organization" to "Organizat.". The code produces "Organiza.".

**G**
- Misses M1, M6, M8, M10, M12 and M14. M8 is not credited: G notes that shortened URLs return 404 but never ties that to the breadcrumbs.
- S1 gets ½ for one settings area with sections by scope.
- S2 gets 0: "nothing proves it hurts".
- X2, X3 and X4 are kept correctly.
- False claim: account, org, workspace-settings and insights sub-pages have "no visible link anywhere". Their sub-navs link them.

**H**
- Misses M1, M10 and M12.
- M6 is credited through the `match` entry in nav.ts. M14 is credited through "Partners is just sorted by name".
- S1 gets ½: it names the split but recommends nothing.
- S2 gets ½: it names the overlap and defers to research.
- No false claims.

**I**
- Misses M1, M10 and M12.
- X2 penalised: it recommends removing /org/shipments as a duplicate.
- S1 gets 0: not raised.
- S2 gets ½: it proposes folding Insights after reviewing usage.
- False claims (2): the Account and Org sub-pages have "no navigation to them at all", and the Insights sub-pages are linked by nothing. Both have sub-navs.

**J**
- Misses M11, M12 and M14. It treats the draft surviving across shipments as intended.
- Best root-cause grouping: it ties M1 and M4 to one cookie and hard-coded workspace pattern.
- X2 penalised: it marks /org/shipments "MERGE" into the workspace list. X1 is noted with ADR 0004 and kept.
- S1 gets ½ for one settings home split by scope.
- S2 gets 0: it only renames the group "Analytics", which the sidebar already does.

**K**
- Misses M1, M10, M12 and M14.
- S1 gets 0: only a generic settings split.
- S2 gets ½ for one Analytics area with three tabs.
- X2, X3 and X4 are handled correctly.
- False claims (2):
  - Back on Exceptions "throws the user out of the app" to a blank page. That is the same probe artifact as in A.
  - Account and org pages, the Insights sub-pages and even Carriers have no navigation link. Its fix #10 rests on this.

**L**
- Misses M1, M12 and M14. M14 is not credited: "unclear differences" is too generic.
- Evidence is code and curl only.
- S1 gets ½: rename by scope and cross-link, the key's minimum.
- S2 gets ½ for one Analytics entry with sub-tabs.
- X1, X3 and X4 are accepted with their documented reasons.
- False claim: it recommends adding a workspace column to /org/shipments, which already has one.

## Narrow scenario

The two causes are M2 (the sign-in destination rule accepts only /w/) and M3 (the middleware drops the query string). A safe fix replaces the /w/ prefix test with a same-origin check that rejects `//`, `/\` and scheme values. Structural problems S1 and S2 do not apply to this question, so they are scored N/A.

| Report | Defects (net)/15 | IDs | S1 | S2 | Decoys | Both causes | Safe fix | Evidence | Grouping | Actionability | Owner | False claims |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 2 | M2, M3 | N/A | N/A | 0 | Yes | Yes | 4 | 5 | 5 | 4 | 0 |
| B | 4 | M2, M3, M4, M9 | N/A | N/A | 0 | Yes | Yes | 4 | 4 | 5 | 4 | 0 |
| C | 3 | M2, M3, M4 | N/A | N/A | 0 | Yes | Yes | 3 | 3 | 4 | 3 | 0 |
| D | 3 | M2, M3, M4 | N/A | N/A | 0 | Yes | Yes | 4 | 5 | 5 | 4 | 0 |
| E | 3 | M2, M3, M4 | N/A | N/A | 0 | Yes | Yes | 4 | 4 | 4 | 4 | 2 |
| F | 4 | M2, M3, M4, M9 | N/A | N/A | 0 | Yes | Yes | 5 | 4 | 5 | 4 | 0 |
| G | 3 | M2, M3, M4 | N/A | N/A | 0 | Yes | Yes | 4 | 4 | 5 | 3 | 0 |
| H | 4 | M2, M3, M4, M9 | N/A | N/A | 0 | Yes | Yes | 4 | 4 | 5 | 5 | 0 |
| I | 4 | M2, M3, M4, M9 | N/A | N/A | 0 | Yes | Yes | 4 | 4 | 5 | 5 | 1 |
| J | 4 | M2, M3, M4, M9 | N/A | N/A | 0 | Yes | Yes | 4 | 4 | 5 | 4 | 0 |
| K | 2 (3 − 1) | M2, M3, M4 | N/A | N/A | 1 (X3) | Yes | Yes | 3 | 3 | 3 | 4 | 4 |
| L | 3 | M2, M3, M4 | N/A | N/A | 0 | Yes | Yes | 4 | 4 | 5 | 4 | 0 |

All twelve reports find both causes and propose a safe same-origin fix. They differ on secondary findings: M9 (filters never written to the URL) and M4 (the hard-coded acme legacy redirect). M4 is credited wherever the report names the /shipments/:id redirect that hard-codes acme, matching the broad scoring.

### Per-report notes (narrow)

**A**
- Uses curl and code only.
- Best root-cause framing: one return-target string, built in one place and validated in another.
- Its safe fix uses `new URL(next, origin)` with an origin comparison, and it lists `//evil`, `https://evil` and `/\evil` test cases.
- Correctly treats /track as working, so X3 is not penalised.
- Does not mention M4 or M9.

**B**
- Adds M9 as a third cause: if the link was copied from the address bar, it never carried the filter.
- Mentions M4 as unverified.
- The fix offers either a same-origin path check or a prefix allow-list, and keeps rejecting `//` and absolute URLs.

**C**
- Only the chat summary is present; the full write-up was not included, which caps evidence at 3.
- Causes, fix and M4 (with the correct SHP-1002/northwind example) are accurate.
- Its safe fix ("proper same-origin check") gives no detail on `//`.

**D**
- Clear table of observed curl results.
- Proposes one shared function to build and validate `next`, a good grouping.
- The fix is a same-origin path check, or an allow-list by first segment.
- M4 is noted, code-only.

**E**
- Both causes found, with a correct safe fix and M4 via the /tracking and /shipments chain.
- Carries a long unconfirmed static-signal appendix that adds noise.
- False claims (2):
  - /track redirects to `/w/acme/shipments/<ref>/tracking`. track/[ref]/route.ts resolves the owning workspace.
  - The /w/ allow-list also blocks `/shipments/...`. That legacy path is redirected by next.config to /w/acme before middleware or login see it.
- X3 is not penalised, because E explicitly declines to treat /track as a defect.

**F**
- Only report that drove the sign-in in a browser: journey runs of the filtered list, the share link (/share/sa7mh → /workspaces) and a direct link that works.
- Also finds M9 and M4.
- Safe fix is correct.

**G**
- The fix parses with `new URL` and checks the origin, with hostile test values.
- Correctly notes /track works today.
- M4 is noted.
- Owner and decision points are thin.

**H**
- Finds M9, and adds that rows are click handlers rather than links. Verified at ShipmentsTable.tsx:123.
- M4 reproduced with curl.
- Clear decision for the owner on retiring the legacy URLs.

**I**
- Finds M9 and M4.
- Correctly says /track behaves correctly and should stay.
- Server-side validation is suggested.
- False claim (1): the /w/ prefix test is "too weak to be a real guard". A next value that starts with /w/ cannot leave the origin.

**J**
- Finds M9 and M4.
- A small /track critique (it discards the query) is not a penalised decoy claim.
- Slight confusion in listing `/share` among the hard-coded redirects, not counted.

**K**
- Both causes and a safe fix are present.
- X3 penalised: it presents /track as a defect ("drop the sign-in step's context … hits cause 2 or 1") and recommends changing it. /track goes to a /w/ path without a query, so neither bug applies.
- False claims (4):
  - The /track claim above.
  - /shipments/:id and /tracking/:id short links fail the login /w/ check. They are redirected to /w/acme by next.config first.
  - The chat summary says a plain /w/ shipment link "would have been caught by the first bug instead". It has no query and works.
  - "The filter is in the URL, which is right for sharing", repeated in the structure verdict. ShipmentsTable never writes filters to the URL (M9).

**L**
- Both causes, a safe fix with explicit rejection rules, and M4 with a 308 caching note.
- Correctly notes /login ignores an existing session; true, since the middleware excludes /login and the page does not check the session.
