// The whole picture is one fragment shader: a ray from the camera through each pixel, the air integrated along it,
// and where the ray meets cloud, sea or land, the light that place sends back. Nothing here is noise: the clouds,
// the land and the city lights are read from maps of the real planet, and the air's colour comes from the two tables
// in atmosphere.ts. Distances are kilometres from the planet's centre; +z is the north pole.
import { AIR, MS_SIZE, T_SIZE } from "./atmosphere";

const f = (n: number) => (Number.isInteger(n) ? `${n}.0` : `${n}`);
const v3 = (a: readonly number[]) => `vec3(${a.map(f).join(", ")})`;

export const VERT = `#version 300 es
in vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

export const FRAG = `#version 300 es
precision highp float;
precision highp sampler2D;
out vec4 o;

uniform vec2 uRes;
uniform vec3 uCam, uRight, uUp, uFwd, uSun, uMoon;
uniform float uTan, uExposure, uTime, uP3, uSteps;
uniform sampler2D uT, uMS, uCloud, uColor, uNight, uCloudHi, uTop;
uniform vec4 uRegion;    // the sharper cloud map's place on the globe: west edge, north edge, width, height, in map units; no width means none
uniform vec4 uHas;      // cloud, colour, night lights, cloud-top heights
uniform vec4 uCloudLook; // optical depth scale, relief, height km, weather clock (seconds, as a fraction of the equator per metre a second)
uniform vec4 uGrade;    // contrast power, saturation, P3 stretch, sun glare
uniform vec4 uNightLook; // city lights, airglow, moonlight, stars
uniform vec3 uWhite;    // white balance: what the camera calls neutral

const float PI = 3.14159265359;
const float RG = ${f(AIR.ground)}, RT = ${f(AIR.top)};
const float HH = ${f(Math.sqrt(AIR.top * AIR.top - AIR.ground * AIR.ground))};
const vec3 BR = ${v3(AIR.rayleigh)};
const float BMS = ${f(AIR.mieScatter)}, BMA = ${f(AIR.mieAbsorb)};
const vec3 BO = ${v3(AIR.ozone)};
const float HR = ${f(AIR.rayleighHeight)}, HM = ${f(AIR.mieHeight)}, G = ${f(AIR.mieG)};
const vec2 TS = vec2(${f(T_SIZE[0])}, ${f(T_SIZE[1])}), MSS = vec2(${f(MS_SIZE[0])}, ${f(MS_SIZE[1])});
// The sun's light above the air, in the scene's own unit; exposure brings it to the screen.
const vec3 SUN = vec3(1.0, 0.985, 0.955) * 20.0;
const float SUN_R = 0.004675;

vec2 sphere(vec3 ro, vec3 rd, float r) {
  float b = dot(ro, rd), c = dot(ro, ro) - r * r, h = b * b - c;
  if (h < 0.0) return vec2(-1.0);
  h = sqrt(h);
  return vec2(-b - h, -b + h);
}

// Sunlight left after the path from radius r, toward a direction with zenith cosine mu, to the top of the air.
vec3 transmit(float r, float mu) {
  float rho = sqrt(max(r * r - RG * RG, 0.0));
  float d = max(-r * mu + sqrt(max(r * r * (mu * mu - 1.0) + RT * RT, 0.0)), 0.0);
  float dMin = RT - r, dMax = rho + HH;
  vec2 x = vec2((d - dMin) / max(dMax - dMin, 1e-4), rho / HH);
  return texture(uT, (clamp(x, 0.0, 1.0) * (TS - 1.0) + 0.5) / TS).rgb;
}
// How much of the sun's disc clears the planet's edge from here: 0 in its shadow, 1 in full sun. The air bends
// light round the limb by about a degree at the ground, which is why twilight reaches past the geometric shadow.
float sunSeen(float r, float mu) {
  float rho = sqrt(max(r * r - RG * RG, 0.0)), horizon = -rho / r;
  float bend = 0.010 * exp(-(r - RG) / 9.0);
  float a = SUN_R * (RG / r) + 0.0012;
  return smoothstep(-a, a, mu - horizon + bend);
}
vec3 sunAt(float r, float mu) { return transmit(r, mu) * sunSeen(r, mu); }
vec3 bounced(float r, float mu) {
  vec2 x = vec2(mu * 0.5 + 0.5, (r - RG) / (RT - RG));
  // The table still holds a little light where the sun is far below the horizon, which a night exposure five
  // hundred times a day's would turn into a brown glow over the land. Twilight ends with the sun 18 degrees down.
  return texture(uMS, (clamp(x, 0.0, 1.0) * (MSS - 1.0) + 0.5) / MSS).rgb * smoothstep(-0.31, -0.1, mu);
}

// Longitude and latitude to a map position. The derivatives are taken from whichever of two unwrappings has no
// seam under this pixel, so the date line never shows as a line of the wrong mip level.
vec2 mapUV(vec3 n, float drift) {
  return vec2(atan(n.y, n.x) / (2.0 * PI) + 0.5 + drift, 0.5 - asin(clamp(n.z, -1.0, 1.0)) / PI);
}
float gBlur = 1.0;
vec4 readMap(sampler2D map, vec3 n, float drift, vec3 nx, vec3 ny) {
  vec2 uv = mapUV(n, drift);
  vec2 dx = mapUV(nx, drift) - uv, dy = mapUV(ny, drift) - uv;
  dx.x -= floor(dx.x + 0.5); dy.x -= floor(dy.x + 0.5);
  return textureGrad(map, uv, dx * gBlur, dy * gBlur);
}

// The mean wind at cloud level by latitude, metres a second eastward: trade easterlies near the equator and the
// westerlies of the middle latitudes (a two-bump fit to the zonal-mean climatology). The cloud map is carried along
// it, so the tropics drift west while the storm tracks run east, as they do in a day of satellite pictures.
float wind(float lat) {
  float d = degrees(lat);
  return -7.0 * exp(-pow(d / 14.0, 2.0)) + 14.0 * exp(-pow((abs(d) - 45.0) / 16.0, 2.0));
}
vec2 cloudUV(vec3 n) {
  float lat = asin(clamp(n.z, -1.0, 1.0));
  return vec2(atan(n.y, n.x) / (2.0 * PI) + 0.5 - uCloudLook.w * wind(lat) / max(cos(lat), 0.25), 0.5 - lat / PI);
}
// 1 well inside the regional maps' box, falling to 0 over the outer 4% of it, so the region has no visible edge.
float inRegion(vec2 r) {
  vec2 e = smoothstep(vec2(0.0), vec2(0.04), r) * (1.0 - smoothstep(vec2(0.96), vec2(1.0), r));
  return e.x * e.y;
}
// Cloud at a place: the global map, and inside the region a direction flies over, a sharper one laid over it.
float cloudAt(vec3 n, vec3 nx, vec3 ny) {
  vec2 uv = cloudUV(n), dx = cloudUV(nx) - uv, dy = cloudUV(ny) - uv;
  dx.x -= floor(dx.x + 0.5); dy.x -= floor(dy.x + 0.5);
  dx *= gBlur; dy *= gBlur;
  float c = textureGrad(uCloud, uv, dx, dy).r;
  if (uRegion.z > 0.0) {
    vec2 r = vec2(fract(uv.x - uRegion.x), uv.y - uRegion.y) / uRegion.zw;
    float w = inRegion(r);
    if (w > 0.0) c = mix(c, textureGrad(uCloudHi, r, dx / uRegion.zw, dy / uRegion.zw).r, w);
  }
  return c;
}
// How high the cloud tops stand at a place, in kilometres: NASA's retrieved cloud-top height where the region has a
// map of it, and one flat level elsewhere. The map is read at a blur set once a pixel (gLod), since it is sampled
// many times along a ray.
float gLod = 0.0;
float topAt(vec3 n) {
  if (uHas.w < 0.5 || uRegion.z <= 0.0) return uCloudLook.z;
  vec2 uv = cloudUV(n), r = vec2(fract(uv.x - uRegion.x), uv.y - uRegion.y) / uRegion.zw;
  float w = inRegion(r);
  return w > 0.0 ? mix(uCloudLook.z, textureLod(uTop, r, gLod).r * 12.75, w) : uCloudLook.z;
}

// The glitter a light makes on the sea: its image mirrored by waves into a wide soft patch (Cox and Munk's spread of
// wave slopes as one GGX lobe). The same for the sun by day and the moon by night.
float glitter(vec3 n, vec3 rd, vec3 l, float nl) {
  vec3 h = normalize(l - rd);
  float nh = max(dot(n, h), 0.0), nv = max(dot(n, -rd), 1e-3), a2 = 0.02;
  float spread = a2 / (PI * pow(nh * nh * (a2 - 1.0) + 1.0, 2.0));
  float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(h, -rd), 0.0), 5.0);
  return spread * fresnel * nl / (4.0 * nv * nl + 0.05) * 0.25;
}
// Moonlight as a camera at night renders it: a little cooler than the sun's.
const vec3 MOON = vec3(0.84, 0.93, 1.06);

float hash(vec3 p) { p = fract(p * vec3(443.897, 441.423, 437.195)); p += dot(p, p.yzx + 19.19); return fract((p.x + p.y) * p.z); }

// Stars: one candidate per cell of a grid on the sky, most of them too faint to draw, a few bright. Each keeps a
// colour between a hot blue-white and a cool orange.
vec3 stars(vec3 rd) {
  vec3 total = vec3(0.0);
  for (int layer = 0; layer < 2; layer++) {
    float scale = layer == 0 ? 260.0 : 110.0;
    vec3 q = rd * scale, cell = floor(q), local = fract(q) - 0.5;
    float h = hash(cell + float(layer) * 17.0);
    vec3 offset = vec3(hash(cell + 1.3), hash(cell + 2.7), hash(cell + 4.1)) - 0.5;
    float d = length(local - offset * 0.7);
    float magnitude = pow(h, layer == 0 ? 26.0 : 60.0) * (layer == 0 ? 1.0 : 6.0);
    float core = exp(-d * d * (layer == 0 ? 900.0 : 420.0));
    float warmth = hash(cell + 9.1);
    total += mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.86, 0.7), warmth) * magnitude * core;
  }
  return total;
}

// Blender's AgX view transform (Troy Sobotka), in the short form by Benjamin Wrensch. It rolls bright colours off
// toward white the way film does instead of clipping each channel, which is most of why a sunrise stops looking
// like a video game.
vec3 agxCurve(vec3 x) {
  vec3 x2 = x * x, x4 = x2 * x2;
  return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
}
vec3 agx(vec3 c) {
  const mat3 inMat = mat3(0.842479062253094, 0.0423282422610123, 0.0423756549057051, 0.0784335999999992, 0.878468636469772, 0.0784336, 0.0792237451477643, 0.0791661274605434, 0.879142973793104);
  const mat3 outMat = mat3(1.19687900512017, -0.0528968517574562, -0.0529716355144438, -0.0980208811401368, 1.15190312990417, -0.0980434501171241, -0.0990297440797205, -0.0989611768448433, 1.15107367264116);
  c = inMat * max(c, 1e-10);
  c = clamp((log2(c) + 12.47393) / 16.5, 0.0, 1.0);
  c = agxCurve(c);
  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = pow(max(c, 0.0), vec3(uGrade.x));
  c = luma + uGrade.y * (c - luma);
  return clamp(outMat * c, 0.0, 1.0);
}

void main() {
  vec2 ndc = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;
  vec3 rd = normalize(uFwd + uTan * (ndc.x * uRight + ndc.y * uUp));
  vec3 ro = uCam;
  float pixel = 2.0 * uTan / uRes.y;
  vec3 rdx = normalize(rd + uRight * pixel), rdy = normalize(rd + uUp * pixel);

  vec2 air = sphere(ro, rd, RT), solid = sphere(ro, rd, RG);
  bool hitsGround = solid.x > 0.0;
  vec3 light = vec3(0.0), through = vec3(1.0);
  float cosSun = dot(rd, uSun);

  if (air.y > 0.0) {
    float t0 = max(air.x, 0.0), t1 = hitsGround ? solid.x : air.y;
    float steps = uSteps, dt = (t1 - t0) / steps;
    float phaseR = 3.0 / (16.0 * PI) * (1.0 + cosSun * cosSun);
    float g2 = G * G;
    float phaseM = 3.0 / (8.0 * PI) * ((1.0 - g2) * (1.0 + cosSun * cosSun)) / ((2.0 + g2) * pow(1.0 + g2 - 2.0 * G * cosSun, 1.5));
    float cosMoon = dot(rd, uMoon);
    float moonR = 3.0 / (16.0 * PI) * (1.0 + cosMoon * cosMoon);
    for (float i = 0.0; i < 64.0; i++) {
      if (i >= steps) break;
      vec3 p = ro + rd * (t0 + (i + 0.5) * dt);
      float r = length(p), h = max(r - RG, 0.0);
      float dR = exp(-h / HR), dM = exp(-h / HM), dO = max(0.0, 1.0 - abs(h - ${f(AIR.ozoneCentre)}) / ${f(AIR.ozoneWidth)});
      vec3 scatterR = BR * dR;
      float scatterM = BMS * dM;
      vec3 extinct = scatterR + (BMS + BMA) * dM + BO * dO;
      float mu = dot(p, uSun) / r;
      vec3 direct = sunAt(r, mu);
      vec3 inScatter = (scatterR * phaseR + scatterM * phaseM) * direct + (scatterR + scatterM) * bounced(r, mu);
      inScatter *= SUN;
      // Moonlight is sunlight four hundred thousand times weaker; it is what the night side is seen by.
      float muMoon = dot(p, uMoon) / r;
      inScatter += scatterR * moonR * sunAt(r, muMoon) * SUN * uNightLook.z;
      vec3 step = exp(-extinct * dt);
      light += through * (inScatter * (1.0 - step) / max(extinct, vec3(1e-7)));
      through *= step;
    }
  }

  // Airglow: a shell of excited oxygen about 95 km up (a yellow-green line) with sodium just under it (amber).
  // The shell is a few kilometres thick, far thinner than a step of the march above, so its light along the ray is
  // worked out in closed form: the length of the ray's path through a Gaussian shell, once on the way in and, if the
  // ray misses the ground, once more on the way out. Seen edge-on at the limb that path is long, which is why
  // airglow from orbit is a fine bright line and almost nothing over the face of the planet.
  if (dot(ro, rd) < 0.0) {
    float miss = length(cross(ro, rd));
    vec2 shell = vec2(RG + 95.0, RG + 89.0), wide = vec2(2.8, 2.4);
    vec2 slant = sqrt(max(1.0 - pow(min(vec2(miss), shell) / shell, vec2(2.0)), 0.0) + 0.5 * wide / shell);
    vec2 path = sqrt(PI) * wide * (hitsGround ? 1.0 : 2.0) * exp(-pow(max(vec2(miss) - shell, 0.0) / wide, vec2(2.0))) / slant;
    light += (vec3(0.46, 1.0, 0.40) * path.x + vec3(1.0, 0.58, 0.16) * 0.2 * path.y) * uNightLook.y;
  }

  vec3 behind = vec3(0.0);
  if (hitsGround) {
    vec3 p = ro + rd * solid.x, n = p / RG;
    vec2 sx = sphere(ro, rdx, RG), sy = sphere(ro, rdy, RG);
    vec3 nx = sx.x > 0.0 ? normalize(ro + rdx * sx.x) : n, ny = sy.x > 0.0 ? normalize(ro + rdy * sy.x) : n;
    float mu = dot(n, uSun), muMoon = dot(n, uMoon);
    vec3 sun = sunAt(RG + 0.01, mu) * SUN, moon = sunAt(RG + 0.01, muMoon) * SUN * uNightLook.z;
    vec3 skySun = bounced(RG + 0.5, mu) * SUN * 0.35, skyMoon = MOON * bounced(RG + 0.5, muMoon) * SUN * uNightLook.z * 0.35, sky = skySun + skyMoon;

    // The clouds sit on a shell above the ground; the view ray meets them before it meets the sea.
    float height = uCloudLook.z;
    vec3 pc = ro + rd * sphere(ro, rd, RG + height).x;
    bool lifted = uHas.w > 0.5 && uRegion.z > 0.0;
    if (lifted) {
      // Where the heights are known the clouds are a surface with real relief, and the view ray is walked down
      // through the 13 km they can occupy until it first passes under that surface. Seen at a slant, a high front
      // then stands in front of the low deck behind it, as it does through a spacecraft window.
      vec2 fine = cloudUV(n), fx = cloudUV(nx) - fine, fy = cloudUV(ny) - fine;
      fx.x -= floor(fx.x + 0.5); fy.x -= floor(fy.x + 0.5);
      vec2 size = vec2(textureSize(uTop, 0)) / uRegion.zw;
      gLod = max(0.5 * log2(max(dot(fx * size, fx * size), dot(fy * size, fy * size))), 0.0) + 0.5;
      float tA = max(sphere(ro, rd, RG + 13.0).x, 0.0), tB = solid.x, tHit = tB;
      float before = tA, gap = 13.0 - topAt(normalize(ro + rd * tA));
      for (int i = 1; i <= 16; i++) {
        float t = mix(tA, tB, float(i) / 16.0);
        vec3 q = ro + rd * t;
        float d = length(q) - RG - topAt(normalize(q));
        if (d <= 0.0) { tHit = mix(before, t, gap / max(gap - d, 1e-4)); break; }
        before = t; gap = d;
      }
      pc = ro + rd * tHit;
      height = max(length(pc) - RG, 0.0);
    }
    float RC = RG + height;
    vec3 nc = normalize(pc);
    float cloud = 0.0, towardSun = 0.0, shadow = 0.0, massHere = 0.0, massSun = 0.0, shaded = 0.0, slope = 1.0;
    if (uHas.x > 0.5) {
      vec3 east = normalize(cross(vec3(0.0, 0.0, 1.0), nc)), north = cross(nc, east);
      vec3 ncx = normalize(nc + (nx - n)), ncy = normalize(nc + (ny - n));
      // Read a touch soft: a map magnified past its own grain should blur, not show its pixels.
      gBlur = uRegion.z > 0.0 ? 1.15 : 1.7; cloud = cloudAt(nc, ncx, ncy); gBlur = 1.0;
      // Relief: the same map read a little way toward the sun. Where the cloud there is thicker, this spot is in
      // its lee; where it is thinner, this spot faces the light. At a low sun the reach grows, as shadows do.
      vec3 sunFlat = uSun - nc * dot(uSun, nc);
      float reach = clamp(0.0006 / max(dot(uSun, nc), 0.08), 0.0006, 0.006);
      vec3 ns = normalize(nc + sunFlat * reach);
      towardSun = cloudAt(ns, normalize(ns + (nx - n)), normalize(ns + (ny - n)));
      // The same comparison on a blurred copy models whole cloud masses, not only their grain.
      gBlur = 6.0;
      vec3 nb = normalize(nc + sunFlat * reach * 5.0);
      massHere = cloudAt(nc, ncx, ncy);
      massSun = cloudAt(nb, normalize(nb + (nx - n)), normalize(nb + (ny - n)));
      gBlur = 1.0;
      // The shadow the clouds throw on the ground: the map read where the ray to the sun crosses the cloud shell.
      // The cloud that shades a spot stands at its own height, so a high cloud's shadow falls far from it and a
      // low deck's lies almost under it.
      vec3 above = normalize(p + uSun * (uCloudLook.z / max(mu, 0.06)));
      if (lifted) above = normalize(p + uSun * (topAt(above) / max(mu, 0.06)));
      shadow = cloudAt(above, normalize(above + (nx - n)), normalize(above + (ny - n)));
      if (lifted) {
        // Shadows cloud throws on cloud. From this spot the sun's ray is followed over the neighbouring tops until
        // it has climbed clear of the highest they can be; where a top stands above the ray, this spot is in its
        // shade. The planet's curve lifts the ray too, which is what lets a low sun still reach over a far deck.
        vec3 toSun = normalize(sunFlat + nc * 1e-6);
        float muS = dot(uSun, nc), rise = muS / max(sqrt(1.0 - muS * muS), 1e-3), bend = 0.5 / RG;
        float reachKm = min((-rise + sqrt(rise * rise + 4.0 * bend * max(13.0 - height, 0.0))) / (2.0 * bend), 500.0);
        float lit = 1.0;
        for (int k = 1; k <= 8; k++) {
          float f = float(k) / 8.0, d = reachKm * f * f;
          vec3 q = normalize(nc + toSun * (d / RG));
          float over = topAt(q) - (height + d * rise + d * d * bend);
          if (over > 0.0) {
            gBlur = 2.0 + 5.0 * f;
            float c = cloudAt(q, normalize(q + (ncx - nc)), normalize(q + (ncy - nc)));
            float thick = 0.15 * pow(c, 3.0) * uCloudLook.x;
            lit = min(lit, 1.0 - thick / (2.0 + thick) * smoothstep(0.0, 0.3 + 0.015 * d, over));
          }
        }
        gBlur = 1.0;
        shaded = 1.0 - lit;
        // A top that leans toward the sun is brighter than one that leans away: the surface's own slope, from the
        // heights a few kilometres to the east and north.
        float span = 6.0 / RG;
        vec2 lean = (vec2(topAt(normalize(nc + east * span)), topAt(normalize(nc + north * span))) - topAt(nc)) / 6.0;
        vec3 face = normalize(nc - east * lean.x - north * lean.y);
        slope = clamp(1.0 + (dot(face, uSun) - muS) / max(muS + 0.3, 0.3), 0.55, 1.45);
      }
    }
    float viewCos = max(dot(nc, -rd), 0.05);
    // Seen at a slant a cloud is a longer path, so decks thicken toward the limb as they do from orbit.
    float depth = pow(cloud, 3.0) * uCloudLook.x / pow(viewCos, 0.6), depthShadow = pow(shadow, 3.0) * uCloudLook.x;
    // Two-stream reflectance of a water cloud: thin veils pass most light, thick decks return most of it.
    float albedoCloud = 0.15 * depth / (2.0 + 0.15 * depth);
    // What a cloud does not reflect it passes down as soft light, so the sea shows through thin cloud in proportion.
    float cover = albedoCloud;
    float shade = 1.0 - 0.8 * (0.15 * depthShadow / (2.0 + 0.15 * depthShadow)) * smoothstep(0.0, 0.1, mu);

    // Cloud shades the moonlit ground too (read straight overhead: the moon's own slant is not followed).
    float shadeMoon = 1.0 - 0.7 * albedoCloud;
    vec3 base = vec3(0.012, 0.03, 0.065);
    float water = 1.0;
    if (uHas.y > 0.5) {
      vec3 tex = readMap(uColor, n, 0.0, nx, ny).rgb;
      // The sea in the Blue Marble is a flat dark blue; anything brighter or less blue is land or ice.
      water = (1.0 - smoothstep(0.012, 0.035, max(tex.r, tex.g))) * smoothstep(0.0, 0.01, tex.b - tex.r);
      base = mix(tex, mix(base, tex, 0.35), water);
    }
    vec3 ground = base * (sun * max(mu, 0.0) * shade + skySun) / PI;
    float nv = max(dot(n, -rd), 1e-3);
    ground += water * sun * shade * glitter(n, rd, uSun, max(mu, 0.0));
    // By moonlight colour drains from the land, as it does for the eye and for film: what is left is tone. Land
    // stays a mid grey, the sea goes nearly black except where it mirrors the moon, and cloud is the brightest thing.
    float tone = dot(base, vec3(0.3, 0.55, 0.15));
    vec3 moonlit = mix(base, vec3(tone), 0.7) * mix(1.0, 0.45, water) * (MOON * moon * max(muMoon, 0.0) + skyMoon) / PI;
    moonlit += water * MOON * moon * glitter(n, rd, uMoon, max(muMoon, 0.0));
    ground += water * skySun * (0.02 + 0.98 * pow(1.0 - nv, 5.0)) / PI * 0.5;

    float muC = dot(nc, uSun);
    // For colour, a top counts as standing only part of the way from the one level the look was balanced at to its
    // own height: low decks sit a little deeper in the haze and high cloud a little clearer of it, without the low
    // ones turning the cream of a sunset at midday. The timing of sunrise on a cloud uses its true height.
    float airHeight = mix(uCloudLook.z, height, 0.4);
    vec3 sunC = transmit(RG + airHeight, muC) * sunSeen(RC, muC) * SUN, moonC = sunAt(RC, dot(nc, uMoon)) * SUN * uNightLook.z;
    // Where real heights do the modelling, the guessed relief of whole cloud masses steps back.
    float relief = clamp(1.0 + uCloudLook.y * ((cloud - towardSun) * 2.2 + (massHere - massSun) * (lifted ? 0.9 : 2.6)), 0.35, 1.5);
    relief *= slope * (1.0 - 0.85 * shaded);
    // Light wraps a little round a cloud's shoulder, so the terminator on a cloud deck is soft, as it is in life.
    float wrap = clamp((muC + 0.12) / 1.12, 0.0, 1.0);
    vec3 cloudLight = (sunC * wrap * relief + MOON * moonC * clamp(dot(nc, uMoon), 0.0, 1.0) * mix(1.0, relief, 0.6) + sky * 1.4) / PI;
    // Cloud tops stand above most of the air, so the path back to the camera reddens them less than the sea.
    vec3 lift = pow(max(through, vec3(1e-6)), vec3(exp(-airHeight / HR) - 1.0));
    behind = mix(ground + moonlit * shadeMoon, cloudLight * min(lift, vec3(8.0)), cover);
    // The haze the march gathered lies mostly in the lowest few kilometres. A high top stands above more of it than
    // a low one, so it is seen through less blue: it sits nearer the eye.
    if (lifted) light *= mix(1.0, clamp(exp(-(airHeight - uCloudLook.z) / HR), 0.6, 1.3), cover);

    if (uHas.z > 0.5) {
      vec3 lamps = readMap(uNight, n, 0.0, nx, ny).rrr;
      float dark = 1.0 - smoothstep(-0.12, 0.04, mu);
      behind += lamps * lamps * vec3(1.0, 0.6, 0.28) * uNightLook.x * dark * (1.0 - cover * 0.92);
    }
  } else {
    behind = stars(rd) * uNightLook.w;
    // The sun's disc, darker toward its edge, and a restrained glare round it.
    float angle = acos(clamp(cosSun, -1.0, 1.0));
    float limb = sqrt(max(1.0 - pow(angle / SUN_R, 2.0), 0.0));
    behind += SUN * 9000.0 * (1.0 - smoothstep(SUN_R * 0.96, SUN_R, angle)) * (0.4 + 0.6 * limb);
    // Glare is the lens's doing, so it is there only while the camera itself can see the sun.
    float camR = length(ro);
    behind += SUN * uGrade.w * sunSeen(camR, dot(ro, uSun) / camR) * (0.00002 / (angle * angle + 0.00002) * exp(-angle * 9.0) + 0.0000012 / (pow(angle, 3.0) + 0.00002));
  }
  vec3 colour = light + through * behind;

  colour = agx(colour * uWhite * uExposure);
  // The curve returns display-encoded sRGB. On a wide-gamut canvas the same numbers would come out too vivid, so
  // they are re-expressed in Display P3; uGrade.z lets a controlled part of the extra range back in.
  if (uP3 > 0.5) {
    vec3 lin = pow(colour, vec3(2.2));
    vec3 p3 = mat3(0.8225, 0.0332, 0.0171, 0.1774, 0.9669, 0.0724, 0.0, 0.0, 0.9108) * lin;
    colour = pow(clamp(mix(p3, lin, uGrade.z), 0.0, 1.0), vec3(1.0 / 2.2));
  }
  // Half a code value of noise, shaped so its sum is flat: it removes the bands a dark gradient would otherwise show
  // on an 8-bit screen, and is far too small to read as grain.
  float n1 = hash(vec3(gl_FragCoord.xy, 1.0)), n2 = hash(vec3(gl_FragCoord.xy, 2.0));
  colour += (n1 + n2 - 1.0) / 255.0;
  o = vec4(colour, 1.0);
}`;
