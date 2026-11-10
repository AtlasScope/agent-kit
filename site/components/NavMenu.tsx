"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { NavLinks } from "./NavLinks";

// Below 1024px the header is one row: brand, search, and these buttons. The menu is a native dialog, so the
// browser traps focus inside it, closes it on Escape and returns focus to the button. Do not call focus() on the
// dialog after showModal: in iOS Safari that closes it again.
export function NavMenu({ children }: { children?: React.ReactNode }) {
  const sheet = useRef<HTMLDialogElement>(null);
  const path = usePathname();
  useEffect(() => { sheet.current?.close(); }, [path]);
  // On phones the search field is hidden until it has focus; this button gives it focus.
  const search = () => document.querySelector<HTMLInputElement>(".nav .search input")?.focus();
  return (
    <div className="nav__toggles">
      <button type="button" className="iconbtn nav__find" tabIndex={-1} aria-hidden="true" onClick={search}>
        <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
      </button>
      <button type="button" className="iconbtn" aria-label="Menu" aria-haspopup="dialog" onClick={() => { sheet.current?.showModal(); }}>
        <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 8h16M4 16h16" /></svg>
      </button>
      {/* A press on any link or button inside closes the sheet, including Sign in, whose own dialog opens next. */}
      <dialog ref={sheet} className="sheet" aria-label="Menu" onClick={(e) => { if ((e.target as HTMLElement).closest("a, button")) sheet.current?.close(); }}>
        <div className="container sheet__top">
          {/* The dialog gives its first focus to this title, so Safari draws no ring round Close on open. */}
          <span className="sheet__title" tabIndex={-1} ref={(el) => { el?.setAttribute("autofocus", ""); }}>Menu</span>
          <button type="button" className="iconbtn" aria-label="Close menu">
            <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <nav className="container" aria-label="Sections">
          <NavLinks className="sheet__links" />
          <div className="sheet__end">{children}</div>
        </nav>
      </dialog>
    </div>
  );
}
