// The air. Three things scatter or absorb sunlight on its way through: the gas itself (Rayleigh scattering, strongest
// in blue, which is why the sky is blue and a low sun is red), haze (Mie scattering, nearly colourless and thrown
// forward, which is the glow round the sun), and ozone (which absorbs orange and leaves twilight its deep blue).
//
// The one thing worth precomputing is how much of each lies between a point and the sun: it is needed at every
// sample of every pixel and it never changes. buildDepthTable() integrates those three columns once, on the CPU, into
// a small table over (height, sun angle); the shader looks them up and applies the colour coefficients itself, so
// the lab can retune the colours without rebuilding the table.

export const R_PLANET = 6371;
export const ATMOSPHERE_TOP = 100;

// Per kilometre, for red, green and blue. Earth's air, as measured for rendering by Bruneton and Neyret,
// "Precomputed Atmospheric Scattering" (2008), and Hillaire, "A Scalable and Production Ready Sky and Atmosphere
// Rendering Technique" (2020). The ozone layer is Hillaire's: a tent centred at 25 km, 15 km to either side.
export const AIR = {
  rayleigh: [5.802e-3, 13.558e-3, 33.1e-3] as const,
  rayleighHeight: 8,
  mieScatter: 3.996e-3,
  mieExtinct: 4.44e-3,
  mieHeight: 1.2,
  ozone: [0.65e-3, 1.881e-3, 0.085e-3] as const,
  ozoneCentre: 25,
  ozoneHalfWidth: 15,
};

export const DEPTH_W = 128, DEPTH_H = 64;

// Columns of gas, haze and ozone (each as km of sea-level-equivalent stuff) from a point to space, toward the sun.
// x: the sun's angle above the point's own horizon, on a square-root scale so the grazing rays get most of the
// table. y: the point's height, also square-root, 0 to 100 km. A ray that would hit the ground is not stored;
// the shader treats the sun as set there.
export function buildDepthTable(hr = AIR.rayleighHeight, hm = AIR.mieHeight): Float32Array {
  const out = new Float32Array(DEPTH_W * DEPTH_H * 4);
  const top = R_PLANET + ATMOSPHERE_TOP, STEPS = 96;
  for (let j = 0; j < DEPTH_H; j++) {
    const y = j / (DEPTH_H - 1), r = R_PLANET + ATMOSPHERE_TOP * y * y;
    const muH = -Math.sqrt(Math.max(1 - (R_PLANET * R_PLANET) / (r * r), 0));
    for (let i = 0; i < DEPTH_W; i++) {
      const x = i / (DEPTH_W - 1), mu = muH + x * x * (1 - muH);
      // Distance along the ray to the top of the air.
      const len = -r * mu + Math.sqrt(Math.max(r * r * (mu * mu - 1) + top * top, 0));
      const dt = len / STEPS;
      let gas = 0, haze = 0, ozone = 0;
      for (let k = 0; k < STEPS; k++) {
        const t = (k + 0.5) * dt;
        const h = Math.max(Math.sqrt(r * r + t * t + 2 * r * t * mu) - R_PLANET, 0);
        gas += Math.exp(-h / hr);
        haze += Math.exp(-h / hm);
        ozone += Math.max(0, 1 - Math.abs(h - AIR.ozoneCentre) / AIR.ozoneHalfWidth);
      }
      const o = (j * DEPTH_W + i) * 4;
      out[o] = gas * dt;
      out[o + 1] = haze * dt;
      out[o + 2] = ozone * dt;
      out[o + 3] = 1;
    }
  }
  return out;
}

// The same lookup on the CPU, for the few things the page decides per frame (the colour of the sun's glare).
export function depthAt(table: Float32Array, height: number, mu: number): [number, number, number] {
  const r = R_PLANET + Math.max(height, 0);
  const muH = -Math.sqrt(Math.max(1 - (R_PLANET * R_PLANET) / (r * r), 0));
  const x = Math.sqrt(Math.min(Math.max((mu - muH) / (1 - muH), 0), 1)) * (DEPTH_W - 1);
  const y = Math.sqrt(Math.min(Math.max(height / ATMOSPHERE_TOP, 0), 1)) * (DEPTH_H - 1);
  const x0 = Math.min(Math.floor(x), DEPTH_W - 2), y0 = Math.min(Math.floor(y), DEPTH_H - 2), fx = x - x0, fy = y - y0;
  const at = (i: number, j: number, c: number) => table[(j * DEPTH_W + i) * 4 + c];
  const lerp = (c: number) =>
    (at(x0, y0, c) * (1 - fx) + at(x0 + 1, y0, c) * fx) * (1 - fy) + (at(x0, y0 + 1, c) * (1 - fx) + at(x0 + 1, y0 + 1, c) * fx) * fy;
  return [lerp(0), lerp(1), lerp(2)];
}

export const ATMOSPHERE_GLSL = `
uniform sampler2D uDepth;       // columns of gas, haze and ozone toward the sun (atmosphere.ts)
uniform vec3 uBetaR;            // Rayleigh scattering per km
uniform vec3 uBetaO;            // ozone absorption per km
uniform vec2 uBetaM;            // haze: scattering, extinction per km
uniform vec2 uScaleH;           // scale heights of gas and haze, km
uniform float uMieG;            // how strongly haze throws light forward
const float SUN_R = 0.004675;   // the sun's angular radius

vec3 airDensity(float h){
  return vec3(exp(-h/uScaleH.x), exp(-h/uScaleH.y), max(0., 1. - abs(h - 25.)/15.));
}
vec3 extinction(vec3 columns){ return exp(-(uBetaR*columns.x + uBetaM.y*columns.y + uBetaO*columns.z)); }

// The columns from a point at radius r to space, along a direction whose cosine with "up" is mu.
vec3 columnsTo(float r, float mu, out float above){
  float muH = -sqrt(max(1. - (RP*RP)/(r*r), 0.));
  above = (mu - muH)/max(sqrt(1. - muH*muH), 1e-4);          // angle above the horizon, radians (small-angle)
  float x = sqrt(sat((mu - muH)/(1. - muH)));
  float y = sqrt(sat((r - RP)/100.));
  return texture(uDepth, vec2((x*127. + .5)/128., (y*63. + .5)/64.)).rgb;
}
// Sunlight that reaches a point: reddened by the air it crossed, and cut off as the sun's disc sets.
vec3 sunlight(float r, float mu){
  float above;
  vec3 c = columnsTo(r, mu, above);
  return extinction(c)*smoothstep(-SUN_R, SUN_R, above);
}

float phaseR(float c){ return 3./(16.*PI)*(1. + c*c); }
// Cornette-Shanks: Henyey-Greenstein's forward lobe with the right behaviour for small particles.
float phaseM(float c, float g){
  float g2 = g*g;
  return 3./(8.*PI)*((1. - g2)*(1. + c*c))/((2. + g2)*pow(max(1. + g2 - 2.*g*c, 1e-4), 1.5));
}
`;
