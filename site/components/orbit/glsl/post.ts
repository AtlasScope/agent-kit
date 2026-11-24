// The last pass, at the screen's own resolution: the stars behind the scene, the aurora over it (drawn at half size by
// aurora.ts), the glare a lens puts around the sun,
// exposure, the tone curve and grade, and a dither fine enough that the near-black gradients do not band.
import { COMMON, HEADER } from "./common";

export const POST = `${HEADER}${COMMON}
uniform sampler2D uScene;
uniform sampler2D uGlow;                    // the aurora, at half size
uniform vec2 uRes;                          // this target, in pixels
uniform vec3 uRayA, uRayB, uRayC;           // ray through a pixel of this target
uniform mat3 uSky;                          // world -> the frame the stars are fixed in
uniform vec3 uSun;
uniform vec3 uGlare;                        // the sun's colour as the camera sees it, times how much of it is in view
uniform vec4 uStars;                        // brightness, density, twinkle, time
uniform vec4 uGrade;                        // exposure, contrast, saturation, grain
uniform vec3 uWhite;                        // white balance
uniform vec3 uInk;                          // the page's black, so the sky meets the header without a seam
uniform float uFade;                        // 0..1, the whole picture
out vec4 o;

uvec3 pcg3(uvec3 v){
  v = v*1664525u + 1013904223u;
  v.x += v.y*v.z; v.y += v.z*v.x; v.z += v.x*v.y;
  v ^= v >> 16u;
  v.x += v.y*v.z; v.y += v.z*v.x; v.z += v.x*v.y;
  return v;
}
vec3 hash3(ivec3 i){ return vec3(pcg3(uvec3(i))) * (1./4294967295.); }

// Stars. The sky is cut into cells on the faces of a cube; a cell holds at most one star, placed and coloured by a
// hash of the cell. Brightness follows the real sky's rule of thumb: each step fainter, about three times as many.
vec3 starLayer(vec3 d, float cells, float px, int layer){
  vec3 a = abs(d);
  float m = max(a.x, max(a.y, a.z));
  vec2 uv; int face;
  if (a.x == m) { uv = d.yz/m; face = d.x > 0. ? 0 : 1; }
  else if (a.y == m) { uv = d.zx/m; face = d.y > 0. ? 2 : 3; }
  else { uv = d.xy/m; face = d.z > 0. ? 4 : 5; }
  vec2 g = (uv*.5 + .5)*cells;
  ivec2 id = ivec2(floor(g));
  vec3 h = hash3(ivec3(id, face*7 + layer*53));
  vec3 k = hash3(ivec3(id.yx + 91, face*13 + layer*29 + 5));
  if (h.z > uStars.y) return vec3(0.);
  vec2 c = (vec2(id) + .2 + .6*h.xy)/cells*2. - 1.;
  vec3 s;
  if (face < 2) s = vec3(face == 0 ? 1. : -1., c.x, c.y);
  else if (face < 4) s = vec3(c.y, face == 2 ? 1. : -1., c.x);
  else s = vec3(c.x, c.y, face == 4 ? 1. : -1.);
  s = normalize(s);
  float dist = length(cross(d, s))/px;                          // pixels from the star's centre
  float flux = min(pow(max(k.x, 1e-4), -.72), 60.)*.012;        // many faint, few bright
  float core = exp(-dist*dist*1.1);
  float halo = flux*.02/(1. + dist*dist*.35);
  vec3 tint = mix(mix(vec3(1., .78, .58), vec3(1.), smoothstep(0., .45, k.y)), vec3(.74, .84, 1.), smoothstep(.6, 1., k.y));
  float twinkle = 1. + uStars.z*sin(uStars.w*(1.2 + 2.6*k.z) + 40.*h.x);
  return tint*(flux*core + halo)*twinkle;
}
vec3 stars(vec3 d, float px){
  vec3 s = uSky*d;
  return starLayer(s, 30., px, 0) + .5*starLayer(s, 70., px, 1) + .22*starLayer(s.zxy, 120., px, 2);
}

// A tone curve that rolls bright light off smoothly and leaves the dark end alone, applied to the colour's
// brightness and to each channel, then mixed: highlights whiten instead of clipping to a hard hue.
vec3 tone(vec3 c){
  float l = dot(c, vec3(.2126, .7152, .0722));
  vec3 a = 1. - exp(-c);
  vec3 b = c*((1. - exp(-l))/max(l, 1e-5));
  return mix(b, a, .65);
}
vec3 encode(vec3 c){ return mix(c*12.92, 1.055*pow(max(c, vec3(0.)), vec3(1./2.4)) - .055, step(.0031308, c)); }

void main(){
  vec2 uv = gl_FragCoord.xy/uRes;
  vec4 scene = texture(uScene, uv);
  vec3 d = normalize(uRayA + uRayB*gl_FragCoord.x + uRayC*gl_FragCoord.y);
  float px = length(uRayB)/length(uRayA);
  vec3 col = scene.rgb;
  if (scene.a > .002) col += stars(d, px)*scene.a*uStars.x;
  col += texture(uGlow, uv).rgb;

  // Glare: what a lens and an eye add around a small bright source. It falls off as the cube of the angle, so it
  // hugs the sun, with only a breath of veil further out.
  float ang = acos(clamp(dot(d, uSun), -1., 1.));
  float a3 = ang*ang*ang;
  float g = .05/(1. + a3/1.4e-7) + .00016/(1. + a3/5e-5) + .000014*exp(-ang/.3);
  col += uGlare*g;
  col *= uWhite;

  col *= uGrade.x*uFade;
  col = tone(col);
  float l = dot(col, vec3(.2126, .7152, .0722));
  col = mix(vec3(l), col, uGrade.z);
  col = mix(col, col*col*(3. - 2.*col), uGrade.y);
  col = encode(col);
  col = uInk + (1. - uInk)*col;
  // Triangular dither, one 8-bit step wide, plus a breath of grain that follows the brightness.
  vec3 r1 = hash3(ivec3(gl_FragCoord.xy, 3)), r2 = hash3(ivec3(gl_FragCoord.xy, 11));
  col += (r1 + r2 - 1.)*(1./255.)*(1. + uGrade.w*8.*(.3 + l));
  o = vec4(col, 1.);
}`;
