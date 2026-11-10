// Site-wide settings. Change the headline here only.
export const SITE = {
  name: "Agent Kit",
  byline: "by AtlasScope",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.atlasscope.dev").replace(/\/$/, ""),
  repo: "https://github.com/AtlasScope/agent-kit",
  repoSlug: "AtlasScope/agent-kit",
};

// Chosen 2026-11-09 with the orbit hero. The sentence under it is built in app/page.tsx, because it carries the live counts.
export const HERO = {
  headline: "Give your coding agent better instructions.",
  by: "Free, by AtlasScope. Each skill keeps its author’s license.",
};

// Install paths per agent. `steps` run in order and Copy copies all of them. `tested` names the CLI
// and date of the last clean-environment run (install, list, update, remove); null means documented only.
// design-kit is the recommended first kit: it ships /design, which routes plain requests to one skill.
export type Agent = { id: string; label: string; steps: string[]; check: string; tested: string | null; cmd: string };
const agent = (a: Omit<Agent, "cmd">): Agent => ({ ...a, cmd: a.steps[0] });
export const AGENTS: Agent[] = [
  agent({ id: "any", label: "Any agent", steps: [`npx skills add ${SITE.repoSlug}`],
    check: "Copies every skill folder into this project's .agents/skills. Other skills they call aren't installed for you.",
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
