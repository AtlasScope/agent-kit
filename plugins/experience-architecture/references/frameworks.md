# Framework notes

What changes per framework when reading routes, layouts and history. `ea map` handles discovery for the first four; for the rest, read the router config by hand and use `ea crawl` for the runtime graph.

## Next.js App Router (`app/`)

- Route = folder with `page.*`. `(group)` folders do not add a segment; `_private` folders are excluded; `[id]`, `[...slug]`, `[[...slug]]` are dynamic; `@slot` folders are parallel routes; `(.)x`, `(..)x`, `(...)x` are intercepting routes (often modals over a list, with a real page behind them on direct entry and refresh).
- `layout` persists across navigation between its children: state there survives, which is right for chrome and wrong for anything specific to one child record. `template` remounts on every navigation: state there always resets.
- Client components reading `useSearchParams` need a Suspense boundary to build. `searchParams` and `params` are async props in recent versions.
- `<Link>` pushes; `replace` prop replaces; `scroll={false}` keeps scroll. `router.push/replace(url, { scroll })`. `redirect()` in a server component during render; `NextResponse.redirect` in `middleware.ts` (or `proxy.ts` in newer releases) runs before routing.
- `redirects()` in `next.config` are server redirects (307/308). Chains and redirects to auth pages that drop the path are common.
- Active state: `usePathname()` with exact or prefix match, or `useSelectedLayoutSegment(s)`. Mixed strategies across nav systems are the usual cause of inconsistent highlights.

## Next.js Pages Router (`pages/`)

- Files are routes; `_app` is the shared shell (persistent chrome lives there or in a per-page `getLayout`). `router.push(url, as, { shallow })` changes the URL without data fetching. `scroll: false` to keep scroll.

## React Router v6/v7 data routers

- `createBrowserRouter([...])` route objects: `children` nest, `index: true` renders at the parent path, a route with children and no element is a pure path prefix, a route with an element and children is a layout (renders `<Outlet/>`). `path: 'x/*'` mounts a component that has its own `<Routes>` with paths relative to `x`.
- `{ path: '*', element: <Navigate to="/" /> }` swallows every unknown URL. `loader` throwing `redirect('/sign-in')` is an auth guard; check that it carries the destination.
- `useNavigate()(to, { replace, state, preventScrollReset })`, `<Navigate replace>`, `<Link replace>`. `<NavLink>` computes active state (`end` prop for exact match: without it, `/` is active everywhere).
- Scroll is not restored unless `<ScrollRestoration />` is rendered (data routers) or the app does it itself.
- v7 framework mode / Remix: `app/routes.ts` config or `app/routes/` flat files (`customers.$id.tsx`, `_layout` prefixes, `_index`).

## TanStack Router

- `createFileRoute('/customers/$id')`; search params are typed and validated (`validateSearch`), which makes "state in the URL" cheap. `<Link activeProps>` for active state. Scroll restoration is opt-in (`scrollRestoration: true`).

## Others

- **Vue Router**: route records with `children`, `router.push/replace`, `<RouterLink>` with `router-link-active` classes, `scrollBehavior` for restoration.
- **SvelteKit**: `src/routes/**/+page.svelte`, `+layout.svelte` persists, `goto(url, { replaceState, noScroll, keepFocus })`, snapshots for per-entry state.
- **Astro / multi-page apps**: every navigation is a document load; history is the browser's. Focus on IA, chrome and URL structure; continuity issues are mostly forms and scroll.
- **Plain SPAs**: look for `history.pushState` wrappers and a router table; the crawler and journeys work regardless.
