#!/usr/bin/env node
// Spring calculator. Describe a spring the way a person feels it (how long it takes, how much it bounces)
// and get the same spring for every platform: a CSS linear() easing with its duration, Motion, SwiftUI,
// Reanimated and raw stiffness and damping. No dependencies. Motion gets stiffness and damping, because
// its own duration-based options do not describe the same spring as SwiftUI's.
//
//   node spring.mjs --duration 0.4 --bounce 0.2 [--points 32] [--json]
//
// duration: seconds until the movement looks finished (the spring keeps settling a little after that).
// bounce:   0 is no overshoot, 0.3 passes the target by about 5%, 0.5 by about 16%. Above 0.5 is rarely right
//           in an interface. The printed result says how far this one overshoots.
const args = process.argv.slice(2);
const num = (name, fallback) => { const i = args.indexOf(name); const v = i >= 0 ? Number(args[i + 1]) : fallback; return Number.isFinite(v) ? v : fallback; };
const duration = num("--duration", 0.4);
const bounce = num("--bounce", 0);
const points = Math.max(8, Math.min(80, Math.round(num("--points", 32))));
if (duration <= 0 || duration > 5 || bounce < 0 || bounce >= 1) { console.error("Use --duration between 0 and 5 seconds and --bounce from 0 up to (not including) 1."); process.exit(2); }

// The duration-and-bounce form SwiftUI documents, for a mass of 1:
// stiffness = (2π / duration)², damping = 4π (1 − bounce) / duration.
const stiffness = (2 * Math.PI / duration) ** 2;
const damping = (4 * Math.PI * (1 - bounce)) / duration;
const w0 = Math.sqrt(stiffness);
const zeta = damping / (2 * w0);

export function position(t) {
  if (zeta >= 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
}

// Settling time: the last moment the spring is more than 0.1% away from rest.
let settle = duration;
for (let t = 10; t > 0; t -= 0.001) if (Math.abs(1 - position(t)) > 0.001) { settle = t + 0.001; break; }
settle = Math.round(settle * 1000) / 1000;

const stops = Array.from({ length: points + 1 }, (_, i) => position((i / points) * settle));
stops[0] = 0; stops[points] = 1;
const fmt = (n) => String(Math.round(n * 1000) / 1000).replace(/^0\./, ".").replace(/^-0\./, "-.");
const linear = `linear(${stops.map(fmt).join(", ")})`;
const overshoot = Math.max(...stops) - 1;
const r = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

const out = {
  duration, bounce, settleMs: Math.round(settle * 1000), overshootPercent: r(Math.max(0, overshoot) * 100),
  stiffness: r(stiffness), damping: r(damping), mass: 1,
  css: { easing: linear, duration: `${Math.round(settle * 1000)}ms` },
  // Motion's own visualDuration and bounce options use a different conversion (it stretches the duration by
  // 1.2 and maps bounce its own way), so the same numbers there give a slower spring. The physical values are exact.
  motion: `{ type: "spring", stiffness: ${r(stiffness)}, damping: ${r(damping)}, mass: 1 }`,
  swiftui: `.spring(duration: ${duration}, bounce: ${bounce})`,
  reanimated: `withSpring(value, { stiffness: ${r(stiffness)}, damping: ${r(damping)}, mass: 1 })`,
};

if (args.includes("--json")) console.log(JSON.stringify(out, null, 1));
else console.log(`Spring: looks finished in ${duration}s, bounce ${bounce}
Settles in ${out.settleMs}ms${overshoot > 0.001 ? `, overshoots by ${out.overshootPercent}%` : ", no overshoot"}. Stiffness ${out.stiffness}, damping ${out.damping}, mass 1.

CSS
  transition-duration: ${out.css.duration};
  transition-timing-function: ${linear};

Motion      ${out.motion}
SwiftUI     ${out.swiftui}
Reanimated  ${out.reanimated}

The CSS version is a recording of the spring, so it cannot carry velocity from a gesture or be
redirected mid-flight. Use a real spring (Motion, SwiftUI, Reanimated) for anything the user drags or interrupts.`);
