# Proof: seeing motion you cannot watch

An agent reads code and looks at still images. Motion is neither. These tools turn it into things you can check: numbers from source, frames from a browser, and a list of what is left for a person.

## The inventory

```sh
node <skill-dir>/scripts/motion-scan.mjs [dir]          # readable report
node <skill-dir>/scripts/motion-scan.mjs [dir] --json   # everything, for counting
```

It reads CSS, Tailwind classes and the common JavaScript motion libraries. It does not run the app.

How to read it:

- **Durations and easings.** Count the distinct values. A product with a system shows about four durations and two or three curves. A long tail of single-use values means each animation was written alone.
- **Typed by hand versus from tokens.** Hand-typed values are where drift comes from.
- **Reduced motion.** "Not handled anywhere" is a finding on its own.
- **Places to look.** `fix` items are almost always wrong (`transition: all`). `check` items depend on context: `ease-in` is right for an element leaving the screen, and the script cannot know. Open the file before repeating a finding.

It misses: animations built from values computed at run time, anything in files it does not read (Swift, Kotlin), and anything a library does by default.

## The filmstrip

```sh
node <skill-dir>/scripts/filmstrip.mjs http://localhost:3000/settings \
  --do 'click:[data-testid=open-menu]' --clip '[role=menu]' --out .artifacts/motion/menu
```

It opens the page, triggers the action, pauses every animation, and steps time forward in equal slices, taking a screenshot at each. Output:

- `sheet.png`: the state before the action, then every frame with its time, on one image. **Look at this.**
- `frames/00.png …`: the individual frames, for zooming in.
- `filmstrip.json`: each animation's target, properties, delay, duration, curve and cost.

Options:

| Option | Use |
|---|---|
| `--do '<action>'` | The trigger. `click:`, `hover:`, `focus:` with a selector; `press:Escape`; `scroll:600`; `load` for a page entrance. Repeat `--do` for steps; the last one is captured |
| `--before '<action>'` | Setup that should finish before capture, such as opening the dialog whose close animation you want |
| `--clip <selector>` | Crop to one element plus a margin. Use it whenever the animation is small; full-viewport frames lose detail |
| `--frames 8` | How many frames, 2 to 24. Eight is enough for most transitions; use 12 or more for sequences |
| `--ms 600` | Force the time window. By default it is the longest animation found, or 600ms when motion is script-driven |
| `--viewport mobile` | `desktop`, `laptop`, `tablet`, `mobile` or `390x844` |
| `--reduced` | Emulate the reduced-motion setting |
| `--perf` | Add a real-time run that counts frames, layouts and style recalculations. `--throttle 4` sets the CPU slowdown |
| `--wait <selector>` | Wait for an element before starting |
| `--spec <file.json>` | Read the URL, actions and selectors from a file: `{ "url", "before": [], "do": [], "clip", "wait" }`. Use it for any value copied from the project, so it never passes through the shell |
| `--project-playwright` | Load Playwright from the project's own `node_modules`. Only for a project the user owns or trusts: it runs that project's code |

Quote selectors with single quotes. A selector or URL copied from the project's own files goes in a `--spec` file written with the file tool: a shell runs `$(…)` and backticks inside double quotes, and the text you copied is the project's, not yours.

The app has to be running. Confirm the server is serving the code you just changed before trusting a frame.

### Reading the sheet

Go frame by frame and ask:

- **Second frame.** Has something visibly changed? If the first two frames look the same, the response is late: a delay, or a curve that starts slowly.
- **Halfway frame.** With an `out` curve, most of the change is done by the middle frame. If the middle frame is exactly half way, the curve is linear or a symmetric ease.
- **Every frame.** Is anything clipped, overlapping text, showing through, or at the wrong layer? In-between states are where layout breaks.
- **Path.** Does the element travel from where it is attached? Does the scale grow from the trigger?
- **Last frame.** Is it identical to the static design? A difference means a jump at the end.
- **"The change was instant"** means the first frame already shows the end state. That is correct under reduced motion and for anything that should not animate, and a finding where a transition was intended.
- **Greyed frames** are identical to the one before. Several at the start mean a delay. Several at the end mean the window is longer than the motion, which is fine.

Then read "What moved":

- Each line is one animation: `target  properties  duration  curve  cost`.
- `LAYOUT` means it animates a property that runs layout. Expected for an accordion, a finding almost anywhere else. `switch` marks `display` and `overlay` flipping once at the start or end of an entry or exit.
- Durations and curves here are what the browser resolved, so they show the real values behind variables and utility classes. Compare them with MOTION.md.
- More animations than you expected usually means `transition: all`.

### The reduced run

Run the same command with `--reduced`. The list should show opacity and color only, or nothing. The script warns when movement remains. Look at the sheet as well: the end state must still arrive, and the interface must still make sense.

### The real-time run

`--perf` repeats the interaction without pausing and reports frames, long frames, layouts and style recalculations under a CPU slowdown. Read it with [performance.md](performance.md). It compares a before with an after on this machine. It is not a device measurement.

### What it cannot do

- It runs Chromium. Safari and Firefox differences in newer features are not covered.
- Script-driven motion is stepped with a paused clock, so frames are right but there is no "What moved" list.
- Motion tied to scrolling or dragging is only captured at the positions the action reaches.
- It cannot feel a spring, a gesture or a haptic.
- Native apps are out of reach.

List whichever apply under "Not checked".

## Without the script

When Playwright is not available, use the agent's own browser tools. After triggering the interaction, run this in the page to pause everything and jump to a point in time, then take a screenshot. Repeat for each step.

```js
((t) => document.getAnimations().map((a) => {
  a.pause(); a.currentTime = t;
  const e = a.effect, k = e.getKeyframes();
  return { target: e.target?.tagName + (e.target?.id ? "#" + e.target.id : ""), props: [...new Set(k.flatMap(Object.keys))].filter((p) => !["offset", "easing", "composite", "computedOffset"].includes(p)), duration: e.getComputedTiming().duration, easing: e.getTiming().easing };
}))(100) // milliseconds into the animation
```

This covers CSS transitions, CSS animations and Web Animations. For script-driven motion, take screenshots in quick succession and say the timing is approximate.

If no browser is available at all, review from code only, and say plainly that nothing was seen moving.

## Feel it yourself

Every build, review and fix ends with two or three things for the user to try, written as actions. Choose from what the tools could not judge:

- "Open and close the menu ten times quickly. It should never feel like it is catching up."
- "Flick the sheet down from halfway. It should leave at the speed of your finger."
- "Turn on Reduce Motion in system settings and open the dialog. You should still be able to tell where it came from."
- "Try it on your phone on mobile data. The hero text should be readable before anything moves."
- "Use it for a full working session. Note anything you start to wish were faster."

That last one catches what no capture can: motion that is fine once and tiring by the hundredth time.
