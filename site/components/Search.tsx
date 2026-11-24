"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { find, marks, keyOf, copyUrl, pushRecent, readRecent, writeRecent, SCOPES, KIND_LABEL, type Entry, type Recent, type Scope } from "@/lib/search";
import "./search/palette.css";

// Site search as a command palette. The header holds a button; ⌘K or Ctrl+K anywhere, "/" outside a text field,
// or the phone header's Search button (the "agent-kit:search" event) opens it. It is a native modal dialog, so the
// browser traps focus and gives it back on close; it is portalled to <body> so it takes the page's theme rather
// than the always-dark header's. The index (/search-index.json) loads on the first sign of intent: the pointer or
// focus reaching the button, a tap on it or on the phone header's Search button, ⌘K or "/". Nothing loads before
// that, so pages that never search never pay for it. Ranking runs in the browser with the same code as /api/search.
// If the index can't load, typed queries fall back to /api/search. The index leaves out what Copy sends; each
// result's text is fetched from /search-copy when it is previewed or copied.
//
// Keys: ↑ ↓ (or Ctrl+N / Ctrl+P) move, Enter opens, ⌘Enter or Ctrl+Enter copies the result's prompt or install
// command, Shift+Enter opens in a new tab, Escape clears the query and then closes. Every result is a real link,
// so ⌘-click and middle-click work. Opened and copied results are remembered in this browser as Recent.

type Status = "idle" | "loading" | "ready" | "error";
type Hit = { kind: "prompt" | "skill"; ref: string; title: string; summary: string };
type Group = { label: string; items: Entry[] };

let indexPromise: Promise<Entry[]> | null = null;
let loaded: Entry[] | null = null;
// The browser may keep the index for an hour. If a deploy in that time removed a result, its Copy text is gone
// (404). The palette then says so and drops the index and its cached texts, and the next open fetches the index
// past the browser cache, which also replaces the cached copy for later pages. `gen` stops an index load from before
// the drop taking effect, `textGen` a text fetch from before it refilling the text cache.
// (Vercel purges its CDN on each deploy, so skipping the browser cache is enough to reach the new index.)
let stale = false, gen = 0, textGen = 0;
function dropIndex() {
  texts.clear(); known.clear(); textGen++;
  if (stale) return;   // a fresh index is already on its way, or will be fetched on the next open
  loaded = null; indexPromise = null; stale = true; gen++;
}
function loadIndex() {
  const g = gen;
  indexPromise ??= fetch("/search-index.json", stale ? { cache: "reload" } : undefined).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((e: Entry[]) => { if (g === gen) { stale = false; loaded = e; } return e; });
  const mine = indexPromise;
  indexPromise.catch(() => { if (indexPromise === mine) indexPromise = null; });
  return indexPromise;
}
const GONE = "This result was removed in an update. Close and reopen search for the latest list.";

// Copy texts by URL (which carries the text's version): `texts` holds the requests, `known` the answers, so a
// cached text can go to the clipboard inside the click or key event without waiting.
const texts = new Map<string, Promise<string>>();
const known = new Map<string, string>();
// A 404 counts only if it answers a request made since the last drop, so a late one from before can't drop a fresh
// index. The first handler to see it marks it, so every other waiter on the same request reads it the same way.
type Gone = Error & { gen?: number; seen?: boolean };
const gone = (err: unknown) => err instanceof Error && err.message === "gone" && ((err as Gone).seen || (err as Gone).gen === textGen);
function claimGone(err: unknown) {
  if (!gone(err)) return false;
  if (!(err as Gone).seen) { (err as Gone).seen = true; dropIndex(); }
  return true;
}
function copyText(e: Entry): Promise<string> {
  if (e.copy?.text !== undefined) return Promise.resolve(e.copy.text);
  const k = copyUrl(e);
  let p = texts.get(k);
  if (!p) {
    const g = textGen;
    p = fetch(k).then((r) => (r.ok ? r.text() : Promise.reject(Object.assign(new Error(r.status === 404 ? "gone" : String(r.status)), { gen: g })))).then((t) => { if (g === textGen) known.set(k, t); return t; });
    const mine = p;
    p.catch(() => { if (texts.get(k) === mine) texts.delete(k); });
    texts.set(k, p);
  }
  return p;
}
const knownText = (e: Entry) => e.copy?.text ?? known.get(copyUrl(e));

const SearchIcon = () => (
  <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
);
const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

function Marked({ text, q }: { text: string; q: string }) {
  const r = marks(text, q);
  if (!r.length) return <>{text}</>;
  const out: React.ReactNode[] = [];
  let at = 0;
  r.forEach(([s, e], i) => { if (s > at) out.push(text.slice(at, s)); out.push(<mark key={i}>{text.slice(s, e)}</mark>); at = e; });
  if (at < text.length) out.push(text.slice(at));
  return <>{out}</>;
}

export function Search() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [cur, setCur] = useState(0);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [fallback, setFallback] = useState<Entry[]>([]);
  const [fallbackFor, setFallbackFor] = useState("");
  const [recent, setRecent] = useState<Recent[]>([]);
  const [toast, setToast] = useState("");
  const [mod, setMod] = useState("Ctrl");
  const dlg = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();
  const path = usePathname();

  // Stable, and reads module state rather than render state, so every warm-up and every open see the truth.
  // After a failure it retries quietly: the palette stays on server results until a retry succeeds.
  // A failed load is retried at most every 15 seconds, however often the button is hovered or the palette opened.
  const failed = useRef(false);
  const lastTry = useRef(0);
  // After a removed result (`stale`) the old list is cleared at once, so its dead results can't be opened, and the
  // retry throttle doesn't apply. A load made obsolete by a drop in the meantime is ignored.
  const warm = useCallback(() => {
    if (loaded) { setEntries(loaded); setStatus("ready"); return; }
    if (stale) setEntries(null);
    else if (failed.current && Date.now() - lastTry.current < 15000) return;
    lastTry.current = Date.now();
    if (!failed.current) setStatus("loading");
    loadIndex().then((e) => { if (loaded !== e) return; failed.current = false; setEntries(e); setStatus("ready"); },
      () => { failed.current = true; setStatus("error"); });
  }, []);

  // Opens synchronously inside the click or key event, so iOS Safari raises the keyboard for the field.
  const show = useCallback(() => {
    const d = dlg.current;
    if (!d) return;
    if (!d.open) {
      const from = document.activeElement as HTMLElement | null;
      opener.current = from && from !== document.body && !d.contains(from) ? from : null;
      d.showModal(); setOpen(true); setRecent(readRecent());
    }
    input.current?.focus();
    input.current?.select();
    warm();
  }, [warm]);
  const hide = useCallback(() => { dlg.current?.close(); }, []);
  // Focus goes back to whatever opened the palette (the header button, a page control). If nothing had focus,
  // it leaves the dialog's field, so the next "/" isn't read as typing into a hidden input.
  const opener = useRef<HTMLElement | null>(null);
  const restoreFocus = () => {
    const a = document.activeElement as HTMLElement | null;
    if (a && a !== document.body && !dlg.current?.contains(a)) return;
    if (opener.current?.isConnected) opener.current.focus({ preventScroll: true }); else a?.blur();
  };

  useEffect(() => { setMounted(true); setMod(isMac() ? "⌘" : "Ctrl"); }, []);
  // The phone header's Search button lives in NavMenu; its press starts the fetch about 100 ms before its click
  // opens the palette. (The header field warms itself: pointerenter fires on touch as well as hover.)
  useEffect(() => {
    const down = (e: PointerEvent) => { if ((e.target as Element | null)?.closest?.(".nav__find")) warm(); };
    document.addEventListener("pointerdown", down, true);
    return () => document.removeEventListener("pointerdown", down, true);
  }, [warm]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dlg.current?.open) hide(); else show();
      } else if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !dlg.current?.open && (dlg.current?.contains(t) || (!/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !t.isContentEditable))) {
        e.preventDefault(); show();
      }
    };
    document.addEventListener("keydown", key);
    window.addEventListener("agent-kit:search", show);
    return () => { document.removeEventListener("keydown", key); window.removeEventListener("agent-kit:search", show); };
  }, [show, hide]);
  // iOS Safari doesn't shrink 100dvh for the on-screen keyboard, so the phone sheet takes the visual viewport's
  // height while it is open and the results stay above the keyboard.
  useEffect(() => {
    const vv = window.visualViewport, d = dlg.current;
    if (!open || !vv || !d) return;
    // iOS may also scroll the visual viewport to make room for the keyboard; offsetTop keeps the sheet on it.
    const fit = () => { d.style.setProperty("--cmdk-vh", `${vv.height}px`); d.style.setProperty("--cmdk-top", `${vv.offsetTop}px`); };
    fit(); vv.addEventListener("resize", fit); vv.addEventListener("scroll", fit);
    return () => { vv.removeEventListener("resize", fit); vv.removeEventListener("scroll", fit); d.style.removeProperty("--cmdk-vh"); d.style.removeProperty("--cmdk-top"); };
  }, [open]);
  // Back and Forward close it. (Not a path effect: that fires after a palette navigation lands and would close a
  // palette reopened in the meantime.)
  useEffect(() => { window.addEventListener("popstate", hide); return () => window.removeEventListener("popstate", hide); }, [hide]);

  // Without the index, typed queries go to the server.
  useEffect(() => {
    const term = q.trim();
    // The previous results stay up until the new ones arrive; `fallbackFor` says which query they answer.
    if (status !== "error" || !term) { setFallback([]); setFallbackFor(""); return; }
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctl.signal }).then((r) => r.json())
        .then((d: { results: Hit[] }) => {
          setFallback(d.results.map((h) => ({ ...h, fields: [], meta: KIND_LABEL[h.kind], href: h.kind === "skill" ? `/skills/${h.ref}` : `/prompts/${h.ref}` })));
          setFallbackFor(term);
        }).catch(() => {});
    }, 120);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q, status]);

  const byKey = useMemo(() => new Map((entries || []).map((e) => [keyOf(e), e])), [entries]);
  const groups: Group[] = useMemo(() => {
    const term = q.trim();
    if (term) {
      if (status === "error") return [{ label: "Results", items: fallback.filter((e) => scope === "all" || e.kind === scope) }];
      return entries ? [{ label: "Results", items: find(entries, term, scope) }] : [];
    }
    if (!entries) return [];
    const inScope = (e: Entry) => scope === "all" || e.kind === scope || (scope === "prompt" && e.kind === "area");
    const rec = recent.map((r) => byKey.get(keyOf(r))).filter((e): e is Entry => !!e && inScope(e));
    const out: Group[] = [];
    if (rec.length) out.push({ label: "Recent", items: rec });
    if (scope === "all") out.push({ label: "Go to", items: entries.filter((e) => e.kind === "page" && !rec.includes(e)) });
    else out.push({ label: "Browse", items: entries.filter((e) => inScope(e) && !rec.includes(e)).slice(0, 12) });
    return out;
  }, [q, scope, entries, status, fallback, recent, byKey]);
  const items = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const active = items[Math.min(cur, items.length - 1)];

  useEffect(() => { setCur(0); list.current?.scrollTo({ top: 0 }); }, [q, scope]);
  // On wide screens the preview shows the selected result's Copy text. It is fetched once the selection rests for a
  // moment, so holding an arrow key doesn't request every result it passes. Phones have no preview and fetch a text
  // only when it is copied.
  // `text: null` means the fetch failed (Copy tries again and, if it succeeds, fills the preview); `gone` that the
  // result no longer exists. `waiting` turns on after 400 ms without the text (a timer, so reduced motion shows it).
  const [payload, setPayload] = useState<{ key: string; text: string | null; gone?: boolean } | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    if (!open) return;
    const mq = matchMedia("(min-width: 900px)"), on = () => setWide(mq.matches);
    on(); mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [open]);
  useEffect(() => {
    setWaiting(false);
    if (!open || !wide || !active?.copy) return;
    const k = copyUrl(active), have = knownText(active);
    if (have !== undefined) { setPayload({ key: k, text: have }); return; }
    // Coming back to a text that failed: it shows as loading again while it retries.
    setPayload((p) => (p?.key === k ? null : p));
    let live = true;
    const e = active;
    const t = setTimeout(() => copyText(e).then((text) => { if (live) setPayload({ key: k, text }); },
      (err) => { if (live) setPayload({ key: k, text: null, gone: claimGone(err) }); }), 120);
    const w = setTimeout(() => setWaiting(true), 400);
    return () => { live = false; clearTimeout(t); clearTimeout(w); };
  }, [open, wide, active]);
  const shown = active?.copy && payload?.key === copyUrl(active) ? payload : undefined;
  useEffect(() => {
    if (!active) return;
    document.getElementById(`cmdk-${keyOf(active)}`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const remember = (e: Entry) => { const next = pushRecent(readRecent(), e); writeRecent(next); setRecent(next); };
  const go = (e: Entry, newTab = false) => {
    remember(e);
    if (newTab) { window.open(e.href, "_blank", "noopener"); return; }
    hide();
    setQ(""); setScope("all");
    if (e.href !== path) router.push(e.href);
  };
  const say = (msg: string) => { clearTimeout(toastTimer.current); setToast(msg); toastTimer.current = setTimeout(() => setToast(""), 2400); };
  // A text already fetched is written at once. Otherwise the clipboard is handed a promise of it (ClipboardItem),
  // which keeps the user's gesture valid in Safari while the text loads; browsers without that wait, then write.
  const copy = async (e: Entry) => {
    const c = e.copy;
    if (!c) { say("Nothing to copy here. Press Enter to open it."); return; }
    const have = knownText(e), k = copyUrl(e);
    let loadFailed: unknown = null;
    try {
      if (have !== undefined) await navigator.clipboard.writeText(have);
      else {
        const text = copyText(e);
        text.then((t) => setPayload((p) => (p?.key === k ? { key: k, text: t } : p)), (err) => { loadFailed = err ?? true; });
        try {
          if (typeof ClipboardItem === "undefined" || !navigator.clipboard.write) throw new Error("unsupported");
          const blob = text.then((t) => new Blob([t], { type: "text/plain" }));
          blob.catch(() => {});
          await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
        } catch {
          // Writes the text once it arrives; a failed fetch rejects here and is reported below.
          await navigator.clipboard.writeText(await text);
        }
      }
      say(c.done); remember(e);
    } catch {
      if (claimGone(loadFailed)) { setPayload((p) => (p?.key === k ? { key: k, text: null, gone: true } : p)); say(GONE); }
      else say(loadFailed ? "Couldn’t load the text to copy. Open the page and copy from there." : "Copy was blocked. Open the page and copy from there.");
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const n = items.length;
    const down = e.key === "ArrowDown" || (e.ctrlKey && e.key === "n");
    const up = e.key === "ArrowUp" || (e.ctrlKey && e.key === "p");
    if (down || up) { e.preventDefault(); if (n) setCur((c) => (Math.min(c, n - 1) + (down ? 1 : -1) + n) % n); }
    else if (e.key === "Enter" && active) {
      e.preventDefault();
      if (e.metaKey || e.ctrlKey) copy(active); else go(active, e.shiftKey);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (q) setQ(""); else hide();
    }
  };

  const term = q.trim();
  const loading = !!term && (status === "error" ? fallbackFor !== term : !entries);
  const scoped = scope !== "all" && !!term && !items.length && (entries ? find(entries, term, "all", 1).length > 0 : fallback.length > 0);
  const count = term ? (loading ? "" : items.length ? `${items.length} ${items.length === 1 ? "result" : "results"}` : "No results") : "";
  const optId = (e: Entry) => `cmdk-${keyOf(e)}`;

  const palette = (
    <dialog ref={dlg} className="cmdk" aria-label="Search"
      onClose={() => { setOpen(false); setToast(""); restoreFocus(); }}
      onCancel={(e) => { if (q) { e.preventDefault(); setQ(""); } }}
      onClick={(e) => { if (e.target === dlg.current) hide(); }}>
      <div className="cmdk__panel">
        <div className="cmdk__bar">
          <SearchIcon />
          <input ref={input} className="cmdk__input" type="search" enterKeyHint="go" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
            value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Search prompts, skills, kits and fixes" aria-label="Search the library"
            role="combobox" aria-expanded={items.length > 0} aria-controls="search-results" aria-autocomplete="list"
            aria-activedescendant={active ? optId(active) : undefined} aria-describedby="cmdk-keys" />
          <button type="button" className="cmdk__cancel" onClick={hide}>Cancel</button>
          <kbd className="cmdk__esc" aria-hidden="true">esc</kbd>
        </div>
        <div className="cmdk__scopes" role="toolbar" aria-label="Search in">
          {SCOPES.map(([s, label]) => (
            <button key={s} type="button" className="cmdk__scope" aria-pressed={scope === s}
              onClick={() => { setScope(s); input.current?.focus({ preventScroll: true }); }}>{label}</button>
          ))}
        </div>
        <div className="cmdk__body">
          <div className="cmdk__list" ref={list} id="search-results" role="listbox" aria-label="Results">
            {groups.map((g) => g.items.length > 0 && (
              <div key={g.label} role="group" aria-labelledby={`cmdk-g-${g.label}`} className="cmdk__group">
                <div className="cmdk__label" id={`cmdk-g-${g.label}`} role="presentation">{g.label}</div>
                {g.items.map((e) => (
                  <a key={keyOf(e)} id={optId(e)} role="option" aria-selected={e === active} tabIndex={-1} href={e.href}
                    className="cmdk__opt" data-kind={e.kind} data-sec={e.sec}
                    onPointerMove={() => { const i = items.indexOf(e); if (i !== cur) setCur(i); }}
                    onClick={(ev) => { if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) { remember(e); return; } ev.preventDefault(); go(e); }}>
                    <span className="cmdk__dot" aria-hidden="true" />
                    <span className="cmdk__t" translate={e.kind === "skill" || e.kind === "kit" ? "no" : undefined}><Marked text={e.title} q={term} /></span>
                    <span className="cmdk__k">{e.kind === "prompt" && e.meta ? e.meta.split(" · ")[0] : KIND_LABEL[e.kind]}</span>
                    {e.summary && <span className="cmdk__d">{e.summary}</span>}
                  </a>
                ))}
              </div>
            ))}
            {loading && <p className="cmdk__note">{status === "error" ? "Searching…" : "Loading the library…"}</p>}
            {!loading && term && !items.length && (
              <div className="cmdk__note">
                <p>Nothing matches “{term}”{scope !== "all" ? ` in ${SCOPES.find(([s]) => s === scope)![1]}` : ""}.</p>
                {status === "error" && <p>Only prompts and skills can be searched right now; kits, fixes and guides didn’t load.</p>}
                {scoped
                  ? <button type="button" className="cmdk__link" onClick={() => { setScope("all"); input.current?.focus(); }}>Search everything instead</button>
                  : <p>Describe the symptom in plain words, or <a className="cmdk__link" href="/fix" onClick={(ev) => { ev.preventDefault(); hide(); router.push("/fix"); }}>pick it from Fix a problem</a>.</p>}
              </div>
            )}
            {!term && status === "error" && <p className="cmdk__note">Type to search. Recent items and shortcuts couldn’t load.</p>}
          </div>
          {active && (
            <aside className="cmdk__preview" aria-label="Preview" data-sec={active.sec}>
              <p className="cmdk__meta"><span className="cmdk__dot" aria-hidden="true" data-kind={active.kind} />{active.meta}</p>
              <h2 className="cmdk__ph" translate={active.kind === "skill" || active.kind === "kit" ? "no" : undefined}>{active.title}</h2>
              {active.summary && <p className="cmdk__ps">{active.summary}</p>}
              {active.copy && typeof shown?.text === "string" && <pre className="cmdk__payload" data-long={shown.text.length > 360 || undefined} aria-label={`${active.copy.label.replace(/^Copy /, "")} text`}>{shown.text}</pre>}
              {active.copy && <p className="cmdk__ps cmdk__pnote" aria-live="polite">
                {shown?.text === null ? (shown.gone ? GONE : "The text didn’t load. Copy will try again.") : !shown && waiting ? "Loading the text…" : ""}
              </p>}
              <div className="cmdk__actions">
                <button type="button" className="cmdk__btn cmdk__btn--main" onClick={() => go(active)}>Open<kbd aria-hidden="true">↵</kbd></button>
                {active.copy && <button type="button" className="cmdk__btn" onClick={() => copy(active)}>{active.copy.label}<kbd aria-hidden="true">{mod}↵</kbd></button>}
              </div>
            </aside>
          )}
        </div>
        <div className="cmdk__foot">
          <p id="cmdk-keys" className="cmdk__keys">
            <span><kbd aria-hidden="true">↑</kbd><kbd aria-hidden="true">↓</kbd> to move</span>
            <span><kbd aria-hidden="true">↵</kbd> to open</span>
            <span><kbd aria-hidden="true">{mod}</kbd><kbd aria-hidden="true">↵</kbd> to copy</span>
          </p>
          <p className="cmdk__toast" role="status" aria-live="polite">{toast}</p>
        </div>
        <p className="sr" aria-live="polite">{open ? count : ""}</p>
      </div>
    </dialog>
  );

  return (
    <>
      <div className="search" role="search">
        <SearchIcon />
        <button type="button" className="search__trigger" aria-haspopup="dialog" aria-keyshortcuts="Meta+K Control+K /"
          onClick={show} onPointerEnter={warm} onFocus={warm}>
          <span>Search prompts, skills, kits and fixes</span>
        </button>
        <kbd className="kbd" aria-hidden="true">{mounted ? `${mod === "⌘" ? "⌘" : "Ctrl "}K` : "/"}</kbd>
      </div>
      {mounted && createPortal(palette, document.body)}
    </>
  );
}
