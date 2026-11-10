"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { Star, useMe, loadMe, saveItem, isIn } from "./Star";

// Star plus "Save to collection" for one prompt or skill page.
export function SaveMenu({ kind, refId, title }: { kind: "prompt" | "skill"; refId: string; title: string }) {
  const { isSignedIn } = useAuth();
  const me = useMe();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pop = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => { if (isSignedIn) loadMe(); }, [isSignedIn]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) { if (e.key === "Escape") { setOpen(false); trigger.current?.focus(); } }
      else if (!pop.current?.contains(e.target as Node)) setOpen(false);
    };
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
          <button ref={trigger} className="btn btn--sm" type="button" aria-expanded={open} aria-controls={`save-${refId}`} disabled={!me} onClick={() => setOpen((o) => !o)}>Save to…</button>
          {open && me && (
            <div className="menu__pop" id={`save-${refId}`} role="group" aria-label={`Save ${title} to a collection`}>
              {me.collections?.filter((c) => !c.is_starred).map((c) => (
                <button key={c.id} type="button" aria-pressed={isIn(me, c.id, kind, refId)} disabled={busy}
                  onClick={() => act({ collectionId: c.id, on: !isIn(me, c.id, kind, refId) })}>
                  <span>{c.name}</span><span className="muted">{isIn(me, c.id, kind, refId) ? "Saved" : ""}</span>
                </button>
              ))}
              <button type="button" disabled={busy} onClick={() => {
                const name = prompt("Name the new collection");
                if (name?.trim()) act({ newCollection: name.trim(), on: true });
              }}>New collection…</button>
              <a href="/account">Your collections</a>
            </div>
          )}
        </div>
      )}
      <span className="note" role="status">{error}</span>
    </>
  );
}
