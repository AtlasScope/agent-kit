// The horizon lab: one canvas and the address bar. Every number that places the camera, the sun or the look can be
// given as a query parameter, so a composition is a link. `window.lab` lets a capture script hold a frame still.
//   /lab/horizon.html?lat=12&lon=-150&alt=1800&heading=40&pitch=30&roll=-18&focal=2.4&date=2026-11-24T18:00Z
import { DIRECTIONS, LOOK, aim, createHorizon, createStage, fromLatLon, moonDirection, orbitAt, place, sunDirection } from "../components/horizon/index";

const q = new URLSearchParams(location.search);
const num = (key: string, fallback: number) => (q.has(key) && Number.isFinite(Number(q.get(key))) ? Number(q.get(key)) : fallback);
const show = (message: string) => { const el = document.getElementById("error")!; el.textContent = message; el.style.display = "block"; };
if (q.has("bare")) document.body.classList.add("bare");

const canvas = document.getElementById("c") as HTMLCanvasElement;
// ?dir=day plays a direction exactly as the website does (components/horizon/stage.ts); ?t= holds it at a moment.
if (q.has("dir")) {
  // Any number of the look (components/horizon/renderer.ts) can be overridden: &cloudTops=0 turns the measured heights off.
  const tune: Record<string, number> = {};
  for (const key of Object.keys(LOOK)) if (q.has(key)) tune[key] = Number(q.get(key));
  const stage = createStage(canvas, { direction: DIRECTIONS[q.get("dir")!], tall: () => (q.has("tall") ? q.get("tall") === "1" : innerHeight > innerWidth * 1.25), base: "/public/horizon", cloud: q.get("cloud") || undefined, rate: q.has("rate") ? Number(q.get("rate")) : undefined, tune, meter: q.has("meter") ? Number(q.get("meter")) : undefined, startAt: q.has("at") ? Date.parse(q.get("at")!) : undefined, onError: (e: Error) => console.warn(e.message) });
  let fixed: number | null = q.has("t") ? Number(q.get("t")) : null;
  const begin = performance.now();
  // The stage's clock starts at its first drawn frame, so a held moment is measured from one drawn at zero.
  let started = false;
  const cue = (now: number) => ({ now, opening: q.has("opening") ? Number(q.get("opening")) : 1e6, leave: Number(q.get("leave") || 0), recede: Number(q.get("recede") || 0), px: 0, py: 0 });
  const loop = (now: number) => {
    if (!started) started = stage.frame(cue(begin));
    else stage.frame(cue(fixed === null ? Math.max(now, begin) : begin + fixed * 1000));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  Object.assign(window, { lab: { horizon: stage.horizon, stage, hold: (t: number | null) => { fixed = t; } } });
  throw new Error("stage mode");
}
const set = q.get("maps") || "earth";
const maps = set === "none" ? {} : { cloud: `/public/horizon/${set}/${q.get("cloud") || "clouds"}.jpg`, colour: `/public/horizon/${set}/colour.jpg`, night: `/public/horizon/${set}/night.jpg` };
let horizon: ReturnType<typeof createHorizon>;
try { horizon = createHorizon(canvas, { maps, maxPixelRatio: num("dpr", 2), onError: (e: Error) => console.warn(e.message) }); } catch (error) { show(String((error as Error).message || error)); throw error; }

const look = { ...LOOK };
for (const key of Object.keys(look) as (keyof typeof look)[]) look[key] = num(String(key), look[key]);
const view = { lat: num("lat", 10), lon: num("lon", -150), alt: num("alt", 1800), heading: num("heading", 40), pitch: num("pitch", 30), roll: num("roll", -18) };
const start = q.get("date") ? Date.parse(q.get("date")!) : Date.now();
// `rate` is how many times faster than life the clock runs; `orbit` flies a real orbit from the starting place.
const rate = num("rate", 0), orbiting = q.has("orbit");
const orbit = { altitude: view.alt, inclination: num("incl", 51.6), node: num("node", view.lon), phase: num("phase", 0), epoch: start };
let held: number | null = q.has("t") ? num("t", 0) : null;
const t0 = performance.now();

function frame(now: number) {
  const elapsed = held ?? (now - t0) / 1000, ms = start + elapsed * 1000 * rate;
  const sun = q.has("sunLat") ? fromLatLon(num("sunLat", 0), num("sunLon", 0)) : sunDirection(ms);
  const moon = q.has("moonLat") ? fromLatLon(num("moonLat", 0), num("moonLon", 0)) : moonDirection(ms).dir;
  let shot;
  if (orbiting) { const at = orbitAt(orbit, ms); shot = aim(at.position, view.heading, view.pitch, view.roll, at.travel); }
  else shot = aim(place(view.lat, view.lon, view.alt), view.heading, view.pitch, view.roll);
  horizon.render({ shot, sun, moon, look, time: elapsed });
  document.getElementById("hud")!.textContent = `${horizon.wideGamut ? "P3" : "sRGB"} ${canvas.width}x${canvas.height} ${horizon.stats().maps.join(" ")}`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
Object.assign(window, { lab: { horizon, look, view, hold: (t: number | null) => { held = t; } } });
