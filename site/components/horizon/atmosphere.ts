// The air, computed once on the CPU when the scene starts: how much sunlight survives a path through the atmosphere
// (the transmittance table, after Bruneton and Neyret 2008) and how much light has bounced more than once (the
// multiple-scattering table, after Hillaire 2020). The shader reads both and never repeats this work per pixel.
// Distances are kilometres from the planet's centre; coefficients are per kilometre at about 680, 550 and 440 nm.
export const AIR = {
  ground: 6371,
  top: 6471,
  rayleigh: [5.802e-3, 13.558e-3, 33.1e-3],
  rayleighHeight: 8,
  mieScatter: 3.996e-3,
  mieAbsorb: 4.4e-4,
  mieHeight: 1.2,
  mieG: 0.8,
  ozone: [0.65e-3, 1.881e-3, 0.085e-3],
  ozoneCentre: 25,
  ozoneWidth: 15,
} as const;

export const T_SIZE = [256, 64] as const;
export const MS_SIZE = [32, 32] as const;

const { ground: RG, top: RT } = AIR;
const HH = Math.sqrt(RT * RT - RG * RG);

// Extinction at a height above the ground, written into `out`.
function extinction(h: number, out: Float64Array) {
  const r = Math.exp(-h / AIR.rayleighHeight), m = Math.exp(-h / AIR.mieHeight);
  const o = Math.max(0, 1 - Math.abs(h - AIR.ozoneCentre) / AIR.ozoneWidth);
  for (let c = 0; c < 3; c++) out[c] = AIR.rayleigh[c] * r + (AIR.mieScatter + AIR.mieAbsorb) * m + AIR.ozone[c] * o;
}

// Transmittance from a point at radius r, along a direction whose cosine to the zenith is mu, to the top of the air.
// Rows are radius (by distance to the horizon), columns are the distance to the top, so the table is densest where
// the path grazes the planet, which is the only place it changes fast.
export function transmittanceTable() {
  const [W, H] = T_SIZE, data = new Float32Array(W * H * 4), k = new Float64Array(3), sum = new Float64Array(3);
  const STEPS = 64;
  for (let j = 0; j < H; j++) {
    const rho = HH * (j / (H - 1)), r = Math.sqrt(rho * rho + RG * RG);
    const dMin = RT - r, dMax = rho + HH;
    for (let i = 0; i < W; i++) {
      const d = dMin + (i / (W - 1)) * (dMax - dMin);
      const mu = d < 1e-6 ? 1 : Math.max(-1, Math.min(1, (HH * HH - rho * rho - d * d) / (2 * r * d)));
      sum.fill(0);
      const dt = d / STEPS;
      for (let s = 0; s < STEPS; s++) {
        const t = (s + 0.5) * dt;
        extinction(Math.max(0, Math.sqrt(t * t + 2 * r * mu * t + r * r) - RG), k);
        sum[0] += k[0] * dt; sum[1] += k[1] * dt; sum[2] += k[2] * dt;
      }
      const o = (j * W + i) * 4;
      data[o] = Math.exp(-sum[0]); data[o + 1] = Math.exp(-sum[1]); data[o + 2] = Math.exp(-sum[2]); data[o + 3] = 1;
    }
  }
  return data;
}

// The same lookup the shader does, for building the second table.
function sampleT(table: Float32Array, r: number, mu: number, out: Float64Array) {
  const [W, H] = T_SIZE;
  const rho = Math.sqrt(Math.max(r * r - RG * RG, 0));
  const d = Math.max(-r * mu + Math.sqrt(Math.max(r * r * (mu * mu - 1) + RT * RT, 0)), 0);
  const dMin = RT - r, dMax = rho + HH;
  const x = Math.max(0, Math.min(1, (d - dMin) / Math.max(dMax - dMin, 1e-6))) * (W - 1), y = Math.max(0, Math.min(1, rho / HH)) * (H - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(W - 1, x0 + 1), y1 = Math.min(H - 1, y0 + 1), fx = x - x0, fy = y - y0;
  for (let c = 0; c < 3; c++) {
    const a = table[(y0 * W + x0) * 4 + c], b = table[(y0 * W + x1) * 4 + c], e = table[(y1 * W + x0) * 4 + c], f = table[(y1 * W + x1) * 4 + c];
    out[c] = (a + (b - a) * fx) * (1 - fy) + (e + (f - e) * fx) * fy;
  }
}

// Light that has scattered twice or more, per unit of sunlight, as a function of the sun's height and the altitude.
// One bounce is integrated over a sphere of directions; the rest follow as a geometric series (Hillaire's closed form).
export function multipleScatteringTable(transmittance: Float32Array, groundAlbedo = 0.3) {
  const [W, H] = MS_SIZE, data = new Float32Array(W * H * 4);
  const DIRS = 8, STEPS = 20, k = new Float64Array(3), ts = new Float64Array(3);
  for (let j = 0; j < H; j++) {
    const r = RG + 0.01 + (j / (H - 1)) * (RT - RG - 0.02);
    for (let i = 0; i < W; i++) {
      const muS = (i / (W - 1)) * 2 - 1, sx = Math.sqrt(Math.max(0, 1 - muS * muS));
      const L2 = [0, 0, 0], F = [0, 0, 0];
      for (let a = 0; a < DIRS; a++) for (let b = 0; b < DIRS; b++) {
        const cosT = 1 - (2 * (a + 0.5)) / DIRS, sinT = Math.sqrt(1 - cosT * cosT), phi = (2 * Math.PI * (b + 0.5)) / DIRS;
        const dx = sinT * Math.cos(phi), dy = sinT * Math.sin(phi), dz = cosT;
        // Where this direction leaves the air or meets the ground.
        const disc = r * r * (dz * dz - 1);
        const hitsGround = dz < 0 && disc + RG * RG >= 0;
        const far = hitsGround ? -r * dz - Math.sqrt(disc + RG * RG) : -r * dz + Math.sqrt(disc + RT * RT);
        const dt = far / STEPS, T = [1, 1, 1];
        for (let s = 0; s < STEPS; s++) {
          const t = (s + 0.5) * dt, px = dx * t, py = dy * t, pz = r + dz * t, pr = Math.sqrt(px * px + py * py + pz * pz), h = Math.max(0, pr - RG);
          extinction(h, k);
          const cosSun = (px * sx + pz * muS) / pr;
          const horizon = -Math.sqrt(Math.max(0, 1 - (RG / pr) * (RG / pr)));
          sampleT(transmittance, pr, cosSun, ts);
          const lit = cosSun > horizon ? 1 : 0;
          const ray = Math.exp(-h / AIR.rayleighHeight), mie = Math.exp(-h / AIR.mieHeight);
          for (let c = 0; c < 3; c++) {
            const scatter = AIR.rayleigh[c] * ray + AIR.mieScatter * mie, step = Math.exp(-k[c] * dt);
            const part = (T[c] * scatter * (1 - step)) / Math.max(k[c], 1e-9);
            L2[c] += part * ts[c] * lit / (4 * Math.PI);
            F[c] += part;
            T[c] *= step;
          }
        }
        if (hitsGround) {
          const gx = dx * far, gz = r + dz * far, cosSun = Math.max(0, (gx * sx + gz * muS) / RG);
          sampleT(transmittance, RG + 0.001, cosSun, ts);
          for (let c = 0; c < 3; c++) L2[c] += T[c] * ts[c] * cosSun * groundAlbedo / Math.PI;
        }
      }
      const o = (j * W + i) * 4, n = DIRS * DIRS;
      for (let c = 0; c < 3; c++) data[o + c] = (L2[c] / n) / (1 - Math.min(0.95, F[c] / n));
      data[o + 3] = 1;
    }
  }
  return data;
}
