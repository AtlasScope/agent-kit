// Clerk's own signed-out rule: __client_uat (or a suffixed copy) is 0 when signed out and a timestamp when signed in.
// It only reads a cookie name and value; nothing is sent anywhere. The cookie, unlike data-auth, changes when another
// tab signs in, so a page that wants to know now reads it again.
export const SIGNED_IN_RE = /(?:^|; )__client_uat[^=]*=(?!0(?:;|$))[^;]/;
export const signedIn = (cookie: string) => SIGNED_IN_RE.test(cookie);

// Runs in <head> before first paint, so a signed-in visitor never sees the Sign in link flash and AuthGate
// knows to load Clerk.
export const SIGNED_IN_HINT = `try{if(${SIGNED_IN_RE}.test(document.cookie))document.documentElement.setAttribute("data-auth","")}catch(e){}`;
