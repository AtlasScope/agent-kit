// The world itself: what the ground is and where the clouds are, as functions of a point on the globe. These run
// only in the bake passes (bake.ts), a few times a minute at most, so they can afford to be rich: dozens of octaves,
// warped domains, air wound into a storm. Each takes the footprint of the texel it is filling.
//
// The ground and the sky are separate pieces so that the lab can try another ground in place of this one
// (site/lab/worlds) without the homepage carrying it.

export const WORLD_HEAD = `
uniform vec4 uLand;        // continent scale, sea level, relief (km), coast raggedness
uniform vec4 uCold;        // xyz: the cold pole; w: the cosine of the ice cap's edge
uniform vec4 uIsle;        // xyz: where land is raised on purpose; w: its radius as an arc (0: nowhere)
uniform float uIsleRise;   // by how much
uniform vec4 uWeather;     // system scale, cover, tower growth, cirrus
uniform vec4 uDecks;       // cell size (km), cumulus over open sea, front strength, how much of the low cloud is quilted
uniform vec4 uStorm;       // xyz: the storm's centre on the globe; w: its radius as an arc, radians (0: no storm)
uniform vec4 uStormLook;   // spiral tightness, spare, arms, strength

struct Ground { float height; float tracer; float ice; float wind; float shore; float kind; };
struct Sky { float top; float density; float cirrus; float base; float dark; };

const float BASE = 0.9;    // km: where the low cloud sits

// Billows: cellular noise turned inside out and summed, so it reads as heaped-up rounded lumps. 0..1.
float billow(vec3 p, float fp){
  float s = 0., a = .5, norm = 0.;
  for (int i = 0; i < 4; i++) {
    float w = octave(fp*1.4);
    s += a*w*(1. - worley(p).x); norm += a;
    p = OCT*p*2.2 + 7.7; fp *= 2.2; a *= .56;
  }
  return s/norm;
}
// How thick cloud stands where a field has risen x above its threshold: steep at the rim, rounding off to flat a
// distance of span in. Thickness that falls to zero like this gives every cloud a shoulder instead of a cliff.
float dome(float x, float span){ return sqrt(sat(x/span)); }

`;

export const GROUND = `
// ---- The ground ------------------------------------------------------------------------------------------------
Ground ground(vec3 n, float fp){
  Ground g;
  float cs = uLand.x;
  vec3 q = n*cs + uSeed;
  float f = fp*cs;
  // Broad landmasses from a warped fractal: the warp is what makes peninsulas, gulfs and island arcs.
  vec3 w = vec3(fbm(q*1.3 + 31.7, f*1.3, 5), fbm(q*1.3 + 57.3, f*1.3, 5), fbm(q*1.3 + 83.9, f*1.3, 5));
  float shape = fbm(q + uLand.w*w, f, 6);
  float isle = uIsle.w > 0. ? exp(-sq(acos(clamp(dot(n, uIsle.xyz), -1., 1.))/uIsle.w)) : 0.;
  float land = shape - uLand.y + uIsleRise*isle*(.55 + .9*fbm(q*2.3 + 7., f*2.3, 5));   // above zero is dry
  // Relief at every scale below that, calmer in the lowlands.
  float detail = eroded(q*5. + 2.*w, f*5., 13);
  float chains = ridged(q*3.1 + 1.7*w + 11., f*3.1, 11);
  float inland = smoothstep(-.02, .22, land);
  float h = land*2.6 + detail*(.35 + 1.5*inland) + (chains*chains)*inland*uLand.z*.9;
  h += .12*detail;                                             // the coast itself stays ragged
  g.height = h*uLand.z*.42;                                    // km
  g.shore = 1. - smoothstep(0., .35, abs(g.height));           // near the waterline, either side
  g.kind = sat(.5 + .7*fbm(q*9. + 40. + 3.*w, f*9., 7));

  // Cold: the cap around the cold pole, the tops of mountains, and a ragged edge between.
  float cold = dot(n, uCold.xyz) - uCold.w + .05*fbm(q*4. + 71., f*4., 6) + max(g.height, 0.)*.02;
  float seaIce = smoothstep(0., .035, cold);
  // Pack ice: plates split by leads, breaking up toward open water.
  vec3 c = worley(n*520. + uSeed);
  float lead = smoothstep(.02, .11, c.y - c.x);
  float floes = smoothstep(.25, .6, fbm(q*60. + 17., f*60., 5)*.5 + .5 + cold*6.);
  float pack = seaIce*mix(1., lead, octave(fp*520.*1.5))*mix(floes, 1., smoothstep(.03, .12, cold));
  float snowLine = 1.6 - cold*60.;                             // km: lower toward the cold pole
  float snow = max(seaIce, smoothstep(snowLine - .5, snowLine + .6, g.height + .5*detail));
  g.ice = g.height < 0. ? pack : snow;

  // Sea colour: something carried by the currents (plankton, silt), pulled out into filaments by the eddies.
  vec3 p = normalize(n + curl(n, 7., uSeed)*.045);
  p = normalize(p + curl(p, 19., uSeed.yzx)*.018);
  p = normalize(p + curl(p, 47., uSeed.zxy)*.007);
  float bloom = fbm(p*13. + uSeed.yzx, fp*13., 5);
  float veins = 1. - abs(fbm(p*31. + 5.*bloom + uSeed.zxy, fp*31., 7));
  g.tracer = sat(smoothstep(.05, .5, bloom)*(.35 + .65*pow(veins, 5.)) + .5*g.shore*step(g.height, 0.));

  // Wind on the water, which sets how wide the sun's glitter is: gusty, streaked, calm in patches.
  g.wind = sat(.5 + .9*fbm(p*8. + 23., fp*8., 5) + .25*fbm(p*90., fp*90., 4));
  return g;
}

`;

export const SKY = `
// ---- The clouds ------------------------------------------------------------------------------------------------
// Cloud is what is left of a field of billows once the clear air has eaten into it: where the air is wet little is
// eaten and the heaps join into decks; where it is dry only their cores survive, as scattered cumulus. The same
// field, taller, gives the fronts and the towers. (The erosion idea is Schneider's, from the Nubis cloud system.)
Sky sky(vec3 n, float fp){
  Sky s;

  // The storm's own frame: distance from its centre in storm radii, and the air wound up around it. Sampling any
  // noise at the wound position draws it out along a logarithmic spiral, the same pitch at every radius.
  vec3 sc = normalize(uStorm.xyz + vec3(0., 1e-6, 0.));
  float on = step(1e-5, uStorm.w)*uStormLook.w;
  float d = acos(clamp(dot(n, sc), -1., 1.))/max(uStorm.w, 1e-5);
  float reach = (1. - smoothstep(1.2, 2.6, d))*on;
  float wound = -uStormLook.x*log(d + .07)*reach;
  vec3 p = turn(n, sc, wound);

  // Weather at the scale of whole systems: where the air is wet, where it folds into fronts, where it is unstable.
  float ws = uWeather.x;
  vec3 q = p*ws + uSeed.zxy*1.7;
  float f = fp*ws;
  vec3 w = vec3(fbm(q*.8 + 5.3, f*.8, 4), fbm(q*.8 + 9.1, f*.8, 4), fbm(q*.8 + 14.7, f*.8, 4));
  float syn = fbm(q + 1.4*w, f, 5);
  float fold = 1. - abs(fbm(q*.9 + 1.2*w + 3., f*.9, 5));
  float unstable = fbm(q*1.9 + 27. + w, f*1.9, 4);
  float regime = fbm(q*2.1 + 41., f*2.1, 4);

  // The storm gathers wet air into arms (bands of constant phase in the wound-up frame) and dries its centre.
  vec3 e1 = normalize(cross(sc, vec3(.31, .17, .93))), e2 = cross(sc, e1);
  float th = atan(dot(p, e2), dot(p, e1));
  float ragged = fbm(p*11. + uSeed, fp*11., 4);
  float arms = cos(uStormLook.z*th + 2.5*ragged);
  float stormWet = (.45*arms + .4)*(1. - smoothstep(.5, 1.8, d + .25*ragged))*on;
  float eye = mix(1., smoothstep(.035, .1, d + .02*ragged), on);

  float wet = syn*1.7 + smoothstep(.8, .97, fold)*.9*uDecks.z + uWeather.y + stormWet*1.1;

  // Smaller scales. The spiral is for the shape of the weather, not for each cloud in it: the heaps themselves are
  // sampled where they stand, nudged along a gentle flow, so they stay round while their fields follow the bands.
  // (Warps compound: a noise sampled through three of them is drawn into hair-fine filaments, which is the look
  // of marbled ink and not of cloud. So the middle scale gets the storm's wind-up and nothing more.)
  float mid = fbm(p*30. + uSeed.yzx, fp*30., 4);               // ~200 to 25 km
  vec3 pn = normalize(n + curl(n, 21., uSeed)*.006);
  pn = normalize(pn + curl(pn, 60., uSeed.yzx)*.002);
  float lumps = billow(pn*170. + uSeed, fp*170.);              // ~37 km heaps
  float puffs = billow(pn*1000. + 3.*uSeed, fp*1000.);         // ~6 km heaps
  float fine = fbm(pn*2800., fp*2800., 4);                     // ~2 km and under
  float fields = fbm(pn*75. + 9., fp*75., 4);                  // ~85 km: where the open sea carries cumulus

  // In some regimes the low cloud is a quilt of closed cells instead of loose heaps.
  float cs = RP/uDecks.x;
  vec3 cell = worley(pn*cs + uSeed + .35*vec3(fbm(pn*cs*2.3, fp*cs*2.3, 3), fbm(pn*cs*2.3 + 5., fp*cs*2.3, 3), fbm(pn*cs*2.3 + 9., fp*cs*2.3, 3)));
  float quilt = sqrt(sat((cell.y - cell.x)*2.2 + .25*puffs - .08));
  float decks = smoothstep(-.02, .14, regime)*uDecks.w;

  // Even dry air carries scattered cumulus in places; that is the floor under the weather.
  float amount = max(wet + .5*mid, -.3 + uDecks.y*(.2 + .5*fields));
  float dry = 1. - smoothstep(-.25, .15, amount);
  float shape = mix(mix(lumps, puffs, mix(.38, .8, dry)), mix(quilt, puffs, .25), decks*(1. - dry)) + .1*fine;
  float eaten = .82*(1. - sat(.22 + .78*amount));
  float body = remap(shape, eaten, 1.);
  body = max(body, sat(amount - .95)*.9)*eye;                  // deep in a system the deck closes over

  // How high it stands. Low cloud is about as thick as its heaps are wide; the wettest air stacks it deeper;
  // unstable air sends the cores of the biggest heaps up to the top of the weather, where they flatten out.
  float low = (.3 + 2.2*body)*(.6 + .8*puffs);
  float deep = 4.*smoothstep(.7, 1.5, amount)*(.35 + .9*lumps)*(.75 + .5*puffs);
  float core = sat(lumps*1.5 - .72 + .15*mid);
  float rise = uWeather.z*smoothstep(.0, .3, unstable + .25*wet - .12);
  float tower = 11.*rise*core*core*(3. - 2.*core)*(.8 + .28*puffs + .06*fine);
  float thick = (low + deep + tower)*smoothstep(0., .45, body);
  s.base = BASE;
  s.top = BASE + min(thick, CLOUD_TOP - BASE - .6 + .5*puffs);
  s.density = smoothstep(0., .2, body);
  s.dark = sat(amount - .6);

  // High, thin ice cloud combed out by the upper wind, and the storm's own outflow. Mostly it is not there.
  vec3 ph = normalize(p + curl(p, 4., uSeed.zxy + 3.)*.08);
  float streaks = ridged(ph*24. + 4.*w, fp*24., 7);
  float sheet = fbm(ph*6. + w + 51., fp*6., 5);
  float veil = sat((streaks - .5)*2.2)*smoothstep(.05, .4, sheet + .3*syn);
  float outflow = (1. - smoothstep(.45, 1.4, d))*smoothstep(.2, .55, d)*on*sat((streaks - .3)*1.6);
  s.cirrus = sat(veil + .6*outflow)*uWeather.w;
  return s;
}
`;
