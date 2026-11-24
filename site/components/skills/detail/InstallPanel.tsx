"use client";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { CopyButton } from "@/components/CopyButton";

export type InstallOption = {
  id: string;
  /** Tab label: what this way installs, or where it runs. */
  label: string;
  /** The exact text Copy sends, shown as it copies. Passed to CopyButton untouched. */
  text: string;
  /** What a screen reader hears for Copy on this tab. */
  copyName: string;
  /** One line under the text: where it works, what it does. */
  note?: ReactNode;
};

const editable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

// Install, shaped like the prompt page's payload panel so detail pages read as one family: a bar with the label,
// a choice of how to install, and the one Copy, which sticks under the header while the page scrolls; below it the
// exact text for the chosen way. C copies while focus is inside the panel (a single-key shortcut only works there,
// WCAG 2.1.4). If the clipboard is blocked, the text is selected so Cmd/Ctrl+C finishes the job.
// Once the panel has scrolled away above the header, a compact bar with the same Copy stays in reach for the rest of
// the page (fixed under the header on wide screens, at the bottom on phones); it hides again when the panel's own
// Copy is back in view.
export function InstallPanel({ id, title, options }: { id: string; title: string; options: InstallOption[] }) {
  const [sel, setSel] = useState(0);
  const [away, setAway] = useState(false);
  const root = useRef<HTMLElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const wrap = useRef<HTMLSpanElement>(null);
  const o = options[sel];

  // The bar shows only while the panel's Copy is above the visible area (past the header), never before the reader
  // has reached the panel. The sticky head keeps Copy in view while any of the panel is, so this is "scrolled away".
  useEffect(() => {
    const w = wrap.current, head = root.current?.querySelector<HTMLElement>(".ip-head");
    if (!w || !head || typeof IntersectionObserver === "undefined") return;
    const top = parseFloat(getComputedStyle(head).top) || 0;
    const io = new IntersectionObserver(
      ([e]) => setAway(!e.isIntersecting && e.boundingClientRect.bottom <= top + 1),
      { rootMargin: `${-Math.round(top)}px 0px 0px 0px` },
    );
    io.observe(w);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const main = () => el.querySelector<HTMLButtonElement>(".ip-copy");
    const bar = () => el.querySelector<HTMLButtonElement>(".ip-float__copy");
    const select = () => { const p = pre.current, s = window.getSelection(); if (p && s) s.selectAllChildren(p); };
    // CopyButton (frozen API) reports a blocked clipboard only through its label text, so watch for that wording.
    const blocked = (b: HTMLElement | null) => /blocked|select the text/i.test(b?.textContent || "");
    const watch = new MutationObserver(() => { if (blocked(main()) || blocked(bar())) select(); });
    watch.observe(el, { subtree: true, characterData: true, childList: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "c" && e.key !== "C") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.defaultPrevented || editable(e.target)) return;
      if (String(window.getSelection() || "").length) return;
      const b = e.target instanceof Element && e.target.closest(".ip-float") ? bar() : main();
      if (!b) return;
      e.preventDefault();
      b.click();
      b.focus({ preventScroll: true });
    };
    el.addEventListener("keydown", onKey);
    return () => { watch.disconnect(); el.removeEventListener("keydown", onKey); };
  }, []);

  // Arrow keys move between tabs and select (automatic activation; there are only two or three).
  const onTabKey = (e: ReactKeyboardEvent, i: number) => {
    const n = options.length;
    const next = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    setSel(next);
    tabs.current[next]?.focus();
  };

  return (
    <section ref={root} className="ip" id={id} aria-labelledby={`${id}-h`}>
      <div className="ip-head">
        <h2 id={`${id}-h`} className="ip-title">{title}</h2>
        {options.length > 1 && (
          <div className="ip-tabs" role="tablist" aria-label={`Ways to ${title.toLowerCase()}`}>
            {options.map((x, i) => (
              <button
                key={x.id} ref={(b) => { tabs.current[i] = b; }} type="button" role="tab" id={`${id}-tab-${x.id}`}
                aria-selected={i === sel} aria-controls={`${id}-panel`} tabIndex={i === sel ? 0 : -1}
                className="ip-tab" onClick={() => setSel(i)} onKeyDown={(e) => onTabKey(e, i)}
              >{x.label}</button>
            ))}
          </div>
        )}
        <span ref={wrap} className="ip-copywrap">
          <CopyButton key={o.id} className="btn ip-copy" text={o.text} name={o.copyName} icon />
          <kbd className="ip-key" aria-hidden="true" title="With focus here, press C to copy">C</kbd>
        </span>
      </div>
      <div className="ip-body" id={`${id}-panel`} role={options.length > 1 ? "tabpanel" : undefined} aria-labelledby={options.length > 1 ? `${id}-tab-${o.id}` : undefined}>
        <pre ref={pre} className="ip-text" tabIndex={0} translate="no">{o.text}</pre>
        {o.note && <p className="ip-note">{o.note}</p>}
      </div>
      <div className="ip-float" data-on={away || undefined} inert={!away}>
        <span className="ip-float__label">
          <span className="ip-float__title">{title}</span>
          {options.length > 1 && <span className="ip-float__way">{o.label}</span>}
        </span>
        <CopyButton key={o.id} className="btn ip-float__copy" text={o.text} name={o.copyName} icon />
      </div>
    </section>
  );
}
