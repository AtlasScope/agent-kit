# Capture

## Use what the project already has

Look for a maintained screenshot or visual-regression runner in the repo's scripts and docs first, and drive it with this skill's viewports and states. Extend a shared runner or route manifest only when the surface carries recurring risk. Do not commit a new one-off test just to produce this proof; a short throwaway Playwright script in the run folder is fine.

## Settle before every frame

- Real route, real or realistic data. Populated tables, long labels, and the longest plausible values. A data surface proved only with a skeleton or empty state is unproven.
- Network idle, fonts loaded (`document.fonts.ready`), entrance animations finished. Prefer emulating reduced motion for layout frames, then check motion separately if it matters.
- `geometry_check.js` reports `settled.ok: false` when fonts are still loading or skeleton, spinner, or `aria-busy` elements are visible. Wait and re-run before trusting the frame.

## States worth a frame

Only states that change geometry or quality: open navigation, drawers, sheets, inspectors, filters, menus, tabs, dialogs; empty, error, and loading; validation errors on forms; gated or signed-out views; dark theme; long-content and many-items cases. Scroll at least once on each size: sticky headers, floating buttons, and footers often collide only after scrolling.

## Frame types

- **Viewport frame** (exactly the window): the default. Judge composition, sticky and fixed layers, and anything sized with viewport-height units from these.
- **Full-page frame**: add for long pages so the whole reading path is visible. Full-page capture can re-lay out viewport-height sections and repeat or misplace fixed layers, so never judge those elements from a full-page frame.

## Input and theme

- Touch is a separate pass only when the interaction changes. In Playwright set `hasTouch` and `isMobile` on the context; this also makes pages without a viewport meta tag render at about 980px, which is what a phone really does.
- Hover-only affordances (menus, actions revealed on hover, tooltips holding needed information) fail on touch. Check them on every touch frame.
- Set the color scheme explicitly for each theme pass. The Claude Browser pane re-syncs to the app's theme when it changes, and static previews may always render light.

## Claude Browser pane traps

- Viewport sizes larger than the pane are scaled down to fit. A QHD screenshot is a shrunken image; use `zoom` on regions before judging small text, borders, or alignment.
- The size you set can be cleared at the end of a turn or when the pane resizes. Set it again before each capture and confirm with the geometry result's `viewport` field.
- Reset to the desktop preset when you finish.

## Engine limits

Chromium device emulation is not Safari. It does not reproduce iOS Safari's collapsing toolbar, `100vh` versus dynamic viewport units, input zoom on small font sizes, or rubber-band scrolling. When the change touches these, check real Safari (Playwright WebKit is a partial stand-in) or list it under "not checked".

## Naming

`shots/<route>-<state>-<width>x<height>[-touch][-dark].png`, lowercase, route slashes as hyphens. Names that sort by route and state keep the proof sheet readable.
