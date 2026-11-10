# Direction and levels of change

The goal is a better product: understand what it should help people accomplish, find the most valuable change, develop a coherent direction, and carry it through to a working experience. The levels below are a vocabulary for the size of that change. They help explain a recommendation and check it for timidity or excess. Naming the level is never the recommendation itself: two agents can both say "recompose" and one of them has only made a longer form.

## Two decisions, kept apart

1. **What should this become?** The direction. It may be ambitious.
2. **What do we build first?** The first step. It may be small and reversible.

A small first step does not shrink the direction. State both, and say how the first step moves toward the direction.

## The direction statement

Before choosing components or arranging screens, write two to four sentences on what using the improved product should be like for the people in the brief. Tie each sentence to a job or to the purpose. Leave out layout, components and style.

> Booking service: "This should feel like arranging one clear commitment. Availability and the total price stay understandable throughout. Each step reduces uncertainty, and an interruption keeps the person's progress."

> Expert research tool: "This should feel like an efficient working instrument: dense where comparison matters, quiet around supporting controls, and explicit about which figures are facts and which are estimates."

The statement is ready when it would be wrong for a different product, and when someone could use it to choose between two designs.

## What can justify a change

- **A demonstrated problem**: a job that fails, stalls, repeats work or misleads, seen in use.
- **A design objective**: the owner wants the product to feel more coherent, credible, distinctive or fitting for its audience, or the purpose in the brief calls for it. This is a legitimate reason on its own. Say plainly that it is an objective: "I have not shown that people fail this task. This recommendation serves the goal of making the product feel coherent and credible. Here is the direction and what it costs."

Keep the two apart in the report. An objective is never written up as a usability finding.

## The six levels

| Level | What changes | Typical situation |
|---|---|---|
| **Leave** | Nothing | The job works well and no objective calls for change |
| **Repair** | A defect on a sound path: state lost, a dead end, a control that misleads, a label that names the wrong thing | The path is right and something on it is broken |
| **Clarify** | How existing screens present what they hold: order, emphasis, density, grouping, wording, consistency, visual identity | People are in the right place and cannot tell what matters, what to do next, or whether it worked; or the product works and looks unconsidered |
| **Recompose** | A screen or a flow, rearranged around the job: steps merged or reordered, content moved to where the work happens | One job takes several stops, repeated input, or carrying something between screens by hand. One screen can hold a wrongly shaped workflow |
| **Restructure** | Which places exist and how navigation is organised | Several jobs suffer from the same split or overlap |
| **Reconceive** | The idea the product is organised around | Every page works, and the product is built around one kind of thing while people's work is shaped like another |

Restructure and Reconceive are the ground `judgment.md` covers. Use its tests for whether a page should exist and which organising idea fits.

Give a level for each job. A product often needs different levels in different places. The levels are not evenly spaced and say nothing about effort: a repair can be weeks of engineering, and a reconception can be shown with a modest change.

## Choosing

Recommend the intervention with the strongest justified benefit for the people using the product and for the product itself, weighed against disruption, effort, uncertainty and what must be preserved.

1. **Start from the direction statement and the causes.** List the candidate interventions that would get there, at whatever levels they fall.
2. **Compare outcomes.** For each candidate: what using the product is like afterwards, which causes remain, what it disrupts, what is uncertain.
3. **Prefer the smaller change when the outcomes are comparable.** Prefer it for that reason only. A set of local fixes that clears every recorded problem and leaves the product awkward, incoherent or hard to extend has a worse outcome than a reorganisation that does not.
4. **Check what must be preserved** (below).
5. **Name the alternatives you rejected**, one smaller and one larger where they exist, and what each would have given up.

## What must be preserved

Preserve value and contracts. The current surfaces are free to change.

| Preserve | Free to change |
|---|---|
| What people can accomplish: compare records, export, resume, see history | The page, menu position and sequence of clicks that deliver it today |
| Access for every role that has it, and the boundaries between roles | Where the role's work is shown |
| Links people have saved or shared: they still lead somewhere meaningful | The URL's shape, with redirects |
| Data and work in progress | Its presentation |
| Density that practised users rely on to scan and compare | The arrangement that carries it |
| Deliberate identity the owner wants kept | Accidental inconsistency |

Higher levels put more of the left column at risk. Say how each item survives.

## Evidence status, separate from the level

Each verdict also states how well it is supported:

- **Established**: seen in use, or certain from code.
- **Supported**: consistent evidence with a gap you name.
- **Not established**: the concern did not appear in the conditions tested. This is different from Leave. Write "I could not reproduce this under these conditions; the evidence does not yet support a change here", and say what would test it: another role, real data volume, a person who has not used the product.

## Signs the recommendation is wrong

**Too much**

- It would look the same for any product of this kind.
- Pages merge because they resemble each other, and nobody checked who uses each.
- The new design holds less and the report does not say where the rest went.
- Something in the preserve column is lost with no account of it.

**Too little**

- The same complaint would be true afterwards.
- Each screen improves and the person still carries information between them.
- A new tab, panel or shortcut brings together what the structure keeps apart.
- The fix list is long and no item removes more than one symptom.
- Every finding is addressed and the direction statement is still untrue of the product.

## Different products, different answers

| Kind of product | Usually working when | A common wrong move |
|---|---|---|
| Content site | A reader finds the piece, reads it comfortably, and sees where to go next | Turning reading pages into an app with panels and controls |
| Transactional service | Someone completes the transaction once, with no step repeated and a clear end | Polishing each step and leaving the number of steps |
| Collaborative workspace | Each person sees what is theirs, what changed and what is waiting on them | One layout for every role |
| Dense expert tool | A practised user reads the screen at a glance and acts without leaving it | Spacing everything out and hiding data behind clicks |

Use the row as a starting question, then decide from this product's brief. Two products of the same kind can need opposite answers.
