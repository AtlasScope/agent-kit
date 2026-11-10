// Site-wide settings. The headline is still being decided; change it here only.
export const SITE = {
  name: "Agent Kit",
  byline: "by AtlasScope",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.atlasscope.dev").replace(/\/$/, ""),
  repo: "https://github.com/AtlasScope/agent-kit",
  repoSlug: "AtlasScope/agent-kit",
};

// Chosen 2026-11-08 ("Senior team"). The drafts are the false starts the reveal types and deletes.
export const HERO = {
  headline: "Build like you have a senior team.",
  subhead: "Agent Kit gives your coding agent the playbooks experienced designers and engineers use. Type /design, /engineer or /database, describe the job in plain words, and it picks the right one.",
  license: "Built for Claude Code, Codex and Cursor. Free, and each skill keeps its author’s license.",
  drafts: ["act as a senior designer and audit", "make it less generic, you know?"],
  badge: { text: "New:", code: "/database", rest: "for PostgreSQL investigations", href: "/skills/database" },
};

// Install paths per agent. `steps` run in order and Copy copies all of them. `tested` names the CLI
// and date of the last clean-environment run (install, list, update, remove); null means documented only.
// design-kit is the recommended first kit: it ships /design, which routes plain requests to one skill.
export type Agent = { id: string; label: string; steps: string[]; check: string; tested: string | null; cmd: string };
const agent = (a: Omit<Agent, "cmd">): Agent => ({ ...a, cmd: a.steps[0] });
export const AGENTS: Agent[] = [
  agent({ id: "any", label: "Any agent", steps: [`npx skills add ${SITE.repoSlug}`],
    check: "Copies all 61 skill folders into this project's .agents/skills. Other skills they call aren't installed for you.",
    tested: "skills 1.7.6, 9 Nov 2026" }),
  agent({ id: "claude", label: "Claude Code", steps: [`claude plugin marketplace add ${SITE.repoSlug}`, "claude plugin install design-kit@agent-kit"],
    check: "Start a new session and type /design with what you want. Its first line names the skill it picked.",
    tested: "Claude Code 2.1.321, 9 Nov 2026" }),
  agent({ id: "codex", label: "Codex", steps: [`codex plugin marketplace add ${SITE.repoSlug}`, "codex plugin add design-kit@agent-kit"],
    check: "Start a new session and type $design with what you want.", tested: null }),
  agent({ id: "cursor", label: "Cursor", steps: [`npx skills add ${SITE.repoSlug} -a cursor`],
    check: "Copies the skill folders into this project. Whether Cursor picks them up hasn't been tested.", tested: null }),
  agent({ id: "gemini", label: "Gemini CLI", steps: [`npx skills add ${SITE.repoSlug} -a gemini-cli`], check: "Copies the skill folders into this project.", tested: null }),
  agent({ id: "copilot", label: "GitHub Copilot", steps: [`npx skills add ${SITE.repoSlug} -a github-copilot`], check: "Copies the skill folders into this project.", tested: null }),
];

export const authEnabled = () => Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
export const dbEnabled = () => Boolean(process.env.DATABASE_URL);
