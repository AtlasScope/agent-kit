// The install page's per-agent commands: the tab a visitor last picked, else Claude Code. The homepage Install button
// does not use these; it copies INSTALL_MESSAGE (lib/site.ts), which works in any agent.
import { AGENTS, type Agent } from "@/lib/site";

export const AGENT_KEY = "agent-kit:agent";
// The agents with their own tab on the install page, most used first. Any other agent uses the last one.
export const SHOWN: Agent[] = ["claude", "codex", "cursor", "any"].map((id) => AGENTS.find((a) => a.id === id)!);
export const FALLBACK = AGENTS.find((a) => a.id === "any")!;

export const lastAgent = (): Agent => {
  try { const id = localStorage.getItem(AGENT_KEY)?.replace(/^t-/, ""); return SHOWN.find((a) => a.id === id) ?? SHOWN[0]; } catch { return SHOWN[0]; }
};
export const commandFor = (a: Agent) => a.steps.join("\n");
// What each agent's tile opens ("Any agent" has no site, so no tile). `web` is the agent's own site. `app` is its
// desktop app's link, which opens a new chat with the text typed in and not sent (claude://code/new,
// codex://threads/new, Cursor's prompt deeplink, each documented by its maker). A page can't ask whether an app is
// installed, so after an app link the page also offers `help`. A phone gets `phone` or `web`: apps open only from the
// paths their makers list (/.well-known/apple-app-site-association, assetlinks.json). claude.ai/code already is one;
// Cursor's is cursor.com/agents. ChatGPT's app opens from no Codex address that also has a web page.
export type Open = { web: string; phone?: string; app: (text: string) => string; help: [label: string, href: string][] };
export const OPEN: Record<string, Open> = {
  claude: { web: "https://claude.ai/code", app: (t) => `claude://code/new?q=${encodeURIComponent(t)}`, help: [["Get the app", "https://claude.ai/download"], ["use the web", "https://claude.ai/code"]] },
  codex: { web: "https://chatgpt.com/codex", app: (t) => `codex://threads/new?prompt=${encodeURIComponent(t)}`, help: [["Get the app or use the web", "https://chatgpt.com/codex"]] },
  cursor: { web: "https://cursor.com", phone: "https://cursor.com/agents", app: (t) => `cursor://anysphere.cursor-deeplink/prompt?text=${encodeURIComponent(t)}`, help: [["Get the app", "https://cursor.com/download"], ["use the web", "https://cursor.com/agents"]] },
};
// Which of those a visitor gets: the desktop app on a Mac or Windows PC, the phone link on a phone, else the website
// (Linux, and tablets: an iPad calls itself a Mac but has a touch screen).
export type Device = "desktop" | "phone" | "web";
export const device = (): Device => {
  try {
    const u = navigator.userAgent;
    if (/iPhone|iPod|Android.+Mobile/.test(u)) return "phone";
    return /Windows NT|Macintosh/.test(u) && !(/Macintosh/.test(u) && navigator.maxTouchPoints > 1) ? "desktop" : "web";
  } catch { return "web"; }
};

// The hand-off from the homepage's Install button to the install page: which agent's command was copied, or that the
// browser blocked it, and when. The install page believes it only for a few seconds, so a hand-off that never landed
// can't claim a copy later, and it is read without being removed, so a remount of the page (the sign-in wrapper does
// this when it loads) still finds it.
export const COPIED_KEY = "agent-kit:copied";
export const FRESH_MS = 10_000;
export type Handoff = { message: true } | { agent: string } | { blocked: true };
export const saveHandoff = (h: Handoff) => { try { sessionStorage.setItem(COPIED_KEY, JSON.stringify({ ...h, at: Date.now() })); } catch {} };
export const clearHandoff = () => { try { sessionStorage.removeItem(COPIED_KEY); } catch {} };
export const readHandoff = (): Handoff | null => {
  try {
    const v = JSON.parse(sessionStorage.getItem(COPIED_KEY) || "null");
    if (!v || typeof v.at !== "number" || Date.now() - v.at > FRESH_MS) return null;
    return v.blocked ? { blocked: true } : v.message ? { message: true } : typeof v.agent === "string" ? { agent: v.agent } : null;
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
