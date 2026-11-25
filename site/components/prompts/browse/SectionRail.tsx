"use client";
import { useEffect, useRef, useState } from "react";

export type RailItem = { id: string; label: string; n?: number; sec?: string };

// The library's sections as one row of links under the header. It stays in view while the page scrolls and marks
// the section on screen (aria-current="location"). Plain anchor links, so it works before and without JavaScript.
export function SectionRail({ items, label }: { items: RailItem[]; label: string }) {
  const [current, setCurrent] = useState<string | null>(null);
  const rail = useRef<HTMLElement>(null);

  useEffect(() => {
    const targets = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length) return;
    // The current section is the last one whose top has passed a line a third of the way down the screen. At the
    // bottom of the page the last section is current even if it is too short to reach that line.
    let frame = 0;
    const update = () => {
      frame = 0;
      // Never above the rail's bottom edge, so a short screen still marks the section a rail link jumped to.
      const railBottom = rail.current?.getBoundingClientRect().bottom ?? 0;
      const line = Math.max(window.innerHeight / 3, railBottom + 24);
      const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      let at: HTMLElement | null = null;
      for (const t of targets) if (t.getBoundingClientRect().top <= line) at = t;
      if (atEnd) at = targets[targets.length - 1];
      setCurrent(at ? at.id : null);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(frame); };
  }, [items]);

  // Keep the current link visible inside the rail on a phone, where the rail scrolls sideways.
  useEffect(() => {
    if (!current || !rail.current) return;
    const a = rail.current.querySelector<HTMLElement>(`a[href="#${current}"]`);
    const r = rail.current.querySelector<HTMLElement>(".rail__list");
    if (!a || !r || r.scrollWidth <= r.clientWidth) return;
    const left = a.offsetLeft - (r.clientWidth - a.offsetWidth) / 2;
    r.scrollTo({ left, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [current]);

  return (
    <nav className="rail" aria-label={label} ref={rail}>
      <ul className="rail__list">
        {items.map((i) => (
          <li key={i.id}>
            <a className="rail__a" href={`#${i.id}`} data-sec={i.sec} aria-current={current === i.id ? "location" : undefined}>
              <span>{i.label}</span>
              {i.n != null && <span className="rail__n">{i.n}<span className="sr"> prompts</span></span>}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
