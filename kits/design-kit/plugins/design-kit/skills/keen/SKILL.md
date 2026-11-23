---
name: keen
description: Use only when the user explicitly invokes /keen or $keen. One command for interface design work, written for people who direct the work and judge the result without reading code. Typed alone or with a vague request it shows a short menu, suggests one job and asks. Typed with a job (init, critique, distill, polish, harden, adapt) it runs that job. Every job ends in plain English with proof the person can look at. Ordinary design talk must not activate it.
disable-model-invocation: true
metadata:
  short-description: Design jobs with a menu, plain English and proof
  author: AtlasScope/agent-kit
---

# Keen

The person types `/keen` and what they want, in their own words. They may not read code. They judge by looking at the screen and by reading what you tell them. Your job is to pick the right piece of design work, do it properly, and show them the result in a form they can check with their own eyes.

Keen is an early version. It has six jobs. For type, colour, words and motion, say it is not in Keen yet and point to `/design`.

## Jobs

| Job | Use it when | Changes files | Instructions |
|---|---|---|---|
| `init` | The project has no PRODUCT.md, or nobody has written down who it is for | Writes PRODUCT.md after a yes | [jobs/init.md](jobs/init.md) |
| `critique` | Something feels off and they want to know what and why | No | [jobs/critique.md](jobs/critique.md) |
| `distill` | The screen is crowded, busy or hard to scan | Yes | [jobs/distill.md](jobs/distill.md) |
| `polish` | The screen is right but looks unfinished | Yes | [jobs/polish.md](jobs/polish.md) |
| `harden` | It looks fine with demo data and breaks with real data | Yes | [jobs/harden.md](jobs/harden.md) |
| `adapt` | It works on one screen size and not on others | Yes | [jobs/adapt.md](jobs/adapt.md) |

Read the job's file before running it. Run one job per request.

## Which path to take

1. **They named a job** (`/keen critique the pricing page`): run it.
2. **Their words clearly match one job** ("this page is too busy" is distill; "does this hold up on a phone" is adapt): say which job you picked in one line and run it.
3. **Anything else**, including `/keen` alone: show the menu and stop.

A request to "make it better", "fix the design" or "improve this page" is vague. Show the menu. Do not guess between a review and an edit.

## The menu

Look at the project first so the suggestion is real: is there a PRODUCT.md and a DESIGN.md, and which screen are they talking about? Open that screen if you can. Then reply in this shape and stop:

```text
Suggested: /keen <job> <target>
<Two lines at most: what it will do and how, and whether it changes files.>

Or, if the problem is something else:
- It's crowded or hard to scan: /keen distill
- It's right but looks unfinished: /keen polish
- It breaks with real data: /keen harden
- It breaks on other screen sizes: /keen adapt
- I can't say what's wrong: /keen critique

Which one?
```

List only the jobs that were not suggested. If there is no PRODUCT.md and the request involves judging or changing a screen, the suggestion is `/keen init`, with one line on why it comes first. Keep the whole menu under fifteen lines.

## Rules for every job

1. **Look at the real screen.** Open it in a browser or simulator and take screenshots. If you cannot run it, say so in the first line and work from the code, and say at the end that nothing was seen.
2. **Read the project's own rules.** AGENTS.md or CLAUDE.md, PRODUCT.md and DESIGN.md come before your taste. Where the project has a colour, size or spacing value, use it. Keen never authorizes a commit, merge or deploy.
3. **Ask once, then go.** If something must be decided by the person, ask every such question together before you start, then finish without stopping. A job that only reports asks at most one question. A job that edits says what it will do in five lines or fewer and starts, unless the session-start note says ask before edits is on, in which case it waits for a yes.
4. **Stay inside the target.** Change the screen or component they named. List anything you noticed elsewhere at the end. Do not fix it.
5. **Never remove something a person can do.** Hiding, moving or merging a control is design work. Deleting a capability needs a yes first.
6. **One job.** If the job turns out to be the wrong one (asked to polish a screen whose structure is the problem), stop, say so in two lines and name the job that fits.

## The report

Every job ends with this, in this order. Plain words. No file names above the Details line.

```text
What happened: <one or two sentences>
What it means: <what is different for the people using the product>
What you need to do: <the one thing, or "Nothing">
Proof: <what to look at: the page, the screenshots, the numbers>

Details
<files and lines changed, commands run, values used>

Not checked: <what you could not see or test>
```

Leave out nothing from "Not checked". A report that claims more than was tested is worse than a short one.

## Proof

Reviews and before-and-after work end with something to look at. Show it the best way this harness has:

- If you can publish or render a page for the person (an artifact, a preview pane, a canvas), do that.
- Otherwise write one self-contained HTML file to `.artifacts/keen/<job>-<target>.html` in the primary checkout and give the path. Create `.artifacts/` with a `.gitignore` holding `*` if the project has none.

The page holds the screenshots side by side with short captions, and the same report text. Before and after are captured at the same sizes: 390 wide for a phone and 1440 wide for a desktop, unless the job says otherwise. A job that changes nothing visible reports in text only.

## Sources

Keen's jobs are written from published standards and platform guidance, named in each job file: the Web Content Accessibility Guidelines 2.2, Apple's Human Interface Guidelines, Material Design, and Jakob Nielsen's ten usability heuristics.
