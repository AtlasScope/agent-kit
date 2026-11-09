"use client";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { useEffect, useState, useSyncExternalStore } from "react";

export type Me = { signedIn: boolean; collections?: { id: string; name: string; is_starred: boolean }[]; items?: { collection_id: string; kind: string; ref: string }[] };

// One shared copy of the signed-in state, so every star on a page loads it once and updates together.
let me: Me | null = null;
let inflight: Promise<Me> | null = null;
let startedAt = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
export const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const getMe = () => me;
// Cards mounted together share one request; a later mount (after navigating back, or after
// changing collections on /account) fetches again so stars never show stale state.
export function loadMe(fresh = false) {
  if (!fresh && inflight && Date.now() - startedAt < 2000) return inflight;
  startedAt = Date.now();
  inflight = fetch("/api/me", { cache: "no-store" }).then((r) => r.json() as Promise<Me>).catch(() => ({ signedIn: false }))
    .then((m) => { me = m; emit(); return m; });
  return inflight;
}
export async function saveItem(body: Record<string, unknown>) {
  const r = await fetch("/api/me", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const err = r.ok ? "" : ((await r.json().catch(() => ({}))) as { error?: string }).error || "That didn't save. Try again.";
  await loadMe(true);
  return err;
}
export const useMe = () => useSyncExternalStore(subscribe, getMe, () => null);
export const isIn = (m: Me | null, collectionId: string | undefined, kind: string, ref: string) =>
  Boolean(collectionId && m?.items?.some((i) => i.collection_id === collectionId && i.kind === kind && i.ref === ref));

const Icon = ({ on }: { on: boolean }) => (
  <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
  </svg>
);

const authOn = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// A star for one prompt or skill. Signed out, it opens sign-in; signed in, it adds to or removes from Starred.
export function Star(props: { kind: "prompt" | "skill"; refId: string; title: string; label?: boolean }) {
  if (!authOn) return null;
  return <StarInner {...props} />;
}

function StarInner({ kind, refId, title, label }: { kind: "prompt" | "skill"; refId: string; title: string; label?: boolean }) {
  const { isSignedIn, isLoaded } = useAuth();
  const m = useMe();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { if (isSignedIn) loadMe(); }, [isSignedIn]);

  const cls = `star${label ? " star--label" : ""}`;
  if (!isLoaded || !isSignedIn) {
    const btn = (
      <button className={cls} type="button" aria-label={`Star ${title}`} title="Sign in to star" disabled={!isLoaded}>
        <Icon on={false} />{label && <span>Star</span>}
      </button>
    );
    return isLoaded ? <SignInButton mode="modal" withSignUp>{btn}</SignInButton> : btn;
  }
  const starred = m?.collections?.find((c) => c.is_starred);
  const on = isIn(m, starred?.id, kind, refId);
  return (
    <>
      <button className={cls} type="button" aria-pressed={on} disabled={busy || !m}
        aria-label={`${on ? "Unstar" : "Star"} ${title}`} title={on ? "Starred. Click to remove." : "Star"}
        onClick={async () => { setBusy(true); setErr(await saveItem({ kind, ref: refId, on: !on })); setBusy(false); }}>
        <Icon on={on} />{label && <span>{on ? "Starred" : "Star"}</span>}
      </button>
      {err && <span className="note" role="status">{err}</span>}
    </>
  );
}
