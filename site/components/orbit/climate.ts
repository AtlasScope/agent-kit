// The climate: how the view changes while someone stays on the page.
//
// One world, seen through a window, in three conditions that come and go on their own:
//
//   quiet      The resting state and most of any visit. The sun just on the limb, a thin seam of dawn, a faint
//              aurora far off on the night side, the most negative space round the words.
//   luminous   The sun clears the limb by a degree or two, the cloud tops catch it and throw long shadows, the seam
//              of dawn widens and warms. Daylight arriving rather than a change of picture.
//   magnetic   An aurora develops: it brightens over half a minute, its oval swells toward the camera, the surge
//              (the brightest stretch of curtain) travels along it and flares a few times, then it fades away.
//
// The two spectacular conditions are passages laid over the quiet one. Each rises slowly, holds, and falls away
// slowly, so nothing is ever seen to switch. Between passages there is always a long quiet stretch, so the spectacle
// keeps its value. Which passages come, in what order, how strong and how long is decided once per visit from a
// seed, inside ranges chosen by eye; so is the state the visit opens in. Two visits rarely look the same, and every
// visit is a coherent stretch of one sky.
//
// Only numbers the renderer reads each frame are touched (nothing in SURFACE_KEYS or CLOUD_KEYS), so the climate
// never rebuilds a map and costs nothing but a few multiplications a frame. The lab plays it with ?climate=<seed>.
import type { Params } from "./params";

export type Mood = "quiet" | "luminous" | "magnetic";
type Look = Partial<Record<keyof Params, number>>;

// The quiet state, in full. The other two are what they add to it at their height.
const QUIET: Look = {
  sunHeight: 0.4, dawn: 0.24, dawnSpread: 0.45, aureole: 0.5,
  aurora: 0.0008, surgeBearing: -4, surgeWidth: 10, surgeRest: 0.2, auroraOval: 18, auroraWidth: 5, airglow: 0.000015,
  cloudRim: 0.22, cloudRelief: 1.3, exposure: 4.4, bloom: 0.045, stars: 1, warmth: 0.5, glare: 1,
};
const ADD: Record<Exclude<Mood, "quiet">, Look> = {
  luminous: { sunHeight: 1.2, dawn: 0.22, dawnSpread: 0.3, cloudRim: 0.55, cloudRelief: 0.45, exposure: 0.35, stars: -0.35, aurora: -0.0004, warmth: -0.06, glare: -0.5 },
  magnetic: { aurora: 0.0028, surgeRest: 0.16, surgeWidth: 14, auroraOval: -1.6, auroraWidth: 2.5, airglow: 0.00002, sunHeight: -0.15, dawn: -0.04, exposure: -0.1, stars: 0.3 },
};
export const CLIMATE_KEYS = Object.keys(QUIET) as (keyof Params)[];

export type Passage = { mood: Exclude<Mood, "quiet">; start: number; rise: number; hold: number; fall: number; strength: number; phase: number };
export type Visit = { seed: number; opening: string; passages: Passage[]; clockStart: number };

// A small seeded generator (mulberry32): the same seed always gives the same visit.
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// How a visit may open. A visit that opens inside a passage starts partway through it, so the first thing seen is
// already in motion: light already on the clouds, an aurora already up and about to fade, or one just beginning.
const OPENINGS: [string, number][] = [["quiet", 0.4], ["luminous", 0.25], ["aurora rising", 0.2], ["aurora fading", 0.15]];
// How long each part of a passage lasts, in seconds, as [least, most].
const SHAPE = {
  luminous: { rise: [18, 28], hold: [25, 55], fall: [25, 40] },
  magnetic: { rise: [25, 40], hold: [35, 75], fall: [35, 55] },
} as const;
// The quiet between two passages, and how often the next passage is the other kind.
const GAP: [number, number] = [55, 140], SWITCH = 0.7;
// Visits are planned this far ahead; past it, the plan simply runs again from its start.
const PLAN = 3600;

export function visit(seed: number): Visit {
  const r = random(seed * 2654435761 + 1);
  const span = ([a, b]: readonly [number, number]) => a + (b - a) * r();
  const pick = () => { let x = r(); for (const [name, w] of OPENINGS) { if ((x -= w) < 0) return name; } return OPENINGS[0][0]; };
  const passage = (mood: Passage["mood"], start: number): Passage => {
    const s = SHAPE[mood];
    // Most passages come in full; one in four is a gentler one.
    return { mood, start, rise: span(s.rise), hold: span(s.hold), fall: span(s.fall), strength: r() < 0.25 ? span([0.45, 0.65]) : span([0.8, 1]), phase: r() * 1000 };
  };
  const opening = pick();
  const passages: Passage[] = [];
  let mood: Passage["mood"] = r() < 0.5 ? "luminous" : "magnetic";
  let t = span([20, 50]);
  if (opening !== "quiet") {
    mood = opening === "luminous" ? "luminous" : "magnetic";
    const p = passage(mood, 0);
    // Place it so that the visit begins at the chosen point in it.
    const into = opening === "aurora rising" ? span([2, 8]) : opening === "luminous" ? p.rise + p.hold * span([0.1, 0.5]) : p.rise + p.hold * span([0.6, 0.9]);
    p.start = -into;
    passages.push(p);
    t = p.start + p.rise + p.hold + p.fall + span(GAP);
    mood = r() < SWITCH ? (mood === "luminous" ? "magnetic" : "luminous") : mood;
  }
  while (t < PLAN) {
    const p = passage(mood, t);
    passages.push(p);
    t += p.rise + p.hold + p.fall + span(GAP);
    mood = r() < SWITCH ? (mood === "luminous" ? "magnetic" : "luminous") : mood;
  }
  // Where the weather's clock starts, so the clouds have drifted a different amount at the start of each visit.
  return { seed, opening, passages, clockStart: span([0, 90]) };
}

// A random seed for a fresh visit, or one from the address (?sky=12) to reproduce one.
export const freshSeed = () => Math.floor(Math.random() * 1e6);

const clamp = (x: number) => Math.min(1, Math.max(0, x));
// Eases that start and finish with no speed and no acceleration: a passage is never seen to begin or end.
const ease = (x: number) => { const t = clamp(x); return t * t * t * (t * (6 * t - 15) + 10); };

// How far a passage has come at time t: 0 before and after, 1 while it holds.
export function envelope(p: Passage, t: number) {
  const x = t - p.start;
  if (x <= 0 || x >= p.rise + p.hold + p.fall) return 0;
  return x < p.rise ? ease(x / p.rise) : x < p.rise + p.hold ? 1 : 1 - ease((x - p.rise - p.hold) / p.fall);
}

// A slow wobble made of three unrelated sines, -1..1, for what moves inside a passage.
const wobble = (t: number, phase: number, period: number) =>
  (Math.sin((t + phase) * 6.2832 / period) + 0.6 * Math.sin((t + phase * 1.7) * 6.2832 / (period * 0.47) + 1.3) + 0.35 * Math.sin((t + phase * 2.3) * 6.2832 / (period * 0.29) + 4.1)) / 1.95;

export type Weather = { look: Look; weights: Record<Mood, number> };

// The climate at t seconds into the visit: the numbers to lay over the look, and how much of each mood is showing.
export function climate(v: Visit, time: number): Weather {
  const t = time % PLAN;
  const look: Look = { ...QUIET };
  const weights: Record<Mood, number> = { quiet: 1, luminous: 0, magnetic: 0 };
  for (const p of v.passages) {
    const e = envelope(p, t) * p.strength;
    if (e <= 0) continue;
    weights[p.mood] = Math.max(weights[p.mood], e);
    const add = ADD[p.mood];
    let k: keyof Params;
    for (k in add) look[k] = (look[k] ?? 0) + add[k]! * e;
    const x = t - p.start, length = p.rise + p.hold + p.fall;
    if (p.mood === "magnetic") {
      // Inside a storm: the surge travels along the oval from one side to the other over the passage, the curtain
      // flares a few times (substorms), and the oval breathes toward and away from the camera.
      look.surgeBearing = look.surgeBearing! * (1 - e) + (-14 + 36 * (x / length) + 4 * wobble(x, p.phase, 47)) * e;
      look.aurora = look.aurora! + 0.0008 * e * Math.max(0, wobble(x, p.phase + 50, 19));
      look.auroraOval = look.auroraOval! + 0.6 * e * wobble(x, p.phase + 90, 31);
    } else {
      // Light on the clouds comes and goes a little as the sun's height breathes.
      look.sunHeight = look.sunHeight! + 0.15 * e * wobble(x, p.phase, 41);
    }
  }
  weights.quiet = clamp(1 - weights.luminous - weights.magnetic);
  return { look, weights };
}

// The weather's clock for a visit: it starts partway on, and slows toward the most the baked map allows.
export const weatherClock = (v: Visit, time: number) => 300 * (1 - Math.exp(-(time + v.clockStart) / 300));
