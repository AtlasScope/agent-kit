"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { startOrbit, type OrbitInputs } from "./orbit-gl";

// The homepage opening, staged as a sunrise from orbit. Telemetry types in over black, a hairline marks the
// horizon, the planet rises, the sun breaks over the limb, then the headline lifts out of its masks. After
// that the scene keeps living: clouds drift, the planet turns, the atmosphere breathes, a craft runs the
// orbit track, the camera answers the pointer and the scroll, and an example /design route types itself.
// Resting state is the final frame: no script, reduced motion or a second visit shows it at once.
const KEY = "agent-kit:launched";
const INTRO_MS = 4200;

const WIDE = [960, 1440, 1920, 2560, 3840];
const TALL = [780, 1170];
const set = (name: string, widths: number[], ext: string) => widths.map((w) => `/hero/${name}-${w}.${ext} ${w}w`).join(", ");
const ARROW = <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
// ?replay in the address plays the opening again and shows a Replay button, for tuning it.
const ARM = `try{var s=document.currentScript.parentElement;if(/[?&]replay/.test(location.search))sessionStorage.removeItem("${KEY}");if(!sessionStorage.getItem("${KEY}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches)s.setAttribute("data-intro","")}catch(e){}`;

// Illustrative requests and the skill /design would pick for each, from the design kit's own catalogue.
const ROUTES: [string, string][] = [
  ["the settings page feels cramped", "/refactoring-ui"],
  ["the fonts look off on mobile", "/web-typography"],
  ["colours go muddy in dark mode", "/color-expert"],
  ["the buttons feel dead", "/microinteractions"],
  ["people sign up and never come back", "/improve-retention"],
];

const pad = (n: number) => String(n).padStart(2, "0");
const ease = (x: number) => { const t = Math.min(1, Math.max(0, x)); return 1 - Math.pow(1 - t, 4); };

export function LaunchHero({ headline, by, skills, prompts, kits, blur }: { headline: string; by: string; skills: number; prompts: number; kits: number; blur: string }) {
  const ref = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const start = useRef(0);
  const intro = useRef(false);
  const [met, setMet] = useState(0);
  const [live, setLive] = useState(false);
  const [route, setRoute] = useState(0);
  const [lab, setLab] = useState(false);

  const finish = useCallback(() => {
    intro.current = false;
    ref.current?.removeAttribute("data-intro");
    try { sessionStorage.setItem(KEY, "1"); } catch {}
  }, []);

  const replay = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.removeAttribute("data-intro");
    void el.offsetWidth;
    el.setAttribute("data-intro", "");
    intro.current = true;
    start.current = performance.now();
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const el = ref.current, cv = canvas.current;
    if (!el || !cv) return;
    start.current = performance.now();
    intro.current = el.hasAttribute("data-intro");
    setLab(/[?&]replay/.test(location.search));
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clock = setInterval(() => setMet(Math.floor((performance.now() - start.current) / 1000)), 1000);
    const cycle = setInterval(() => setRoute((r) => (r + 1) % ROUTES.length), 5200);

    const read = (): OrbitInputs => {
      if (!intro.current) return { rise: 1, sun: 1, expo: 1, hud: 1 };
      const t = (performance.now() - start.current) / 1000;
      if (t * 1000 > INTRO_MS) finish();
      return { expo: .25 + .75 * ease((t - .3) / 1.8), rise: ease((t - .7) / 2.2), sun: ease((t - 1.5) / 2.2), hud: ease((t - 2.6) / 1.2) };
    };
    let stop: (() => void) | null = null;
    if (!reduced) {
      const src = cv.clientWidth * Math.min(devicePixelRatio || 1, 1.5) > 2000 ? "/hero/orbit-2560.webp" : "/hero/orbit-1920.webp";
      try { stop = startOrbit(cv, src, read, () => setLive(true)); } catch { stop = null; }
    }

    const skip = () => { if (intro.current) { start.current = performance.now() - INTRO_MS; finish(); } };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, skip, { passive: true }));
    if (!intro.current) finish();
    return () => { clearInterval(clock); clearInterval(cycle); stop?.(); events.forEach((e) => window.removeEventListener(e, skip)); };
  }, [finish]);

  const words = headline.split(" ");
  const [ask, pick] = ROUTES[route];
  return (
    <section ref={ref} className={`launch${live ? " is-live" : ""}`} aria-labelledby="hero-h" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: ARM }} />
      <div className="launch__stage" aria-hidden="true">
        <picture className="launch__earth" style={{ backgroundImage: `url(${blur})` }}>
          <source media="(max-width: 720px)" type="image/avif" srcSet={set("orbit-tall", TALL, "avif")} sizes="100vw" />
          <source media="(max-width: 720px)" type="image/webp" srcSet={set("orbit-tall", TALL, "webp")} sizes="100vw" />
          <source type="image/avif" srcSet={set("orbit", WIDE, "avif")} sizes="100vw" />
          <source type="image/webp" srcSet={set("orbit", WIDE, "webp")} sizes="100vw" />
          <img src="/hero/orbit-1920.webp" alt="" width={3840} height={2160} fetchPriority="high" decoding="async" />
        </picture>
        <canvas ref={canvas} className="launch__gl" />
        <div className="launch__shade" />
        <div className="launch__line" />
      </div>

      <div className="launch__hud container" aria-hidden="true">
        <p className="launch__tel"><span>Agent Kit <b>·</b> {kits} kits <b>·</b> {skills} skills <b>·</b> {prompts} prompts <b>·</b> status nominal</span></p>
        <p className="launch__met">
          {lab && <button type="button" className="launch__replay" onClick={replay}>Replay ↺</button>}
          <span>T+{pad(Math.floor(met / 3600))}:{pad(Math.floor(met / 60) % 60)}:{pad(met % 60)}</span>
        </p>
      </div>

      <div className="launch__body container">
        <h1 id="hero-h">
          {words.map((w, i) => (
            <span key={i} className="launch__w" style={{ "--i": i } as React.CSSProperties}><span>{w}</span>{i < words.length - 1 ? " " : ""}</span>
          ))}
        </h1>
        <p className="launch__lede">Skills and prompts for Claude Code, Codex and Cursor. Describe the job in plain words; your agent follows a written method for it.</p>
        <div className="launch__cta">
          <a className="btn btn--lg btn--solid launch__go" href="#install"><span>Install Agent Kit</span>{ARROW}</a>
          <Link className="launch__new" href="/start">New to coding agents? Start here{ARROW}</Link>
        </div>
        <p className="launch__by">{by}</p>
      </div>

      <div className="launch__foot container">
        <p className="launch__route" aria-live="off">
          <span className="launch__route-k">Example · /design</span>
          <span key={route} className="launch__route-v"><q>{ask}</q> <b>→</b> <code>{pick}</code></span>
        </p>
        <a className="launch__cue" href="#install"><span>Install</span><i aria-hidden="true" /></a>
      </div>
    </section>
  );
}
