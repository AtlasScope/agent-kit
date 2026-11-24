// The directions that were tried against the one the homepage uses. They live here, in the lab, so the homepage
// never downloads them: open the lab with ?world=day or ?world=ink to see each, and compare with the default. All
// three are drawn by the same renderer, clouds, air, aurora and grade, so they compare like for like.
//
//   (default)  First light, the hybrid. A physically lit ocean world at the moment the sun breaks the horizon,
//              moonlit weather, an aurora on the dark limb; and in the night sea, currents marbled with the ink
//              direction's own compounding warps, glowing faintly in the site's green.
//   day        The physically inspired one: the same planet in full daylight under Earth's own air. White cloud,
//              blue sea, a wide sun glitter. Closest to the photograph it replaces, and to every other picture
//              of Earth from orbit.
//   ink        The abstract one: no sea, no land, no weather. The whole globe is a slow fluid in bands, marbled by
//              its own turbulence and polished like cut stone, here under the same sunrise and aurora.
import type { Params } from "../components/orbit/index";

export type World = { look: Partial<Params>; ground?: string; surface?: string };

const DAY: World = {
  look: {
    sunBearing: 28, sunHeight: 22, moonLight: 0, moonAir: 0, aurora: 0, airglow: 0, seaGlow: 0,
    rayleigh: 1, mie: 1, ozone: 1, mieG: 0.8, multi: 0.5, skyFill: 0.5,
    exposure: 1.5, warmth: 0.25, contrast: 0.5, saturation: 1.1, split: 0.35, cover: -0.1, coldCap: 6,
    dawn: 0.06, aureole: 0, bloom: 0.03,
  },
};

// ---- Ink ---------------------------------------------------------------------------------------------------------
// The ground pass's outputs are reused with other meanings: height is the relief of the fluid's surface (always
// above "sea level", so the scene treats it all as solid), tracer is how much pale pigment there is, ice is the
// bright thread along the shear lines, wind is how polished the surface is, kind is a slow drift of hue.
const INK_GROUND = `
Ground ground(vec3 n, float fp){
  Ground g;
  // The fluid turns about a tilted axis in bands, each carried round by a different amount, which shears whatever
  // is in it into long chevrons.
  vec3 axis = normalize(vec3(-.42, .52, -.74));
  float lat = asin(clamp(dot(n, axis), -1., 1.));
  float jet = sin(lat*23. + uSeed.x) + .55*sin(lat*51. + 1.3 + uSeed.y) + .25*sin(lat*113. + uSeed.z);
  vec3 p = turn(n, axis, .11*jet);
  // Storms: a few ovals where it winds up on itself.
  vec3 c1 = normalize(uIsle.xyz + vec3(0., 1e-6, 0.));
  float d1 = acos(clamp(dot(p, c1), -1., 1.))/max(uIsle.w*.45, 1e-4);
  p = turn(p, c1, -3.2*log(d1 + .08)*(1. - smoothstep(.9, 2.2, d1))*step(1e-5, uIsle.w));
  // Turbulence on turbulence: each warp is sampled through the last, so the pigment is drawn into filaments. (This
  // is the compounding the cloud generator has to avoid; here it is the point.)
  p = normalize(p + curl(p, 6., uSeed)*.05);
  p = normalize(p + curl(p, 15., uSeed.yzx)*.022);
  p = normalize(p + curl(p, 39., uSeed.zxy)*.009);
  p = normalize(p + curl(p, 97., uSeed)*.0035);
  // Coordinates that run along the bands, so detail is long that way and fine across.
  vec3 e1 = normalize(cross(axis, vec3(.3, .2, .9))), e2 = cross(axis, e1);
  float lon = atan(dot(p, e2), dot(p, e1)), la = asin(clamp(dot(p, axis), -1., 1.));
  vec3 q = vec3(cos(lon)*2.2, sin(lon)*2.2, la*17.) + uSeed*.1;
  float f = fp*17.;
  float broad = fbm(q, f, 5);
  float fine = fbm(q*4.3 + 2.*broad, f*4.3, 7);
  float thread = 1. - abs(fbm(q*2.1 + 9., f*2.1, 6));
  float bands = .5 + .5*sin(la*38. + 3.*broad + 1.2*fine);
  g.tracer = sat(.62*bands + .55*broad + .28*fine + .04);
  g.ice = pow(sat(thread), 9.)*sat(.6 + broad);
  g.kind = sat(.5 + .9*fbm(q*.45 + 31., f*.45, 4));
  g.wind = sat(.35 + .5*fine + .3*broad);
  g.shore = 0.;
  g.height = .6 + 1.1*g.tracer + .12*fine + .3*g.ice;
  return g;
}
`;

const INK_SURFACE = `
vec3 shadeGround(vec3 n, vec3 v){
  vec2 uv = mapUV(n);
  vec4 A = textureLod(uSurfA, uv, uLod), B = textureLod(uSurfB, uv, uLod);
  float mu = dot(n, uSun), muM = dot(n, uMoon);
  vec3 sun = sunlight(RP, mu), moon = uMoonFill*sunlight(RP, muM), sky = skylight(RP, mu);
  vec3 ePhi, eA; mapFrame(n, ePhi, eA);
  vec2 s = unpackSlope(textureLod(uSurfB, uv, uLod + 1.5).rg)*1.4;
  vec3 N = normalize(n - s.x*ePhi - s.y*eA);
  // Pigment: obsidian through midnight and cobalt to a glacial silver, with the threads a cold green.
  float t = A.g;
  vec3 ink = mix(vec3(.002, .003, .006), vec3(.008, .022, .07), smoothstep(.12, .4, t));
  ink = mix(ink, vec3(.02, .09, .32), smoothstep(.38, .62, t)*(.55 + .45*B.a));
  ink = mix(ink, vec3(.5, .58, .66), smoothstep(.66, .9, t));
  ink = mix(ink, vec3(.05, .5, .34), A.b*.8);
  vec3 col = ink*(sun*sat(dot(N, uSun)) + moon*sat(dot(N, uMoon)) + sky*(.6 + .4*dot(N, n)));
  // Polished: a tight sheen that follows the relief.
  float m2 = mix(.02, .07, A.a);
  col += (sun*glitter(N, v, uSun, m2) + moon*glitter(N, v, uMoon, m2))*(.25 + .75*t);
  // The threads glow a little on the night side.
  col += vec3(.02, .5, .36)*uSeaGlow.g*A.b*(1. - smoothstep(-.14, 0., mu));
  return col;
}
`;

const INK: World = {
  ground: INK_GROUND,
  surface: `
// The glitter of a light on a polished surface (the Beckmann facet model, as for the sea).
float glitter(vec3 n, vec3 v, vec3 l, float m2){
  float nv = max(dot(n, v), 1e-3), nl = dot(n, l);
  if (nl <= 0.) return 0.;
  vec3 hv = normalize(v + l);
  float nh = max(dot(n, hv), 1e-3), vh = max(dot(v, hv), 1e-3), nh2 = nh*nh;
  float D = exp(-(1. - nh2)/(nh2*m2))/(PI*m2*nh2*nh2);
  float F = .04 + .96*pow(1. - vh, 5.);
  float G = min(1., 2.*nh*min(nv, nl)/vh);
  return D*F*G/(4.*nv)*PI;
}
${INK_SURFACE}`,
  look: {
    cover: -4, cumulus: 0, cirrus: 0, stormStrength: 0, isleX: 1500, isleY: 900, isleRadius: 900,
    moonLight: 0.1, seaGlow: 0.05,
    rayleigh: 0.4, mie: 1.2, ozone: 0.4, multi: 0.15, exposure: 4, warmth: 0.45, contrast: 0.5,
  },
};

export const WORLDS: Record<string, World> = { day: DAY, ink: INK };
