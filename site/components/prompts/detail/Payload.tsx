"use client";
import { useEffect, useRef, type ReactNode } from "react";
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
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

// The exact text a prompt copies, with the one Copy that matters in a header that stays in reach while you read.
// Copy itself is the shared CopyButton (frozen API). This panel adds two things around it:
//   - when the clipboard is blocked, the text is selected for you, so the fallback is one keystroke (Cmd/Ctrl+C);
//   - C copies from anywhere on the page, and Cmd/Ctrl+A inside the text selects only the text.
export function Payload({ label, meta, text, copyLabel, actions, children }: Props) {
  const root = useRef<HTMLElement>(null);
  const pre = useRef<HTMLPreElement>(null);

  const selectText = () => {
    const el = pre.current;
    const sel = window.getSelection();
    if (!el || !sel) return;
    sel.selectAllChildren(el);
  };

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const main = el.querySelector<HTMLButtonElement>(".pd-copy");
    if (!main) return;
    // CopyButton reports a blocked clipboard only through its label. Watch it and select the text when that happens.
    const watch = new MutationObserver(() => { if (/blocked/i.test(main.textContent || "")) selectText(); });
    watch.observe(main, { subtree: true, characterData: true, childList: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "c" && e.key !== "C") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.defaultPrevented || editable(e.target)) return;
      if (String(window.getSelection() || "").length) return;
      if (document.querySelector("[aria-modal='true'], dialog[open]")) return;
      e.preventDefault();
      main.click();
      main.focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onKey);
    return () => { watch.disconnect(); document.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <section ref={root} className="pd-payload" aria-label={label}>
      <div className="pd-payload__head">
        <p className="pd-payload__meta"><span className="pd-payload__label">{label}</span>{meta}</p>
        <div className="pd-payload__acts">
          {actions}
          <span className="pd-copywrap">
            <CopyButton className="btn pd-copy" text={text} label={copyLabel} icon />
            <kbd className="pd-key" aria-hidden="true" title="Press C to copy">C</kbd>
          </span>
        </div>
      </div>
      {children ?? (
        <pre
          ref={pre}
          className="pd-text"
          tabIndex={0}
          aria-label={`${label} text`}
          translate="no"
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") { e.preventDefault(); selectText(); } }}
        >{text}</pre>
      )}
    </section>
  );
}
