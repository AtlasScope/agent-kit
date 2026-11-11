"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ClerkParts } from "./ClerkParts";

// Clerk's browser script is over a megabyte, and most visitors never sign in. So it loads only for someone
// who is already signed in (Clerk leaves a __client_uat cookie, which the inline script in the layout turns
// into <html data-auth>), and on the pages that need it. Everyone else gets plain links to /sign-in.
type Gate = { parts: ClerkParts | null; signedInHint: boolean };
const GateContext = createContext<Gate>({ parts: null, signedInHint: false });
export const useAuthGate = () => useContext(GateContext);

const NEEDS_CLERK = /^\/(sign-in|account)(\/|$)/;

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hint, setHint] = useState(false);
  const [parts, setParts] = useState<ClerkParts | null>(null);
  useEffect(() => { setHint(document.documentElement.hasAttribute("data-auth")); }, []);
  useEffect(() => {
    if (parts || !(hint || NEEDS_CLERK.test(pathname))) return;
    let live = true;
    import("./ClerkParts").then((m) => { if (live) setParts(m.parts); });
    return () => { live = false; };
  }, [hint, pathname, parts]);

  // Wrapping the page in Clerk's provider once it arrives remounts the page under it. That happens
  // right after load (signed in, or on /sign-in and /account), before anyone has typed anything.
  return (
    <GateContext.Provider value={{ parts, signedInHint: hint }}>
      {parts ? <parts.Root>{children}</parts.Root> : children}
    </GateContext.Provider>
  );
}

