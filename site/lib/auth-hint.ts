// Runs in <head> before first paint, so a signed-in visitor never sees the Sign in link flash and AuthGate
// knows to load Clerk. Mirrors Clerk's own rule: __client_uat (or a suffixed copy) is 0 when signed out and a
// timestamp when signed in. It only reads a cookie name and value; nothing is sent anywhere.
export const SIGNED_IN_HINT = `try{if(/(?:^|; )__client_uat[^=]*=(?!0(?:;|$))[^;]/.test(document.cookie))document.documentElement.setAttribute("data-auth","")}catch(e){}`;
