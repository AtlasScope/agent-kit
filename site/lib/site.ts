// Site-wide settings. The headline is still being decided; change it here only.
export const SITE = {
  name: "Agent Kit",
  byline: "by AtlasScope",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://atlasscope.dev").replace(/\/$/, ""),
  repo: "https://github.com/AtlasScope/agent-kit",
  repoSlug: "AtlasScope/agent-kit",
};

export const HERO = {
  headline: ["Describe the job.", "Agent Kit picks the skill."],
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
