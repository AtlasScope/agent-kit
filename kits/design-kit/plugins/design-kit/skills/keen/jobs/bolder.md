# bolder

Gives a screen that looks safe, flat or like every other product a point of view: it finds what the screen is really about and makes that unmistakable.

Aggressive. Edits files. Does the whole screen in one go.

## The idea

A timid screen is not one with small type. It is one that never decided what it is about, so every part gets the same treatment and nothing is remembered. Turning everything up does not fix that: a page with no idea, made bigger and darker, is a louder page with no idea. Boldness is conviction, carried out well. The bold version of a screen is the one where you can say in a sentence what it believes, and every choice on it serves that sentence.

So bolder starts with the idea and lets the idea pick its means. Sometimes that is scale: one number so large it is the screen. Often it is something else entirely. The content becomes the picture (a timeline drawn as the actual day, a balance drawn as the actual pile). The arrangement breaks from the template because the product's own logic suggests a different order. The words take a voice. A material comes from the product's world. Or most of the screen goes away, and the one thing left on an empty page is the boldest move available. Restraint done with conviction is bold; a dozen loud choices are not.

If the screen is crowded, suggest `/keen distill` first, because bold moves on clutter make more clutter. If the person wants a new direction rather than a stronger version of this one, that is `/keen create`. For finding the idea, read "Finding the idea" in [../references/kernel.md](../references/kernel.md); for a single screen, a few minutes of that thinking is enough.

## Steps

1. **Read what the product is and how it should feel**, from PRODUCT.md, DESIGN.md and the screen itself. A `## Direction` section, if there is one, is the idea to strengthen, not replace. Bold for a bank and bold for a game are different things.
2. **Say what this screen is about in one sentence**, then what would make that unmistakable. Write both down. "The monthly total, which is the only thing anyone opens this for; drawn as the month itself, the spend accumulating day by day" is an idea. "Make the heading bigger" is not. If you cannot write the sentence, ask one question ("What is the one thing someone should take from this screen?") or choose from what the product is for and say you assumed.
3. **Capture before**, at 390 and 1440 wide.
4. **Make the idea real** with the fewest moves that carry it, chosen from the instruments below. Use the project's own fonts and colours unless the idea genuinely needs something they cannot do; then say what you added and why.
5. **Judge it as a designer, not a checklist.** Look at before and after at about 300 pixels wide. Could a stranger say what the after is about? Would they describe it in words that belong to this product and no other? Is it still easy to use, and is everything the person needs still where they would look? Then find the weakest part of the screen and fix it. If the honest answer is "it is the same screen, larger", go back to step 2.
6. **Look for what the moves broke.** A count now far from its name, a button stranded at the end of a short line, a heading that reads like a label, a drawing that hides a number someone needs. Fix each one or undo the move. A cost you can see and left in place is a fault, not a trade.
7. **Report** on the Keen page with the before and after shots.

## Instruments

Reach for one or two that serve the sentence. They are not steps, and using all of them is decoration.

- **Hierarchy.** One thing wins by a wide margin and the rest steps back to make room. Scale and weight are one way; position, isolation and colour are others.
- **Drawing.** Let the content itself become the image: the data, the product, the place. A drawn thing that carries information is worth more than any decoration.
- **Arrangement.** An order that comes from the product's own logic (a day runs left to right, a recipe runs top to bottom, a comparison sits side by side), not the template's.
- **Material.** Colour and type taken from the product's world, used with conviction: one colour held back for the one thing that matters.
- **Voice.** Words that sound like the product: the heading says the answer, not the category.
- **Subtraction.** Take most of it away. What is left gets the whole screen.

## Limits

- Every readability rule still holds. Text contrast at least 4.5 to 1, or 3 to 1 for large text (WCAG 2.2, 1.4.3). Body text stays at 16px or more. Nothing scrolls sideways at 320 wide.
- No effects for their own sake: no gradients, glows, shadows or movement added to look impressive.
- Nothing the person can do becomes harder to find. The main action is at least as easy to reach as before. Content moved out of sight is named in the report.
- If the project's DESIGN.md rules out something the idea needs, the file wins. Say what you held back and what carried the screen instead.

## Report

Follow the report shape in SKILL.md. In "What happened", give the sentence from step 2 and say in plain words how the screen now carries it. In "What it means", say what someone takes from the screen at first sight that they did not before. Offer `/keen quieter` in case it went too far. Under Details, the moves made and the values that changed. `scripts/fingerprint.mjs` can go there too as a check for habits that crept in, never as evidence that the result is good. Under "Not checked", any state or width you did not capture.
