# Proof sheet

`scripts/build_proof_sheet.py <run-dir>/proof.json` writes `<run-dir>/index.html`: verdict first, issues with their frames, checks, a frame grid grouped by route and state, and what was not checked. It prints the `files` map for an artifact publish. It refuses to build when the verdict contradicts the issues, when there are no frames, or when a frame path is missing or points outside the run folder. Fix the proof, not the script.

## Run folder

```text
<primary-checkout>/.artifacts/shots/<YYYY-MM-DD>-<slug>/
  proof.json
  index.html          (generated)
  shots/<route>-<state>-<width>x<height>[-touch|-dark].png
```

Use the repo's own location instead if its AGENTS.md or CLAUDE.md names one. In a worktree, the primary checkout is the parent of `git rev-parse --path-format=absolute --git-common-dir`.

## proof.json

```json
{
  "title": "Pricing page",
  "verdict": "production ready | minor fixes required | not production ready",
  "summary": "One to three plain sentences: the verdict's reason, in user terms.",
  "target": {
    "url": "http://localhost:3000/pricing",
    "branch": "feat/pricing-filters",
    "commit": "abc1234",
    "served_from": "primary checkout | worktree <name> | preview deploy <id>",
    "verified_by": "How you proved the server runs this commit"
  },
  "coverage": "Targeted | Expanded | Release",
  "captured_at": "2026-10-06",
  "issues": [
    {
      "severity": "blocker | material | minor",
      "title": "Filter drawer covers the results with no way to close it",
      "where": { "route": "/pricing", "state": "filters open", "viewport": "390x844" },
      "element": "aside.filters",
      "detail": "What a user sees or cannot do.",
      "fix": "The smallest correct change, when it is clear.",
      "frame": "shots/pricing-filters-390x844-touch.png"
    }
  ],
  "strengths": ["Short, specific, only when true."],
  "frames": [
    {
      "route": "/pricing", "state": "filters open", "viewport": "390x844",
      "input": "touch", "theme": "light",
      "path": "shots/pricing-filters-390x844-touch.png",
      "geometry": { "fail": 1, "warn": 0 },
      "note": "Optional one-line observation."
    }
  ],
  "checks": {
    "behavior": "pass | fail: <what>",
    "cross_viewport_consistency": "pass | fail: <what>",
    "visual_composition": "pass | fail: <what>",
    "baseline": "base vs head compared at <sizes> | not claimed",
    "engines": "Chromium; Safari <version> on <what> | Chromium only"
  },
  "not_checked": ["Every route, state, engine, or theme left out, with the reason."],
  "evidence_note": "Where the frames live and whether they survive the branch."
}
```

A frame with no `path` is allowed and shows as "inspected in session, no saved image". Use it only when no tool could write the image; the sheet states the count so nobody mistakes it for saved evidence.

Write `title`, `summary`, issue titles, and `detail` for Austin: what a person sees and why it matters. Selectors and CSS go in `element` and `fix`.
