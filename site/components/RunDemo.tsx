"use client";
import { useEffect, useRef, useState } from "react";

const ASK = "new landing page for our CLI";
const STEPS: [string, string, string?][] = [
  ["/impeccable init", "once per project, so later passes know the brand", "Impeccable plugin"],
  ["/hallmark", "build the page in a chosen genre"],
  ["/break-ui", "stress the hero and cards with ugly data"],
  ["/web-design-guidelines", "rule check before shipping", "Vercel plugin"],
  ["/impeccable polish", "final spacing and detail pass", "Impeccable plugin"],
];

// The run types itself out, then loops. Without script, or with reduced motion, it stays complete and still.
export function RunDemo() {
  const [typed, setTyped] = useState(ASK.length);
  const [shown, setShown] = useState(STEPS.length + 1);
  const [now, setNow] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(true);
  const ref = useRef<HTMLElement>(null);
  const visible = useRef(true);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setStill(mq.matches);
    on(); mq.addEventListener("change", on);
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; });
    if (ref.current) io.observe(ref.current);
    return () => { mq.removeEventListener("change", on); io.disconnect(); };
  }, []);

  useEffect(() => {
    if (still) { setPlaying(false); setTyped(ASK.length); setShown(STEPS.length + 1); setNow(-1); return; }
    setPlaying(true);
    const plan: [number, () => void][] = [];
    plan.push([0, () => { setTyped(0); setShown(0); setNow(-1); }]);
    for (let i = 1; i <= ASK.length; i++) plan.push([i === 1 ? 500 : 45, () => setTyped(i)]);
    plan.push([500, () => setShown(1)]);
    STEPS.forEach((_, i) => plan.push([260, () => setShown(i + 2)]));
    STEPS.forEach((_, i) => plan.push([i ? 700 : 600, () => setNow(i)]));
    plan.push([3200, () => {}]);
    let step = 0, timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (paused || !visible.current) { timer = setTimeout(tick, 250); return; }
      const [ms, fn] = plan[step];
      timer = setTimeout(() => { fn(); step = (step + 1) % plan.length; tick(); }, ms);
    };
    tick();
    return () => clearTimeout(timer);
  }, [still, paused]);

  return (
    <section className="run" aria-label="A real run of the /design command" ref={ref}>
      <div className="run__head">
        <span>Claude Code, design-kit</span>
        {!still && <button className="pause" type="button" onClick={() => setPaused((p) => !p)}>{paused ? "Play" : "Pause"}</button>}
      </div>
      <div className={`run__body${playing ? " playing" : ""}`}>
        <p className="prompt-line"><b>/design</b> <span>{ASK.slice(0, typed)}</span><span className="caret" aria-hidden="true" /></p>
        <p className={`route line${shown >= 1 ? " on" : ""}`}><strong>Route:</strong> the New landing page recipe, because a page built from blank should not look templated.</p>
        <ol className="steps">
          {STEPS.map(([c, d, tag], i) => (
            <li key={c} className={`line${shown >= i + 2 ? " on" : ""}${now === i ? " now" : ""}`}>
              <span className="n">{i + 1}</span><span className="c">{c}</span>
              <span className="d">{d}{tag && <span className="tag">{tag}</span>}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="run__note">Steps 1, 4 and 5 use companion plugins that install separately. <a className="lic" href="/prompts/new-landing-page">See the recipe</a>.</p>
    </section>
  );
}
