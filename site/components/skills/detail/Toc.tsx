"use client";
import { useEffect, useState } from "react";
import type { TocItem } from "./prose";

// The skill's sections, with the one you're reading marked. The marker follows scrolling; nothing animates on its own.
export function Toc({ items, label }: { items: TocItem[]; label: string }) {
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => Boolean(e));
    if (!els.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // The current section is the last heading that has passed the top third of the screen.
      let last: string | null = null;
      for (const el of els) if (el.getBoundingClientRect().top < window.innerHeight * 0.33) last = el.id;
      // At the very bottom the last sections can't reach the top third; the last one is then the one being read.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1) last = els[els.length - 1].id;
      setCurrent(last);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(frame); };
  }, [items]);
  return (
    <nav className="sd-toc" aria-label={label}>
      <p className="sd-toc__h">On this page</p>
      <ol>
        {items.map((i) => (
          <li key={i.id}><a href={`#${i.id}`} aria-current={current === i.id ? "location" : undefined}>{i.text}</a></li>
        ))}
      </ol>
    </nav>
  );
}
