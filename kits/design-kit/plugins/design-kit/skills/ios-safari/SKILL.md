---
name: ios-safari
description: Prove how a web app really behaves in Safari on iPhone and as a Home Screen app, using the iOS Simulator and frame-by-frame screen recordings, then fix what turns up. Covers the rubber-band bounce and fast flings, sticky and fixed bars, layout that shifts while loading, sheets and modals, the keyboard, Dynamic Type text sizes, safe areas, pinch zoom and launch screens. Use when someone says a web app "shakes", "jumps", "flashes" or "feels buggy" on their iPhone, when a change touches scrolling, headers, sheets or inputs, or before calling mobile web work done. For the CSS and meta-tag basics (tap flash, 100vh, input zoom, notch) use mobile-native; this skill is the proof on the device.
---

# iOS Safari

Desktop Chrome, even in phone mode, does not reproduce Safari's rubber-band bounce, its collapsing toolbar, the keyboard, Dynamic Type or Home Screen launch. Most bugs people feel on an iPhone live there. Treat a scroll, bounce, keyboard or text-size fix as unverified until it has been seen in Safari.

This skill reads and records first, then changes code only for what the recordings show. It needs macOS with Xcode and an iOS Simulator runtime. If either is missing, say so, fix what the code clearly shows, and list everything as unverified.

## 1. Set up

1. Boot an iPhone simulator (`xcrun simctl list devices available`, `xcrun simctl boot <udid>`, `open -a Simulator`). Use a current model; note the model and iOS version for the report.
2. Run the app's dev server. The Simulator reaches the Mac's `localhost` directly. Open a page with `xcrun simctl openurl booted "http://localhost:<port>/<path>"`. Add a throwaway query (`?r=1`, `?r=2`) to force a fresh load.
3. If the dev server's file watcher misses edits (common in large repos), restart it after each change. Confirm with `curl` that the new markup is being served before judging the Simulator.

## 2. Record, don't screenshot

A still screenshot cannot show a shake, a jump or a flash. For anything that moves:

```sh
scripts/record.sh start <dir>            # start recording the booted simulator
# ... do the gesture ...
scripts/record.sh stop <dir> 20 0.3      # stop; 20 frames a second, keep the top 30% (where bars live)
scripts/record.sh sheet <dir> 40 75      # tile frames 40..75 into <dir>/sheet.png, then look at it
```

The stop command prints frame file sizes. Runs of near-equal sizes are still frames and jumps in size are motion, so use them to pick the range to tile. In the sheet, pick a landmark that should never move (the page title, a menu button) and compare its position frame by frame. No ffmpeg is needed: the frames come from AVFoundation through the Swift scripts beside `record.sh`.

Gestures, if the agent has a simulator control tool: a quick swipe with a short duration (about 0.12 s) is a fling; two in a row, the second starting before the first settles, is the case that exposes bounce bugs. A two-finger path outward then inward is a pinch zoom.

Judge after things settle. A screenshot taken right after a gesture often catches Safari springing back from a zoom or a sheet still sliding. Take a second one before calling it a bug. A tap right after a page loads can land before it is interactive; wait and tap again.

## 3. Checks

| Check | How | Right looks like |
|---|---|---|
| Fast fling to the top, twice | record two quick downward swipes after scrolling down | Top bar in the same place in every frame; content bounces under it |
| Cold load | record `openurl` of a fresh URL | Nothing moves after first paint; nothing appears late and pushes content down |
| Largest standard and largest accessibility text sizes | `xcrun simctl ui booted content_size extra-extra-extra-large`, then `accessibility-extra-extra-extra-large`; reset with `large` | Nothing runs off the screen; rows of title plus badge wrap; buttons stay inside their cards |
| Increase Contrast | `xcrun simctl ui booted increase_contrast enabled` (then `disabled`) | Outlines strengthen; nothing disappears |
| Keyboard on a page and in a sheet | focus a field; make sure the software keyboard is set to show | Field visible above the keyboard bar; top bar stays under the clock; sheet not clipped |
| Sheets and modals opened from inside cards or lists | open each one | Over the whole page with its backdrop; nothing from the page painted on top |
| Anchor links | open a URL with `#section` | Target lands below any fixed top bar |
| Pinch zoom in, then out | two-finger gesture | Returns to normal size; no sideways scroll at rest (if it zooms out past 100%, something is wider than the screen) |
| Status bar and toolbar edges | look at the top and bottom of a screenshot | The page's own color reaches the edges; no stray bands |
| Reduced motion | read the CSS: every `@keyframes` used should have a `prefers-reduced-motion` fallback | No movement left that the user asked to remove |

Not possible on the Simulator; list them for the user to check on a phone: Safari's tab-bar layouts (Compact, Bottom, Top in Settings), the Messages "Shared with You" bar on links sent in iMessage, whether a sign-in in Safari carries over to the Home Screen app (iOS keeps them separate), Lockdown Mode (no web fonts), Low Power Mode (animations throttled), and how touch feels.

## 4. Causes and fixes that keep coming back

- **A sticky top bar shakes during the bounce.** Safari carries `position: sticky` along with its rubber-band overscroll, and a fling that lands mid-bounce makes it step up and down. Make the bar `position: fixed` and keep its place in the flow with a spacer whose height is plain CSS (safe-area inset plus the bar's height). Use `:has()` if part of the bar is optional.
- **Script that follows scrolling jitters.** Anything that reads `scrollY` or `visualViewport` and moves an element answers a frame late against Safari's compositor-driven scroll. Remove it. If the keyboard must move a fixed bar, apply `visualViewport.offsetTop` only while a text field is focused, clamp it at zero, and write it only when it changes.
- **`dvh` heights change mid-scroll** as the toolbar collapses or a banner appears. Use `svh` for page and container minimum heights.
- **Parts that stream in late push content down.** A loading boundary (React `Suspense` and similar) around something with height needs a fallback of the same height.
- **A modal opened from inside a card is trapped.** A parent with `position: relative` and a `z-index` caps its stacking level, so later siblings paint over it, and Safari can clip it to an `overflow: hidden` ancestor. Render modals and sheets through a portal into `<body>`, client-only.
- **Dynamic Type breaks rem-based layouts.** Sites that set `font: -apple-system-body` on the root grow from about 17px to 53px at the accessibility sizes, and every rem-sized bar and gap triples. Cap the root size with a one-line script in `<head>` that runs before first paint, and let rows that hold a title and a badge wrap.
- **Inputs under 16px zoom the page on focus.** Watch for fields sized with a rem class that a smaller Dynamic Type setting takes under 16px; floor them with `max(16px, 1rem)`.
- **A countdown or date formatted on the client flashes a different value first.** Initialize from the server's clock so the first paint already shows the final form.
- **Home Screen app:** without `apple-touch-startup-image` links for each iPhone size (both orientations), launch shows a white screen; add `format-detection` off so scores and IDs don't become phone links; add the side safe-area insets so landscape clears the notch.

## Report

Lead with what changes for someone holding the phone. Name the device and iOS version, and say what was recorded. Then three short lists: fixed, checked with no change needed, and needs a real iPhone. Never call a scroll, bounce, keyboard or text-size fix done from Chrome alone.
