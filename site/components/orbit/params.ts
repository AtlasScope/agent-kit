// Every number that shapes the scene, in one place. The homepage uses these as they are; the orbit lab
// (site/lab) edits a copy live and prints the result, so a look found there can be pasted back here.
// Angles are degrees, lengths km, colours linear RGB.
import type { Frame } from "./camera";

// The two reference frames: their size, and where a screen that shows only part of one is anchored on it.
export const WIDE: Frame = { w: 1920, h: 1080, ax: 0.72, ay: 1 };
export const TALL: Frame = { w: 1080, h: 1350, ax: 1, ay: 1 };
// Which screens get the tall one: phones, and anything taller than 5:4 (a tablet held upright). The homepage picks
// the still's file and tells the live scene its frame by this one query, and launch.css repeats it for the still's
// anchor, so the scene always sits exactly on its still.
export const TALL_SCREEN = "(max-width: 759.98px), (max-aspect-ratio: 4/5)";

export const DEFAULTS = {
  seed: 11,

  // Camera, wide screens. `focal` is in pixels of the 1920-wide reference frame.
  altitude: 420, focal: 1930, pitch: -14.4, roll: -10,
  // Camera, tall screens: a little wider, and turned toward the sunrise. The tall frame is anchored at its right
  // edge, so the sun keeps to the right of a phone and of an upright tablet alike, clear of the words.
  tallAltitude: 420, tallFocal: 1500, tallPitch: -9.5, tallRoll: -8, tallYaw: 3.2,

  // The sun: its bearing from straight ahead, and how high above the limb it stands once the opening has played.
  sunBearing: 20, sunHeight: 0.5,
  // The moon: its bearing from straight ahead, its height above the camera's own horizon, its light as a fraction
  // of the sun's (far more than a real moon's: the eye, not a camera, is the model), and how much the air shows it.
  moonBearing: -70, moonHeight: 20, moonLight: 0.12, moonAir: 1,
  // The aurora: where its magnetic pole is (bearing and arc from the point under the camera), how far from the pole
  // the oval runs, the curtain's width in km, how fine its rays are, and its brightness. Then the airglow's.
  auroraBearing: -18, auroraArc: 31, auroraOval: 18, auroraWidth: 5, auroraRays: 420, aurora: 0.0022, airglow: 0.00002,
  // Where along the oval the aurora is brightest (its bearing, degrees), how wide that stretch is, and how bright the
  // rest of the oval is beside it.
  surgeBearing: -4, surgeWidth: 14, surgeRest: 0.25,

  // Air. Multipliers on Earth's values, then the haze's forward throw and the twice-scattered fill.
  rayleigh: 0.6, mie: 2, ozone: 0.5, mieG: 0.84, multi: 0.25, skyFill: 0.35, twilight: 0.03,

  // Ground. The island and the cold pole are placed by eye: the island by where it sits in the wide frame.
  landScale: 1.7, seaLevel: 0.08, relief: 5, coast: 1.1, coldBearing: -48, coldArc: 40, coldCap: 6,
  isleX: 700, isleY: 960, isleRadius: 500, isleRise: 0.35, seaGlow: 0.06,

  // Weather.
  weatherScale: 3.2, cover: -0.25, towers: 1.6, cirrus: 0.7, cellSize: 26, quilt: 0.35, cumulus: 0.5, fronts: 1,
  stormX: 1350, stormY: 760, stormRadius: 1300, stormTight: 1.5, stormArms: 3, stormStrength: 1,
  // How the weather moves once baked, in degrees a minute: the whole layer round the point under the camera, and
  // the storm about its own centre.
  drift: 0.6, stormSpin: 3,
  cloudSigma: 5, cloudRelief: 1.3, cloudHollows: 0.6, cloudRim: 0.25, shadowSigma: 1.4,

  // Stars.
  stars: 1, starDensity: 0.6, twinkle: 0.06,

  // The print.
  exposure: 4.5, contrast: 0.45, saturation: 1.15, grain: 0.35, glare: 1, warmth: 0.5,
  // Bloom: how much of the light spreads into a glow, and how wide (toward the largest blur).
  bloom: 0.05, bloomSpread: 0.5, split: 0.6,
  // The dawn on the limb: how bright the seam of light along the horizon is, how far it spreads from the sun, and
  // the soft aureole round the disc (post.ts).
  dawn: 0.3, dawnSpread: 0.5, aureole: 0.6,
};
export type Params = typeof DEFAULTS;

// The parameters a bake depends on. When one of these changes the maps are rebuilt; the rest are per-frame.
export const SURFACE_KEYS: (keyof Params)[] = ["seed", "landScale", "seaLevel", "relief", "coast", "coldBearing", "coldArc", "coldCap", "isleX", "isleY", "isleRadius", "isleRise"];
export const CLOUD_KEYS: (keyof Params)[] = ["seed", "weatherScale", "cover", "towers", "cirrus", "cellSize", "quilt", "cumulus", "fronts", "stormX", "stormY", "stormRadius", "stormTight", "stormArms", "stormStrength"];
export const VIEW_KEYS: (keyof Params)[] = ["altitude", "focal", "pitch", "roll", "tallAltitude", "tallFocal", "tallPitch", "tallRoll", "tallYaw"];
