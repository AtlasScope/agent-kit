// The homepage hero's examples: three requests a person might type, each followed to what its router picks and
// the line it quotes from the kit. Nothing here is written for the site: every router line, line number and quote
// is read from the kits, and tests/hero-demo.test.mjs checks each one against the files.
// Each request is also a routing case in tests/routing/cases.json, so the router is held to the same pick.
// To change an example, change this file and run `npm test`; the test names what no longer matches.

const DESIGN = "kits/design-kit/plugins/design-kit/skills";
const ENG = "kits/engineering-kit/plugins/engineering-kit/skills";

export type Line = { file: string; line: number; text: string };
export type Example = {
  id: string;
  // Its routing case in tests/routing/cases.json.
  case: string;
  request: string;
  router: string;
  pick: string;
  kind: string;
  // The router's own line that sends this request where it goes.
  because: Line;
  // The line shown at full size, and the row's own example when it has one.
  answer: Line & { example?: { big: string; small: string } };
  note: string;
  // Every line read on the way, in order. `text` is a piece of that line, quoted exactly.
  trail: Line[];
};

export const EXAMPLES: Example[] = [
  {
    id: "design",
    case: "DS31",
    request: "why does my dashboard look like a school project",
    router: "/design",
    pick: "refactoring-ui",
    kind: "A skill",
    because: { file: `${DESIGN}/design/references/situations.md`, line: 86, text: "Hierarchy looks amateur" },
    answer: { file: `${DESIGN}/refactoring-ui/SKILL.md`, line: 44, text: "Key metric large, context small", example: { big: "$42,300", small: "vs last month" } },
    note: "The skill’s row for dashboards, with its own example set the way it says.",
    trail: [
      { file: `${DESIGN}/design/references/situations.md`, line: 86, text: "| Hierarchy looks amateur | `/refactoring-ui` |" },
      { file: `${DESIGN}/refactoring-ui/SKILL.md`, line: 28, text: "### 1. Visual Hierarchy" },
      { file: `${DESIGN}/refactoring-ui/SKILL.md`, line: 30, text: "Not everything can be important. Create hierarchy through three levers: size, weight, and color." },
      { file: `${DESIGN}/refactoring-ui/SKILL.md`, line: 44, text: "| **Dashboards** | Key metric large, context small | \"$42,300\" large, \"vs last month\" small |" },
      { file: `${DESIGN}/refactoring-ui/SKILL.md`, line: 210, text: "when laying out charts, tables, or dashboards" },
      { file: `${DESIGN}/refactoring-ui/references/data-visualization.md`, line: 299, text: "## Dashboard Layout" },
    ],
  },
  {
    id: "engineer",
    case: "EN14",
    request: "claude says all the tests pass but it’s still broken",
    router: "/engineer",
    pick: "M06",
    kind: "One prompt, no skill",
    because: { file: `${ENG}/engineer/SKILL.md`, line: 29, text: "\"tests pass\" as proof (`M06`)" },
    answer: { file: `${ENG}/engineer/references/start-here.md`, line: 134, text: "Design a way to prove your solution works that doesn't depend on the assumptions, code, or tests you just created." },
    note: "The whole prompt. Your agent gets it word for word.",
    trail: [
      { file: `${ENG}/engineer/SKILL.md`, line: 29, text: "\"tests pass\" as proof (`M06`)" },
      { file: `${ENG}/engineer/references/start-here.md`, line: 129, text: "### M06 Check it independently" },
      { file: `${ENG}/engineer/references/start-here.md`, line: 131, text: "Use it before you accept 'tests pass' as proof that something works." },
      { file: `${ENG}/engineer/references/start-here.md`, line: 134, text: "Design a way to prove your solution works that doesn't depend on the assumptions, code, or tests you just created." },
    ],
  },
  {
    id: "database",
    case: "DB08",
    request: "our supabase bill doubled and we didn’t ship anything new",
    router: "/database",
    pick: "PG13",
    kind: "A read-only check",
    because: { file: `${ENG}/database/SKILL.md`, line: 41, text: "Cost, CPU, storage or bloat" },
    answer: { file: `${ENG}/database/references/prompts.md`, line: 230, text: "Measure which tables, indexes, queries and maintenance activities consume the most storage, execution time and write resources." },
    note: "The prompt’s first sentence. It reads the database and changes nothing.",
    trail: [
      { file: `${ENG}/database/SKILL.md`, line: 41, text: "| Cost, CPU, storage or bloat | `PG13` |" },
      { file: `${ENG}/database/references/prompts.md`, line: 227, text: "### PG13 Find the true sources of database waste" },
      { file: `${ENG}/database/references/prompts.md`, line: 230, text: "Distinguish useful capacity from avoidable waste, including unused indexes, row churn, bloat, poor plans and excessive scans." },
      { file: `${ENG}/database/references/prompts.md`, line: 233, text: "When: The bill is high, CPU or disk usage is high, storage keeps growing, or you suspect bloat." },
      { file: `${ENG}/database/references/prompts.md`, line: 238, text: "Mode: read-only." },
    ],
  },
];

// A path as a visitor reads it: the skill folder onward, without the kit's install path.
export const short = (file: string) => file.replace(/^kits\/[^/]+\/plugins\/[^/]+\/skills\//, "");
