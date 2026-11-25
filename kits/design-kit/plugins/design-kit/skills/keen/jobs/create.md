# create

Turns a product idea, a new screen or a tired one into an original creative direction and a built, working result. This is the job for "make me something", not "fix this".

Aggressive. Builds or edits the screen, and records the direction in DESIGN.md as proposed. Read [../references/kernel.md](../references/kernel.md) before starting.

## The idea

Keen's other jobs make a screen better on its own terms. Create decides what the terms are. It finds an idea in the product's own world, commits to it, and carries it through type, colour, structure and any picture, so the result could not belong to another product. It is also the job that knows when the right idea is a quiet one.

## When it applies

- A product or screen that does not exist yet, described in a sentence or a brief.
- A screen that works but has no point of view, where `bolder` would only turn up the volume on nothing.
- A request for a direction, a concept, a launch page, a redesign.

If the person needs a plan before anything is built (several screens, unclear content, no agreement on who it is for), `shape` comes first. If the screen has a direction and only the execution is off, the stance is refine and the right job may be `polish`, `type` or `layout`; say so in two lines and stop.

## Steps

1. **Read the direction.** Know what is fixed and what is open in the project: invariants, commitments, history and opportunities ([../references/direction.md](../references/direction.md)). This is for your judgment; write nothing out unless something would be undone. Look at the existing screens if there are any. With no PRODUCT.md, write down who the product is for and what it must never do from the request, and mark them as assumed; do not stop for `init` unless the request gives nothing to go on.
2. **Choose the stance** (refine, reinvent, experiment, restrain), with the reason. A commitment that would have to break means the stance is reinvent: say which commitment and why, and continue only if the person's request already asked for a new direction; otherwise ask that one question before building.
3. **Size it.** Explore (step 4) when the right direction is genuinely unknown and the work is big enough: a new product, a new first screen, a reinvent. When one idea is clearly right, or the work is one part with a clear brief, go straight to step 6.
4. **Explore two or three concepts independently** as the kernel describes: structurally different ideas, each written as one sentence and built as a working prototype of the first screen with real content. If the tool can run subagents in parallel, give each one only the brief below; otherwise build them one at a time without revisiting. Prototypes live in a temporary folder outside the project. Capture each at 390 and 1440 wide.
5. **Choose.** Judge them side by side, using the kernel's questions where they help. Pick one; do not blend. Say in two lines why it won and what the runner-up did better.
6. **Build it properly.** In the project's own stack and components when there is a project; otherwise one self-contained page. Load only the craft cards the build touches. Derive every value from the idea: scale from the content's range, palette from the source world's materials, grid from the content's unit. Real content throughout, including the longest and emptiest cases.
7. **Judge it and revise once.** Look at it at 300 pixels wide and use it as its person would. Run `scripts/measure.mjs` and fix every floor failure (contrast, tap size, sideways scroll). `scripts/fingerprint.mjs` can flag habits that crept in; it says nothing about whether the result is good, so never offer an empty list as proof of quality. Find the weakest part of the page and redo it.
8. **Record the direction** when the work set or changed one worth keeping. Add or update `## Direction` in DESIGN.md: the idea, the stance, the commitments that carry it (each `proposed` with today's date), the invariants it respects and the opportunities you saw and did not build. With no DESIGN.md, create one holding only this section.
9. **Show it** on the Keen page.
   - `verdict`: the idea, in one sentence a person would repeat.
   - `shots`: the built result at phone and desktop width first. When there was exploration, put the concepts in a `workspace` instead (SKILL.md, "The workspace"): the built winner first and marked `suggested`, then each other concept as its running prototype, named and with its sentence as `bet`, so the person can try them side by side.
   - `changes`: up to five decisions that carry the idea, each with what a default would have been as `before` and what was chosen as `after` ("before": "A centred hero with two buttons", "after": "The day set as a tide table, the swim window the only colour").
   - `steps`: the natural next work. When there was exploration, each losing concept's view carries `apply` set to `/keen create <target>: build concept B (<name>) instead` and a `revise` command for the built winner. Then whatever the build left: usually `/motion storyboard` for the entrance and signature movement, then `/keen harden`.
   - No `problems`.

## The brief for an independent explorer

Give each explorer exactly this, filled in, and nothing from the other concepts:

```text
Build one concept for <product>, for <who>, whose first screen must let them <job>.
Source world: <one world from the product's surroundings>. Find the idea in that world's structure, not its surface.
Invariants: <list>. Content to use: <list, with the longest and shortest cases; say plainly if it is invented>.
Deliver: one self-contained HTML page in <temp folder>/<letter>/index.html, working at 390 and 1440 wide, no external images
(draw with SVG, canvas or type), faces from a public font service are fine. Then one line: the idea as a sentence.
Do not look at existing apps or websites for reference. Do not use a centred hero with two buttons, a row of matching cards,
gradients for decoration, or an indigo-violet accent unless the idea needs it and you can say why.
```

## Rules

- **The idea comes from the product's world.** Not from other apps, not from a trend. If the sentence describes a style, it is not an idea.
- **Commit.** One direction, carried everywhere. A tasteful average of three ideas is the failure this job exists to prevent.
- **Restraint is a direction.** When the stance is restrain, the result looks quiet on purpose; the report says so and names where the idea lives (proportion, rhythm, one detail).
- **The floor holds.** Everything in Rules for every job, every readability and accessibility check, reduced motion. A direction that needs to break them is the wrong one.
- **Nothing a person can do is removed** in a redesign of an existing screen. Moving and regrouping is fine.
- **Invented content is labelled.** A demonstration built on sample data or a fictional place says so on the page, where a visitor sees it before they act on it, and the report says so too.
- **Commitments are the person's.** Keen writes them as proposed. It never changes an approved commitment without saying so first.

## Report

Follow the report shape in SKILL.md. "What happened" gives the stance and the idea. "What it means" says what a visitor now understands at first sight that they did not before. Under Details: the concept sentences, the craft cards read, the measure results, any defaults the fingerprint found and what you did about them, and files written. Under "Not checked": states, widths and devices not seen, and anything the idea depends on that only a person can judge (whether the voice fits the brand, whether it feels right in the hand).
