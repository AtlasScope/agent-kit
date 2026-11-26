"use client";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

// The stage: one view from orbit that the homepage and the install page share. It lives in the layout both routes sit
// under (app/(stage)/layout.tsx), so going from one to the other is a real navigation that never unloads the planet.
// The homepage looks out at it; on the install page the camera has climbed away and the planet is a low arc at the
// foot of the window.
//
// Going between the two is one movement with three parts that start on the same frame as the click:
//   1. The page being left is copied into a layer above the scene and its words move away there, so they can leave
//      at their own pace although the router has already replaced them.
//   2. The camera moves between the two poses on a spring. A spring has no fixed length, so Back in the middle of it
//      turns it round from where it is, at the speed it has.
//   3. The new page's words arrive (their CSS reads data-shift on the stage). Going to Install, the pressed button
//      flashes and closes to a single line of its own light, which travels to the message panel's lower edge (nearly
//      level with the button, beside the panel's Copy key) and spreads into the panel's rim, while a perspective floor resolves under the panel (install.css).
// Nothing waits for anything: the navigation and the clipboard write both happen inside the click.
//
// Without the live scene (reduced motion, no WebGL 2, a failure) two stills stand in for the two poses and cross-fade.
// The day view: the brightest of the measured scenes, rich blue sea under a lit low-pressure system.
const VIEW = "day";
type Mode = "home" | "install";
const modeOf = (path: string): Mode | null => (path === "/install" ? "install" : path === "/" ? "home" : null);
// How long a copy of the page that was left may stay, and the camera's spring (critically damped: it never overshoots).
const SHIFT_MS = 1100, STIFF = 46, DAMP = 2 * Math.sqrt(STIFF);
// The scene moves slowly: thirty frames a second carry it, except while the camera is travelling.
const REST_GAP = 27;
// Exposure as the lab page and the stills have it, so the first paint and the live scene match.
const METER = 0;
const still = (pose: string, shape: string) => `/horizon/stills/${VIEW}${pose}-${shape}.avif`;
const TALL = "(max-width: 759.98px), (max-aspect-ratio: 4/5)";
// A browser drawing WebGL in software (no graphics hardware, or acceleration turned off) would spend whole seconds
// on each frame and starve the page, so it keeps the still. Asked of a throwaway context before anything is loaded.
// Safari and Firefox report a generic name here, which never matches.
const softwareGL = () => {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return true;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i.test(name);
  } catch { return true; }
};
// Hardware that is present but cannot keep up: if most of the first frames come this late, the still comes back.
const SLOW_MS = 180, TRIAL = 24, SLOW_LIMIT = 12;

export function Stage({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const mode = modeOf(path) ?? "home";
  const root = useRef<HTMLDivElement>(null), ghost = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  // What the camera is heading for, where it is and how fast it is moving (0 is the homepage's pose, 1 is Install's).
  const cam = useRef({ to: mode === "install" ? 1 : 0, at: mode === "install" ? 1 : 0, v: 0 });
  const shown = useRef<Mode>(mode);
  // The transition in flight: when it ends, and where the pressed button was, for the panel to grow from.
  const shift = useRef<{ timer: number; from?: DOMRect; left: Element | null } | null>(null);
  const kick = useRef(() => {});

  // Leaving one of the two pages for the other. Called inside the click (or the Back press), before the router acts.
  const depart = (to: Mode) => {
    const el = root.current, layer = ghost.current, page = el?.querySelector(":scope > main");
    if (!el || !layer || !page || shown.current === to) return;
    shown.current = to;
    cam.current.to = to === "install" ? 1 : 0;
    kick.current();
    if (shift.current) clearTimeout(shift.current.timer);
    layer.replaceChildren();
    const quick = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let from: DOMRect | undefined;
    if (!quick) {
      // The copy is not a <main> and has no ids, scripts or focusable parts: it is a picture of the page that left.
      const box = page.getBoundingClientRect(), copy = document.createElement("div");
      copy.className = `${page.className} stage__copy`;
      for (const node of page.childNodes) copy.append(node.cloneNode(true));
      copy.querySelectorAll("script").forEach((s) => s.remove());
      copy.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
      // The copy must not replay the page's own entrance: it is only ever leaving.
      copy.querySelectorAll("[data-load]").forEach((n) => n.removeAttribute("data-load"));
      Object.assign(copy.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
      layer.append(copy);
      from = to === "install" ? page.querySelector(".launch__go")?.getBoundingClientRect() : undefined;
      // The page itself hides while its copy leaves. If the navigation never lands, the timer below brings it back.
      page.setAttribute("data-left", "");
    }
    el.setAttribute("data-shift", to);
    shift.current = { from, left: page, timer: window.setTimeout(() => settle(), SHIFT_MS) };
  };
  const settle = () => {
    const el = root.current, s = shift.current;
    if (s) clearTimeout(s.timer);
    shift.current = null;
    ghost.current?.replaceChildren();
    el?.removeAttribute("data-shift");
    // Still on the page that was being left: the navigation was cancelled or failed, so that page comes back.
    if (s?.left?.isConnected) {
      s.left.removeAttribute("data-left");
      const here = modeOf(location.pathname);
      if (here) { shown.current = here; cam.current.to = here === "install" ? 1 : 0; kick.current(); }
    }
  };

  // The new page is in the document. Going to Install, the pressed button's light travels to the panel's bottom edge.
  useLayoutEffect(() => {
    const s = shift.current, layer = ghost.current, el = root.current;
    // A route change nothing announced (router.push from elsewhere): no copy to move, the camera just goes.
    if (shown.current !== mode) { shown.current = mode; cam.current.to = mode === "install" ? 1 : 0; kick.current(); }
    if (!s || !layer || !el || mode !== "install" || !s.from) return;
    const panel = el.querySelector<HTMLElement>(":scope > main .inst__msg");
    if (!panel) return;
    // The panel is mid-entrance (scaled and lowered); measure where it will rest, then let the entrance run.
    panel.style.animation = "none";
    const a = s.from, b = panel.getBoundingClientRect();
    panel.style.animation = "";
    const beam = document.createElement("div"), px = (n: number) => `${n.toFixed(1)}px`;
    beam.className = "stage__beam";
    layer.append(beam);
    const at = (x: number, y: number, w: number) => ({ left: px(x), top: px(y), width: px(w) });
    const r = Math.min(24, b.width * 0.06);
    // Down to the panel's lower edge at its centre, then outward along that edge as the panel grows up out of it.
    const mid = b.left + b.width / 2, w0 = Math.min(a.width * 0.9, b.width - 2 * r);
    beam.animate([
      { ...at(a.left + a.width * 0.08, a.top + a.height / 2, a.width * 0.84), opacity: 0 },
      { ...at(a.left + a.width * 0.04, a.top + a.height / 2, a.width * 0.92), opacity: 1, offset: 0.12 },
      { ...at(mid - w0 / 2, b.bottom, w0), opacity: 1, offset: 0.6 },
      { ...at(b.left + r, b.bottom, b.width - 2 * r), opacity: 0.85, offset: 0.86 },
      { ...at(b.left + r, b.bottom, b.width - 2 * r), opacity: 0 },
    ], { duration: 440, delay: 50, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "both" });
  }, [mode]);

  // Any plain click on a link between the two pages, and Back or Forward between them, starts the movement.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Heard on the way down: the link itself prevents the default to navigate in place, which is no reason to stay out.
      if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.origin !== location.origin || a.hash) return;
      const to = modeOf(a.pathname);
      if (to) depart(to);
    };
    const onPop = () => { const to = modeOf(location.pathname); if (to) depart(to); };
    // A page restored from the browser's cache comes back as it was left: clear a movement frozen half way.
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) settle(); };
    document.addEventListener("click", onClick, true);
    addEventListener("popstate", onPop); addEventListener("pageshow", onShow);
    return () => { document.removeEventListener("click", onClick, true); removeEventListener("popstate", onPop); removeEventListener("pageshow", onShow); if (shift.current) clearTimeout(shift.current.timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The live scene. Its code and maps are megabytes, so nothing is asked for until the page itself has loaded, and
  // only while the homepage is the page showing: the settled install page shows no planet, so a visit that starts
  // there loads none of it unless the visitor goes on to the homepage. The homepage's still covers until it is ready.
  useEffect(() => {
    const el = root.current, cv = canvas.current;
    if (!el || !cv || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let stage: ReturnType<typeof import("../horizon").createStage> | null = null, gone = false, raf = 0, drawn = 0, last = 0, live = false;
    let tried = 0, slow = 0, prevDraw = 0;
    const show = (on: boolean) => { if (on !== live) { live = on; el.classList.toggle("is-live", on); } };
    const frame = (now: number) => {
      raf = 0;
      if (document.hidden || !stage) return;
      const c = cam.current, dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      const moving = Math.abs(c.to - c.at) > 0.0005 || Math.abs(c.v) > 0.0005;
      if (moving) { c.v += (STIFF * (c.to - c.at) - DAMP * c.v) * dt; c.at += c.v * dt; } else { c.at = c.to; c.v = 0; }
      if (moving || now - drawn >= REST_GAP) {
        drawn = now;
        if (stage.broken()) { stage.dispose(); stage = null; show(false); return; }
        const drew = stage.frame({ now, opening: 1e6, leave: 0, px: 0, py: 0, recede: c.at });
        show(drew);
        // The first frames are a trial: on hardware too slow for the scene, the still comes back for good.
        if (drew && tried < TRIAL) {
          if (prevDraw && tried > 2 && now - prevDraw > SLOW_MS) slow++;
          prevDraw = now; tried++;
          if (slow >= SLOW_LIMIT) { stage.dispose(); stage = null; show(false); kick.current = () => {}; return; }
        }
        // At rest in the install pose the planet has faded out: once that (black) frame is drawn it stays, and
        // drawing stops until the camera is asked to move again (kick).
        if (drew && !moving && c.at === 1) { raf = 0; return; }
      }
      raf = requestAnimationFrame(frame);
    };
    let booted = false;
    const boot = () => {
      if (booted) return;
      booted = true;
      if (softwareGL()) return;
      // After the page has loaded; on a phone also after a short pause, so the words' entrance and a first tap never
      // share the main thread with the scene's code and maps arriving. The still covers until the scene is ready.
      const touch = matchMedia("(pointer: coarse)").matches;
      const loaded = new Promise<void>((done) => { if (document.readyState === "complete") done(); else addEventListener("load", () => done(), { once: true }); })
        .then(() => touch ? new Promise<void>((done) => setTimeout(done, 1600)) : undefined);
      loaded.then(() => import("../horizon")).then((m) => {
        if (gone) return;
        try { stage = m.createStage(cv, { direction: m.DIRECTIONS[VIEW], tall: () => matchMedia(TALL).matches, meter: METER, onError: () => {} }); } catch { stage = null; }
        // Started late (on the way back from Install): begin at the pose the page is in now, so the scene fades in
        // over the matching still instead of replaying a move that has already finished.
        const c = cam.current; c.at = c.to; c.v = 0;
        kick.current();
      }, () => {});
    };
    kick.current = () => {
      if (!stage) { if (cam.current.to < 1) boot(); return; }
      if (!raf && !document.hidden) { last = 0; prevDraw = 0; raf = requestAnimationFrame(frame); }
    };
    if (cam.current.to < 1) boot();
    const onVisible = () => kick.current();
    document.addEventListener("visibilitychange", onVisible);
    return () => { gone = true; cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", onVisible); kick.current = () => {}; stage?.dispose(); };
  }, []);

  return (
    <div ref={root} className="stage" data-mode={mode}>
      <div className="stage__scene" aria-hidden="true">
        {(["", "-install"] as const).map((pose) => (
          <picture key={pose} className={`stage__still stage__still--${pose ? "install" : "home"}`}>
            <source media={TALL} type="image/avif" srcSet={still(pose, "tall")} />
            <img src={still(pose, "wide")} alt="" width={3840} height={1600} decoding="async" fetchPriority={(pose ? "install" : "home") === mode ? "high" : "low"} loading={(pose ? "install" : "home") === mode ? "eager" : "lazy"} />
          </picture>
        ))}
        <canvas ref={canvas} className="stage__gl" />
        <div className="stage__veil" />
      </div>
      {children}
      <div ref={ghost} className="stage__ghost" aria-hidden="true" inert />
    </div>
  );
}
