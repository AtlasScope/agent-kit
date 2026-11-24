"use client";
import { useEffect, useRef } from "react";
import { KEY } from "./boot";

export type RailEntry = { id: string; name: string; count: number; starred: boolean; state: string };

const NARROW = "(max-width: 60rem)";
const STAR = <svg className="i i--warm" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>;

function pick(ids: string[]) {
  const h = decodeURIComponent(location.hash.slice(1));
  let r: string | null = null;
  try { r = localStorage.getItem(KEY); } catch {}
  const hit = ids.includes(h);
  return { sel: hit ? h : r && ids.includes(r) ? r : ids[0], view: hit ? "detail" : "list", fromHash: hit };
}

// The Collections workspace: a rail of collections and the panels they open. Selection is plain DOM state
// on the root (data-sel, data-view) so the inline script and React agree without a re-render.
export function Workspace({ rail, newCollection, boot, children }: { rail: RailEntry[]; newCollection: React.ReactNode; boot: React.ReactNode; children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const ids = rail.map((r) => r.id);
  const idKey = ids.join(" ");
  const prev = useRef<string[] | null>(null);

  useEffect(() => {
    const w = root.current;
    if (!w) return;
    const list = idKey.split(" ");

    const apply = (focus: boolean | "panel") => {
      const { sel, view, fromHash } = pick(list);
      const was = w.getAttribute("data-sel");
      w.setAttribute("data-sel", sel);
      w.setAttribute("data-view", view);
      w.querySelectorAll<HTMLAnchorElement>("[data-for]").forEach((a) => {
        if (a.dataset.for === sel) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
      if (fromHash) { try { localStorage.setItem(KEY, sel); } catch {} }
      if (!focus) return;
      if (focus === "panel") { document.getElementById(`col-${sel}`)?.focus({ preventScroll: true }); return; }
      const narrow = window.matchMedia(NARROW).matches;
      // On phones the panel replaces the rail, so focus follows it; going back returns focus to the row.
      if (narrow && view === "detail") document.getElementById(`col-${sel}`)?.focus({ preventScroll: true });
      if (narrow && view === "list") w.querySelector<HTMLElement>(`[data-for="${was}"]`)?.focus({ preventScroll: true });
      if (narrow) window.scrollTo({ top: 0 });
    };

    let landing = false; // the next hashchange opens a just-created collection: focus its heading on any screen
    const onHash = () => { apply(landing ? "panel" : true); landing = false; };
    window.addEventListener("hashchange", onHash);

    // A collection that just appeared was just created here: open it (through the hash, so Back works).
    const before = prev.current;
    prev.current = list;
    const added = before ? list.filter((id) => !before.includes(id)) : [];
    const h = decodeURIComponent(location.hash.slice(1));
    const removed = Boolean(before && h && h !== "all" && !list.includes(h));
    if (added.length === 1) { landing = true; location.hash = added[0]; }
    // The open collection was deleted: drop its hash so the remembered or first one opens, and move focus there.
    else if (removed) history.replaceState(null, "", location.pathname + location.search);
    apply(removed ? "panel" : false);
    return () => window.removeEventListener("hashchange", onHash);
  }, [idKey]);

  return (
    <div className="ws" id="ws" ref={root} data-ids={idKey} suppressHydrationWarning>
      {boot}
      <nav className="ws__rail" aria-label="Your collections">
        <div className="ws__railhead">
          <p className="ws__count">{rail.length === 1 ? "1 collection" : `${rail.length} collections`}</p>
          {newCollection}
        </div>
        <ul className="ws__list">
          {rail.map((r, i) => (
            <li key={r.id}>
              <a className="ws__item" href={`#${r.id}`} data-for={r.id} aria-current={i === 0 ? "true" : undefined} suppressHydrationWarning>
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
