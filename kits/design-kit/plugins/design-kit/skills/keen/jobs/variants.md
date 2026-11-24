# variants

Builds three different versions of one part of a screen, shows them side by side, and applies the one the person picks.

Interactive. Edits files only for the version chosen.

## The idea

Most people cannot say what they want from a design until they see something they do not want. Describing options in words does not help; seeing three real ones does. This job is for the moment when the person says "I don't love it, but I can't say why" about one part of a screen: a header, a card, a pricing table, an empty state. The three versions must differ in kind. Three shades of the same idea give the person nothing to choose between.

## Steps

1. **Fix the target.** One part of one screen. If the request is a whole screen or a whole product, narrow it with one question, or suggest `/keen critique` to find which part matters.
2. **Read** PRODUCT.md, DESIGN.md and the notes in that part's code. The versions use the project's own colours, fonts and components.
3. **Capture the current version** at 390 and 1440 wide. It is always shown as a fourth choice, "keep it as it is".
4. **Choose three directions that disagree.** Pick three from the list below that suit this part, and say in one line what each is betting on.
5. **Build each one for real**, in the project's code, with the product's real content. After building one, capture it at 390 and 1440, save the change as a patch file in the book folder, and put the code back exactly as it was before building the next. The working copy ends as it began.
6. **Show them** on the worksheet: the four captures side by side at each width, each with its one-line bet, what it is best at and what it costs. Each is a next step the person can pick. Mark your recommendation and say why in a line.
7. **Apply the pick.** Put that version's change back, run the project's own checks, capture it again, and delete the other patch files. If they pick "keep it", change nothing and say so.
8. **If none is right**, ask what was closest and what was wrong with it, and build one more round from that answer. Two rounds at most; after that the problem is not this part, and `/keen critique` is the better job.

## Ways for versions to differ

- **What comes first.** Lead with the number, the picture, the action or the explanation.
- **How much is shown.** Everything at once, or the essentials with the rest one tap away.
- **How it is arranged.** A row, a stack, a grid, a list beside a detail.
- **How loud it is.** Quiet and plain, or one strong element with everything else stepped back.
- **Who it speaks to.** A first-time visitor or someone who uses it every day.

## Rules

- **Different in kind.** If a stranger could not tell two versions apart at thumbnail size, they are one version.
- **Real, not mocked.** Each version runs in the real product with real content, so what the person picks is what they get.
- **Every version is one you would ship.** No straw options built to make the favourite look good.
- **Every version passes the basics.** Readable text, controls big enough to press, nothing scrolling sideways. Measure with `node <skill-dir>/scripts/measure.mjs`, running what it prints inside the page.
- **Nothing a person can do is missing** from any version.
- **Leave no trace.** Nothing from the versions not chosen stays in the code.

## Report

Follow the report shape in SKILL.md. Before the pick, "What happened" is one line per version and "What you need to do" is to pick one. After the pick, a new page shows before and after and says what changed in plain words. Under Details, the files changed and the patch files removed. Under "Not checked", states and widths of the chosen version you did not capture.
