# Targeted site diagnostics

The required CI smoke suites cover normal product journeys. These optional tools are for real regressions or substantial interface changes, not every PR. Run against an existing build or preview; a second build is needed only when comparing a specific baseline. Screenshots are opt-in. Reports are ignored under `.artifacts/qa/`.

```sh
cd site
npm ci
npm run content
npx playwright install chromium
# Optional accessibility scans:
npm i --no-save axe-core@4.10.3

node tests/qa/run.mjs --target http://localhost:3000 --quick --routes /install
node tests/qa/run.mjs --target http://localhost:3000 --paths /prompts --shots
node tests/qa/parity.mjs --target http://localhost:3000 --ref http://localhost:4000
```

`run.mjs` checks real content, keyboard and focus, touch targets, reflow, accessibility (when axe is installed), reduced motion, copy payloads and error handling. `--routes` or `--paths` limits the checks; omit both for a site-wide pass. `--ref` or `--baseline` compares only when warranted. `parity.mjs` compares public URLs, redirects, metadata, crawler and Markdown files without a browser.

For Linux WebKit diagnostics, `webkit.mjs` uses WebKitGTK: install `xvfb python3-gi python3-gi-cairo gir1.2-webkit2-4.1 gir1.2-gtk-3.0` and run `node tests/qa/webkit.mjs --target http://localhost:3000 --quick --routes /install`. Set `WK_PYTHON` if needed. `--shots` captures only when requested. Prefer actual Safari/Apple devices when device-specific behavior matters. Neither Chromium emulation nor WebKitGTK is physical-device evidence.

The old redesign-lane reporting and duplicate cross-engine lane matrix have been retired; the remaining tools do not require a coordinator, lane assignments or a report for every run.
