# Historical comparisons

These are the prompts used for the v0.2 comparisons recorded in [tests/results](../results/README.md). Preserve the apps, keys and results as source evidence, not a standing test obligation.

The original harness copied each app, initialized Git, isolated Claude's project settings and connectors, and compared baseline, standalone skill and installed plugin on the same prompts. Judges received anonymized reports and the answer key. The original runner and scoring scripts are recoverable from [the pre-cleanup repository](https://github.com/AtlasScope/agent-kit/tree/20877937ffb9bcbf629d45f3d0846afb42701b34/kits/experience-architecture/tests/compare). They are retired because they assume an old scratch layout, fixed model and costly batch protocol, and the runner could terminate an unrelated listener on a selected port.

For a new comparison, select the smallest meaningful scenario, isolate the candidate and baseline with no personal context or real credentials, use the same task and model for both, and keep only evidence needed to support the decision.
