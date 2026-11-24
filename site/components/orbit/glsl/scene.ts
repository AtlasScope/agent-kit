// The frame. For each pixel: a ray from the camera, tested against the globe, the cloud shell and the top of the air.
// The ground and the clouds are lit from the baked maps, by the sun and by the moon; the air between is integrated
// along the ray; the airglow is added from the thin air above it. The result is linear light (not yet exposed or
// toned), with alpha saying how much of the starfield behind still shows.
import { ATMOSPHERE_GLSL } from "../atmosphere";
import { COMMON, HEADER, MAP } from "./common";
import { CLOUD_GLSL } from "./shade";

// How the ground is lit: the sea, the land and the ice. A separate piece so that the lab can light an experimental
// ground its own way (site/lab/worlds).
export const SURFACE = `
// ---- The ground ------------------------------------------------------------------------------------------------
// The glitter of a light on a wind-roughened sea. Cox and Munk (1954): the slopes of the waves are close to
// Gaussian, and their mean square grows linearly with the wind. A Gaussian slope distribution is the Beckmann
// facet model, which keeps the glitter a defined patch instead of a haze over the whole sea.
float glitter(vec3 n, vec3 v, vec3 l, float m2){
  float nv = max(dot(n, v), 1e-3), nl = dot(n, l);
  if (nl <= 0.) return 0.;
  vec3 hv = normalize(v + l);
  float nh = max(dot(n, hv), 1e-3), vh = max(dot(v, hv), 1e-3), nh2 = nh*nh;
  float D = exp(-(1. - nh2)/(nh2*m2))/(PI*m2*nh2*nh2);
  float F = .02 + .98*pow(1. - vh, 5.);
  float G = min(1., 2.*nh*min(nv, nl)/vh);
  return D*F*G/(4.*nv)*PI;
}

vec3 shadeGround(vec3 n, vec3 v){
  vec2 uv = mapUV(n);
  vec4 A = textureLod(uSurfA, uv, uLod), B = textureLod(uSurfB, uv, uLod);
  float shS = textureLod(uShade, uv, 0.).g, shM = textureLod(uShadeMoon, uv, 0.).g;
  float e = A.r*2. - 1., h = e/max(1. - abs(e), 1e-3);                  // km above the sea
  float mu = dot(n, uSun), muM = dot(n, uMoon);
  vec3 sun = sunlight(RP + max(h, 0.), mu)*shS;
  vec3 moon = uMoonFill*sunlight(RP, muM)*shM;
  vec3 sky = skylight(RP, mu);

  // Land: dark rock, lit by its own slope.
  vec3 ePhi, eA; mapFrame(n, ePhi, eA);
  vec2 s = unpackSlope(B.rg);
  vec3 N = normalize(n - s.x*ePhi - s.y*eA);
  float up = .6 + .4*dot(N, n);
  vec3 rock = mix(uRock, uRockB, B.a);
  vec3 land = rock*(sun*sat(dot(N, uSun)) + moon*sat(dot(N, uMoon)) + sky*up);

  // Sea: its own colour from below, the sky mirrored in it, and the glitter of the sun and of the moon.
  float depth = max(-h, 0.);
  vec3 body = mix(uSeaShoal, uSeaDeep, 1. - exp(-depth*3.));
  body += uSeaInk*A.g*(1. - .6*sat(depth*.15));
  float nv = max(dot(n, v), 1e-3);
  float fres = .02 + .98*pow(1. - nv, 5.);
  vec3 sea = body*(sun*max(mu, 0.) + moon*max(muM, 0.) + sky)*(1. - fres) + fres*sky*1.35;
  float wind = 1. + 12.*A.a*A.a;
  float m2 = .003 + .00512*wind;
  sea += sun*glitter(n, v, uSun, m2) + moon*glitter(n, v, uMoon, m2);
  // What the currents carry glows faintly of its own accord once the sun has gone.
  sea += uSeaGlow*A.g*A.g*(1. - smoothstep(-.3, -.12, mu));

  vec3 col = mix(sea, land, smoothstep(-.012, .012, h));
  // Ice and snow: fresh snow, wind-scoured blue ice where it is thin or old, lit by its own slope.
  vec3 iceCol = mix(vec3(.36, .55, .68), vec3(.84, .88, .93), smoothstep(.15, .75, A.b*(.55 + .9*B.a)));
  vec3 ice = iceCol*(sun*sat(dot(N, uSun)) + moon*sat(dot(N, uMoon)) + sky*up);
  return mix(col, ice, smoothstep(.08, .6, A.b));
}

`;

// `debug` adds the lab's views of the raw cloud maps; the homepage never compiles them in. `surface` is the GLSL for
// shadeGround().
export const sceneShader = (cloudSteps: number, airSteps: number, debug = false, surface = SURFACE) => `${HEADER}
#define CLOUD_STEPS ${cloudSteps}
#define AIR_STEPS ${airSteps}
${debug ? "#define DEBUG 1\nuniform float uDebug;" : ""}
${COMMON}${MAP}${ATMOSPHERE_GLSL}${CLOUD_GLSL}
uniform vec3 uCam, uRayA, uRayB, uRayC;     // ray through a pixel = normalize(A + B*x + C*y)
uniform vec3 uSun, uMoon;                   // unit vectors toward each
uniform sampler2D uSurfA, uSurfB;
uniform sampler2D uShade, uShadeMoon;       // cloud shadows under the sun, and under the moon
uniform float uTime;
uniform float uLod;                         // map texels per screen pixel, as a mip level
uniform vec3 uSeaDeep, uSeaShoal, uSeaInk;  // the sea: open water, shallows, and what the currents carry
uniform vec3 uSeaGlow;                      // the light that carried stuff gives off at night
uniform vec3 uRock, uRockB;                 // the land
uniform vec4 uSkyFill;                      // x: how much of the scattered sunlight comes back down; yzw: twilight's own glow
uniform vec3 uMoonFill;                     // the moon's light, in the sun's units
uniform float uMoonAir;                     // how much of it the air scatters: the thin blue line on the night limb
uniform vec4 uCloudLook;                    // extinction per km, relief, how dark the hollows are, rim
uniform vec2 uCirrusLook;                   // opacity, brightness
uniform vec2 uDriftCS;                      // cosine and sine of the cloud layer's turn since it was baked
uniform float uMulti;                       // how much twice-scattered light the air carries
uniform float uAirglow;                     // how bright the airglow is
out vec4 o;

const float SUN_L = 45730.;                 // the sun's disc, in units of a white surface it lights square-on

// One random number per pixel, to nudge where each ray is sampled. Plain white noise: what is left of it in the
// picture reads as film grain, where a patterned noise would show its pattern across the smooth air.
float grainAt(vec2 p){
  uvec2 q = uvec2(p);
  uint h = q.x*1664525u + q.y*22695477u + 1013904223u;
  h ^= h >> 15u; h *= 2246822519u; h ^= h >> 13u; h *= 3266489917u; h ^= h >> 16u;
  return float(h)*(1./4294967295.);
}

// Light from the whole sky on a level surface at radius r, where the sun stands at cosine mu. What the air scatters
// out of the sun's beam is not lost: about half of it comes down again as skylight, bluer than the beam it left.
// That is why a low sun gilds a cloud without turning it orange. Past the terminator a little twilight remains.
vec3 skylight(float r, float mu){
  float above;
  vec3 through = extinction(columnsTo(r, max(mu, .02), above));
  return uSkyFill.x*(1. - through)*sat(mu + .02) + uSkyFill.yzw*smoothstep(-.2, .12, mu);
}

// ---- The air ---------------------------------------------------------------------------------------------------
// Light scattered toward the camera between t0 and t1 along the ray, added to L, and the columns of air crossed,
// added to cols. Samples crowd toward the end where the air is thick: t1 when thickEnd, else t0.
// cosLight: the ray's cosine with the sun and with the moon.
// Where the thick end of the path is deep in the planet's shadow there is only moonlit haze to add up, which is
// smooth: a third of the samples do.
void scatterAlong(vec3 d, float t0, float t1, bool thickEnd, float jit, vec2 cosLight, inout vec3 L, inout vec3 cols){
  float len = t1 - t0;
  if (len <= 0.) return;
  float pr = phaseR(cosLight.x), pm = phaseM(cosLight.x, uMieG);
  vec3 moonR = uMoonFill*uMoonAir*phaseR(cosLight.y), moonM = uMoonFill*uMoonAir*phaseM(cosLight.y, uMieG);
  bool night = dot(normalize(uCam + d*(thickEnd ? t1 : t0)), uSun) < -.3;
  int steps = night ? max(AIR_STEPS/3, 2) : AIR_STEPS;
  for (int i = 0; i < steps; i++) {
    float u0 = float(i)/float(steps), u1 = float(i + 1)/float(steps);
    float um = (float(i) + .5 + (jit - .5)*.5)/float(steps);
    float s0, s1, sm;
    if (thickEnd) { float a = 1. - u0, b = 1. - u1, c = 1. - um; s0 = 1. - a*a*a; s1 = 1. - b*b*b; sm = 1. - c*c*c; }
    else { s0 = u0*u0*u0; s1 = u1*u1*u1; sm = um*um*um; }
    float t = t0 + len*sm, dt = len*(s1 - s0);
    vec3 q = uCam + d*t;
    float r = length(q);
    vec3 den = airDensity(r - RP);
    cols += den*(dt*.5);
    float mu = dot(q, uSun)/r, above;
    vec3 through = extinction(columnsTo(r, mu, above));
    vec3 S = through*smoothstep(-SUN_R, SUN_R, above);
    // Light scattered more than once: softer than the beam, and it reaches a little past the terminator.
    vec3 fill = uMulti*sqrt(through)*smoothstep(-.12, .04, above)*(.25/PI);
    vec3 sc = uBetaR*den.x*(S*pr + fill + moonR) + uBetaM.x*den.y*(S*pm + fill + moonM);
    L += extinction(cols)*sc*(dt*PI);
    cols += den*(dt*.5);
  }
}

${surface}
// ---- The clouds ------------------------------------------------------------------------------------------------
// The deck is a height field over the globe. The ray is tested at a stack of levels, and the cloud it passes through
// is added up; where it first dips under the top, the crossing is closed in on, so the lit surface is placed exactly.
struct Cloud { float alpha; float t; };

// The levels, closer together near the sea where most cloud is thin.
float levelHeight(float i){ float u = 1. - i/float(CLOUD_STEPS); return CLOUD_BASE + (CLOUD_TOP - CLOUD_BASE)*u*u; }

Cloud marchClouds(vec3 d, bool ground, float jit){
  Cloud c; c.alpha = 0.; c.t = -1.;
  float b = -dot(uCam, d);
  vec3 l = uCam + b*d;
  float l2 = dot(l, l);
  float tPrev = b - sqrt(max(RC*RC - l2, 0.)), od = 0., lo = -1., hi = -1., top;
  // Down through the shell.
  for (int i = 1; i <= CLOUD_STEPS; i++) {
    float r = RP + levelHeight(float(i) - jit);
    float disc = r*r - l2;
    if (disc < 0.) break;                       // the ray turns upward before it gets this low
    float t = b - sqrt(disc);
    float den = cloudDensity(uCam + d*t, uLod, top);
    od += den*(t - tPrev);
    if (lo < 0. && den > .04) { lo = tPrev; hi = t; }
    tPrev = t;
  }
  // And, for a ray that clears the ground, up the far side.
  if (!ground) {
    for (int i = CLOUD_STEPS; i >= 1; i--) {
      float r = RP + levelHeight(float(i) - jit);
      float disc = r*r - l2;
      if (disc < 0.) continue;
      float t = b + sqrt(disc);
      float den = cloudDensity(uCam + d*t, uLod, top);
      od += den*(t - tPrev);
      if (lo < 0. && den > .04) { lo = tPrev; hi = t; }
      tPrev = t;
    }
  }
  if (lo < 0.) return c;
  for (int i = 0; i < 5; i++) {
    float m = .5*(lo + hi);
    if (cloudDensity(uCam + d*m, uLod, top) > .04) hi = m; else lo = m;
  }
  c.t = hi;
  c.alpha = 1. - exp(-uCloudLook.x*od);
  return c;
}

// How a face of cloud takes a light: brightest square-on, and never quite dark, because light that enters a cloud
// wanders through it and leaks out of every side.
float cloudFace(vec3 N, vec3 l, float muL, float hollow){
  float facing = sat((dot(N, l) + .3)/1.3);
  return facing*facing*.78 + .22*sat(muL*4. + .35)*hollow;
}

vec3 shadeCloud(vec3 q, vec3 d){
  float r = length(q);
  vec3 n = q/r;
  float turned;
  vec3 m = unspun(n, turned);
  m = vec3(uDriftCS.x*m.x - uDriftCS.y*m.z, m.y, uDriftCS.y*m.x + uDriftCS.x*m.z);      // and the layer's own turn
  vec2 uv = mapUV(m), here = mapUV(n);
  vec4 A = textureLod(uCloudA, uv, uLod), B = textureLod(uCloudB, uv, uLod);
  float shS = textureLod(uShade, here, 0.).r, shM = textureLod(uShadeMoon, here, 0.).r;
  // The slope of the top was stored where the cloud was baked; bring it round to where the cloud is now.
  vec3 ePhi, eA; mapFrame(m, ePhi, eA);
  vec2 s = unpackSlope(A.ba)*uCloudLook.y;
  vec3 N = normalize(m - s.x*ePhi - s.y*eA);
  N = turn(vec3(uDriftCS.x*N.x + uDriftCS.y*N.z, N.y, -uDriftCS.y*N.x + uDriftCS.x*N.z), uSpin.xyz, turned);
  float mu = dot(n, uSun), muM = dot(n, uMoon);
  vec3 sun = sunlight(r, mu)*shS;
  vec3 moon = uMoonFill*sunlight(r, muM)*shM;
  // Hollows between the heaps are darker than the heaps: compare this top with the tops around it.
  float around = textureLod(uCloudA, uv, uLod + 3.5).r;
  float hollow = clamp(1. - uCloudLook.z*(around - A.r)*CLOUD_TOP, .45, 1.2);
  vec3 lit = sun*cloudFace(N, uSun, mu, hollow) + moon*cloudFace(N, uMoon, muM, hollow);
  // Thin edges seen against the light glow.
  lit += (sun*phaseM(dot(d, uSun), .72) + moon*phaseM(dot(d, uMoon), .72))*uCloudLook.w*(1. - A.g);
  vec3 sky = skylight(r, mu)*(.6 + .4*dot(N, n))*hollow;
#ifdef DEBUG
  if (uDebug > .5) {
    if (uDebug < 1.5) return vec3(A.r);                        // 1: how high the tops are
    if (uDebug < 2.5) return vec3(A.g);                        // 2: density
    if (uDebug < 3.5) return vec3(shS);                        // 3: sunlight reaching the tops
    if (uDebug < 4.5) return vec3(.5 + .5*dot(N, uSun));       // 4: slope toward the sun
    return vec3(hollow*.8);                                    // 5: hollows
  }
#endif
  return (.92*lit + .9*sky)*(1. - .3*B.b);
}

void main(){
  vec3 d = normalize(uRayA + uRayB*gl_FragCoord.x + uRayC*gl_FragCoord.y);
  float jit = grainAt(gl_FragCoord.xy);
  vec2 cosLight = vec2(dot(d, uSun), dot(d, uMoon));
  float px = length(uRayB)/length(uRayA);
  // The sun's disc, darker toward its edge. What dims and reddens it is the air it is seen through, below.
  float ang = cosLight.x > 0. ? length(cross(d, uSun)) : 1.;
  float sunDisc = SUN_L*smoothstep(SUN_R + px, SUN_R - px, ang)*(.4 + .6*sqrt(max(1. - sq(ang/SUN_R), 0.)));
  vec3 col = vec3(sunDisc);
  float alpha = 1.;
  bool ground = false;

  float b = -dot(uCam, d);
  vec3 l = uCam + b*d;
  float l2 = dot(l, l);

  vec2 tA = sphere(uCam, d, RA);
  if (tA.x < tA.y && tA.y > 0.) {
    float tIn = max(tA.x, 0.);
    vec2 tG = sphere(uCam, d, RP);
    ground = tG.x < tG.y && tG.x > 0.;
    vec2 tC = sphere(uCam, d, RC);
    bool shell = tC.x < tC.y && tC.y > 0.;

    // Clouds first: they decide how far the ray gets.
    Cloud c; c.alpha = 0.; c.t = -1.;
    if (shell) c = marchClouds(d, ground, jit);

    // Behind the clouds: the ground, or the air out to space.
    vec3 back = vec3(0.);
    float backAlpha = 0.;
    if (c.alpha < .995) {
      vec3 L = vec3(0.), cols = vec3(0.);
      if (ground) {
        scatterAlong(d, tIn, tG.x, true, jit, cosLight, L, cols);
        back = L + extinction(cols)*shadeGround(normalize(uCam + d*tG.x), -d);
      } else {
        scatterAlong(d, tIn, b, true, jit, cosLight, L, cols);        // b: nearest the planet
        scatterAlong(d, b, tA.y, false, jit, cosLight, L, cols);
        vec3 T = extinction(cols);
        backAlpha = dot(T, vec3(.3333));
        back = L + T*sunDisc;
      }
    }
    col = back; alpha = backAlpha;
    if (c.alpha > 0.) {
      vec3 q = uCam + d*c.t;
      vec3 L = vec3(0.), cols = vec3(0.);
      scatterAlong(d, tIn, c.t, true, jit, cosLight, L, cols);
      col = mix(back, L + extinction(cols)*shadeCloud(q, d), c.alpha);
      alpha = backAlpha*(1. - c.alpha);
#ifdef DEBUG
      if (uDebug > .5) { o = vec4(shadeCloud(q, d)*c.alpha, 0.); return; }
#endif
    }
#ifdef DEBUG
    if (uDebug > .5) { o = vec4(ground ? vec3(.0, .012, .03) : vec3(0.), 0.); return; }
#endif
    // Cirrus: one thin sheet, lit and laid over whatever is beneath it.
    vec2 tZ = sphere(uCam, d, RP + CIRRUS_Z);
    if (tZ.x < tZ.y && tZ.x > 0. && (c.t < 0. || tZ.x < c.t || c.alpha < 1.)) {
      vec3 n = normalize(uCam + d*tZ.x);
      float amount = textureLod(uCloudB, cloudUV(n), uLod).r;
      if (amount > .003) {
        float slant = max(dot(n, -d), .12);
        float a = (1. - exp(-uCirrusLook.x*amount/slant))*((c.t > 0. && c.t < tZ.x) ? 1. - c.alpha : 1.);
        float mu = dot(n, uSun), muM = dot(n, uMoon), above;
        vec3 view = extinction(columnsTo(RP + CIRRUS_Z, dot(n, -d), above));
        vec3 light = sunlight(RP + CIRRUS_Z, mu)*(.5 + 2.2*phaseM(cosLight.x, .6)) + skylight(RP + CIRRUS_Z, mu)
          + uMoonFill*sunlight(RP + CIRRUS_Z, muM)*(.5 + 2.2*phaseM(cosLight.y, .6));
        col = mix(col, view*light*uCirrusLook.y, a);
        alpha *= 1. - a;
      }
    }
  }

  // Airglow: a shell of air a few kilometres thick near 96 km that shines green by itself. Looked at from above it
  // is nothing; edge-on, the long path through it makes a thin line above the night limb. (The aurora, which is
  // dearer, is drawn on its own at half the size: see aurora.ts.)
  if (uAirglow > 0. && b > 0.) {
    float rs = RP + 96., w = 2.6, rp = sqrt(l2);
    float path = w*rs/sqrt(max(rs*rs - l2, rs*w))*(rp < rs ? 1. : exp(-sq((rp - rs)/w)));
    vec3 n = normalize(uCam + d*(b - sqrt(max(rs*rs - l2, 0.))));
    float night = 1. - smoothstep(-.36, -.2, dot(n, uSun));        // deep night only: never against the dawn
    col += vec3(.3, 1., .42)*uAirglow*path*(ground ? 1. : 2.)*night;
  }
  o = vec4(col, alpha);
}`;
