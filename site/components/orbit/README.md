# The orbit scene

The view behind the homepage: a planet at first light, seen from 420 km up. Every pixel is computed in the visitor's browser from the code in this folder. There is no photograph, video or generated image; the still images in `public/hero/` are made from this same code by `scripts/build-hero-images.mjs`.

It runs on WebGL2 with no library. `LaunchHero.tsx` loads it after the page's words, owns the clock, and falls back to the still when it cannot run.

## What is drawn

- **The globe.** A sphere of Earth's size, found per pixel by intersecting the view ray with it. Nothing is a mesh.
- **The ground.** Sea, land and ice from fractal noise sampled on the sphere: warped continents, eroded relief, pack ice broken by a cellular pattern, and a tracer in the sea drawn into filaments by a flow field.
- **The weather.** A field of billows eaten away by dry air (the erosion idea from Guerrilla's Nubis clouds), with the air wound into one storm along a logarithmic spiral. Stored as a height field: where the cloud top is, and how dense.
- **The air.** Rayleigh and Mie scattering and ozone absorption with Earth's measured coefficients, integrated along each ray. The columns of air between any point and the sun come from a table built once on the CPU.
- **The light.** The sun, reddened and cut off by the air and the planet; a moon for the night side; skylight; a Gaussian (Beckmann) sun glitter on the sea whose width follows the Cox-Munk wind relation; cloud shadows under both lights.
- **The upper air.** An aurora (thin curtains on an oval round a magnetic pole, integrated analytically across their thickness) and a line of airglow.
- **The sky.** Stars hashed onto a cube, the sun's disc, and a lens glare around it.

## How a frame is made

| Pass | When | What it does | File |
|---|---|---|---|
| bake | once per screen size | runs the generators for every texel of the map and stores the answers | `glsl/world.ts`, `glsl/bake.ts` |
| shade | when the sun or the clouds move | cloud shadows, under the sun and under the moon | `glsl/shade.ts` |
| scene | every frame | rays, ground, clouds, air, sun, to linear light | `glsl/scene.ts` |
| aurora | every frame, half size | the aurora alone | `glsl/aurora.ts` |
| post | every frame | stars, aurora, glare, exposure, tone curve, dither | `glsl/post.ts` |

The generators are expensive (hundreds of noise evaluations a texel) and the frame is not (lookups into what they made). That split is what lets the scene be rich and still run on a laptop.

**The map.** The baked textures cover the part of the globe the camera can see, laid out so that a texel is about a screen pixel: fine in the foreground, coarse toward the horizon, and continuing a little past it. `glsl/common.ts` explains the layout and `camera.ts` sizes it. The map belongs to the globe, so the camera can move and the weather can be carried round without baking again.

**Motion.** Nothing is re-generated over time. The weather drifts because the cloud lookups are turned through a slowly growing angle (the whole layer about the camera's nadir, the storm about its own centre). The aurora, the stars and the camera's float run off the clock. `score.ts` holds the opening and the hand-off.

## Files

| File | What it holds |
|---|---|
| `index.ts` | what the page imports |
| `renderer.ts` | the WebGL2 context, the passes in order, quality tiers, the resolution governor, context loss |
| `params.ts` | every number that shapes the look, and the two reference frames |
| `score.ts` | what the camera and the light do over time |
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

`scripts/orbit-capture.mjs` saves frames of the lab, or of the running site, at exact window sizes.

The lab's address also takes `?world=day` and `?world=ink`: the two directions that were tried against this one (`site/lab/worlds.ts`). `?debug=1` and up show the raw maps, which is how to tell a fault in a generator from a fault in drawing it.

## Quality and speed

- **Tiers.** `high`, `medium` and `low` in `renderer.ts` set the pixel budget, the sample counts and the map's resolution. The page guesses a tier from the device; the graphics chip's name, where the browser gives it, can step the guess down.
- **Governor.** If frames arrive late for about half a second, the renderer draws 20% fewer pixels in each direction, down to half. It never steps back up on the same page.
- **Pace.** After the opening has settled the page draws about thirty frames a second; a moving pointer gets every frame.
- **Not drawn.** Off screen, in a background tab, or with reduced motion, nothing is drawn.

Measured on an Apple M5 at a 1440 by 835 window (2158 by 1251 pixels): about 6 ms a frame on `high`, of which the cloud walk is about 2, the air about 1, the aurora under 1. The maps (2976 by 856, four textures) take about 100 ms to make, once. Graphics memory is about 85 MB at that size.

## When it cannot run

`createOrbit` returns null without WebGL2, without a float render target, or on a software renderer (recognised by name, because some pass the browser's own test for one); a shader that fails to compile reports through `onError`, and so does a machine that cannot reach twenty frames a second at the smallest size. In each case the page keeps its still. If the browser takes the graphics context away, the still shows until it is given back, and the scene rebuilds itself.

## Known limits

- The clouds are a height field. They have relief, self-shadowing and soft edges, but no overhangs and no light scattered through their sides.
- The weather is carried, not simulated. After about five minutes it has drifted as far as the map's margin allows and holds there.
- Light scattered more than once in the air is approximated by one soft fill term, tuned by eye.
- The scene pass is one draw at full size. Drawing clouds and air at half size and up-sampling would roughly halve its cost.
