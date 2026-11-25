# The orbit scene

The view behind the homepage: a planet at the moment of sunrise, seen from 420 km up. Every pixel is computed in the visitor's browser from the code in this folder. There is no photograph, video or generated image; the still images in `public/hero/` are made from this same code by `scripts/build-hero-images.mjs`.

It runs on WebGL2 with no library. `LaunchHero.tsx` loads it after the page's words, owns the clock, and falls back to the still when it cannot run.

## What is drawn

- **The globe.** A sphere of Earth's size, found per pixel by intersecting the view ray with it. Nothing is a mesh.
- **The ground.** Sea, land and ice from fractal noise sampled on the sphere: warped continents with Earth-like heights, eroded relief, pack ice broken by a cellular pattern. The sea carries a tracer (plankton, the stuff that glows at night) sheared by zonal currents and drawn out by five nested eddy fields, each sampled through the last, so it compounds into marbled filaments. That is the abstract "ink" direction's own technique, kept for the sea, where it is also what a real bloom looks like from orbit. On the night side it glows faintly in the site's green.
- **The weather.** The air is carried first: each point is followed back along a slowly varying wind (the curl of a broad noise) and the storm's whirl, and the weather's large fields are read where the air came from, which draws them into the sweeps, hooks and filaments of real weather. Where cloud may be is decided from that carried air, with the storm's rain bands on a logarithmic spiral round a small eye. What the cloud is made of is decided where it stands: rounded heaps at three sizes, each cellular point drawing its own size and presence (no two neighbours repeat), looked up through a warp of their own size, strung into streets along the wind, and eaten away hardest at their margins by fine detail (the erosion idea from Guerrilla's Nubis clouds). Height comes from the large scales only (a deck is a few kilometres deep over tens of kilometres); the small heaps are texture. Thin cloud lets the sea through. High cirrus is combed into thin streaks. Stored as a height field: where the cloud top is, and how dense.
- **The air.** Rayleigh and Mie scattering and ozone absorption with Earth's measured coefficients, integrated along each ray. The columns of air between any point and the sun come from a table built once on the CPU.
- **The light.** The sun, reddened and cut off by the air and the planet; a moon for the night side; skylight; a Gaussian (Beckmann) sun glitter on the sea whose width follows the Cox-Munk wind relation; cloud shadows under both lights. Cloud takes light with wrapped lighting (light leaks out of every side), gives back more where it is thick, and tilts the light by a slope blended across scales, so a deck reads as cloud rather than gravel.
- **The upper air.** An aurora: three thin curtains on an oval round a magnetic pole, integrated analytically across their thickness. Their folds travel (long waves drift one way, tighter kinks run the other and grow and fade), a bright ribbon at the foot traces every fold, and rays stand on it in clumped bundles that drift along the curtain, green fading upward to oxygen's red, with nitrogen's magenta at the foot. A surge lights one stretch of the oval. A cheap look along each ray finds the stretch that passes near the oval, and every step is spent there, on a grid that starts at a different place for each pixel, so folds come out smooth instead of in zigzags. Then a line of airglow.
- **The sky.** Stars hashed onto a cube, the sun's disc, and a lens glare around it.
- **The dawn.** Near the sun, light runs a long way through the air along the planet's edge and is thrown forward many times over, so the limb blazes for tens of degrees either side of it. Single scattering gives the colour of the layers but not that, so the post pass draws it from the angle above the limb and the bearing from the sun: a thin seam on the horizon, golden near the sun and rose further off, with a soft aureole round the disc. It comes up before the sun does, which is what makes the sun belong to the horizon.
- **The print.** A bloom from the scene's own chain of halved copies (the disc is held to a ceiling first, so it cannot swamp them), a tone curve, and the grade applied to the encoded picture: contrast as an S about the middle of the eye's scale, then a split tone, shadows toward the sea's blue and highlights toward the dawn.

## How a frame is made

| Pass | When | What it does | File |
|---|---|---|---|
| bake | once per screen size | runs the generators for every texel of the map and stores the answers | `glsl/world.ts`, `glsl/bake.ts` |
| shade | when the sun or the clouds move | cloud shadows, under the sun and under the moon | `glsl/shade.ts` |
| scene | every frame | rays, ground, clouds, air, sun, to linear light | `glsl/scene.ts` |
| aurora | every frame, half size | the aurora alone | `glsl/aurora.ts` |
| post | every frame | stars, aurora, bloom, glare, the dawn on the limb, exposure, tone curve, grade, dither | `glsl/post.ts` |

The generators are expensive (hundreds of noise evaluations a texel) and the frame is not (lookups into what they made). That split is what lets the scene be rich and still run on a laptop.

**The map.** The baked textures cover the part of the globe the camera can see, laid out so that a texel is about a screen pixel: fine in the foreground, coarse toward the horizon, and continuing a little past it. `glsl/common.ts` explains the layout and `camera.ts` sizes it. The map belongs to the globe, so the camera can move and the weather can be carried round without baking again.

**The climate.** While the page stays open the view moves between three conditions of the same sky: quiet (the resting state, and about half of any visit), luminous (the sun clears the limb by a degree or so and the cloud tops catch it) and magnetic (an aurora develops over half a minute, its brightest stretch travels along the oval and flares, then it fades). `climate.ts` plans each visit from a seed: which state it opens in, then passages that rise, hold and fall over one to three minutes with at least a minute of quiet between them. It only moves numbers the renderer reads each frame, so it never rebuilds a map. The lab plays it with `?climate=<seed>` (`&speed=10` to watch it condensed, `&t=95` to hold a moment), and the homepage takes `?sky=<seed>` to replay a visit.

**Motion.** Nothing is re-generated over time. The weather drifts because the cloud lookups are turned through a slowly growing angle (the whole layer about the camera's nadir, the storm about its own centre). The aurora, the stars and the camera's float run off the clock. `score.ts` holds the opening and the hand-off.

## Files

| File | What it holds |
|---|---|
| `index.ts` | what the page imports |
| `renderer.ts` | the WebGL2 context, the passes in order, quality tiers, context loss |
| `governor.ts` | how many pixels to draw, from how late frames arrive |
| `params.ts` | every number that shapes the look, and the two reference frames |
| `score.ts` | what the camera and the light do over time |
| `climate.ts` | how the sky changes while the page stays open: quiet, luminous and magnetic passages, planned per visit |
| `camera.ts` | the pose, the framing shared with the stills, the map's extent |
| `atmosphere.ts` | the air's coefficients, the lookup table, the scattering GLSL |
| `gl.ts` | small WebGL2 helpers |
| `glsl/` | the shaders, as commented template strings |

## Changing the look

```sh
cd site && npm run lab
```

The lab (`site/lab/`, served by `scripts/orbit-lab.mjs`) is a page of sliders for every number in `params.ts`, with the opening on a scrubber and stage sizes for desktop and phone. It is a development tool: nothing in `app/` links to it and `next build` never sees it. It listens on the local machine only; start it with `HOST=0.0.0.0` to open it from a phone on the same network. Everything changed from the defaults is kept in the address, so a link reproduces a frame. Copy the look from the lab into `DEFAULTS` in `params.ts`, then remake the stills:

```sh
node scripts/build-hero-images.mjs
```

`scripts/orbit-capture.mjs` saves frames of the lab, or of the running site, at exact window sizes, and `scripts/orbit-sheet.mjs` lays a set of them side by side on one labelled sheet for comparing looks and moments. `scripts/orbit-compile.mjs` times each shader's cold compile, and `scripts/orbit-governor.mjs` watches the resolution governor in three situations made on purpose.

The lab's address also takes `?world=day` and `?world=ink`: the two directions tried against this one (`site/lab/worlds.ts`), drawn by the same renderer so the three compare like for like. `?debug=1` and up show the raw maps, which is how to tell a fault in a generator from a fault in drawing it.

## Quality and speed

- **Tiers.** `high`, `medium` and `low` in `renderer.ts` set the pixel budget, the sample counts and the map's resolution. The page guesses a tier from the device; the graphics chip's name, where the browser gives it, can step the guess down.
- **Governor.** If frames arrive late for about half a second (judged by the median of the recent gaps between frames, so a hitch does not count and a slow chip does, however slow), the renderer draws 20% fewer pixels in each direction, down to half. Each step is a test: if frames come no sooner, the pixels were not the limit (a phone holding the page to thirty frames a second, a busy page), so the step is taken back and the governor stops. It never steps back up on the same page. Far too slow with nothing left to try, it gives up and the page keeps its still.
- **Pace.** After the opening has settled the page draws about thirty frames a second; a moving pointer gets every frame.
- **Not drawn.** Off screen, in a background tab, or with reduced motion, nothing is drawn.

Measured on an Apple M5 at a 1440 by 835 window (2158 by 1251 pixels), before the art pass: about 6 ms a frame on `high`. After it, on Windows with an AMD Radeon RX 9070 XT through Direct3D 11, the same window: 1.5 ms a frame (0.8 before the pass), 0.7 ms in a phone-sized window; the maps take about 18 ms to make. The bloom adds a chain of halved copies to the scene target (a third more memory for it).

**Compiling.** On Windows the browser hands the driver HLSL, whose compiler copies a function's whole body into every place it is called. The generators called their fractal sums dozens of times and the aurora called its light function from several places, so the shaders took seconds to compile before the first frame could be drawn. The independent sums of each stage now go through one loop with one call, and the aurora's light through one call in a loop: the same picture, with the cold compile of the six shaders down from about 3.9 s to 2.3 s on the machine above, and the first frame from 4.5 s to 2.2 s. Loops also count to their bound plus a uniform that is always zero, so no compiler unrolls them.

## When it cannot run

`createOrbit` returns null without WebGL2, without a float render target, or on a software renderer (recognised by name, because some pass the browser's own test for one); a shader that fails to compile reports through `onError`, and so does a machine that cannot reach twenty frames a second at the smallest size. In each case the page keeps its still. If the browser takes the graphics context away, the still shows until it is given back, and the scene rebuilds itself.

## Known limits

- The clouds are a height field. They have relief, self-shadowing and soft edges, but no overhangs and no light scattered through their sides.
- The weather is carried, not simulated. After about five minutes it has drifted as far as the map's margin allows and holds there.
- Light scattered more than once in the air is approximated by one soft fill term, tuned by eye.
- The scene pass is one draw at full size. Drawing clouds and air at half size and up-sampling would roughly halve its cost.
- The dawn on the limb and the aureole are drawn in the post pass from geometry, not from the air: they are what multiple scattering and a lens would add, tuned by eye.
- The aurora's march is jittered per pixel and the half-size target is read back with four taps; at very low resolution a little grain can remain.
- Cold compile on Windows is still about two seconds; the opening plays over the still meanwhile and the scene fades in when it is ready.
