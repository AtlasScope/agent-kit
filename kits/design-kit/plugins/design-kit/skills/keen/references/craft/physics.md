# Physics

How an interface responds to a hand: what moves, how it feels to push, and what it says while it moves. Anything beyond a few transitions belongs to `/motion`, which has the values, the measurement and the proof. This card is for deciding what the motion should mean.

## Moves

- **Motion follows the idea.** A product built on tides moves slowly and continuously; a trading tool snaps; a children's app overshoots. Decide the material first (heavy, light, elastic, fluid, mechanical) and let it set every duration and curve, the way the idea sets the palette.
- **Springs over durations for anything touched.** A damped spring has no fixed length: it starts from the current position and velocity and settles, so a gesture can be interrupted and thrown (Apple, "Designing Fluid Interfaces", WWDC 2018). Define springs by how bouncy and how quick they feel, not by stiffness numbers. `/motion` has `spring.mjs` to turn feel into values.
- **Respond within a frame.** Feedback must start with the input; it may finish later. A response delayed past about 100ms stops feeling caused by the action (Nielsen's response-time limits, after Miller 1968).
- **Size and distance cost time.** Fitts's law (1954): the time to hit a target grows with distance and shrinks with size. Put frequent targets near and make them large; this is physics too.
- **Weight shows in anticipation and settle.** Disney's principles of animation (Thomas and Johnston, *The Illusion of Life*, 1981) give heavy things slow starts and soft landings, light things quick starts. Overshoot says elastic; no overshoot says solid.
- **Continuity explains change.** When a thing moves from one place to another, show the move: the eye follows and understands what happened. A cut between two states makes the person reconstruct it.
- **Stillness is part of the motion design.** Endless movement in the periphery competes with the content. `measure.mjs` counts it. Ambient motion is a strong signature in small doses (a slow tide line, a breathing indicator) and a distraction in large ones.
- **Reduced motion keeps the meaning.** When the system asks for less motion, keep the change and drop the travel: a fade instead of a slide, a still image instead of a loop.

## Hand-off

Write each animation as a `/motion` spec line (element, job, property, duration, curve, reduced version) and run `/motion build` or `/motion storyboard` when there is more than one moving part.

## Sources

Apple, "Designing Fluid Interfaces" (WWDC 2018). Fitts, "The information capacity of the human motor system" (1954). Thomas and Johnston, *The Illusion of Life* (1981). Nielsen, "Response Times: The 3 Important Limits" (1993). WCAG 2.2, 2.3.3.
