"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { CopyButton } from "@/components/CopyButton";

const TABBABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

// A compact Copy bar that appears once a panel's own Copy has scrolled up behind the header, so the reader can still
// copy from further down the page. Under the header on a computer, along the bottom on a phone (40rem and down).
// `anchor` is the element whose top edge marks "scrolled away", usually the panel's own Copy button or its row: the bar
// shows at the first pixel the anchor slides under the header, so one of the two Copy buttons can always be pressed.
// `end` (optional) is where the bar stops being relevant: once its bottom edge is behind the header too, the bar hides.
// `target` (optional) is the element holding the text. If the clipboard refuses a press of the bar's Copy, the page
// scrolls the target (or the anchor) back into view, selects the target's text so Cmd/Ctrl+C finishes the job, and
// moves focus there (to the anchor's first control, or the anchor, without a target). The bar stays up while its
// "Copy blocked" message shows, so the message is seen and announced.
// Render all refs in the same commit as the bar (they are read on mount). Pass `name` so the two Copy buttons are told
// apart by a screen reader, for example "Copy the install command".
// The bar is inert while hidden so it takes no focus. Styles: .fcopy in app/styles/primitives.css.
export function FloatingCopy({ anchor, end, target, text, title, detail, name, label = "Copy" }: {
  anchor: RefObject<HTMLElement | null>; end?: RefObject<HTMLElement | null>; target?: RefObject<HTMLElement | null>;
  text: string; title: string; detail?: string; name?: string; label?: string;
}) {
  const [away, setAway] = useState(false);
  const [held, setHeld] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  // True while focus is in the bar, or was until the bar went inert under it (a blur with nowhere to go).
  const focused = useRef(false);
  const shown = away || held;
  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    // Measured per frame on scroll and resize: the header's height changes between breakpoints.
    let raf = 0;
    const check = () => {
      raf = 0;
      const head = document.querySelector<HTMLElement>(".top");
      const line = head ? head.getBoundingClientRect().bottom : 0;
      const past = el.getBoundingClientRect().top < line - 1;
      const done = !!end?.current && end.current.getBoundingClientRect().bottom <= line + 1;
      setAway(past && !done);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", queue); removeEventListener("resize", queue); };
  }, [anchor, end]);
  // Where focus goes after a block: the target, else the anchor's first control, else the anchor. A tabindex added
  // here is removed again when focus leaves.
  const land = () => {
    const t = target?.current, a = anchor.current;
    const el = t || (a?.matches(TABBABLE) ? a : a?.querySelector<HTMLElement>(TABBABLE)) || a;
    if (!el) return null;
    if (!el.matches(TABBABLE) && !el.hasAttribute("tabindex")) {
      el.tabIndex = -1;
      el.addEventListener("blur", () => el.removeAttribute("tabindex"), { once: true });
    }
    return el;
  };
  // CopyButton's documented data-blocked, set afresh on each press: recover only for a block this bar's press caused.
  useEffect(() => {
    const b = bar.current?.querySelector("button");
    if (!b) return;
    let pressed = false;
    const press = () => { pressed = true; };
    const watch = new MutationObserver(() => {
      const blocked = b.hasAttribute("data-blocked");
      setHeld(blocked);
      if (b.hasAttribute("data-copied")) pressed = false;
      if (!blocked || !pressed) return;
      pressed = false;
      const t = target?.current;
      (t || anchor.current)?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      land()?.focus({ preventScroll: true });
      if (t) { const r = document.createRange(); r.selectNodeContents(t); const sel = getSelection(); sel?.removeAllRanges(); sel?.addRange(r); }
    });
    watch.observe(b, { attributes: true, attributeFilter: ["data-blocked", "data-copied"] });
    b.addEventListener("click", press);
    return () => { watch.disconnect(); b.removeEventListener("click", press); };
  }, [anchor, target]);
  // If the bar is about to hide while it holds focus, hand focus to the panel instead of letting it drop to the page.
  useEffect(() => {
    if (shown || !focused.current) return;
    focused.current = false;
    if (!document.activeElement || document.activeElement === document.body || bar.current?.contains(document.activeElement)) land()?.focus({ preventScroll: true });
  }, [shown]);
  return (
    <div className="fcopy" ref={bar} data-on={shown || undefined} inert={!shown}
      onFocus={() => { focused.current = true; }} onBlur={(e) => { if (e.relatedTarget) focused.current = false; }}>
      <span className="fcopy__label">
        <span className="fcopy__title">{title}</span>
        {detail && <span className="fcopy__detail">{detail}</span>}
      </span>
      <CopyButton className="btn btn--sm btn--primary fcopy__copy" text={text} label={label} name={name} icon />
    </div>
  );
}
