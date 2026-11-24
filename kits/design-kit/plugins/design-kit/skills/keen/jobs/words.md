# words

Rewrites the words on a screen so a person knows what each thing is, what will happen when they press it, and what to do when something goes wrong.

Aggressive. Edits the text on the screen and nothing else. Does the whole screen in one go.

## The idea

The words on a screen are part of how it works. A button that says "Submit" makes a person stop and wonder what is being submitted. A button that says "Send invoice" does not. This job covers the words inside the product: headings, labels, buttons, hints, messages, empty screens and confirmations. Sales and marketing pages are a different kind of writing, with a different job; this is not the job for those.

## Steps

1. **Capture before**, at 390 wide, including every message you can reach: an error on each field, the empty state, a confirmation, a success message. Reach them by using the screen: submit it empty, press each button, search for something that is not there. Never press a control that sends, buys, deletes, publishes or changes saved data to see its message; read those in the code. A message you cannot bring up this way, read in the code and list under "Not checked".
2. **Collect every piece of text** on the screen into a list: where it is, what it says, and what it is for. Include text a screen reader hears that is not shown, such as the name of an icon button.
3. **Find the project's own words.** Read PRODUCT.md, any glossary, and the neighbouring screens. A thing has one name across the whole product. If this screen calls it a "workspace" and the next calls it a "project", pick the one the product uses most and list the other places under "What you need to do". Do not change other screens.
4. **Rewrite**, using the table and rules below.
5. **Read every line aloud.** Anything you would not say to a person standing next to you gets rewritten.
6. **Check the fit.** Longer words can break a layout. Look at 390 wide and fix any text that now wraps badly or is cut off, by shortening the words, not by shrinking the text.
7. **Capture after** and report on the Keen page with the before and after shots.

## What each kind of text must do

| Text | It must | Before | After |
|---|---|---|---|
| Button | Name what happens: a verb and the thing | Submit | Send invoice |
| Destructive button | Name what is lost | OK | Delete 3 files |
| Link | Make sense read alone, out of its sentence (WCAG 2.2, 2.4.4) | Click here | See pricing |
| Field label | Say what to enter, in the user's word for it. Always visible, never only a placeholder (WCAG 2.2, 3.3.2) | Identifier | Order number |
| Hint | Give the rule before the mistake, beside the field | (none) | At least 12 characters |
| Error | Say what happened, why if it helps, and what to do now. Beside the field. No blame, no codes (WCAG 2.2, 3.3.1 and 3.3.3) | Invalid input | That card number is one digit short. Check it and try again |
| Empty screen | Say what belongs here and offer the first step | No data | No invoices yet. Create your first one |
| Confirmation | Ask the real question and label each button with its result | Are you sure? Yes / No | Delete this project? Its 12 files go too. Delete project / Keep it |
| Success | Say what happened and what comes next, briefly | Success! | Invoice sent. Payment is due in 14 days |
| Loading | Say what is happening if it takes more than a moment | Loading... | Checking your bank details |
| Page heading | Name the screen in the words used to get there | Dashboard overview page | Invoices |

## Rules

- **Their words, not the system's.** Use what a customer would call it. Internal names, database terms and abbreviations nobody outside the team uses come out.
- **Lead with the point.** Put the word that matters first, so someone scanning down the left edge finds it. "Password must be 12 characters" before "In order to keep your account secure".
- **Short, then shorter.** Cut "please", "simply", "just", "successfully", "in order to" and any sentence that restates the heading. Do not cut the one detail that tells them what to do.
- **One name per thing, one verb per action.** Not "delete" here, "remove" there and "trash" on the icon.
- **Say what will happen, not how the system works.** "We'll email you a receipt", not "A receipt will be generated".
- **Sentence case.** Capitalise the first word and proper names. Not Every Word.
- **No blame, no alarm, no jokes in errors.** "That password doesn't match", not "You entered the wrong password". An exclamation mark almost never helps.
- **Numbers and dates the way the reader writes them.** "3 files", "12 March", "in 2 days". Never a bare timestamp, and never a count with "(s)" on the end.
- **Calm and plain is the voice** unless PRODUCT.md describes another one. If it does, follow it, and still obey every rule above.

## Limits

- Change text only. Do not move, resize, restyle or remove anything.
- Find where each piece of text is used before changing it. Text shared with other screens changes only if the new wording is right in every place it appears; say which other places it now shows in.
- Do not change a legal notice, a price, a name of a plan or anything a contract depends on. List what you would change and why.
- Do not change the meaning. If you cannot tell what a message is for from the code, leave it and list it.
- If the product is translated, change only the source language, keep every placeholder and plural form intact, and say that the other languages now need the same pass.

## Report

Follow the report shape in SKILL.md. In "What happened", say how many pieces of text changed out of how many, and give the changes a person would notice most, before and after, in the page's `changes` (five at most). Under "What you need to do", list anything you left for them: legal text, other screens using a different name for the same thing, messages you could not reach. Under Details, every change as before and after, with its file. Under "Not checked", messages you rewrote without seeing them on screen.
