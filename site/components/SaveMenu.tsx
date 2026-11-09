"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { Star, useMe, loadMe, getMe, saveItem, isIn } from "./Star";

// Star plus "Save to collection" for one prompt or skill page.
export function SaveMenu({ kind, refId, title }: { kind: "prompt" | "skill"; refId: string; title: string }) {
  const { isSignedIn } = useAuth();
  const me = useMe();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pop = useRef<HTMLDivElement>(null);

  useEffect(() => { if (isSignedIn && !getMe()) loadMe(); }, [isSignedIn]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => { if (e instanceof KeyboardEvent ? e.key === "Escape" : !pop.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  async function act(body: Record<string, unknown>) {
    setBusy(true); setError(await saveItem({ kind, ref: refId, ...body })); setBusy(false);
  }

  return (
    <>
      <Star kind={kind} refId={refId} title={title} label />
      {isSignedIn && (
        <div className="menu" ref={pop}>
          <button className="btn btn--sm" type="button" aria-expanded={open} disabled={!me} onClick={() => setOpen((o) => !o)}>Save to…</button>
          {open && me && (
            <div className="menu__pop" role="menu">
              {me.collections?.filter((c) => !c.is_starred).map((c) => (
                <button key={c.id} type="button" role="menuitemcheckbox" aria-checked={isIn(me, c.id, kind, refId)} disabled={busy}
                  onClick={() => act({ collectionId: c.id, on: !isIn(me, c.id, kind, refId) })}>
                  <span>{c.name}</span><span className="muted">{isIn(me, c.id, kind, refId) ? "Saved" : ""}</span>
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
      )}
      {error && <span className="note" role="status">{error}</span>}
    </>
  );
}
