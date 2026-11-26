"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { OFFER_KEY, accountOffer, signedIn } from "@/lib/auth-hint";
import { signInHref } from "./AuthNav";
import { StarIcon } from "./StarIcon";

// The install page's account offer: the foot of the install panel itself, under "Then try one". The kits put skills
// into the agent; the library stays on the site, so the reason to sign up is to keep what you find there: a star
// (Starred, on /account), named collections, and sharing. It is offered to anyone not signed in, before or after a
// copy (accountOffer, lib/auth-hint.ts); Not now hides it for the browser session. Both links go to sign-in and come
// back to /install (Clerk's form signs in or creates an account from the same page), where a star pressed on the way
// finishes (lib/intent.ts) and the offer becomes one line saying where stars go.
// The new-tab mark, shared with the agent buttons on the install page.
export const Ext = () => <svg className="inst__ext" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;

export function AccountOffer({ onDone }: { onDone?: () => void }) {
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
      <span>You’re signed in. Star a prompt or skill and it waits for you in <Link href="/account">Collections</Link>.</span>
    </p>
  );
  if (offer !== "offer") return null;
  const href = signInHref("/install");
  return (
    <div className="inst__acct" role="region" aria-labelledby="inst-acct-h">
      <span className="inst__acct-mark" aria-hidden="true"><StarIcon on /></span>
      <div className="inst__acct-say">
        <h2 id="inst-acct-h">Keep what works</h2>
        <p>A free account keeps the prompts and skills you star, in collections you can return to and share. Installing and browsing stay free without one.</p>
      </div>
      <div className="inst__acct-do">
        <Link className="inst__join" href={href}>Create a free account</Link>
        <span className="inst__acct-alt">
          <Link className="inst__again" href={href}>Sign in</Link>
          <button type="button" className="inst__again" onClick={notNow}>Not now</button>
        </span>
      </div>
    </div>
  );
}
