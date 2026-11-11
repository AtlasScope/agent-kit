"use client";
import { useEffect, useRef } from "react";

// A small panel that opens in place under its button. Escape or a click outside closes it and returns focus.
export function Pop({ summary, summaryClass = "btn btn--sm", label, children }: { summary: React.ReactNode; summaryClass?: string; label?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const close = (focus: boolean) => { if (!d.open) return; d.open = false; if (focus) d.querySelector("summary")?.focus(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape" && d.open) { e.preventDefault(); close(true); } };
    const down = (e: MouseEvent) => { if (!d.contains(e.target as Node)) close(false); };
    d.addEventListener("keydown", key); document.addEventListener("mousedown", down);
    return () => { d.removeEventListener("keydown", key); document.removeEventListener("mousedown", down); };
  }, []);
  return (
    <details ref={ref} className="col__pop">
      <summary className={summaryClass} aria-label={label}>{summary}</summary>
      <div className="col__popbody">{children}</div>
    </details>
  );
}
