"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AGENTS } from "@/lib/site";
import { CopyButton } from "./CopyButton";
import { startOrbit, type OrbitCamera } from "./orbit-gl";

// The homepage hero, in two acts. The opening (once per visit, about three seconds): the planet rises out of
// black, the sun breaks over the limb, and the headline lifts out of its masks. Then scrolling plays a short
// demonstration on a pinned stage: the message leaves, the planet sinks, a terminal opens, a plain request
// types itself in, /design names the skill it routed to, the method unfolds a step at a time, and the install
// line arrives with Copy. The scene keeps living throughout (clouds, a slow turn, the sun, stars, the pointer).
// With reduced motion, or before the script runs, there is no stage: the message fills the first screen and
// the terminal sits under it, complete and still.
const KEY = "agent-kit:launched";
const INTRO_MS = 3400;

const WIDE = [960, 1440, 1920, 2560, 3840];
const TALL = [780, 1170];
const set = (name: string, widths: number[], ext: string) => widths.map((w) => `/hero/${name}-${w}.${ext} ${w}w`).join(", ");
const ARROW = <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
// Runs before paint. data-theatre arms the scroll stage; data-intro stages the opening once per visit.
// ?replay in the address plays the opening again and shows Replay and Play buttons, for tuning.
const ARM = `try{var s=document.currentScript.parentElement;if(/[?&]replay/.test(location.search))sessionStorage.removeItem("${KEY}");if(!matchMedia("(prefers-reduced-motion: reduce)").matches){s.setAttribute("data-theatre","");if(!sessionStorage.getItem("${KEY}"))s.setAttribute("data-intro","")}}catch(e){}`;

// An illustration of one /design run, written from the router's first-line rule and the refactoring-ui
// skill's own method. It is not a recorded session.
const ASK = "/design the settings page feels cramped";
const STEPS = [
  "Scores the page against eight checks, out of 10",
  "Puts every gap on one spacing scale",
  "Sets hierarchy with size and weight before colour",
  "Shows you the change before anything is committed",
];
const CLAUDE = AGENTS.find((a) => a.id === "claude")!;

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const eo = (x: number) => 1 - Math.pow(1 - clamp(x), 4);
const eio = (x: number) => { const t = clamp(x); return t < .5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2; };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function LaunchHero({ headline, blur }: { headline: string; blur: string }) {
  const ref = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const earth = useRef<HTMLPictureElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const term = useRef<HTMLElement>(null);
  const typed = useRef<HTMLSpanElement>(null);
  const caret = useRef<HTMLSpanElement>(null);
  const route = useRef<HTMLParagraphElement>(null);
  const steps = useRef<HTMLOListElement>(null);
  const install = useRef<HTMLDivElement>(null);
  const introAt = useRef(-1e9);
  const intro = useRef(false);
  const playing = useRef(0);
  const [live, setLive] = useState(false);
  const [lab, setLab] = useState(false);
  const [isPlaying, setPlaying] = useState(false);

  const finish = useCallback(() => {
    intro.current = false;
    ref.current?.removeAttribute("data-intro");
    try { sessionStorage.setItem(KEY, "1"); } catch {}
  }, []);

  // Scroll so the stage shows progress p (0..1).
  const toP = useCallback((p: number) => {
    const el = ref.current, st = pin.current;
    if (!el || !st) return;
    const top = el.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(st).top) || 0);
    scrollTo({ top: top + p * (el.offsetHeight - st.offsetHeight), behavior: "instant" });
  }, []);

  const stop = useCallback(() => { cancelAnimationFrame(playing.current); playing.current = 0; setPlaying(false); }, []);

  const replay = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    stop();
    toP(0);
    el.removeAttribute("data-intro");
    void el.offsetWidth;
    el.setAttribute("data-intro", "");
    intro.current = true;
    introAt.current = performance.now();
  }, [stop, toP]);

  const play = useCallback(() => {
    if (playing.current) return stop();
    const el = ref.current, st = pin.current;
    if (!el || !st) return;
    const r = el.getBoundingClientRect(), top = parseFloat(getComputedStyle(st).top) || 0;
    const now = clamp((top - r.top) / (el.offsetHeight - st.offsetHeight));
    const from = now > .98 ? 0 : now, t0 = performance.now(), dur = 11000 * (1 - from);
    setPlaying(true);
    const step = (t: number) => { const k = clamp((t - t0) / dur); toP(from + (1 - from) * k); playing.current = k < 1 ? requestAnimationFrame(step) : (setPlaying(false), 0); };
    playing.current = requestAnimationFrame(step);
  }, [stop, toP]);

  useEffect(() => {
    const el = ref.current, st = pin.current, cv = canvas.current;
    if (!el || !st || !cv) return;
    if (!el.hasAttribute("data-theatre")) { finish(); return; }
    setLab(/[?&]replay/.test(location.search));
    intro.current = el.hasAttribute("data-intro");
    introAt.current = intro.current ? performance.now() : -1e9;

    let draw: ReturnType<typeof startOrbit> = null;
    try {
      const src = cv.clientWidth * Math.min(devicePixelRatio || 1, 1.5) > 2000 ? "/hero/orbit-2560.webp" : "/hero/orbit-1920.webp";
      draw = startOrbit(cv, src, () => setLive(true));
    } catch { draw = null; }

    const lis = Array.from(steps.current?.children ?? []) as HTMLElement[];
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; };
    let stickTop = 0;
    const measure = () => { stickTop = parseFloat(getComputedStyle(st).top) || 0; };
    measure();

    let raf = 0, visible = true, last = -1;
    function frame(now: number) {
      raf = 0;
      if (!visible || document.hidden) return;
      const W = st!.clientWidth, H = st!.clientHeight;
      const r = el!.getBoundingClientRect();
      const p = clamp((stickTop - r.top) / Math.max(1, r.height - H));
      const ip = clamp((now - introAt.current) / INTRO_MS);
      if (intro.current && ip >= 1) finish();
      mouse.x += (mouse.tx - mouse.x) * .045; mouse.y += (mouse.ty - mouse.y) * .045;

      // Camera: cover the stage, bottom-anchored, planet to the right; the opening lifts it into place and the
      // demonstration sinks it out of the way.
      const drop = eio(seg(p, .04, .3));
      const rise = eo(seg(ip, .12, .75));
      const s0 = Math.max(W / 1920, H / 1080);
      const ox = (W - 1920 * s0) * (W < 720 ? .86 : .72) - mouse.x * W * .012;
      const oy = H - 1080 * s0 + H * .34 * (1 - rise) + H * .48 * drop - mouse.y * H * .01;
      const cam: OrbitCamera = { s: s0 * (1 + .16 * (1 - rise)), ox, oy, rise, sun: eo(seg(ip, .32, .95)),
        expo: mix(.2, 1, eo(seg(ip, 0, .6))) * (1 - .3 * drop), hud: eo(seg(ip, .7, 1)) * (1 - drop) };
      if (draw) draw(cam, now);

      // The page itself only changes when the scroll does.
      if (Math.abs(p - last) > .0004) {
        last = p;
        if (!draw && earth.current) earth.current.style.transform = `translateY(${H * .48 * drop}px)`;
        const o = eo(seg(p, .02, .14)), b = body.current!.style;
        b.opacity = String(1 - o); b.filter = o ? `blur(${o * 12}px)` : ""; b.transform = o ? `translateY(${-o * 70}px) scale(${1 - o * .04})` : "";
        b.visibility = o > .99 ? "hidden" : ""; b.pointerEvents = o > .5 ? "none" : "";
        const t = eo(seg(p, .14, .28)), ts = term.current!.style;
        ts.clipPath = `inset(${(1 - t) * 50}% 0 ${(1 - t) * 50}% 0 round 16px)`; ts.transform = `translate(-50%, -50%) scale(${.94 + .06 * t})`;
        ts.visibility = t > 0 ? "visible" : "hidden";
        typed.current!.textContent = ASK.slice(0, Math.round(ASK.length * seg(p, .28, .44)));
        caret.current!.style.display = p > .45 ? "none" : "";
        const show = (n: HTMLElement | null, k: number, dx: number, dy: number) => {
          if (!n) return;
          n.style.opacity = String(k); n.style.transform = `translate(${(1 - k) * dx}px, ${(1 - k) * dy}px)`;
          n.style.filter = k < 1 ? `blur(${(1 - k) * 4}px)` : ""; n.style.visibility = k > 0 ? "visible" : "hidden";
        };
        show(route.current, eo(seg(p, .46, .53)), 0, 8);
        lis.forEach((li, i) => { const a = .54 + i * .06; show(li, eo(seg(p, a, a + .06)), -14, 0); });
        show(install.current, eo(seg(p, .8, .9)), 0, 12);
      }
      raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }, { threshold: 0 });
    io.observe(el);
    const skip = () => { if (intro.current) { introAt.current = performance.now() - INTRO_MS; finish(); } };
    const halt = () => { if (playing.current) stop(); };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) => addEventListener(e, skip, { passive: true }));
    addEventListener("wheel", halt, { passive: true }); addEventListener("touchstart", halt, { passive: true });
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("resize", measure);
    document.addEventListener("visibilitychange", kick);
    kick();
    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      events.forEach((e) => removeEventListener(e, skip));
      removeEventListener("wheel", halt); removeEventListener("touchstart", halt);
      removeEventListener("pointermove", onMove); removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", kick);
    };
  }, [finish, stop]);

  const words = headline.split(" ");
  return (
    <section ref={ref} className={`launch${live ? " is-live" : ""}`} aria-labelledby="hero-h" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: ARM }} />
      <div ref={pin} className="launch__pin">
        <div className="launch__scene" aria-hidden="true">
          <picture ref={earth} className="launch__earth" style={{ backgroundImage: `url(${blur})` }}>
            <source media="(max-width: 720px)" type="image/avif" srcSet={set("orbit-tall", TALL, "avif")} sizes="100vw" />
            <source media="(max-width: 720px)" type="image/webp" srcSet={set("orbit-tall", TALL, "webp")} sizes="100vw" />
            <source type="image/avif" srcSet={set("orbit", WIDE, "avif")} sizes="100vw" />
            <source type="image/webp" srcSet={set("orbit", WIDE, "webp")} sizes="100vw" />
            <img src="/hero/orbit-1920.webp" alt="" width={3840} height={2160} fetchPriority="high" decoding="async" />
          </picture>
          <canvas ref={canvas} className="launch__gl" />
          <div className="launch__shade" />
        </div>

        <div ref={body} className="launch__body">
          <div className="launch__msg container">
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
          </div>
        </div>

        <figure ref={term} className="launch__term" aria-labelledby="term-cap">
          <div className="launch__bar" aria-hidden="true"><i /><i /><i /><span>claude · example</span></div>
          <figcaption id="term-cap" className="launch__sr">An example of asking /design for help with a cramped settings page.</figcaption>
          <div className="launch__screen">
            <p className="launch__ask" translate="no"><span className="launch__full">{ASK}</span><span ref={typed} className="launch__typed" aria-hidden="true" /><span ref={caret} className="launch__caret" aria-hidden="true" /></p>
            <p ref={route} className="launch__route"><b>Route:</b> <code translate="no">/refactoring-ui</code>, because the page needs clearer spacing and hierarchy. It edits files and shows you the change before anything is committed.</p>
            <ol ref={steps} className="launch__steps">
              {STEPS.map((s, i) => <li key={s}><b aria-hidden="true">{i + 1}</b>{s}</li>)}
            </ol>
            <div ref={install} className="launch__install">
              <code translate="no">{CLAUDE.steps[0].split(" ").map((w, i) => <span key={i}>{i ? " " : ""}<span className="nw">{w}</span></span>)}</code>
              <span className="launch__more">+{CLAUDE.steps.length - 1} install lines</span>
              <CopyButton className="launch__copy" text={CLAUDE.steps.join("\n")} label="Copy all" name="Copy all Claude Code install lines" />
            </div>
          </div>
        </figure>

        {lab && (
          <div className="launch__lab">
            <button type="button" onClick={replay}>Replay ↺</button>
            <button type="button" onClick={play}>{isPlaying ? "Pause" : "Play ▶"}</button>
          </div>
        )}
      </div>
    </section>
  );
}
