# document

Writes down the design the product already has, in a DESIGN.md that every later job reads: its colours, text sizes, spacing, shapes, components and the reasons behind them.

Interactive. Writes or updates DESIGN.md after a yes. Changes no screen.

## The idea

Every editing job in Keen says "use the project's own values". When nobody has written them down, each job has to guess them again from the code, and each guess is slightly different. DESIGN.md is the product's memory. It is written from what is really on the screens, by measuring, and not from what anyone meant to build. Where the screens disagree with each other, the file does not record both: it asks which one is right.

## Steps

1. **Pick the screens that matter**: the four to six a person uses most. PRODUCT.md usually says which. If there is already a DESIGN.md, read it first; this job then checks it against the screens and updates it.
2. **Measure each screen.** Open it, capture it, and run `node <skill-dir>/scripts/measure.mjs`, running what it prints inside the page. Collect the text sizes, font families, colours and corner shapes with how often each is used. Read the theme or token file too, if there is one, for the names the code already uses.
3. **Find the system inside the numbers.** For each kind of value, the ones used often are the system and the ones used once or twice are strays. Write down the system. List the strays separately.
4. **Find the repeated parts**: buttons, fields, cards, lists, menus, dialogs, messages. For each, note its variants and where a good example lives.
5. **Collect the decisions.** Read the notes people left in the code and in PRODUCT.md about why something is the way it is. A decision with its reason is the most valuable line in the file, because it stops the next job from undoing it.
6. **Ask once.** Put every real conflict to the person in one message, each with your recommendation: "Buttons have 6px corners on four screens and 10px on two. Which is right? I'd say 6px." Do not ask about strays that are plainly mistakes.
7. **Show the draft** and write the file after a yes.

## What goes in DESIGN.md

Keep it under 200 lines. Someone should be able to read it in five minutes.

| Section | Holds |
|---|---|
| How it should feel | Three or four words, and one sentence on what that rules out |
| Colour | Each colour's name, value and purpose. Which pairs are used for text, with their measured contrast |
| Text | The ladder: each style's purpose, size, weight and line height. The font families and where each is used |
| Space | The set of spacing values, and the usual gap inside a group and between groups |
| Shape | Corner sizes, border weight and colour, the shadows in use and what each is for |
| Components | Each repeated part, its variants, and where the best example lives |
| Words | How the product addresses people, its names for its own things, and any words it avoids |
| Sizes | The screen widths the product supports and what changes at each |
| Decisions | Each choice someone made on purpose, with the reason and the date if known |
| Open questions | Conflicts nobody has settled yet |

## Rules

- **Record what is there.** Do not improve the design in the file. If a colour fails contrast, record it and list it under open questions with the measured ratio.
- **Purpose before value.** "Accent: things you can press" is useful to the next job. A bare value is not.
- **Plain words.** The owner reads this file too. Explain a term the first time it appears.
- **Do not copy the code.** Name where the values live and keep the file about meaning.
- **Keep what was there.** When updating an existing DESIGN.md, keep every decision already written unless the person says it has changed.

## What comes next

Offer as next steps: `/keen extract` if the strays are many, to move them onto the system; `/keen colour` or `/keen type` if the measurements showed text that is hard to read.

## Report

Follow the report shape in SKILL.md. In "What happened", say how many screens were measured and what was found in plain numbers ("five text sizes do most of the work; nine more appear once or twice"). "What you need to do" is to settle the open questions. Under Details, the strays with where each appears. Under "Not checked", the screens you did not measure.
