"use client";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { CopyButton } from "@/components/CopyButton";

type Props = {
  /** What the panel holds: "Prompt", "Command", "As one prompt", "Steps". */
  label: string;
  /** Small facts beside the label, such as the line count and the entry's id. */
  meta?: ReactNode;
  /** The exact text the main Copy button sends. Passed to CopyButton untouched. */
  text: string;
  copyLabel: string;
  /** Secondary actions (Save, Markdown) that sit before Copy. */
  actions?: ReactNode;
  /** The panel body. When absent, the exact text is shown in a selectable block. */
  children?: ReactNode;
  /** The page title, repeated in the phone dock so its Copy says what it copies. */
  title?: string;
};

const editable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(el.tagName));

// The exact text a prompt copies, with the one Copy that matters in a header that stays in reach while you read.
// Copy itself is the shared CopyButton (frozen API). This panel adds, around it:
//   - when the clipboard is blocked, the exact text is shown (if the panel's body is something else, such as the
//     steps of a split recipe) and selected, so the fallback is one keystroke (Cmd/Ctrl+C);
//   - while focus is inside the panel, C copies and Cmd/Ctrl+A inside the text selects only the text. The single-key
//     shortcut is scoped to the panel so it can't fire from stray typing or speech input elsewhere (WCAG 2.1.4);
//   - a dock at the bottom of the screen carries the same Copy whenever the panel itself is out of view, so Copy is
//     in reach from the top of the page to the footer.
export function Payload({ label, meta, text, copyLabel, actions, children, title }: Props) {
  const root = useRef<HTMLElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const main = useRef<HTMLButtonElement | null>(null);
  const [blocked, setBlocked] = useState(0); // counts blocked presses, so each one reselects
  const [docked, setDocked] = useState(false);
  const dock = useRef<HTMLDivElement>(null);

  const selectText = () => {
    const el = pre.current;
    const sel = window.getSelection();
    if (el && sel) sel.selectAllChildren(el);
  };

  useEffect(() => {
    const btn = root.current?.querySelector<HTMLButtonElement>(".pd-copy");
    if (!btn) return;
    main.current = btn;
    // CopyButton reports a blocked clipboard only through its label. Watch the panel's Copy and the dock's.
    const watch = new MutationObserver((records) => {
      if (records.some((r) => /blocked/i.test((r.target as Node).textContent || ""))) setBlocked((n) => n + 1);
    });
    for (const b of [btn, dock.current?.querySelector("button")]) if (b) watch.observe(b, { subtree: true, characterData: true, childList: true });
    // The dock shows while no part of the panel is on screen.
    const seen = new IntersectionObserver(([e]) => setDocked(!e.isIntersecting), { rootMargin: "-64px 0px 0px 0px" }); // 64px: under the sticky header
    if (root.current) seen.observe(root.current);
    return () => { watch.disconnect(); seen.disconnect(); };
  }, []);

  // Runs after the fallback text has rendered, so it can be selected. Brings the text on screen if the press came
  // from the dock while the panel was out of view.
  useEffect(() => {
    if (!blocked || !pre.current) return;
    pre.current.scrollIntoView({ block: "nearest" });
    pre.current.focus({ preventScroll: true });
    selectText();
  }, [blocked]);

  const onKey = (e: ReactKeyboardEvent) => {
    if (e.key !== "c" && e.key !== "C") return;
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.nativeEvent.isComposing) return;
    if (e.target !== pre.current && e.target !== main.current && editable(e.target)) return;
    if (String(window.getSelection() || "").length) return;
    e.preventDefault();
    main.current?.click();
  };

  const body = (
    <pre
      ref={pre}
      className="pd-text"
      tabIndex={0}
      aria-label={`${label} text`}
      translate="no"
      onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") { e.preventDefault(); selectText(); } }}
    >{text}</pre>
  );

  return (
    <>
    <section ref={root} className="pd-payload" aria-label={label} onKeyDown={onKey}>
      <div className="pd-payload__head">
        <p className="pd-payload__meta"><span className="pd-payload__label">{label}</span>{meta}</p>
        <div className="pd-payload__acts">
          {actions}
          <span className="pd-copywrap">
            <CopyButton className="btn btn--primary pd-copy" text={text} label={copyLabel} icon />
            <kbd className="pd-key" aria-hidden="true" title="Press C to copy">C</kbd>
          </span>
        </div>
      </div>
      {children ? <>{blocked > 0 && <div className="pd-fallback">{body}</div>}{children}</> : body}
    </section>
    <div ref={dock} className="pd-dock" data-on={docked || undefined} inert={!docked} aria-hidden={!docked || undefined}>
      {title && <span className="pd-dock__t">{title}</span>}
      <CopyButton className="btn btn--primary pd-copy pd-dock__copy" text={text} label={copyLabel} name={title ? `${copyLabel}: ${title}` : undefined} icon />
    </div>
    </>
  );
}
