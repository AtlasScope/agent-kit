// The arithmetic behind the homepage's scene (components/orbit) that a browser is not needed to check: the map the
// baked textures are laid out on, the framing shared by the live scene and its still, the air's lookup table, and
// the opening's clock. The shaders themselves are judged by eye, in the lab (npm run lab).
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// The scene's modules import each other without a file extension, as the site's bundler expects. Point those at
// the TypeScript files so Node can load them as they are.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try { return nextResolve(specifier, context); } catch (error) {
      if (specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
      throw error;
    }
  },
});
const camera = await import("../components/orbit/camera.ts");
const { DEFAULTS, WIDE, TALL } = await import("../components/orbit/params.ts");
const air = await import("../components/orbit/atmosphere.ts");
const score = await import("../components/orbit/score.ts");

const poseFor = (frame) => frame === TALL
  ? camera.pose(DEFAULTS.tallAltitude, DEFAULTS.tallPitch, DEFAULTS.tallRoll, DEFAULTS.tallYaw, DEFAULTS.tallFocal)
  : camera.pose(DEFAULTS.altitude, DEFAULTS.pitch, DEFAULTS.roll, 0, DEFAULTS.focal);

// Screens as the scene sees them: desktop, laptop, ultrawide, phone, small phone, tablet upright.
const SCREENS = [[1440, 835, WIDE], [1280, 655, WIDE], [2560, 1015, WIDE], [390, 779, TALL], [375, 602, TALL], [759, 1100, TALL]];

test("the map holds every part of the globe a screen can see", () => {
  for (const [width, height, frame] of SCREENS) {
    const p = poseFor(frame), c = camera.crop(frame, width, height);
    const map = camera.mapFor(p, frame, c, width, height, 1 / (p.focal * c.s * 1.5), 4096);
    assert.ok(map.w >= 64 && map.w <= 4096 && map.h >= 64 && map.h <= 4096, `${width}x${height}: a ${map.w}x${map.h} map`);
    let seen = 0;
    for (let j = 0; j <= 20; j++) for (let i = 0; i <= 20; i++) {
      const d = camera.rayAt(p, frame, c, (width * i) / 20, (height * j) / 20);
      // Where this ray meets the ground, if it does.
      const b = -camera.dot(p.pos, d), l = camera.add(p.pos, camera.scale(d, b));
      const disc = air.R_PLANET ** 2 - camera.dot(l, l);
      if (disc < 0 || b < 0) continue;
      const n = camera.norm(camera.add(p.pos, camera.scale(d, b - Math.sqrt(disc))));
      const psi = camera.psiOf(Math.atan2(n[0], -n[2])), rho = camera.rhoOf(Math.acos(n[1]), map.href, map.ah);
      assert.ok(psi > map.psi0 && psi < map.psi1 && rho > map.rho0 && rho < map.rho1, `${width}x${height}: a visible point falls off the map`);
      seen++;
    }
    assert.ok(seen > 40, `${width}x${height}: the planet is in the picture`);
  }
});

test("the map's rows keep advancing, past the horizon too", () => {
  const href = air.R_PLANET + DEFAULTS.altitude, ah = Math.acos(air.R_PLANET / href);
  let last = -Infinity;
  for (let a = 0.005; a < ah + 0.09; a += 0.002) {
    const rho = camera.rhoOf(a, href, ah);
    assert.ok(rho > last, `rho turns back at arc ${a.toFixed(3)}`);
    last = rho;
  }
});

test("the live scene is framed exactly as CSS frames its still", () => {
  // A screen the shape of the frame shows all of it.
  assert.deepEqual(camera.crop(WIDE, 1920, 1080), { s: 1, ox: 0, oy: 0 });
  // Any other shape is covered, and anchored where object-position anchors the image (launch.css).
  for (const [width, height, frame] of SCREENS) {
    const c = camera.crop(frame, width, height);
    assert.ok(frame.w * c.s >= width - 1e-6 && frame.h * c.s >= height - 1e-6, "the frame covers the screen");
    assert.ok(Math.abs(c.ox - (width - frame.w * c.s) * frame.ax) < 1e-9 && Math.abs(c.oy - (height - frame.h * c.s) * frame.ay) < 1e-9);
  }
});

test("what is placed by eye lands on the globe", () => {
  const wide = poseFor(WIDE);
  assert.ok(camera.groundAt(wide, WIDE, DEFAULTS.stormX, DEFAULTS.stormY), "the storm");
  assert.ok(camera.groundAt(wide, WIDE, DEFAULTS.isleX, DEFAULTS.isleY), "the island");
  assert.equal(camera.groundAt(wide, WIDE, 960, 0), null, "the top of the frame is sky");
});

test("the air's table thins with height and thickens toward the horizon", () => {
  const table = air.buildDepthTable();
  // Looking along the ground to the horizon, the column of gas is close to sqrt(pi R H / 2) of sea-level air.
  const flat = air.depthAt(table, 0, 0)[0], expected = Math.sqrt((Math.PI * air.R_PLANET * air.AIR.rayleighHeight) / 2);
  assert.ok(Math.abs(flat - expected) / expected < 0.05, `horizon column ${flat.toFixed(0)} km, expected about ${expected.toFixed(0)}`);
  // Straight up it is one scale height.
  assert.ok(Math.abs(air.depthAt(table, 0, 1)[0] - air.AIR.rayleighHeight) < 0.3);
  for (const height of [0, 5, 20, 60]) {
    let last = Infinity;
    for (const mu of [0, 0.05, 0.2, 0.5, 1]) {
      const gas = air.depthAt(table, height, mu)[0];
      assert.ok(gas <= last + 1e-6, `more air toward a higher sun at ${height} km`);
      last = gas;
    }
  }
  assert.ok(air.depthAt(table, 60, 0.5)[0] < air.depthAt(table, 5, 0.5)[0] / 100, "almost no air above 60 km");
});

test("the opening is a sunrise that never runs backward and ends at rest", () => {
  const cue = (opening, extra = {}) => ({ opening, leave: 0, time: 0, px: 0, py: 0, ...extra });
  const at = (opening) => score.play(cue(opening), DEFAULTS);
  assert.ok(at(0).sunHeight < -1, "it starts with the sun under the limb");
  let last = -Infinity, up = null;
  for (let t = 0; t <= 30; t += 0.05) {
    const shot = at(t);
    assert.ok(shot.sunHeight >= last - 1e-9, `the sun sinks at ${t.toFixed(2)} s`);
    if (up === null && shot.sunHeight >= 0) up = t;
    last = shot.sunHeight;
  }
  assert.ok(up > 0.5 && up < 1.8, `the sun clears the limb ${up?.toFixed(2)} s in, while the words arrive`);
  // At rest: the composed view, exactly, which is what the still shows.
  const rest = score.settled(DEFAULTS);
  assert.ok(Math.abs(rest.sunHeight - DEFAULTS.sunHeight) < 1e-6 && Math.abs(rest.lift) < 1e-6 && Math.abs(rest.zoom - 1) < 1e-6 && Math.abs(rest.exposure - 1) < 1e-6);
  assert.ok(Math.abs(rest.pan) < 1e-9 && Math.abs(rest.tilt - 0.035 * Math.sin(1)) < 1e-9 && rest.clock === 0);
  // The hand-off to the install page puts the light out.
  assert.equal(score.play(cue(1e6, { leave: 1 }), DEFAULTS).exposure, 0);
  // The weather never drifts further than the map's margin allows (about 5 degrees of bearing).
  const farthest = score.play(cue(1e6, { time: 1e6 }), DEFAULTS).clock;
  assert.ok((DEFAULTS.drift * farthest) / 60 < 5, `the clouds turn ${((DEFAULTS.drift * farthest) / 60).toFixed(1)} degrees at most`);
});

test("the resolution governor counts slow frames, and tells slow pixels from a slow page", async () => {
  const { governor, govern } = await import("../components/orbit/governor.ts");
  // Frames `ms` apart for `seconds`, all steady; the cost may depend on how many pixels are drawn.
  const run = (g, seconds, cost) => { const start = g.last || 1000, acts = []; for (let t = start; t < start + seconds * 1000;) { t += cost(g.fit); acts.push(govern(g, t, true)); } return acts; };

  // A machine that draws every frame on time is left alone.
  const fast = governor();
  run(fast, 5, () => 16.7);
  assert.equal(fast.fit, 1);

  // A graphics chip that cannot keep up: frames 45 ms apart at full size, in proportion to the pixels. Frames that
  // late must count (the review of #123 found they were dropped), and each step that helps leads to the next.
  const slow = governor();
  run(slow, 10, (fit) => 45 * fit * fit);
  assert.ok(slow.fit < 0.8 && slow.fit >= 0.5, `stepped down to ${slow.fit.toFixed(2)}`);

  // Hitches on a fast machine (a long frame now and then, from the heap or a busy page) are not slowness.
  const hitched = governor();
  let n = 0;
  run(hitched, 10, () => (++n % 8 === 0 ? 100 : 16.7));
  assert.equal(hitched.fit, 1);

  // A page held to thirty frames a second whatever it draws: one step is tried, buys nothing, and is put back.
  const held = governor();
  run(held, 10, () => 33.3);
  assert.equal(held.fit, 1);
  assert.equal(held.held, true);

  // Gaps the caller does not vouch for (a pause off screen, the idle pace) are not measured.
  const paused = governor();
  for (let t = 1000; t < 20000; t += 500) assert.equal(govern(paused, t, false), "same");
  assert.equal(paused.fit, 1);

  // Far too slow even at half size, or far too slow at any size: give up, and the page keeps its still.
  const pixels = governor();
  assert.ok(run(pixels, 20, (fit) => 360 * fit * fit).includes("give up"));
  const anyway = governor();
  assert.ok(run(anyway, 20, () => 90).includes("give up"));
});
