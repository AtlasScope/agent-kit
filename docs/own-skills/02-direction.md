# Own skills: the direction the owner chose

Written 2026-11-23, from an interview with the owner. This is the direction for Agent Kit's skills. The earlier plan in [01-plan.md](01-plan.md) is closed and kept only for its inventory of what is borrowed.

## Who Agent Kit is for

Solo builders who direct the work and judge the result, without needing to read the code. It should stay useful to people who do read code, but it is built for people who don't.

## Four rules every job follows

These are the product's point of difference, and every job must meet them before it is approved.

1. **Plain English out.** A job ends with what happened, what it means, and whether the person needs to do anything. Technical detail (files, lines, commands) sits in a section underneath, so one report serves both readers.
2. **Proof you can see.** Before and after, a screenshot, a number. The person approves by looking.
3. **Ask once, then go.** One approval for the list of work, with anything that still needs the person batched at the end.
4. **What is due.** The kit can say which checks are worth running now, based on what changed.

## End state

- The kit contains only original skills. All 49 borrowed skills and all eight outside plugins the routers point to are replaced or dropped. See [ADR 0007](../adr/0007-only-original-skills-in-one-install.md).
- One install brings every area. The five separate plugins become one.
- Each area is one command word. The bare word shows a menu; the word plus a job runs that job.
- Every area has the same two ways in: the menu for "I don't know what to do", and clearly named jobs for a person who wants one specific thing.

## How a replacement is written and approved

- Written new, in our own words, from the job and from primary sources: specifications, platform documentation, accessibility criteria, published books and papers. No forks, and the borrowed skill's body is not opened while its replacement is written.
- A borrowed skill stays until its replacement is approved, then leaves in the same release. Every capability is kept, not every skill: each borrowed skill becomes a named job, merges into one, or goes.
- PRODUCT.md and DESIGN.md keep their names and stay the two project files design work reads.
- The original author stays on the public credits page under "inspired by" after their skill is removed.
- Approval test: the replacement and the original run on the same two or three real screens from the owner's own projects, shown side by side. The bar is at least as good and simpler to use, and it meets the four rules.
- The owner approves in batches by job, not skill by skill.
- A removed skill's old command name stops existing. Each removal ships in a new major version with a short note of what replaced what. No stand-in commands are kept under old names.

## The design area: Keen

- The design area is renamed from `/design` to **Keen**. `/keen` shows the menu and `/keen critique` runs a job. "Design" was judged too generic to stay distinct among other people's tools.
- Names checked and rejected: Crisp (a customer-chat company with its own Claude connector, and existing skills of that name), Sharp and Solid (existing libraries and plugins). The check on Keen was one web search and a look through the installed marketplaces, so it should be repeated before release.
- Size: about 20 to 25 named jobs. That is every capability worth keeping from the borrowed design skills, sharpened, plus the Impeccable jobs the kit has no equivalent for today: init, document, extract, shape, audit, optimize, onboard, live, and bolder or quieter.
- First batch: critique, distill, harden, adapt, polish and init.
- Impeccable stays installed and usable by itself until Keen replaces it.
- Writing help follows the same shape: the four outside writing tools become a small number of named writing jobs with specific functions, plus a general one for when the person does not know which to use.

## How a menu behaves

When the request is vague, the menu leads with one suggestion, says in a couple of lines what it will do and how, lists the alternatives briefly, and asks which to run. When the request is clear, the job runs straight through. Output stays short.

Jobs are one of two kinds by design. Edits are aggressive: they make the full change and show the result. Reviews and plans are interactive: they ask one or two questions first when the answer changes the outcome.

Reviews, plans and menus of options end with a visual result. The skill says what to show and each harness decides how, with a plain HTML file as the fallback. Jobs that only edit code report in a few lines.

## How hands-on the kit is

A person picks one of three levels at install and can change it at any time.

1. **Typed only** (the default): nothing runs unless the command is typed.
2. **Starts when asked**: an area's menu also starts when the person asks for that kind of work in plain words.
3. **Checks after edits**: in addition, a check runs by itself after relevant changes.

An automatic check only reports. Changing files always follows a command or a yes.

One doctor command covers the whole kit: what is installed, which level is on, and which overlapping tools could be dropped.

## New areas, in order

1. Keen (design).
2. Refactor. A whole-repo refactor first shows a short map of what would change and in what order, takes one yes, then carries out every stage without asking again, proving after each stage that nothing broke. The working name for this area and repo control is Tidy.
3. Ship, with repo control: commit, pull request, checks, merge, confirm it is live.
4. Routine health checks. They run when asked, with the kit saying what is due. No schedule runs unless someone turns one on.

After those four are approved, engineering-kit's 14 borrowed skills get the same treatment as design.

The owner's "ask once, then go" command, Just Do It, joins the public kit rewritten without personal details, as the standard way that rule works.

Waiting, in no order yet: SEO, computer use, launch readiness, incident response, security pass, cost, upgrades, tests, speed, checking that numbers are right, mapping an unfamiliar repo, and planning from idea to spec.

## The prompt library

- It is its own thing: a reference page people open in a browser, not something shipped inside a plugin.
- One table feeds both the menus and the page, so what an agent offers in chat and what the page says always agree.
- The page's first job is explaining what each command does in one plain line, organised by what the person wants fixed and not by which tool provides it.
- The library's investigation prompts become the named jobs of the new areas. The page keeps the text so someone without the plugin can still copy it.

## Not decided

- The final list of Keen's 20 to 25 jobs and their names.
- Names for the areas after Keen, beyond the working name Tidy.
- How the one install is laid out on disk and how existing installs of the five plugins move to it.
