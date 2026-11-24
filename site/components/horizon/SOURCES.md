# Sources and terms for the horizon maps

Checked 24 November 2026. The files in `public/horizon/earth/` are derivatives made by `scripts/horizon-maps.mjs`. These are experiments; the rights question at the end has to be settled before any of this is used in production.

| Map | Made from | Host | Terms as the provider states them |
|---|---|---|---|
| `clouds.jpg` | VIIRS (NOAA-20) Corrected Reflectance, True Color, 22 November 2026, eight 4096-pixel requests to the GIBS WMS | `gibs.earthdata.nasa.gov` | NASA Earthdata data-use guidance: data are released under Creative Commons Zero. GIBS asks for an acknowledgement. |
| `clouds.jpg`, where that day has no data or the ground is snow | Blue Marble cloud composite, `cloud_combined_2048.jpg` | `assets.science.nasa.gov` | NASA media guidelines: generally not copyrighted in the United States; credit NASA; no implied endorsement. |
| `colour.jpg` | Blue Marble Next Generation with topography and bathymetry, December 2004, `world.topo.bathy.200412.3x21600x10800.jpg` | `assets.science.nasa.gov` | As above; credit "NASA Earth Observatory". |
| `night.jpg` | Black Marble 2016, `BlackMarble_2016_3km.jpg` | `assets.science.nasa.gov` | As above; credit NASA Earth Observatory. |

Requested acknowledgement for GIBS: "We acknowledge the use of imagery provided by services from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS)."

## Open question before production

NASA's media guidelines describe permitted use as informational and not promotional, and forbid any suggestion that NASA endorses a product. A product homepage sits in a grey area for the three files from `assets.science.nasa.gov`. The GIBS imagery carries the clearest wording (CC0). A production version should either build every layer from CC0 Earthdata products, or get this read by someone qualified. The NASA insignia and name must not appear as branding either way; a plain credit line on the Credits page is what the guidelines ask for.

## Not used

- The 8,192-pixel and 43,200-pixel NASA cloud-only maps are no longer on NASA hosts (only on the Internet Archive), so they were left alone.
- EUMETSAT and Himawari imagery: terms not confirmed (EUMETSAT) or attribution chain more involved (JMA), and not needed.
