"use client";
import { useEffect, useRef, useState } from "react";

import { REVEAL_KEY as KEY } from "@/lib/reveal";
const SKIP_KEYS = ["Escape", "Enter", " ", "Tab"];

type Frame = { text: string; draft: boolean; sel?: boolean };

// The prompt-box reveal: two false starts typed into an agent input, select-all deleted, then the headline. About 3.5s, once per session.
export function HeroHeadline({ text, drafts }: { text: string; drafts: string[] }) {
  const [frame, setFrame] = useState<Frame>({ text, draft: false });
  const [cursor, setCursor] = useState(false);
  const typeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("js-reveal")) { root.classList.add("settled"); window.dispatchEvent(new Event("hero-settled")); return; }
    const rise = [...document.querySelectorAll<HTMLElement>(".rise")];
    rise.forEach((el) => (el.inert = true));
    const timers: ReturnType<typeof setTimeout>[] = [];
    let done = false;
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    function settle() {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      setFrame({ text, draft: false }); setCursor(true);
      setTimeout(() => setCursor(false), 500);
      root.classList.add("settled");
      rise.forEach((el) => (el.inert = false));
      try { sessionStorage.setItem(KEY, "1"); } catch {}
      window.dispatchEvent(new Event("hero-settled"));
      removeEventListener("pointerdown", settle);
      removeEventListener("keydown", onKey);
    }
    const onKey = (e: KeyboardEvent) => { if (SKIP_KEYS.includes(e.key)) settle(); };
    addEventListener("pointerdown", settle);
    addEventListener("keydown", onKey);

    root.classList.add("typing");
    setCursor(true);
    let t = 200;
    setFrame({ text: "", draft: true });
    for (const d of drafts) {
      at(t, () => setFrame({ text: "", draft: true }));
      for (let i = 1; i <= d.length; i++) { const s = d.slice(0, i); at(t, () => setFrame({ text: s, draft: true })); t += 14 + (i % 7 === 0 ? 20 : 0); }
      t += 260; at(t, () => setFrame({ text: d, draft: true, sel: true }));
      t += 140; at(t, () => setFrame({ text: "", draft: true }));
      t += 160;
    }
    let entered = false;
    for (let i = 1; i <= text.length; i++) {
      const s = text.slice(0, i);
      at(t, () => {
        setFrame({ text: s, draft: false });
        if (!entered && typeRef.current) { entered = true; typeRef.current.animate([{ opacity: 0, filter: "blur(6px)", transform: "translateY(4px)" }, { opacity: 1, filter: "blur(0)", transform: "none" }], { duration: 240, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }); }
      });
      t += 22;
    }
    at(t + 100, settle);
    return () => { timers.forEach(clearTimeout); removeEventListener("pointerdown", settle); removeEventListener("keydown", onKey); };
  }, [text, drafts]);

  return (
    <h1 className={frame.draft ? "" : "final"}>
      <span className="sr">{text}</span>
      <span className="shell" aria-hidden="true">
        <span ref={typeRef} className={`type${frame.draft ? " draft" : ""}${frame.sel ? " sel" : ""}`}>
          {frame.text}{cursor && <span className={`cur${!frame.draft && frame.text === text ? " out" : ""}`} />}
        </span>
      </span>
    </h1>
  );
}
