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

1. **Look at the real screen.** Open it in a browser or simulator and take screenshots. If the live product will not open or sits behind a sign-in, look for a way to run it on this computer with sample data (the README and the project's agent instructions usually say how) before giving up. If you cannot run it at all, say so in the first line, work from the code, and say at the end that nothing was seen.
2. **Read the project's own rules.** AGENTS.md or CLAUDE.md, PRODUCT.md and DESIGN.md come before your taste. Where the project has a colour, size or spacing value, use it. Keen never authorizes a commit, merge or deploy.
3. **Ask once, then go.** If something must be decided by the person, ask every such question together before you start, then finish without stopping. A job that only reports asks at most one question. A job that edits says what it will do in five lines or fewer and starts, unless the session-start note says ask before edits is on, in which case it waits for a yes.
4. **Stay inside the target.** Change the screen or component they named. List anything you noticed elsewhere at the end. Do not fix it.
5. **Never remove something a person can do.** Hiding, moving or merging a control is design work. Deleting a capability needs a yes first.
6. **One job.** If the job turns out to be the wrong one (asked to polish a screen whose structure is the problem), stop, say so in two lines and name the job that fits.

## The report

Every job ends with this, in this order.

```text
What happened: <one or two sentences>
What it means: <what is different for the people using the product>
What you need to do: <"Nothing", or "Pick a next step" followed by the next steps below>
Proof: <what to look at: the page, the screenshots, the numbers>

Details
<files and lines changed, commands run, values used>

Not checked: <what you could not see or test>
```

Leave out nothing from "Not checked". A report that claims more than was tested is worse than a short one.

### Writing the report

The reader runs the product and may never have opened its code. Write for them, then check the draft against these before sending it. If the kit's `fix-writing` skill is installed, apply its rules to the report as well.

- **No commands, file names, code or settings names above the Details line.** Say what you did in ordinary words: "I ran the product on this computer with its built-in sample data", not the command that did it. The command goes under Details.
- **Use the words on the screen.** Call things what the product calls them ("the Needs you list"), not what the code calls them.
- **A number comes with what it means.** "61 of 95 buttons are smaller than a fingertip can hit reliably" before "under 44 points".
- **When a technical term has to appear, teach it once, in one sentence, the first time.** "Contrast is how much the text stands out from what is behind it; 4.5 to 1 is the level the accessibility standard asks for." After that, use it freely. Never stack two unexplained terms in one sentence.
- **Details are for the person who wants them.** Keep them complete and exact, and put them where they can be skipped: collapsed if the page can collapse, last if it cannot.
- **Short.** If a sentence would survive being cut, cut it.

### Next steps

When there is something to do next, do not hand over one command as a line of text. Offer up to three next steps, ranked for this screen from what you found, most valuable first.

For each: the command, one plain line on what it will do, and one on why it ranks where it does. The first is marked as the suggestion.

When two or more of them belong together, also offer them as one run in the order that makes sense, with a line on why that order. Removing things comes before resizing what is left; finishing touches come last. Running them in order still means one job at a time, with a report after each.

Every next step is something the person can act on with one press:

- **Send it.** Where the harness lets a page or panel put a message into the conversation, each next step is a button that sends its command, so pressing it starts the job.
- **Copy it.** Everywhere, each next step also has a copy button.
- **Plain text** only when the harness can show neither. Then put each command on its own line so it can be selected whole.

## Proof

Reviews and before-and-after work end with something to look at, and the report and next steps live on the same surface. Use the richest one this harness has, in this order:

1. An interactive panel or page inside the conversation, where buttons can send a message back. Put the report, the screenshots and the next-step buttons there.
2. A published page the person can open and share, with copy buttons.
3. One self-contained HTML file at `.artifacts/keen/<job>-<target>.html` in the primary checkout, with the images inside the file and copy buttons, and the path given in the reply. Create `.artifacts/` with a `.gitignore` holding `*` if the project has none. Use this only when the first two are not available, and say that is why.

Whichever it is, it holds the screenshots side by side with short captions, each problem marked where it appears. Before and after are captured at the same sizes: 390 wide for a phone and 1440 wide for a desktop, unless the job says otherwise. A job that changes nothing visible reports in text only.

## Sources

Keen's jobs are written from published standards and platform guidance, named in each job file: the Web Content Accessibility Guidelines 2.2, Apple's Human Interface Guidelines, Material Design, and Jakob Nielsen's ten usability heuristics.
