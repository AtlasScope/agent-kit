# optimize

Makes a screen feel fast: the main thing appears sooner, taps get an answer at once, and nothing jumps while loading.

Aggressive. Edits files. Measures before and after.

## The idea

People do not experience speed in milliseconds. They experience three things: how long they stare at nothing, whether the screen answers when they touch it, and whether things move under their finger. Research on response times has been steady for decades: under a tenth of a second feels instant, under a second keeps a train of thought, and after ten seconds attention is gone (Nielsen). This job works on what the person sees. If the cause is a slow server or a slow database, it says so and hands over; it does not go digging there.

## Steps

1. **Measure before.** Load the screen fresh, on a throttled connection if the tool offers one, and record the three numbers below. Take a capture every half second while it loads so the person can see what the wait looks like. If you cannot measure, say so now and treat everything after as unproven.
2. **Find what the wait is made of.** List what loads before the main thing appears: pictures and their sizes, fonts, scripts, and requests for data. Note anything large, anything that blocks, and anything loaded that this screen does not use.
3. **Fix in the order below**, starting with whichever number is worst.
4. **Measure after**, the same way, three times, and report the middle result.
5. **Report** on the worksheet: the loading captures before and after as two strips, and the three numbers.

## The three numbers

From Google's Core Web Vitals. "Good" is the published threshold.

| Number | What a person feels | Good |
|---|---|---|
| Largest Contentful Paint | How long until the main thing on the screen appears | 2.5 seconds or less |
| Interaction to Next Paint | How long the page takes to react to a tap | 200 milliseconds or less |
| Cumulative Layout Shift | How much things jump around while loading | 0.1 or less |

## Fixes

**The main thing appears late.**
- Serve pictures at the size they are shown, in a modern format, and load the ones below the first screen only when they are near. The main picture loads first and is never delayed.
- Show the page's structure and text at once and let data fill in, in place of a blank screen or one large spinner.
- Load only the fonts and weights the screen uses, and show text in a stand-in font while they arrive.
- Move anything the first screen does not need until after it has appeared.

**Taps feel slow.**
- Every press shows something within a tenth of a second: a pressed state, a spinner on the button, the new row appearing.
- Where an action nearly always succeeds, show the result at once and correct it in the rare case it fails, with a clear message.
- Break up long work so the page can still respond while it runs.
- A wait of more than a second shows that work is happening. More than ten seconds shows progress and can be cancelled.

**Things jump.**
- Every picture, video, advert and embedded frame has its space reserved before it loads.
- A placeholder is the same size as what replaces it.
- Nothing is inserted above what the person is reading. New content arrives below, or behind a "show new" control.
- The stand-in font is close in width to the real one, so text does not reflow when it arrives.

## Limits

- The screen must look the same when it has finished loading. This job changes when things appear, not what appears.
- Never show made-up content to seem fast. A placeholder is a shape, not a fake number.
- Stay on this screen and what it loads. If the real cause is elsewhere (a slow request, a large shared script), report it with the measurement and offer the kit's engineering command as the next step if it is installed.
- A number from this computer on a fast connection is not what a customer on a phone gets. Say which conditions you measured under.

## Report

Follow the report shape in SKILL.md. In "What happened", give the three numbers before and after, each with what it means the first time it appears ("the main picture now appears in 1.8 seconds, down from 4.1"). Under Details, each fix and the conditions of the measurement. Under "Not checked", real devices, real networks, and anything you fixed without being able to measure.
