"use client";
import { useEffect, useRef } from "react";
import { KEY } from "./boot";

export type RailEntry = { id: string; name: string; count: number; starred: boolean; state: string };

const NARROW = "(max-width: 60rem)";
const STAR = <svg className="i i--warm" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>;

// The hash without its #, decoded; a malformed escape is read as no hash at all.
export function hashId() {
  try { return decodeURIComponent(location.hash.slice(1)); } catch { return ""; }
}

function pick(ids: string[]) {
  const h = hashId();
  let r: string | null = null;
  try { r = localStorage.getItem(KEY); } catch {}
  const hit = ids.includes(h);
  return { sel: hit ? h : r && ids.includes(r) ? r : ids[0], view: hit ? "detail" : "list", fromHash: hit };
}

// The Collections workspace: a rail of collections and the panels they open. Selection is plain DOM state
// on <html> (data-ws-sel, data-ws-view) so the inline script and React agree without a re-render.
export function Workspace({ rail, newCollection, boot, children }: { rail: RailEntry[]; newCollection: React.ReactNode; boot: React.ReactNode; children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const ids = rail.map((r) => r.id);
  const idKey = ids.join(" ");
  const prev = useRef<string[] | null>(null);
  // A collection just created here, waiting for its hashchange. A ref, so it survives the effect re-running
  // (another revalidation) before the event fires.
  const landing = useRef<string | null>(null);
  const openedFromList = useRef(false);

  useEffect(() => {
    const w = root.current;
    if (!w) return;
    const list = idKey.split(" ");
    const d = document.documentElement;
    const openBefore = d.getAttribute("data-ws-sel");

    const apply = (focus: boolean | "panel" | "landed") => {
      const { sel, view, fromHash } = pick(list);
      const was = d.getAttribute("data-ws-sel");
      d.setAttribute("data-ws-sel", sel);
      d.setAttribute("data-ws-view", view);
      w.querySelectorAll<HTMLAnchorElement>("[data-for]").forEach((a) => {
        if (a.dataset.for === sel) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
      // Remember what the hash opened; after a delete, remember where it landed so storage never keeps a dead id.
      if (fromHash || focus === "landed") { try { localStorage.setItem(KEY, sel); } catch {} }
      if (!focus) return;
      const narrow = window.matchMedia(NARROW).matches;
      if (focus === "panel") { document.getElementById(`col-${sel}`)?.focus({ preventScroll: true }); return; }
      // After a delete: the panel that opened in its place on wide screens, the rail row on phones (where the rail shows).
      if (focus === "landed") {
        const target = narrow && view === "list" ? w.querySelector<HTMLElement>(`[data-for="${sel}"]`) : document.getElementById(`col-${sel}`);
        target?.focus({ preventScroll: true });
        return;
      }
      // On phones the panel replaces the rail, so focus follows it; going back returns focus to the row.
      if (narrow && view === "detail") document.getElementById(`col-${sel}`)?.focus({ preventScroll: true });
      if (narrow && view === "list") w.querySelector<HTMLElement>(`[data-for="${was}"]`)?.focus({ preventScroll: true });
      if (narrow) window.scrollTo({ top: 0 });
    };

    // The hashchange that opens a just-created collection focuses its heading on any screen.
    const onHash = () => {
      const created = landing.current !== null && hashId() === landing.current;
      landing.current = null;
      const fromList = d.getAttribute("data-ws-view") === "list";
      apply(created ? "panel" : true);
      openedFromList.current = fromList && d.getAttribute("data-ws-view") === "detail";
    };
    window.addEventListener("hashchange", onHash);

    // "All collections" after opening one from the list here goes back in history, so the browser's Back button
    // then leaves the page instead of reopening the collection. Arriving straight on a collection, it is a link.
    const onBack = (e: MouseEvent) => {
      if (!(e.target as Element).closest?.(".ws__back") || !openedFromList.current) return;
      e.preventDefault();
      history.back();
    };
    w.addEventListener("click", onBack);

    // A collection that just appeared was just created here: open it (through the hash, so Back works).
    const before = prev.current;
    prev.current = list;
    const added = before ? list.filter((id) => !before.includes(id)) : [];
    const h = hashId();
    // The open collection was deleted (whether it came from the hash or was remembered): drop a stale hash so the
    // first one opens, and move focus there instead of leaving it on the removed Delete button.
    const removed = Boolean(before && openBefore && !list.includes(openBefore));
    if (added.length === 1) { landing.current = added[0]; location.hash = added[0]; }
    else if (removed && h && h !== "all" && !list.includes(h)) history.replaceState(null, "", location.pathname + location.search);
    apply(removed ? "landed" : false);
    return () => { window.removeEventListener("hashchange", onHash); w.removeEventListener("click", onBack); };
  }, [idKey]);

  // Leaving the page: clear the choice from <html> so it can't style anything else.
  useEffect(() => () => { document.documentElement.removeAttribute("data-ws-sel"); document.documentElement.removeAttribute("data-ws-view"); }, []);

  return (
    <div className="ws" id="ws" ref={root} data-ids={idKey}>
      {boot}
      <nav className="ws__rail" aria-label="Your collections">
        <div className="ws__railhead">
          <p className="ws__count">{rail.length === 1 ? "1 collection" : `${rail.length} collections`}</p>
          {newCollection}
        </div>
        <ul className="ws__list">
          {rail.map((r) => (
            <li key={r.id}>
              <a className="ws__item" href={`#${r.id}`} data-for={r.id}>
                <span className="ws__name">{r.starred && STAR}<span>{r.name}</span></span>
                <span className="ws__state">{r.state}</span>
                <span className="ws__n">{r.count}<span className="sr">{r.count === 1 ? " item" : " items"}</span></span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="ws__main">{children}</div>
    </div>
  );
}
