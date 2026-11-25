"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { SITE } from "@/lib/site";

// Up to 1248px wide (78rem) the header is one row: brand, search, and these buttons. The menu is a native modal
// dialog, so the browser traps focus inside it and closes it on Escape. It sits outside the buttons' wrapper, which
// is hidden on wider screens, and closes itself when the screen gets wider than that, so an open menu can never
// end up invisible with the page behind it locked (an iPad turned from portrait to landscape, a widened window).
// Browsers that support invoker commands open it from the button even before the page's script has loaded.
// Do not call focus() on the dialog after showModal: in iOS Safari that closes it again.
const WIDE = "(min-width: 78.0625rem)";
const OPEN = { commandfor: "site-menu", command: "show-modal" } as Record<string, string>;
export const openSearch = () => window.dispatchEvent(new Event("agent-kit:search"));

export function NavMenu() {
  const sheet = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => { sheet.current?.close(); }, [path]);
  useEffect(() => {
    const d = sheet.current!, mq = matchMedia(WIDE);
    const wide = () => { if (mq.matches) d.close(); };
    // Safari does not focus a button when it is tapped, so the dialog hands focus back to the page; once it has, put
    // focus on Menu instead (checked a moment later, because Safari moves focus after the close event).
    const closed = () => { setOpen(false); setTimeout(() => { if (!document.activeElement || document.activeElement === document.body) toggle.current?.focus({ preventScroll: true }); }); };
    const toggled = () => setOpen(d.open);
    mq.addEventListener("change", wide); d.addEventListener("close", closed); d.addEventListener("toggle", toggled);
    return () => { mq.removeEventListener("change", wide); d.removeEventListener("close", closed); d.removeEventListener("toggle", toggled); };
  }, []);
  const show = () => { const d = sheet.current; if (d && !d.open) d.showModal(); setOpen(true); };

  return (
    <>
      <div className="nav__toggles">
        {/* Phones only: opens the search field that covers the bar. */}
        <button type="button" className="iconbtn nav__find" aria-label="Search" onClick={openSearch}>
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        </button>
        <button ref={toggle} type="button" className="iconbtn" aria-label="Menu" aria-haspopup="dialog" aria-expanded={open} aria-controls="site-menu" {...OPEN} onClick={show}>
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 8h16M4 16h16" /></svg>
        </button>
      </div>
      {/* A press on any link or button inside closes the sheet. Sign in and the account stay in the bar; the sheet adds the
          places the bar has no room for, and Install. */}
      <dialog ref={sheet} id="site-menu" className="sheet" aria-label="Menu"
        onClick={(e) => { if ((e.target as HTMLElement).closest("a, button")) sheet.current?.close(); }}>
        <div className="container sheet__top">
          {/* The dialog gives its first focus to this title, so Safari draws no ring round Close on open. */}
          <span className="sheet__title" tabIndex={-1} ref={(el) => { el?.setAttribute("autofocus", ""); }}>Menu</span>
          <button type="button" className="iconbtn" aria-label="Close menu">
            <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <nav className="container" aria-label="Sections">
          <NavLinks className="sheet__links" />
          <ul className="sheet__more">
            <li><Link href="/kits">Kits</Link></li>
            <li><Link href="/learn">Learn</Link></li>
            <li><Link href="/mcp-setup">Connect your agent</Link></li>
            <li><a href={SITE.repo}>GitHub</a></li>
            <li><Link href="/about">About</Link></li>
          </ul>
          <div className="sheet__act"><Link className="btn btn--lg btn--brand" href="/install">Install Agent Kit</Link></div>
        </nav>
      </dialog>
      {/* Without JavaScript the menu cannot open, so the section links show as a second row instead. */}
      <noscript><style>{"@media (max-width: 78rem) { .nav { flex-wrap: wrap; } .nav > .links { display: flex; order: 9; width: 100%; overflow-x: auto; padding-bottom: 8px; } .nav__toggles { display: none; } .nav__gh { display: inline-flex; } }"}</style></noscript>
    </>
  );
}
