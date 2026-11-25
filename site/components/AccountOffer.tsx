"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { OFFER_KEY, accountOffer, signedIn } from "@/lib/auth-hint";
import { signInHref } from "./AuthNav";
import { StarIcon } from "./StarIcon";

// The install page's account offer, under the Copied panel. The kits put skills into the agent; the prompts stay on the
// site, so the reason to sign up is to keep the prompts you use, which is what a star does today (Starred, on /account).
// It appears once a copy has really succeeded, only to a visitor who isn't signed in, once per browser session
// (accountOffer, lib/auth-hint.ts). Not now hides it for the session. Both buttons open sign-in in a new tab, so the
// agent buttons above stay put; Clerk's form signs in or creates an account from the same page. When the visitor comes
// back signed in, the offer becomes one line saying where their stars go.
// The new-tab mark, shared with the agent buttons on the install page.
export const Ext = () => <svg className="inst__ext" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const NEW_TAB = <><Ext /><span className="sr"> (opens in a new tab)</span></>;

export function AccountOffer({ copied, prompts, picks, onDone }: { copied: boolean; prompts: number; picks: string[]; onDone?: () => void }) {
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

  const offer = signed === null || !view || later ? null : accountOffer({ copied, signedIn: signed, saved, view });
  // Remember it was offered on this load, so a reload or a later visit in this session doesn't offer it again.
  useEffect(() => {
    if (offer !== "offer" || saved === `shown:${view}`) return;
    const v = `shown:${view}`;
    try { sessionStorage.setItem(OFFER_KEY, v); } catch {}
    setSaved(v);
  }, [offer, saved, view]);

  const notNow = () => {
    try { sessionStorage.setItem(OFFER_KEY, "later"); } catch {}
    setLater(true);
    onDone?.();
  };

  if (offer === "welcome") return (
    <p className="inst__welcome" role="status">
      <span className="inst__welcome-star" aria-hidden="true"><StarIcon on /></span>
      <span>You’re signed in. Star a prompt and it shows up in <Link href="/account">Collections</Link>.</span>
    </p>
  );
  if (offer !== "offer") return null;
  const href = signInHref("/account");
  return (
    <section className="inst__acct" aria-labelledby="inst-acct-h">
      <span className="inst__acct-rim" aria-hidden="true" />
      <div className="inst__acct-say">
        <h2 id="inst-acct-h">Keep the prompts you use</h2>
        <p>Your agent has the skills now. Star any of the {prompts} prompts and find them in one list, wherever you sign in.</p>
      </div>
      {picks.length > 0 && (
        <div className="inst__acct-list" aria-hidden="true">
          <span className="inst__acct-head"><StarIcon on />Starred</span>
          {picks.map((t, i) => <span key={t} className="inst__acct-row" style={{ "--i": i } as React.CSSProperties}><span className="inst__acct-title">{t}</span><StarIcon on /></span>)}
        </div>
      )}
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
