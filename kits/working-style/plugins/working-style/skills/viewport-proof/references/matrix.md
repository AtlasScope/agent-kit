# Coverage selection

Use CSS viewport classes, not device brands. The goal is representative composition and breakpoint evidence, not a claim to cover every screen.

## Modes

### Targeted

Use for an established route or bounded geometry change. Start with the anchors that exercise the affected layout:

| Class | CSS viewport | Purpose |
|---|---:|---|
| Product mobile | 390x844 | narrow composition, touch controls, bottom spacing |
| Tablet portrait | 768x1024 | intermediate reflow and touch layout |
| Compact laptop | 1280x800 | primary working baseline |
| Laptop | 1440x900 | established desktop composition |
| QHD | 2560x1440 | wide-screen intent, max-width, rails and dead canvas |

Do not run an irrelevant anchor merely to increase the screenshot count. Do add the affected breakpoint probes described below.

### Expanded

Use for a new page or shell, navigation/app chrome, a responsive refactor, or a new workbench pattern. Run the relevant Targeted anchors, all touched breakpoint probes, and the extremes that matter:

| Conditional class | CSS viewport | Add when |
|---|---:|---|
| Small mobile | 320x568 | labels, controls, or minimum-width behavior changed |
| Modern wide mobile | 430x932 | mobile composition changes materially across the range |
| Tablet landscape | 1024x768 | touch input uses a desktop-like width |
| Short laptop | 1440x720 | fixed-height, sticky, modal, sheet, or dense-table behavior changed |
| Scaled desktop | 1536x864 | a breakpoint or composition change sits between laptop and desktop |
| Desktop | 1920x1080 | max-width, secondary rail, or wide composition changed |
| Ultrawide | 3440x1440 | the surface introduces or changes ultrawide behavior |
| Short mobile | 390x667 | keyboard, sheet, fixed footer, or viewport-height behavior changed |

### Release

Use the repository's maintained route/state manifest. Run its required viewports and interactions, then add targeted browser-engine coverage. Do not invent a new release roster inside a handoff.

## Breakpoint probes

For every changed CSS or container breakpoint, inspect just below, at, and just above the boundary when the exact transition matters. Record the CSS width and the owning component/container. A fixed anchor does not replace these probes.

## Input and engine dimensions

The same CSS size may require separate mouse and touch passes only when the interaction changes. Explicitly emulate and record pointer/hover/touch behavior; do not duplicate a viewport under two device names without changing the input contract.

Chromium is the baseline. Safari/Firefox checks are targeted risk coverage, not another full matrix by default.
