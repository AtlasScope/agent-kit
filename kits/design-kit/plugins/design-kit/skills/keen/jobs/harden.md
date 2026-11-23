# harden

Makes a screen survive real use: real data, slow connections, mistakes and bad luck. Demo data is short, complete and always loads. Real data is none of those.

Aggressive. Edits files. Tests each case, fixes what breaks, and shows the result.

## Steps

1. **Find what the screen depends on**: every piece of data it shows, every request it makes, every input it accepts.
2. **Build the worst-case list** from the table below, keeping only the cases that can happen on this screen. Add any that PRODUCT.md lists under what must never happen.
3. **Try each case** in a browser or simulator, using whatever the project offers: seed data, a mock, a throttled network, a blocked request, edited values. Capture what you see. Where you cannot produce a case, read the code path and mark it as read, not seen.
4. **Fix what broke.** Use the project's existing components for empty, loading and error states before writing new ones.
5. **Try each case again** and capture the result.
6. **Report** with a page showing each failing case before and after.

## Worst cases

| Case | Try | It holds when |
|---|---|---|
| Nothing yet | A new account, an empty list, zero results for a search | The screen says what belongs here and offers the first step. An empty search says so and keeps the search term |
| Too much | A name of 80 characters, a paragraph where a word was expected, a number in the billions, 1,000 rows | Text wraps or shortens without covering anything, the full value is still reachable, long lists stay responsive |
| Missing pieces | No photo, no optional field, a deleted related record | A sensible placeholder. Never the words "null" or "undefined", never a broken image |
| Waiting | A three-second response, a slow image | Something shows at once, the layout does not jump when content arrives, and the person can tell it is working |
| Failure | A failed request, a timeout, no connection | A message in plain words saying what happened and what to do, a way to try again, and nothing they typed is lost |
| Looks real but isn't | A failed load that falls back to zero, a stale saved copy | Missing or old data is visibly marked as such. A blank or a dash, never a zero the person could mistake for a real number |
| Twice | A double tap on submit, the back button after submitting, a refresh mid-way | One result. The button shows it is working and does not accept a second press |
| Wrong input | Empty required fields, a pasted value with spaces, the wrong format | The message sits beside the field, says how to fix it, and appears without clearing the rest of the form (WCAG 2.2, 3.3.1 and 3.3.3) |
| Not allowed | Signed out, or signed in without permission | A clear explanation and a way forward, not a blank screen or a spinner that never ends |
| Bigger text | Browser zoom at 200 percent, or the phone's larger text setting | Everything is still readable and usable with no sideways scrolling (WCAG 2.2, 1.4.4 and 1.4.10) |
| Keyboard only | Tab through the screen and do its job without a mouse | Every control is reachable in a sensible order, focus is visible, and nothing traps it (WCAG 2.2, 2.1.1 and 2.4.7) |
| Other languages | Only if the product supports them: text a third longer, a right-to-left language | Layout absorbs the longer text and mirrors correctly |

## Limits

- Fix how the screen behaves and what it shows. A cause on the server (the request really is failing) is listed at the end, not fixed here.
- Do not invent error wording that promises something the product may not do ("we'll email you"). Say what happened and what the person can do now.
- Ask before changing what a form accepts or rejects. That is a product rule, not a design one.

## Report

Follow the report shape in SKILL.md. "What happened" gives the count: cases tried, held already, fixed, left. Then a table with one row per case: the case in plain words, the result (held, fixed, left, or read not seen), and one line on what a user now sees. Anything left is explained under "What you need to do" or "Not checked".
