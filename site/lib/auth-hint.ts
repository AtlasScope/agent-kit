// Clerk's own signed-out rule: __client_uat (or a suffixed copy) is 0 when signed out and a timestamp when signed in.
// It only reads a cookie name and value; nothing is sent anywhere. The cookie, unlike data-auth, changes when another
// tab signs in, so a page that wants to know now reads it again.
export const SIGNED_IN_RE = /(?:^|; )__client_uat[^=]*=(?!0(?:;|$))[^;]/;
export const signedIn = (cookie: string) => SIGNED_IN_RE.test(cookie);

// Runs in <head> before first paint, so a signed-in visitor never sees the Sign in link flash and AuthGate
// knows to load Clerk.
export const SIGNED_IN_HINT = `try{if(${SIGNED_IN_RE}.test(document.cookie))document.documentElement.setAttribute("data-auth","")}catch(e){}`;

// The install page's account offer (components/AccountOffer.tsx), once per browser session. OFFER_KEY in
// sessionStorage holds "later" after Not now, or "shown:<page load>" once it has been offered on that page load, so it
// stays up there (through a remount) and is not offered again on a reload or a later visit in the same session.
export const OFFER_KEY = "agent-kit:account-offer";
export type Offer = "offer" | "welcome" | null;
export function accountOffer({ copied, signedIn, saved, view }: { copied: boolean; signedIn: boolean; saved: string | null; view: string }): Offer {
  if (saved === "later") return null;
  // Already offered on this page load: it stays until Not now, and turns into a short welcome once they sign in.
  if (saved === `shown:${view}`) return signedIn ? "welcome" : "offer";
  // Offered earlier this session, on another load: not again.
  if (saved) return null;
  // Only after the message was really copied, and only to someone who isn't signed in.
  return copied && !signedIn ? "offer" : null;
}
