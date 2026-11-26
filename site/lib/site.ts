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
  // One real request and the skill its router picks, shown under the sentence. tests/hero.test.mjs checks it is a
  // routing case in tests/routing/cases.json whose first pick is this skill, and that the router's own row says so.
  example: { router: "/design", request: "why does my dashboard look like a school project", pick: "refactoring-ui", case: "DS31" },
  // Two more real requests, one for each other router, shown under Install on a tall phone where the screen has room.
  // `pick` is what the routing case expects first: a skill, or a library prompt id shown by its title (`label`).
  // tests/hero.test.mjs holds each one to its routing case, the same as the example above.
  more: [
    { router: "/engineer", request: "I want to build the export feature test-first", pick: "/tdd", label: "tdd", case: "EN06" },
    { router: "/database", request: "the database bill doubled and CPU is high", pick: "PG13", label: "Find the true sources of database waste", case: "DB04" },
  ],
};

// What the Install button copies: one message a person pastes into their agent's chat, in any agent. The agent reads
// the steps for itself at /install.md (lib/markdown.ts builds that page from AGENTS below), so nobody has to say
// which agent they use or open a terminal. The per-agent commands stay on the install page for doing it by hand.
export const INSTALL_MESSAGE = `Install Agent Kit for me from ${SITE.repo}. Follow the steps for the agent you are at ${SITE.url}/install.md, then tell me what you installed and how to start it.`;

// The same idea for one kit, on that kit's page. Claude Code and Codex install kit by kit, so the agent runs two
// commands from its section of /install.md. Agents that can only take every kit at once are told to ask first.
export const kitInstallMessage = (kit: string) => `Install only the ${kit} kit from Agent Kit for me (${SITE.repo}). Open ${SITE.url}/install.md and find the section for the agent you are. Run its first command, then only the command that names ${kit}. If your section has one command that installs every kit, ask me before running it. Then tell me what you installed and how to start it.`;

// Install paths per agent. `steps` run in order and Copy copies all of them. `tested` names the CLI
// and date of the last clean-environment run (install, list, update, remove); null means documented only.
// The plugin agents install every kit, one line each, so "install it once" is true. KITS must list every kit in
// the catalog; tests/install.test.mjs fails if one is missing. design-kit ships /design, which routes plain requests.
// `testedScope` narrows the claim when only part of the steps was run ("The design-kit install was tested").
export type Agent = { id: string; label: string; steps: string[]; check: string; tested: string | null; testedScope?: string; cmd: string };
const agent = (a: Omit<Agent, "cmd">): Agent => ({ ...a, cmd: a.steps[0] });
export const KITS = ["design-kit", "motion-kit", "studio-kit", "engineering-kit", "experience-architecture", "working-style"];

// What each kit adds, for the homepage list under the install. `type` is what a person types in Claude Code to start it;
// tests/kits.test.mjs fails if a kit in the catalog has no entry here or a command names a skill the kit doesn't ship.
export const KIT_GUIDE: Record<string, { line: string; type: string[] }> = {
  "design-kit": { line: "Layout, typography, color, UX writing, landing copy, usability and native iOS. Describe the job and it picks the skill.", type: ["/design"] },
  "motion-kit": { line: "Sets up, builds, reviews and fixes interface motion on the web, in React, SwiftUI and React Native.", type: ["/motion"] },
  "studio-kit": { line: "A live studio for choosing how buttons, colours, type, surfaces, spacing, motion and icons look, with a proposal sent back to chat.", type: ["/studio"] },
  "engineering-kit": { line: "Bug diagnosis, test-first work, architecture scans, plan interviews and read-only PostgreSQL investigations.", type: ["/engineer", "/database"] },
  "experience-architecture": { line: "Finds out why an app’s pages, navigation or Back button feel wrong, and whether its structure should change.", type: ["/experience-architecture:diagnose", "/experience-architecture:rethink"] },
  "working-style": { line: "Plain-English explanations, a straight recommendation, direct critique and a screen checked across sizes.", type: ["/ceo", "/recommend", "/harsh-review", "/viewport-proof"] },
};
export const AGENTS: Agent[] = [
  agent({ id: "any", label: "Any agent", steps: [`npx skills add ${SITE.repoSlug}`],
    check: "Copies every skill folder into this project’s .agents/skills. Other skills they call aren’t installed for you.",
    tested: "skills 1.7.6, 9 Nov 2026" }),
  agent({ id: "claude", label: "Claude Code", steps: [`claude plugin marketplace add ${SITE.repoSlug}`, ...KITS.map((k) => `claude plugin install ${k}@agent-kit`)],
    check: "Start a new session and type /design with what you want. Its first line names the skill it picked.",
    tested: "Claude Code 2.1.321, 9 Nov 2026", testedScope: "The design-kit install was tested" }),
  agent({ id: "codex", label: "Codex", steps: [`codex plugin marketplace add ${SITE.repoSlug}`, ...KITS.map((k) => `codex plugin add ${k}@agent-kit`)],
    check: "Start a new session and type $design with what you want.",
    tested: "codex-cli 0.171.0, 23 Nov 2026", testedScope: "The install was tested" }),
  agent({ id: "cursor", label: "Cursor", steps: [`npx skills add ${SITE.repoSlug} -a cursor`],
    check: "Copies the skill folders into this project’s .agents/skills. Whether a new Cursor chat lists them hasn’t been checked.",
    tested: "cursor-agent 2026.11.19, 23 Nov 2026", testedScope: "Copying the skills was tested" }),
  agent({ id: "gemini", label: "Gemini CLI", steps: [`npx skills add ${SITE.repoSlug} -a gemini-cli`], check: "Copies the skill folders into this project.", tested: null }),
  agent({ id: "copilot", label: "GitHub Copilot", steps: [`npx skills add ${SITE.repoSlug} -a github-copilot`], check: "Copies the skill folders into this project.", tested: null }),
];

// The install steps, written for the agent doing the install. The Install button's message (INSTALL_MESSAGE above) sends an agent here. Each section is one agent's commands, straight from AGENTS.
const INSTALL_SECTIONS: [string, string, string][] = [
  ["claude", "Claude Code", "You are Claude Code if you are Anthropic's coding agent, in a terminal, the desktop app or an editor."],
  ["codex", "Codex", "You are Codex if you are OpenAI's coding agent, in its app, its CLI or an editor."],
  ["cursor", "Cursor", "You are Cursor if you are the agent inside the Cursor editor or the cursor-agent CLI."],
  ["any", "Any other agent", "Use this if none of the sections above is you."],
];
export function installMd() {
  const block = (steps: string[]) => ["```sh", ...steps, "```"].join("\n");
  return [
    "# Install Agent Kit", "",
    `Agent Kit is a free, MIT-licensed set of skills for AI coding agents: ${SITE.repo}. This page is written for the agent doing the install.`, "",
    "## How to use this page", "",
    "1. Find the one section below for the agent you are. Do not run commands from any other section.",
    "2. Run its commands in order, in a terminal, from the person's project folder.",
    "3. If a command needs approval or a choice, ask the person. Do not add flags to skip a prompt.",
    "4. When you finish, tell the person in plain words: what was installed, anything that failed and why, and how to start it.",
    "5. If you cannot run commands here, give the person the commands for their agent and say where to paste them.", "",
    "These commands only add Agent Kit's skills. Nothing on this page asks you to change other settings, read private files or send anything anywhere.", "",
    ...INSTALL_SECTIONS.flatMap(([id, label, who]) => {
      const a = AGENTS.find((x) => x.id === id)!;
      return [`## ${label}`, "", who, "", block(a.steps), "", `Then tell the person: ${a.check}`, a.tested ? "" : `These steps have not been tested with ${a.label} yet. If one fails, say so and use the steps under "Any other agent".`, ""];
    }),
  ].join("\n").replace(/\n{3,}/g, "\n\n");
}

export const authEnabled = () => Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
export const dbEnabled = () => Boolean(process.env.DATABASE_URL);
