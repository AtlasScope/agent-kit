# The creative kernel

How Keen thinks when the work calls for an idea, not a repair. Load this for `create`, for `bolder`, and for any request where Keen's stance is reinvent or experiment. The jobs say what to do. This file says how to decide.

Everything here is an instrument for judgment, not a procedure. Stances, analogy, parallel concepts and the direction ledger exist to help you make a better decision when the decision is hard. When it is not, skip them: a clear refine needs no announced stance, no exploration and no ledger entry, only good work. Never perform a step so the report can say it was done. The measure of the result is the result.

## What good looks like

A strong interface has one idea, and every decision carries it. The idea is about the product's subject, not about interfaces: a tide planner that reads like an Admiralty table, a budgeting tool built on the ledger's ruled column, a music app paced like a record sleeve. When the idea is right, a stranger seeing the first screen at thumbnail size can tell what the product is about and that nobody else made it.

Generated interfaces fail in one way above all: every choice is the middle choice, so nothing is wrong and nothing belongs to anyone. `scripts/fingerprint.mjs` can spot a dozen of those habits on a real page. Treat it as a smoke alarm: it catches a few common failures and cannot see excellence. Removing every default from a page with no idea leaves a page with no idea, and a fine page may keep a default on purpose.

## Four stances

Know which stance you are taking, because it sets how far you go. Say it when it is not obvious; most requests are plainly a refine and need no announcement.

| Stance | When | What it means |
|---|---|---|
| **Refine** | The direction is right and the execution is off: the idea is visible but blurred by inconsistency, timid scale or rough detail | Keep every commitment. Raise the craft until the existing idea is unmistakable. Most requests are this |
| **Reinvent** | There is no direction, or the one there is fights the product: a children's app dressed as a bank, a ledger dressed as a game, or a look anyone could have made | Keep the invariants only. Find a new idea from the product's subject. Explore before committing |
| **Experiment** | The person asks what is possible, or the stakes are low and the lesson is worth more than safety: a launch page, a campaign, a one-off moment | Push one variable far past comfort (scale, a single colour, a procedural surface, an unusual structure) and say it is an experiment |
| **Restrain** | The content is the experience: a tool used all day, a reading surface, a serious or stressful moment, data that must be trusted | The ambitious move is to remove your own hand. Perfect type, rhythm and alignment, almost no colour, nothing decorative. Restraint is chosen, not defaulted to: it still has an idea, carried by proportion |

How to tell them apart: read the commitments (see [direction.md](direction.md)). If they exist and the screen breaks them, refine. If they exist and the product has outgrown them, say so and propose reinvent; the person decides, because commitments are theirs. If none exist, reinvent or restrain depending on how the product is used: daily and dense leans restrain, occasional and persuasive leans reinvent. Experiment only when asked or when the work is disposable.

## Finding the idea

Ideas come from many places: the content itself (the data often wants to be drawn), a hard constraint, the person's own words, the product's world. Analogy is one reliable route, described below, not a required one. What does not work is starting from other interfaces. Looking at other apps first is the surest way to make another app: showing designers examples makes them copy the examples' features, even the flawed ones (Jansson and Smith, "Design fixation", 1991). So look at the subject first and at screens last, if at all.

1. **Name the product's world.** What objects, places, trades, documents and instruments surround what this product does? A tide planner lives near charts, tide tables, harbour notices, lighthouse lists, wetsuits, the shoreline.
2. **Transfer structure, not surface.** Analogy works when it carries relations, not looks (Gentner, "Structure-mapping", 1983). A tide table is useful because it is a dense grid read by row and column with one number that matters circled in pencil. That structure (dense grid, one mark) is the transferable idea; the parchment colour is not.
3. **Write the idea as one sentence** with a source and a structural move: "The day as a tide table: a dense typographic grid where the one swimmable window is the only thing in colour." If the sentence describes styling ("dark and modern"), it is not an idea yet.
4. **Check that it is owned.** Could a competitor use this idea unchanged? If yes, push it closer to this product's specifics.

## Exploring before committing

Explore when you genuinely do not know which direction is right and the work is big enough to deserve the answer: a new product, a first screen with no direction, a reinvent. Then build two or three concepts before choosing. Comparing parallel prototypes produces better and more varied results than refining one in sequence (Dow et al., "Parallel prototyping leads to better design results", ACM TOCHI 2010). If one idea is clearly right, build it. For routine work (refine, one component, a clear brief), execute directly.

- **Independent.** Each concept starts from the brief alone, from a different source world, without seeing the others. If the tool can start subagents, give each one a concept to build in parallel; otherwise build them one after another without revisiting the earlier ones.
- **Working, not drawn.** Each is a running prototype with real content at phone and desktop width: one screen, the first one, built well enough to judge type, colour and structure. Rough edges are fine; placeholder text is not.
- **Different in kind.** The concepts must disagree about structure (what comes first, how the page is divided, what carries the meaning), not about palette. If two would look alike at thumbnail size, replace one.
- **One can be the brave one.** When there are three, let one take the experiment stance, so the person sees how far the idea could go.

Judge them side by side, small and large. These questions help:

1. Does the first screen say what the product is about before any word is read?
2. Is it owned: would it look wrong on a competitor?
3. Does it hold at 390 wide with the longest real content?
4. Does the idea scale to the screens that would follow, or is it a poster?
5. Would the people who use it choose it over the obvious version, and keep choosing it on the hundredth visit?

## Committing

Pick one and build it fully. Do not average the concepts: a blend of three ideas is no idea. Take at most one specific detail from a losing concept, and only if it serves the winner's sentence.

Commit, don't poll. When the person is present, show the concepts on the Keen page with the winner already built and the others one press away; they can switch, but nothing waits on them. When the work set a direction worth keeping, record it in DESIGN.md as proposed ([direction.md](direction.md)).

## Making it

- **Derive, do not pick.** Every value comes from the idea: the type scale from the content's real range, the palette from the source world's materials, the grid from the content's natural unit. A value with no reason is a default.
- **One loud thing.** Each screen gets one element that carries the idea at full strength. Everything else serves it by stepping back.
- **Real material.** Real content, real numbers, real edge cases. Ideas that only work with lorem ipsum are posters. When the content has to be invented for a demonstration, the page says so where a visitor will see it, so nobody mistakes a sample for a service.
- **Draw with code when the idea needs a picture.** A procedural surface (a tide curve computed from real harmonics, a field drawn from the data) belongs to the product in a way stock imagery and gradients never can. See [craft/procedural.md](craft/procedural.md).
- **The floor holds.** Contrast, tap size, readable sizes, no sideways scroll, reduced motion. A direction that needs to break them is the wrong direction. Measure with `scripts/measure.mjs`.

## Judging your own work

Work as a conversation with the material: make, look, revise (Schön, *The Reflective Practitioner*, 1983). After the first build, and before showing anyone:

1. Look at it at 300 pixels wide. Is the idea visible? If not, it is not yet carried, and the fix is usually a decision, not more size.
2. Use it as its person would, with the longest and emptiest real content. Does it still do its job quickly?
3. Find the weakest part and redo it once. It is usually the second screen of scroll, the footer or the empty state, where attention ran out.
4. Ask what you would cut. If nothing, ask again.

The fingerprint and measure scripts can run here as checks for habits and for the accessibility floor. Neither one judges the design.

## Restraint

Know when not to. An idea that fights the content loses to clean typography every time. If the product is a reading surface, a data tool or a moment of stress, the idea lives in proportion, rhythm and one precise detail, and the most ambitious result looks almost plain. Say when you chose this, so it is not mistaken for doing nothing.

## The craft cards

Load a card only when a decision touches it. Each is short and names its sources.

| Card | Load when deciding |
|---|---|
| [craft/composition.md](craft/composition.md) | Grid, proportion, pacing, where weight sits, editorial structure |
| [craft/type.md](craft/type.md) | Faces, scale, measure, spacing, numbers, optical detail |
| [craft/colour.md](craft/colour.md) | Palettes, OKLCH, contrast, colour as meaning, wide gamut |
| [craft/signs.md](craft/signs.md) | Icons, symbols, what a visual choice connotes, brand marks |
| [craft/data.md](craft/data.md) | Charts, numbers, maps, anything quantitative |
| [craft/physics.md](craft/physics.md) | How things move and respond; hand anything substantial to `/motion` |
| [craft/procedural.md](craft/procedural.md) | Drawing with code: SVG, canvas, noise, data-driven images |
