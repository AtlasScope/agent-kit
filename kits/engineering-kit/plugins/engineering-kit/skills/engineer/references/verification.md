# Verification

Verify what the user cares about. Name the behavior and how it could break, then choose the smallest checks that would catch that break. A passing test proves its assertion under the conditions it ran; a skipped test or a missing browser proves nothing.

Make sure a check can fail before trusting it: break the behavior on purpose in a copy, or run the check against the known-bad baseline, and watch it go red. `scripts/case.mjs` runs the same steps against a baseline and a candidate for exactly this. For logic that carries money, permissions or data meaning, an invariant or property check across many inputs finds what a few examples miss.

Check from outside your own code: use the running app the way a user would, call the real endpoint, read the stored data, or compare against an independent source. Test the generated payload and the served page as well as the generator. When a tool, browser, model feature or installed skill might be missing, check what happens without it.

Know what a check runs before running it. Repository scripts named check, test, lint or preview can write files, call services or rebuild outputs. Read the script, or run it in a throwaway copy with `scripts/case.mjs` and look at what it wrote. A read-only request rules out anything that rewrites tracked files.

Report the commands with their real output, which conclusions came from reading and which from running, and what was not covered. A short list of what remains unverified is worth more than a confident summary.

Source: Petrović and Ivanković, "State of Mutation Testing at Google" (ICSE SEIP, 2018), on using deliberate faults to learn whether tests notice them.
