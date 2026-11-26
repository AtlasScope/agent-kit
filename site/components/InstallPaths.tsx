"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signedIn } from "@/lib/auth-hint";
import { signInHref } from "./AuthNav";

// The install page's two ways on, as two full-width rows under the install panel: a free account, and Explore. Both
// are optional; installing and browsing need neither.
//
// The account row links to sign-in, which comes back to /install (Clerk's form signs in or creates an account on the
// same page). Signed in, it becomes the way to their collections. Both versions are in the page and CSS picks one from
// html[data-auth] (set before paint), so nothing swaps on load; the cookie is read again when the tab regains focus,
// so signing in from another tab updates it. After the visitor opens an agent (nudge), the account row comes forward:
// they are back on this tab with a moment to spare, and Explore stays right under it.
//
// Explore opens a drawer (a modal <dialog>) that names each part of the site in a line and goes straight to it, with
// an account entry at its foot for someone signed out. It slides in and out; Escape, the close button and a click on
// the dimmed page all close it, and focus returns to Explore.
export const Ext = () => <svg className="inst__ext" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Arrow = () => <svg className="inst__arrow" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const Chevron = () => <svg className="i inst__go" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Close = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>;
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const ICONS: Record<string, React.ReactNode> = {
  prompts: <path {...stroke} d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16h-8l-4.5 3.5V16H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5z" />,
  skills: <path {...stroke} d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8zM3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5" />,
  kits: <path {...stroke} d="m12 3 8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9" />,
  fix: <path {...stroke} d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3zM14.5 6.5 17 4l3 3-2.5 2.5" />,
  start: <path {...stroke} d="M3 9.5 12 5l9 4.5-9 4.5zM7 11.5v4c1.5 1.3 3.2 2 5 2s3.5-.7 5-2v-4M21 9.5V14" />,
};

export type Place = { href: string; title: string; line: string; icon: string };

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
      <button type="button" className="inst__row inst__row--explore" aria-haspopup="dialog" onClick={() => drawer.current?.showModal()}>
        <span className="inst__rowt">Explore Agent Kit</span>
        <Arrow />
      </button>

      <dialog ref={drawer} className="inst__drawer" aria-labelledby="drawer-h" onClick={backdrop} onCancel={cancel}>
        <div className="inst__drawerin">
          <div className="inst__drawerhead">
            <h2 id="drawer-h">Explore Agent Kit</h2>
            <button type="button" className="inst__close" onClick={close} aria-label="Close"><Close /></button>
          </div>
          <button type="button" className="inst__dsearch" onClick={search}>
            <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
            Search everything
          </button>
          <ul className="inst__places">
            {places.map((p) => (
              <li key={p.href}><Link href={p.href}>
                <svg className="i inst__placei" viewBox="0 0 24 24" aria-hidden="true">{ICONS[p.icon]}</svg>
                <span className="inst__placet">{p.title}</span><span className="inst__placel">{p.line}</span><Chevron />
              </Link></li>
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
