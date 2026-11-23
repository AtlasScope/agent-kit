# The kit ends with only original skills, in one install

Agent Kit began as mostly other people's work: 49 borrowed skills, and routers whose first picks often sit in outside plugins. The owner decided the finished kit contains only skills written for it, and ships as one install where each area is a single command word with a menu. The reasons are that the overlap between borrowed skills is what makes the kit hard to use, an outside plugin can change the kit's behaviour without notice, and the owner runs exactly what is published, so a kit that cannot be simplified is one the owner cannot use well.

This reverses part of ADR 0006, which made Motion Kit its own plugin. Its reasoning about testing scripts in their own folder still holds for how the code is organised, but not for how people install it.

## Considered options

- **Fork the borrowed skills and edit them.** Allowed by their licences, but it keeps the kit tied to other authors' wording and structure, and `CONTRIBUTING.md` already rules out rewording someone else's skill to look original.
- **Keep borrowed skills alongside originals.** This was the recommendation in the earlier plan, `docs/own-skills/01-plan.md`, now closed. It leaves the overlap in place and the choice with the user.
- **Keep several plugins.** People could install only what they want, but they first have to learn which plugin holds what.

## Consequences

- A borrowed skill stays until its replacement has been compared with it on real work and approved, then leaves in the same release. Its author stays in the credits as a source.
- Removing a skill removes its command for everyone who installed it, so each removal is a major version.
- Every original is the owner's to keep current, including platform facts that specialists maintain today. The fast-moving platform skills, where that risk is highest, are replaced last.
- The public description changes from a curated set of other people's skills to an original kit. Credits remain for sources and for anything still borrowed.
