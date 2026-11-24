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
out vec4 o;

float hash11(float x){ return fract(sin(x*127.1)*43758.5453); }
float vnoise(float x){ float i = floor(x), f = x - i; f = f*f*(3. - 2.*f); return mix(hash11(i), hash11(i + 1.), f); }
// erf, to about 1e-5 (Abramowitz and Stegun 7.1.25).
float erf(float x){
  float a = abs(x), t = 1./(1. + .47047*a);
  return sign(x)*(1. - t*(.3480242 + t*(-.0958798 + t*.7478556))*exp(-a*a));
}

// The aurora is a thin curtain standing on an oval round the magnetic pole, a hundred kilometres up and more. Its
// place across the curtain (in curtain-widths, zero at its middle) and along it (longitude) at a point:
vec2 curtain(vec3 q){
  vec3 n = normalize(q);
  float colat = acos(clamp(dot(n, uAurora.xyz), -1., 1.));
  float lon = atan(dot(n, uAuroraE2), dot(n, uAuroraE1));
  float t = uTime;
  // The oval wanders: slow folds hundreds of kilometres long, and tighter meanders on them.
  float fold = .030*sin(lon*6. + t*.021) + .014*sin(lon*17. - t*.034 + 1.7) + .006*sin(lon*43. + t*.05 + .6) + .0025*sin(lon*101. - t*.09 + 2.1);
  return vec2((colat - uAurora.w - fold)/uAuroraLook.y, lon);
}
// Its light along the ray between t0 and t1. The curtain is far thinner than a step, so each step integrates the
// Gaussian across it exactly (the error function) instead of sampling it, and reads the curtain's height and rays
// at the point where the ray actually passes through. No banding; a sharp lower edge; and the brightening where
// the ray runs along a fold comes out by itself.
vec3 aurora(vec3 d, float t0, float t1){
  // Most rays come nowhere near the oval. Say so from the distance to the pole alone, at both ends and the middle,
  // before anything dearer is worked out. (.065: as far as the folds wander, and the sheets' own spread.)
  vec3 far = vec3(dot(normalize(uCam + d*t0), uAurora.xyz), dot(normalize(uCam + d*(.5*(t0 + t1))), uAurora.xyz), dot(normalize(uCam + d*t1), uAurora.xyz));
  far = acos(clamp(far, -1., 1.)) - uAurora.w;
  if (min(min(abs(far.x), abs(far.y)), abs(far.z)) > .065 && far.x*far.z > 0. && far.x*far.y > 0.) return vec3(0.);
  vec2 c0 = curtain(uCam + d*t0);
  const int N = 12;
  float dt = (t1 - t0)/float(N);
  vec3 sum = vec3(0.);
  for (int i = 0; i < N; i++) {
    float ta = t0 + dt*float(i);
    vec3 qb = uCam + d*(ta + dt);
    // The same cheap test for each step: far from the oval, there is nothing in it and no need for the rest.
    float away = (acos(clamp(dot(normalize(qb), uAurora.xyz), -1., 1.)) - uAurora.w)/uAuroraLook.y;
    if (abs(away) > .065/uAuroraLook.y && away*c0.x > 0. && abs(c0.x) > 12.) { c0 = vec2(away, c0.y); continue; }
    vec2 c1 = curtain(qb);
    // Two sheets: the bright one and a fainter companion a little poleward.
    for (int k = 0; k < 2; k++) {
      float shift = k == 0 ? 0. : 5.5, wgt = k == 0 ? 1. : .4;
      float a = c0.x - shift, b = c1.x - shift, span = b - a;
      float along = abs(span) > 1e-3 ? .8862*(erf(b) - erf(a))/span : exp(-a*a);
      if (along < 1e-4) continue;
      // Where in this step the ray is nearest the middle of the sheet. If it passes right through, close in on
      // the crossing: the rays are a few kilometres apart, and a rough position would make them zigzag.
      float tx = ta + (abs(span) > 1e-3 ? clamp(-a/span, 0., 1.) : .5)*dt;
      if (a*b < 0.) {
        float lo = ta, hi = ta + dt, flo = a;
        for (int j = 0; j < 5; j++) {
          float m = .5*(lo + hi), fm = curtain(uCam + d*m).x - shift;
          if (fm*flo < 0.) hi = m; else { lo = m; flo = fm; }
        }
        tx = .5*(lo + hi);
      }
      vec3 qx = uCam + d*tx;
      float lon = curtain(qx).y + float(k)*.37;
      float z = length(qx) - RP;
      // Rays: fine streaks along the curtain that hold their place in height and shimmer slowly. Seen along the
      // curtain they blur together.
      float spread = abs(c1.y - c0.y)*uAuroraLook.z*min(1., 2./max(abs(span), 1e-3));
      float ray = vnoise(lon*uAuroraLook.z + 2.*vnoise(lon*uAuroraLook.z*.13 + uTime*.07) + uTime*.11);
      float rays = mix(.75, .12 + 1.9*ray*ray, sat(.8/(spread + .1)));
      float swell = .45 + 1.1*vnoise(lon*11. + uTime*.03 + float(k)*5.);
      // Oxygen's green from about 95 km, strongest a little over 100; a trace of its red far above; nitrogen's
      // violet at the lower edge.
      float foot = 6.*vnoise(lon*23. + float(k)*3.) - 3.;            // the lower edge is not level
      float green = smoothstep(92., 104., z - foot)*exp(-max(z - foot - 105., 0.)/(14. + 22.*ray));
      float red = smoothstep(170., 240., z)*exp(-max(z - 250., 0.)/70.)*.05;
      float violet = smoothstep(88., 95., z - foot)*(1. - smoothstep(95., 106., z - foot))*.4;
      sum += wgt*along*rays*swell*dt*(green*vec3(.1, 1., .42) + red*vec3(1., .08, .12) + violet*vec3(.4, .3, 1.));
    }
    c0 = c1;
  }
  return sum*uAuroraLook.x;
}

void main(){
  vec3 d = normalize(uRayA + uRayB*gl_FragCoord.x + uRayC*gl_FragCoord.y);
  float b = -dot(uCam, d);
  vec3 l = uCam + b*d;
  float l2 = dot(l, l);
  vec3 col = vec3(0.);
  // The curtains stand between 90 and 320 km. On the near side of the planet nothing dims them. On the far side
  // of its edge they are seen through the whole depth of the air, like a star, or not at all behind the ground.
  float RO = RP + 320., RI = RP + 90., dO = RO*RO - l2, dI = RI*RI - l2;
  if (b > 0. && dO > 0.) {
    float qO = sqrt(dO);
    if (dI > 0.) {
      float qI = sqrt(dI);
      col = aurora(d, max(b - qO, 0.), b - qI);
      if (l2 > RP*RP) {
        float above;
        vec3 through = extinction(2.*columnsTo(sqrt(l2), 0., above));
        if (through.g > .003) col += through*aurora(d, b + qI, b + qO);
      }
    } else col = aurora(d, max(b - qO, 0.), b + qO);
  }
  o = vec4(col, 1.);
}`;
