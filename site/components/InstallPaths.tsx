"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signedIn } from "@/lib/auth-hint";
import { signInHref } from "./AuthNav";
import { Chevron, PlaceIcon } from "./PlaceIcon";

// The install page's two ways on, as two full-width rows under the install panel: a free account, and Explore. Both
// are optional; installing and browsing need neither.
//
// The account row links to sign-in, which comes back to /install (Clerk's form signs in or creates an account on the
// same page). Signed in, it becomes the way to their collections. Both versions are in the page and CSS picks one from
// html[data-auth] (set before paint), so nothing swaps on load; the cookie is read again when the tab regains focus,
// so signing in from another tab updates it. After the visitor opens an agent (nudge), the account row comes forward:
// they are back on this tab with a moment to spare, and Explore stays right under it.
//
// Explore opens a drawer (a modal <dialog>) that lists each part of the site and goes straight to it, with
// an account entry at its foot for someone signed out. It slides in and out; Escape, the close button and a click on
// the dimmed page all close it, and focus returns to Explore.
export const Ext = () => <svg className="inst__ext" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Arrow = () => <svg className="inst__arrow" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const Close = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>;

// The light under the pointer on hover, as on the homepage's button (HomeHero.tsx).
const aim = (e: React.PointerEvent<HTMLElement>) => {
  if (e.pointerType !== "mouse") return;
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};

export type Place = { href: string; title: string; icon: string };

export function InstallPaths({ account, places, nudge }: { account: boolean; places: Place[]; nudge?: boolean }) {
  const [signed, setSigned] = useState<boolean | null>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!account) return;
    const ask = () => setSigned(signedIn(document.cookie));
    ask();
    addEventListener("focus", ask); document.addEventListener("visibilitychange", ask);
    return () => { removeEventListener("focus", ask); document.removeEventListener("visibilitychange", ask); };
  }, [account]);

  // Close with the sheet sliding away first (immediately under reduced motion).
  const close = () => {
    const d = drawer.current;
    if (!d?.open || d.hasAttribute("data-closing")) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { d.close(); return; }
    d.setAttribute("data-closing", "");
    setTimeout(() => { d.removeAttribute("data-closing"); d.close(); }, 220);
  };
  const cancel = (e: React.SyntheticEvent<HTMLDialogElement>) => { e.preventDefault(); close(); };
  // A click on the dimmed page (the dialog element itself, outside its sheet) closes it.
  const backdrop = (e: React.MouseEvent<HTMLDialogElement>) => { if (e.target === e.currentTarget) close(); };
  const search = () => { drawer.current?.close(); dispatchEvent(new Event("agent-kit:search")); };
  const href = signInHref("/install");

  return (
    <nav className="inst__paths" aria-label="Next" data-account={account || undefined} data-signed={signed === null ? undefined : signed ? "yes" : "no"} data-nudge={nudge || undefined}>
      {account && (
        <>
          <Link className="inst__row inst__row--acct inst__row--out" href={href}>
            <span className="inst__rowt">Create a free account</span>
            <span className="inst__rowl">Keep your favourite prompts and skills.</span>
            <Arrow />
          </Link>
          <Link className="inst__row inst__row--acct inst__row--in" href="/account">
            <span className="inst__rowt">Your collections</span>
            <span className="inst__rowl">Everything you have starred, in one place.</span>
            <Arrow />
          </Link>
        </>
      )}
      {/* The homepage's Install button, the same object and the same hover light (stage.css, .launch__go). */}
      <button type="button" className="launch__go inst__explore" aria-haspopup="dialog" onClick={() => drawer.current?.showModal()} onPointerMove={aim}>
        <span className="launch__fx" aria-hidden="true" />
        <span className="launch__label"><svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></svg>Explore Agent Kit</span>
      </button>

      <dialog ref={drawer} className="inst__drawer" aria-labelledby="drawer-h" onClick={backdrop} onCancel={cancel}>
        <div className="inst__drawerin">
          <div className="inst__drawerhead">
            <h2 id="drawer-h" tabIndex={-1} autoFocus>Explore Agent Kit</h2>
            <button type="button" className="inst__close" onClick={close} aria-label="Close"><Close /></button>
          </div>
          <button type="button" className="inst__dsearch" onClick={search}>
            <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
            Search everything
          </button>
          <ul className="places">
            {places.map((p) => (
              <li key={p.href}><Link href={p.href}><PlaceIcon name={p.icon} /><span>{p.title}</span><Chevron /></Link></li>
            ))}
          </ul>
          {account && (
            <div className="inst__dacct">
              <p>Keep what you find useful.</p>
              <Link className="inst__djoin" href={href}>Create a free account</Link>
            </div>
          )}
        </div>
      </dialog>
    </nav>
  );
}
