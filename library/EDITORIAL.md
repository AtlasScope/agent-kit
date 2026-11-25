# Library editorial standard

A prompt should have a distinct job, be easy to understand and deliver a useful result. The copied text includes the authority, evidence, scope, stop condition and output that the person needs. Recipes compose existing capabilities without contradictory instructions; do not add duplicates for the sake of count.

`library.json` is the source for entries, categories, replacement relationships and recipes. Preserve stable IDs and source credit. Record real trials accurately; do not call a reader's impression a test. The [historical editorial audit](https://github.com/AtlasScope/agent-kit/blob/20877937ffb9bcbf629d45f3d0846afb42701b34/library/audit.json) preserves its original observations, overlap groups and scores (including the reported local Palette Builder trial); it is evidence to consult when relevant, not active release metadata. The [old inventory](https://github.com/AtlasScope/agent-kit/blob/20877937ffb9bcbf629d45f3d0846afb42701b34/library/dist/inventory.csv) remains available at that revision.

Run `node library/build.mjs --all` to regenerate public exports and shipped router references. `node library/check.mjs` compares the same outputs in scratch without writing the checkout. Generate an untracked current inventory with `node library/build.mjs --inventory` only when needed; it has no scores or manual rows.
