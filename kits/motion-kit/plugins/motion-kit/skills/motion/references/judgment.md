# Judgment: whether something should move, and how much

Read this before deciding that anything animates. The numbers are in [values.md](values.md).

## The six jobs

An animation earns its place by doing one of these. Name the job before choosing a duration.

| Job | What the user learns | Typical cases |
|---|---|---|
| **Answer** | "My input registered." | Press states, toggles, a dragged item following the finger, a field shaking on a wrong password |
| **Connect** | "This thing is that thing." | A popover growing from its button, a thumbnail becoming the detail view, a deleted row closing the gap |
| **Orient** | "I am now here." | Forward and back between pages, a sheet rising over the page it belongs to, tabs sliding in the direction of the tab |
| **Wait** | "Work is happening, about this much." | Progress, skeletons, an optimistic update settling |
| **Point** | "Look at this one change." | A new message arriving, an error appearing on a field, a count updating |
| **Express** | "This product has a character." | A logo that draws in, a celebration after a long task, a mascot |

Tests that decide it:

- **Remove it.** If nobody would notice or be confused, it had no job. Cut it.
- **Slow it to a quarter speed in your head.** If the path, origin or order looks arbitrary, the job is unclear.
- **One job each.** An animation trying to point and express at once does neither. Pick the one that helps the task.
- **Point is rationed.** One thing may ask for attention at a time. Two pulsing elements cancel each other.
- **Express is earned.** It belongs at moments with no task in progress: first run, empty states, completion. It never sits between the user and what they are doing.

## How often sets how much

Count how often one person meets this animation in a working day. That number matters more than how nice it looks once.

| Seen | Examples | Treatment |
|---|---|---|
| Hundreds of times | Typing, keyboard navigation, row hover in a table, command palette, switching tabs with a shortcut | None, or a color change under 100ms |
| Dozens of times | Menus, tooltips, toggles, tab clicks, toasts | 100 to 200ms, small distance, no overshoot |
| A few times | Dialogs, drawers, page changes, expanding a section | 200 to 350ms, clear origin |
| Once or rarely | Onboarding, first-run, finishing a long task, a marketing hero | May run 500ms or more and carry character |

Anything triggered from the keyboard by an expert gets the row above the one its pointer version gets. A person pressing a shortcut has already moved on.

A tooltip that fades in is pleasant the first time and a tax the fortieth. When in doubt, design for the fortieth.

## Registers

A register is how a surface moves overall. Choose one per kind of surface and write it in MOTION.md. A product often has two: the app is quiet and the marketing site is expressive.

| | Quiet | Fluid | Expressive |
|---|---|---|---|
| Fits | Tools, dashboards, editors, admin, anything dense or used all day | Consumer apps, touch-first products, anything with drag and swipe | Marketing pages, launches, portfolios, first-run and celebration moments inside other products |
| Durations | Short end of every token | Middle | Long end, plus sequences |
| Curves | `out` for nearly everything | Springs wherever the user's hand is involved | Strong curves, springs with visible bounce, staged timing |
| Overshoot | Never | Only when the user threw or dropped the thing | Allowed, by design |
| Distance | 4 to 8px | Whatever the gesture covers | Large moves are allowed |
| Scroll effects | None | Sticky headers, pull to refresh | Reveals, pinned sequences, parallax in moderation |
| The risk | Feels dead if answers are missing | Feels slippery if springs are slow | Feels like a template if every section does the same reveal |

Signs the register is wrong: a dashboard whose cards bounce, a banking app with confetti on every transfer, a launch page where nothing moves until hover, a kids' app with 120ms linear fades.

## What never animates

- Text the user is reading or typing. Body copy does not fade in on scroll.
- The response to a keyboard shortcut used many times a minute.
- Content the user is waiting for. Search results appear; they do not stagger in one by one.
- Layout under the pointer. If hovering makes the target move away from the cursor, it flickers.
- Focus rings. Focus has to be visible immediately.
- Errors that block. Show them now.
- Anything during a drag except the dragged thing and what makes room for it.

## Taste, stated as preferences

These are judgment calls. A project's MOTION.md can overrule any of them.

- Prefer the animation nobody mentions. If users describe the product as "animated", there is too much.
- Prefer short and decisive to long and smooth. A 180ms move that knows where it is going beats a 400ms glide.
- Prefer small distances. Eight pixels of travel reads as movement. Forty reads as the interface rearranging itself.
- Prefer fading with a slight move to moving alone. Things that slide in at full opacity look like they were hiding offscreen.
- Prefer starting near full size. Scaling up from 0.96 looks like arriving. Scaling up from 0 looks like a cartoon.
- Prefer things to leave the way they came, faster. An exit is a reversal at about two thirds of the time.
- Prefer one mover. In any transition, one element leads and the others follow less or hold still.
- Prefer the same motion for the same kind of thing everywhere. Two dropdowns that open differently look like two products.
- Prefer physics only where a hand is involved. A spring on a menu opened by a click is decoration. A spring on a sheet released mid-drag is correct.
- Prefer nothing to something wrong. A missing animation is invisible. A bad one is a defect people see every time.

## Signs of motion nobody chose

- Every transition is `0.3s ease` or `transition: all`.
- Durations cluster at round numbers typed from habit: 300, 500, 1000.
- Every section of a page fades up on scroll with the same offset.
- Hover makes cards lift, scale and grow a shadow at once.
- Entrances use bounce because the library's default spring has bounce.
- Exits are missing: things animate in and vanish out.
- Nothing checks `prefers-reduced-motion`.

The inventory script counts most of these.
