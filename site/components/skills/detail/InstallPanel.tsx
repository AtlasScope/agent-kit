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
// exact text for the chosen way. C copies from anywhere on the page. If the clipboard is blocked, the text is
// selected so Cmd/Ctrl+C finishes the job.
export function InstallPanel({ id, title, options }: { id: string; title: string; options: InstallOption[] }) {
  const [sel, setSel] = useState(0);
  const root = useRef<HTMLElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const o = options[sel];

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const main = () => el.querySelector<HTMLButtonElement>(".ip-copy");
    const select = () => { const p = pre.current, s = window.getSelection(); if (p && s) s.selectAllChildren(p); };
    const watch = new MutationObserver(() => { if (/blocked/i.test(main()?.textContent || "")) select(); });
    watch.observe(el.querySelector(".ip-head") as Node, { subtree: true, characterData: true, childList: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "c" && e.key !== "C") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.defaultPrevented || editable(e.target)) return;
      if (String(window.getSelection() || "").length) return;
      if (document.querySelector("[aria-modal='true'], dialog[open]")) return;
      const b = main();
      if (!b) return;
      e.preventDefault();
      b.click();
      b.focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onKey);
    return () => { watch.disconnect(); document.removeEventListener("keydown", onKey); };
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
        <span className="ip-copywrap">
          <CopyButton key={o.id} className="btn ip-copy" text={o.text} name={o.copyName} icon />
          <kbd className="ip-key" aria-hidden="true" title="Press C to copy">C</kbd>
        </span>
      </div>
      <div className="ip-body" id={`${id}-panel`} role={options.length > 1 ? "tabpanel" : undefined} aria-labelledby={options.length > 1 ? `${id}-tab-${o.id}` : undefined}>
        <pre ref={pre} className="ip-text" tabIndex={0} translate="no">{o.text}</pre>
        {o.note && <p className="ip-note">{o.note}</p>}
      </div>
    </section>
  );
}
