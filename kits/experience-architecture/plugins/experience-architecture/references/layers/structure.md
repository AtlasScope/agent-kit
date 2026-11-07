# Playbook: page structure (information architecture)

Loaded by Diagnose and Rethink when pages, content or concepts are in question. Pair it with `${CLAUDE_PLUGIN_ROOT}/references/judgment.md`, which holds the tests for whether a page should exist.

Read `${CLAUDE_PLUGIN_ROOT}/references/evidence.md` first. The goal is a structure users can predict, which does not always mean fewer pages.

## Procedure

1. **Map.** Use the static map from Diagnose (or run `ea map <app-root> --out <out>/map`). Read its `summary.md`: the route table, `ia` signals (`orphan`, `near-duplicate`, `related-views`, `fragmented-entity`, `tab-and-page`) and `sitemap-current.mmd`. With a running URL, also run `ea crawl <url>` (add `--cookie` or `--storage-state` for auth). Its `near-duplicate` findings compare rendered content, which catches duplicates that static analysis misses.

2. **Reconstruct the concept model.** List the nouns the product is about: customer, order, ticket, report, setting. For each, record where it is listed, where it is viewed, where it is edited, which URLs show it, and which nav labels point at it. Read page components, not just file names. This table is the core artifact. Fragmentation shows as one noun spread across URL branches; duplication shows as two rows with the same content and different labels.

3. **Test each page against these questions:**
   - *Is it a place?* Users return to it, link to it, or need it in Back history. Places deserve a URL. A mode of a place (a filter, a tab, an archived view) may be its own page, a query value or local state; decide from how users treat it (`${CLAUDE_PLUGIN_ROOT}/references/state-ownership.md`), not from a blanket rule.
   - *Does it have one owner?* It sits under the noun it is about, and its breadcrumb and nav highlight agree.
   - *Is it reachable?* At least one in-app path reaches it, and the path makes sense from the user's task, not just a link that happens to exist.
   - *Is it distinct?* No other page shows mostly the same thing under another name.
   - *Is it necessary?* Someone uses it. Look for "coming soon", empty states and stubs. If usage data is unavailable, say so.

4. **Confirm before claiming.** For each duplicate pair, open both (browser) or read both components and their data sources. "Built on the same table" may be a legitimate filtered view. For orphans, grep for dynamic hrefs that could build the path before calling it unreachable.

5. **Consolidation matrix.** Write `<out>/consolidation.md`:

   | Current page | Concept | Verdict | Becomes | Why | Risk |
   |---|---|---|---|---|---|
   | /analytics | revenue | merge | /reports | same content, two labels | bookmarks: redirect |

   Verdicts: keep, merge into, demote to tab/view/filter, promote to destination, move under, retire. Note external contracts (marketing links, emails, partner deep links, SEO) in Risk.

6. **New patterns.** Where the structure fights the user's task, describe what would work better: a record-centred hub replacing scattered pages, a queue replacing several lists, a settings area that absorbs admin pages. These feed Rethink when the owner wants alternatives.

## Output

`<out>/ia.md` holds the concept table, the findings (finding record format) and the consolidation matrix, and links `sitemap-current.mmd`. Diagnose's report carries the three structural problems that matter most and the matrix's headline changes.

Read-only playbook. Never merge or delete pages yourself.
