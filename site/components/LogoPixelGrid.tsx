"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

export function LogoPixelGrid({ sticky, children }: { sticky: boolean; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return;

    function align() {
      if (!box) return;
      const { left, top } = box.getBoundingClientRect();
      const dpr = window.devicePixelRatio;
      // The sticky header stays in the viewport. The footer moves with the document.
      const y = sticky ? top : top + window.scrollY;
      box.style.setProperty("--logo-x", `${Math.round(left * dpr) / dpr - left}px`);
      box.style.setProperty("--logo-y", `${Math.round(y * dpr) / dpr - y}px`);
    }

    align();
    const observer = new ResizeObserver(align);
    observer.observe(document.body);
    observer.observe(box);
    window.addEventListener("resize", align);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", align);
    };
  }, [sticky]);

  return <span className="aslogo-grid" ref={ref}>{children}</span>;
}
