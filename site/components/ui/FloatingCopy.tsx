"use client";
import { useEffect, useState, type RefObject } from "react";
import { CopyButton } from "@/components/CopyButton";

// A compact Copy bar that appears once a panel's own Copy has scrolled up behind the header, so the reader can still
// copy from further down the page. Under the header on a computer, along the bottom on a phone (40rem and down).
// `anchor` is the element whose bottom edge marks "scrolled away", usually the panel's own Copy button or its row.
// Render the anchor in the same commit as the bar (the ref is read once, on mount). Pass `name` so the two Copy
// buttons are told apart by a screen reader, for example "Copy the install command".
// The bar never shows before the reader reaches the panel, and is inert while hidden so it takes no focus.
// Styles: .fcopy in app/styles/primitives.css. Reduced motion removes its travel.
export function FloatingCopy({ anchor, text, title, detail, name, label = "Copy" }: {
  anchor: RefObject<HTMLElement | null>; text: string; title: string; detail?: string; name?: string; label?: string;
}) {
  const [away, setAway] = useState(false);
  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    // Measured per frame on scroll and resize: the header's height changes between breakpoints.
    let raf = 0;
    const check = () => {
      raf = 0;
      const head = document.querySelector<HTMLElement>(".top");
      setAway(el.getBoundingClientRect().bottom <= (head ? head.getBoundingClientRect().bottom : 0) + 1);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", queue); removeEventListener("resize", queue); };
  }, [anchor]);
  return (
    <div className="fcopy" data-on={away || undefined} inert={!away}>
      <span className="fcopy__label">
        <span className="fcopy__title">{title}</span>
        {detail && <span className="fcopy__detail">{detail}</span>}
      </span>
      <CopyButton className="btn btn--sm btn--primary fcopy__copy" text={text} label={label} name={name} icon />
    </div>
  );
}
