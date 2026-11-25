// How many pixels to draw: the renderer's resolution governor, kept apart from WebGL so it can be tested on its own
// (tests/orbit.test.mjs).
//
// The measure is the gap between frames drawn back to back: when the GPU cannot keep up, the browser delivers
// frames late, and the gap grows past the screen's own beat. (Timing the GPU directly sounds better and is worse: a
// lightly loaded GPU slows its own clock, and the timer reads the same ten milliseconds whatever it is asked to do.)
// Too slow for long enough, and the renderer draws fewer pixels. It only ever steps down: a level that was too slow
// once is not tried again on this page. If the lowest level is still far too slow, it gives up and the page keeps
// its still.
//
// Every frame the caller marks steady counts, however late it is: the slowest machines are the ones this is for.
// But late frames are not always the pixels' fault. A browser that holds the page to thirty frames a second (a phone
// saving power) or a busy main thread makes frames late at any size. So each step down is a test: if the next
// stretch of frames comes no sooner, the pixels were not the limit, the step is taken back, and the governor stops
// for this page.

export type Governor = {
  fit: number;         // the share of full resolution being drawn, in each direction
  gap: number;         // the median of the recent gaps between steady frames, ms
  recent: number[];    // those gaps, the latest last
  last: number;        // when the last frame was drawn
  slow: number;        // milliseconds of steady frames in a row that were late
  hopeless: number;    // milliseconds of steady frames in a row far too late with nothing left to try
  before: number;      // the gap when the last step down was taken (0: none yet)
  prior: number;       // the fit before that step
  held: boolean;       // stepping has stopped for good
};

export const governor = (): Governor => ({ fit: 1, gap: 16, recent: [], last: 0, slow: 0, hopeless: 0, before: 0, prior: 1, held: false });

// Late: slower than about forty frames a second. Far too late: slower than twenty, at half size.
// The windows are measured in time, not frames, so a machine drawing three frames a second decides as soon as one
// drawing sixty.
const LATE = 24, HOPELESS = 50, STEP = 0.8, SMALLEST = 0.5, WINDOW = 500, GIVE_UP = 800;

// One frame drawn at `now`. Says whether to draw at a new size, or to give up.
export function govern(g: Governor, now: number, steady: boolean, fixed = false): "same" | "resize" | "give up" {
  const dt = g.last ? Math.min(now - g.last, 100) : 0;
  g.last = now;
  if (fixed || !steady || !dt) return "same";
  // The median of the last fifteen gaps. A hitch (a collected heap, a busy main thread, a screenshot) is a few long
  // frames among many on time and does not move it; a chip that cannot keep up makes every frame late, and does.
  g.recent.push(dt);
  if (g.recent.length > 15) g.recent.shift();
  if (g.recent.length < 5) return "same";
  const sorted = [...g.recent].sort((a, b) => a - b);
  g.gap = sorted[sorted.length >> 1];
  let act: "same" | "resize" = "same";
  g.slow = g.gap > LATE ? g.slow + dt : 0;
  if (g.slow > WINDOW && !g.held) {
    if (g.before && g.gap > g.before * 0.9) {
      // The last step bought nothing: put it back and stop stepping.
      g.fit = g.prior; g.held = true; g.slow = 0; g.recent = []; act = "resize";
    } else if (g.fit > SMALLEST) {
      g.before = g.gap; g.prior = g.fit; g.fit = Math.max(SMALLEST, g.fit * STEP); g.slow = 0; g.recent = []; act = "resize";
    }
  }
  // Under twenty frames a second at half size, or with stepping stopped because the pixels were not the cause:
  // either way nothing is left to try, and this machine is better served by the still.
  g.hopeless = (g.fit <= SMALLEST || g.held) && g.gap > HOPELESS ? g.hopeless + dt : 0;
  return g.hopeless > GIVE_UP ? "give up" : act;
}
