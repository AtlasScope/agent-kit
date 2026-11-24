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
  /** The page title, repeated in the dock so its Copy says what it copies. */
  title?: string;
  /** Exact texts of per-step Copy buttons in `children`, by index. Each such button sits inside an element with
   *  `data-step={index}`, so a blocked step copy can show and select the text it would have copied. */
  steps?: (string | null)[];
};

type Fallback = { text: string; name: string; n: number };

const BLOCKED = /blocked/i;
const editable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(el.tagName));

// The exact text a prompt copies, with the one Copy that matters in a header that stays in reach while you read.
// Copy itself is the shared CopyButton (frozen API). This panel adds, around it:
//   - when the clipboard is blocked, the text that press would have copied is shown (if the panel's body is something
//     else, such as the steps of a split recipe) and selected, so the fallback is one keystroke (Cmd/Ctrl+C);
//   - while focus is inside the panel, C copies and Cmd/Ctrl+A inside the text selects only the text. The single-key
//     shortcut is scoped to the panel so it can't fire from stray typing or speech input elsewhere (WCAG 2.1.4);
//   - a dock at the bottom of the screen carries the same Copy whenever the panel's own Copy bar is not fully on
//     screen, so Copy is in reach from the top of the page to the footer.
export function Payload({ label, meta, text, copyLabel, actions, children, title, steps }: Props) {
  const root = useRef<HTMLElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const main = useRef<HTMLButtonElement | null>(null);
  const dock = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState<Fallback | null>(null);
  const [docked, setDocked] = useState(false);
  const inline = !children; // the exact text is the panel body

  // Blocked presses. CopyButton reports a blocked clipboard only through its label, so watch the label change, and
  // also check it on every press: a repeat press while the label already says "blocked" changes nothing in the DOM.
  useEffect(() => {
    const panel = root.current;
    if (!panel) return;
    main.current = panel.querySelector<HTMLButtonElement>(".pd-copy");
    const textFor = (btn: Element): Fallback | null => {
      const step = btn.closest<HTMLElement>("[data-step]");
      if (step && steps) {
        const i = Number(step.dataset.step);
        const t = steps[i];
        return t ? { text: t, name: `Step ${i + 1} text`, n: Date.now() } : null;
      }
      // The main Copy: name the text by what the button says it copies ("Copy step 1" -> "Step 1 text").
      const what = copyLabel.replace(/^Copy\s+/i, "");
      return { text, name: inline ? `${label} text` : `${what[0].toUpperCase()}${what.slice(1)} text`, n: Date.now() };
    };
    const onBlocked = (btn: Element) => { const f = textFor(btn); if (f) setFallback(f); };
    const isCopy = (el: Element | null) => el?.closest(".pd-copy, .pd-stepcopy") ?? null;

    const watch = new MutationObserver((records) => {
      for (const r of records) {
        const btn = isCopy(r.target instanceof Element ? r.target : r.target.parentElement);
        if (!btn) continue;
        if (BLOCKED.test(btn.textContent || "")) onBlocked(btn);
        else if (btn.hasAttribute("data-copied") && !inline) {
          // A later copy worked: hide the fallback, handing focus back to the button if it was in the text.
          if (pre.current?.contains(document.activeElement)) (btn as HTMLElement).focus({ preventScroll: true });
          setFallback(null);
        }
      }
    });
    // A press while the label already says "blocked" changes nothing in the DOM if it is blocked again, so check
    // once the clipboard call has had time to settle. A success turns the label to "Copied" first and is skipped.
    const onClick = (e: MouseEvent) => {
      const btn = isCopy(e.target as Element);
      if (!btn || !BLOCKED.test(btn.textContent || "")) return;
      setTimeout(() => { if (BLOCKED.test(btn.textContent || "") && !btn.hasAttribute("data-copied")) onBlocked(btn); }, 400);
    };
    for (const el of [panel, dock.current]) {
      if (!el) continue;
      watch.observe(el, { subtree: true, characterData: true, childList: true, attributes: true, attributeFilter: ["data-copied"] });
      el.addEventListener("click", onClick, true);
    }
    return () => { watch.disconnect(); for (const el of [panel, dock.current]) el?.removeEventListener("click", onClick, true); };
  }, [text, label, copyLabel, steps, inline]);

  // After the fallback renders: bring the panel's top under the header (so the sticky bar doesn't cover the first
  // lines), focus the text and select it.
  useEffect(() => {
    if (!fallback || !pre.current) return;
    const r = pre.current.getBoundingClientRect();
    const barBottom = head.current?.getBoundingClientRect().bottom ?? 0;
    if (r.top < barBottom || r.top > innerHeight) root.current?.scrollIntoView({ block: "start" });
    pre.current.focus({ preventScroll: true });
    window.getSelection()?.selectAllChildren(pre.current);
  }, [fallback]);

  // The dock shows while the panel's Copy bar is not wholly visible below the site header. The header's height
  // changes with the breakpoint, so the observer is rebuilt on resize with the header's current bottom edge.
  useEffect(() => {
    const bar = head.current;
    if (!bar) return;
    let seen: IntersectionObserver | undefined;
    const build = () => {
      seen?.disconnect();
      // The bar sticks at --header-h, so measure against that same number, with 2px of tolerance for zoom rounding.
      const top = Math.floor(parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0);
      const steps = Array.from({ length: 51 }, (_, i) => i / 50);
      seen = new IntersectionObserver(([e]) => setDocked(e.boundingClientRect.height - e.intersectionRect.height > 2), { rootMargin: `-${top}px 0px 0px 0px`, threshold: steps });
      seen.observe(bar);
    };
    build();
    addEventListener("resize", build);
    return () => { seen?.disconnect(); removeEventListener("resize", build); };
  }, []);

  const onKey = (e: ReactKeyboardEvent) => {
    if (e.key !== "c" && e.key !== "C") return;
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.nativeEvent.isComposing) return;
    if (e.target !== pre.current && e.target !== main.current && editable(e.target)) return;
    if (String(window.getSelection() || "").length) return;
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
        {inline ? block : <>{block && <div className="pd-fallback">{block}</div>}{children}</>}
      </section>
      <div ref={dock} className="pd-dock" data-on={docked || undefined} inert={!docked} aria-hidden={!docked || undefined}>
        {title && <span className="pd-dock__t">{title}</span>}
        <CopyButton className="btn btn--primary pd-copy pd-dock__copy" text={text} label={copyLabel} name={title ? `${copyLabel}: ${title}` : undefined} icon />
      </div>
    </>
  );
}
