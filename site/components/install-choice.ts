// The install command a visitor gets: their last-picked agent, else Claude Code. Shared by the homepage Install
// button, which copies it on click, and the install page, which shows it.
import { AGENTS, type Agent } from "@/lib/site";

export const AGENT_KEY = "agent-kit:agent";
// Every agent with an install path, most used first.
export const SHOWN: Agent[] = ["claude", "codex", "cursor", "gemini", "copilot", "any"].map((id) => AGENTS.find((a) => a.id === id)!);
export const FALLBACK = AGENTS.find((a) => a.id === "any")!;

export const lastAgent = (): Agent => {
  try { const id = localStorage.getItem(AGENT_KEY)?.replace(/^t-/, ""); return SHOWN.find((a) => a.id === id) ?? SHOWN[0]; } catch { return SHOWN[0]; }
};
export const commandFor = (a: Agent) => a.steps.join("\n");

// The hand-off from the homepage's Install button to the install page: which agent's command was copied, or that the
// browser blocked it, and when. The install page believes it only for a few seconds, so a hand-off that never landed
// can't claim a copy later, and it is read without being removed, so a remount of the page (the sign-in wrapper does
// this when it loads) still finds it.
const COPIED_KEY = "agent-kit:copied";
const FRESH_MS = 10_000;
export type Handoff = { agent: string } | { blocked: true };
export const saveHandoff = (h: Handoff) => { try { sessionStorage.setItem(COPIED_KEY, JSON.stringify({ ...h, at: Date.now() })); } catch {} };
export const clearHandoff = () => { try { sessionStorage.removeItem(COPIED_KEY); } catch {} };
export const readHandoff = (): Handoff | null => {
  try {
    const v = JSON.parse(sessionStorage.getItem(COPIED_KEY) || "null");
    if (!v || typeof v.at !== "number" || Date.now() - v.at > FRESH_MS) return null;
    return v.blocked ? { blocked: true } : typeof v.agent === "string" ? { agent: v.agent } : null;
  } catch { return null; }
};
// Which paste keys this computer uses, on <html data-os>: mac (⌘ V), linux (Ctrl Shift V in a terminal) or other
// (Ctrl V). The install page runs it before paint on a full load (OS_SCRIPT) and from an effect after an in-site link.
export function markOS() {
  try {
    const u = navigator.userAgent, p = navigator.platform || "";
    const os = /Mac|iPhone|iPad/.test(p) || /Mac OS X/.test(u) ? "mac" : /CrOS|Linux/.test(p + u) && !/Android/.test(u) ? "linux" : "other";
    document.documentElement.setAttribute("data-os", os);
  } catch {}
}
export const OS_SCRIPT = `(${markOS.toString()})();`;
