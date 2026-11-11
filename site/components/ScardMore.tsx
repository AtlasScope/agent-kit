"use client";
import { useId, useState } from "react";

// On a phone, a starting-point card shows its job, its pick and Copy; the four answers and the alternatives
// open with one tap. From 40rem up everything shows and the toggle is hidden (CSS in globals.css).
export function ScardMore({ qa, actions, alts }: { qa: React.ReactNode; actions: React.ReactNode; alts: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <div className="scard__more" id={`${id}-qa`} data-open={open}>{qa}</div>
      {actions}
      <button className="scard__toggle" type="button" aria-expanded={open} aria-controls={`${id}-qa ${id}-alts`} onClick={() => setOpen((o) => !o)}>
        {open ? "Less" : "When to use it"}
        <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {alts && <div className="scard__more" id={`${id}-alts`} data-open={open}>{alts}</div>}
    </>
  );
}
