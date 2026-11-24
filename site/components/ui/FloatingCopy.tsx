"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { CopyButton } from "@/components/CopyButton";

// A compact Copy bar that appears once a panel's own Copy has scrolled up behind the header, so the reader can still
// copy from further down the page. Under the header on a computer, along the bottom on a phone (40rem and down).
// `anchor` is the element whose top edge marks "scrolled away", usually the panel's own Copy button or its row: the bar
// shows at the first pixel the anchor slides under the header, so one of the two Copy buttons can always be pressed.
// `end` (optional) is where the bar stops being relevant: once its bottom edge is behind the header too, the bar hides.
// Render both in the same commit as the bar (the refs are read on mount). Pass `name` so the two Copy buttons are told
// apart by a screen reader, for example "Copy the install command".
// If the clipboard refuses, the bar keeps its message up, the page scrolls the anchor back into view and focus moves to
// the anchor's first control, so the reader can select the text there.
// The bar never shows before the reader reaches the panel, and is inert while hidden so it takes no focus.
// Styles: .fcopy in app/styles/primitives.css. Reduced motion removes its travel.
export function FloatingCopy({ anchor, end, text, title, detail, name, label = "Copy" }: {
  anchor: RefObject<HTMLElement | null>; end?: RefObject<HTMLElement | null>; text: string; title: string; detail?: string; name?: string; label?: string;
}) {
  const [away, setAway] = useState(false);
  // While the bar's Copy reports a blocked clipboard, the bar stays up so its message stays readable and announced.
  const [held, setHeld] = useState(false);
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
  // A blocked clipboard: bring the panel back, where its text can be selected, and move focus to the panel's first
  // control so a keyboard user lands next to the text. data-blocked is CopyButton's documented contract.
  useEffect(() => {
    const b = bar.current?.querySelector("button");
    if (!b) return;
    const watch = new MutationObserver(() => {
      const blocked = b.hasAttribute("data-blocked");
      setHeld(blocked);
      const el = anchor.current;
      if (!blocked || !el) return;
      el.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      el.querySelector<HTMLElement>("button, a[href], [tabindex]")?.focus({ preventScroll: true });
    });
    watch.observe(b, { attributes: true, attributeFilter: ["data-blocked"] });
    return () => watch.disconnect();
  }, [anchor]);
  return (
    <div className="fcopy" ref={bar} data-on={away || held || undefined} inert={!(away || held)}>
      <span className="fcopy__label">
        <span className="fcopy__title">{title}</span>
        {detail && <span className="fcopy__detail">{detail}</span>}
      </span>
      <CopyButton className="btn btn--sm btn--primary fcopy__copy" text={text} label={label} name={name} icon />
    </div>
  );
}
