// GLSL shared by every pass: constants, the ray/sphere test, and the map every baked texture is laid out on.
//
// Units are kilometres. The planet is a sphere at the origin; the reference camera sits on the +Y axis.
//
// THE MAP. The baked textures (surface, clouds, cloud shadows) cover the part of the globe the camera can see. A point
// of the globe is addressed by two numbers measured about the reference camera's nadir: psi, from its bearing, and
// rho, how far down from straight-below the reference camera sees it (plus a small linear term, see rhoOf). Rows of
// the texture are therefore rows of the picture, more or less: the foreground gets fine texels and the far,
// foreshortened ground coarse ones, in step with what the screen can show. Past the horizon rho keeps growing
// slowly, so clouds and shadows just beyond the limb are still there to be seen through the air or to cast shade
// into view. The map belongs to the globe, not to the view: any camera can draw from it, it is only sharpest near
// this one.
//
// A frame looks the map up dozens of times a pixel, so the lookup is written to be cheap: psi is twice the tangent
// of half the bearing (one division, where the bearing itself would need an arctangent), and the arc from the nadir
// comes from a short series instead of an arccosine. One arctangent is left.

export const HEADER = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
`;

export const COMMON = `
#define PI 3.14159265359
const float RP = 6371.0;          // planet radius
const float RA = RP + 100.0;      // top of the air that scatters light
const float CLOUD_TOP = 16.0;     // tallest cloud, above the sea
const float RC = RP + CLOUD_TOP;

// Always zero. Loops count to their bound plus this, which the compiler cannot know in advance, so it keeps them
// as loops instead of unrolling them. Unrolled, the nested loops of the generators make the shader many times
// longer, and on Windows (where the browser hands the driver HLSL) that took seconds to compile before the first
// frame. An unset uniform is zero, so nothing has to set it.
uniform int uZ;

float sat(float x){ return clamp(x, 0., 1.); }
vec3 sat(vec3 x){ return clamp(x, 0., 1.); }
float sq(float x){ return x*x; }
float remap(float x, float a, float b){ return clamp((x - a)/(b - a), 0., 1.); }

// Where a ray meets a sphere about the origin: the near and far distances, or near > far when it misses.
// Written about the ray's closest point to the centre, which keeps its precision when the ray only grazes
// (Haines, Guenther and Akenine-Moeller, "Precision Improvements for Ray/Sphere Intersection", Ray Tracing Gems, 2019).
vec2 sphere(vec3 o, vec3 d, float r){
  float b = -dot(o, d);
  vec3 l = o + b*d;
  float disc = r*r - dot(l, l);
  if (disc < 0.) return vec2(1e9, -1e9);
  float q = sqrt(disc);
  return vec2(b - q, b + q);
}

// Rotate v about the unit axis k by angle a.
vec3 turn(vec3 v, vec3 k, float a){
  float c = cos(a), s = sin(a);
  return v*c + cross(k, v)*s + k*dot(k, v)*(1. - c);
}
`;

export const MAP = `
uniform vec4 uMap;      // psi0, 1/(psi1 - psi0), rho0, 1/(rho1 - rho0)
uniform vec4 uRef;      // the reference camera's distance from the centre; the arc from its nadir to its horizon,
                        // and that arc's cosine and sine
const float KAPPA = 0.14;

float rhoOf(float a){
  float ah = min(a, uRef.y);
  return atan(RP*sin(ah), uRef.x - RP*cos(ah)) + KAPPA*a;
}
// Unit vector from the planet's centre -> (psi, rho).
vec2 mapCoord(vec3 n){
  float c = n.y, e = max(1. - c, 0.);
  float s = sqrt(max(1. - c*c, 0.));
  float a = sqrt(2.*e)*(1. + e*(1./12. + e*(3./160.)));        // acos(c), for the few tens of degrees in question
  bool near = c > uRef.z;
  float th = atan(RP*(near ? s : uRef.w), uRef.x - RP*(near ? c : uRef.z));
  return vec2(2.*n.x/max(s - n.z, 1e-6), th + KAPPA*a);
}
vec2 mapScale(vec2 pr){ return vec2((pr.x - uMap.x)*uMap.y, (pr.y - uMap.z)*uMap.w); }
// Unit vector -> texture coordinate.
vec2 mapUV(vec3 n){ return mapScale(mapCoord(n)); }
// Texture coordinate -> unit vector, the arc from the nadir, and the bearing. rho has no closed inverse, so it is
// bisected; only the bake passes do this.
vec3 unmap(vec2 uv, out float a, out float phi){
  float rho = uMap.z + uv.y/uMap.w;
  phi = 2.*atan(.5*(uMap.x + uv.x/uMap.y));
  float lo = 0., hi = 1.3;
  for (int i = 0; i < 22 + uZ; i++) { float m = .5*(lo + hi); if (rhoOf(m) < rho) lo = m; else hi = m; }
  a = .5*(lo + hi);
  float s = sin(a);
  return vec3(s*sin(phi), cos(a), -s*cos(phi));
}
// East and "outward from the nadir" at n: the frame the baked slopes are stored in.
void mapFrame(vec3 n, out vec3 ePhi, out vec3 eA){
  ePhi = normalize(vec3(-n.z, 0., n.x) + vec3(1e-6, 0., 0.));
  eA = cross(n, ePhi);
}
// Slopes are stored as the sine of the slope angle, which keeps steep faces without spending the range on them.
vec2 packSlope(vec2 s){ return .5 + .5*s/sqrt(1. + s*s); }
vec2 unpackSlope(vec2 e){ e = clamp(e*2. - 1., -.995, .995); return e/sqrt(1. - e*e); }
`;
