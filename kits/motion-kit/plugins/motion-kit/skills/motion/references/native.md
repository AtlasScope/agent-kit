# Native: SwiftUI and React Native

The judgment, values and patterns are the same as on the web. What changes is the API and what the platform already does for you. The filmstrip script does not run on native apps; proof here is a screen recording stepped frame by frame by the user, or the simulator's slow-animation setting. Say so under "Not checked".

API names are from memory of each platform's documented surface. Check the project's deployment target and the current docs before using one that this codebase does not already use.

## Platform first

Native platforms ship motion people already know: navigation pushes, sheet presentation, context menus, keyboard appearance, pull to refresh. Use the system component and its transition unless there is a product reason to differ. A custom navigation transition that loses the interactive back swipe is a regression.

## SwiftUI

### State-driven animation

```swift
withAnimation(.snappy) { isOn.toggle() }

Circle()
    .scaleEffect(isPressed ? 0.97 : 1)
    .animation(.spring(duration: 0.25, bounce: 0), value: isPressed)
```

- Always pass `value:` to `.animation`. The form without it is deprecated and animates everything.
- `withAnimation` animates every view that depends on the changed state. `.animation(_:value:)` scopes it to one view.
- SwiftUI animations are interruptible and retarget from the current value by default. Springs keep their velocity.

### Springs

| Token | SwiftUI |
|---|---|
| `snappy` | `.spring(duration: 0.25, bounce: 0)` |
| `smooth` | `.spring(duration: 0.4, bounce: 0)` |
| `lively` | `.spring(duration: 0.45, bounce: 0.3)` |

The built-in `.snappy`, `.smooth` and `.bouncy` presets are longer than these tokens (about half a second). Use explicit values so the app matches MOTION.md. For gesture releases, `.interpolatingSpring` accepts an initial velocity, and a spring that replaces a running animation carries its velocity over.

Curves: `.easeOut(duration:)`, `.easeInOut(duration:)`, or `.timingCurve(0.22, 1, 0.36, 1, duration: 0.2)` for the `out` token.

### Appearing and leaving

```swift
if showBanner {
    Banner()
        .transition(.move(edge: .top).combined(with: .opacity))
}
```

Transitions run only when the insertion or removal happens inside an animated state change. `.asymmetric(insertion:removal:)` gives a shorter exit. `.contentTransition(.numericText())` animates changing numbers; `.contentTransition(.opacity)` crossfades text.

### Shared elements

- `matchedGeometryEffect(id:in:)` with a `@Namespace` morphs one view into another within the same hierarchy. Only one of the pair is present at a time.
- For navigation, `.matchedTransitionSource(id:in:)` on the source and `.navigationTransition(.zoom(sourceID:in:))` on the destination give the system zoom, with the interactive dismiss gesture included.

### Sequences

`PhaseAnimator` steps through a list of phases. `KeyframeAnimator` runs separate tracks per property with their own timing. Both replace chains of delayed `withAnimation` calls, which drift.

### Gestures

```swift
.offset(y: dragOffset)
.gesture(
    DragGesture()
        .onChanged { dragOffset = max(0, $0.translation.height) }
        .onEnded { value in
            let fast = value.predictedEndTranslation.height > height * 0.5
            withAnimation(.spring(duration: 0.4, bounce: 0)) { dragOffset = fast ? height : 0 }
        }
)
```

`predictedEndTranslation` is the projection described in [gestures.md](gestures.md). Do not wrap `onChanged` updates in `withAnimation`; the view must track the finger exactly.

### Feedback and symbols

`.sensoryFeedback(.selection, trigger: value)` for haptics tied to a state change. `.symbolEffect(.bounce, value: count)` and related effects animate SF Symbols with the system's own timing.

### Reduced motion

```swift
@Environment(\.accessibilityReduceMotion) private var reduceMotion

.transition(reduceMotion ? .opacity : .move(edge: .bottom).combined(with: .opacity))
```

The system does not do this for custom animations. Check the environment value wherever a view moves, scales or rotates, and substitute opacity.

### Cost

- Animate `offset`, `scaleEffect`, `rotationEffect` and `opacity`. Animating `frame` or `padding` lays out the hierarchy each frame.
- `.drawingGroup()` flattens a complex animated view into one layer; measure before and after.
- Heavy `body` recomputation during an animation shows as hitches. Narrow the state the animated view depends on.

## React Native

Use Reanimated with Gesture Handler. The built-in `Animated` API is acceptable only for opacity and transform with `useNativeDriver: true`.

### Shared values and styles

```tsx
const pressed = useSharedValue(0);
const style = useAnimatedStyle(() => ({
  transform: [{ scale: withSpring(pressed.value ? 0.97 : 1, { stiffness: 632, damping: 50, mass: 1 }) }],
}));

<Animated.View style={style} />
```

- Shared values change on the UI thread without re-rendering React. Anything that changes per frame lives in one.
- Get `stiffness` and `damping` for a token from `<skill-dir>/scripts/spring.mjs`. Newer Reanimated versions also accept a duration-based spring config; check the installed version.
- `withTiming(value, { duration: 200, easing: Easing.bezier(0.22, 1, 0.36, 1) })` for curve-based moves.

### Appearing, leaving and layout

```tsx
<Animated.View entering={FadeInDown.duration(200)} exiting={FadeOut.duration(120)} layout={LinearTransition.springify()} />
```

Entering and exiting presets cover most cases. Override their duration and easing so they match the tokens; the defaults are longer and bouncier than a Quiet register wants.

### Gestures

```tsx
const y = useSharedValue(0);
const pan = Gesture.Pan()
  .onChange((e) => { y.value = Math.max(0, y.value + e.changeY); })
  .onEnd((e) => {
    const close = e.velocityY > 500 || y.value > height / 2;
    y.value = withSpring(close ? height : 0, { velocity: e.velocityY, stiffness: 247, damping: 31.4 });
  });
```

The handlers run on the UI thread, so the view tracks the finger even when JavaScript is busy. Pass the release velocity into the spring.

### Reduced motion

`useReducedMotion()` from Reanimated returns the system setting. Animation functions also take a `reduceMotion` option (`ReduceMotion.System` by default in recent versions), which jumps to the end value. Confirm the default in the installed version, and substitute a fade where a jump would lose meaning.

### Cost

- Animate `transform` and `opacity`. Animating `width`, `height`, `top` or `margin` triggers layout on every frame.
- Test on a low-end Android device in a release build. Debug builds and simulators mislead in both directions.
- Long lists: animate only visible rows and avoid layout animations on the list container.

## Android (Compose) and Flutter

Not covered in depth. The same rules apply. In Compose, start from `animate*AsState`, `AnimatedVisibility`, `AnimatedContent`, `updateTransition` and `spring()` specs, and read "Remove animations" through `Settings.Global.ANIMATOR_DURATION_SCALE`. In Flutter, start from implicit animations (`AnimatedContainer`, `AnimatedSwitcher`), `Hero`, and `MediaQuery.disableAnimations`.
