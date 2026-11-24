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

// A browser on Windows hands the graphics driver HLSL, whose compiler copies a function's whole body into every
// place it is called. The fractal sums are long, and the generators call them dozens of times, which took seconds
// to compile before the first frame. So the independent sums of each stage are set up in arrays and taken in one
// loop, with one call: the same numbers, a fraction of the shader.


`;

export const GROUND = `
// ---- The ground ------------------------------------------------------------------------------------------------
Ground ground(vec3 n, float fp){
  Ground g;
  float cs = uLand.x;
  vec3 q = n*cs + uSeed;
  float f = fp*cs;
  // Broad landmasses from a warped fractal: the warp is what makes peninsulas, gulfs and island arcs.
  vec3 w;
  for (int i = 0; i < 3 + uZ; i++) w[i] = fbm(q*1.3 + vec3(31.7, 57.3, 83.9)[i], f*1.3, 5);
  // The sums that need only q and the warp: the land's shape, the island's, the kind of ground, the cold's ragged
  // edge, and the floes.
  vec3 at[5] = vec3[5](q + uLand.w*w, q*2.3 + 7., q*9. + 40. + 3.*w, q*4. + 71., q*60. + 17.);
  float scale[5] = float[5](1., 2.3, 9., 4., 60.);
  int octs[5] = int[5](6, 5, 7, 6, 5);
  float got[5];
  for (int i = 0; i < 5 + uZ; i++) got[i] = fbm(at[i], f*scale[i], octs[i]);
  float shape = got[0];
  float isle = uIsle.w > 0. ? exp(-sq(acos(clamp(dot(n, uIsle.xyz), -1., 1.))/uIsle.w)) : 0.;
  float land = shape - uLand.y + uIsleRise*isle*(.55 + .9*got[1]);   // above zero is dry
  // Relief at every scale below that, calmer in the lowlands.
  float detail = eroded(q*5. + 2.*w, f*5., 13);
  float chains = ridged(q*3.1 + 1.7*w + 11., f*3.1, 11);
  float inland = smoothstep(-.02, .22, land);
  // Heights like Earth's: lowlands of a few hundred metres, ranges of three or four kilometres, and only their
  // summits above the snow line. (Raised further, the whole island stood above it as one smooth white sheet.)
  float h = land*.8 + detail*(.3 + 1.1*inland) + (chains*chains)*inland*uLand.z*.5;
  h += .1*detail;                                              // the coast itself stays ragged
  g.height = h*uLand.z*.22;                                    // km
  g.shore = 1. - smoothstep(0., .35, abs(g.height));           // near the waterline, either side
  g.kind = sat(.5 + .7*got[2]);

  // Cold: the cap around the cold pole, the tops of mountains, and a ragged edge between.
  float cold = dot(n, uCold.xyz) - uCold.w + .05*got[3] + max(g.height, 0.)*.02;
  float seaIce = smoothstep(0., .035, cold);
  // Pack ice: plates split by leads, breaking up toward open water.
  vec3 c = worley(n*520. + uSeed);
  float lead = smoothstep(.02, .11, c.y - c.x);
  float floes = smoothstep(.25, .6, got[4]*.5 + .5 + cold*6.);
  float pack = seaIce*mix(1., lead, octave(fp*520.*1.5))*mix(floes, 1., smoothstep(.03, .12, cold));
  float snowLine = 1.6 - cold*60.;                             // km: lower toward the cold pole
  float snow = max(seaIce, smoothstep(snowLine - .5, snowLine + .6, g.height + .5*detail));
  g.ice = g.height < 0. ? pack : snow;

  // Sea colour: something carried by the currents (plankton, the stuff that lights up at night), sheared by the
  // zonal currents and drawn out by eddies inside eddies. Each warp is sampled through the last, so it compounds
  // into marbled filaments: the abstract ink direction's own technique, kept here for the sea alone, where it is
  // what the real thing looks like (a plankton bloom seen from orbit is marbled exactly so).
  vec3 axis = normalize(vec3(-.32, .9, -.29));
  float lat = asin(clamp(dot(n, axis), -1., 1.));
  vec3 p = turn(n, axis, .035*(sin(lat*21. + uSeed.x) + .5*sin(lat*47. + uSeed.y)));
  vec3 offs[3] = vec3[3](uSeed, uSeed.yzx, uSeed.zxy);
  float cf[5] = float[5](5., 13., 33., 85., 210.), ca[5] = float[5](.05, .024, .0105, .0042, .0017);
  for (int i = 0; i < 5 + uZ; i++) p = normalize(p + curl(p, cf[i], offs[i - 3*(i/3)])*ca[i]);
  vec3 at2[3] = vec3[3](p*11. + uSeed.yzx, p*8. + 23., p*90.);
  float scale2[3] = float[3](11., 8., 90.);
  int octs2[3] = int[3](5, 5, 4);
  float got2[3];
  for (int i = 0; i < 3 + uZ; i++) got2[i] = fbm(at2[i], fp*scale2[i], octs2[i]);
  float bloom = got2[0];
  float veins = 1. - abs(fbm(p*29. + 4.*bloom + uSeed.zxy, fp*29., 7));
  float threads = pow(sat(veins), 6.);
  g.tracer = sat(smoothstep(-.05, .45, bloom)*(.25 + .75*threads) + .2*g.shore*g.shore*step(g.height, 0.));

  // Wind on the water, which sets how wide the sun's glitter is: gusty, streaked, calm in patches.
  g.wind = sat(.5 + .9*got2[1] + .25*got2[2]);
  return g;
}

`;

export const SKY = `
// ---- The clouds ------------------------------------------------------------------------------------------------
// Weather is drawn in three moves.
//
// 1. The air is carried. A slowly varying wind (the curl of a broad noise, so it neither piles up nor thins out)
//    and the storm's own whirl are followed backward from each point for a while, and every field below is read
//    where the air came from. Shear draws wet air into the long sweeps, hooks and filaments of real weather; calm
//    air keeps its round shapes. This is what a photograph of Earth from orbit is full of, and what static noise,
//    however warped, does not make.
// 2. Where cloud may be is decided at the scale of whole systems, from that carried air.
// 3. What it is made of is decided where it stands: heaps of many sizes (cellular domes whose size and presence
//    each cell draws for itself, so no two neighbours repeat), lined up into streets along the wind, eaten away by
//    the dry air around them (the erosion idea is Schneider's, from Guerrilla's Nubis cloud system).

// The wind at a point of the unit sphere, in radians of arc per unit of time: the broad flow, and the storm's whirl.
vec3 wind(vec3 n, vec3 sc, float on){
  vec3 g = gnoise(n*uWeather.x*.55 + uSeed.yzx*.37).xyz;
  vec3 w = cross(n, g)*.012;
  // A vortex: fast near the eye, falling off outside, and drawing air inward a little, which winds the bands into a
  // spiral instead of rings.
  vec3 r = n - sc*dot(n, sc);
  float d = length(r)/max(uStorm.w, 1e-5);
  float v = d/(.06 + d*d*d)*on;
  w += (cross(sc, n)*v - r*v*.35/max(d, 1e-3))*uStorm.w*.11*uStormLook.x;
  return w;
}

// Heaps: a rounded dome over each point of a cellular field, the tallest one winning where they overlap. Each
// point draws its own size and whether it holds a heap at all, so neighbours never repeat; and since every dome
// is gone before the next cell's points could miss it, the field has no seams where cells meet.
float heaps(vec3 p, float fill){
  vec3 i = floor(p), f = p - i;
  ivec3 I = ivec3(i);
  float best = 0.;
  for (int z = -1; z <= 1 + uZ; z++) for (int y = -1; y <= 1 + uZ; y++) for (int x = -1; x <= 1 + uZ; x++) {
    ivec3 o = ivec3(x, y, z);
    vec3 h = hash3(I + o + 311);
    if (h.z > fill) continue;
    vec3 r = vec3(o) + hash3(I + o) - f;
    float size = .45 + .55*h.x;
    float u = sat(1. - dot(r, r)/(size*size));
    best = max(best, u*u*(.55 + .45*h.y)*(3. - 2.*u)*1.1);
  }
  return sat(best);
}

Sky sky(vec3 n, float fp){
  Sky s;
  vec3 sc = normalize(uStorm.xyz + vec3(0., 1e-6, 0.));
  float on = step(1e-5, uStorm.w)*uStormLook.w;

  // 1. Where this air was some while ago: steps backward along the wind.
  vec3 p = n, dir = vec3(0.);
  for (int i = 0; i < 10 + uZ; i++) { vec3 v = wind(p, sc, on); if (i == 0) dir = v; p = normalize(p - v); }
  // How much the air here has been stretched: far-travelled air is streaky.
  float travel = length(p - n);

  // 2. Weather at the scale of systems, read where the air came from.
  float ws = uWeather.x;
  vec3 q = p*ws + uSeed.zxy*1.7;
  float f = fp*ws;
  vec3 w;
  for (int i = 0; i < 3 + uZ; i++) w[i] = fbm(q*.8 + vec3(5.3, 9.1, 14.7)[i], f*.8, 4);
  // Read nearer where it stands (step 3, below): the shapes of the heaps follow the carried air only a little, or
  // every cloud would be drawn into a hair.
  vec3 pm = normalize(mix(n, p, .35));
  vec3 at[5] = vec3[5](q*1.1 + .9*w, q*.9 + 1.2*w + 3., q*1.9 + 27. + w, q*2.1 + 41., pm*34. + uSeed.yzx + 2.*w);
  float scale[5] = float[5](1.1, .9, 1.9, 2.1, 34./ws);
  int octs[5] = int[5](6, 5, 4, 4, 5);
  float got[5];
  for (int i = 0; i < 5 + uZ; i++) got[i] = fbm(at[i], f*scale[i], octs[i]);
  float syn = got[0];
  float fold = 1. - abs(got[1]);
  float unstable = got[2];
  float regime = got[3];

  // The storm: arms where the carried air was wet, a dense wall round a clear eye.
  float d = acos(clamp(dot(n, sc), -1., 1.))/max(uStorm.w, 1e-5);
  float wall = exp(-sq((d - .055)/.04))*on;
  float eye = mix(1., smoothstep(.018, .04, d + .01*syn), on);
  float core = (1. - smoothstep(.2, 1.1, d))*on;

  // Its arms: bands of constant phase along a logarithmic spiral (the shape every cyclone's rain bands take), in the
  // carried air so they come out ragged and uneven.
  vec3 e1 = normalize(cross(sc, vec3(.31, .17, .93))), e2 = cross(sc, e1);
  float th = atan(dot(p, e2), dot(p, e1));
  float phase = uStormLook.z*th + uStormLook.x*2.4*log(d + .05) + 2.2*syn;
  float arms = smoothstep(-.2, .9, cos(phase))*(1. - smoothstep(.25, 1.6, d))*on;
  float wet = syn*1.5 + smoothstep(.8, .97, fold)*.7*uDecks.z + uWeather.y + 1.1*arms - .35*core*(1. - arms) + .8*wall;

  // 3. What the cloud is made of.
  float mid = got[4];                                                      // ~190 to 12 km: the texture of a deck
  // Streets: heaps strung out along the wind. Squash space across the flow so the noise is long along it.
  float speed = length(dir);
  vec3 t = speed > 1e-6 ? dir/speed : vec3(1., 0., 0.);
  vec3 pc = pm*110.;
  float along = dot(pc, t);
  vec3 pn = normalize(pm + curl(pm, 23., uSeed)*.004);
  vec3 ph = normalize(p + curl(p, 4., uSeed.zxy + 3.)*.06);
  float cs = RP/uDecks.x;
  // The rest of the sums: the streets, the finest texture, the quilt's wobble, where open sea carries cumulus, and
  // the sheet the high cloud lies in.
  vec3 at3[6] = vec3[6](pc + t*along*-.72 + uSeed, pn*3200., pn*cs*2.1 + 5., pn*cs*2.1 + 9., pn*60. + 9., ph*6. + w + 51.);
  float scale3[6] = float[6](110., 3200., cs*2.1, cs*2.1, 60., 6.);
  int octs3[6] = int[6](5, 3, 3, 3, 4, 5);
  float got3[6];
  for (int i = 0; i < 6 + uZ; i++) got3[i] = fbm(at3[i], fp*scale3[i], octs3[i]);
  float streets = smoothstep(.45, .95, 1. - abs(got3[0]));
  // Heaps at three sizes, each cell its own size: ~45, ~14 and ~4 km. Each size is looked up through a warp of
  // about its own size, which turns circles into cauliflowers.
  vec3 kw = gnoise(pn*300. + 3.1).xyz, kw2 = gnoise(pn*1100. + 8.7).xyz;
  vec3 hp[3] = vec3[3](pn*140. + uSeed + .3*kw, pn*450. + uSeed.zxy + .35*kw2 + .2*kw, pn*1500. + uSeed.yzx + .4*kw2);
  float hfill[3] = float[3](.85, .9, .95);
  float hs[3];
  for (int i = 0; i < 3 + uZ; i++) hs[i] = heaps(hp[i], hfill[i]);
  float big = hs[0], med = hs[1], small = hs[2]*octave(fp*1500.);
  float fine = got3[1]*octave(fp*800.);

  // In some regimes the low cloud is a quilt of closed cells instead of loose heaps.
  vec3 cell = worley(pn*cs + uSeed + .45*vec3(mid, got3[2], got3[3]));
  float quilt = sqrt(sat((cell.y - cell.x)*2.4 + .2*med - .06));
  float decks = smoothstep(-.05, .15, regime)*uDecks.w;

  // Even dry air carries scattered cumulus in places; that is the floor under the weather.
  float amount = wet + .55*mid - .2*travel*ws;
  float fields = got3[4];
  amount = max(amount, -.35 + uDecks.y*(.25 + .6*fields));
  float dry = 1. - smoothstep(-.3, .2, amount);
  float heap = max(big*.9, max(med*.75, small*.55)) + .25*big*med;
  float loose = mix(heap, max(heap, streets*.8), smoothstep(.1, .5, speed*40.)*(1. - decks)*.7);
  float shape = mix(loose, mix(quilt, loose, .3), decks*(1. - dry)) + .5*mid + .08*fine;
  float eaten = .95*(1. - sat(.1 + .7*amount));
  // Edges are eaten hardest: fine detail bites into a cloud's thin margin and hardly touches its core.
  float bite = (.55*med + .45*small + .3*fine)*(1. - smoothstep(eaten, eaten + .5, shape));
  float body = remap(shape - .35*bite, eaten, eaten + .55);
  body = max(body, sat(amount - 1.1)*(.85 + .15*mid))*eye;               // deep in a system the deck closes over

  // How high it stands. Low cloud is about as thick as its heaps are wide; the wettest air stacks it deeper;
  // unstable air sends the biggest heaps up to the top of the weather, where they flatten into anvils.
  // The heaps shape the top only a little: from orbit a deck is a few kilometres deep over tens of kilometres, and
  // the small heaps are its texture, not its relief.
  float low = (.35 + 1.1*body)*(.75 + .3*big + .18*med + .06*small);
  float deep = 2.*smoothstep(.6, 1.6, amount)*(.45 + .6*big)*(.9 + .15*med);
  float rise = uWeather.z*smoothstep(0., .3, unstable + .25*wet - .1);
  float towerCore = sat(big*1.6 - .75 + .2*mid);
  float tower = 4.*rise*towerCore*towerCore*(.75 + .25*med) + 2.5*wall*(.7 + .3*big);
  float thick = (low + deep + tower)*body*body*(3. - 2.*body);
  s.base = BASE;
  s.top = BASE + min(thick, CLOUD_TOP - BASE - .6 + .5*med);
  // Thin where the deck is young or the heaps are sparse, so the sea shows through it in places.
  s.density = smoothstep(0., .3, body)*(.55 + .45*smoothstep(.15, .75, body + .3*med + .2*big + .15*sat(amount - .4)));
  s.dark = sat(amount - .6);

  // High, thin ice cloud combed out by the upper wind, and the storm's own outflow.
  float streaks = ridged(ph*24. + 4.*w, fp*24., 7);
  float sheet = got3[5];
  // Mostly gaps: only the crests of the streaks survive, as the long thin wisps that comb across a photograph.
  float veil = sat((streaks - .58)*3.2)*smoothstep(.15, .5, sheet + .3*syn)*(.6 + .4*sat(streaks*2. - .9));
  float outflow = (1. - smoothstep(.5, 1.5, d))*smoothstep(.25, .6, d)*on*sat((streaks - .3)*1.6);
  s.cirrus = sat(veil + .6*outflow)*uWeather.w;
  return s;
}
`;
