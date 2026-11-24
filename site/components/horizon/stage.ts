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
  start: string | "now";        // an ISO moment, or the moment of the visit
  orbit: Omit<Orbit, "epoch">;
  wide: View; tall: View;
  rate: number;                 // seconds of orbit per second of visit
  meter: number;                // exposure compensation, in stops
  look?: Partial<Look>;
}

const WIDE: View = { heading: 43, pitch: 33, roll: -20, focal: 2.4 }, TALL: View = { heading: 43, pitch: 38, roll: -12, focal: 1.55 };
export const DIRECTIONS: Record<string, Direction> = {
  day: {
    title: "Meridian, day",
    note: "A real low over the South Pacific on 22 November 2026, as NASA's VIIRS instrument saw it, lit by that afternoon's sun.",
    maps: "earth", start: "2026-11-22T01:00:00Z",
    orbit: orbitThrough(-30, -178, 75, 1800), wide: WIDE, tall: TALL, rate: 4, meter: 0,
  },
  dawn: {
    title: "Meridian, first light",
    note: "The same orbit a few hours earlier, flying toward sunrise. The colour on the limb is computed from the air, not painted.",
    maps: "earth", start: "2026-11-21T16:05:00Z",
    orbit: orbitThrough(-37, 153, 72, 1800), wide: { ...WIDE, heading: 28 }, tall: { ...TALL, heading: 28 }, rate: 4, meter: 0,
  },
  night: {
    title: "Meridian, night",
    note: "Iberia and the Mediterranean after dark: measured city lights, moonlit cloud, and the thin green line of airglow.",
    maps: "earth", start: "2026-11-22T21:30:00Z",
    orbit: orbitThrough(30, -5, 60, 1800), wide: { ...WIDE, heading: 0 }, tall: { ...TALL, heading: 0 }, rate: 4, meter: 0,
  },
  now: {
    title: "Meridian, now",
    note: "This moment: the sun and moon where the almanac puts them, on an orbit that started over the mid-Pacific when the page opened.",
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
export function createStage(canvas: HTMLCanvasElement, options: { direction: Direction; tall: () => boolean; base?: string; cloud?: string; startAt?: number; rate?: number; onError?: (e: Error) => void }) {
  const { direction } = options;
  const base = options.base ?? "/horizon";
  const maps: Maps = { cloud: `${base}/${direction.maps}/${options.cloud ?? "clouds"}.jpg`, colour: `${base}/${direction.maps}/colour.jpg`, night: `${base}/${direction.maps}/night.jpg` };
  const horizon = createHorizon(canvas, { maps, onError: options.onError });
  const epoch = options.startAt ?? (direction.start === "now" ? Date.now() : Date.parse(direction.start));
  const orbit: Orbit = { ...direction.orbit, epoch };
  const rate = options.rate ?? direction.rate;
  let first = -1, stops: number | null = null, last = 0;

  return {
    horizon,
    ready: () => horizon.ready(),
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
      const pitch = view.pitch - 7 * arrive - 9 * leave + cue.py * 0.5;
      const shot = aim(at.position, view.heading - cue.px * 0.7, pitch, view.roll, at.travel);
      const sun = sunDirection(ms), moon = moonDirection(ms);
      // The meter adapts over a few seconds, as an eye or a camera would, so crossing the terminator is a slow
      // change of exposure and never a jump.
      const wanted = meter(dot(target(shot.position, shot.forward), sun)) + direction.meter;
      const dt = Math.min(0.25, Math.max(0, (cue.now - last) / 1000)); last = cue.now;
      stops = stops === null ? wanted : stops + (wanted - stops) * (1 - Math.exp(-dt / 2.5));
      const fade = (1 - 0.75 * Math.exp(-Math.max(cue.opening, 0) / 0.6)) * (1 - leave);
      const look: Look = { ...LOOK, ...direction.look, focal: view.focal * (1 + 0.1 * arrive) };
      look.exposure = Math.pow(2, stops) * fade;
      look.moonlight = LOOK.moonlight * (0.15 + 0.85 * moon.phase);
      horizon.render({ shot, sun, moon: moon.dir, look, time: seconds });
      return true;
    },
    dispose: () => horizon.dispose(),
  };
}
