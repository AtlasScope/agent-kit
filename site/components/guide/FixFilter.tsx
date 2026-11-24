"use client";
import { useId, useState } from "react";

// Narrows the symptom list as you type. The full list is server-rendered and stays usable without JavaScript;
// this only hides rows whose text doesn't contain every word typed. "/" stays with the header search.
export function FixFilter({ total }: { total: number }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(total);
  function apply(v: string) {
    setQ(v);
    const words = v.toLowerCase().split(/\s+/).filter(Boolean);
    let n = 0;
    document.querySelectorAll<HTMLElement>("[data-fix]").forEach((el) => {
      const hit = words.every((w) => (el.dataset.fix || "").includes(w));
      el.hidden = !hit;
      if (hit) n++;
    });
    document.querySelectorAll<HTMLElement>("[data-fix-group]").forEach((g) => { g.hidden = !g.querySelector("[data-fix]:not([hidden])"); });
    setShown(n);
  }
  return (
    <div className="fixfind">
      <label className="sr" htmlFor={id}>Filter symptoms</label>
      <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
      <input id={id} className="input" type="search" autoComplete="off" spellCheck={false} placeholder="What do you see? Try “slow” or “login”"
        value={q} onChange={(e) => apply(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape" && q) { e.preventDefault(); apply(""); } }} />
      <p className="fixfind__n" aria-live="polite">{q ? (shown ? `${shown} of ${total} symptoms` : "No symptom matches. Try one word, or search every prompt from the header.") : `${total} symptoms`}</p>
    </div>
  );
}
