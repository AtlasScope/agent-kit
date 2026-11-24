"use client";
import { useEffect, useId, useState } from "react";

// Narrows the symptom list as you type. The full list is server-rendered and stays usable without JavaScript;
// this only hides rows whose text doesn't contain every word typed. "/" stays with the header search.
export function FixFilter({ total }: { total: number }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(total);
  const [said, setSaid] = useState("");
  function apply(v: string) {
    setQ(v);
    const words = v.toLowerCase().split(/\s+/).filter(Boolean);
    let n = 0;
    document.querySelectorAll<HTMLElement>("[data-fix]").forEach((el) => {
      const hit = words.every((w) => (el.dataset.fix || "").includes(w));
      el.hidden = !hit;
      if (hit) n++;
    });
    document.querySelectorAll<HTMLElement>("[data-fix-group]").forEach((g) => {
      const visible = g.querySelectorAll("[data-fix]:not([hidden])").length;
      g.hidden = !visible;
      const c = g.querySelector<HTMLElement>("[data-fix-count]");
      if (c) c.textContent = String(visible);
    });
    setShown(n);
  }
  const status = q ? (shown ? `${shown} of ${total} symptoms` : "No symptom matches. Try one word, or search every prompt from the header.") : `${total} symptoms`;
  // Screen readers hear the settled count once typing pauses, not one announcement per keystroke.
  useEffect(() => { const t = setTimeout(() => setSaid(q ? status : ""), 450); return () => clearTimeout(t); }, [q, status]);
  return (
    <div className="fixfind">
      <label className="sr" htmlFor={id}>Filter symptoms</label>
      <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
      <input id={id} className="input" type="search" autoComplete="off" spellCheck={false} placeholder="What do you see? Try “slow” or “login”"
        value={q} onChange={(e) => apply(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape" && q) { e.preventDefault(); apply(""); } }} />
      <p className="fixfind__n" aria-hidden="true">{status}</p>
      <p className="sr" aria-live="polite">{said}</p>
    </div>
  );
}
