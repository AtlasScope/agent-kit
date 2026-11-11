"use client";
import { ClerkProvider, Show, SignIn, SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { useMe, loadMe, saveItem, isIn } from "@/lib/me";
import { StarIcon, type StarProps } from "../StarIcon";

// Everything that needs Clerk in the browser, in one chunk that AuthGate loads only when it is needed.

function Root({ children }: { children: React.ReactNode }) {
  return <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-in" appearance={clerkAppearance}>{children}</ClerkProvider>;
}

function AuthNav() {
  return (
    <>
      <Show when="signed-out"><SignInButton mode="modal" withSignUp><button className="btn btn--sm" type="button">Sign in</button></SignInButton></Show>
      <Show when="signed-in">
        <a className="btn btn--sm" href="/account">
          <svg className="i i--warm" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>
          Starred
        </a>
        <UserButton />
      </Show>
    </>
  );
}

function Star({ kind, refId, title, label }: StarProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const m = useMe();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { if (isSignedIn) loadMe(); }, [isSignedIn]);

  const cls = `star${label ? " star--label" : ""}`;
  if (!isLoaded || !isSignedIn) {
    const btn = (
      <button className={cls} type="button" aria-label={`Star ${title}`} title="Sign in to star" disabled={!isLoaded}>
        <StarIcon on={false} />{label && <span>Star</span>}
      </button>
    );
    return isLoaded ? <SignInButton mode="modal" withSignUp>{btn}</SignInButton> : btn;
  }
  const starred = m?.collections?.find((c) => c.is_starred);
  const on = isIn(m, starred?.id, kind, refId);
  return (
    <>
      <button className={cls} type="button" aria-pressed={on} disabled={busy || !m}
        aria-label={`Star ${title}`} title={on ? "Starred. Click to remove." : "Star"}
        onClick={async () => { setBusy(true); setErr(await saveItem({ kind, ref: refId, on: !on })); setBusy(false); }}>
        <StarIcon on={on} />{label && <span>{on ? "Starred" : "Star"}</span>}
      </button>
      {/* Rendered only when there is an error, so on a card the star stays the last item in its row. */}
      {err && <span className="note" role="alert">{err}</span>}
    </>
  );
}

function SignedIn({ children }: { children: React.ReactNode }) {
  return <Show when="signed-in">{children}</Show>;
}

export const parts = { Root, AuthNav, Star, SignedIn, SignIn };
export type ClerkParts = typeof parts;
