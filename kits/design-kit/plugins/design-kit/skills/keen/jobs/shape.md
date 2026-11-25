# shape

Plans a screen or feature that does not exist yet, before any of it is built. The result is a short brief and three rough layouts to choose from.

Interactive. Writes one file, the brief, after a yes. Builds nothing.

## The idea

Most screens that need a critique later were built before anyone decided what they were for. Ten minutes here is cheaper than any job that fixes a screen afterwards. Shape answers four things in this order: who is here, what they came to do, what they need in front of them to do it, and how it could be arranged. The arrangement comes last on purpose.

## Before you start

Read PRODUCT.md and DESIGN.md. Look at two or three screens the product already has, so the new one belongs with them. If there is no PRODUCT.md, stop and suggest `/keen init`.

## Steps

1. **Ask once.** Put every question below that the project's files and the request do not already answer into a single message, each with your best guess as the default, so the person can reply "yes to all" or correct one. Skip any you can answer yourself. Ask the five that matter most, never more.
   - Who lands on this screen, and what did they just do before arriving?
   - What is the one thing they come here to do? What tells them they are done?
   - What do you already have to show them? Real things that exist today, not things that would be nice. If the content does not exist yet, who will write it and keep it current?
   - What must never happen on this screen?
   - Is anything fixed: a deadline, an existing screen it must match, a phone-first audience?
2. **Write the screen's job in one sentence.** "A returning customer reorders last month's box in two taps." If the sentence needs "and", it is two screens. Say so and ask which comes first.
3. **List the content, ranked.** Everything the person needs to see or do, in three groups: needed to do the job, helpful, and can wait for another screen. Use real examples from the product where they exist, with a realistic longest and shortest case. Nothing goes on the list because screens of this kind usually have it.
4. **Walk the path.** Number the steps from arriving to done. Then name the states this screen will have: nothing yet, loading, a failure, too much, not allowed. One line each on what the person sees.
5. **Sketch three arrangements that differ in kind**, not in decoration. They should disagree about what comes first or how the work is split, for example one long page, a step at a time, or a list beside a detail. Draw each as a plain grey wireframe: boxes, real labels, no colour, no styling, at phone width first. Draw them in a temporary folder outside the project, as whatever you can turn into a picture fastest (a throwaway page opened in the browser is fine), and take one screenshot of each. The pictures are what the person sees; the throwaway files are not handed over. For each, one line on what it is best at and one on what it costs.
6. **Recommend one** and say why in two lines, tied to the job sentence.
7. **Show it** on the Keen page.
   - `verdict`: the job sentence.
   - `shots`: the three sketches, captioned A, B and C with each one's name.
   - `steps`: one per arrangement, the recommended one marked suggested. The label is the arrangement's name, the why is what it is best at and what it costs, and the command is `/keen shape <screen>: write the brief for arrangement A (<its name>)`.
   - `also`: the content needed to do the job, most important first. The path and the states go under `details` now and into the brief next.
   - No `problems`.
8. **When they pick, write the brief.** The pick arrives as that command, from the page or typed. Write it to `docs/design/<screen>.md`, or wherever the project already keeps this kind of note. It holds the job sentence, the ranked content, the path, the states and the chosen arrangement with its sketch. Under 60 lines. This is the file the build reads.

## Rules

- **No visual design.** No colours, fonts or polish in the sketches. Anything that looks finished gets judged on how it looks, and the question here is what goes where.
- **Real content only.** A sketch with placeholder text hides the problems real text causes. If the real content does not exist yet, write the most realistic example you can and mark it as made up.
- **Small first.** Draw the phone arrangement before the wide one. What survives at 390 wide is what matters.
- **Count the steps.** Each arrangement says how many taps the job takes. Fewer is better only when nothing needed is hidden to get there.

## What comes next

Offer these as next steps once the brief is written:

1. Build the screen from the brief. Give the person a plain request they can start: "Build the <screen> from the brief at <path>, using the product's existing components."
2. After it is built, `/keen harden` for the states the brief lists, then `/keen polish`.

## Report

Follow the report shape in SKILL.md. "What happened" names the screen's job and the arrangement recommended. "What you need to do" is to pick an arrangement. Under "Not checked", anything in the brief that rests on a guess you made for the person.
