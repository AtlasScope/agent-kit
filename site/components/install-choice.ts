// The install command a visitor gets: their last-picked agent, else Claude Code. Shared by the homepage Install
// button, which copies it on click, and the install page, which shows it.
import { AGENTS, type Agent } from "@/lib/site";

export const AGENT_KEY = "agent-kit:agent";
// Set by the homepage Install button for the install page to read once: the agent copied, or "blocked".
export const COPIED_KEY = "agent-kit:copied";
// Every agent with an install path, most used first.
export const SHOWN: Agent[] = ["claude", "codex", "cursor", "gemini", "copilot", "any"].map((id) => AGENTS.find((a) => a.id === id)!);
export const FALLBACK = AGENTS.find((a) => a.id === "any")!;

export const lastAgent = (): Agent => {
  try { const id = localStorage.getItem(AGENT_KEY)?.replace(/^t-/, ""); return SHOWN.find((a) => a.id === id) ?? SHOWN[0]; } catch { return SHOWN[0]; }
};
export const commandFor = (a: Agent) => a.steps.join("\n");
