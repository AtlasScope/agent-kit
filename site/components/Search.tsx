"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Hit = { kind: "prompt" | "skill"; ref: string; title: string; summary: string };

// Header search: "/" focuses it, arrows move, Enter opens. Results come from /api/search.
export function Search() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !t.isContentEditable) { e.preventDefault(); input.current?.focus(); }
    };
    const click = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", key); document.addEventListener("mousedown", click);
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("mousedown", click); };
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (!term) { setHits([]); return; }
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctl.signal }).then((r) => r.json())
        .then((d: { results: Hit[] }) => { setHits(d.results); setCur(0); setOpen(true); }).catch(() => {});
    }, 120);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);

  const href = (h: Hit) => (h.kind === "skill" ? `/skills/${h.ref}` : `/prompts/${h.ref}`);
  const go = (h: Hit) => { setOpen(false); setQ(""); input.current?.blur(); router.push(href(h)); };

  return (
    <div className="search" ref={box} role="search">
      <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
      <input ref={input} type="search" value={q} placeholder="Search prompts and skills" aria-label="Search prompts and skills"
        role="combobox" aria-expanded={open && hits.length > 0} aria-controls="search-results" aria-autocomplete="list"
        aria-activedescendant={open && hits[cur] ? `sr-${cur}` : undefined}
        onChange={(e) => setQ(e.target.value)} onFocus={() => hits.length && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setCur((c) => Math.min(c + 1, hits.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setCur((c) => Math.max(c - 1, 0)); }
          else if (e.key === "Enter" && hits[cur]) { e.preventDefault(); go(hits[cur]); }
          else if (e.key === "Escape") { setOpen(false); input.current?.blur(); }
        }} />
      {!q && <kbd className="kbd" aria-hidden="true">/</kbd>}
      {open && q.trim() && (
        <ul className="results" id="search-results" role="listbox">
          {hits.length === 0 && <li className="results__none">Nothing matches. Try the symptom in plain words.</li>}
          {hits.map((h, i) => (
            <li key={h.kind + h.ref} id={`sr-${i}`} role="option" aria-selected={i === cur}
              onMouseEnter={() => setCur(i)} onMouseDown={(e) => { e.preventDefault(); go(h); }}>
              <span className="results__t">{h.title}</span>
              <span className="results__k">{h.kind === "skill" ? "Skill" : "Prompt"}</span>
              {h.summary && <span className="results__d">{h.summary}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
