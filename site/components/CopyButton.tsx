"use client";
import { useEffect, useRef, useState } from "react";

const CopyIcon = () => (
  <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </svg>
);

// `name` is what a screen reader hears when the visible label alone ("Copy") would be ambiguous on the page.
export function CopyButton({ text, label = "Copy", className = "copy", icon = false, name }: { text: string; label?: string; className?: string; icon?: boolean; name?: string }) {
  const [state, setState] = useState(label);
  // One reset timer per button: a second press restarts it, so an earlier timer never overwrites a newer state.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = (next: string, ms: number) => { clearTimeout(timer.current); setState(next); timer.current = setTimeout(() => setState(label), ms); };
  return (
    <button
      type="button"
      className={className}
      data-copied={state === "Copied" || undefined}
      aria-label={name}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); show("Copied", 1600); }
        catch { show("Copy blocked: select the text", 5000); }
      }}
    >
      {icon && <CopyIcon />}<span aria-live="polite">{state}</span>
    </button>
  );
}
