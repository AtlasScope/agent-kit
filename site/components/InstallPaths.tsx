"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signedIn } from "@/lib/auth-hint";
import { signInHref } from "./AuthNav";
import { StarIcon } from "./StarIcon";

// The install page's two ways on, side by side under the install panel: keep things with a free account, or explore
// the site. Both are optional; installing and browsing need neither.
//
// The account path shows to a visitor who isn't signed in and links to sign-in, which comes back to /install (Clerk's
// form signs in or creates an account from the same page). Signed in, it becomes a way to their collections. Both
// versions are in the page and CSS picks one from html[data-auth] (set before paint), so nothing swaps on load; the
// cookie is read again when the tab regains focus, so signing in from another tab updates it too.
//
// Explore opens a drawer (a modal <dialog>) that names each part of the site in a line and goes straight to it.
export const Ext = () => <svg className="inst__ext" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Arrow = () => <svg className="i inst__go" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Compass = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></svg>;
const Close = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>;

export type Place = { href: string; title: string; line: string };

export function InstallPaths({ account, places }: { account: boolean; places: Place[] }) {
  const [signed, setSigned] = useState<boolean | null>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!account) return;
    const ask = () => setSigned(signedIn(document.cookie));
    ask();
    addEventListener("focus", ask); document.addEventListener("visibilitychange", ask);
    return () => { removeEventListener("focus", ask); document.removeEventListener("visibilitychange", ask); };
  }, [account]);
  // A click on the dimmed backdrop (the dialog itself, outside its panel) closes it.
  const backdrop = (e: React.MouseEvent<HTMLDialogElement>) => { if (e.target === e.currentTarget) e.currentTarget.close(); };
  const search = () => { drawer.current?.close(); dispatchEvent(new Event("agent-kit:search")); };
  const href = signInHref("/install");

  return (
    <div className="inst__paths" data-account={account || undefined} data-signed={signed === null ? undefined : signed ? "yes" : "no"}>
      {account && (
        <>
          <section className="inst__path inst__path--out" aria-labelledby="path-acct-h">
            <span className="inst__pathmark" aria-hidden="true"><StarIcon on /></span>
            <h2 id="path-acct-h">Keep what works</h2>
            <p>Star prompts and skills, group them into collections and come back to them on any computer. Free.</p>
            <div className="inst__pathdo">
              <Link className="inst__join" href={href}>Create a free account</Link>
              <Link className="inst__quiet" href={href}>Sign in</Link>
            </div>
          </section>
          <section className="inst__path inst__path--in" aria-labelledby="path-in-h">
            <span className="inst__pathmark" aria-hidden="true"><StarIcon on /></span>
            <h2 id="path-in-h">You’re signed in</h2>
            <p>Star prompts and skills as you browse. They wait for you in Collections.</p>
            <div className="inst__pathdo">
              <Link className="inst__join" href="/account">Your collections</Link>
            </div>
          </section>
        </>
      )}
      <section className="inst__path" aria-labelledby="path-explore-h">
        <span className="inst__pathmark" aria-hidden="true"><Compass /></span>
        <h2 id="path-explore-h">Explore Agent Kit</h2>
        <p>Prompts, skills and fixes for the work in front of you, ready to copy.</p>
        <div className="inst__pathdo">
          <button type="button" className="inst__explore" aria-haspopup="dialog" onClick={() => drawer.current?.showModal()}>Explore</button>
        </div>
      </section>

      <dialog ref={drawer} className="inst__drawer" aria-labelledby="drawer-h" onClick={backdrop}>
        <div className="inst__drawerin">
          <div className="inst__drawerhead">
            <h2 id="drawer-h">Explore Agent Kit</h2>
            <button type="button" className="inst__close" onClick={() => drawer.current?.close()} aria-label="Close"><Close /></button>
          </div>
          <button type="button" className="inst__dsearch" onClick={search}>
            <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
            Search everything
          </button>
          <ul className="inst__places">
            {places.map((p) => (
              <li key={p.href}><Link href={p.href}><span className="inst__placet">{p.title}</span><span className="inst__placel">{p.line}</span><Arrow /></Link></li>
            ))}
          </ul>
        </div>
      </dialog>
    </div>
  );
}
