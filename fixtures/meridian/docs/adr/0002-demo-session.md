# ADR 0002: Demo session cookie

Status: accepted (2026-08)

The demo build has no identity service. `src/middleware.ts` treats a `meridian_session=demo` cookie as
signed in and sends everyone else to `/login`. The login form sets the cookie in the browser and then
continues to the page the person was trying to reach. `/track/*` is left outside the middleware; see
`docs/integrations.md`.
