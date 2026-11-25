// Cloud shadows. For every texel of the map this walks from three starting points toward the sun, through the baked
// cloud deck, and stores how much light arrives: at the top of the cloud standing there (so clouds shade themselves
// and each other), at the ground, and at a level in between for the haze. A frame then needs one lookup for a
// shadow. It reruns whenever the sun or the clouds move; it is small, so that is cheap. Shadows are stored where
// they fall now, so the ground under a drifting cloud is shaded in the right place.
import { COMMON, HEADER, MAP } from "./common";

export const CLOUD_GLSL = `
uniform sampler2D uCloudA, uCloudB;
uniform vec4 uSpin;        // xyz: the storm's centre as it stands now; w: one over its radius (radians)
uniform vec4 uDrift;       // how the weather has moved since it was baked. x: the tangent of half the whole layer's
                           // turn about the camera's nadir; y: the storm's turn about its centre at unit distance;
                           // z: the cosine of how far from its centre the storm turns anything; w: spare
const float CLOUD_BASE = 0.9;      // km
const float CIRRUS_Z = 11.5;       // km

// The weather is baked once and then carried: the whole layer drifts slowly round, and the storm turns about its
// centre, faster nearer the middle. This undoes the storm's part for a point of the globe, and says by what angle.
vec3 unspun(vec3 n, out float turned){
  turned = 0.;
  float cd = dot(n, uSpin.xyz);
  if (uDrift.y == 0. || cd < uDrift.z) return n;
  float d = sqrt(2.*max(1. - cd, 0.))*uSpin.w;                 // the chord, near enough the arc, in storm radii
  turned = uDrift.y/(d + .25)*(1. - smoothstep(1.2, 2.6, d));
  return turn(n, uSpin.xyz, -turned);
}
// Where the air now over a point was when the map was made, as a texture coordinate. The layer's own turn is a
// shift in bearing, which in psi is one division.
vec2 cloudUV(vec3 n){
  float turned;
  vec2 pr = mapCoord(unspun(n, turned));
  pr.x = (pr.x + 2.*uDrift.x)/(1. - .5*pr.x*uDrift.x);
  return mapScale(pr);
}

// How much cloud there is at a point in space, 0..1. lod blurs the deck: far samples stand for wider cones.
float cloudDensity(vec3 q, float lod, out float top){
  float r = length(q), z = r - RP;
  top = 0.;
  if (z > CLOUD_TOP || z < CLOUD_BASE - .6) return 0.;
  vec4 a = textureLod(uCloudA, cloudUV(q/r), lod);
  top = a.r*CLOUD_TOP;
  return a.g*smoothstep(.25, -.25, z - top)*smoothstep(CLOUD_BASE - .6, CLOUD_BASE, z);
}
`;

export const SHADE = `${HEADER}${COMMON}${MAP}${CLOUD_GLSL}
uniform vec2 uSize;
uniform vec3 uSun;
uniform vec2 uSigma;       // extinction per km: solid cloud, cirrus sheet
out vec4 o;

float through(vec3 p){
  float len = min(sphere(p, uSun, RC).y, 900.);
  if (len <= 0.) return 1.;
  float od = 0., top;
  const int M = 14;
  for (int j = 0; j < M + uZ; j++) {
    float u0 = float(j)/float(M), u1 = float(j + 1)/float(M);
    float t0 = len*u0*sqrt(u0), t1 = len*u1*sqrt(u1), t = .5*(t0 + t1);
    od += cloudDensity(p + uSun*t, clamp(log2(1. + t*.25), 0., 6.), top)*(t1 - t0);
  }
  float T = exp(-uSigma.x*od);
  // The cirrus sheet, where the path to the sun crosses its level.
  vec2 tc = sphere(p, uSun, RP + CIRRUS_Z);
  if (tc.y > 0. && length(p) < RP + CIRRUS_Z) {
    vec3 q = p + uSun*tc.y;
    float slant = max(dot(normalize(q), uSun), .08);
    T *= exp(-uSigma.y*textureLod(uCloudB, cloudUV(normalize(q)), 1.).r/slant);
  }
  return T;
}

void main(){
  float a, phi;
  vec3 n = unmap(gl_FragCoord.xy/uSize, a, phi);
  float top = textureLod(uCloudA, cloudUV(n), 0.).r*CLOUD_TOP;
  o = vec4(through(n*(RP + max(top, CLOUD_BASE) + .3)), through(n*(RP + .02)), through(n*(RP + 4.)), 1.);
}`;
