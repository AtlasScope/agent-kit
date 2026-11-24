"use client";
import Link from "next/link";
import { saveHandoff } from "../install-choice";
import { HERO, INSTALL_MESSAGE, SITE } from "@/lib/site";

// The homepage's words: what Agent Kit is, in a headline and one line, and one action. The view from orbit behind
// them is the stage's (components/stage/Stage.tsx), which also plays the move to the install page.
//
// Install copies one message inside the click (browsers allow it only there) and the link navigates at once. What the
// clipboard did is saved for the install page to report, and announced with an event in case that page is already up
// when the answer arrives. A modified click is left to the link, which opens the page in a new tab and copies nothing.
//
// The words rise once on a full page load (the inline script marks it; React does not run the script on an in-site
// navigation, where the stage's own arrival plays instead).
const LOADED = `try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.currentScript.parentElement.setAttribute("data-load","")}catch(e){}`;
export const HANDOFF_EVENT = "agent-kit:handoff";
// Arriving at the guide from Start here, a new visitor is offered a free account there (StartWelcome.tsx).
const markStartHere = () => { try { sessionStorage.setItem("agent-kit:start-here", String(Date.now())); } catch {} };

export function HomeHero() {
  const install = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    let copied: Promise<boolean>;
    try { copied = navigator.clipboard.writeText(INSTALL_MESSAGE).then(() => true, () => false); } catch { copied = Promise.resolve(false); }
    copied.then((ok) => { saveHandoff(ok ? { message: true } : { blocked: true }); dispatchEvent(new Event(HANDOFF_EVENT)); });
  };
  const lines = HERO.headline.split(" ");
  return (
    <section className="hero" aria-labelledby="hero-h" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: LOADED }} />
      <div className="hero__msg">
        <h1 id="hero-h">{lines.map((w, i) => <span key={i} className="hero__w" style={{ "--i": i } as React.CSSProperties}>{w}{i < lines.length - 1 ? " " : ""}</span>)}</h1>
        <p className="hero__lede">Skills and prompts for Claude Code, Codex and Cursor.</p>
        <div className="hero__cta">
          <Link className="btn btn--lg btn--primary launch__go" href="/install" onClick={install} aria-describedby="hero-note">Install Agent Kit</Link>
          <Link className="hero__new" href="/start" onClick={markStartHere}>New to coding agents?</Link>
        </div>
        <p className="sr" id="hero-note">Copies a message to paste into your agent.</p>
      </div>
      <ul className="hero__foot" aria-label="About this site">
        <li><Link href="/about">About</Link></li>
        <li><Link href="/privacy">Privacy</Link></li>
        <li><Link href="/terms">Terms</Link></li>
        <li><a href={`${SITE.repo}/blob/main/CREDITS.md`}>Credits</a></li>
        <li><Link href="/horizon/about">About this view</Link></li>
      </ul>
    </section>
  );
}
