# Agent Kit

Agent Kit is an open set of skills for AI coding agents plus a prompt library, published as plugins and as a public website.

## Content

**Prompt**:
A single piece of text a person pastes into an agent, with notes on why it exists, what it returns, and when to skip it.
_Avoid_: Recipe, command (when meaning a library entry)

**Skill**:
A folder with a `SKILL.md` that an agent loads to do one kind of job.
_Avoid_: Tool, agent

**Kit**:
One installable plugin that groups related skills, such as `design-kit` or `engineering-kit`.
_Avoid_: Package, pack, bundle

**Borrowed skill**:
A skill copied from another author's repository, kept under its original license and credited to them.
_Avoid_: Third-party skill (in user-facing copy), imported skill

**Original skill**:
A skill written for Agent Kit from the job and from primary sources, with none of another author's wording.
_Avoid_: Own skill, in-house skill, fork

**Outside plugin**:
A plugin Agent Kit does not ship that one of its routers sends work to.
_Avoid_: External tool, dependency, add-on

**Area**:
One kind of work, such as design or refactoring, reached through a single command word.
_Avoid_: Category, domain, section, router (when meaning the kind of work)

**Job**:
One named thing a person wants done within an area, which they can ask for directly.
_Avoid_: Sub-command, mode, action, task

**Menu**:
What an area shows when the person has not named a job: one suggestion, what it will do, the alternatives, and a question.
_Avoid_: Picker, wizard, list of commands

**Keen**:
The design area.
_Avoid_: Design (as the command word), design router

**Level**:
How much the kit does without being typed: typed only, starts when asked, or checks after edits.
_Avoid_: Mode, autonomy setting, automation tier

**Library**:
The public website where every prompt and skill can be read and copied without an account.
_Avoid_: App, dashboard, catalog (for the site)

## Accounts

**Collection**:
A named list of prompts and skills saved by one person, private unless they share it; a shared collection has its own public page, and one that holds skills also shows a single install command for them.
_Avoid_: Folder, playlist, board, personal kit, custom kit

**Starred**:
The built-in collection every person has, which starring a prompt or skill adds to.
_Avoid_: Favorites, likes, bookmarks
