// The score: what the camera and the light do over time. The homepage and the lab both play it.
//
// The opening is first light seen from orbit. It begins on the night side: stars, the aurora, a moonlit sea of cloud,
// and a thin line of twilight on the limb. The camera tilts down onto the planet as the sun comes up over the
// horizon, about a second in. Everything then slows toward where it rests without ever quite stopping: each
// quantity closes on its resting value exponentially, so there is no moment at which the scene is seen to arrive.
import type { Params } from "./params";
import type { Shot } from "./renderer";

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const easeInOut = (x: number) => { const t = clamp(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
// What is left of a head start after t seconds, falling by e every `tau` seconds.
const left = (t: number, tau: number) => Math.exp(-Math.max(t, 0) / tau);

export type Cue = {
  opening: number;     // seconds since the opening began; a large number means it has long finished
  leave: number;       // 0..1, the hand-off to the install page
  time: number;        // seconds since the scene began
  px: number;          // pointer, -0.5..0.5 across
  py: number;          //   and down the window, already smoothed
};

// How long the page treats the opening as running (its own text arrives inside this). The scene goes on settling
// for a few seconds more.
export const OPENING_SECONDS = 3.4;
// The sun starts this far below where it rests, in degrees, and closes on it by e every SUN_TAU seconds. It rests
// half a degree over the limb, so it starts three and a half below: the limb brightens first, and the disc breaks
// the horizon about a second and a quarter in, while the headline arrives.
const SUN_RUN = 4, SUN_TAU = 0.55;

export function play(cue: Cue, params: Params): Shot {
  const t = cue.opening;
  const leave = easeInOut(cue.leave);
  // A slow float, a few hundredths of a degree, so the view is never perfectly still.
  const float = { pan: 0.05 * Math.sin(cue.time / 13), tilt: 0.035 * Math.sin(cue.time / 9 + 1) };
  return {
    time: cue.time,
    // The weather drifts on, slower and slower: after some minutes it has gone as far as the baked map allows.
    clock: 300 * (1 - Math.exp(-cue.time / 300)),
    sunHeight: params.sunHeight - SUN_RUN * left(t - 0.1, SUN_TAU) - 4 * leave,
    lift: 5.5 * left(t, 1.1) + 5 * leave,
    zoom: 1 + 0.12 * left(t, 1.3),
    pan: -cue.px * 0.5 + float.pan,
    tilt: cue.py * 0.35 + float.tilt,
    drift: [cue.px * 14, -cue.py * 9],
    exposure: (1 - 0.6 * left(t, 0.6)) * (1 - leave),
    stars: 1 + 1.2 * left(t, 1.5),
    night: 1 + 0.8 * left(t, 2),
  };
}

// The scene at rest, as the still image shows it.
export const settled = (params: Params): Shot => play({ opening: 1e6, leave: 0, time: 0, px: 0, py: 0 }, params);
