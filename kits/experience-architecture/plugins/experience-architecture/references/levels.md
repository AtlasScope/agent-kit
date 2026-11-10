# Levels of change

A product that feels wrong can need very different amounts of change. Choosing the amount is the main judgment in this plugin. Too little polishes a flow that should not exist. Too much rebuilds a product that needed one screen put in order, and destroys things that worked.

Give one verdict for each job people come to do. A product often needs different levels in different places.

## The six levels

| Level | What changes | Fits when | Show this before recommending it |
|---|---|---|---|
| **Leave** | Nothing | The complaint does not survive use, or the change costs users more than it gives them | The job done cleanly, start to finish |
| **Repair** | A defect on a sound path: state lost, a dead end, a control that misleads, a label that names the wrong thing | The path is right and something on it is broken | The failure, reproduced |
| **Clarify** | How existing screens present what they already hold: order, emphasis, density, grouping, wording, consistency between screens | People are in the right place and cannot tell what matters, what to do next, or whether it worked | One screen marked up: what the job needs first against what the screen makes loudest |
| **Recompose** | One screen or one flow, rearranged: steps merged or reordered, content moved to where the work happens, a detour removed | One job takes several stops, repeated input, or carrying something from one screen to another by hand | The job traced step by step, with every hand-off the person performs |
| **Restructure** | Which places exist and how navigation is organised | Two or more jobs fail for the same structural reason: a split, an overlap, navigation built around the wrong groups | Those jobs, and the single cause they share |
| **Reconceive** | The idea the product is organised around | The product is built around one kind of thing and people's work is shaped like another | The current organising idea in a sentence, and the work that does not fit it |

Restructure and Reconceive are the ground `judgment.md` covers. Use its tests for whether a page should exist and which organising idea fits.

## Choosing

1. **Start from the causes, lowest level first.** Ask whether a repair removes them. If some remain, ask whether clarifying does. Stop at the first level that removes them all for this job.
2. **Go up only on evidence the lower level cannot answer**, such as "the person re-enters the same date on three screens". A wish for something cleaner does not count.
3. **Go down when the lower level is enough.** A hierarchy problem on four screens is four clarifications, even when a new layout would also fix it.
4. **Check the keep list.** A verdict that removes an entry needs a reason that entry's owner would accept, and a place for what it did.
5. **Name the neighbours.** Say why the level below falls short and why the level above is more than the evidence supports. If you cannot, the verdict is not settled.

## Telling the levels apart

- **Repair or clarify?** If one fix to one element ends the problem, repair. If the element works and people still miss it or misread it, clarify.
- **Clarify or recompose?** Cover the styling in your mind: same content, same order, plain text. If the job is still awkward, the arrangement is the problem: recompose. If the job is fine in plain text, the presentation is: clarify.
- **Recompose or restructure?** Count the jobs. One job across too many stops is a flow to recompose. Several jobs hurt by the same division of the product is a structure.
- **Restructure or reconceive?** If the navigation could be regrouped under the current nouns and the jobs would work, restructure. If the nouns are the wrong ones, reconceive.

## What each level must keep

| Level | Keeps |
|---|---|
| Repair | Everything else on the screen |
| Clarify | Every capability, every piece of content someone relies on, the product's recognisable identity, the routes |
| Recompose | Every capability of the screens it merges, their links (redirected), permissions for each role |
| Restructure | Capabilities, public and shared URLs, permission boundaries, distinct audiences |
| Reconceive | The work people already do in the product, their data, their access |

Density is a capability. A table that experts scan is working, however crowded it looks to a newcomer. Clarifying it means making the scan easier, with the same data on screen.

## Signs the level is wrong

**Too high**

- The recommendation would look the same for any product of this kind.
- Pages merge because they resemble each other, and nobody checked who uses each.
- The new design has less on it and the report does not say where the rest went.
- A journey on the keep list changes.

**Too low**

- The same complaint would be true after the change.
- Each screen improves and the person still carries information between them.
- A new tab, panel or shortcut is added to bring together what the structure keeps apart.
- The fix list is long and no item removes more than one symptom.

## Different products, different answers

The levels are the same everywhere. What counts as working is not.

| Kind of product | Usually working when | A common wrong move |
|---|---|---|
| Content site | A reader finds the piece, reads it comfortably, and sees where to go next | Turning reading pages into an app with panels and controls |
| Transactional service | Someone completes the transaction once, with no step repeated and a clear end | Polishing each step and leaving the number of steps |
| Collaborative workspace | Each person sees what is theirs, what changed and what is waiting on them | One layout for every role |
| Dense expert tool | A practised user reads the screen at a glance and acts without leaving it | Spacing everything out and hiding data behind clicks |

Use the row as a starting question, then decide from this product's brief.
