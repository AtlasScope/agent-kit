# Walkthrough reference

Formats and guidance for the Walkthrough skill.

## Five labels

Every material claim in the evidence record (the brief, the observation records, the findings behind a verdict) carries one. The owner-facing summary is written plainly, with the labelled record behind it for anyone who wants to check. The labels sit beside the discovered, verified and recommended levels in `evidence.md`.

| Label | Means | Does not show |
|---|---|---|
| **Owner said** | A goal, rule, constraint or experience the owner reported | That users agree |
| **Person observed** | A named or anonymised person did or said this during a task you followed | That other people behave the same way |
| **Agent saw** | The running product showed or did this on a recorded journey, at a stated width | What a person would understand or feel |
| **Code says** | A file contains this rule, route or relationship | That it rendered, or that the deployed product matches |
| **Guess** | A reasoned reading that nothing above supports yet | Anything, until checked. Say what would check it |

A label never improves in passing from one document to the next. A guess in the walkthrough is still a guess in the recommendation unless something checked it.

When the browser and the code disagree, both stay in the record. What the running product did is what happened. The disagreement is a finding of its own: the deployment, stored state, a redirect or the revision you read may differ. Revise the explanation; keep the observation.

## Product brief

Half a page at most.

```
Purpose: <one sentence a customer would agree with> (owner said | product states | guess)
People:
- <who, told apart by what they know and what they are trying to finish> (label)
Jobs:
1. <job in the person's words>. Finished when: <what they see or have> (label)
Journeys chosen: <the complaint> · <the most common> · <one that works>
Constraints the owner set: <kept exactly as said>
```

## Observation record

One per step of a journey.

```
Journey: <job> · Step <n> · <desktop | phone | WxH> · <cold | source-informed>
Observed: <what is on screen and where: headings, the largest and highest elements, the controls offered, what sits below the first view>
Action taken: <what you did>
What happened: <result, including any message or state change>
Finish or progress shown: <what on screen indicates it, or nothing>
Reading: <your judgment of what the screen appears to prioritise, the action it invites, and how that fits the job>
Capture: <file>
```

`Observed`, `Action taken` and `What happened` are facts about the running product. `Reading` is an expert interpretation of the layout. It is a judgment about the design, and no measurement of where a person's attention goes. Keep the two apart, as in:

- Observed: "The promotional panel fills most of the first view. The search control starts below it."
- Reading: "The screen gives promotion priority over starting the task."

Explanations of cause and proposed changes come later, after the code has been read.

## What to look for on a screen

Use these as questions while looking at a capture. Each can come back "fine".

- **Order.** Does the largest, highest or strongest-contrast element match what the job needs first? List what competes with it.
- **Next step.** Is there one obvious next action? If several look equally primary, which would a newcomer pick?
- **Density.** Is the amount on screen right for someone doing this job at their level of practice? Too sparse costs experts as much as too dense costs newcomers.
- **Words.** Do labels use the person's words for things? Does the same thing keep the same name on every screen?
- **Result.** After an action, does the screen show that it worked and what changed?
- **Start and stop.** What does a first-time or empty state offer? What does an error offer besides the error?
- **Width.** At phone and narrow widths, is the content rearranged for the job, or squeezed and hidden?

## One product or several

Lay the captures from all journeys side by side.

- Do the title, the main action, the navigation and the status of the current item sit in the same place and play the same part on every screen?
- Do type sizes, spacing and colour mean the same thing throughout? A colour that marks danger on one screen and decoration on another is a finding.
- Does moving between two screens keep the person's context: the item they chose, their filters, their place?
- Does any screen look like it came from a different product? Find out why before calling it a fault. A checkout or a reading view may be different on purpose.

Report the pattern, with the two or three captures that show it.

## A session with the owner

The owner uses their product and says what they expect. You follow on the same screens and keep the record. The owner knows where everything is, so this shows where the product disagrees with its maker's intent. How a newcomer copes is a separate question, for a pass alone.

**Set up.** Ask for one real task: "Show me the task you were doing when it last frustrated you. Start where you would normally start, and tell me what you expect each action to do." Agree how they will share what they see: a URL you open in step with them, screenshots, or a recording. Use a test account; ask before capturing anything with personal data.

**During.** After each step they describe, bring up the same state yourself and fill an observation record. Ask short questions that carry no answer:

- "What did you expect here?"
- "What tells you this is the right place?"
- "What would count as finished?"
- "Where would you go next?"

Ask about what they did. Leave out any question that names a suspect ("is that tab confusing?"). Hold every suggestion until the task ends or stops.

**Two records.** Keep what happened separate from why it is that way.

- *Session record*: the actions, the expectations they voiced, what the screen showed, where you prompted them. Label: owner said, or agent saw for the states you opened yourself.
- *Decision record*: reasons the owner gives for past choices ("we split that page because of the old billing system"). Each reason is context to weigh. Ask whether it still holds.

**After.** Read back the three or four places where expectation and result parted, in their words, and ask which matters most. A frustrated remark is one observation. A preference is the owner's preference, and a wish for the product to feel a certain way is a design objective (`levels.md`). Report each as what it is.

For the parts of the product the owner is unsure about, recommend watching someone who has not used it, and say that an owner session and an agent pass together still leave that open.

## Captures and privacy

Screens show everything on them. Capture from local or staging copies with test accounts. Skip pages showing real personal data, or ask first. Store captures in the output folder beside the report and name each for its journey, step and width.
