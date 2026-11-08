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
  subhead: "Agent Kit gives your coding agent the playbooks experienced designers and engineers use. Ask in plain words and it works from the right one.",
  license: "Works in Claude Code, Codex, Cursor and 70 more agents. Free, and each skill keeps its author’s license.",
  drafts: ["act as a senior designer and audit", "make it less generic, you know?"],
  badge: { text: "New:", code: "/database", rest: "for PostgreSQL investigations", href: "/skills/database" },
};

export const AGENTS = [
  { id: "any", label: "Any agent", cmd: `npx skills add ${SITE.repoSlug}` },
  { id: "claude", label: "Claude Code", cmd: `claude plugin marketplace add ${SITE.repoSlug}` },
  { id: "codex", label: "Codex", cmd: `codex plugin marketplace add ${SITE.repoSlug}` },
  { id: "cursor", label: "Cursor", cmd: `npx skills add ${SITE.repoSlug} -a cursor` },
  { id: "gemini", label: "Gemini CLI", cmd: `npx skills add ${SITE.repoSlug} -a gemini-cli` },
  { id: "copilot", label: "GitHub Copilot", cmd: `npx skills add ${SITE.repoSlug} -a github-copilot` },
];

export const authEnabled = () => Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
export const dbEnabled = () => Boolean(process.env.DATABASE_URL);
