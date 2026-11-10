# Carrying an assignment through

"Walk through this and tell me what is wrong" ends with discovery. "Help me turn this into a better application" is one assignment that runs from understanding to a working improvement. The owner should not have to learn the stages or restart the work between them.

## The case file

Keep one file, `<output-dir>/case.md`, for the whole assignment. Every stage reads it first and adds to it.

```
Assignment: <the owner's request, in their words>
Authorised scope: <examine | recommend | build: which journey, which parts of the app>
Stage: <understand | explain | direction | build | verify>  (the one in progress)
Product brief: <or the path to it>
Direction statement: <once written>
Must be preserved: <value and contracts>
Evidence: <paths to the walkthrough, journeys and captures>
Decisions: <each decision the owner made, with the date>
Open: <what is unknown or not established>
```

## The stages

| Stage | Done by | Finished when |
|---|---|---|
| Understand | Walkthrough | Brief, observations and what must be preserved are written |
| Explain | Diagnose, at the depth the open questions need | Each cause that shapes the direction is established or marked open |
| Direction | Rethink, widened by `levels.md` | The owner can see the direction on a real screen with real content and has agreed it, or it is small enough to need no decision |
| Build | The implementation rules in Rethink step 7, applied to one complete journey | Entry, action, result and way back work, with their empty and error states; what the new surface replaces is removed and its links redirect |
| Verify | Verify | The brief's jobs are repeated on the changed app, each preserved item is checked, and before and after captures are paired |

## Rules for moving between stages

- **Each stage deepens or acts on what is already known.** Read the case file, then do only what is missing. A cause the walkthrough established is used as it stands. Run a stage in full only when its questions are still open.
- **Skip a stage that has nothing to add.** A clear repair goes from Understand to Build. A direction that changes no structure skips the site-map options.
- **Ask once, for the decision that is the owner's.** The direction, when it changes what the product is or what people must relearn. Technical choices are yours. Questions the case file already answers are not asked again.
- **The go-ahead to build.** Application code changes only on the owner's explicit request. A request that asked at the outset for the improvement to be built is that request, for the journey it named. Before the first edit, say in one message what you are about to build and what it will replace, so the recommendation is seen before the change. Then proceed without waiting when the change is a repair or a clarification of existing screens. Wait for the owner's answer when the direction recomposes a flow, changes structure, or changes what people must relearn: that is the decision that is theirs. Where the owner asked only to examine or recommend, nothing is built until they ask.
- **Stay inside the authorised scope.** "Examine" and "recommend" change nothing in the app. "Build" covers the journey agreed and the presentation, wording, navigation and state it needs. Data models, sign-in, payments, deployment and merging need their own go-ahead.
- **Stop at the stage the owner asked for**, and say in one line what the next stage would produce.

## Before and after

Comparable captures need the same job, role, data, width and application state on both sides. Record the revision of each. Until a capture command exists, take them with `ea journey <spec> --screenshots` or the session's browser tools, running the same spec before and after. Give each run its own folder, `--out <output-dir>/before` and `--out <output-dir>/after`: the runner names captures and logs by journey, width and step, so a second run into the same folder overwrites the first. Keep the full-size images; a sheet of thumbnails is an index to them.

## Where things may be written

| Stage | May write |
|---|---|
| Understand, Explain, Direction | Reports, captures and throwaway prototypes in the output folder |
| Build | Application source on a new branch, within the authorised scope |
| Verify | Journey specs and results in the output folder; test data only where a journey needs it and the owner allowed it |

Real customer data is never changed. These are working rules; the host's permission settings are what enforce them.
