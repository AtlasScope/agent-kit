// The stage: what the camera, the clock and the exposure do over a visit. The homepage hands it the same cues the
// old scene took (seconds into the opening, the hand-off to Install, the pointer) and it returns a drawn frame.
//
// A direction is a real orbit, a moment to start it at, a way of looking out of the window, and how fast the clock
// runs. Nothing is keyframed: the camera rides the orbit, the planet turns under it, and the sun is wherever the
// almanac puts it at that moment. The exposure follows the light the way a camera's meter would.
import { aim, moonDirection, orbitAt, orbitThrough, sunDirection } from "./ephemeris";
import type { Orbit, Vec3 } from "./ephemeris";
import { LOOK, createHorizon } from "./renderer";
import type { Look, Maps } from "./renderer";

export interface View { heading: number; pitch: number; roll: number; focal: number }
export interface Direction {
  title: string;
  note: string;
  maps: string;                 // a folder under /horizon
  detail?: { file: string; tops?: string; west: number; north: number; width: number; height: number }; // a sharper cloud map for the region flown over
  start: string | "now";        // an ISO moment, or the moment of the visit
  orbit: Omit<Orbit, "epoch">;
  wide: View; tall: View;
  rate: number;                 // seconds of orbit per second of visit
  weather?: number;             // seconds of weather per second of visit (the clouds run on their own, faster clock)
  meter: number;                // exposure compensation, in stops
  look?: Partial<Look>;
}

const WIDE: View = { heading: 43, pitch: 33, roll: -20, focal: 2.4 };
// A phone holds the words in its upper half, so the planet takes the lower third: a longer lens, the limb about
// two thirds of the way down, and less roll, so the arc reads across the narrow frame.
const TALL: View = { heading: 43, pitch: 32.2, roll: -9, focal: 2.5 };
const PACIFIC = { file: "clouds-pacific", tops: "tops-pacific", west: 145, north: -2, width: 150, height: 62 }, IBERIA = { file: "clouds-iberia", west: -25, north: 64, width: 130, height: 62 };
// Weather seen from orbit hardly moves in the minutes a pass takes, so the clouds keep a faster clock of their own:
// about two and a half hours of drift for each minute on the page.
const WEATHER = 150;
// The directions that have a still image (public/horizon/stills, made by scripts/horizon-stills.mjs): every one whose
// first frame is the same on every visit.
export const STILLS = ["day", "afternoon", "sunrise", "dawn", "night"];
// What a visit may open on when the page is left to choose (/horizon/visit).
export const CURATED = ["day", "afternoon", "sunrise", "dawn", "night"];
export const DIRECTIONS: Record<string, Direction> = {
  day: {
    title: "Meridian, day",
    note: "A real low over the South Pacific on 22 November 2026, as NASA's VIIRS instrument saw it, lit by that afternoon's sun.",
    maps: "earth", start: "2026-11-22T01:00:00Z",
    orbit: orbitThrough(-30, -178, 75, 1800), wide: WIDE, tall: TALL, rate: 4, meter: 0, detail: PACIFIC,
  },
  dawn: {
    title: "Meridian, first light",
    note: "The same orbit a few hours earlier, flying toward sunrise. The sun stays out of the frame; its light arrives along the limb and then across the cloud tops. The colour is computed from the air, not painted.",
    maps: "earth", start: "2026-11-21T16:05:00Z",
    orbit: orbitThrough(-39.2, 144, 69.5, 1800), wide: { ...WIDE, heading: 24 }, tall: { ...TALL, heading: 18, pitch: 31.5, focal: 3 }, rate: 4, meter: -1.8, detail: PACIFIC,
  },
  sunrise: {
    title: "Meridian, sunrise",
    note: "Flying straight toward the sun from the night side, east of New Zealand. The air along the limb lights first, the sun clears it about half a minute in, and its light then walks toward the camera across the cloud tops, highest first.",
    maps: "earth", start: "2026-11-21T15:30:00Z",
    orbit: orbitThrough(-16.6, 158.2, 141.5, 1800), wide: { heading: -19, pitch: 26.5, roll: -7, focal: 2.4 }, tall: { heading: -9, pitch: 30, roll: -3, focal: 2.6 }, rate: 2.5, meter: 0.9, detail: PACIFIC, look: { glare: 0.3 },
  },
  afternoon: {
    title: "Meridian, late afternoon",
    note: "The day view three hours later, when the sun is low enough for the high cloud to shade the low. Heights are NASA's retrieved cloud tops for the same satellite pass.",
    maps: "earth", start: "2026-11-22T04:15:00Z",
    orbit: orbitThrough(-30, -178, 75, 1800), wide: WIDE, tall: TALL, rate: 4, meter: -1.3, detail: PACIFIC,
  },
  night: {
    title: "Meridian, night",
    note: "Iberia and the Mediterranean after dark: measured city lights, moonlit cloud, and the thin green line of airglow.",
    maps: "earth", start: "2026-11-22T21:30:00Z",
    orbit: orbitThrough(30, -5, 60, 1800), wide: { ...WIDE, heading: 0 }, tall: { ...TALL, heading: 0 }, rate: 4, meter: 0, detail: IBERIA,
  },
  now: {
    title: "Meridian, now",
    note: "The sun and moon where the almanac puts them at this moment, on an orbit that starts over the mid-Pacific when the page opens. The cloud is still the map of 22 November 2026, not today's weather.",
    maps: "earth", start: "now",
    orbit: { altitude: 1800, inclination: 51.6, node: -150, phase: 0 }, wide: WIDE, tall: TALL, rate: 4, meter: 0,
  },
};

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeInOut = (x: number) => { const t = clamp(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// The exposure a meter would choose, from how high the sun stands over the ground in the middle of the view.
// Stops are log2 of the multiplier: full day sits near -3.5, the terminator near 0, deep night near +9.
const METER: [number, number][] = [[-0.35, 9.2], [-0.2, 8.2], [-0.1, 5.2], [-0.03, 1.6], [0.02, -0.4], [0.12, -2.2], [0.35, -3.3], [1, -3.6]];
// The most exposure the meter allows while the sun is in the frame.
const SUN_IN_FRAME = -0.4;
export function meter(mu: number) {
  if (mu <= METER[0][0]) return METER[0][1];
  for (let i = 1; i < METER.length; i++) {
    if (mu <= METER[i][0]) {
      const [a, sa] = METER[i - 1], [b, sb] = METER[i], t = (mu - a) / (b - a), s = t * t * (3 - 2 * t);
      return sa + (sb - sa) * s;
    }
  }
  return METER[METER.length - 1][1];
}

// Where the middle of the view meets the ground, as a unit vector (or the point under the camera if it looks past the limb).
function target(position: Vec3, forward: Vec3): Vec3 {
  const b = dot(position, forward), c = dot(position, position) - 6371 * 6371, h = b * b - c;
  const t = h > 0 ? -b - Math.sqrt(h) : -b;
  const p: Vec3 = [position[0] + forward[0] * t, position[1] + forward[1] * t, position[2] + forward[2] * t];
  const l = Math.hypot(p[0], p[1], p[2]);
  return [p[0] / l, p[1] / l, p[2] / l];
}

export interface Cue { now: number; opening: number; leave: number; px: number; py: number }
export function createStage(canvas: HTMLCanvasElement, options: { direction: Direction; tall: () => boolean; base?: string; cloud?: string; startAt?: number; rate?: number; tune?: Partial<Look>; meter?: number; onError?: (e: Error) => void }) {
  const { direction } = options;
  const base = options.base ?? "/horizon";
  // Each device is sent maps no larger than it keeps (renderer.ts caps them the same way): a phone asks for the
  // 2,048-pixel globe and a 4,096-pixel region, a computer for 4,096 and the full region. scripts/horizon-sizes.mjs
  // makes the smaller files.
  const small = matchMedia("(pointer: coarse)").matches || Math.min(innerWidth, innerHeight) < 700;
  const sized = direction.detail && !options.cloud, globe = small ? "-2k" : "-4k", file = (name: string) => `${base}/${direction.maps}/${name}.jpg`;
  const maps: Maps = { cloud: file(options.cloud ?? (sized ? `clouds${globe}` : "clouds")), colour: file(`colour${globe}`), night: file(`night${globe}`) };
  if (direction.detail && sized) maps.detail = { ...direction.detail, url: file(direction.detail.file + (small ? "-4k" : "")), tops: direction.detail.tops && file(direction.detail.tops) };
  const horizon = createHorizon(canvas, { maps, onError: options.onError });
  const epoch = options.startAt ?? (direction.start === "now" ? Date.now() : Date.parse(direction.start));
  const orbit: Orbit = { ...direction.orbit, epoch };
  const rate = options.rate ?? direction.rate;
  let first = -1, stops: number | null = null, last = 0, slow = 0;

  return {
    horizon,
    ready: () => horizon.ready(),
    broken: () => horizon.broken(),
    // The moment of the scene's own clock, for a caption or a test.
    moment: (now: number) => epoch + (first < 0 ? 0 : (now - first) * rate),
    frame(cue: Cue) {
      if (!horizon.ready()) return false;
      if (first < 0) first = cue.now;
      const seconds = (cue.now - first) / 1000, ms = epoch + seconds * 1000 * rate;
      const view = options.tall() ? direction.tall : direction.wide;
      const leave = easeInOut(cue.leave), arrive = Math.exp(-Math.max(cue.opening, 0) / 1.1);
      const at = orbitAt(orbit, ms);
      // The opening tips the camera down onto the planet; the hand-off lets the planet sink out of the frame.
      // The camera is never perfectly still and never follows the pointer: two slow, unrelated sways of about a
      // tenth of a degree, the kind a hand-held long lens has on a steady mount.
      const pan = 0.1 * Math.sin(seconds / 37) + 0.04 * Math.sin(seconds / 11.3 + 1), tilt = 0.07 * Math.sin(seconds / 53 + 2);
      const pitch = view.pitch - 7 * arrive - 9 * leave + tilt;
      const shot = aim(at.position, view.heading + pan, pitch, view.roll, at.travel);
      const sun = sunDirection(ms), moon = moonDirection(ms);
      // The meter adapts over a few seconds, as an eye or a camera would, so crossing the terminator is a slow
      // change of exposure and never a jump.
      // It reads the middle of the view and two places nearer the limb, and exposes for the brightest, so cloud
      // facing a low sun ahead keeps its detail and the dark foreground is left dark.
      const reads = [0, 0.45, 0.8].map((lift) => {
        const ray: Vec3 = [0, 1, 2].map((i) => shot.forward[i] + (shot.up[i] * lift) / view.focal) as Vec3, l = Math.hypot(...ray);
        return dot(target(shot.position, [ray[0] / l, ray[1] / l, ray[2] / l]), sun);
      });
      let wanted = meter(Math.max(...reads));
      // With the sun itself in the picture a camera stops down for it, whatever the ground is doing: the night side
      // goes black and the lit air along the limb keeps its colour.
      const high = Math.hypot(...shot.position), above = Math.asin(dot(shot.position, sun) / high) + Math.acos(6371 / high);
      const facing = clamp((dot(shot.forward, sun) - 0.72) / 0.16), up = clamp((above + 0.07) / 0.08);
      wanted += (Math.min(wanted, SUN_IN_FRAME) - wanted) * facing * facing * (3 - 2 * facing) * up;
      wanted += options.meter ?? direction.meter;
      // A machine that cannot hold the page's thirty frames a second gets fewer pixels to draw: when most of the last
      // second's frames came late, the picture steps down in size, and again if that was not enough.
      const late = cue.now - last;
      if (late > 0 && late < 400) { slow = late > 58 ? slow + 1 : Math.max(0, slow - 1); if (slow > 20) { horizon.coarser(); slow = 0; } }
      const gap = (cue.now - last) / 1000, dt = Math.min(0.25, Math.max(0, gap)); last = cue.now;
      // After a gap of more than a second (a hidden tab, or a capture that jumps to a held moment) the meter starts
      // from what it reads now and does not crawl there from an exposure minutes stale.
      stops = stops === null || gap > 1 ? wanted : stops + (wanted - stops) * (1 - Math.exp(-dt / 2.5));
      const fade = (1 - 0.75 * Math.exp(-Math.max(cue.opening, 0) / 0.6)) * (1 - leave);
      const look: Look = { ...LOOK, ...direction.look, ...options.tune, focal: view.focal * (1 + 0.1 * arrive) };
      look.exposure = Math.pow(2, stops) * fade;
      look.moonlight *= 0.15 + 0.85 * moon.phase;
      // The drift slows toward a stop after about eighteen hours of weather, before the shear in the wind has
      // pulled the cloud systems out of shape.
      look.cloudDrift = 64800 * (1 - Math.exp(-(seconds * (direction.weather ?? WEATHER)) / 64800));
      horizon.render({ shot, sun, moon: moon.dir, look, time: seconds });
      return true;
    },
    dispose: () => horizon.dispose(),
  };
}
