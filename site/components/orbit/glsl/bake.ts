// The bake passes: run the world's generators (world.ts) once for every texel of the map and store the answers, so
// that drawing a frame is a matter of looking things up. Slopes come from the GPU's own neighbour differences of the
// height, taken at full precision before anything is rounded to eight bits.
import { COMMON, HEADER, MAP } from "./common";
import { NOISE } from "./noise";
import { GROUND, SKY, WORLD_HEAD } from "./world";

const TEXEL = `
uniform vec2 uSize;        // the map's size in texels
// The point of the globe this texel holds, its footprint on the unit sphere, and its size east and outward in km.
vec3 texel(out float fp, out vec2 km){
  vec2 uv = gl_FragCoord.xy/uSize;
  float a, phi;
  vec3 n = unmap(uv, a, phi);
  float dpsi = 1./(uMap.y*uSize.x), drho = 1./(uMap.w*uSize.y);
  float dphi = dpsi*sq(cos(.5*phi));
  float da = drho/max((rhoOf(a + 1e-3) - rhoOf(a - 1e-3))/2e-3, KAPPA);
  float east = max(sin(a), 1e-3)*dphi;
  fp = max(east, da);
  km = vec2(east, da)*RP;
  return n;
}
`;

// Surface.  A: height (0.5 is the sea), sea tracer, ice, wind.  B: slope east, slope outward, shore, kind.
// `ground` is the GLSL for the ground() function; the lab passes its experiments here.
export const bakeSurface = (ground = GROUND) => `${HEADER}${COMMON}${MAP}${NOISE}${WORLD_HEAD}${ground}${TEXEL}
layout(location = 0) out vec4 oA;
layout(location = 1) out vec4 oB;
void main(){
  float fp; vec2 km;
  vec3 n = texel(fp, km);
  Ground g = ground(n, fp);
  float h = max(g.height, 0.);
  vec2 slope = vec2(dFdx(h), dFdy(h))/km;
  // Height is stored on a curve that spends most of its precision near the waterline, where the coast is drawn.
  oA = vec4(.5 + .5*g.height/(abs(g.height) + 1.), g.tracer, g.ice, g.wind);
  oB = vec4(packSlope(slope), g.shore, g.kind);
}`;

// Clouds.  A: top height / 16 km, density, slope of the top east and outward.  B: cirrus, base / 16 km, dark, spare.
export const BAKE_CLOUDS = `${HEADER}${COMMON}${MAP}${NOISE}${WORLD_HEAD}${SKY}${TEXEL}
layout(location = 0) out vec4 oA;
layout(location = 1) out vec4 oB;
void main(){
  float fp; vec2 km;
  vec3 n = texel(fp, km);
  Sky s = sky(n, fp);
  vec2 slope = vec2(dFdx(s.top), dFdy(s.top))/km;
  oA = vec4(s.top/CLOUD_TOP, s.density, packSlope(slope));
  oB = vec4(s.cirrus, s.base/CLOUD_TOP, s.dark, 1.);
}`;
