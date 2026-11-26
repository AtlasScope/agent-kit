"use client";
import Link from "next/link";
import { clearHandoff, saveHandoff } from "../install-choice";
import { HERO, INSTALL_MESSAGE, SITE } from "@/lib/site";

// The homepage's words: what Agent Kit is, in a headline and one line, and one action. The view from orbit behind
// them is the stage's (components/stage/Stage.tsx), which also plays the move to the install page.
//
// Install copies one message inside the click (browsers allow it only there) and the link navigates at once. What the
// clipboard did is saved for the install page to report, and announced with an event in case that page is already up
// when the answer arrives. The install page does not show the message: it says Copied and offers to open the agent.
// A modified click is left to the link, which opens the page in a new tab and copies nothing.
//
// The page says nothing more about what Install does: the install page says Copied. "New to coding agents?" sits first
// in the small links at the foot, and the header's Start and the install page lead there too.
//
// The words rise once on a full page load (the inline script marks it; React does not run the script on an in-site
// navigation, where the stage's own arrival plays instead).
const LOADED = `try{var e=document.currentScript.parentElement;if(!matchMedia("(prefers-reduced-motion: reduce)").matches)e.setAttribute("data-load","")}catch(e){}`;
export const HANDOFF_EVENT = "agent-kit:handoff";
// Arriving at the guide from Start here, a new visitor is offered a free account there (StartWelcome.tsx).
const markStartHere = () => { try { sessionStorage.setItem("agent-kit:start-here", String(Date.now())); } catch {} };

export function HomeHero() {
  const install = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    // A result left by an earlier press (within its 10-second life) must not answer for this one: clear it before
    // asking the clipboard, so the install page waits for this press's own answer.
    clearHandoff();
    let copied: Promise<boolean>;
    try { copied = navigator.clipboard.writeText(INSTALL_MESSAGE).then(() => true, () => false); } catch { copied = Promise.resolve(false); }
    copied.then((ok) => { saveHandoff(ok ? { message: true } : { blocked: true }); dispatchEvent(new Event(HANDOFF_EVENT)); });
  };
  // The light that gathers under the pointer on hover (stage.css, .launch__fx::after).
  const aim = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  const lines = HERO.headline.split(" ");
  return (
    <section className="hero" aria-labelledby="hero-h" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: LOADED }} />
      <div className="hero__msg">
        <h1 id="hero-h">{lines.map((w, i) => <span key={i} className="hero__w" style={{ "--i": i } as React.CSSProperties}>{w}{i < lines.length - 1 ? " " : ""}</span>)}</h1>
        <p className="hero__lede">Skills and prompts for Claude Code, Codex and Cursor.</p>
        <div className="hero__cta">
          <Link className="launch__go" href="/install" onClick={install} onPointerMove={aim}>
            <span className="launch__fx" aria-hidden="true" />
            <span className="launch__label">
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="12" height="12" rx="3" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
              Install Agent Kit
            </span>
          </Link>
        </div>
      </div>
      <ul className="hero__foot" aria-label="About this site">
        <li className="hero__new"><Link href="/start" onClick={markStartHere}>New to coding agents?<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></Link></li>
        <li><Link href="/about">About</Link></li>
        <li><Link href="/privacy">Privacy</Link></li>
        <li><Link href="/terms">Terms</Link></li>
        <li><a href={`${SITE.repo}/blob/main/CREDITS.md`}>Credits</a></li>
        <li><Link href="/horizon/about">About this view</Link></li>
      </ul>
    </section>
  );
}
