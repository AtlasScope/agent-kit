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
// The plugin agents install every kit, one line each, so "install it once" is true. KITS must list every kit in
// the catalog; tests/install.test.mjs fails if one is missing. design-kit ships /design, which routes plain requests.
// `testedScope` narrows the claim when only part of the steps was run ("The design-kit install was tested").
export type Agent = { id: string; label: string; steps: string[]; check: string; tested: string | null; testedScope?: string; cmd: string };
const agent = (a: Omit<Agent, "cmd">): Agent => ({ ...a, cmd: a.steps[0] });
export const KITS = ["design-kit", "motion-kit", "engineering-kit", "experience-architecture", "working-style"];

// What each kit adds, for the homepage list under the install. `type` is what a person types in Claude Code to start it;
// tests/kits.test.mjs fails if a kit in the catalog has no entry here or a command names a skill the kit doesn't ship.
export const KIT_GUIDE: Record<string, { line: string; type: string[] }> = {
  "design-kit": { line: "Layout, typography, color, UX writing, landing copy, usability and native iOS. Describe the job and it picks the skill.", type: ["/design"] },
  "motion-kit": { line: "Sets up, builds, reviews and fixes interface motion on the web, in React, SwiftUI and React Native.", type: ["/motion"] },
  "engineering-kit": { line: "Bug diagnosis, test-first work, architecture scans, plan interviews and read-only PostgreSQL investigations.", type: ["/engineer", "/database"] },
  "experience-architecture": { line: "Finds out why an app's pages, navigation or Back button feel wrong, and whether its structure should change.", type: ["/experience-architecture:diagnose", "/experience-architecture:rethink"] },
  "working-style": { line: "Plain-English explanations, a straight recommendation, direct critique and a screen checked across sizes.", type: ["/ceo", "/recommend", "/harsh-review", "/viewport-proof"] },
};
export const AGENTS: Agent[] = [
  agent({ id: "any", label: "Any agent", steps: [`npx skills add ${SITE.repoSlug}`],
    check: "Copies every skill folder into this project's .agents/skills. Other skills they call aren't installed for you.",
    tested: "skills 1.7.6, 9 Nov 2026" }),
  agent({ id: "claude", label: "Claude Code", steps: [`claude plugin marketplace add ${SITE.repoSlug}`, ...KITS.map((k) => `claude plugin install ${k}@agent-kit`)],
    check: "Start a new session and type /design with what you want. Its first line names the skill it picked.",
    tested: "Claude Code 2.1.321, 9 Nov 2026", testedScope: "The design-kit install was tested" }),
  agent({ id: "codex", label: "Codex", steps: [`codex plugin marketplace add ${SITE.repoSlug}`, ...KITS.map((k) => `codex plugin add ${k}@agent-kit`)],
    check: "Start a new session and type $design with what you want.", tested: null }),
  agent({ id: "cursor", label: "Cursor", steps: [`npx skills add ${SITE.repoSlug} -a cursor`],
    check: "Copies the skill folders into this project. Whether Cursor picks them up hasn't been tested.", tested: null }),
  agent({ id: "gemini", label: "Gemini CLI", steps: [`npx skills add ${SITE.repoSlug} -a gemini-cli`], check: "Copies the skill folders into this project.", tested: null }),
  agent({ id: "copilot", label: "GitHub Copilot", steps: [`npx skills add ${SITE.repoSlug} -a github-copilot`], check: "Copies the skill folders into this project.", tested: null }),
];

export const authEnabled = () => Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
export const dbEnabled = () => Boolean(process.env.DATABASE_URL);
