// Best starting points: one recommended entry for each common job, in the words a visitor would
// use, with alternatives and when to choose them. Each card answers the same four questions in the
// same order. "changes" must agree with the entry's own mode (see tests/starts.test.mjs).
export type Change = "no" | "asks" | "docs" | "test" | "yes";
export type Start = {
  slug: string;
  job: string;        // the visitor's words
  pick: string;       // entry id
  useWhen: string;
  youGet: string;
  requires: string;
  changes: Change;
  alts: { id: string; when: string }[];
};

export const CHANGES: Record<Change, string> = {
  no: "No. It only reads and reports.",
  asks: "Not until you approve. It reports first.",
  docs: "Not your code. It may add terms to GLOSSARY.md as you talk, and offers to record decisions.",
  test: "Only a test that shows the problem. It asks before fixing.",
  yes: "Yes. Review what it changed before you keep it.",
};

export const STARTS: Start[] = [
  {
    slug: "fix-a-bug",
    job: "Fix a bug",
    pick: "EC02",
    useWhen: "Something is broken or slow, and you can describe what you see.",
    youGet: "A check that fails on the bug, the likely causes ranked, a fix, and a test that stops it coming back.",
    requires: "engineering-kit installed.",
    changes: "yes",
    alts: [
      { id: "M03", when: "The same kind of bug keeps coming back. Plain prompt, nothing to install." },
      { id: "EC01", when: "You're not sure what's wrong and want the agent to pick the first move." },
    ],
  },
  {
    slug: "improve-a-page",
    job: "Make a page look and work better",
    pick: "UI028",
    useWhen: "A screen feels off and you can say how, in plain words.",
    youGet: "The one design skill that fits, why it was picked, and the change it makes.",
    requires: "design-kit installed.",
    changes: "yes",
    alts: [
      { id: "RC03", when: "You can't say what's wrong yet and want the worst problems found first." },
      { id: "RC08", when: "It's fine on a laptop but not on a phone." },
    ],
  },
  {
    slug: "check-database-data",
    job: "Check that database numbers are right",
    pick: "DBR01",
    useWhen: "A figure looks wrong, or you need proof before you trust it.",
    youGet: "Figures rebuilt from their sources, each disagreement explained, and how much data it affects.",
    requires: "The repository and read-only access to the database.",
    changes: "asks",
    alts: [
      { id: "EC35", when: "You have a different database problem and want the agent to pick the prompt." },
      { id: "PG02", when: "Everything passes its checks but still looks wrong." },
    ],
  },
  {
    slug: "review-architecture",
    job: "Make the code easier to change",
    pick: "EC04",
    useWhen: "Small changes take too long, or the agent keeps getting lost in the code.",
    youGet: "Modules that add little, a before-and-after report, and a conversation about one change.",
    requires: "engineering-kit installed.",
    changes: "docs",
    alts: [
      { id: "A03", when: "You want a plain prompt that finds layers you could delete, with nothing to install." },
      { id: "M12", when: "You already know the area and want it simplified." },
    ],
  },
  {
    slug: "plan-a-feature",
    job: "Plan a feature before building it",
    pick: "M07",
    useWhen: "You know what you want but haven't written down what done looks like.",
    youGet: "A short spec: outcome, scope, what's left out, how to check it, and where to stop.",
    requires: "Nothing. Paste it into any agent.",
    changes: "yes",
    alts: [
      { id: "EC05", when: "The product direction is still open and you want to be asked questions." },
      { id: "M09", when: "There are several ways to build it and you want them compared." },
    ],
  },
  {
    slug: "improve-copy",
    job: "Improve the words in an app",
    pick: "UI046",
    useWhen: "Buttons, errors or empty screens are unclear, long or off in tone.",
    youGet: "Rewritten interface text with length limits and one consistent voice.",
    requires: "design-kit installed.",
    changes: "yes",
    alts: [
      { id: "RC11", when: "It's longer writing, like a page or an email, that sounds machine-written." },
    ],
  },
  {
    slug: "check-accessibility",
    job: "Check accessibility",
    pick: "UI074",
    useWhen: "Before you ship a screen, to catch missing labels, focus and contrast problems.",
    youGet: "Short findings with file and line numbers, against Vercel's current interface guidelines.",
    requires: "Vercel's web-design-guidelines skill and internet access while it runs.",
    changes: "no",
    alts: [
      { id: "UI038", when: "People can use it but get lost. Checks usability, not code rules." },
    ],
  },
  {
    slug: "ship-safely",
    job: "Ship a change safely",
    pick: "EC26",
    useWhen: "A change or pull request is about to merge.",
    youGet: "Bugs in the change, ranked, at the effort level you choose. Use high or above before a PR is ready.",
    requires: "Claude Code. It's built in.",
    changes: "no",
    alts: [
      { id: "PG17", when: "The change includes a database migration or new permissions." },
      { id: "RC07", when: "It's a user interface change and you want a browser check too." },
    ],
  },
];
