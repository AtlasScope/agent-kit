"use client";
import { useEffect, useRef } from "react";

// "On this page" for reading pages. The section being read is marked as the current one as you scroll,
// and the same list sits in a disclosure at the top of the page on narrow screens.
export function DocToc({ items }: { items: { id: string; title: string }[] }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = ref.current;
    if (!nav || !("IntersectionObserver" in window)) return;
    const secs = items.map((i) => document.getElementById(i.id)).filter((s): s is HTMLElement => Boolean(s));
    const seen = new Map<string, boolean>();
    const mark = () => {
      // The first section on screen is current; past the last one, the last one stays current.
      const id = items.find((i) => seen.get(i.id))?.id;
      if (!id) return;
      nav.querySelectorAll("a").forEach((a) => {
        if (a.getAttribute("href") === `#${id}`) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
      });
    };
    const io = new IntersectionObserver((es) => { es.forEach((e) => seen.set(e.target.id, e.isIntersecting)); mark(); }, { rootMargin: "-80px 0px -45% 0px" });
    secs.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items]);
  return (
    <nav className="doc__toc" aria-label="On this page" ref={ref}>
      <p>On this page</p>
      <ol>{items.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}</ol>
    </nav>
  );
}
