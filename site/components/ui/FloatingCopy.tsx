"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { CopyButton } from "@/components/CopyButton";

const TABBABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

// A compact Copy bar that appears once a panel's own Copy has scrolled up behind the header, so the reader can still
// copy from further down the page. Under the header on a computer, along the bottom on a phone (40rem and down).
// `anchor` is the element whose top edge marks "scrolled away", usually the panel's own Copy button or its row: the bar
// shows at the first pixel the anchor slides under the header, so one of the two Copy buttons can always be pressed.
// `end` (optional) is where the bar stops being relevant: once its bottom edge is behind the header too, the bar hides.
// `target` (optional) is the element holding the text. If the clipboard refuses, the page scrolls it (or the anchor)
// back into view, selects its text so Cmd/Ctrl+C finishes the job, and moves focus there before the bar hides.
// Render all refs in the same commit as the bar (they are read on mount). Pass `name` so the two Copy buttons are told
// apart by a screen reader, for example "Copy the install command".
// The bar is inert while hidden so it takes no focus. Styles: .fcopy in app/styles/primitives.css.
export function FloatingCopy({ anchor, end, target, text, title, detail, name, label = "Copy" }: {
  anchor: RefObject<HTMLElement | null>; end?: RefObject<HTMLElement | null>; target?: RefObject<HTMLElement | null>;
  text: string; title: string; detail?: string; name?: string; label?: string;
}) {
  const [away, setAway] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
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
  // A blocked clipboard (CopyButton's documented data-blocked): bring the text back, select it and focus it. Watched on
  // the attribute and re-checked after each press, because a repeat block leaves the attribute set and fires no mutation.
  useEffect(() => {
    const b = bar.current?.querySelector("button");
    if (!b) return;
    const recover = () => {
      if (!b.hasAttribute("data-blocked")) return;
      const t = target?.current, a = anchor.current;
      const el = t || a;
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      if (t) {
        if (!t.hasAttribute("tabindex")) t.tabIndex = -1;
        t.focus({ preventScroll: true });
        const range = document.createRange(); range.selectNodeContents(t);
        const sel = getSelection(); sel?.removeAllRanges(); sel?.addRange(range);
      } else {
        (a?.matches(TABBABLE) ? a : a?.querySelector<HTMLElement>(TABBABLE))?.focus({ preventScroll: true });
      }
    };
    const watch = new MutationObserver(recover);
    watch.observe(b, { attributes: true, attributeFilter: ["data-blocked"] });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const press = () => { clearTimeout(timer); timer = setTimeout(recover, 150); };
    b.addEventListener("click", press);
    return () => { watch.disconnect(); clearTimeout(timer); b.removeEventListener("click", press); };
  }, [anchor, target]);
  return (
    <div className="fcopy" ref={bar} data-on={away || undefined} inert={!away}>
      <span className="fcopy__label">
        <span className="fcopy__title">{title}</span>
        {detail && <span className="fcopy__detail">{detail}</span>}
      </span>
      <CopyButton className="btn btn--sm btn--primary fcopy__copy" text={text} label={label} name={name} icon />
    </div>
  );
}
