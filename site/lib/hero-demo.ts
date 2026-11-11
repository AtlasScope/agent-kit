// The homepage hero's worked example: one /design request, followed into the skill it routes to.
// Everything here is quoted from the design kit, and tests/hero-demo.test.mjs checks it against the files:
// the router row, every heading and line range, each quoted line, and every line count.
// To change the example, change this file and run `npm test`; the test names what no longer matches.

const SKILL_DIR = "kits/design-kit/plugins/design-kit/skills/refactoring-ui";

export const DEMO = {
  // The router's own row whose first pick is /refactoring-ui ("Hierarchy looks amateur", situations.md).
  cmd: "/design",
  request: "the dashboard’s hierarchy looks amateur",
  routedBy: { file: "kits/design-kit/plugins/design-kit/skills/design/references/situations.md", row: "Hierarchy looks amateur", pick: "/refactoring-ui" },
  // "amateur" is why the skill matched; "dashboard’s" is the word the answer comes from.
  why: "amateur",
  key: "dashboard’s",
  skill: "refactoring-ui",
  skillFile: `${SKILL_DIR}/SKILL.md`,
  // SKILL.md's headings, verbatim, with the lines each section spans. `sub` marks the seven numbered principles.
  outline: [
    { title: "Core Principle", from: 14, to: 19 },
    { title: "Scoring", from: 20, to: 23 },
    { title: "The Refactoring UI Framework", from: 24, to: 27 },
    { title: "1. Visual Hierarchy", from: 28, to: 54, sub: true },
    { title: "2. Spacing & Sizing", from: 55, to: 79, sub: true },
    { title: "3. Typography", from: 80, to: 104, sub: true },
    { title: "4. Color", from: 105, to: 131, sub: true },
    { title: "5. Depth & Shadows", from: 132, to: 159, sub: true },
    { title: "6. Images & Icons", from: 160, to: 184, sub: true },
    { title: "7. Layout & Composition", from: 185, to: 211, sub: true },
    { title: "Common Mistakes", from: 212, to: 224 },
    { title: "Quick Diagnostic", from: 225, to: 239 },
    { title: "Further Reading", from: 240, to: 248 },
    { title: "About the Authors", from: 249, to: 251 },
  ],
  // The two sections that match: Visual Hierarchy (it has a Dashboards row) and Common Mistakes (it lists "Looks amateur").
  matches: [3, 10],
  alsoRow: { line: 216, text: "Looks amateur" },
  // The section the example reads, and the lines it quotes from it.
  section: 3,
  core: { line: 30, label: "Core concept:", text: "Not everything can be important. Create hierarchy through three levers: size, weight, and color." },
  row: { line: 44, context: "Dashboards", technique: "Key metric large, context small", example: "\"$42,300\" large, \"vs last month\" small" },
  // The answer, and the row's own example set the way the row says.
  answer: { text: "Key metric large, context small", line: 44 },
  exampleBig: "$42,300",
  exampleSmall: "vs last month",
  // SKILL.md is read whole; a reference is opened only when its condition applies. Line 210 sends
  // "charts, tables, or dashboards" to data-visualization.md, so that is the one this request opens.
  opensAt: { line: 210, file: "data-visualization.md", says: "dashboards" },
  opened: { title: "Dashboard Layout", from: 299, to: 356, summary: "Visual Hierarchy: key metrics as big numbers, then the primary chart, then supporting charts and detail." },
  files: [
    { name: "SKILL.md", lines: 251, use: "read" },
    { name: "data-visualization.md", lines: 488, use: "dashboards (line 210)" },
    { name: "accessibility-depth.md", lines: 518, use: "if needed" },
    { name: "advanced-patterns.md", lines: 472, use: "if needed" },
    { name: "animation-microinteractions.md", lines: 442, use: "if needed" },
    { name: "theming-dark-mode.md", lines: 461, use: "if needed" },
  ],
} as const;

// The two files this request uses, and their total.
export const USED = DEMO.files.slice(0, 2);
export const USED_LINES = USED.reduce((a, f) => a + f.lines, 0);
