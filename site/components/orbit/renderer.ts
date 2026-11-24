// The orbit renderer: owns the WebGL2 context and runs the passes.
//
//   bake (once)      the world's generators -> surface and cloud maps          glsl/world.ts, glsl/bake.ts
//   shade (cheap)    cloud shadows, under the sun and under the moon           glsl/shade.ts
//   scene            rays, ground, clouds, air, sun -> linear light            glsl/scene.ts
//   aurora           the aurora alone, at half size                            glsl/aurora.ts
//   post             stars, aurora, glare, exposure, tone, dither -> canvas    glsl/post.ts
//
// The caller owns the clock: it hands render() a Shot (where the camera, the sun and the weather are this frame) and
// gets a picture. Nothing here schedules itself. The one thing the renderer decides alone is how many pixels to
// draw: it watches how long frames take and trades resolution for frame rate.
import { AIR, DEPTH_H, DEPTH_W, R_PLANET, buildDepthTable, depthAt } from "./atmosphere";
import { RAD, add, crop, cross, dot, groundAt, limbDrop, mapFor, norm, pose, rayBasis, scale } from "./camera";
import type { Crop, Frame, MapSpec, Pose, Vec3 } from "./camera";
import { Uniforms, createPass, createTarget, createTexture, deletePass, draw, passReady } from "./gl";
import type { GL, Pass } from "./gl";
import { AURORA } from "./glsl/aurora";
import { BAKE_CLOUDS, bakeSurface as surfaceShader } from "./glsl/bake";
import { POST } from "./glsl/post";
import { sceneShader } from "./glsl/scene";
import { SHADE } from "./glsl/shade";
import { govern, governor } from "./governor";
import { CLOUD_KEYS, DEFAULTS, SURFACE_KEYS, TALL, VIEW_KEYS, WIDE } from "./params";
import type { Params } from "./params";

// One frame's camera, light and weather, on top of the composed view in params.
export type Shot = {
  time: number;        // seconds since the scene began, for what moves on its own
  clock: number;       // seconds of weather: how long the clouds have been drifting
  sunHeight: number;   // degrees above the limb
  lift: number;        // degrees the camera is tilted up from its composed pitch
  zoom: number;        // 1 is the composed framing
  pan: number;         // degrees of yaw and
  tilt: number;        //   pitch from the pointer
  drift: [number, number];   // km the camera has slid sideways and up, for parallax
  exposure: number;    // multiplies the look's exposure
  stars: number;       // multiplies the stars
  night: number;       // multiplies the aurora and the airglow
  steady?: boolean;    // this frame follows the last at the screen's own rate, so the gap between them is a fair measure of speed
  debug?: number;      // lab only: which raw map to show instead of the lit scene (see glsl/scene.ts)
};

// dpr: the most device pixels per CSS pixel; pixels: the most pixels in all; the rest is how hard each pixel works.
export type Tier = { name: string; dpr: number; pixels: number; cloudSteps: number; airSteps: number; mapScale: number; shadeScale: number; mapMax: number };
export const TIERS: Record<string, Tier> = {
  high: { name: "high", dpr: 2, pixels: 2.7e6, cloudSteps: 24, airSteps: 8, mapScale: 1, shadeScale: 0.6, mapMax: 4096 },
  medium: { name: "medium", dpr: 1.5, pixels: 1.7e6, cloudSteps: 18, airSteps: 7, mapScale: 1.2, shadeScale: 0.5, mapMax: 4096 },
  low: { name: "low", dpr: 1.25, pixels: 0.9e6, cloudSteps: 12, airSteps: 6, mapScale: 1.5, shadeScale: 0.4, mapMax: 2048 },
  // For the still images: every pixel asked for, however many.
  still: { name: "still", dpr: 4, pixels: 4e7, cloudSteps: 40, airSteps: 14, mapScale: 1, shadeScale: 0.75, mapMax: 8192 },
};

export type Stats = { ready: boolean; lost: boolean; width: number; height: number; map: [number, number]; scale: number; cpuMs: number; gpuMs: number; bakeMs: number; tier: string };
export type Orbit = {
  render(shot: Shot): boolean;
  set(params: Partial<Params>): void;
  setTier(name: string): void;
  stats(): Stats;
  finish(): void;      // wait until everything asked for so far has been drawn (still images, benchmarks)
  dispose(): void;
};
export type Options = {
  params?: Partial<Params>;
  tier?: string;
  // Which composition to use: fixed (the still images), or asked of the page each time the canvas changes size, so
  // that it is decided by the very media query that picks the still. Left out, it goes by the canvas's shape.
  frame?: "wide" | "tall" | (() => "wide" | "tall");
  allowSoftware?: boolean;       // draw even on a software renderer (the lab and the still images)
  fixed?: boolean;               // never trade resolution for speed
  debug?: boolean;               // compile in the lab's raw-map views
  world?: { ground?: string; surface?: string };   // lab only: GLSL for another ground and how to light it
  onError?: (error: unknown) => void;
};

// The page's black: .launch in app/launch.css. The picture's darkest tone is this, so the sky meets the header
// without a seam and the hand-off to /install fades to the page. Change both together, then remake the stills.
const INK: Vec3 = [2 / 255, 3 / 255, 2 / 255];
// Left to itself (the lab), the renderer uses the tall composition below this width or on a canvas taller than 5:4.
// The homepage decides by media query instead: TALL_SCREEN in params.ts.
const NARROW = 760;
const smoothstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function createOrbit(canvas: HTMLCanvasElement, options: Options = {}): Orbit | null {
  const context = canvas.getContext("webgl2", {
    alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false,
    powerPreference: "high-performance", failIfMajorPerformanceCaveat: !options.allowSoftware,
  });
  if (!context) return null;
  const gl: GL = context;
  // Extensions belong to a context's lifetime: they are asked for here and again whenever the context comes back.
  let parallel: KHR_parallel_shader_compile | null = null;
  let timer: ReturnType<GL["getExtension"]> = null;
  const extensions = () => {
    // Linear light needs a float target. Nearly every WebGL2 device has one of these two.
    const float = gl.getExtension("EXT_color_buffer_float") || gl.getExtension("EXT_color_buffer_half_float");
    parallel = gl.getExtension("KHR_parallel_shader_compile");
    timer = options.debug ? gl.getExtension("EXT_disjoint_timer_query_webgl2") : null;
    return !!float;
  };
  if (!extensions()) return null;

  let params: Params = { ...DEFAULTS, ...options.params };
  let tier = TIERS[options.tier || "high"] || TIERS.high;
  // The graphics chip's own name, where the browser gives it, settles two things. First, whether to draw at all:
  // a software renderer can pass the browser's own "no major caveat" test (Chromium's does, in a headless or
  // GPU-less session) and would then take seconds a frame, so it is turned away by name. Second, the tier: the
  // caller's choice is a guess from the kind of device, and an integrated or older mobile chip starts a step
  // lower, the weakest at the bottom. (After that, the frame rate decides: see judge().)
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const chip = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  if (!options.allowSoftware && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(chip)) return null;
  if (!options.fixed && (tier === TIERS.high || tier === TIERS.medium)) {
    if (/Mali-[4T]|Mali-G[35]\d\b|PowerVR|Adreno \(?TM\)? ?[3-5]\d\d|Intel.*(HD Graphics [2-5]\d\d\d?\b|HD Graphics\b(?! 6)|GMA)/i.test(chip)) tier = TIERS.low;
    else if (/Intel(?!.*Arc)|Mali|Adreno|Radeon.*(Vega|Graphics\b)|Microsoft Basic/i.test(chip)) tier = tier === TIERS.high ? TIERS.medium : TIERS.low;
  }

  // The programs and the air's lookup table: everything that does not depend on the size of the canvas. Built
  // here, and built again if the browser takes the context away and gives it back.
  const table = buildDepthTable();
  let passes: Record<string, Pass> = {};
  let depthTex: WebGLTexture | null = null;
  function build() {
    passes = {
      surface: createPass(gl, "surface bake", surfaceShader(options.world?.ground)),
      clouds: createPass(gl, "cloud bake", BAKE_CLOUDS),
      shade: createPass(gl, "cloud shadows", SHADE),
      scene: createPass(gl, "scene", sceneShader(tier.cloudSteps, tier.airSteps, options.debug, options.world?.surface)),
      aurora: createPass(gl, "aurora", AURORA),
      post: createPass(gl, "post", POST),
    };
    // Lab only: a map shown flat, as it is stored, to tell a fault in a generator from a fault in drawing it.
    if (options.debug) {
      passes.peek = createPass(gl, "peek", `#version 300 es
precision highp float; uniform sampler2D uTex; uniform vec2 uRes; uniform vec4 uPick; out vec4 o;
void main(){ vec4 t = texture(uTex, gl_FragCoord.xy/uRes); float v = dot(t, uPick); o = vec4(vec3(v), 1.); }`);
    }
    depthTex = createTexture(gl, { w: DEPTH_W, h: DEPTH_H, internal: gl.RGBA16F, format: gl.RGBA, type: gl.FLOAT, linear: true, data: table });
  }
  build();

  type Layer = { a: WebGLTexture; b: WebGLTexture; fb: WebGLFramebuffer };
  type Small = { tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number };
  let surf: Layer | null = null, cloud: Layer | null = null;
  let shade: Small | null = null, shadeMoon: Small | null = null, scene: Small | null = null, glow: Small | null = null;

  // The composed view for the current canvas size. k is device pixels per CSS pixel at full quality; `fit` is the
  // share of that the renderer is drawing right now.
  let cssW = 0, cssH = 0, k = 1, fit = 1, frame: Frame = WIDE, base: Pose = pose(420, -14.4, -10, 0, 1930), view: Crop = { s: 1, ox: 0, oy: 0 };
  let map: MapSpec | null = null;
  let surfaceKey = "", cloudKey = "", shadeKey = "", moonKey = "";
  let cpuMs = 0, gpuMs = 0, bakeMs = 0;
  let dead = false, lost = false, disposed = false;
  let query: WebGLQuery | null = null;
  const pending: WebGLQuery[] = [];

  // A lost context takes every texture and program with it. Say we want it back, draw nothing meanwhile (the page
  // shows its still image), and start again from nothing when it returns.
  const onLost = (event: Event) => { event.preventDefault(); lost = true; };
  const onRestored = () => {
    surf = cloud = null; shade = shadeMoon = scene = glow = null; map = null; query = null; pending.length = 0;
    if (!extensions()) return;
    build();
    lost = false;
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  const layer = (w: number, h: number): Layer => {
    const make = () => createTexture(gl, { w, h, internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE, linear: true, mips: true });
    const a = make(), b = make();
    return { a, b, fb: createTarget(gl, [a, b]) };
  };
  const dropLayer = (l: Layer | null) => { if (l) { gl.deleteTexture(l.a); gl.deleteTexture(l.b); gl.deleteFramebuffer(l.fb); } };
  const dropSmall = (t: Small | null) => { if (t) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); } };
  const mips = (l: Layer) => { for (const t of [l.a, l.b]) { gl.bindTexture(gl.TEXTURE_2D, t); gl.generateMipmap(gl.TEXTURE_2D); } };

  const tall = () => frame === TALL;
  const composed = () => pose(tall() ? params.tallAltitude : params.altitude, tall() ? params.tallPitch : params.pitch, tall() ? params.tallRoll : params.roll, tall() ? params.tallYaw : 0, tall() ? params.tallFocal : params.focal);

  // Size the canvas and the linear-light target for the current fit.
  function resize() {
    const w = Math.max(1, Math.round(cssW * k * fit)), h = Math.max(1, Math.round(cssH * k * fit));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    if (scene && scene.w === w && scene.h === h) return;
    dropSmall(scene); dropSmall(glow);
    const target = (tw: number, th: number, mips = false): Small => {
      const tex = createTexture(gl, { w: tw, h: th, internal: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT, linear: true, mips });
      return { tex, fb: createTarget(gl, [tex]), w: tw, h: th };
    };
    // The scene keeps a chain of smaller copies of itself: the post pass reads them for the bloom.
    scene = target(w, h, true);
    glow = target(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)));
  }

  function layout() {
    cssW = canvas.clientWidth; cssH = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, tier.dpr);
    k = Math.min(dpr, Math.sqrt(tier.pixels / Math.max(cssW * cssH, 1)));
    const choice = typeof options.frame === "function" ? options.frame() : options.frame;
    frame = choice ? (choice === "tall" ? TALL : WIDE) : cssW < NARROW || cssW / cssH < 0.8 ? TALL : WIDE;
    base = composed();
    view = crop(frame, cssW, cssH);
    resize();

    // One map texel per screen pixel at the composed view, give or take the tier.
    const texelAngle = tier.mapScale / (base.focal * view.s * k);
    const next = mapFor(base, frame, view, cssW, cssH, texelAngle, Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), tier.mapMax));
    if (!map || next.w !== map.w || next.h !== map.h || !surf) {
      dropLayer(surf); dropLayer(cloud); dropSmall(shade); dropSmall(shadeMoon);
      surf = layer(next.w, next.h); cloud = layer(next.w, next.h);
      const sw = Math.max(32, Math.round(next.w * tier.shadeScale)), sh = Math.max(32, Math.round(next.h * tier.shadeScale));
      const small = (): Small => {
        const tex = createTexture(gl, { w: sw, h: sh, internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE, linear: true });
        return { tex, fb: createTarget(gl, [tex]), w: sw, h: sh };
      };
      shade = small(); shadeMoon = small();
    }
    map = next;
    surfaceKey = cloudKey = shadeKey = moonKey = "";
  }

  const setMap = (u: Uniforms) => {
    const m = map!;
    u.v4("uMap", m.psi0, 1 / (m.psi1 - m.psi0), m.rho0, 1 / (m.rho1 - m.rho0)).v4("uRef", m.href, m.ah, Math.cos(m.ah), Math.sin(m.ah));
  };
  const seedVec = (): Vec3 => { const s = params.seed; return [(s * 12.9898) % 97, (s * 78.233) % 89, (s * 37.719) % 83]; };
  // A point of the globe, by its bearing and arc from the point under the camera.
  const onGlobe = (bearing: number, arc: number): Vec3 => {
    const a = arc * RAD, b = bearing * RAD;
    return [Math.sin(a) * Math.sin(b), Math.cos(a), -Math.sin(a) * Math.cos(b)];
  };
  // Things placed by where they should sit in the wide frame keep their place on the globe on every screen.
  const placed = (x: number, y: number) => groundAt(pose(params.altitude, params.pitch, params.roll, 0, params.focal), WIDE, x, y);
  const storm = (): [number, number, number, number] => {
    const c = params.stormStrength > 0 ? placed(params.stormX, params.stormY) : null;
    return c ? [c[0], c[1], c[2], params.stormRadius / R_PLANET] : [0, 1, 0, 0];
  };

  function bakeSurface() {
    const u = new Uniforms(gl, passes.surface);
    setMap(u);
    u.v2("uSize", map!.w, map!.h).v3("uSeed", seedVec());
    u.v4("uLand", params.landScale, params.seaLevel, params.relief, params.coast);
    const cold = onGlobe(params.coldBearing, params.coldArc);
    u.v4("uCold", cold[0], cold[1], cold[2], Math.cos(params.coldCap * RAD));
    const isle = placed(params.isleX, params.isleY);
    if (isle) u.v4("uIsle", isle[0], isle[1], isle[2], params.isleRadius / R_PLANET);
    else u.v4("uIsle", 0, 1, 0, 0);
    u.f("uIsleRise", params.isleRise);
    gl.bindFramebuffer(gl.FRAMEBUFFER, surf!.fb);
    gl.viewport(0, 0, map!.w, map!.h);
    draw(gl);
    mips(surf!);
  }

  function bakeClouds() {
    const u = new Uniforms(gl, passes.clouds);
    setMap(u);
    u.v2("uSize", map!.w, map!.h).v3("uSeed", seedVec());
    u.v4("uWeather", params.weatherScale, params.cover, params.towers, params.cirrus);
    u.v4("uDecks", params.cellSize, params.cumulus, params.fronts, params.quilt);
    const s = storm();
    u.v4("uStorm", s[0], s[1], s[2], s[3]).v4("uStormLook", params.stormTight, 0, params.stormArms, params.stormStrength);
    gl.bindFramebuffer(gl.FRAMEBUFFER, cloud!.fb);
    gl.viewport(0, 0, map!.w, map!.h);
    draw(gl);
    mips(cloud!);
  }

  // How the weather has moved since it was baked: the layer's slow turn about the camera's nadir, and the storm's
  // about its own centre. The storm's centre is given as it stands now, carried round with the layer.
  const setDrift = (u: Uniforms, clock: number) => {
    const s = storm(), turnBy = (params.drift * RAD * clock) / 60, c = Math.cos(turnBy), sn = Math.sin(turnBy);
    const reach = Math.cos(Math.min(2.7 * s[3], Math.PI));
    u.v4("uSpin", c * s[0] + sn * s[2], s[1], -sn * s[0] + c * s[2], s[3] ? 1 / s[3] : 1);
    u.v4("uDrift", Math.tan(turnBy / 2), s[3] ? (params.stormSpin * RAD * clock) / 60 : 0, reach, 0).v2("uDriftCS", c, sn);
  };

  // What the air is made of, for the passes that look through it.
  const setAir = (u: Uniforms) => {
    u.v3("uBetaR", AIR.rayleigh.map((v) => v * params.rayleigh)).v3("uBetaO", AIR.ozone.map((v) => v * params.ozone));
    u.v2("uBetaM", AIR.mieScatter * params.mie, AIR.mieExtinct * params.mie).v2("uScaleH", AIR.rayleighHeight, AIR.mieHeight).f("uMieG", params.mieG);
    u.tex("uDepth", depthTex);
  };

  function sunVector(height: number): Vec3 {
    const e = height * RAD - limbDrop(tall() ? params.tallAltitude : params.altitude), b = params.sunBearing * RAD;
    return [Math.cos(e) * Math.sin(b), Math.sin(e), -Math.cos(e) * Math.cos(b)];
  }

  // What the air lets through to a point at `height` km when the sun's zenith cosine there is mu.
  function extinctionAt(height: number, mu: number): Vec3 {
    const c = depthAt(table, height, mu);
    return [0, 1, 2].map((i) => Math.exp(-(AIR.rayleigh[i] * params.rayleigh * c[0] + AIR.mieExtinct * params.mie * c[1] + AIR.ozone[i] * params.ozone * c[2]))) as Vec3;
  }

  // The sun as the camera sees it: what the air lets through, averaged over the disc, less what the planet hides.
  function sunSeen(cam: Vec3, sun: Vec3): Vec3 {
    const b = -dot(cam, sun);
    if (b <= 0) return [1, 1, 1];
    const l = add(cam, scale(sun, b)), nearest = Math.hypot(l[0], l[1], l[2]);
    const sum: Vec3 = [0, 0, 0];
    let weight = 0;
    for (const f of [-0.85, -0.5, 0, 0.5, 0.85]) {
      const w = Math.sqrt(1 - f * f);
      weight += w;
      const z = nearest + f * 0.004675 * b - R_PLANET;
      if (z < 0) continue;
      // Through the air twice over: in to the nearest point, and out again.
      const c = z > 100 ? [0, 0, 0] : depthAt(table, z, 0).map((v) => v * 2);
      for (let i = 0; i < 3; i++) sum[i] += w * Math.exp(-(AIR.rayleigh[i] * params.rayleigh * c[0] + AIR.mieExtinct * params.mie * c[1] + AIR.ozone[i] * params.ozone * c[2]));
    }
    return scale(sum, 1 / weight);
  }

  // ---- How fast is this going? ----------------------------------------------------------------------------------
  // governor.ts decides how many pixels to draw from the gaps between steady frames. (The GPU timer is read here
  // for the lab's read-out only: a lightly loaded GPU slows its own clock, so it says little about speed.)
  let gov = governor();
  function judge(now: number, steady: boolean) {
    if (timer && options.debug) {
      while (pending.length && gl.getQueryParameter(pending[0], gl.QUERY_RESULT_AVAILABLE)) {
        const q = pending.shift()!;
        if (!gl.getParameter(timer.GPU_DISJOINT_EXT)) gpuMs = gpuMs ? gpuMs * 0.9 + (gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6) * 0.1 : gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6;
        gl.deleteQuery(q);
      }
    }
    const act = govern(gov, now, steady, options.fixed);
    if (act === "resize") { fit = gov.fit; resize(); }
    if (act === "give up") {
      dead = true;
      // Told after this frame has finished, since the page's answer is to dispose of the context.
      setTimeout(() => options.onError?.(new Error("orbit: too slow to draw; showing the still")), 0);
    }
  }

  function render(shot: Shot): boolean {
    if (dead || lost || gl.isContextLost()) return false;
    try {
      for (const p of Object.values(passes)) if (!passReady(gl, p, parallel)) return false;
    } catch (error) {
      dead = true;
      options.onError?.(error);
      return false;
    }
    const t0 = performance.now();
    // A canvas with no size (hidden by the page's styles) has nothing to frame: laying it out would divide by zero.
    if (!canvas.clientWidth || !canvas.clientHeight) return false;
    if (canvas.clientWidth !== cssW || canvas.clientHeight !== cssH || !map) layout();
    judge(t0, !!shot.steady);

    const sKey = JSON.stringify(SURFACE_KEYS.map((key) => params[key])) + JSON.stringify(VIEW_KEYS.map((key) => params[key]));
    const cKey = JSON.stringify(CLOUD_KEYS.map((key) => params[key]));
    let baked = false;
    if (sKey !== surfaceKey) { bakeSurface(); surfaceKey = sKey; baked = true; }
    if (cKey !== cloudKey) { bakeClouds(); cloudKey = cKey; baked = true; shadeKey = moonKey = ""; }

    if (timer && options.debug && !baked && pending.length < 4) { query = gl.createQuery(); if (query) gl.beginQuery(timer.TIME_ELAPSED_EXT, query); }

    // Cloud shadows: under the sun whenever it or the clouds have moved, under the moon when the clouds have. The
    // clouds move slowly, so the moon's are refreshed on a slower beat.
    const sun = sunVector(shot.sunHeight);
    const moon = norm([Math.cos(params.moonHeight * RAD) * Math.sin(params.moonBearing * RAD), Math.sin(params.moonHeight * RAD), -Math.cos(params.moonHeight * RAD) * Math.cos(params.moonBearing * RAD)]);
    const shadows = (target: Small, from: Vec3) => {
      const u = new Uniforms(gl, passes.shade);
      setMap(u);
      setDrift(u, shot.clock);
      u.v2("uSize", target.w, target.h).v3("uSun", from).v2("uSigma", params.shadowSigma, 1.2);
      u.tex("uCloudA", cloud!.a).tex("uCloudB", cloud!.b);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
      gl.viewport(0, 0, target.w, target.h);
      draw(gl);
    };
    const look = `${params.shadowSigma},${params.cirrus},${params.moonBearing},${params.moonHeight}`;
    const hKey = sun.map((v) => v.toFixed(5)).join() + look + (shot.clock * 2).toFixed(0);
    if (hKey !== shadeKey) { shadows(shade!, sun); shadeKey = hKey; }
    const mKey = look + (shot.clock / 4).toFixed(0);
    if (mKey !== moonKey) { shadows(shadeMoon!, moon); moonKey = mKey; }

    // This frame's camera: the composed pose, moved by the shot.
    const alt = tall() ? params.tallAltitude : params.altitude;
    const p = pose(alt, (tall() ? params.tallPitch : params.pitch) + shot.lift + shot.tilt, tall() ? params.tallRoll : params.roll, shot.pan + (tall() ? params.tallYaw : 0), (tall() ? params.tallFocal : params.focal) * shot.zoom);
    p.pos = add(p.pos, add(scale(p.right, shot.drift[0]), scale(p.up, shot.drift[1])));

    {
      const basis = rayBasis(p, frame, view, cssH, scene!.w / cssW);
      const u = new Uniforms(gl, passes.scene);
      setMap(u);
      setDrift(u, shot.clock);
      u.v3("uCam", p.pos).v3("uRayA", basis.A).v3("uRayB", basis.B).v3("uRayC", basis.C).v3("uSun", sun).v3("uMoon", moon).f("uTime", shot.time);
      if (options.debug) u.f("uDebug", shot.debug || 0);
      // Map texels per screen pixel, as a mip level: zero at the composed view at full quality.
      u.f("uLod", Math.max(0, Math.log2(base.focal / (tier.mapScale * p.focal * fit))));
      setAir(u);
      u.f("uMulti", params.multi);
      u.v3("uSeaDeep", [0.004, 0.014, 0.036]).v3("uSeaShoal", [0.012, 0.075, 0.085]).v3("uSeaInk", [0.0, 0.07, 0.045]);
      u.v3("uRock", [0.028, 0.03, 0.034]).v3("uRockB", [0.06, 0.058, 0.052]).v3("uSeaGlow", scale([0.03, 1, 0.3], params.seaGlow));
      u.v4("uSkyFill", params.skyFill, 0.3 * params.twilight, 0.5 * params.twilight, params.twilight);
      u.v3("uMoonFill", scale([0.78, 0.88, 1], params.moonLight)).f("uMoonAir", params.moonAir);
      u.f("uAirglow", params.airglow * shot.night);
      u.v4("uCloudLook", params.cloudSigma, params.cloudRelief, params.cloudHollows, params.cloudRim).v2("uCirrusLook", 0.7, 0.55);
      u.tex("uSurfA", surf!.a).tex("uSurfB", surf!.b).tex("uCloudA", cloud!.a).tex("uCloudB", cloud!.b);
      u.tex("uShade", shade!.tex).tex("uShadeMoon", shadeMoon!.tex);
      gl.bindFramebuffer(gl.FRAMEBUFFER, scene!.fb);
      gl.viewport(0, 0, scene!.w, scene!.h);
      draw(gl);
      gl.bindTexture(gl.TEXTURE_2D, scene!.tex);
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    // The aurora: its oval runs round a magnetic pole placed from the point under the camera.
    const aurora = params.aurora * shot.night;
    gl.bindFramebuffer(gl.FRAMEBUFFER, glow!.fb);
    gl.viewport(0, 0, glow!.w, glow!.h);
    if (aurora > 0) {
      const basis = rayBasis(p, frame, view, cssH, glow!.w / cssW);
      const pole = onGlobe(params.auroraBearing, params.auroraArc);
      const e1 = norm(add([0, 1, 0], scale(pole, -pole[1])));
      const u = new Uniforms(gl, passes.aurora);
      setAir(u);
      u.v3("uCam", p.pos).v3("uRayA", basis.A).v3("uRayB", basis.B).v3("uRayC", basis.C).f("uTime", shot.time);
      u.v4("uAurora", pole[0], pole[1], pole[2], params.auroraOval * RAD).v3("uAuroraE1", e1).v3("uAuroraE2", cross(pole, e1));
      u.v4("uAuroraLook", aurora, params.auroraWidth / R_PLANET, params.auroraRays, 0);
      // The bright curtain, a fainter one poleward of it, and a faint one toward the equator.
      u.v2("uAuroraSheets[0]", 0, 1).v2("uAuroraSheets[1]", 4.5, 0.55).v2("uAuroraSheets[2]", -8, 0.3);
      u.v4("uSurge", params.surgeBearing * RAD, Math.max(params.surgeWidth, 0.1) * RAD, params.surgeRest, 0);
      draw(gl);
    } else { gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
    {
      const basis = rayBasis(p, frame, view, cssH, canvas.width / cssW);
      const seen = sunSeen(p.pos, sun);
      const u = new Uniforms(gl, passes.post);
      u.tex("uScene", scene!.tex).tex("uGlow", glow!.tex).v2("uRes", canvas.width, canvas.height);
      u.v3("uRayA", basis.A).v3("uRayB", basis.B).v3("uRayC", basis.C).v3("uSun", sun);
      u.m3("uSky", [0.36, 0.48, -0.8, -0.8, 0.6, 0, 0.48, 0.64, 0.6]);
      // White balance: part of the way toward making the risen sun's light on the clouds neutral.
      const beam = extinctionAt(2, Math.sin(Math.max(params.sunHeight, 4) * 0.55 * RAD));
      const lightAt = beam.map((v) => v + params.skyFill * (1 - v));
      const mean = (lightAt[0] + lightAt[1] + lightAt[2]) / 3;
      u.v3("uWhite", lightAt.map((v) => Math.pow(mean / v, 1 - params.warmth)));
      u.v3("uGlare", scale(seen, params.glare * 60)).v4("uStars", params.stars * shot.stars, params.starDensity, params.twinkle, shot.time);
      u.v4("uBloom", params.bloom, params.bloomSpread, 0, 0).v4("uSplit", 1, 1, 1, params.split);
      // The dawn on the limb grows as the sun nears it from below, and is full once the disc is clear.
      const up = norm(p.pos), rise = smoothstep(-3, 0.8, shot.sunHeight);
      const drop = Math.acos(R_PLANET / Math.hypot(p.pos[0], p.pos[1], p.pos[2]));
      u.v3("uUp", up).v4("uDawn", params.dawn * rise, params.dawnSpread, params.aureole * smoothstep(-0.3, 0.6, shot.sunHeight), drop).v3("uDawnTint", [1, 0.9, 0.8]);
      u.v4("uGrade", params.exposure * shot.exposure, params.contrast, params.saturation, params.grain).v3("uInk", INK).f("uFade", 1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      draw(gl);
    }
    if (options.debug && (shot.debug || 0) >= 10) {
      // 10..13: cloud map A's channels; 14..17: cloud map B's; 18..21: surface A's; 22..25: the shadows'.
      const index = Math.floor(shot.debug!) - 10, channel = index % 4;
      const tex = [cloud!.a, cloud!.b, surf!.a, shade!.tex][Math.floor(index / 4)] || cloud!.a;
      const u = new Uniforms(gl, passes.peek);
      u.tex("uTex", tex).v2("uRes", canvas.width, canvas.height).v4("uPick", +(channel === 0), +(channel === 1), +(channel === 2), +(channel === 3));
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      draw(gl);
    }
    if (query) { gl.endQuery(timer!.TIME_ELAPSED_EXT); pending.push(query); query = null; }
    const ms = performance.now() - t0;
    if (baked) bakeMs = ms; else cpuMs = cpuMs * 0.9 + ms * 0.1;
    return true;
  }

  return {
    render,
    set(next) {
      const before = params;
      params = { ...params, ...next };
      if (VIEW_KEYS.some((key) => before[key] !== params[key])) map = null;
    },
    setTier(name) {
      if (!TIERS[name] || TIERS[name] === tier) return;
      tier = TIERS[name];
      deletePass(gl, passes.scene);
      passes.scene = createPass(gl, "scene", sceneShader(tier.cloudSteps, tier.airSteps, options.debug, options.world?.surface));
      fit = 1; gov = governor();
      map = null;
    },
    stats: () => ({ ready: Object.values(passes).every((p) => p.linked), lost, width: canvas.width, height: canvas.height, map: map ? [map.w, map.h] : [0, 0], scale: fit, cpuMs, gpuMs, bakeMs, tier: tier.name }),
    // Browsers do not block on finish(); reading a pixel back is what actually waits for the GPU.
    finish() {
      if (dead || lost) return;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    },
    // Give everything back at once. Losing the context frees its textures and programs without waiting for the
    // garbage collector to notice the canvas has gone.
    dispose() {
      if (disposed) return;
      disposed = dead = true;
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
