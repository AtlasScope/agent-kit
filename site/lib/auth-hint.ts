// Clerk's own signed-out rule: __client_uat (or a suffixed copy) is 0 when signed out and a timestamp when signed in.
// It only reads a cookie name and value; nothing is sent anywhere. The cookie, unlike data-auth, changes when another
// tab signs in, so a page that wants to know now reads it again.
export const SIGNED_IN_RE = /(?:^|; )__client_uat[^=]*=(?!0(?:;|$))[^;]/;
export const signedIn = (cookie: string) => SIGNED_IN_RE.test(cookie);

// Runs in <head> before first paint, so a signed-in visitor never sees the Sign in link flash and AuthGate
// knows to load Clerk.
export const SIGNED_IN_HINT = `try{if(${SIGNED_IN_RE}.test(document.cookie))document.documentElement.setAttribute("data-auth","")}catch(e){}`;

// The install page's account offer (components/AccountOffer.tsx). OFFER_KEY in sessionStorage holds "later" after
// Not now, which holds for the browser session, or "shown:<page load>" once it has been offered. A visitor offered it
// this session who is now signed in (back from sign-in, or signed in from another tab) gets a short welcome instead.
export const OFFER_KEY = "agent-kit:account-offer";
export type Offer = "offer" | "welcome" | null;
export function accountOffer({ signedIn, saved, view }: { signedIn: boolean; saved: string | null; view: string }): Offer {
  if (saved === "later") return null;
  if (signedIn) return saved?.startsWith("shown:") ? "welcome" : null;
  return "offer";
}
