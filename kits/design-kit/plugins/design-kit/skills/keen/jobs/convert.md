# convert

Reworks a landing, pricing or sign-up page so more of the people who arrive understand the offer and take the next step.

Interactive at the start, then aggressive. Edits files.

## The idea

A visitor gives a page a few seconds to answer three questions: what is this, is it for me, and what do I do next. A page loses people when the answer to any of them takes work. This job is not about tricks. Countdown timers, fake scarcity and buttons that shame the visitor win a click and lose the customer, and Keen does not add them. It is about removing every reason a person who would have benefited leaves without acting.

No one can know in advance that a change will lift sign-ups. This job makes the page clearer and says honestly that only a measurement afterwards shows whether it worked.

## Before you start

Ask once, with your best guess as the default for each, unless PRODUCT.md already answers:

- What is the one thing a visitor should do on this page?
- Who is arriving, and from where: a search, an advert, a recommendation?
- What proof do you really have: customer numbers, named customers, reviews, results? Only real ones.

## Steps

1. **Capture before**, at 390 and 1440 wide, the whole page. Most visitors are on a phone; judge that one first.
2. **Take the five-second test.** Look at the first screen for five seconds, look away, and write what the product is, who it is for and what to do next. Whatever you could not write is the first fault.
3. **Work through the page** with the table below.
4. **Measure the basics**: run `node <skill-dir>/scripts/measure.mjs` and run what it prints inside the page, for text that is hard to read and buttons too small to press. A slow page loses visitors before any of this matters; if it is slow, offer `/keen optimize` as the first next step.
5. **Capture after** and report on the Keen page, before and after side by side.

## The page, top to bottom

| Part | It works when |
|---|---|
| Headline | It says what the visitor gets, in their words, and would not fit a competitor's page unchanged. Not a slogan |
| Line under the headline | It says who it is for and how it works, in one or two sentences |
| Main button | There is one action, repeated down the page with the same words each time. The label says what happens ("Start free trial"), and what it costs or does not cost is beside it |
| First screen | On a phone, the headline, the line under it and the button are all visible without scrolling |
| Picture | It shows the real product doing the thing, not an abstract illustration or a stock photo |
| Proof | It is specific and real: a named customer, a number with its source, a quoted review. It sits near the button |
| Benefits | Each is something the visitor gets, followed by the feature that delivers it. Three to five, not twelve |
| Doubts | The page answers the questions that stop people: price, effort to set up, what happens to their data, how to leave |
| Form | It asks only for what is needed to start. Every extra field loses people. Errors appear beside the field in plain words |
| Other links | Nothing on the page competes with the main action. Menus and footers are quiet |
| End of the page | The offer and the button again, for the person who read everything |

## Rules

- **Nothing invented.** No made-up testimonials, customer counts, logos, ratings or "as seen in". If there is no proof yet, the page says what is true and leaves the space out. List what proof would help most.
- **No pressure tricks.** No false urgency, no pre-ticked boxes, no hidden costs, no guilt in the decline link, no making it hard to say no.
- **Claims stay as they are unless the person confirms them.** Rewrite for clarity; do not strengthen a promise.
- **Clear before clever.** If a line needs to be read twice, rewrite it.
- **The price, if there is one, is easy to find.**

## Report

Follow the report shape in SKILL.md. In "What happened", say what a visitor now learns in the first five seconds that they did not before, and what was cut. In "What it means", be plain that this should help and has not been shown to: name the one number to watch (visits that end in the main action) and suggest comparing two weeks before with two weeks after. Under "What you need to do", list the proof the page still lacks. Under Details, each change before and after. Under "Not checked", how the page performs with real visitors.
