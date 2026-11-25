# What stands between the horizon scene and production

Historical production-readiness record, written 24 November 2026 before PR #153 merged the Horizon stage. Preserve the imagery provenance and unresolved rights/device risks below; statements about branch or production status describe that checkpoint, not current deployment. See SOURCES.md and the live stage for the current implementation.

## What the picture is, and what to call it

| Part | What it is | Say | Do not say |
|---|---|---|---|
| Cloud | Satellite imagery of one past day, 22 November 2026 (NASA VIIRS on NOAA-20) | "Cloud as a NASA satellite saw it on 22 November 2026" | "live", "current weather", "real time" |
| Cloud-top height | NASA's retrieved cloud properties for the same satellite and day (the GIBS rendering of CLDPROP_L2_VIIRS_NOAA20), South Pacific region only, gaps filled and smoothed | "measured cloud-top heights, smoothed" | "3D cloud scan", "volumetric" |
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

`day`, `afternoon`, `sunrise`, `dawn` and `night` each have a still (`public/horizon/stills`, made by `scripts/horizon-stills.mjs`): the scene's first live frame. With reduced motion set the live scene never starts and the still is the picture. If WebGL 2 is missing or the shader fails, the still stays. `now` has no still, because its first frame depends on the moment; with reduced motion it shows black.

The live scene fades in over the still in 1.4 s. The two are framed alike on any screen narrower than 2.4:1 (wide) or 4:5 (tall). On an ultrawide screen beyond 2.4:1 the still is cropped differently from the canvas and the hand-over would show.

If a map the picture needs (the cloud, the regional cloud, the surface) fails to load, or the browser takes the graphics context away, the scene reports itself broken, the page disposes of it and the still is the picture again. This path is written and typechecked; it has not been exercised by a forced failure in a browser.

The scene's code and maps are not requested until the page's own `load` event, so they cannot delay the headline, the navigation or the install button.

## Browsers: one engine tested

- Tested: Chromium (Playwright's build) on macOS, drawing through Metal on an Apple M5.
- Not tested: Safari on macOS, Safari on iPhone or iPad, Firefox, any Windows or Android browser, any Intel or older Apple GPU.
- The shader no longer calls `smoothstep` with its edges reversed (undefined in GLSL, and a likely difference between drivers); every falling edge is written as one minus a rising one.
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

The cloud-top height map adds about 6 MB on a computer and 2 MB on a phone to the totals above.

Each device is now sent files no larger than it keeps (`scripts/horizon-sizes.mjs` makes them, `stage.ts` chooses): a computer downloads 8.7 MB for a South Pacific view and 6.9 MB for the night view, a phone 3.1 MB and 2.5 MB. That is down from about 20 MB, and the decode peak on a phone falls with it. It is still heavy for a homepage. The next steps, not done: AVIF or WebP maps (roughly half again), a regional surface and lights map in place of the globe, and loading the regional cloud first so the scene can start before the rest arrives.

## Energy: designed for, not measured

- The scene draws about 30 frames a second, stops when the page is hidden or the hero is off screen, and uses one draw call.
- Measured cost of one frame on this Apple M5, in headless Chromium, including a read-back that inflates it: 13 to 15 ms at 3840x1600 for the day, afternoon, sunrise and night views and 20 ms for dawn, 8 to 10 ms at 1560x1950. The measured heights and their shadows added about a third.
- A machine that cannot hold thirty frames a second now gets fewer pixels: when most of a second's frames arrive late the canvas steps down by about a third of its pixels, as far as half its linear size. Written, not yet seen working on a slow machine.
- Not measured: power draw, heat, behaviour in Low Power Mode (where Safari holds pages to 30 frames a second anyway), or any phone.

## Seams between satellite passes: not resolved

The cloud is a mosaic of passes about 100 minutes apart, and where two meet there is a straight edge: the cloud has moved between them and the two were seen from opposite sides. It shows most at a low sun. The height map has the same edges. No blend removes it honestly, because the two sides are different moments. The route that does is imagery with no passes: the geostationary satellites (GOES-West, GOES-East, Himawari), which GIBS serves every ten minutes. A test for 22 November 2026 (GOES-West red visible band, 21:00 and 22:00 UTC, 20 to 50 south, 110 to 160 west) showed a seamless picture, and real change between the hours: cells form and fade. A short regional sequence of those frames, cross-faded, would give both a seamless map and weather that evolves instead of one map sliding. It covers day only in visible light (the infrared band covers night) and only the disc each satellite sees. Not built.

## Choosing what a visit opens on

`/horizon/visit` picks one of five curated views on the server for each request, so the page arrives with the still that matches. From there the orbit carries the camera on and the light changes. The start within a view is not varied yet: doing that needs a still per start, or a first frame that is allowed to differ from its still.
