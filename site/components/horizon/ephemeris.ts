// Where the sun, the moon and the camera are. Everything is in the planet's own rotating frame (kilometres from the
// centre, +z the north pole, +x through longitude 0 on the equator), so the maps never move and the sun does.
export type Vec3 = [number, number, number];
const RAD = Math.PI / 180;
const J2000 = Date.UTC(2000, 0, 1, 12);

const norm = (a: Vec3): Vec3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add = (a: Vec3, b: Vec3, s = 1): Vec3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];

export const fromLatLon = (lat: number, lon: number): Vec3 => [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)];

// Greenwich sidereal angle in degrees: how far the planet has turned under the stars.
const sidereal = (ms: number) => 280.46061837 + 360.98564736629 * ((ms - J2000) / 86400000);

// The point on the planet directly under the sun at a moment (the Astronomical Almanac's low-precision formulae,
// good to about a hundredth of a degree: far finer than a pixel of twilight).
export function subsolar(ms: number) {
  const n = (ms - J2000) / 86400000;
  const L = (280.46 + 0.9856474 * n) * RAD, g = (357.528 + 0.9856003 * n) * RAD;
  const lambda = L + (1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD, eps = (23.439 - 4e-7 * n) * RAD;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) / RAD;
  const lat = Math.asin(Math.sin(eps) * Math.sin(lambda)) / RAD;
  const lon = ((ra - sidereal(ms)) % 360 + 540) % 360 - 180;
  return { lat, lon };
}
export const sunDirection = (ms: number): Vec3 => { const s = subsolar(ms); return fromLatLon(s.lat, s.lon); };

// The moon, to about a degree (enough to know which side of the night it lights and how full it is).
export function moonDirection(ms: number): { dir: Vec3; phase: number } {
  const d = (ms - J2000) / 86400000;
  const L = (218.316 + 13.176396 * d) * RAD, M = (134.963 + 13.064993 * d) * RAD, F = (93.272 + 13.22935 * d) * RAD;
  const lon = L + 6.289 * RAD * Math.sin(M), lat = 5.128 * RAD * Math.sin(F), eps = 23.439 * RAD;
  const x = Math.cos(lat) * Math.cos(lon), y = Math.cos(eps) * Math.cos(lat) * Math.sin(lon) - Math.sin(eps) * Math.sin(lat), z = Math.sin(eps) * Math.cos(lat) * Math.sin(lon) + Math.cos(eps) * Math.sin(lat);
  const turn = -sidereal(ms) * RAD, dir: Vec3 = [x * Math.cos(turn) - y * Math.sin(turn), x * Math.sin(turn) + y * Math.cos(turn), z];
  // 0 at new moon, 1 at full: how much of the lit half faces the planet.
  const phase = (1 - dot(dir, sunDirection(ms))) / 2;
  return { dir, phase };
}

export interface Orbit { altitude: number; inclination: number; node: number; phase: number; epoch: number }
// A circular orbit: where the camera is at a moment, and which way it is travelling, both in the rotating frame.
// The period follows from the altitude (Kepler), so a pass is as long as a real one unless the clock is hurried.
export function orbitAt(orbit: Orbit, ms: number): { position: Vec3; travel: Vec3 } {
  const a = 6371 + orbit.altitude, period = 2 * Math.PI * Math.sqrt((a * a * a) / 398600.4418) * 1000;
  const u = orbit.phase * RAD + (2 * Math.PI * (ms - orbit.epoch)) / period, i = orbit.inclination * RAD;
  // Inertial frame first, then turned back by the planet's rotation since the epoch.
  const node = orbit.node * RAD - ((sidereal(ms) - sidereal(orbit.epoch)) * RAD);
  const at = (angle: number): Vec3 => {
    const x = Math.cos(angle), y = Math.sin(angle) * Math.cos(i), z = Math.sin(angle) * Math.sin(i);
    return [x * Math.cos(node) - y * Math.sin(node), x * Math.sin(node) + y * Math.cos(node), z];
  };
  const here = at(u), next = at(u + 1e-4);
  return { position: scale(here, a), travel: norm(add(next, here, -1)) };
}

export interface Shot { position: Vec3; right: Vec3; up: Vec3; forward: Vec3 }
// A camera at a place, heading a compass-like way, tipped down from level, and rolled. `heading` is measured from
// `travel` (or from north if no direction of travel is given), `pitch` is degrees below the local horizontal.
export function aim(position: Vec3, heading: number, pitch: number, roll: number, travel?: Vec3): Shot {
  const up0 = norm(position);
  const ahead0 = travel ?? ([0, 0, 1] as Vec3);
  const flat = norm(add(ahead0, up0, -dot(ahead0, up0)));
  const side = cross(flat, up0);
  const h = heading * RAD, p = pitch * RAD, r = roll * RAD;
  const dir = add(scale(flat, Math.cos(h)), side, Math.sin(h));
  const right0 = cross(dir, up0);
  const forward = add(scale(dir, Math.cos(p)), up0, -Math.sin(p));
  const camUp = add(scale(up0, Math.cos(p)), dir, Math.sin(p));
  return {
    position, forward,
    right: add(scale(right0, Math.cos(r)), camUp, Math.sin(r)),
    up: add(scale(camUp, Math.cos(r)), right0, -Math.sin(r)),
  };
}
export const place = (lat: number, lon: number, altitude: number): Vec3 => scale(fromLatLon(lat, lon), 6371 + altitude);

// The orbit that passes over a place heading a compass bearing (degrees east of north) at its epoch.
export function orbitThrough(lat: number, lon: number, bearing: number, altitude: number): Omit<Orbit, "epoch"> {
  const p = fromLatLon(lat, lon), east = norm(cross([0, 0, 1], p)), north = cross(p, east);
  const d = add(scale(north, Math.cos(bearing * RAD)), east, Math.sin(bearing * RAD));
  const n = norm(cross(p, d)), nodeDir = norm(cross([0, 0, 1], n));
  const inclination = Math.acos(Math.max(-1, Math.min(1, n[2]))) / RAD, node = Math.atan2(nodeDir[1], nodeDir[0]) / RAD;
  const phase = Math.atan2(dot(cross(nodeDir, p), n), dot(nodeDir, p)) / RAD;
  return { altitude, inclination, node, phase };
}
