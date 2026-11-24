# bolder

Gives a screen that looks safe, flat or like every other product a clear point of view, by committing harder to what the screen is for.

Aggressive. Edits files. Does the whole screen in one go.

## The idea

A bland screen is one where every choice was the middle choice: medium sizes, medium weights, medium grey, everything given equal room. Nothing is wrong and nothing is remembered. Bolder does not mean louder everywhere. It means picking the one thing this screen is about and letting it win by a wide margin, then letting everything else step back so the difference shows. Contrast is the tool: big against small, heavy against light, one colour against none, full against empty.

If the screen is crowded, bolder makes it worse. Stop and suggest `/keen distill` first. If there is nothing to commit harder to (no idea behind the screen at all), bolder only adds volume: suggest `/keen create` instead. For the "one distinct thing" below, read the "Finding the idea" part of [../references/kernel.md](../references/kernel.md).

## Steps

1. **Read who the product is for and how it should feel** in PRODUCT.md and DESIGN.md. Bold for a bank and bold for a game are different things. If neither file says how the product should feel, ask one question: "Three words for how this should feel to someone seeing it for the first time?" If nobody can answer, choose three from what the product is for and say which you assumed.
2. **Name the hero.** The one thing on this screen that should be impossible to miss: a number, a headline, a picture, an action. One, appearing once. On a screen that lists equal things, the hero is never every item's name, because five things made huge are five things competing; it is the page's heading, its one-line promise, or the way in. The page's own heading is never made smaller than something beneath it.
3. **Capture before**, at 390 and 1440 wide.
4. **Make the five moves** below. Use the project's own fonts and colours; push how far apart their uses are, do not add new ones.
5. **Capture after**, and run `scripts/fingerprint.mjs` on before and after: every default it lists is removed or kept for a reason you can say. Look at both captures small (about 300 pixels wide). The after should be recognisable at that size and the before should not. If you cannot tell them apart, you were not bold.
6. **Look for what the moves broke.** Bigger type and wider gaps pull related things apart: a count now far from its name, a button stranded at the far edge of a short line, a heading that reads like a label. Fix each one, or undo the move that caused it. A cost you can see and left in place is a fault, not a trade.
7. **Report** on the Keen page with the before and after shots.

## The five moves

1. **Scale.** Make the hero much larger than it is, at least twice the size of the next thing down, and make secondary text smaller in return. A wide gap between sizes reads as confidence; a narrow one reads as indecision.
2. **Weight.** Use the heaviest and lightest weights the font has, not the two in the middle.
3. **Colour.** Use the accent once, fully, on the hero or the main action, across a larger area than feels safe. Take colour away from everything else so it lands.
4. **Space.** Give the hero more empty room than seems reasonable. Tighten what belongs together. Uneven space, generous in one place and tight in another, is what makes a layout look designed.
5. **One distinct thing.** Give the screen a single feature that belongs to this product and no other: an unusual crop, an oversized number, a strong edge, an asymmetric layout. One, tied to what the product is. More than one is decoration.

## Limits

- Every readability rule still holds. Text contrast at least 4.5 to 1, or 3 to 1 for large text (WCAG 2.2, 1.4.3). Body text stays at 16px or more. Nothing scrolls sideways at 320 wide.
- No effects for their own sake: no gradients, glows, shadows or movement added to look impressive. Bold comes from size, weight, colour and space.
- Nothing is removed, and nothing the person can do becomes harder to find. The main action is at least as easy to reach as before.
- If the project's DESIGN.md rules out something a move needs, the file wins. Say which move you held back and why. When colour is ruled out, moves 1, 2 and 4 carry the screen, and the one distinct thing comes from scale or arrangement.

## Report

Follow the report shape in SKILL.md. In "What happened", name the hero and say in plain words what now sets it apart ("the monthly total is three times larger and the only thing in colour"). Offer `/keen quieter` as a next step in case it went too far, and say so plainly. Under Details, the values before and after. Under "Not checked", any state or width you did not capture.
