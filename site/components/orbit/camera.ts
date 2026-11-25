// Where the camera is and what it frames. Two things are kept apart here:
//
// The pose is the camera in space: a height above the planet, a tilt down toward the limb and a roll. The reference
// camera sits on the +Y axis looking toward -Z; everything else is measured from there.
//
// The frame is the picture that pose makes on a fixed reference canvas (1920 x 1080 for wide screens, a taller one
// for phones). A real screen shows a crop of that canvas, scaled to cover and anchored the way CSS `object-fit:
// cover` anchors the still image behind it. So the live scene and the still line up to the pixel at any size.
import { R_PLANET } from "./atmosphere";

export type Vec3 = [number, number, number];
export type Frame = { w: number; h: number; ax: number; ay: number };
export type Pose = { pos: Vec3; right: Vec3; up: Vec3; fwd: Vec3; focal: number };
export type Crop = { s: number; ox: number; oy: number };

export const RAD = Math.PI / 180;
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a: Vec3): Vec3 => scale(a, 1 / Math.hypot(a[0], a[1], a[2]));

// How far below the camera's level the limb lies, in radians.
export const limbDrop = (altitude: number) => Math.acos(R_PLANET / (R_PLANET + altitude));

// altitude in km; pitch, roll and yaw in degrees (pitch below zero looks down); focal in reference-frame pixels.
export function pose(altitude: number, pitch: number, roll: number, yaw: number, focal: number): Pose {
  const p = pitch * RAD, r = roll * RAD, y = yaw * RAD;
  const f0: Vec3 = [Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p)];
  const r0: Vec3 = [Math.cos(y), 0, Math.sin(y)];
  const u0 = cross(r0, f0);
  const right = add(scale(r0, Math.cos(r)), scale(u0, Math.sin(r)));
  const up = add(scale(r0, -Math.sin(r)), scale(u0, Math.cos(r)));
  return { pos: [0, R_PLANET + altitude, 0], right, up, fwd: f0, focal };
}

export function crop(frame: Frame, width: number, height: number): Crop {
  const s = Math.max(width / frame.w, height / frame.h);
  return { s, ox: (width - frame.w * s) * frame.ax, oy: (height - frame.h * s) * frame.ay };
}

// The ray through a CSS pixel (y down) of a screen showing `c` of the frame.
export function rayAt(p: Pose, frame: Frame, c: Crop, x: number, y: number): Vec3 {
  const rx = (x - c.ox) / c.s - frame.w / 2, ry = (y - c.oy) / c.s - frame.h / 2;
  return norm(add(add(scale(p.fwd, p.focal), scale(p.right, rx)), scale(p.up, -ry)));
}

// The same as three vectors a shader can use: ray = normalize(A + B*fx + C*fy), for a target `k` device pixels
// per CSS pixel and `height` CSS pixels tall, fx and fy counted from its bottom-left as gl_FragCoord does.
export function rayBasis(p: Pose, frame: Frame, c: Crop, height: number, k: number): { A: Vec3; B: Vec3; C: Vec3 } {
  const B = scale(p.right, 1 / (k * c.s)), C = scale(p.up, 1 / (k * c.s));
  const A = add(add(scale(p.fwd, p.focal), scale(p.right, -(c.ox / c.s + frame.w / 2))), scale(p.up, -((height - c.oy) / c.s - frame.h / 2)));
  return { A, B, C };
}

// Where a pixel of the reference frame lands on the globe, as a unit vector from its centre (null if it is sky).
export function groundAt(p: Pose, frame: Frame, fx: number, fy: number): Vec3 | null {
  const d = norm(add(add(scale(p.fwd, p.focal), scale(p.right, fx - frame.w / 2)), scale(p.up, -(fy - frame.h / 2))));
  const b = -dot(p.pos, d);
  const l = add(p.pos, scale(d, b));
  const disc = R_PLANET * R_PLANET - dot(l, l);
  if (disc < 0 || b < 0) return null;
  return norm(add(p.pos, scale(d, b - Math.sqrt(disc))));
}

// ---- The map (see glsl/common.ts) ------------------------------------------------------------------------------
export const KAPPA = 0.14;
// psi is twice the tangent of half the bearing: the map's cheap stand-in for the bearing itself.
export type MapSpec = { psi0: number; psi1: number; rho0: number; rho1: number; href: number; ah: number; w: number; h: number };
export const psiOf = (bearing: number) => 2 * Math.tan(bearing / 2);

export function rhoOf(a: number, href: number, ah: number) {
  const x = Math.min(a, ah);
  return Math.atan2(R_PLANET * Math.sin(x), href - R_PLANET * Math.cos(x)) + KAPPA * a;
}

// The part of the globe a screen of this size can see from this pose, with room around it for the camera to move
// and for clouds outside the picture to cast shadows into it, and a texture size that gives about `density` texels
// per device pixel.
export function mapFor(p: Pose, frame: Frame, c: Crop, width: number, height: number, texelAngle: number, maxSize: number): MapSpec {
  const href = Math.hypot(p.pos[0], p.pos[1], p.pos[2]), ah = Math.acos(R_PLANET / href);
  const shell = R_PLANET + 16;
  let phiMin = Infinity, phiMax = -Infinity, aMin = Infinity;
  const N = 24, pad = 0.06;
  for (let j = 0; j <= N; j++) {
    for (let i = 0; i <= N; i++) {
      const x = width * (-pad + (1 + 2 * pad) * (i / N)), y = height * (-pad + (1 + 2 * pad) * (j / N));
      const d = rayAt(p, frame, c, x, y);
      const b = -dot(p.pos, d);
      const l = add(p.pos, scale(d, b));
      const disc = shell * shell - dot(l, l);
      if (b <= 0) continue;                                    // looking away from the planet
      // A ray that just clears the limb still passes over the horizon at its closest point; that bearing counts
      // too. Rays well up in the sky say nothing about the ground.
      const hits = disc >= 0;
      if (!hits && Math.hypot(l[0], l[1], l[2]) > shell + 200) continue;
      const n = norm(hits ? add(p.pos, scale(d, b - Math.sqrt(disc))) : l);
      const bearing = Math.atan2(n[0], -n[2]);
      phiMin = Math.min(phiMin, bearing);
      phiMax = Math.max(phiMax, bearing);
      if (hits) aMin = Math.min(aMin, Math.acos(Math.min(1, n[1])));
    }
  }
  if (!isFinite(aMin)) aMin = ah * 0.6;
  const psi0 = psiOf(phiMin - 0.1), psi1 = psiOf(phiMax + 0.1);
  const a0 = Math.max(aMin - 0.02, 0.01), a1 = ah + 0.085;
  const rho0 = rhoOf(a0, href, ah), rho1 = rhoOf(a1, href, ah);
  let w = Math.ceil((psi1 - psi0) / texelAngle), h = Math.ceil((rho1 - rho0) / texelAngle);
  const over = Math.max(w / maxSize, h / maxSize, 1);
  w = Math.max(64, Math.round(w / over));
  h = Math.max(64, Math.round(h / over));
  return { psi0, psi1, rho0, rho1, href, ah, w, h };
}
