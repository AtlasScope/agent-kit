"use client";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CopyButton } from "@/components/CopyButton";
import { FloatingCopy } from "@/components/ui/FloatingCopy";

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
  /** The page title, repeated in the floating Copy bar so its Copy says what it copies. */
  title?: string;
  /** Exact texts of per-step Copy buttons in `children`, by index. Each such button sits inside an element with
   *  `data-step={index}`, and its row holds an empty `data-step-slot={index}` element, so a blocked step copy can
   *  show and select the text it would have copied right beside that step. */
  steps?: (string | null)[];
};

type Fallback = { text: string; name: string; n: number; slot?: HTMLElement | null };

const editable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(el.tagName));

// The exact text a prompt copies, with the one Copy that matters in a header that stays in reach while you read.
// Copy itself is the shared CopyButton (frozen API). This panel adds, around it:
//   - when the clipboard is blocked (CopyButton's data-blocked), the text that press would have copied is shown (if the panel's body is something
//     else, such as the steps of a split recipe) and selected, so the fallback is one keystroke (Cmd/Ctrl+C);
//   - while focus is inside the panel, C copies and Cmd/Ctrl+A inside the text selects only the text. The single-key
//     shortcut is scoped to the panel so it can't fire from stray typing or speech input elsewhere (WCAG 2.1.4);
//   - the shared FloatingCopy bar carries the same Copy once the panel's sticky Copy bar starts to scroll away under
//     the header (the panel's end pushes it up), so Copy is in reach from the top of the page to the footer.
export function Payload({ label, meta, text, copyLabel, actions, children, title, steps }: Props) {
  const root = useRef<HTMLElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const main = useRef<HTMLButtonElement | null>(null);
  const dockWrap = useRef<HTMLDivElement>(null);
  // FloatingCopy's anchor: a zero-height marker one Copy bar's height above the panel's end. Its bottom reaches the
  // header exactly when the panel's end starts pushing the sticky bar up, so the floating bar takes over before the
  // panel's own Copy is clipped. Its offset follows the bar's height (it wraps on narrow screens).
  const anchor = useRef<HTMLSpanElement>(null);
  const [fallback, setFallback] = useState<Fallback | null>(null);
  const inline = !children; // the exact text is the panel body

  // Blocked presses. Watch CopyButton's data-blocked and data-copied, and also check on every press: a repeat press
  // while the button already says "blocked" changes nothing in the DOM.
  useEffect(() => {
    const panel = root.current;
    const dock = dockWrap.current?.querySelector<HTMLElement>(".fcopy") ?? null;
    if (!panel) return;
    main.current = panel.querySelector<HTMLButtonElement>(".pd-copy");
    const textFor = (btn: Element): Fallback | null => {
      const step = btn.closest<HTMLElement>("[data-step]");
      if (step && steps) {
        const i = Number(step.dataset.step);
        const t = steps[i];
        return t ? { text: t, name: `Step ${i + 1} text`, n: Date.now(), slot: panel.querySelector<HTMLElement>(`[data-step-slot="${i}"]`) } : null;
      }
      // The main Copy: name the text by what the button says it copies ("Copy step 1" -> "Step 1 text").
      const what = copyLabel.replace(/^Copy\s+/i, "");
      return { text, name: inline ? `${label} text` : `${what[0].toUpperCase()}${what.slice(1)} text`, n: Date.now() };
    };
    const onBlocked = (btn: Element) => { const f = textFor(btn); if (f) setFallback(f); };
    const isCopy = (el: Element | null) => el?.closest(".pd-copy, .pd-stepcopy, .fcopy__copy") ?? null;

    const watch = new MutationObserver((records) => {
      for (const r of records) {
        const el = r.target as Element;
        if (el === dock) {
          // The floating bar hid while it held focus: it turns inert, so hand focus to the panel's own Copy.
          if (!dock.hasAttribute("data-on") && dock.contains(document.activeElement)) main.current?.focus({ preventScroll: true });
          continue;
        }
        const btn = isCopy(el);
        if (!btn || r.oldValue !== null) continue; // only an attribute turning on
        if (r.attributeName === "data-blocked") onBlocked(btn);
        else if (!inline) {
          // A later copy worked: hide the fallback, handing focus back to the button if it was in the text.
          if (pre.current?.contains(document.activeElement)) {
            const to = dock?.contains(btn) && dock.inert ? main.current : (btn as HTMLElement);
            to?.focus({ preventScroll: true });
          }
          setFallback(null);
        }
      }
    });
    // A press while the label already says "blocked" changes nothing in the DOM if it is blocked again, so check
    // once the clipboard call has had time to settle. A success turns the label to "Copied" first and is skipped.
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const onClick = (e: MouseEvent) => {
      const btn = isCopy(e.target as Element);
      if (!btn?.hasAttribute("data-blocked")) return;
      const t = setTimeout(() => { timers.delete(t); if (btn.hasAttribute("data-blocked")) onBlocked(btn); }, 400);
      timers.add(t);
    };
    for (const el of [panel, dock]) {
      if (!el) continue;
      watch.observe(el, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ["data-blocked", "data-copied", "data-on"] });
      el.addEventListener("click", onClick, true);
    }
    return () => {
      watch.disconnect(); timers.forEach(clearTimeout);
      for (const el of [panel, dock]) el?.removeEventListener("click", onClick, true);
    };
  }, [text, label, copyLabel, steps, inline]);

  // After the fallback renders: make sure its first lines are on screen and not under the sticky bar or the floating
  // bar (the panel's top for the main text, the text itself beside a step), then focus and select it.
  useEffect(() => {
    if (!fallback || !pre.current) return;
    const r = pre.current.getBoundingClientRect();
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
    let top = Math.max(head.current?.getBoundingClientRect().bottom ?? 0, header), bottom = innerHeight;
    const d = dockWrap.current?.querySelector<HTMLElement>(".fcopy");
    if (d?.hasAttribute("data-on")) { const dr = d.getBoundingClientRect(); if (dr.top < innerHeight / 2) top = Math.max(top, dr.bottom); else bottom = dr.top; }
    if (r.top < top || r.top + 24 > bottom) { // 24px: at least the first line
      if (fallback.slot) pre.current.scrollIntoView({ block: "center" });
      else root.current?.scrollIntoView({ block: "start" });
    }
    pre.current.focus({ preventScroll: true });
    window.getSelection()?.selectAllChildren(pre.current);
  }, [fallback]);

  // Keep the anchor one Copy bar's height above the panel's end.
  useEffect(() => {
    const bar = head.current, mark = anchor.current;
    if (!bar || !mark) return;
    const size = () => { mark.style.bottom = `${bar.offsetHeight}px`; };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(bar);
    return () => ro.disconnect();
  }, []);

  const onKey = (e: ReactKeyboardEvent) => {
    if (e.key !== "c" && e.key !== "C") return;
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.nativeEvent.isComposing) return;
    if (e.target !== pre.current && e.target !== main.current && editable(e.target)) return;
    if (fallback?.slot && e.target === pre.current) return; // a step's text is showing: C would copy step 1 instead
    const sel = window.getSelection();
    if (sel && String(sel).length && root.current?.contains(sel.anchorNode)) return; // a selection in the panel: Cmd/Ctrl+C is the user's
    e.preventDefault();
    main.current?.click();
  };

  const shown = inline ? { text, name: `${label} text` } : fallback;
  const block = shown && (
    <pre
      ref={pre}
      className="pd-text"
      tabIndex={0}
      role="region"
      aria-label={shown.name}
      translate="no"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a" && pre.current) { e.preventDefault(); window.getSelection()?.selectAllChildren(pre.current); }
      }}
    >{shown.text}</pre>
  );

  return (
    <>
      <section ref={root} className="pd-payload" aria-label={label} onKeyDown={onKey}>
        <div ref={head} className="pd-payload__head">
          <p className="pd-payload__meta"><span className="pd-payload__label">{label}</span>{meta}</p>
          <div className="pd-payload__acts">
            {actions}
            <span className="pd-copywrap">
              <CopyButton className="btn btn--primary pd-copy" text={text} label={copyLabel} icon />
              <kbd className="pd-key" aria-hidden="true" title="Press C to copy">C</kbd>
            </span>
          </div>
        </div>
        {inline ? block : <>
          {block && !fallback?.slot && <div className="pd-fallback">{block}</div>}
          {children}
          {block && fallback?.slot && createPortal(<div className="pd-fallback pd-fallback--step">{block}</div>, fallback.slot)}
        </>}
        <span ref={anchor} className="pd-anchor" aria-hidden="true" />
      </section>
      <div ref={dockWrap} className="pd-dockwrap">
        <FloatingCopy anchor={anchor} text={text} title={title ?? label} detail={title ? label : undefined} label={copyLabel} name={`${copyLabel}: ${title ?? label}`} />
      </div>
    </>
  );
}
