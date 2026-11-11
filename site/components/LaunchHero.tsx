"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { COPIED_KEY, commandFor, lastAgent } from "./install-choice";
import { startOrbit, type OrbitCamera } from "./orbit-gl";

// The homepage: one screen and nothing below it. The headline, one sentence and Install over a live view from orbit.
// Install copies the visitor's install command on the click, then the planet sinks and the sky fades to black while
// the words lift away, and the install page (/install) settles in out of that black and says the command is copied.
// The opening plays once per visit, about three and a half seconds: the planet rises out of black, the sun breaks
// over the limb, the headline lifts out of its masks and the rest follows. It is held until the scene can draw its
// first frame (or a short wait runs out), so the words and the sky always start on the same clock. Any click, key,
// wheel or touch skips to the end. With reduced motion, or before the script runs, nothing plays.
const KEY = "agent-kit:launched";
const INTRO_MS = 3400;
// How long the opening waits for the scene before it plays over the photograph instead.
const WAIT_MS = 1200;
// The hand-off to the install page.
const LEAVE_MS = 560;

const WIDE = [960, 1440, 1920, 2560, 3840];
const TALL = [780, 1170];
const set = (name: string, widths: number[], ext: string) => widths.map((w) => `/hero/${name}-${w}.${ext} ${w}w`).join(", ");
const ARROW = <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
// Runs before paint. data-live arms the scene; data-intro stages the opening once per visit, and data-hold keeps it
// dark until the scene is ready. If the page's script never arrives, the hold lifts on its own and the text plays.
// ?replay in the address plays the opening again.
const ARM = `try{var s=document.currentScript.parentElement;if(/[?&]replay/.test(location.search))sessionStorage.removeItem("${KEY}");if(!matchMedia("(prefers-reduced-motion: reduce)").matches){s.setAttribute("data-live","");if(!sessionStorage.getItem("${KEY}")){s.setAttribute("data-intro","");s.setAttribute("data-hold","");setTimeout(function(){if(s.hasAttribute("data-hold")){s.setAttribute("data-go",String(performance.now()));s.removeAttribute("data-hold")}},2600)}}}catch(e){}`;

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const eo = (x: number) => 1 - Math.pow(1 - clamp(x), 4);
const eio = (x: number) => { const t = clamp(x); return t < .5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2; };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function LaunchHero({ headline, blur }: { headline: string; blur: string }) {
  const ref = useRef<HTMLElement>(null);
  const leaveAt = useRef(0);
  const router = useRouter();
  const [live, setLive] = useState(false);
  const finish = useCallback(() => {
    ref.current?.removeAttribute("data-intro");
    try { sessionStorage.setItem(KEY, "1"); } catch {}
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!el.hasAttribute("data-live")) { finish(); return; }
    const $ = <T extends HTMLElement = HTMLElement>(r: string) => el.querySelector<T>(`[data-r="${r}"]`)!;
    const scene = $("scene"), cv = $<HTMLCanvasElement>("gl"), earth = $("earth");

    // The opening's clock starts when the hold lifts: here, or from the fallback timer in ARM.
    let intro = el.hasAttribute("data-intro"), introAt = intro ? -1 : -1e9;
    const go = () => {
      if (introAt !== -1) return;
      if (el.hasAttribute("data-hold")) { el.removeAttribute("data-hold"); introAt = performance.now(); }
      else introAt = Number(el.getAttribute("data-go")) || performance.now();
    };
    if (intro && !el.hasAttribute("data-hold")) go();
    const wait = intro ? setTimeout(go, WAIT_MS) : 0;

    let draw: ReturnType<typeof startOrbit> = null;
    try {
      const src = cv.clientWidth * Math.min(devicePixelRatio || 1, 1.5) > 2000 ? "/hero/orbit-2560.webp" : "/hero/orbit-1920.webp";
      draw = startOrbit(cv, src, () => { el.classList.add("is-live"); setLive(true); go(); });
    } catch { draw = null; }
    if (!draw) go();

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; };
    let W = 0, H = 0, narrow = false;
    const measure = () => { W = scene.clientWidth; H = scene.clientHeight; narrow = W < 760; };
    measure();

    let raf = 0, onScreen = true;
    function frame(now: number) {
      raf = 0;
      if (!onScreen || document.hidden) return;
      // Before the hold lifts the scene stays black; after, the opening runs on its own clock.
      const ip = introAt === -1 ? 0 : clamp((now - introAt) / INTRO_MS);
      if (intro && ip >= 1) { intro = false; finish(); }
      mouse.x = mix(mouse.x, mouse.tx, .06); mouse.y = mix(mouse.y, mouse.ty, .06);
      const rise = eo(seg(ip, .12, .75));
      const s0 = Math.max(W / 1920, H / 1080);
      // Leaving for the install page: the planet sinks and the light goes out.
      const lv = leaveAt.current ? eio(clamp((now - leaveAt.current) / LEAVE_MS)) : 0;
      const expo = mix(.2, 1, eo(seg(ip, 0, .6))) * (1 - lv);
      const cam: OrbitCamera = { s: s0 * (1 + .16 * (1 - rise)), ox: (W - 1920 * s0) * (narrow ? .86 : .72) - mouse.x * W * .012,
        oy: H - 1080 * s0 + H * .34 * (1 - rise) + H * .3 * lv - mouse.y * H * .01, rise, sun: eo(seg(ip, .32, .95)),
        expo, hud: eo(seg(ip, .7, 1)) };
      if (draw) draw(cam, now);
      if (!draw || !el!.classList.contains("is-live")) {
        earth.style.transform = rise < .999 ? `translateY(${.34 * (1 - rise) * 100}%)` : "";
        earth.style.filter = expo < .999 ? `brightness(${expo})` : "";
      }
      raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(frame); };
    router.prefetch("/install");
    // Old links to the install strip that used to sit under the hero.
    if (location.hash === "#install") router.replace("/install");
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; kick(); }, { threshold: 0 });
    io.observe(el);
    const skip = () => { if (intro) { if (introAt === -1) go(); introAt = performance.now() - INTRO_MS; } };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) => addEventListener(e, skip, { passive: true }));
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("resize", measure);
    document.addEventListener("visibilitychange", kick);
    kick();
    return () => {
      clearTimeout(wait); cancelAnimationFrame(raf); io.disconnect();
      events.forEach((e) => removeEventListener(e, skip));
      removeEventListener("pointermove", onMove); removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", kick);
    };
  }, [finish, router]);

  // Install copies the command inside the click (browsers allow it only there), plays the hand-off, then opens the
  // install page, which reads what happened and says so. A modified click opens the page in a new tab as usual.
  const install = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    e.preventDefault();
    if (leaveAt.current) return;
    const a = lastAgent();
    let copied: Promise<string>;
    try { copied = navigator.clipboard.writeText(commandFor(a)).then(() => a.id, () => "blocked"); } catch { copied = Promise.resolve("blocked"); }
    const quick = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!quick) { leaveAt.current = performance.now(); ref.current?.setAttribute("data-leave", ""); }
    Promise.all([copied, new Promise((r) => setTimeout(r, quick ? 0 : LEAVE_MS))]).then(([c]) => {
      try { sessionStorage.setItem(COPIED_KEY, c); } catch {}
      router.push("/install");
    });
  };

  const words = headline.split(" ");
  return (
    <section ref={ref} className={`launch${live ? " is-live" : ""}`} aria-labelledby="hero-h" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: ARM }} />
      <div data-r="scene" className="launch__scene" aria-hidden="true">
        <picture data-r="earth" className="launch__earth" style={{ backgroundImage: `url(${blur})` }}>
          <source media="(max-width: 720px)" type="image/avif" srcSet={set("orbit-tall", TALL, "avif")} sizes="100vw" />
          <source media="(max-width: 720px)" type="image/webp" srcSet={set("orbit-tall", TALL, "webp")} sizes="100vw" />
          <source type="image/avif" srcSet={set("orbit", WIDE, "avif")} sizes="100vw" />
          <source type="image/webp" srcSet={set("orbit", WIDE, "webp")} sizes="100vw" />
          <img src="/hero/orbit-1920.webp" alt="" width={3840} height={2160} fetchPriority="high" decoding="async" />
        </picture>
        <canvas data-r="gl" className="launch__gl" />
        <div className="launch__shade" />
      </div>

      <div className="launch__first container">
        <div className="launch__msg">
          <h1 id="hero-h">
            {words.map((w, i) => (
              <span key={i} className="launch__w" style={{ "--i": i } as React.CSSProperties}><span>{w}</span>{i < words.length - 1 ? " " : ""}</span>
            ))}
          </h1>
          <p className="launch__lede">Skills and prompts for Claude Code, Codex and Cursor. Describe the job in plain words; your agent follows a written method for it.</p>
          <div className="launch__cta">
            <a className="btn btn--lg btn--solid launch__go" href="/install" onClick={install}><span>Install Agent Kit</span>{ARROW}</a>
            <Link className="launch__new" href="/start">New to coding agents? Start here{ARROW}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
