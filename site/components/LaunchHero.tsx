"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO, USED_LINES } from "@/lib/hero-demo";
import { startOrbit, type OrbitCamera } from "./orbit-gl";

// The homepage hero: two screens under one sky.
// Screen 1 is the opening (once per visit, about three seconds): the planet rises out of black, the sun breaks
// over the limb, the headline lifts out of its masks. Scrolling to screen 2 moves the page and nothing else; the
// live scene stays put behind both screens and sinks to a dim horizon on the way down.
// Screen 2 plays a worked example on its own clock, about nineteen seconds, at the pace it was written to be read:
// one real /design request typed into a plain box, the skill it routes to, a bar down SKILL.md's real outline to
// the two sections that match, a thread from "dashboard's" to its Dashboards row, that row's rule at full size
// with its own example, the files this request reads, and "One sentence in." with Install. It starts when most
// of screen 2 is in view, plays once per page load, jumps to its ending if the visitor scrolls away, and has a
// progress bar with Pause and Replay.
// Every quote, range and count comes from lib/hero-demo.ts, which tests/hero-demo.test.mjs checks against the kit.
// With reduced motion, or before the script runs, nothing plays: the same example is laid out flat.
const KEY = "agent-kit:launched";
const INTRO_MS = 3400;

const WIDE = [960, 1440, 1920, 2560, 3840];
const TALL = [780, 1170];
const set = (name: string, widths: number[], ext: string) => widths.map((w) => `/hero/${name}-${w}.${ext} ${w}w`).join(", ");
const ARROW = <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
// Runs before paint. data-theatre arms the two-screen stage; data-intro stages the opening once per visit.
// ?replay in the address plays the opening again.
const ARM = `try{var s=document.currentScript.parentElement;if(/[?&]replay/.test(location.search))sessionStorage.removeItem("${KEY}");if(!matchMedia("(prefers-reduced-motion: reduce)").matches){s.setAttribute("data-theatre","");if(!sessionStorage.getItem("${KEY}"))s.setAttribute("data-intro","")}}catch(e){}`;

const fmt = (n: number) => n.toLocaleString("en-GB");
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const eo = (x: number) => 1 - Math.pow(1 - clamp(x), 4);
const eio = (x: number) => { const t = clamp(x); return t < .5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2; };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// The example's clock. Each pair is [seconds, beat]; beats are the positions the choreography below is written
// in. Holds are the flat stretches, sized so each step can be read before the next begins.
const CLOCK: [number, number][] = [
  [0, .1], [2.4, .16], [2.6, .165], [3.6, .215], [4.6, .235], [5.2, .265], [5.6, .29], [8.4, .35], [9.0, .38],
  [9.4, .42], [10.2, .43], [11.0, .46], [12.2, .5], [12.6, .515], [13.4, .56], [14.0, .59], [15.0, .63],
  [15.6, .665], [16.0, .69], [17.0, .74], [17.6, .77], [18.0, .8], [18.8, .85], [19.4, .89],
];
const LENGTH = CLOCK[CLOCK.length - 1][0];
const END = CLOCK[CLOCK.length - 1][1];
const beatAt = (t: number) => {
  if (t <= 0) return CLOCK[0][1];
  for (let i = 1; i < CLOCK.length; i++) { const [t1, b1] = CLOCK[i], [t0, b0] = CLOCK[i - 1]; if (t <= t1) return mix(b0, b1, (t - t0) / (t1 - t0)); }
  return END;
};
// Where each step starts, for the marks on the progress bar.
const STEPS: [number, string][] = [[0, "Ask"], [2.6, "Route"], [4.6, "Look through SKILL.md"], [9.2, "Read"], [12.4, "The answer"], [15.2, "What it read"], [17.6, "End"]];

const [HIT, ALSO] = DEMO.matches;
const SECTION = DEMO.outline[DEMO.section];
const SKILL_FILE = DEMO.files[0];
const QUIET_ROUTE = "/design picked a skill: a written method your agent follows, here for layout, spacing and hierarchy.";
const QUIET_MATCH = <>Two sections match: <b>{DEMO.outline[HIT].title.replace(/^\d+\. /, "")}</b>, which has a {DEMO.row.context} row, and <b>{DEMO.outline[ALSO].title}</b>, which lists “{DEMO.alsoRow.text}”.</>;
const QUIET_FILES = `For this request it reads ${SKILL_FILE.name}, and opens the one reference line ${DEMO.opensAt.line} sends ${DEMO.opensAt.says} to:`;

// The request, with the two words that matter marked. Rendered twice: in the box, and as the large sentence.
const Request = ({ marked }: { marked?: boolean }) => (
  <>{DEMO.request.split(" ").map((w, i, all) => {
    const tag = w === DEMO.key ? "k1" : w === DEMO.why ? "k2" : "";
    return <span key={i}>{marked && tag ? <span className="lh-key" data-r={tag}>{w}</span> : w}{i < all.length - 1 ? " " : ""}</span>;
  })}</>
);

type Mode = "waiting" | "playing" | "paused" | "done";

export function LaunchHero({ headline, blur }: { headline: string; blur: string }) {
  const ref = useRef<HTMLElement>(null);
  const introAt = useRef(-1e9);
  const intro = useRef(false);
  // The example's state lives in refs so the frame loop reads it without re-rendering; `mode` mirrors it for the buttons.
  const clock = useRef({ t: 0, mode: "waiting" as Mode });
  const [mode, setMode] = useState<Mode>("waiting");
  const [live, setLive] = useState(false);
  const [theatre, setTheatre] = useState(false);

  const go = useCallback((m: Mode, t?: number) => {
    clock.current.mode = m; if (t !== undefined) clock.current.t = t;
    setMode(m);
  }, []);
  const finish = useCallback(() => {
    intro.current = false;
    ref.current?.removeAttribute("data-intro");
    try { sessionStorage.setItem(KEY, "1"); } catch {}
  }, []);
  const toggle = () => { const m = clock.current.mode; if (m === "playing") go("paused"); else if (m === "paused") go("playing"); else go("playing", 0); };
  const replay = () => go("playing", 0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!el.hasAttribute("data-theatre")) { finish(); return; }
    setTheatre(true);
    intro.current = el.hasAttribute("data-intro");
    introAt.current = intro.current ? performance.now() : -1e9;

    const $ = <T extends HTMLElement = HTMLElement>(r: string) => el.querySelector<T>(`[data-r="${r}"]`)!;
    const $$ = (r: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-r="${r}"]`));
    const scene = $("scene"), screen = $("screen"), demo = $("frame"), world = $("world");
    const cv = $<HTMLCanvasElement>("gl"), earth = $("earth"), msg = $("msg");
    const box = $("box"), typed = $("typed"), caret = $("caret"), ph = $("ph"), send = $("send");
    const said = $("said"), meta = $("meta"), wire = $("wire"), skill = $("skill"), quiet = $("quiet"), files = $("files"), sum = $("sum");
    const toc = $("toc"), bar = $("bar"), rows = $$("row"), page = $("page"), mark = $("mark"), refcard = $("refcard"), refs = $$("ref");
    const landed = $("landed"), credit = $("credit"), example = $("example"), end = $("end"), e1 = $("e1"), e2 = $("e2"), endInstall = $("endInstall");
    const thread = $("thread") as unknown as SVGPathElement, dot = $("dot") as unknown as SVGCircleElement, k1 = $("k1"), k2 = $("k2");
    const fileRows = $$("file"), progress = $("progress"), fill = $("fill");

    let draw: ReturnType<typeof startOrbit> = null;
    try {
      const src = cv.clientWidth * Math.min(devicePixelRatio || 1, 1.5) > 2000 ? "/hero/orbit-2560.webp" : "/hero/orbit-1920.webp";
      draw = startOrbit(cv, src, () => setLive(true));
    } catch { draw = null; }

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; };
    const vis = (n: HTMLElement | SVGElement, o: number) => { n.style.opacity = String(o); n.style.visibility = o > .002 ? "visible" : "hidden"; };
    let W = 0, H = 0, narrow = false, pw = 540, rowH = 26, saidH = 0, stickTop = 0, lastQ = "", lastNow = performance.now();
    const measure = () => {
      stickTop = parseFloat(getComputedStyle(scene).top) || 0;
      W = screen.clientWidth; H = screen.clientHeight; narrow = W < 760;
      const f = demo.getBoundingClientRect();
      pw = narrow ? Math.min(f.width, 440) : Math.min(560, f.width * .46);
      const cx = narrow ? f.width / 2 : f.width * .7;
      // On phones the tallest card (the outline) must clear the controls at the bottom of the screen.
      const ph = page.offsetHeight || 300, tall = Math.max(ph, toc.offsetHeight || 0);
      const top = narrow ? Math.max(H * .28, H - tall - 84) : (H - ph) / 2 + 10;
      world.style.setProperty("--pw", pw + "px"); world.style.setProperty("--px", cx - pw / 2 + "px"); world.style.setProperty("--py", top + "px");
      world.style.perspectiveOrigin = `${cx}px ${H * .5}px`;
      rowH = rows[0]?.offsetHeight || 26; saidH = said.offsetHeight;
    };
    measure();

    // How much of screen 2 is in view decides when the example starts, and when it gives up and shows its end.
    let seen = 0;
    const screenIO = new IntersectionObserver(([e]) => {
      seen = e.intersectionRatio;
      const c = clock.current;
      if (seen >= .66 && c.mode === "waiting" && !document.hidden) go("playing", 0);
      if (seen < .33 && (c.mode === "playing" || c.mode === "paused")) go("done", LENGTH);
    }, { threshold: [0, .33, .66, 1] });
    screenIO.observe(screen);

    let raf = 0, onScreen = true;
    function frame(now: number) {
      raf = 0;
      if (!onScreen || document.hidden) return;
      const dt = Math.min(.1, (now - lastNow) / 1000); lastNow = now;
      const c = clock.current;
      if (c.mode === "playing") { c.t += dt; if (c.t >= LENGTH) { c.t = LENGTH; go("done"); } }
      const p = c.mode === "waiting" ? CLOCK[0][1] : c.mode === "done" ? END : beatAt(c.t);
      fill.style.transform = `scaleX(${c.mode === "done" ? 1 : c.t / LENGTH})`;
      progress.setAttribute("aria-valuenow", String(Math.round((c.mode === "done" ? 1 : c.t / LENGTH) * 100)));

      // Scroll from screen 1 to screen 2 moves the page; the scene behind sinks to a dim horizon on the way.
      const r = el!.getBoundingClientRect();
      const down = clamp((stickTop - r.top) / Math.max(1, H));
      const ip = clamp((now - introAt.current) / INTRO_MS);
      if (intro.current && ip >= 1) finish();
      mouse.x = mix(mouse.x, mouse.tx, .06); mouse.y = mix(mouse.y, mouse.ty, .06);
      const rise = eo(seg(ip, .12, .75)), sink = eio(down), home = eio(seg(p, .8, .93));
      const planetY = mix(mix(0, .3, sink), narrow ? .24 : .12, home), bright = mix(mix(1, .5, sink), .85, home);
      const s0 = Math.max(W / 1920, H / 1080);
      const cam: OrbitCamera = { s: s0 * (1 + .16 * (1 - rise)), ox: (W - 1920 * s0) * (narrow ? .86 : .72) - mouse.x * W * .012,
        oy: H - 1080 * s0 + H * .34 * (1 - rise) + H * planetY - mouse.y * H * .01, rise, sun: eo(seg(ip, .32, .95)),
        expo: mix(.2, 1, eo(seg(ip, 0, .6))) * bright, hud: eo(seg(ip, .7, 1)) * (1 - sink * .8) };
      if (draw) draw(cam, now);
      else { earth.style.transform = `translateY(${planetY * 100}%)`; earth.style.filter = `brightness(${bright})`; }
      msg.style.opacity = String(1 - eo(seg(down, .2, .7)));

      // Ask: the request types into a plain box.
      const boxIn = eo(seg(p, .06, .1)), handoff = seg(p, .165, .172), boxOut = eo(seg(p, .17, .2));
      vis(box, boxIn * (1 - boxOut));
      box.style.translate = `0 ${(1 - boxIn) * 30 + boxOut * 36}px`;
      box.style.filter = boxOut > .01 && boxOut < .99 ? `blur(${boxOut * 6}px)` : "";
      const full = DEMO.cmd + " " + DEMO.request, n = Math.round(full.length * seg(p, .1, .16)), t = full.slice(0, n);
      typed.textContent = "";
      const cmd = document.createElement("span"); cmd.className = "lh-cmd"; cmd.textContent = t.slice(0, DEMO.cmd.length); typed.append(cmd);
      if (t.length > DEMO.cmd.length) { const rest = document.createElement("span"); rest.textContent = t.slice(DEMO.cmd.length); rest.style.opacity = String(1 - handoff); typed.append(rest); }
      ph.style.display = n ? "none" : ""; caret.style.display = p < .165 ? "" : "none";
      send.classList.toggle("is-ready", n === full.length);

      // The box dissolves while the sentence resolves above it at full size, then rises to the top and stays.
      const grow = eo(seg(p, .176, .215)), up = eio(seg(p, .235, .265));
      const sScale = mix(1, narrow ? .58 : .5, up);
      const sY = mix(H * (narrow ? .2 : .26) + (1 - grow) * 24, H * (narrow ? .05 : .1), up);
      vis(said, grow * (1 - seg(p, .8, .82)));
      said.style.filter = grow < .99 ? `blur(${(1 - grow) * 8}px)` : "";
      said.style.transform = `translate(0, ${sY}px) scale(${sScale})`;
      meta.style.transform = `translateY(${sY + saidH * sScale + mix(28, 16, up)}px)`;
      vis(meta, eo(seg(p, .19, .21)) * (1 - seg(p, .8, .82)));
      wire.style.transform = `scaleX(${eo(seg(p, .19, .21))})`;
      vis(skill, eo(seg(p, .195, .21)));

      // Look through SKILL.md: the bar moves down the real outline and pauses on each match, then returns.
      const tocIn = eo(seg(p, .265, .29)), tocOut = eo(seg(p, .385, .4));
      const sw = seg(p, .29, .35), last = DEMO.outline.length - 1;
      const legs: [number, number, number][] = [[0, HIT, .2], [HIT, HIT, .15], [HIT, ALSO, .3], [ALSO, ALSO, .15], [ALSO, last, .2]];
      let acc = 0, barRow = 0;
      for (const [a, b, w] of legs) { if (sw <= acc + w) { barRow = mix(a, b, eio((sw - acc) / w)); break; } acc += w; barRow = b; }
      if (p > .355) barRow = mix(last, HIT, eio(seg(p, .355, .38)));
      bar.style.transform = `translateY(${barRow * rowH}px)`;
      rows.forEach((li, i) => {
        li.classList.toggle("is-match", (i === HIT && (sw >= .2 || p > .355)) || (i === ALSO && (sw >= .65 || p > .355)));
        li.classList.toggle("is-on", Math.abs(barRow - i) < .5);
      });
      vis(toc, tocIn * (1 - tocOut));
      toc.style.transform = `translate3d(${mouse.x * -8}px, ${mouse.y * -6 + (1 - tocIn) * 30}px, ${-tocOut * 120}px)`;

      // Read it. While the answer rises the page steps back but stays, so the line has somewhere to come from.
      const pageIn = eo(seg(p, .39, .42));
      const lift = eio(seg(p, .515, .56)) * (1 - eio(seg(p, .63, .665)));
      const dim = eo(seg(p, .5, .515)) * (1 - eo(seg(p, .665, .69)));
      const pull = eio(seg(p, .69, .74)), endOut = seg(p, .79, .81);
      const z = mix(mix(120, 0, pageIn), -480, pull) - lift * 160, x = mix(0, narrow ? 0 : -pw * .3, pull);
      vis(page, pageIn * (1 - dim * (narrow ? 1 : .74)) * (1 - endOut) * (narrow ? 1 - eo(seg(p, .69, .71)) : 1));
      page.style.transform = `translate3d(${x + mouse.x * -8}px, ${mouse.y * -6}px, ${z}px)`;
      page.classList.toggle("is-read", p >= .42 && p < .8);
      page.style.setProperty("--hl", eo(seg(p, .42, .45)).toFixed(3));
      // The one reference this request opens comes forward; the rest stay behind, named and dim.
      const rIn = narrow ? 0 : eo(seg(p, .715, .745)) * (1 - endOut);
      vis(refcard, rIn); refcard.style.transform = `translate3d(${x + pw * .62}px, ${-60 + (1 - rIn) * 20}px, ${z + 140}px)`;
      refs.forEach((rf, i) => {
        const o = narrow ? 0 : eo(seg(p, .72 + i * .008, .75 + i * .008)) * (1 - endOut) * .6;
        vis(rf, o); if (o > .01) rf.style.transform = `translate3d(${x + (i + 1) * 48}px, ${-(i + 1) * 34}px, ${z - (i + 1) * 100}px)`;
      });

      // "amateur" lights when the route is chosen; "dashboard's" carries the thread to its row.
      const lit2 = p >= .2 && p < .8, lit1 = p >= .36 && p < .8;
      k2.classList.toggle("is-lit", lit2); k1.classList.toggle("is-lit", lit1);
      const d = eo(seg(p, .43, .46)) * (1 - seg(p, .505, .515));
      if (d > 0) {
        const o = screen.getBoundingClientRect(), a = k1.getBoundingClientRect(), m = mark.getBoundingClientRect(), pg = page.getBoundingClientRect();
        // Leave over the top of the word, travel clear of the text, come into the row from the page's margin.
        const x1 = a.left - o.left + a.width / 2, y1 = a.top - o.top - 4, top = Math.max(8, y1 - 46);
        const xc = narrow ? W - 14 : pg.left - o.left - 28, x2 = m.left - o.left - 8, y2 = m.top - o.top + m.height * .55, xr = m.right - o.left + 8;
        thread.setAttribute("d", narrow
          ? `M${x1},${y1} C${x1},${top} ${xc},${top} ${xc},${y1 + 40} L${xc},${y2 - 30} C${xc},${y2} ${xr + 22},${y2} ${xr},${y2}`
          : `M${x1},${y1} C${x1},${top} ${xc},${top} ${xc},${y1 + 60} L${xc},${y2 - 40} C${xc},${y2} ${xc},${y2} ${x2},${y2}`);
        const len = thread.getTotalLength();
        thread.style.strokeDasharray = `${len} ${len}`; thread.style.strokeDashoffset = String(len * (1 - d));
        dot.setAttribute("cx", String(narrow ? xr : x2)); dot.setAttribute("cy", String(y2));
        thread.style.opacity = "1"; dot.style.opacity = d > .97 ? "1" : "0";
      } else { thread.style.opacity = "0"; dot.style.opacity = "0"; }

      // The answer rises out of its row, and the row's own example is set the way it says.
      if (lift > 0) {
        const m = mark.getBoundingClientRect(), o = screen.getBoundingClientRect(), f = demo.getBoundingClientRect();
        const ty = H * (narrow ? .43 : .36), fs = parseFloat(getComputedStyle(landed).fontSize), s0m = parseFloat(getComputedStyle(mark).fontSize) / fs;
        landed.style.transform = `translate(${mix(m.left - f.left, 0, lift)}px, ${mix(m.top - o.top, ty, lift)}px) scale(${mix(s0m, 1, lift)})`;
        credit.style.transform = `translateY(${ty + landed.offsetHeight + 18}px)`;
        example.style.transform = `translateY(${ty + landed.offsetHeight + 18 + credit.offsetHeight + 28 + (1 - eo(seg(p, .565, .59))) * 10}px)`;
      }
      vis(landed, clamp(lift * 3));
      vis(credit, eo(seg(p, .55, .57)) * (1 - seg(p, .63, .645))); vis(example, eo(seg(p, .565, .59)) * (1 - seg(p, .63, .645)));

      // The quiet line says what is on screen; at the pull-back the files are listed, and only what is used is counted.
      const q = p < .265 ? "route" : p < .355 ? "look" : p < .69 ? "match" : "files";
      if (q !== lastQ) { lastQ = q; quiet.querySelectorAll<HTMLElement>("[data-q]").forEach((s) => { s.hidden = s.dataset.q !== q; }); }
      const filesIn = eo(seg(p, .695, .72)), cnt = mix(0, USED_LINES, eio(seg(p, .72, .77)));
      vis(files, filesIn); files.style.display = filesIn > 0 ? "" : "none";
      let tot = 0; fileRows.forEach((li, i) => { if (i < 2) { tot += DEMO.files[i].lines; li.classList.toggle("is-used", cnt >= tot - .5); } });
      sum.textContent = fmt(Math.round(cnt));

      // The end, overlapping the fade so there is no empty frame, with one quiet way on.
      const a1 = eo(seg(p, .8, .83)), a2 = eo(seg(p, .82, .85)), a3 = eo(seg(p, .86, .89));
      vis(end, a1); e1.style.translate = `0 ${(1 - a1) * 20}px`;
      vis(e2, a2); e2.style.translate = `0 ${(1 - a2) * 14}px`;
      vis(endInstall, a3); endInstall.style.translate = `0 ${(1 - a3) * 12}px`;

      raf = requestAnimationFrame(frame);
    }
    const kick = () => {
      if (document.hidden && clock.current.mode === "playing") go("paused");
      if (!raf && onScreen && !document.hidden) { lastNow = performance.now(); raf = requestAnimationFrame(frame); }
    };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; kick(); }, { threshold: 0 });
    io.observe(el);
    const skip = () => { if (intro.current) { introAt.current = performance.now() - INTRO_MS; finish(); } };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) => addEventListener(e, skip, { passive: true }));
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    document.addEventListener("visibilitychange", kick);
    kick();
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); screenIO.disconnect();
      events.forEach((e) => removeEventListener(e, skip));
      removeEventListener("pointermove", onMove); removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", kick);
    };
  }, [finish, go]);

  // Install skips the example and takes keyboard focus to the install strip.
  const jump = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const t = document.getElementById("install"); if (!t) return;
    e.preventDefault(); t.scrollIntoView({ block: "start" }); t.focus({ preventScroll: true });
    history.replaceState(null, "", "#install");
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
        <div data-r="msg" className="launch__msg">
          <h1 id="hero-h">
            {words.map((w, i) => (
              <span key={i} className="launch__w" style={{ "--i": i } as React.CSSProperties}><span>{w}</span>{i < words.length - 1 ? " " : ""}</span>
            ))}
          </h1>
          <p className="launch__lede">Skills and prompts for Claude Code, Codex and Cursor. Describe the job in plain words; your agent follows a written method for it.</p>
          <div className="launch__cta">
            <a className="btn btn--lg btn--solid launch__go" href="#install" onClick={jump}><span>Install Agent Kit</span>{ARROW}</a>
            <Link className="launch__new" href="/start">New to coding agents? Start here{ARROW}</Link>
          </div>
        </div>
      </div>

      <div data-r="screen" className="lh-screen">
        <svg className="lh-threads" aria-hidden="true"><path data-r="thread" d="" /><circle data-r="dot" r="3" /></svg>
        <div className="lh-screen__in container">
          <div data-r="frame" className="lh-demo" aria-labelledby="lh-demo-h">
            <h2 id="lh-demo-h" className="lh-intro">What happens when you ask</h2>
            <div className="lh-group">
              <div data-r="box" className="lh-box">
                <p className="lh-box__text" translate="no">
                  <span className="lh-box__full"><span className="lh-cmd">{DEMO.cmd}</span> <Request /></span>
                  <span data-r="typed" className="lh-box__typed" aria-hidden="true" /><span data-r="caret" className="lh-caret" aria-hidden="true" />
                  <span data-r="ph" className="lh-box__ph" aria-hidden="true">Tell your agent what you want</span>
                </p>
                <span data-r="send" className="lh-send" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg></span>
              </div>
              <p data-r="said" className="lh-said" aria-hidden="true"><Request marked /></p>
              <div data-r="meta" className="lh-meta">
                <p className="lh-route" translate="no"><span className="lh-cmd">{DEMO.cmd}</span><span data-r="wire" className="lh-wire" aria-hidden="true" /><span data-r="skill" className="lh-skill">{DEMO.skill}</span></p>
                <p data-r="quiet" className="lh-quiet">
                  <span data-q="route" hidden>{QUIET_ROUTE}</span>
                  <span data-q="look" hidden>Looking through its {SKILL_FILE.name}</span>
                  <span data-q="match">{QUIET_MATCH}</span>
                  <span data-q="files" hidden>{QUIET_FILES}</span>
                </p>
                <p className="lh-files-label">{QUIET_FILES}</p>
                <ol data-r="files" className="lh-files" translate="no">
                  {DEMO.files.map((f, i) => (
                    <li key={f.name} data-r="file" className={i < 2 ? "is-used" : ""}><span>{f.name}</span><span>{f.use}</span><span>{f.lines}</span></li>
                  ))}
                  <li className="lh-files__sum"><span>For this request</span><span /><span><span className="lh-sum-static">{fmt(USED_LINES)}</span><span data-r="sum" className="lh-sum-live" /></span></li>
                </ol>
              </div>
            </div>

            <div data-r="world" className="lh-world">
              <article data-r="toc" className="lh-card lh-toc">
                <h3 translate="no">{DEMO.skill}/{SKILL_FILE.name}</h3>
                <ol>
                  {DEMO.outline.map((o, i) => (
                    <li key={o.title} data-r="row" className={[("sub" in o && o.sub) ? "is-sub" : "", i === HIT || i === ALSO ? "is-match" : ""].join(" ").trim() || undefined}>
                      <span>{o.title}</span><span>{o.from}–{o.to}</span>
                    </li>
                  ))}
                  <i data-r="bar" className="lh-bar" aria-hidden="true" />
                </ol>
              </article>
              <article data-r="page" className="lh-card lh-page">
                <h3>{SECTION.title}</h3>
                <p className="lh-q"><span>{DEMO.core.line}</span><span><b>{DEMO.core.label}</b> {DEMO.core.text}</span></p>
                <div className="lh-q"><span>{DEMO.row.line}</span>
                  <dl className="lh-row">
                    <dt>Context</dt><dd><b>{DEMO.row.context}</b></dd>
                    <dt>Technique</dt><dd><mark data-r="mark">{DEMO.row.technique}</mark></dd>
                    <dt>Example</dt><dd>{DEMO.row.example}</dd>
                  </dl>
                </div>
                <p className="lh-foot"><span>{DEMO.skill} · {SKILL_FILE.name}</span><span>lines {SECTION.from}–{SECTION.to}</span></p>
              </article>
              <article data-r="refcard" className="lh-card lh-refcard" aria-hidden="true">
                <h3>{DEMO.opened.title}</h3><p>{DEMO.opened.summary}</p>
                <p className="lh-foot"><span>references/{DEMO.opensAt.file}</span><span>lines {DEMO.opened.from}–{DEMO.opened.to}</span></p>
              </article>
              {DEMO.files.slice(2).map((f) => <div key={f.name} data-r="ref" className="lh-ref" aria-hidden="true"><b>{f.name}</b><span>{f.lines}</span></div>)}
            </div>

            <div className="lh-group">
              <p data-r="landed" className="lh-landed">{DEMO.answer.text}</p>
              <p data-r="credit" className="lh-credit">{DEMO.skill} · {SKILL_FILE.name}, line {DEMO.answer.line}, set as its own example</p>
              <p data-r="example" className="lh-example"><b>{DEMO.exampleBig}</b><span>{DEMO.exampleSmall}</span></p>
            </div>

            <div data-r="end" className="lh-end">
              <div><p data-r="e1">One sentence in.</p><p data-r="e2"><em>{SKILL_FILE.lines}</em> lines read, one reference opened.</p></div>
              <a data-r="endInstall" className="btn btn--lg btn--solid launch__go" href="#install" onClick={jump}><span>Install Agent Kit</span>{ARROW}</a>
            </div>
          </div>

          {/* The example's own controls: where it is, and Pause, Play or Replay. Only shown when it plays. */}
          <div className="lh-controls" hidden={!theatre}>
            <div data-r="progress" className="lh-progress" role="progressbar" aria-label="Example progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
              <i data-r="fill" className="lh-progress__fill" />
              {STEPS.slice(1).map(([s, name]) => <b key={name} style={{ left: `${(s / LENGTH) * 100}%` }} title={name} />)}
            </div>
            <button type="button" className="lh-ctl" onClick={mode === "done" ? replay : toggle}
              aria-label={mode === "playing" ? "Pause the example" : mode === "done" ? "Replay the example" : "Play the example"}>
              {mode === "playing"
                ? <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                : mode === "done"
                  ? <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
                  : <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>}
              <span>{mode === "playing" ? "Pause" : mode === "done" ? "Replay" : "Play"}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
