# extract

Tidies the design behind the screens without changing how they look: repeated values get one name, and repeated parts become one shared part.

Aggressive. Edits files across the screens named. Proves that nothing looks different.

## The idea

When the same blue is written out in forty places, changing the blue means finding all forty, and the three that were missed are why the product looks slightly off. Extracting gives each repeated thing one home, so a later change happens once and lands everywhere. The person sees no difference today. What they get is that every later design job becomes smaller, safer and more consistent. Because nothing should look different, this job can prove itself exactly: the screens before and after must match.

## Steps

1. **Read DESIGN.md** and the theme or token file. If there is no DESIGN.md, stop and suggest `/keen document`: extracting needs to know which values are the system and which are strays.
2. **Set the scope.** The screens or folder the person named, or the whole product if they said so. Say in one line what is in and what is out.
3. **Capture before**: every screen in scope at 390 and 1440 wide, in each theme (switch with the product's own control, or by telling the browser to prefer light or dark). These are the proof, so keep the page still: same data, same scroll position, animations off. Capture each one twice before changing anything and compare the two: whatever differs between two captures of unchanged code is the noise on this machine, and only a difference larger than that counts later.
4. **Find the repeats.**
   - Values: a colour, size, space, corner or shadow written out directly where a named one exists, or the same raw value used in three or more places with no name. Count places across the whole product, even when you will only change the ones in scope; a value used once here and ten times elsewhere is a repeat.
   - Parts: the same arrangement of elements built separately in three or more places, such as a card, a row, a field with its label and message.
5. **Decide each one.**
   - A raw value equal to a named one: use the name.
   - A raw value used in three or more places with no name: give it a name that says its purpose, add it where the project keeps such names, and use it.
   - A raw value within a hair of a named one: this would change how the screen looks. Do not change it here. List it for `/keen polish`.
   - A repeated part: make one shared part in the project's usual place and style, and use it in every place it was repeated. Keep its options few: only the differences that already exist.
   - Something used once or twice: leave it. Sharing too early is its own mess.
6. **Make the changes** in small groups, running the project's own checks after each group.
7. **Capture after**, the same way, and compare every pair. Any difference a person can see, beyond the noise you measured in step 3, is a fault in this job: fix it or undo that change.
8. **Update DESIGN.md** with any new names and shared parts.
9. **Report** on the Keen page. The screens look the same, so one shot of a screen in scope is enough, captioned "Unchanged", and the counts go in `changes` ("Install box: 3 copies" to "1 shared part").

## Rules

- **Nothing looks different.** That is the whole promise. A change that improves a screen belongs to another job.
- **Names say purpose.** "danger", "border", "space between groups". Not "red 500" for something used to mean danger, and not a name taken from one screen.
- **Follow the project.** Use its existing way of naming, sharing and organising. Do not introduce a new tool or structure.
- **Three before sharing.** Two things that look alike today may be meant to differ tomorrow.
- **Stay in scope.** If a value is also repeated outside the scope, say how many places remain. Do not chase them.

## Report

Follow the report shape in SKILL.md. In "What happened", give the counts: raw values replaced by names, new names added, shared parts made and how many copies each replaced. "What it means" is that the screens look the same and the next change to any of these happens in one place. For proof, say how many screen captures were compared and that they match, or which do not. Under Details, each name and part with its files, and the near-miss values left for polish. Under "Not checked", screens or themes you could not capture.
