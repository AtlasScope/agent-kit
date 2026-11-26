// What a signed-out visitor meant to do when they chose to sign in, so it happens once they are back. Today that is
// starring one prompt or skill: Star (components/Star.tsx) saves it on the way to sign-in, and the signed-in star for the
// same item (components/auth/ClerkParts.tsx) finishes it and says so. It lives in localStorage, because sign-in can
// return in another tab, and lapses after 30 minutes, so an abandoned sign-in never stars something days later.
export const INTENT_KEY = "agent-kit:intent";
export const INTENT_MS = 30 * 60_000;
export type Intent = { kind: "prompt" | "skill"; ref: string; at: number };

export function saveIntent(kind: Intent["kind"], ref: string) {
  try { localStorage.setItem(INTENT_KEY, JSON.stringify({ kind, ref, at: Date.now() })); } catch {}
}
// The intent for this item, if one is waiting and fresh. Reading it for the item removes it, so it runs once.
export function takeIntent(kind: string, ref: string, now = Date.now()): boolean {
  try {
    const v = JSON.parse(localStorage.getItem(INTENT_KEY) || "null");
    if (!v || typeof v.at !== "number") return false;
    if (now - v.at > INTENT_MS) { localStorage.removeItem(INTENT_KEY); return false; }
    if (v.kind !== kind || v.ref !== ref) return false;
    localStorage.removeItem(INTENT_KEY);
    return true;
  } catch { return false; }
}
