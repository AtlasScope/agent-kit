# QA harness for the site redesign

Review-lane tooling. It checks a running build of the site against a reference build (normally `main`, which is what production runs) and writes JSON, Markdown and screenshots to `.artifacts/qa/<label>/`. It is not wired into CI and doesn't change any site code.

## What runs where

| Script | Engine | Checks |
|---|---|---|
| `parity.mjs` | HTTP only | Every sitemap URL answers with the same status; title, description, canonical, robots, Open Graph, markdown alternate, h1 count and JSON-LD types match; markdown twins, `llms.txt`, `llms-full.txt`, `robots.txt` and `install.md` are byte-identical; every old `/prompts/<ID>` redirect still lands in the same place. |
| `run.mjs` | Playwright Chromium with Apple device emulation | Per route, device and appearance: status, JS errors, side scroll, one h1, lang, landmarks, skip link, canonical, zoom not blocked, axe (WCAG 2.2 AA plus best practice), touch targets under 44px on touch profiles, self-running animation on interior pages, full-page screenshots. Per route: a Tab walk (skip link first, visible focus ring, focus on screen, no trap), every copy control clicked with its payload recorded, reduced motion, 200% zoom reflow and 320px reflow. Journeys: `/` and Arrow/Enter search, the iPad menu from the keyboard, copy with the clipboard refused, and every `/install` agent tab copying its exact steps. Copy payloads are compared byte for byte with `lib/copy.ts`, `lib/site.ts` and the reference build. |
| `webkit.mjs` | WebKitGTK (Safari's engine on Linux) | Layout, side scroll, h1, axe, light and dark, reduced motion, copy payloads and screenshots. |
| `lanes.mjs --lane search\|browse\|detail` | Both | Interaction checks for one lane's new behaviour: the ⌘K palette and its combobox ARIA, phone sheet and iOS 16px input rule; section anchors, scroll-spy and URL-kept filters; the sticky Copy, the C shortcut and the select-on-refusal fallback. |
| `report.mjs` | none | Folds one label's JSON into `report.md`, grouped by lane owner and severity, with findings already on `main` listed apart. |

Devices (`config.mjs`): MacBook Retina 1440x900 @2x with the Safari user agent, iPad Pro 11 portrait, iPhone 15 Pro, and a 1280x800 non-Apple desktop.

## What this is not

Everything here is emulation. Chromium with an iPhone profile is still Chromium. WebKitGTK shares WebKit's layout and JavaScript engines with Safari but has a different font stack, no iOS browser chrome or safe areas, no touch events, and may be a different WebKit version from shipping Safari. Safari on a Mac also skips links on Tab unless "Press Tab to highlight each item" is on, which neither engine models. Physical iPhone, iPad and Mac Safari runs are separate and done by a person; reports never claim device results.

## Running it

```sh
cd site
npm ci && npm run content
npm i --no-save axe-core@4.10.3           # accessibility scans; not a site dependency

# Build and start the reference and the branch under test, on any two ports.
npx next build && npx next start -p 4000   # in a checkout of main
npx next start -p 4001                     # in a checkout of the branch

node tests/qa/parity.mjs --target http://localhost:4001 --ref http://localhost:4000 --out ../.artifacts/qa/mybranch
node tests/qa/run.mjs    --target http://localhost:4000 --label main                     # once, as the baseline
node tests/qa/run.mjs    --target http://localhost:4001 --label mybranch --baseline main
node tests/qa/lanes.mjs  --lane detail --target http://localhost:4001 --label mybranch --webkit
node tests/qa/report.mjs --label mybranch
```

`--quick` limits `run.mjs` to the MacBook and iPhone; `--routes /prompts,guide` limits it to paths or route families. A deployed preview works as a target too, if the machine can reach it.

WebKit needs, on Debian or Ubuntu: `apt install xvfb python3-gi python3-gi-cairo gir1.2-webkit2-4.1 gir1.2-gtk-3.0`. Set `WK_PYTHON` to a Python that can `import gi` if the default can't. On a Mac, Playwright's own WebKit (`npx playwright install webkit`) is closer to Safari; `run.mjs` is Chromium-only today.

## Severity

- **blocker**: a payload, install command, URL, redirect or machine file differs from the reference, a page fails to load, or focus is trapped.
- **serious**: side scroll, no visible focus ring, broken keyboard path, axe serious, missing h1 or lang, reduced motion ignored, a copy with no feedback when refused.
- **moderate**: touch targets under 44px, self-running animation, axe moderate, focus off screen.
- **minor**: console errors and axe minor.

A finding is "new" when the same check on the same page and device didn't fire on the reference.
