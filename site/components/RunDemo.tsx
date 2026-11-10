"use client";
import { useEffect, useState } from "react";

const ASK = "new landing page for our CLI";
const STEPS: [string, string, string?][] = [
  ["/impeccable init", "once per project, so later passes know the brand", "Impeccable plugin"],
  ["/hallmark", "build the page in a chosen genre"],
  ["/break-ui", "stress the hero and cards with ugly data"],
  ["/web-design-guidelines", "rule check before shipping", "Vercel plugin"],
  ["/impeccable polish", "final spacing and detail pass", "Impeccable plugin"],
];

// The run is shown complete and still. Play types it out once, then it rests complete again.
// With reduced motion set there is no Play button.
export function RunDemo() {
  const [typed, setTyped] = useState(ASK.length);
  const [shown, setShown] = useState(STEPS.length + 1);
  const [now, setNow] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => { setCanPlay(!mq.matches); if (mq.matches) setPlaying(false); };
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!playing) { setTyped(ASK.length); setShown(STEPS.length + 1); setNow(-1); return; }
    const plan: [number, () => void][] = [[0, () => { setTyped(0); setShown(0); setNow(-1); }]];
    for (let i = 1; i <= ASK.length; i++) plan.push([i === 1 ? 400 : 45, () => setTyped(i)]);
    plan.push([500, () => setShown(1)]);
    STEPS.forEach((_, i) => plan.push([260, () => setShown(i + 2)]));
    STEPS.forEach((_, i) => plan.push([i ? 700 : 600, () => setNow(i)]));
    plan.push([1600, () => setPlaying(false)]);
    let step = 0, timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (step >= plan.length) return;
      const [ms, fn] = plan[step++];
      timer = setTimeout(() => { fn(); tick(); }, ms);
    };
    tick();
    return () => clearTimeout(timer);
  }, [playing]);

  return (
    <div className="run">
      <div className="run__head">
        <span>Example workflow, Claude Code, design-kit</span>
        {canPlay && (
          <button className="pause" type="button" onClick={() => setPlaying((p) => !p)}>
            <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">{playing ? <path d="M7 7h10v10H7z" /> : <path d="M8 5.5v13l11-6.5z" />}</svg>
            {playing ? "Stop" : "Play"}
          </button>
        )}
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
    </div>
  );
}
