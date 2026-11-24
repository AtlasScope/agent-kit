// GLSL noise for the bake passes: an integer hash, gradient noise with its exact gradient, cellular noise, and the
// fractal sums built from them. Everything is evaluated at points of the unit sphere scaled by a frequency, so
// there are no seams or poles. Each sum takes the footprint of the texel it is feeding and leaves out the octaves
// that texel is too coarse to hold, which is what keeps the far, foreshortened ground from turning to static.

// A fixed rotation between octaves, so the lattices of successive octaves never line up. About (1,2,3), 0.7 rad.
function rotation(axis: [number, number, number], angle: number) {
  const len = Math.hypot(...axis), [x, y, z] = axis.map((v) => v / len);
  const c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
  const m = [t * x * x + c, t * x * y + s * z, t * x * z - s * y, t * x * y - s * z, t * y * y + c, t * y * z + s * x, t * x * z + s * y, t * y * z - s * x, t * z * z + c];
  return `mat3(${m.map((v) => v.toFixed(6)).join(",")})`;
}

export const NOISE = `
uniform vec3 uSeed;
const mat3 OCT = ${rotation([1, 2, 3], 0.7)};

// pcg3d, from Jarzynski and Olano, "Hash Functions for GPU Rendering" (JCGT, 2020).
uvec3 pcg3(uvec3 v){
  v = v*1664525u + 1013904223u;
  v.x += v.y*v.z; v.y += v.z*v.x; v.z += v.x*v.y;
  v ^= v >> 16u;
  v.x += v.y*v.z; v.y += v.z*v.x; v.z += v.x*v.y;
  return v;
}
vec3 hash3(ivec3 i){ return vec3(pcg3(uvec3(i))) * (1./4294967295.); }
float hash1(float x){ return float(pcg3(uvec3(ivec3(int(floor(x)), 7, 13))).x) * (1./4294967295.); }

// Gradient noise. w is the value, in about [-1, 1]; xyz is its gradient.
vec4 gnoise(vec3 p){
  vec3 i = floor(p), f = p - i;
  ivec3 I = ivec3(i);
  vec3 u = f*f*f*(f*(f*6. - 15.) + 10.);
  vec3 du = 30.*f*f*(f*(f - 2.) + 1.);
  vec3 g000 = hash3(I)*2. - 1.,                g100 = hash3(I + ivec3(1,0,0))*2. - 1.;
  vec3 g010 = hash3(I + ivec3(0,1,0))*2. - 1., g110 = hash3(I + ivec3(1,1,0))*2. - 1.;
  vec3 g001 = hash3(I + ivec3(0,0,1))*2. - 1., g101 = hash3(I + ivec3(1,0,1))*2. - 1.;
  vec3 g011 = hash3(I + ivec3(0,1,1))*2. - 1., g111 = hash3(I + ivec3(1,1,1))*2. - 1.;
  float v000 = dot(g000, f),                 v100 = dot(g100, f - vec3(1,0,0));
  float v010 = dot(g010, f - vec3(0,1,0)),   v110 = dot(g110, f - vec3(1,1,0));
  float v001 = dot(g001, f - vec3(0,0,1)),   v101 = dot(g101, f - vec3(1,0,1));
  float v011 = dot(g011, f - vec3(0,1,1)),   v111 = dot(g111, f - vec3(1,1,1));
  float value = mix(mix(mix(v000, v100, u.x), mix(v010, v110, u.x), u.y), mix(mix(v001, v101, u.x), mix(v011, v111, u.x), u.y), u.z);
  vec3 grad = mix(mix(mix(g000, g100, u.x), mix(g010, g110, u.x), u.y), mix(mix(g001, g101, u.x), mix(g011, g111, u.x), u.y), u.z);
  grad += du*vec3(
    mix(mix(v100 - v000, v110 - v010, u.y), mix(v101 - v001, v111 - v011, u.y), u.z),
    mix(mix(v010 - v000, v110 - v100, u.x), mix(v011 - v001, v111 - v101, u.x), u.z),
    mix(mix(v001 - v000, v101 - v100, u.x), mix(v011 - v010, v111 - v110, u.x), u.y));
  return vec4(grad, value)*1.25;
}

// Cellular noise: the distance to the nearest feature point, to the second nearest, and a random number that
// belongs to the nearest one (so a cell can decide for itself whether it holds anything).
vec3 worley(vec3 p){
  vec3 i = floor(p), f = p - i;
  ivec3 I = ivec3(i);
  float d1 = 9., d2 = 9., id = 0.;
  for (int z = -1; z <= 1 + uZ; z++) for (int y = -1; y <= 1 + uZ; y++) for (int x = -1; x <= 1 + uZ; x++) {
    ivec3 o = ivec3(x, y, z);
    vec3 h = hash3(I + o);
    vec3 r = vec3(o) + h - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = fract(dot(h, vec3(127.1, 311.7, 74.7))); } else if (d < d2) d2 = d;
  }
  return vec3(sqrt(d1), sqrt(d2), id);
}

// How much of an octave a texel can hold: all of it while the texel is a quarter of the wavelength or less.
float octave(float fp){ return 1. - smoothstep(.22, .55, fp); }

// Fractal sum of gradient noise, about [-1, 1]. fp is the texel's footprint in the units of p.
float fbm(vec3 p, float fp, int octaves){
  float a = .5, s = 0.;
  for (int i = 0; i < octaves + uZ; i++) {
    float w = octave(fp);
    if (w <= 0.) break;
    s += a*w*gnoise(p).w;
    p = OCT*p*2.02 + 19.1; fp *= 2.02; a *= .5;
  }
  return s;
}
// The same with each octave folded into ridges, 0..1: mountain chains, cloud streets, cracks.
float ridged(vec3 p, float fp, int octaves){
  float a = .5, s = 0., prev = 1.;
  for (int i = 0; i < octaves + uZ; i++) {
    float w = octave(fp);
    if (w <= 0.) break;
    float r = 1. - abs(gnoise(p).w);
    r *= r;
    s += a*w*r*prev;
    prev = r;
    p = OCT*p*2.02 + 19.1; fp *= 2.02; a *= .5;
  }
  return s;
}
// A fractal sum whose detail thins out where the slope so far is steep: valleys stay smooth, ridges stay busy
// (the derivative damping Inigo Quilez describes for terrain; this is my own formulation of it).
float eroded(vec3 p, float fp, int octaves){
  float a = .5, s = 0.;
  vec3 g = vec3(0.);
  for (int i = 0; i < octaves + uZ; i++) {
    float w = octave(fp);
    if (w <= 0.) break;
    vec4 nz = gnoise(p);
    g += nz.xyz*a;
    s += a*w*nz.w/(1. + 1.6*dot(g, g));
    p = OCT*p*2.02 + 19.1; fp *= 2.02; a *= .5;
  }
  return s;
}
// A flow that neither piles up nor thins out on the sphere: the surface gradient of a noise, turned a quarter turn.
vec3 curl(vec3 n, float freq, vec3 offset){
  vec3 g = gnoise(n*freq + offset).xyz;
  return cross(n, g);
}
`;
