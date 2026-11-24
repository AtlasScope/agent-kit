"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AgentMark } from "./AgentMark";
import { clearHandoff, saveHandoff } from "./install-choice";
import type { Orbit, Visit } from "./orbit";
import { TALL_SCREEN } from "./orbit/params";
import { HERO, INSTALL_MESSAGE, SITE } from "@/lib/site";

// The homepage: one screen and nothing below it. The headline, one sentence and Install over a live view from orbit.
// On a tall phone, one or two more real requests (HERO.more) follow the note, above the horizon.
// Install copies one message on the click (INSTALL_MESSAGE: a sentence to paste into any agent's chat), then the
// planet sinks and the sky fades to black while the words lift away, and the install page (/install) settles in out
// of that black and says the message is copied. It is the same on a phone and a computer, for every agent.
//
// The view is drawn from code (components/orbit): a planet at first light, generated and lit in the browser. Behind
// it sits a still of the same scene at rest, made by scripts/build-hero-images.mjs. The still is what shows first,
// what shows with reduced motion, and what stays if the browser cannot draw the scene or loses the means to.
//
// The opening plays once per visit, about three and a half seconds: the planet rises out of the dark, the sun comes
// up over the limb, the headline lifts out of its masks and the rest follows. It is held until the scene can draw
// its first frame (or a short wait runs out), so the words and the sky always start on the same clock. Any click,
// key, wheel or touch ends the words' part at once and hurries the sunrise. With reduced motion, or before the
// script runs, nothing plays.
const KEY = "agent-kit:launched";
// How long the opening lasts for the words (the scene settles for a few seconds more; see orbit/score.ts).
const INTRO_MS = 3400;
// How long the opening waits for the scene before it plays over the still instead.
const WAIT_MS = 900;
// The hand-off to the install page.
const LEAVE_MS = 560;
// Once the scene has settled, so little moves that half the frames are enough. A moving pointer gets all of them.
const SETTLED_AFTER = 14, ACTIVE_GAP = 14, IDLE_GAP = 31;

const WIDE = [960, 1440, 1920, 2560, 3840];
const TALL = [780, 1170];
const set = (name: string, widths: number[], ext: string) => widths.map((w) => `/hero/${name}-${w}.${ext} ${w}w`).join(", ");
const ARROW = <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
// Runs before paint on a full page load. Old /#install links (the install strip used to sit under the hero) go to the
// install page first, whatever the motion setting. data-live arms the scene; data-intro stages the opening once per
// visit, and data-hold keeps it dark until the scene is ready. If the page's script never arrives, the hold lifts on
// its own and the text plays. ?replay in the address plays the opening again. React does not run this script when the
// homepage is reached by a link inside the site; the effect below arms the scene itself then, without the opening.
// Under `next dev` the opening plays on every full load, so a refresh shows the whole flow while tuning it.
const REPLAY = process.env.NODE_ENV === "development" ? "true" : `/[?&]replay/.test(location.search)`;
const ARM = `try{if(location.hash==="#install")location.replace("/install");var s=document.currentScript.parentElement;if(${REPLAY})sessionStorage.removeItem("${KEY}");if(!matchMedia("(prefers-reduced-motion: reduce)").matches){s.setAttribute("data-live","");if(!sessionStorage.getItem("${KEY}")){s.setAttribute("data-intro","");s.setAttribute("data-hold","");setTimeout(function(){if(s.hasAttribute("data-hold")){s.setAttribute("data-go",String(performance.now()));s.removeAttribute("data-hold")}},1800)}}}catch(e){}`;

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// How much the scene asks of the machine. Phones and small laptops start a step down; the renderer then trades
// resolution for frame rate by itself if it has to.
function tierFor() {
  const cores = navigator.hardwareConcurrency || 4, memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8;
  if (cores <= 4 || memory <= 4) return "low";
  return matchMedia("(pointer: coarse)").matches || Math.min(innerWidth, innerHeight) < 700 ? "medium" : "high";
}

// Arriving at the guide from Start here, a new visitor is offered a free account there (StartWelcome.tsx).
const markStartHere = () => { try { sessionStorage.setItem("agent-kit:start-here", String(Date.now())); } catch {} };

// `art` swaps the scene for one of the experimental directions in components/horizon (the /horizon pages only).
export function LaunchHero({ headline, blur, art }: { headline: string; blur: string; art?: string }) {
  const ref = useRef<HTMLElement>(null);
  const leaveAt = useRef(0);
  // The hand-off in progress, if any; `stop` cancels it and brings the homepage back.
  const leaving = useRef<{ stop: (forget?: boolean) => void } | null>(null);
  const router = useRouter();
  const [live, setLive] = useState(false);
  const finish = useCallback(() => {
    ref.current?.removeAttribute("data-intro");
    try { sessionStorage.setItem(KEY, "1"); } catch {}
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (location.hash === "#install") { router.replace("/install"); return; }
    if (!el.hasAttribute("data-live") && !matchMedia("(prefers-reduced-motion: reduce)").matches) el.setAttribute("data-live", "");
    if (!el.hasAttribute("data-live")) { finish(); return; }
    const $ = <T extends HTMLElement = HTMLElement>(r: string) => el.querySelector<T>(`[data-r="${r}"]`)!;
    const cv = $<HTMLCanvasElement>("gl"), earth = $("earth");

    // The opening's clock starts when the hold lifts: here, or from the fallback timer in ARM. It runs on the wall
    // clock, not on frames, so a slow or sleeping tab still arrives on time. A visit that skips the opening starts
    // long after its end. `from` is where the clock stood at `mark`; `rate` is how fast it has run since.
    let intro = el.hasAttribute("data-intro"), from = intro ? 0 : 1e6, mark = -1, rate = 1;
    const openingAt = (now: number) => (mark < 0 ? from : from + ((now - mark) * rate) / 1000);
    const go = () => {
      if (mark >= 0) return;
      // If ARM's timer lifted the hold before this script arrived, the words are already that far along.
      if (el.hasAttribute("data-hold")) { el.removeAttribute("data-hold"); mark = performance.now(); }
      else mark = Number(el.getAttribute("data-go")) || performance.now();
    };
    if (intro && !el.hasAttribute("data-hold")) go();
    const wait = intro ? setTimeout(go, WAIT_MS) : 0;

    // The scene's code arrives on its own, after the words: the page never waits on it.
    let orbit: Orbit | null = null, score: typeof import("./orbit") | null = null, sky: Visit, gone = false;
    let stage: ReturnType<typeof import("./horizon").createStage> | null = null;
    if (art) import("./horizon").then((module) => {
      if (gone) return;
      const asked = new URLSearchParams(location.search);
      try {
        stage = module.createStage(cv, { direction: module.DIRECTIONS[art] ?? module.DIRECTIONS.day, tall: () => matchMedia(TALL_SCREEN).matches, cloud: asked.get("cloud") || undefined, rate: asked.has("rate") ? Number(asked.get("rate")) : undefined, onError: () => {} });
      } catch { stage = null; go(); }
      kick();
    }, go);
    else import("./orbit").then((module) => {
      if (gone) return;
      score = module;
      // Each visit gets its own sky: a seed for the climate, or the one in the address (?sky=12) to see one again.
      const asked = Number(new URLSearchParams(location.search).get("sky"));
      sky = module.visit(Number.isFinite(asked) && asked > 0 ? asked : module.freshSeed());
      // If the scene fails later (a shader the driver rejects, a machine far too slow), it is put away for good
      // and the still stays.
      const giveUp = () => { orbit?.dispose(); orbit = null; showing(false); go(); };
      const which = () => (matchMedia(TALL_SCREEN).matches ? "tall" as const : "wide" as const);
      try { orbit = module.createOrbit(cv, { tier: tierFor(), frame: which, onError: giveUp }); } catch { orbit = null; }
      if (!orbit) go();
      kick();
    }, go);

    // The canvas covers the still only while it has a picture to show.
    let shown = false;
    const showing = (on: boolean) => {
      if (on === shown) return;
      shown = on;
      // A scene that is ready only after the opening has begun over the still (a slow machine, or a browser that
      // compiles shaders slowly) fades in over it instead of replacing it mid-movement.
      if (on && intro && mark >= 0 && performance.now() - mark > 100) el.setAttribute("data-late", "");
      el.classList.toggle("is-live", on);
      setLive(on);
      if (on) go();
    };

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; };

    // `paced`: the last frame was drawn at the active pace and the loop has run without a break since. Only then is
    // the gap before the next one a fair measure of how fast this machine draws, however long that gap is: the
    // renderer's governor needs the slow frames of a slow machine most of all. A gap that follows the idle pace, a
    // pause off screen or in a background tab, or the end of the hand-off says nothing about speed and is not counted.
    let raf = 0, onScreen = true, drawn = 0, paced = false;
    const t0 = performance.now();
    function frame(now: number) {
      raf = 0;
      if (!onScreen || document.hidden) { paced = false; return; }
      // Before the hold lifts the scene stays dark; after, the opening runs on its own clock.
      const opening = openingAt(now);
      if (intro && opening * 1000 >= INTRO_MS) { intro = false; finish(); }
      mouse.x = mix(mouse.x, mouse.tx, .06); mouse.y = mix(mouse.y, mouse.ty, .06);
      // Leaving for the install page: the planet sinks and the light goes out.
      const lv = leaveAt.current ? clamp((now - leaveAt.current) / LEAVE_MS) : 0;
      const moving = opening < SETTLED_AFTER || lv > 0 || Math.abs(mouse.tx - mouse.x) + Math.abs(mouse.ty - mouse.y) > .002;
      // Once the hand-off has faded the scene out there is nothing to draw, unless the hand-off is called off: the
      // loop keeps turning so the scene is there again if the homepage comes back.
      const out = lv >= 1;
      if (!out && orbit && score && now - drawn >= (moving ? ACTIVE_GAP : IDLE_GAP)) {
        const steady = moving && paced;
        drawn = now;
        // The climate (orbit/climate.ts) moves the light, the cloud tops and the aurora slowly while the page stays.
        const time = (now - t0) / 1000, weather = score.climate(sky, time);
        orbit.set(weather.look);
        const shot = score.play({ opening, leave: lv, time, px: mouse.x, py: mouse.y, clock: score.weatherClock(sky, time) }, { ...score.DEFAULTS, ...weather.look });
        showing(orbit.render({ ...shot, steady }));
        paced = moving;
      } else if (!out && stage && now - drawn >= IDLE_GAP - 4) {
        // The horizon scene never rests, but it moves slowly: thirty frames a second carry it.
        drawn = now;
        showing(stage.frame({ now, opening, leave: lv, px: mouse.x, py: mouse.y }));
      } else if (out) paced = false;
      // Without the live scene the opening plays over the still: it rises and comes up out of the dark.
      if (!out && !shown) {
        const rise = 1 - Math.exp(-opening / 1.1), light = 1 - .8 * Math.exp(-opening / .6);
        earth.style.transform = rise < .999 ? `translateY(${(.3 * (1 - rise) * 100).toFixed(2)}%)` : "";
        earth.style.filter = light < .999 ? `brightness(${light.toFixed(3)})` : "";
      }
      raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; kick(); }, { threshold: 0 });
    io.observe(el);
    // A skipped opening is not cut: the words finish at once, and the sunrise is hurried to its end.
    const skip = () => {
      if (!intro) return;
      go();
      const now = performance.now();
      from = openingAt(now); mark = now; rate = 8;
      intro = false; finish();
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) => addEventListener(e, skip, { passive: true }));
    addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", kick);
    kick();
    return () => {
      gone = true;
      clearTimeout(wait); cancelAnimationFrame(raf); io.disconnect();
      events.forEach((e) => removeEventListener(e, skip));
      removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", kick);
      // Leaving the page gives the graphics memory back at once.
      orbit?.dispose(); stage?.dispose();
    };
  }, [finish, router, art]);
  // Leaving the homepage cancels a hand-off still in progress. It keeps the note it may have saved: when the install
  // page is what replaced the homepage, this runs just before that page reads it.
  useEffect(() => () => leaving.current?.stop(false), []);

  // Install copies the message inside the click (browsers allow it only there), plays the hand-off, then opens the
  // install page, which reads what happened and says so. A modified click is left to the link, which opens the page in
  // a new tab. Any other navigation during the hand-off wins: a link click, Back or Forward cancels it and brings the
  // homepage back, and if the install page never arrives the homepage comes back on its own.
  const install = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    e.preventDefault();
    if (leaving.current) return;
    const el = ref.current;
    let copied: Promise<boolean>;
    try { copied = navigator.clipboard.writeText(INSTALL_MESSAGE).then(() => true, () => false); } catch { copied = Promise.resolve(false); }
    const quick = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false, safety = 0;
    const onClick = (ev: MouseEvent) => { const t = (ev.target as Element | null)?.closest?.("a"); if (t && !t.classList.contains("launch__go")) stop(); };
    const onPop = () => stop();
    const onShow = (ev: PageTransitionEvent) => { if (ev.persisted) stop(); };
    const stop = (forget = true) => {
      if (cancelled) return;
      cancelled = true; clearTimeout(safety); if (forget) clearHandoff();
      leaving.current = null; leaveAt.current = 0; el?.removeAttribute("data-leave");
      document.removeEventListener("click", onClick, true);
      removeEventListener("popstate", onPop); removeEventListener("pageshow", onShow);
    };
    leaving.current = { stop };
    document.addEventListener("click", onClick, true);
    addEventListener("popstate", onPop); addEventListener("pageshow", onShow);
    if (!quick) { leaveAt.current = performance.now(); el?.setAttribute("data-leave", ""); }
    Promise.all([copied, new Promise((r) => setTimeout(r, quick ? 0 : LEAVE_MS))]).then(([ok]) => {
      if (cancelled) return;
      saveHandoff(ok ? { message: true } : { blocked: true });
      router.push("/install");
      safety = window.setTimeout(() => stop(), 8000);
    });
  };

  const words = headline.split(" ");
  return (
    <section ref={ref} className={`launch${live ? " is-live" : ""}`} aria-labelledby="hero-h" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: ARM }} />
      <div data-r="scene" className="launch__scene" aria-hidden="true">
        <picture data-r="earth" className="launch__earth" style={art ? { visibility: "hidden" } : { backgroundImage: `url(${blur})` }}>
          <source media={TALL_SCREEN} type="image/avif" srcSet={set("orbit-tall", TALL, "avif")} sizes="100vw" />
          <source media={TALL_SCREEN} type="image/webp" srcSet={set("orbit-tall", TALL, "webp")} sizes="100vw" />
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
          <p className="launch__lede">Skills and prompts for <span className="launch__agent"><AgentMark id="claude" />Claude Code</span>, <span className="launch__agent"><AgentMark id="codex" />Codex</span> and <span className="launch__agent"><AgentMark id="cursor" />Cursor</span>. Describe the job in plain words; your agent follows a written method for it.</p>
          <p className="launch__eg" translate="no">
            <code>{HERO.example.router} {HERO.example.request}</code><span aria-hidden="true">→</span><span className="sr"> picks </span><span className="launch__to"><i className="led is-on" aria-hidden="true" /><code className="launch__pick">{HERO.example.pick}</code></span>
          </p>
          <div className="launch__cta">
            <Link className="btn btn--lg btn--solid launch__go" href="/install" onClick={install} aria-describedby="launch-note"><span>Install Agent Kit</span>{ARROW}</Link>
            <Link className="launch__new" href="/start" onClick={markStartHere}>New to coding agents? Start here{ARROW}</Link>
          </div>
          <p className="launch__note" id="launch-note">Copies a message to paste into your agent.</p>
          <ul className="launch__more" translate="no" aria-label="More requests it takes">
            {HERO.more.map((m) => (
              <li key={m.case}>
                <code>{m.router} {m.request}</code><span aria-hidden="true">→</span><span className="sr"> picks </span><span className="launch__to"><i className="led is-on" aria-hidden="true" /><span className="launch__pick">{m.label}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <ul className="launch__legal" aria-label="About this site">
          <li><Link href="/about">About</Link></li>
          <li><Link href="/privacy">Privacy</Link></li>
          <li><Link href="/terms">Terms</Link></li>
          <li><a href={`${SITE.repo}/blob/main/CREDITS.md`}>Credits</a></li>
        </ul>
      </div>
    </section>
  );
}
