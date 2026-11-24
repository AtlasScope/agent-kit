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
};

const editable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(el.tagName));

// The exact text a prompt copies, with the one Copy that matters in a header that stays in reach while you read.
// Copy itself is the shared CopyButton (frozen API). This panel adds, around it:
//   - when the clipboard is blocked, the exact text is shown (if the panel's body is something else, such as the
//     steps of a split recipe) and selected, so the fallback is one keystroke (Cmd/Ctrl+C);
//   - while focus is inside the panel, C copies and Cmd/Ctrl+A inside the text selects only the text. The single-key
//     shortcut is scoped to the panel so it can't fire from stray typing or speech input elsewhere (WCAG 2.1.4).
export function Payload({ label, meta, text, copyLabel, actions, children }: Props) {
  const root = useRef<HTMLElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const main = useRef<HTMLButtonElement | null>(null);
  const [blocked, setBlocked] = useState(0); // counts blocked presses, so each one reselects

  const selectText = () => {
    const el = pre.current;
    const sel = window.getSelection();
    if (el && sel) sel.selectAllChildren(el);
  };

  useEffect(() => {
    const btn = root.current?.querySelector<HTMLButtonElement>(".pd-copy");
    if (!btn) return;
    main.current = btn;
    // CopyButton reports a blocked clipboard only through its label. Watch it.
    const watch = new MutationObserver(() => { if (/blocked/i.test(btn.textContent || "")) setBlocked((n) => n + 1); });
    watch.observe(btn, { subtree: true, characterData: true, childList: true });
    return () => watch.disconnect();
  }, []);

  // Runs after the fallback text has rendered, so it can be selected.
  useEffect(() => { if (blocked) { pre.current?.focus({ preventScroll: true }); selectText(); } }, [blocked]);

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
  );
}
