"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { OFFER_KEY, accountOffer, signedIn } from "@/lib/auth-hint";
import { signInHref } from "./AuthNav";
import { StarIcon } from "./StarIcon";

// The install page's account offer, between the install panel and what to try first. The kits put skills into the
// agent; the library stays on the site, so the reason to sign up is to keep what you find there: a star (Starred, on
// /account), named collections, and a shared collection that installs its skills with one command. It is offered to
// anyone not signed in, before or after a copy (accountOffer, lib/auth-hint.ts); Not now hides it for the browser
// session. Both buttons open sign-in in a new tab, so the install panel stays put; Clerk's form signs in or creates an
// account from the same page. When the visitor comes back signed in, the offer becomes one line saying where their
// stars go.
// The new-tab mark, shared with the agent buttons on the install page.
export const Ext = () => <svg className="inst__ext" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const NEW_TAB = <><Ext /><span className="sr"> (opens in a new tab)</span></>;
const Folder = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /></svg>;
const Share = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>;

export function AccountOffer({ prompts, skills, onDone }: { prompts: number; skills: number; onDone?: () => void }) {
  const [signed, setSigned] = useState<boolean | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [view, setView] = useState("");
  const [later, setLater] = useState(false);

  useEffect(() => {
    // The page load this offer belongs to: the same through a remount, new on a reload.
    setView(String(Math.round(performance.timeOrigin)));
    try { setSaved(sessionStorage.getItem(OFFER_KEY)); } catch {}
    const ask = () => setSigned(signedIn(document.cookie));
    ask();
    addEventListener("focus", ask); document.addEventListener("visibilitychange", ask);
    return () => { removeEventListener("focus", ask); document.removeEventListener("visibilitychange", ask); };
  }, []);

  // Until the browser has answered, the offer renders as it will for most visitors, so nothing below it moves when
  // the answer comes. Someone signed in, or who said Not now this session, never sees it: the install page's before-paint
  // script marks both and install.css hides it (html[data-auth], .inst[data-no-offer]).
  const offer = later ? null : signed === null || !view ? "offer" : accountOffer({ signedIn: signed, saved, view });
  // Remember it was offered on this load, so coming back signed in turns it into the welcome.
  useEffect(() => {
    if (offer !== "offer" || signed !== false || !view || saved === `shown:${view}`) return;
    const v = `shown:${view}`;
    try { sessionStorage.setItem(OFFER_KEY, v); } catch {}
    setSaved(v);
  }, [offer, signed, saved, view]);

  const notNow = () => {
    try { sessionStorage.setItem(OFFER_KEY, "later"); } catch {}
    setLater(true);
    onDone?.();
  };

  if (offer === "welcome") return (
    <p className="inst__welcome" role="status">
      <span className="inst__welcome-star" aria-hidden="true"><StarIcon on /></span>
      <span>You’re signed in. Star a prompt or skill and it shows up in <Link href="/account">Collections</Link>.</span>
    </p>
  );
  if (offer !== "offer") return null;
  const href = signInHref("/account");
  return (
    <section className="inst__acct" aria-labelledby="inst-acct-h">
      <div className="inst__acct-say">
        <h2 id="inst-acct-h">Keep what you find useful</h2>
        <p>A free account saves prompts and skills from the library, so they are there the next time you need them.</p>
      </div>
      <ul className="inst__acct-perks">
        <li><StarIcon on={false} /><span><b>Star</b> any of the {prompts} prompts and {skills} skills</span></li>
        <li><Folder /><span><b>Collections</b> group them by project or job</span></li>
        <li><Share /><span><b>Share</b> a collection; its skills install with one command</span></li>
      </ul>
      <div className="inst__acct-do">
        <Link className="inst__join" href={href} target="_blank" rel="noopener noreferrer">Create a free account{NEW_TAB}</Link>
        <span className="inst__acct-alt">
          <Link className="inst__again" href={href} target="_blank" rel="noopener noreferrer">Sign in{NEW_TAB}</Link>
          <button type="button" className="inst__again" onClick={notNow}>Not now</button>
        </span>
      </div>
    </section>
  );
}
