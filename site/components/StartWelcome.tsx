"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signInHref } from "./AuthNav";

// Shown on /start to a visitor who arrived from the homepage's "New to coding agents? Start here" link, is not signed
// in, and is on a site with accounts: an offer to make a free account before the guide begins. It says only what an
// account does (the sign-in page lists the same), and Not now hides it. The homepage link leaves a note for one visit.
const KEY = "agent-kit:start-here";
const FRESH_MS = 60_000;

export function StartWelcome({ enabled }: { enabled: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    try {
      const at = Number(sessionStorage.getItem(KEY));
      sessionStorage.removeItem(KEY);
      if (at && Date.now() - at < FRESH_MS && !document.documentElement.hasAttribute("data-auth")) setShow(true);
    } catch {}
  }, [enabled]);
  if (!show) return null;
  return (
    <section className="welcome" aria-labelledby="welcome-h">
      <div>
        <h2 id="welcome-h">Make a free account as you go</h2>
        <p>Star the prompts and skills you use in the guide, group them into collections, and share a collection with a link. Everything here also works without one.</p>
      </div>
      <div className="welcome__do">
        <Link className="btn btn--solid" href={signInHref("/start")}>Create a free account</Link>
        <button type="button" className="btn btn--ghost" onClick={() => setShow(false)}>Not now</button>
      </div>
    </section>
  );
}
