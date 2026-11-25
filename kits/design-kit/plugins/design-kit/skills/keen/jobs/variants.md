# variants

Builds two or three different versions of one part of a screen, shows them running beside the original, revises any of them on request, and applies the one the person picks.

Interactive. Edits files only for the version chosen.

## The idea

Most people cannot say what they want from a design until they see something they do not want. Describing options in words does not help; seeing three real ones does. This job is for the moment when the person says "I don't love it, but I can't say why" about one part of a screen: a header, a card, a pricing table, an empty state. The three versions must differ in kind. Three shades of the same idea give the person nothing to choose between.

## Steps

1. **Fix the target.** One part of one screen. If the request is a whole screen or a whole product, narrow it with one question, or suggest `/keen critique` to find which part matters.
2. **Read** PRODUCT.md, DESIGN.md and the notes in that part's code. The versions use the project's own colours, fonts and components.
3. **Remember the current version.** Run `workspace.mjs base <name>` on every file the versions will touch (SKILL.md, "The workspace"). Uncommitted changes are fine: they are remembered as part of the original and of every version. Capture the original at 390 and 1440 wide, and as a running page when it can be one. Wait for any opening animation to finish before every capture in this job, so all are caught in the same settled state. The original is always the first view, "keep it as it is".
4. **Choose directions that disagree.** Three is the usual number; two is right when the part has only two honest answers. Pick from the list below, and say in one line what each is betting on.
5. **Build each one for real**, in the project's code, with the product's real content. After building one, capture it the same way as the original, then run `workspace.mjs keep <name> a` (then `b`, `c`): it saves the version outside the project and puts the code back exactly as it was before the next. The working copy ends as it began.
6. **Show them** in a workspace on the Keen page.
   - `workspace.views`: "Now" first, marked `original`, then "A: <name>", "B: <name>", "C: <name>", your recommendation marked `suggested`. Each has its running page or captures, its bet and cost in one line, `apply` set to `/keen variants <the part>: apply version A (<its name>)` and `revise` set to `/keen variants <the part>: revise version A (<its name>)`. The original's `apply` is `/keen variants <the part>: keep it as it is`.
   - `tune` on a running version: the two to four values its bet depends on and a person would want to try by hand. Versions that differ in kind usually differ in what is worth tuning too: the price size for a version that leads with the price, the row density for one that shows everything.
   - `workspace.brief`: the request in one line. `verdict`: what the versions disagree about. No `problems` and no `steps`.
7. **Revise when asked.** A request arrives as a `revise` command with a `NOTE:` line holding the person's words, or the parts they pointed at and the values they tuned (SKILL.md, "The workspace"), or typed in the conversation. Run `workspace.mjs put <name> a`, make what was asked and nothing more, capture it again, `keep` it again, set the view's `note` to what changed, and `add` the same page. Their open page updates in place. There is no limit on rounds for one version, but if the third request contradicts the first, say so.
8. **Apply the pick.** It arrives as that view's `apply` command, from the page or typed. Run `workspace.mjs apply <name> a` (or `base` for "keep it"), set any tuned values it carries, then run the project's own checks, capture it again and add a before-and-after page. If `apply` prints `SOURCE_CHANGED`, follow SKILL.md: nothing of the person's is overwritten without being saved and put back.
9. **If none is right**, ask what was closest and what was wrong with it, and build one more round from that answer. Two rounds of new versions at most; after that the problem is not this part, and `/keen critique` is the better job.

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
- **Every version obeys DESIGN.md and the notes in the code.** If the most interesting direction would break one, build it anyway only as the third version, and say on its step which rule it breaks, so the person chooses it knowingly.
- **Leave no trace.** Nothing from the versions not chosen stays in the code, and nothing is committed or stashed on the way.

## Report

Follow the report shape in SKILL.md. Before the pick, "What happened" says the versions were built and put back, and "What you need to do" is to compare them, ask for changes or pick one. After the pick, a new page shows before and after and says what changed in plain words. Under Details, the files changed, and any edit of the person's that was merged or made again. Under "Not checked", states and widths of the chosen version you did not capture.
