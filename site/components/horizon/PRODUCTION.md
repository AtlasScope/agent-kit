# What stands between the horizon scene and production

Written 24 November 2026. Each item says what is settled, what is only documented, and what nobody has tested.

## What the picture is, and what to call it

| Part | What it is | Say | Do not say |
|---|---|---|---|
| Cloud | Satellite imagery of one past day, 22 November 2026 (NASA VIIRS on NOAA-20) | "Cloud as a NASA satellite saw it on 22 November 2026" | "live", "current weather", "real time" |
| Cloud movement | Simulated: the map is carried along the long-term mean wind for each latitude, 150 times faster than life | "simulated drift" | "observed motion", "forecast" |
| Land, sea, city lights | NASA composites from 2004 and 2016 | "Blue Marble", "Black Marble" | "today's lights" |
| Sun, moon, orbit | Computed from the almanac and Kepler's laws for the scene's date | "computed" | "tracked", "the ISS" (the orbit is an invented one at 1,800 km) |
| Air, light, colour | Computed scattering model | "computed" | "photograph" |

The `now` direction uses the real sun and moon for the moment of the visit over the cloud of 22 November 2026. It is the one most likely to be mistaken for live data and should not ship without that sentence beside it.

## Imagery rights: documented, not resolved

- The cloud layer (GIBS) is released under Creative Commons Zero. GIBS asks for an acknowledgement.
- The surface colour, city lights and the fallback cloud composite come under NASA's media guidelines: generally not copyrighted, credit requested, no implied endorsement, and the guidelines describe permitted use as informational and not promotional. A product homepage is a grey area for these three.
- Before production, either rebuild those three layers from CC0 Earthdata products (the surface from VIIRS or MODIS cloud-free composites, the lights from the Black Marble science product VNP46), or have the current files cleared by someone qualified. This is a decision for the owner, not something code settles.

## Attribution: not yet on the site

A credit belongs on the Credits page (CREDITS.md feeds it; its table rows are parsed by the site build, so the row format must be kept). Proposed wording: "Homepage view from orbit: cloud imagery from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS); Blue Marble and Black Marble imagery by NASA Earth Observatory. NASA does not endorse Agent Kit." It is not added on this branch, because the page is not linked from the site.

## Reduced motion and no WebGL: done for three directions

`day`, `dawn` and `night` each have a still (`public/horizon/stills`, made by `scripts/horizon-stills.mjs`): the scene's first live frame. With reduced motion set the live scene never starts and the still is the picture. If WebGL 2 is missing or the shader fails, the still stays. `now` has no still, because its first frame depends on the moment; with reduced motion it shows black.

The live scene fades in over the still in 1.4 s. The two are framed alike on any screen narrower than 2.4:1 (wide) or 4:5 (tall). On an ultrawide screen beyond 2.4:1 the still is cropped differently from the canvas and the hand-over would show.

## Browsers: one engine tested

- Tested: Chromium (Playwright's build) on macOS, drawing through Metal on an Apple M5.
- Not tested: Safari on macOS, Safari on iPhone or iPad, Firefox, any Windows or Android browser, any Intel or older Apple GPU.
- Needs: WebGL 2, half-float textures with linear filtering (core in WebGL 2), `textureGrad` (core in GLSL ES 3.00). Display P3 output is used where `drawingBufferColorSpace` exists and the screen reports P3; otherwise sRGB.
- AVIF stills have no fallback format. Every current Safari, Chrome and Firefox reads AVIF.

## Graphics memory: reduced, estimated, not measured on a phone

Cloud and city-light maps are stored as one channel. Sizes kept on the GPU, with mipmaps:

| Map | Computer | Phone |
|---|---|---|
| Global cloud | 4096 wide, 11 MB | 4096 wide, 11 MB |
| Regional cloud | 6827 wide, 26 MB | 4096 wide, 9 MB |
| Surface colour | 4096 wide, 45 MB | 2048 wide, 11 MB |
| City lights | 4096 wide, 11 MB | 2048 wide, 3 MB |
| Total | about 93 MB | about 34 MB |

Before this change the same maps took about 640 MB. Two cautions remain. The files are larger than what is kept (the global maps are 8,192 pixels wide), and a browser decodes a whole JPEG before it is drawn down, which is a brief peak of about 130 MB per large image; phones should be served smaller files, not asked to shrink large ones. And the download is about 20 MB of JPEG per direction, far too much for a homepage: production needs smaller regional files and a progressive order (still first, then maps).

## Energy: designed for, not measured

- The scene draws about 30 frames a second, stops when the page is hidden or the hero is off screen, and uses one draw call.
- Measured cost of one frame on this Apple M5, in headless Chromium, including a read-back that inflates it: about 10 ms at 3840x1600 and about 7 ms at 1560x1950.
- Not measured: power draw, heat, behaviour in Low Power Mode (where Safari holds pages to 30 frames a second anyway), or any phone. The old scene's resolution governor is not wired to this one, so a slow GPU has nothing to fall back on but the still. That is the first thing to add before real-device testing.
