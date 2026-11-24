# audit

Measures a screen against published standards and reports what passes, what fails and how many people each failure stops. Numbers only. For an opinion on whether the design works, the job is `critique`.

Interactive. Changes nothing.

## The idea

A critique is a judgment and two good designers can disagree with it. An audit is a measurement: the text either stands out enough from its background or it does not. The value of this job is that every line in the result is something the person could check again tomorrow and get the same answer. So nothing goes in the result that was not measured, and anything you could not measure is listed as not measured, never as a pass.

## Steps

1. **Open the screen** at 390 and 1440 wide, in the state a real person usually sees. Capture both.
2. **Run the measuring script** at each width. `node <skill-dir>/scripts/measure.mjs` prints a script; run that inside the page with the tool's way of running JavaScript in a page. It returns counts and the first 25 examples of each failure, with where each one sits on the page. It reads the page and changes nothing.
3. **Do the checks the script cannot do**, by hand, in the table below. Each takes under a minute.
4. **Measure speed** if the tool can: load the page fresh and read the three numbers in the speed table. If you cannot, say so under "Not checked". Do not estimate.
5. **Rank** by who is stopped, using the order below.
6. **Report** on the worksheet, with the worst failures pinned on the screenshot. The script gives each failure's position in pixels; a pin wants a percentage of the image.

## What is measured

Accessibility criteria are from the Web Content Accessibility Guidelines 2.2, level AA unless marked.

| Check | Passes when | How | Standard |
|---|---|---|---|
| Text stands out from its background | 4.5 to 1, or 3 to 1 for text of 24px and up (18.66px and up if bold) | Script: `text.lowContrast` | 1.4.3 |
| Text over a picture or gradient | Readable at its worst point | Script counts these as not measured. Look at each one and say which you could not confirm | 1.4.3 |
| Controls are big enough to hit | 24 by 24 CSS pixels at least. On a phone, 44 by 44 is what a finger needs | Script: `controls.under24`, `controls.under44` | 2.5.8, Apple's guidelines |
| Every control has a name | A screen reader has words to say for each button, link and field | Script: `controls.unnamed`. A placeholder is not a name | 4.1.2, 3.3.2 |
| Pictures have a text alternative | Each picture that carries meaning has one; decoration has an empty one | Script: `picturesWithoutText` | 1.1.1 |
| Headings form an outline | One main heading, no skipped levels | Script: `headings` | 1.3.1 |
| No sideways scrolling | Nothing wider than the screen at 320 wide | Script: `sidewaysScroll`, run at 320 | 1.4.10 |
| Zoom is allowed | The page does not block pinch zoom | Script: `zoomBlocked` | 1.4.4 |
| The page says what language it is in | So a screen reader pronounces it correctly | Script: `languageSet` | 3.1.1 |
| Usable with a keyboard | Tab reaches every control in an order that follows the page, and the screen's main job can be finished | By hand: tab through and do the job | 2.1.1, 2.4.3 |
| You can see where you are | A clearly visible outline on the focused control, never hidden behind a fixed header or bar | By hand, while tabbing | 2.4.7, 2.4.11 |
| Meaning does not rest on colour alone | Errors, required fields and status have an icon, text or shape as well | By hand: look at each coloured signal | 1.4.1 |
| Text can grow | At 200 percent zoom everything is readable and nothing is cut off | By hand: zoom and capture | 1.4.4 |
| Movement can be turned off | With the reduce-motion setting on, nothing slides, zooms or loops | By hand, if the tool can set it | 2.3.3 (AAA) |

Speed, from Google's Core Web Vitals. "Good" is the published threshold.

| Number | What a person feels | Good |
|---|---|---|
| Largest Contentful Paint | How long until the main thing on the screen appears | 2.5 seconds or less |
| Interaction to Next Paint | How long the page takes to react to a tap | 200 milliseconds or less |
| Cumulative Layout Shift | How much things jump around while loading | 0.1 or less |

Consistency. These are counts, not failures. Report them with what they suggest.

| Count | From the script | Usually means |
|---|---|---|
| Different text sizes | `variety.textSizes` | More than six on one screen: sizes are being chosen by eye |
| Font families | `variety.fontFamilies` | More than two: something was pasted in from elsewhere |
| Text colours and background colours | `variety.textColours`, `variety.backgroundColours` | High numbers: no shared palette |
| Corner shapes | `variety.cornerShapes` | More than three: no shared set of shapes |
| Smallest text | `variety.smallestText` | Under 12px is hard to read for many people |

## Ranking

1. **Stops someone completely**: a control with no name, a job that cannot be finished by keyboard, zoom blocked, focus you cannot see.
2. **Makes it hard for many**: low contrast on text people must read, targets under 24, sideways scrolling, text that will not grow.
3. **Slows everyone**: any speed number outside "good".
4. **Untidy**: the consistency counts, skipped headings.

Within a level, the failure that appears most often comes first.

## What to report

- **The verdict in one sentence, with numbers.** "11 of 14 checks pass. The three that fail stop keyboard and screen-reader users from finishing a booking."
- **A table of every check**: pass, fail with the count ("8 of 95 pieces of text"), or not measured with the reason.
- **The failures, ranked**, each with what a person experiences, one named example from the screen, and the standard it comes from.
- **Next steps**, each failure group matched to the job that fixes it: contrast to `/keen colour`, small text and too many sizes to `/keen type`, small targets and sideways scrolling to `/keen adapt`, missing names, keyboard and zoom to `/keen harden`, the consistency counts to `/keen polish`. A speed failure is not design work: offer the kit's performance command if it is installed, and say so if it is not.

Do not turn the result into a score out of 100. A score hides which people are stopped.

## Report

Follow the report shape in SKILL.md. "What happened" is the verdict. Teach each term the first time it appears: most people have never heard "contrast ratio" or "Layout Shift". Under Details, the full output of the script for each width. Under "Not checked", every row you could not measure, and every state of the screen you did not open.
