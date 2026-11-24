# Horizon: the real planet, lit by computed air

An experiment, on its own branch, in what the homepage's view from orbit could be. It is not linked from the site. The procedural planet in `components/orbit/` is untouched and stays the baseline; `/horizon/orbit` shows it on the same page for comparison.

## The idea

The procedural planet drew its clouds from noise, and noise is what made it look like a game. Here nothing is invented:

- **Cloud** is one day of NASA VIIRS true-colour imagery (22 November 2026), compared pixel by pixel with the cloud-free Blue Marble to leave only the cloud.
- **Land and sea** are the Blue Marble Next Generation; **city lights** are the Black Marble.
- **Light** is computed. Two small tables built on the CPU at start-up hold how sunlight survives a path through the air (Bruneton and Neyret, 2008) and how much has bounced more than once (Hillaire, 2020). One fragment shader then integrates the air along each pixel's ray. The orange under the blue at sunrise, the pink on cloud tops near the terminator and the dark of the planet's shadow all fall out of that; none is painted.
- **The sun and moon** are where the almanac puts them for the scene's date, and the **camera** rides a real circular orbit (Kepler's period for its altitude) while the planet turns under it.
- **Exposure** follows the light like a camera's meter, adapting over a few seconds, so a pass from night into day is one continuous shot.
- **The print** is Blender's AgX curve, which rolls highlights off toward white as film does, then a white balance, then Display P3 where the screen has it.

## Files

| File | What it holds |
|---|---|
| `atmosphere.ts` | The air's constants and the two tables |
| `glsl.ts` | The shader: air, cloud, sea, land, lamps, stars, sun, print |
| `ephemeris.ts` | Sun, moon, orbits, and aiming a camera |
| `renderer.ts` | WebGL 2 set-up, map loading, the `Look` numbers |
| `stage.ts` | The directions (`day`, `dawn`, `night`, `now`), the meter, and what the opening and the hand-off do |
| `SOURCES.md` | Where each map comes from and its terms |
| `../../lab/horizon.html` | A bare lab: every number as a query parameter |
| `../../scripts/horizon-maps.mjs` | Builds the maps from the originals |
| `../../scripts/horizon-shot.mjs`, `horizon-site.mjs` | Stills of the lab, and stills and films of the real site |

## Seeing it

```sh
cd site && npm ci && npm run content
npm run dev                      # then /horizon, /horizon/day, /horizon/dawn, /horizon/night, /horizon/now
npm run lab                      # then http://localhost:4317/lab/horizon.html?dir=dawn
```

`?rate=20` on a `/horizon/<direction>` page hurries the orbit; `?cloud=clouds-16k` uses the 16,384-pixel cloud map if it has been built locally (it is 27 MB and is not committed).

## Known limits

- Sharpness: each direction lays a regional cloud map (about 2.4 km a pixel, 4 to 5 MB) over the global one (about 5 km a pixel), cut for the part of the globe it flies over. That is the full resolution of the imagery downloaded so far. GIBS serves the same day at 1 km and finer; going sharper means fetching regional tiles at that scale.
- One day of polar-orbiting imagery has seams between passes (a thin straight line is visible in the day view) and no data in the polar night (an older composite fills in).
- Weather: the clouds drift along the mean wind for their latitude (trade easterlies, mid-latitude westerlies) on a clock 150 times faster than life, slowing to a stop after about eighteen hours of drift. They are carried, not evolved: no cloud forms or dissolves, and storms do not turn. Real evolution needs a sequence of real frames (geostationary imagery or a weather model's cloud fields).
- On a phone the shade is deepened over the lower third so the text there stays readable, which dims the planet under it.
- Clouds are a lit layer with relief, not volumes: no towers casting long shadows across a deck.
- With reduced motion the experimental pages show no scene yet (there is no still).
