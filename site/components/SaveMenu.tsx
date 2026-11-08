"use client";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

type Me = { signedIn: boolean; collections?: { id: string; name: string; is_starred: boolean }[]; items?: { collection_id: string; kind: string; ref: string }[] };
let cache: Promise<Me> | null = null;
const load = (fresh = false) => { if (fresh || !cache) cache = fetch("/api/me", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ signedIn: false })); return cache; };

// Star and "Save to collection" for one prompt or skill. Signed out, both open sign-in.
export function SaveMenu({ kind, refId, title }: { kind: "prompt" | "skill"; refId: string; title: string }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pop = useRef<HTMLDivElement>(null);

  useEffect(() => { if (isSignedIn) load(true).then(setMe); }, [isSignedIn]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => { if (e instanceof KeyboardEvent ? e.key === "Escape" : !pop.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  if (!isLoaded) return <button className="btn btn--sm" type="button" disabled>Star</button>;
  if (!isSignedIn) return <SignInButton mode="modal" withSignUp><button className="btn btn--sm" type="button">Star</button></SignInButton>;

  const starred = me?.collections?.find((c) => c.is_starred);
  const inC = (id?: string) => Boolean(id && me?.items?.some((i) => i.collection_id === id && i.kind === kind && i.ref === refId));
  async function act(body: Record<string, unknown>) {
    setBusy(true); setError("");
    const r = await fetch("/api/me", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, ref: refId, ...body }) });
    if (!r.ok) setError(((await r.json().catch(() => ({}))) as { error?: string }).error || "That didn't save. Try again.");
    setMe(await load(true)); setBusy(false);
  }
  const isStar = inC(starred?.id);

  return (
    <div className="toolbar">
      <button className="btn btn--sm" type="button" aria-pressed={isStar} disabled={busy || !me}
        aria-label={`${isStar ? "Unstar" : "Star"} ${title}`} onClick={() => act({ on: !isStar })}>
        {isStar ? "Starred" : "Star"}
      </button>
      <div className="menu" ref={pop}>
        <button className="btn btn--sm" type="button" aria-expanded={open} disabled={!me} onClick={() => setOpen((o) => !o)}>Save to…</button>
        {open && me && (
          <div className="menu__pop" role="menu">
            {me.collections?.filter((c) => !c.is_starred).map((c) => (
              <button key={c.id} type="button" role="menuitemcheckbox" aria-checked={inC(c.id)} disabled={busy}
                onClick={() => act({ collectionId: c.id, on: !inC(c.id) })}>
                <span>{c.name}</span><span className="muted">{inC(c.id) ? "Saved" : ""}</span>
              </button>
            ))}
            <button type="button" role="menuitem" disabled={busy} onClick={() => {
              const name = prompt("Name the new collection");
              if (name?.trim()) act({ newCollection: name.trim(), on: true });
            }}>New collection…</button>
            <a href="/account" role="menuitem">Your collections</a>
          </div>
        )}
      </div>
      {error && <span className="note" role="status">{error}</span>}
    </div>
  );
}
