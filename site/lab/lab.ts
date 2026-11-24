// The orbit lab's page script: sliders for every number in components/orbit/params.ts, a scrubber for the opening,
// and stage sizes for desktop and phone. See scripts/orbit-lab.mjs for how it is served.
//
// The address holds the look: everything changed from the defaults is kept in the hash, so a link reproduces a
// frame exactly. Query switches, for captures:
//   ?bare            no panel; the canvas fills the window
//   ?open=1.2        hold the opening at 1.2 seconds (omit for the scene at rest)
//   ?words           show the homepage's shade and a stand-in for its words
//   ?tier=medium     start on another quality tier
//   ?debug=1         show a raw cloud map instead of the lit scene: 1 height, 2 density, 3 sunlight, 4 slope, 5 hollows
//   ?frame=tall      force the phone composition (or wide), whatever the window's width
//   ?clock=120       hold the weather's clock at 120 seconds
//   ?still           hold everything at rest, as the homepage's still image is made
//   ?world=ink       one of the directions that were tried and set aside (see worlds.ts): day, ink
//   ?cloudSteps=8    with ?airSteps= and ?pixels=: change the chosen tier's numbers, to cost one technique
import { DEFAULTS, OPENING_SECONDS, TIERS, createOrbit, play } from "../components/orbit/index";
import type { Cue, Params } from "../components/orbit/index";
import { WORLDS } from "./worlds";

type Row = [keyof Params, number, number, number];
const GROUPS: [string, Row[]][] = [
  ["World", [["seed", 1, 99, 1]]],
  ["Camera", [["altitude", 200, 1400, 5], ["focal", 900, 3400, 10], ["pitch", -40, 5, 0.1], ["roll", -30, 30, 0.1]]],
  ["Camera, phones", [["tallAltitude", 200, 1400, 5], ["tallFocal", 600, 3400, 10], ["tallPitch", -40, 5, 0.1], ["tallRoll", -30, 30, 0.1], ["tallYaw", -40, 40, 0.5]]],
  ["Sun and moon", [["sunBearing", -60, 80, 0.5], ["sunHeight", -4, 40, 0.1], ["moonBearing", -180, 180, 1], ["moonHeight", 0, 90, 1], ["moonLight", 0, 0.3, 0.002], ["moonAir", 0, 4, 0.02]]],
  ["Aurora", [["aurora", 0, 0.004, 0.00002], ["airglow", 0, 0.0004, 0.000002], ["auroraBearing", -180, 180, 1], ["auroraArc", 0, 90, 0.5], ["auroraOval", 5, 40, 0.25], ["auroraWidth", 2, 80, 0.5], ["auroraRays", 50, 4000, 10]]],
  ["Air", [["rayleigh", 0, 3, 0.01], ["mie", 0, 6, 0.01], ["ozone", 0, 4, 0.01], ["mieG", 0, 0.95, 0.005], ["multi", 0, 2, 0.01], ["skyFill", 0, 1, 0.01], ["twilight", 0, 0.2, 0.002]]],
  ["Ground", [["landScale", 0.5, 6, 0.05], ["seaLevel", -0.5, 0.6, 0.005], ["relief", 0, 12, 0.1], ["coast", 0, 3, 0.05], ["coldBearing", -180, 180, 1], ["coldArc", 0, 60, 0.5], ["coldCap", 0, 60, 0.5], ["isleX", 0, 1920, 5], ["isleY", 500, 1080, 5], ["isleRadius", 0, 1500, 10], ["isleRise", 0, 1.5, 0.01], ["seaGlow", 0, 0.2, 0.002]]],
  ["Weather", [["weatherScale", 1, 9, 0.05], ["cover", -0.8, 0.8, 0.01], ["towers", 0, 3, 0.05], ["cirrus", 0, 2, 0.02], ["cellSize", 10, 120, 1], ["quilt", 0, 1, 0.01], ["cumulus", 0, 1.5, 0.01], ["fronts", 0, 3, 0.02]]],
  ["Storm", [["stormX", 0, 1920, 5], ["stormY", 500, 1080, 5], ["stormRadius", 100, 1500, 10], ["stormTight", -6, 6, 0.05], ["stormArms", 1, 5, 1], ["stormStrength", 0, 1, 1]]],
  ["Motion", [["drift", -4, 4, 0.05], ["stormSpin", -30, 30, 0.5]]],
  ["Cloud light", [["cloudSigma", 0.5, 20, 0.1], ["cloudRelief", 0, 3, 0.02], ["cloudHollows", 0, 1, 0.01], ["cloudRim", 0, 2, 0.01], ["shadowSigma", 0, 6, 0.05]]],
  ["Stars", [["stars", 0, 4, 0.02], ["starDensity", 0, 1, 0.01], ["twinkle", 0, 0.5, 0.01]]],
  ["Print", [["exposure", 0.1, 8, 0.02], ["contrast", 0, 1, 0.01], ["saturation", 0, 2, 0.01], ["grain", 0, 2, 0.01], ["glare", 0, 4, 0.02], ["warmth", 0, 1, 0.01]]],
];
const SIZES: [string, number, number][] = [["Fill", 0, 0], ["Desktop 1440 x 835", 1440, 835], ["Laptop 1280 x 655", 1280, 655], ["Full HD 1920 x 1015", 1920, 1015], ["Phone 390 x 779", 390, 779], ["Small phone 375 x 602", 375, 602], ["Tablet 820 x 1115", 820, 1115]];

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const query = new URLSearchParams(location.search);
const stage = $("stage"), canvas = $<HTMLCanvasElement>("gl"), errorBox = $("error"), statsBox = $("stats");

const fromHash = (): Partial<Params> => { try { return JSON.parse(decodeURIComponent(location.hash.slice(1)) || "{}"); } catch { return {}; } };
// Another world starts from its own look; the sliders and the hash then work from there.
const world = WORLDS[query.get("world") || ""];
const START: Params = { ...DEFAULTS, ...world?.look };
const params: Params = { ...START, ...fromHash() };
const changed = () => Object.fromEntries(Object.entries(params).filter(([key, value]) => START[key as keyof Params] !== value));
const saveHash = () => history.replaceState(null, "", location.pathname + location.search + "#" + encodeURIComponent(JSON.stringify(changed())));

function fail(error: unknown) {
  errorBox.style.display = "block";
  errorBox.textContent = String((error as Error)?.message || error);
  console.error(error);
}

const debug = Number(query.get("debug") || 0);
const frameChoice = query.get("frame");
// A tier with some of its numbers changed, for measuring what each costs.
const tierName = query.get("tier") || "high";
if (["cloudSteps", "airSteps", "pixels"].some((key) => query.has(key))) {
  const base = TIERS[tierName] || TIERS.high;
  TIERS.custom = { ...base, name: "custom", cloudSteps: Number(query.get("cloudSteps") || base.cloudSteps), airSteps: Number(query.get("airSteps") || base.airSteps), pixels: Number(query.get("pixels") || base.pixels) };
}
const created = performance.now();
let firstFrame = 0;
const orbit = createOrbit(canvas, {
  params, tier: TIERS.custom ? "custom" : tierName, allowSoftware: true, debug: debug > 0, onError: fail, world,
  frame: frameChoice === "tall" || frameChoice === "wide" ? frameChoice : undefined,
  fixed: query.has("bare"),
});
if (!orbit) fail("WebGL2 with a float render target is not available in this browser.");

// ---- Controls --------------------------------------------------------------------------------------------------
const controls = $("controls");
const rows = new Map<keyof Params, { input: HTMLInputElement; out: HTMLOutputElement; label: HTMLLabelElement }>();
for (const [title, list] of GROUPS) {
  const h = document.createElement("h2");
  h.textContent = title;
  controls.append(h);
  for (const [key, min, max, step] of list) {
    const label = document.createElement("label"), name = document.createElement("span"), input = document.createElement("input"), out = document.createElement("output");
    label.className = "row";
    name.textContent = key;
    input.type = "range"; input.min = String(min); input.max = String(max); input.step = String(step);
    label.append(name, input, out);
    controls.append(label);
    rows.set(key, { input, out, label });
    input.addEventListener("input", () => { params[key] = Number(input.value); sync(); });
    label.addEventListener("dblclick", () => { params[key] = START[key]; sync(); });
  }
}
function sync() {
  for (const [key, row] of rows) {
    row.input.value = String(params[key]);
    row.out.textContent = String(Number(params[key].toPrecision(4)));
    row.label.classList.toggle("changed", params[key] !== START[key]);
  }
  orbit?.set(params);
  saveHash();
}

const sizeSelect = $<HTMLSelectElement>("size");
SIZES.forEach(([name], i) => sizeSelect.add(new Option(name, String(i))));
function setSize(i: number) {
  const [, w, h] = SIZES[i];
  stage.style.width = w ? `${w}px` : "100%";
  stage.style.height = h ? `${h}px` : "100%";
}
sizeSelect.addEventListener("change", () => setSize(Number(sizeSelect.value)));
const tierSelect = $<HTMLSelectElement>("tier");
tierSelect.value = tierName;
tierSelect.addEventListener("change", () => orbit?.setTier(tierSelect.value));

// ---- The clock -------------------------------------------------------------------------------------------------
const started = performance.now();
let openingAt = -1e9;                 // when the opening last began; far in the past means at rest
const held = query.has("open") ? Number(query.get("open")) : null;
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
stage.addEventListener("pointermove", (e) => {
  const r = stage.getBoundingClientRect();
  pointer.tx = (e.clientX - r.left) / r.width - 0.5;
  pointer.ty = (e.clientY - r.top) / r.height - 0.5;
});
stage.addEventListener("pointerleave", () => { pointer.tx = pointer.ty = 0; });

$("replay").addEventListener("click", () => { openingAt = performance.now(); });
$("rest").addEventListener("click", () => { openingAt = -1e9; });
$("words-on").addEventListener("click", () => toggle("words"));
// The photograph the scene replaces, laid over it for comparison. Made on first use.
let still: HTMLImageElement | null = null;
$("still-on").addEventListener("click", () => {
  if (!still) {
    still = Object.assign(document.createElement("img"), { id: "still", alt: "", src: "/public/hero/orbit-1920.webp" });
    canvas.after(still);
  }
  still.style.display = still.style.display === "block" ? "none" : "block";
});
$("copy").addEventListener("click", () => navigator.clipboard.writeText(JSON.stringify(changed(), null, 2)));
$("reset").addEventListener("click", () => { Object.assign(params, START); sync(); });
function toggle(id: string) {
  for (const part of id === "words" ? ["words", "shade"] : [id]) { const el = $(part); el.style.display = el.style.display === "block" ? "none" : "block"; }
}

if (query.has("bare")) document.body.classList.add("bare");
if (query.has("words")) toggle("words");
sync();

let frames = 0, lastStats = started, fps = 0;
function frame(now: number) {
  requestAnimationFrame(frame);
  stage.classList.toggle("narrow", stage.clientWidth < 760);
  pointer.x += (pointer.tx - pointer.x) * 0.06;
  pointer.y += (pointer.ty - pointer.y) * 0.06;
  const cue: Cue = { opening: held ?? (now - openingAt) / 1000, leave: 0, time: query.has("still") ? 0 : (now - started) / 1000, px: pointer.x, py: pointer.y };
  const shot = play(cue, params);
  if (query.has("clock")) shot.clock = Number(query.get("clock"));
  if (orbit?.render({ ...shot, debug, steady: true })) { frames++; if (!firstFrame) { orbit.finish(); firstFrame = performance.now() - created; } }
  if (now - lastStats > 500) {
    fps = (frames * 1000) / (now - lastStats); frames = 0; lastStats = now;
    const s = orbit?.stats();
    if (s) statsBox.textContent = `${s.tier}  ${s.width} x ${s.height} (${Math.round(s.scale * 100)}%)  map ${s.map[0]} x ${s.map[1]}\n${fps.toFixed(0)} fps  gpu ${s.gpuMs ? s.gpuMs.toFixed(1) : "?"} ms  cpu ${s.cpuMs.toFixed(2)} ms\nopening ${Math.min(cue.opening, 99).toFixed(1)} / ${OPENING_SECONDS} s`;
  }
}
requestAnimationFrame(frame);

// How long one frame really takes: draw `count` of them back to back and wait for the GPU to finish. (A frame
// drawn at the screen's pace says little, because an idle GPU slows itself down.)
function bench(count = 40) {
  if (!orbit) return 0;
  const shot = play({ opening: held ?? 1e6, leave: 0, time: 10, px: 0, py: 0 }, params);
  orbit.render(shot); orbit.finish();
  const t0 = performance.now();
  for (let i = 0; i < count; i++) orbit.render({ ...shot, time: 10 + i * 0.016 });
  orbit.finish();
  return (performance.now() - t0) / count;
}

// How long the maps take to make: change the seed, which remakes both, and wait for the GPU.
function bakeBench() {
  if (!orbit) return 0;
  const shot = play({ opening: 1e6, leave: 0, time: 10, px: 0, py: 0 }, params);
  orbit.render(shot); orbit.finish();
  const t0 = performance.now();
  orbit.set({ ...params, seed: params.seed + 1 });
  orbit.render(shot); orbit.finish();
  const ms = performance.now() - t0;
  orbit.set(params);
  return ms;
}

// For the console and for capture scripts.
Object.assign(window, { lab: { orbit, params, sync, bench, bakeBench, firstFrame: () => firstFrame, replay: () => { openingAt = performance.now(); } } });

// Reload when the renderer or the lab changes on disk.
new EventSource("/__reload").addEventListener("message", () => location.reload());
