# Motion Kit is its own plugin, and an alternative until it has been compared

Motion Kit ships as a fifth plugin with one command, `/motion`. It was asked for as a focused motion plugin, it works with nothing else installed, and its scripts (a code inventory, frame-by-frame browser captures, a spring calculator) are easier to test and version in their own folder than inside design-kit's 37 skills. ADR 0005 kept Product Experience inside an existing plugin so no run would depend on two installs; that concern does not apply here, because `/motion` calls no other kit and no other kit requires it.

It is the first skill written under the approach in `docs/own-skills/01-plan.md`: from primary sources, without reading the bodies of the borrowed motion skills, with measurement and a project file (`MOTION.md`).

The `/design` router lists `/motion` as the alternative wherever a borrowed motion skill is already the pick, and as the pick only for two jobs nothing covered before (setting up a motion system, storyboarding a sequence). The borrowed motion skills stay in design-kit, credited. First picks change only after a recorded run on projects the skill was not written against shows it doing the job at least as well.
