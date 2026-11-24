"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { find, marks, keyOf, pushRecent, readRecent, writeRecent, SCOPES, KIND_LABEL, type Entry, type Recent, type Scope } from "@/lib/search";
import "./search/palette.css";

// Site search as a command palette. The header holds a button; ⌘K or Ctrl+K anywhere, "/" outside a text field,
// or the phone header's Search button (the "agent-kit:search" event) opens it. It is a native modal dialog, so the
// browser traps focus and gives it back on close; it is portalled to <body> so it takes the page's theme rather
// than the always-dark header's. The index (/search-index.json) loads the first time the pointer or focus reaches
// the button, or, on touch screens where there is no hover, once the page is idle. Ranking runs in the browser
// with the same code as /api/search. If the index can't load, typed queries fall back to /api/search.
//
// Keys: ↑ ↓ (or Ctrl+N / Ctrl+P) move, Enter opens, ⌘Enter or Ctrl+Enter copies the result's prompt or install
// command, Shift+Enter opens in a new tab, Escape clears the query and then closes. Every result is a real link,
// so ⌘-click and middle-click work. Opened and copied results are remembered in this browser as Recent.

type Status = "idle" | "loading" | "ready" | "error";
type Hit = { kind: "prompt" | "skill"; ref: string; title: string; summary: string };
type Group = { label: string; items: Entry[] };

let indexPromise: Promise<Entry[]> | null = null;
let loaded: Entry[] | null = null;
function loadIndex() {
  indexPromise ??= fetch("/search-index.json").then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((e: Entry[]) => (loaded = e));
  indexPromise.catch(() => { indexPromise = null; });
  return indexPromise;
}

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

  // Stable, and reads module state rather than render state, so the idle preload and every open see the truth.
  // After a failure it retries quietly: the palette stays on server results until a retry succeeds.
  // A failed load is retried at most every 15 seconds, however often the button is hovered or the palette opened.
  const failed = useRef(false);
  const lastTry = useRef(0);
  const warm = useCallback(() => {
    if (loaded) { setEntries(loaded); setStatus("ready"); return; }
    if (failed.current && Date.now() - lastTry.current < 15000) return;
    lastTry.current = Date.now();
    if (!failed.current) setStatus("loading");
    loadIndex().then((e) => { failed.current = false; setEntries(e); setStatus("ready"); }, () => { failed.current = true; setStatus("error"); });
  }, []);

  // Opens synchronously inside the click or key event, so iOS Safari raises the keyboard for the field.
  const show = useCallback(() => {
    const d = dlg.current;
    if (!d) return;
    if (!d.open) { d.showModal(); setOpen(true); setRecent(readRecent()); }
    input.current?.focus();
    input.current?.select();
    warm();
  }, [warm]);
  const hide = useCallback(() => { dlg.current?.close(); }, []);

  useEffect(() => { setMounted(true); setMod(isMac() ? "⌘" : "Ctrl"); }, []);
  // Fetch the index once the page is idle, so a phone's first tap on Search doesn't wait for it. Skipped when the
  // visitor asked to save data; it then loads on first use instead.
  // Touch screens only: a mouse warms it on hover, a finger gives no warning before the tap.
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData || !matchMedia("(hover: none)").matches) return;
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2500));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = ric(() => warm(), { timeout: 5000 });
    return () => cancel(id);
  }, [warm]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dlg.current?.open) hide(); else show();
      } else if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !t.isContentEditable && !dlg.current?.open) {
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
  const copy = async (e: Entry) => {
    if (!e.copy) { say("Nothing to copy here. Press Enter to open it."); return; }
    try { await navigator.clipboard.writeText(e.copy.text); say(e.copy.done); remember(e); }
    catch { say("Copy was blocked. Open the page and copy from there."); }
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
      onClose={() => { setOpen(false); setToast(""); }}
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
              {active.copy && <pre className="cmdk__payload" data-long={active.copy.text.length > 360 || undefined} aria-label={`${active.copy.label.replace(/^Copy /, "")} text`}>{active.copy.text}</pre>}
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
