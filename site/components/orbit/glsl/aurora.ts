// The aurora, drawn on its own at half the scene's size and added in the last pass. It is soft light a long way
// off, so half size costs it nothing the eye can see, and it is the dearest thing per pixel in the picture: on
// its own it can be given a quarter of the pixels.
import { ATMOSPHERE_GLSL } from "../atmosphere";
import { COMMON, HEADER } from "./common";

export const AURORA = `${HEADER}${COMMON}${ATMOSPHERE_GLSL}
uniform vec3 uCam, uRayA, uRayB, uRayC;     // ray through a pixel = normalize(A + B*x + C*y)
uniform float uTime;
uniform vec4 uAurora;                       // xyz: the magnetic pole; w: the oval's distance from it, radians
uniform vec3 uAuroraE1, uAuroraE2;          // the axes longitude is measured in about that pole, zero toward the camera
uniform vec4 uAuroraLook;                   // brightness, curtain width (radians), rays per radian, spare
uniform vec2 uAuroraSheets[3];              // each curtain: its offset from the oval (curtain widths), its brightness
uniform vec4 uSurge;                        // the stretch where it is brightest: bearing from the camera's nadir, width (radians), the rest's share
out vec4 o;

// A smooth random function of one variable, and a few octaves of it. The hash is integer, so it holds its
// precision however far along the oval the argument runs.
float hash11(float x){ uint h = uint(int(floor(x)) + 65536)*747796405u + 2891336453u; h = ((h >> ((h >> 28u) + 4u)) ^ h)*277803737u; return float((h >> 22u) ^ h)*(1./4294967295.); }
float vnoise(float x){ float i = floor(x), f = x - i; f = f*f*(3. - 2.*f); return mix(hash11(i), hash11(i + 1.), f); }
float vfbm(float x){ return .5*vnoise(x) + .28*vnoise(x*2.13 + 7.) + .15*vnoise(x*4.41 + 3.) + .07*vnoise(x*9.2 + 1.); }
// erf, to about 1e-5 (Abramowitz and Stegun 7.1.25).
float erf(float x){
  float a = abs(x), t = 1./(1. + .47047*a);
  return sign(x)*(1. - t*(.3480242 + t*(-.0958798 + t*.7478556))*exp(-a*a));
}

// The aurora is a few thin curtains standing on an oval round the magnetic pole, a hundred kilometres up and more.
// Each curtain's place across it (in curtain-widths, zero at its middle) and along it (longitude) at a point.
// The curtains fold, and the folds travel: long waves drift slowly one way, tighter kinks run faster the other and
// grow and fade as they go, which is how a real curtain seems to pour along itself. Each sheet folds its own way.
vec2 curtain(vec3 q, float k){
  vec3 n = normalize(q);
  float colat = acos(clamp(dot(n, uAurora.xyz), -1., 1.));
  float lon = atan(dot(n, uAuroraE2), dot(n, uAuroraE1));
  float t = uTime + 37.*k;
  float fold = .028*sin(lon*5. + t*.018 + 1.3*k) + .013*sin(lon*13. - t*.031 + 1.7 + k)
             + (.007*sin(lon*31. + t*.07 + .6) + .0032*sin(lon*73. - t*.13 + 2.1*k))*(.5 + vnoise(lon*3. - t*.02 + 9.*k))
             + .0012*sin(lon*170. + t*.3 + 4.*k);
  return vec2((colat - uAurora.w - fold)/uAuroraLook.y - uAuroraSheets[int(k)].x, lon);
}

// How bright a curtain is at a place along it and a height above the ground, and its colour. The rays are bundles
// of brighter streaks that clump, drift along the curtain and stand at their own heights; between them the curtain
// is a faint veil. The lower edge is sharp and not quite level; the green of oxygen fades upward over a height that
// is greater in the bright rays, with oxygen's red far above and nitrogen's magenta fringe at the foot.
vec3 emission(float lon, float z, float k, float spread){
  float t = uTime;
  float x = lon*uAuroraLook.z;
  float flow = t*(.09 + .05*k);
  float bundle = smoothstep(.25, .85, vfbm(lon*9. - t*.012 + 5.*k));
  float streak = vfbm(x + flow + 1.7*vnoise(x*.11 - t*.03 + k));
  streak = streak*streak*2.6;
  // Seen along the curtain, many rays lie behind each other and blur into a sheet.
  float sharp = sat(.8/(spread + .1));
  float rays = mix(.45*(.3 + bundle), (.04 + streak)*(.15 + 1.3*bundle), sharp);
  float foot = 100. + 7.*(vnoise(lon*21. + 3.*k + t*.01) - .5) - 4.*bundle;
  float h = z - foot;
  float lift = 25. + 90.*streak*bundle;
  // A bright ribbon along the foot that traces every fold, and the rays standing on it.
  float ribbon = (.25 + .75*bundle)*mix(.8, .5 + .7*streak, sharp)*exp(-max(h, 0.)/(9. + 6.*bundle));
  float green = smoothstep(-2.5, 1.5, h)*(ribbon + rays*exp(-max(h, 0.)/lift))*(1. - smoothstep(230., 310., z));
  float red = smoothstep(60., 140., h)*exp(-max(h - 150., 0.)/80.)*(.05 + .1*bundle);
  float magenta = smoothstep(-3., 0., h)*(1. - smoothstep(0., 5., h))*(.35 + .5*bundle);
  return green*vec3(.08, 1., .38) + (rays + .3*bundle)*(red*vec3(1., .1, .22)*(1. - smoothstep(280., 320., z)) + magenta*vec3(.75, .2, 1.));
}

// Its light along the ray between t0 and t1. The curtain is far thinner than a step, so each step integrates the
// Gaussian across it exactly (the error function) instead of sampling it, and reads the curtain's height and rays
// at the point where the ray actually passes through. No banding; a sharp lower edge; and the brightening where
// the ray runs along a fold comes out by itself.
vec3 aurora(vec3 d, float t0, float t1, float jit){
  // Most rays come nowhere near the oval. Say so from the distance to the pole alone, at both ends and the middle,
  // before anything dearer is worked out. (.075: as far as the folds and the outer sheets reach.)
  vec3 far = vec3(dot(normalize(uCam + d*t0), uAurora.xyz), dot(normalize(uCam + d*(.5*(t0 + t1))), uAurora.xyz), dot(normalize(uCam + d*t1), uAurora.xyz));
  far = acos(clamp(far, -1., 1.)) - uAurora.w;
  if (min(min(abs(far.x), abs(far.y)), abs(far.z)) > .075 && far.x*far.z > 0. && far.x*far.y > 0.) return vec3(0.);
  // Of a path that may be thousands of kilometres long, only a stretch passes near the oval. Find it with a cheap
  // look along the whole path, then spend every step there: the folds are a few hundred kilometres long, and steps
  // much longer than that draw them as zigzags.
  const int M = 32;
  float first = -1., last = -1.;
  for (int i = 0; i <= M + uZ; i++) {
    float ti = t0 + (t1 - t0)*float(i)/float(M);
    if (abs(acos(clamp(dot(normalize(uCam + d*ti), uAurora.xyz), -1., 1.)) - uAurora.w) < .075) { if (first < 0.) first = float(i); last = float(i); }
  }
  if (first < 0.) return vec3(0.);
  float span0 = (t1 - t0)/float(M);
  t1 = t0 + span0*min(last + 1., float(M));
  t0 = t0 + span0*max(first - 1., 0.);
  const int N = 18;
  float dt = (t1 - t0)/float(N);
  // The grid of steps starts at a different place for each pixel, so what error the steps leave is fine grain
  // instead of teeth that line up from pixel to pixel.
  t0 -= dt*jit;
  vec3 sum = vec3(0.);
  for (int k = 0; k < 3 + uZ; k++) {
    float kk = float(k), wgt = uAuroraSheets[k].y;
    if (wgt <= 0.) continue;
    vec2 c0 = curtain(uCam + d*t0, kk);
    for (int i = 0; i < N + 1 + uZ; i++) {
      float ta = t0 + dt*float(i);
      vec3 qb = uCam + d*(ta + dt);
      // The same cheap test for each step: far from the oval, there is nothing in it and no need for the rest.
      float away = (acos(clamp(dot(normalize(qb), uAurora.xyz), -1., 1.)) - uAurora.w)/uAuroraLook.y - uAuroraSheets[k].x;
      if (abs(away) > .075/uAuroraLook.y && away*c0.x > 0. && abs(c0.x) > 14.) { c0 = vec2(away, c0.y); continue; }
      vec2 c1 = curtain(qb, kk);
      float a = c0.x, b = c1.x, span = b - a;
      float along = abs(span) > 1e-3 ? .8862*(erf(b) - erf(a))/span : exp(-a*a);
      if (along > 1e-4) {
        // Where in this step the ray is nearest the middle of the sheet. If it passes right through, close in on
        // the crossing: the rays are a few kilometres apart, and a rough position would make them zigzag.
        float spread = abs(c1.y - c0.y)*uAuroraLook.z*min(1., 2./max(abs(span), 1e-3));
        // A ray that crosses the sheet takes its light from the crossing, closed in on by halving the step. One that
        // skims it without crossing passes a long stretch of it, over a range of heights: the light at the ends and
        // the middle of the step is weighed by how near each is to the sheet. (Both go through one loop with one
        // call of emission(): a browser on Windows compiles every call of a function as a copy of it.)
        bool crossing = a*b < 0.;
        float tx = ta;
        if (crossing) {
          float lo = ta, hi = ta + dt, flo = a;
          for (int j = 0; j < 6 + uZ; j++) {
            float m = .5*(lo + hi), fm = curtain(uCam + d*m, kk).x;
            if (fm*flo < 0.) hi = m; else { lo = m; flo = fm; }
          }
          tx = .5*(lo + hi);
        }
        vec3 e = vec3(0.);
        float wsum = 0.;
        for (int s = 0; s < 3 + uZ; s++) {
          if (crossing && s > 0) break;
          vec3 q = uCam + d*(crossing ? tx : ta + .5*dt*float(s));
          vec2 c = curtain(q, kk);
          float w = crossing ? 1. : exp(-c.x*c.x);
          e += w*emission(c.y, length(q) - RP, kk, spread);
          wsum += w;
        }
        e /= max(wsum, 1e-6);
        // An aurora is seldom even along its oval: a surge lights one stretch of it and the rest is a fainter
        // arc. The stretch is placed by its bearing seen from above the camera.
        float off = atan(qb.x, -qb.z) - uSurge.x;
        off -= 6.2831853*floor(off/6.2831853 + .5);
        sum += wgt*along*dt*e*mix(uSurge.z, 1., exp(-sq(off/uSurge.y)));
      }
      c0 = c1;
    }
  }
  return sum*uAuroraLook.x;
}

void main(){
  vec3 d = normalize(uRayA + uRayB*gl_FragCoord.x + uRayC*gl_FragCoord.y);
  float b = -dot(uCam, d);
  vec3 l = uCam + b*d;
  float l2 = dot(l, l);
  vec3 col = vec3(0.);
  float jit = fract(52.9829189*fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715))));   // interleaved gradient noise
  // The curtains stand between 90 and 320 km. On the near side of the planet nothing dims them. On the far side
  // of its edge they are seen through the whole depth of the air, like a star, or not at all behind the ground.
  float RO = RP + 320., RI = RP + 90., dO = RO*RO - l2, dI = RI*RI - l2;
  // Up to two stretches of the ray to look along, the near one and the one beyond the planet's edge, walked by one
  // call of aurora() in a loop (see emission() above for why one call).
  if (b > 0. && dO > 0.) {
    float qO = sqrt(dO), qI = sqrt(max(dI, 0.));
    vec3 through = vec3(0.);
    if (dI > 0. && l2 > RP*RP) { float above; through = extinction(2.*columnsTo(sqrt(l2), 0., above)); }
    int parts = dI > 0. && through.g > .003 ? 2 : 1;
    for (int s = 0; s < 2 + uZ; s++) {
      if (s >= parts) break;
      float ta = s == 0 ? max(b - qO, 0.) : b + qI;
      float tb = s == 0 ? (dI > 0. ? b - qI : b + qO) : b + qO;
      col += (s == 0 ? vec3(1.) : through)*aurora(d, ta, tb, jit);
    }
  }
  o = vec4(col, 1.);
}`;
