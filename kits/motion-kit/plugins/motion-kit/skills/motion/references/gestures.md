# Gestures: drag, swipe, throw

Read this before building anything the user moves directly: sheets, drawers, sliders, carousels, swipe-to-dismiss, drag-to-reorder, pull-to-refresh.

Gesture-driven motion is judged by the hand. Frames cannot prove it. Build to these rules and list what the user should try under "Feel it yourself".

## The phases

| Phase | Rule |
|---|---|
| **Down** | Take over at once. If the element was mid-animation, stop it where it is and continue from there. No snap back to a start position |
| **Move** | The element is under the finger at every frame. Set the transform directly from the pointer position. No transition, no spring, no smoothing on the dragged property |
| **Release** | Decide where it goes from position and velocity together. Animate there with a spring whose starting velocity is the release velocity |
| **Settle** | The spring finishes. The element is interactive the whole time, and grabbing it again returns to Down |

A transition left on the dragged property is the most common defect. The element trails the finger by the transition's duration.

## Deciding the outcome on release

Position alone makes flicks fail. Velocity alone makes slow deliberate drags fail. Use both.

- **Commit by distance:** released past about half the travel.
- **Commit by velocity:** released moving faster than about 0.5px per millisecond (500px per second) in the commit direction, at any position.
- **Velocity wins when they disagree.** A fast flick back toward the start cancels, even past halfway.
- **Projection** for more than two resting points (a sheet with three heights, a carousel): estimate where the element would coast to and snap to the nearest point. A workable estimate is `position + velocity × 150ms` to `velocity × 200ms`.

Measure velocity over the last 50 to 100ms of movement, not the whole drag. Motion, Reanimated and SwiftUI report it for you.

## At the limits

Past the end of its range the element keeps following, with resistance, so the limit feels elastic. A common function, where `over` is the distance past the limit and `range` is the size of the element or screen:

```js
const rubberBand = (over, range, c = 0.55) => (over * range * c) / (range + c * over);
```

On release from beyond the limit it springs back with no bounce.

## Before the gesture starts

- **Slop.** Do not start a drag until the pointer has moved about 6 to 10px. Until then it may still be a tap.
- **Axis lock.** Once the first 10px show a direction, lock to it. A horizontal swipe inside a vertical scroller claims the gesture only when the movement is mostly horizontal.
- **`touch-action`.** Tell the browser which direction you handle, so it keeps native scrolling in the other: `touch-action: pan-y` on a horizontal carousel, `none` only on a small handle.
- **Pointer capture.** Call `setPointerCapture` on down so the drag continues when the pointer leaves the element.
- **Leave system gestures alone.** The back swipe from the screen edge, pull-to-refresh at the top of the page, and the home indicator area belong to the platform.

## Feedback during the gesture

- Picking up a draggable item: scale 1.02 to 1.04 and a deeper shadow, `fast`. It returns on drop.
- What will happen on release should be visible before release: a row turning red past the delete threshold, a refresh icon completing its circle.
- Where the platform offers haptics, tick once when a threshold is crossed. Not continuously.
- Other items make room with `base` · `in-out`. They are the only other things that move.

## Every gesture has another way

A drag is never the only route to an outcome.

- A button or menu item does the same thing: Close on a sheet, Delete on a swipeable row, Move up and Move down for reordering.
- Keyboard: Escape closes, arrow keys move sliders and reorder with a modifier, Enter confirms.
- This is WCAG 2.5.1 (pointer gestures) and 2.5.7 (dragging movements).
- Hover-only motion sits behind `@media (hover: hover)`, so touch devices do not get stuck states.

## Under reduced motion

The gesture still works and the element still follows the finger, because the user is causing that movement. What changes is the release: settle quickly with no overshoot (`snappy`, bounce 0), or cut to the end state with a fade.

## Implementation notes

- **Web, no library.** Pointer events with capture, `transform` set in a `requestAnimationFrame` callback, velocity from the last few events, and a spring on release. Writing a correct interruptible spring by hand is real work; if the project has Motion, use it.
- **Motion (React).** `drag`, `dragConstraints`, `dragElastic` for rubber-banding, `onDragEnd(event, info)` with `info.velocity` and `info.offset`, and `animate()` with `type: "spring"` and the velocity. Details in [react.md](react.md).
- **SwiftUI and React Native.** Both have gesture systems that hand velocity to springs. Details in [native.md](native.md).
- **Scroll containers first.** A carousel is often best as a native scroller with `scroll-snap-type`. The browser then provides tracking, momentum and rubber-banding, and it is accessible by default.

## What to ask the user to try

Frames cannot answer these. Put the relevant ones under "Feel it yourself".

- Drag slowly past halfway and release. Does it commit?
- Flick quickly from near the start. Does it commit?
- Flick toward closed from nearly open. Does it close?
- Grab it while it is still settling. Does it stop under the finger without jumping?
- Drag past the limit. Does it resist and return?
- Try it on a real phone, one-handed, with the thumb.
