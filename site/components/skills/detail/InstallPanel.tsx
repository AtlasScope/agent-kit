"use client";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { CopyButton } from "@/components/CopyButton";
import { FloatingCopy } from "@/components/ui/FloatingCopy";

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
// Once the panel's Copy has scrolled away under the header, the shared FloatingCopy bar keeps the same Copy in reach
// for the rest of the page; it hides again when the panel's own Copy is back in view.
export function InstallPanel({ id, title, options }: { id: string; title: string; options: InstallOption[] }) {
  const [sel, setSel] = useState(0);
  const root = useRef<HTMLElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const wrap = useRef<HTMLSpanElement>(null);
  const o = options[sel];

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const main = () => el.querySelector<HTMLButtonElement>(".ip-copy");
    const bar = () => el.querySelector<HTMLButtonElement>(".fcopy__copy");
    // CopyButton sets data-blocked while the clipboard refuses; select the text then, so Cmd/Ctrl+C finishes the job.
    // The bar's Copy is handled by FloatingCopy itself (it scrolls the text into view and selects it).
    const watch = new MutationObserver(() => {
      const p = pre.current, s = window.getSelection();
      if (p && s && main()?.hasAttribute("data-blocked")) { s.selectAllChildren(p); p.focus({ preventScroll: true }); }
    });
    const w = el.querySelector(".ip-copywrap");
    if (w) watch.observe(w, { subtree: true, attributes: true, attributeFilter: ["data-blocked"] });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "c" && e.key !== "C") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.defaultPrevented || editable(e.target)) return;
      if (String(window.getSelection() || "").length) return;
      const b = e.target instanceof Element && e.target.closest(".fcopy") ? bar() : main();
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
          <CopyButton key={o.id} className="btn btn--brand ip-copy" text={o.text} name={o.copyName} icon />
          <kbd className="ip-key" aria-hidden="true" title="With focus here, press C to copy">C</kbd>
        </span>
      </div>
      <div className="ip-body" id={`${id}-panel`} role={options.length > 1 ? "tabpanel" : undefined} aria-labelledby={options.length > 1 ? `${id}-tab-${o.id}` : undefined}>
        <pre ref={pre} className="ip-text" tabIndex={0} translate="no">{o.text}</pre>
        {o.note && <p className="ip-note">{o.note}</p>}
      </div>
      <FloatingCopy key={o.id} anchor={wrap} target={pre} text={o.text} title={title} detail={options.length > 1 ? o.label : undefined} name={o.copyName} />
    </section>
  );
}
