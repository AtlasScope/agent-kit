"use client";
import { ClerkProvider, Show, SignIn, SignInButton, UNSAFE_PortalProvider, UserButton, useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { useMe, loadMe, saveItem, isIn } from "@/lib/me";
import { StarIcon, type StarProps } from "../StarIcon";
import { saveIntent, takeIntent } from "@/lib/intent";

// Everything that needs Clerk in the browser, in one chunk that AuthGate loads only when it is needed.

function Root({ children }: { children: React.ReactNode }) {
  return <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-in" appearance={clerkAppearance}>{children}</ClerkProvider>;
}

function AuthNav() {
  // In the phone and tablet menu (a modal dialog) the account menu must open inside the dialog to be usable;
  // in the bar it opens over the page as usual. Clerk's portal provider points it at the nearest dialog, if any.
  const at = useRef<HTMLSpanElement>(null);
  return (
    <>
      <Show when="signed-out"><SignInButton mode="modal" withSignUp><button className="btn btn--sm" type="button">Sign in</button></SignInButton></Show>
      <Show when="signed-in">
        <a className="btn btn--sm auth-coll" href="/account" aria-label="Collections">
          <svg className="i i--warm" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>
          <span>Collections</span>
        </a>
        <span ref={at} className="auth-me"><UNSAFE_PortalProvider getContainer={() => at.current?.closest("dialog") ?? null}><UserButton /></UNSAFE_PortalProvider></span>
      </Show>
    </>
  );
}

function Star({ kind, refId, title, label }: StarProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const m = useMe();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // Starred because they pressed this star before signing in (lib/intent.ts): said once, then the button speaks.
  const [kept, setKept] = useState(false);
  useEffect(() => { if (isSignedIn) loadMe(); }, [isSignedIn]);
  const starredId = m?.collections?.find((c) => c.is_starred)?.id;
  const already = isIn(m, starredId, kind, refId);
  useEffect(() => {
    if (!isSignedIn || !m || !takeIntent(kind, refId)) return;
    if (already) { setKept(true); return; }
    setBusy(true);
    saveItem({ kind, ref: refId, on: true }).then((e) => { setErr(e); setKept(!e); setBusy(false); });
  }, [isSignedIn, m, kind, refId, already]);
  useEffect(() => { if (!kept) return; const t = setTimeout(() => setKept(false), 8000); return () => clearTimeout(t); }, [kept]);

  const cls = `star${label ? " star--label" : ""}`;
  if (!isLoaded || !isSignedIn) {
    const btn = (
      <button className={cls} type="button" aria-label={`Star ${title}`} title="Sign in to star" disabled={!isLoaded}>
        <StarIcon on={false} />{label && <span>Star</span>}
      </button>
    );
    return isLoaded ? <SignInButton mode="modal" withSignUp><span className="star-wrap" onClickCapture={() => saveIntent(kind, refId)}>{btn}</span></SignInButton> : btn;
  }
  const on = already;
  return (
    <>
      <button className={cls} type="button" aria-pressed={on} disabled={busy || !m}
        aria-label={`Star ${title}`} title={on ? "Starred. Click to remove." : "Star"}
        onClick={async () => { setBusy(true); setErr(await saveItem({ kind, ref: refId, on: !on })); setBusy(false); }}>
        <StarIcon on={on} />{label && <span>{on ? "Starred" : "Star"}</span>}
      </button>
      {/* Rendered only when there is an error, so on a card the star stays the last item in its row. */}
      {err && <span className="note" role="alert">{err}</span>}
      {kept && !err && <span className="note star-kept" role="status">Starred. It’s in <a href="/account">Collections</a>.</span>}
    </>
  );
}

function SignedIn({ children }: { children: React.ReactNode }) {
  return <Show when="signed-in">{children}</Show>;
}

export const parts = { Root, AuthNav, Star, SignedIn, SignIn };
export type ClerkParts = typeof parts;
