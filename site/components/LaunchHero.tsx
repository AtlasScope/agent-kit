"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// The homepage opening, as a launch: telemetry types in over black, a hairline of light marks the horizon,
// Earth rises into frame, then the headline settles. About three seconds, once per visit. Any click, key,
// wheel or touch skips to the end. Every element's resting state is its final state, so with no script,
// reduced motion, or a second visit the page simply shows the last frame.
const KEY = "agent-kit:launched";
const INTRO_MS = 3200;

const WIDE = [960, 1440, 1920, 2560, 3840];
const TALL = [780, 1170];
const set = (name: string, widths: number[], ext: string) => widths.map((w) => `/hero/${name}-${w}.${ext} ${w}w`).join(", ");
const ARROW = <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

// Runs inline before the hero paints, so the intro never flashes its final frame first.
const ARM = `try{var s=document.currentScript.parentElement;if(!sessionStorage.getItem("${KEY}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches)s.setAttribute("data-intro","")}catch(e){}`;

const pad = (n: number) => String(n).padStart(2, "0");

export function LaunchHero({ headline, skills, prompts, kits, blur }: { headline: string; skills: number; prompts: number; kits: number; blur: string }) {
  const ref = useRef<HTMLElement>(null);
  const [met, setMet] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = performance.now();
    const tick = setInterval(() => setMet(Math.floor((performance.now() - start) / 1000)), 1000);
    if (!el.hasAttribute("data-intro")) return () => clearInterval(tick);
    const finish = () => {
      el.removeAttribute("data-intro");
      try { sessionStorage.setItem(KEY, "1"); } catch {}
      off();
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    const off = () => { events.forEach((e) => window.removeEventListener(e, finish)); clearTimeout(t); };
    events.forEach((e) => window.addEventListener(e, finish, { passive: true }));
    const t = setTimeout(finish, INTRO_MS);
    return () => { off(); clearInterval(tick); };
  }, []);

  const words = headline.split(" ");
  return (
    <section ref={ref} className="launch" aria-labelledby="hero-h" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: ARM }} />
      <div className="launch__sky" aria-hidden="true" />
      <div className="launch__earthwrap" aria-hidden="true">
        <picture className="launch__earth" style={{ backgroundImage: `url(${blur})` }}>
          <source media="(max-width: 720px)" type="image/avif" srcSet={set("orbit-tall", TALL, "avif")} sizes="100vw" />
          <source media="(max-width: 720px)" type="image/webp" srcSet={set("orbit-tall", TALL, "webp")} sizes="100vw" />
          <source type="image/avif" srcSet={set("orbit", WIDE, "avif")} sizes="100vw" />
          <source type="image/webp" srcSet={set("orbit", WIDE, "webp")} sizes="100vw" />
          <img src="/hero/orbit-1920.webp" alt="" width={3840} height={2160} fetchPriority="high" decoding="async" />
        </picture>
        <div className="launch__glow" />
      </div>
      <div className="launch__line" aria-hidden="true" />

      <div className="launch__hud container" aria-hidden="true">
        <p className="launch__tel"><span>Agent Kit · {kits} kits · {skills} skills · {prompts} prompts · status nominal</span></p>
        <p className="launch__met">T+{pad(Math.floor(met / 3600))}:{pad(Math.floor(met / 60) % 60)}:{pad(met % 60)}</p>
      </div>

      <div className="launch__body container">
        <h1 id="hero-h">
          {words.map((w, i) => <span key={i} className="launch__w" style={{ "--i": i } as React.CSSProperties}>{w}{i < words.length - 1 ? " " : ""}</span>)}
        </h1>
        <p className="launch__lede">Skills and prompts for Claude Code, Codex and Cursor. Describe the job in plain words; your agent follows a written method for it.</p>
        <div className="launch__cta">
          <a className="btn btn--lg btn--solid" href="#install">Install Agent Kit{ARROW}</a>
          <Link className="launch__new" href="/start">New to coding agents? Start here{ARROW}</Link>
        </div>
      </div>

      <a className="launch__cue" href="#install"><span>Install</span><i aria-hidden="true" /></a>
    </section>
  );
}
