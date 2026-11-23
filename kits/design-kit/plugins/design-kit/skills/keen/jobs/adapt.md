# adapt

Makes a screen work properly at other sizes and with other ways of pointing: a phone held in one hand, a tablet, a wide monitor, a finger where a mouse was assumed.

Aggressive. Edits files. Shows every size before and after.

## The idea

Adapting is deciding what matters most at each size and giving it the room. Shrinking the desktop layout until it fits a phone is not adapting, and neither is stretching a phone layout across a monitor.

## Steps

1. **Find out what the product supports.** PRODUCT.md, the project's breakpoints, and whether it is a website, an installed app or both. If they named a size ("fix it on mobile"), that size is the target and the others are checked for damage.
2. **Capture before** at 360, 390, 768, 1024, 1440 and 1920 wide, and at 390 in landscape. On a phone size, also capture with the on-screen keyboard open if the screen has a form.
3. **Walk each size** through the checks below and note every failure.
4. **Fix**, starting from the smallest size. Use the project's breakpoints and layout tools. Add a breakpoint only where the content breaks, not at a device's width.
5. **Capture after** at the same sizes and build the before-and-after page, grouped by size.

## Checks at every size

- **Nothing scrolls sideways** and nothing is cut off. Content reflows down to 320 CSS pixels wide (WCAG 2.2, 1.4.10). A wide table or chart may scroll inside its own box, with a visible cue that it does.
- **The screen's one job is visible without hunting.** On a small screen the main content and main action come first. Secondary panels move below or behind a tap.
- **Lines of text stay readable**: roughly 45 to 75 characters on large screens, and never so wide they span a monitor.
- **Nothing depends on hover.** Anything revealed by hovering has a tap or focus equivalent (WCAG 2.2, 1.4.13).

## Checks for small screens and touch

- **Tap targets** are at least 44 by 44 points (Apple's Human Interface Guidelines) or 48 by 48 density-independent pixels (Material Design), with space between neighbours. The floor is 24 by 24 CSS pixels (WCAG 2.2, 2.5.8). Enlarge the tappable area, not necessarily the icon.
- **The main action is within thumb reach**: lower half of the screen for something used constantly.
- **Text is at least 16 CSS pixels in form fields**, so a phone browser does not zoom the page when a field is focused.
- **System areas are respected**: content clears the notch, the rounded corners and the home indicator, and stays visible above the on-screen keyboard.
- **Navigation fits**: a long horizontal menu becomes a pattern that fits the width, with the current place still shown.
- **Fields ask for the right keyboard** (email, number, phone) and allow password managers and paste.
- **Gestures have a visible alternative.** Anything done by swiping or dragging can also be done with a tap (WCAG 2.2, 2.5.7).

## Checks for large screens

- **Content has a maximum width** and extra space is used on purpose: a second column, a persistent side panel, more rows. Not wider gaps alone.
- **Related things stay near each other.** A button at the far right of a 1920 pixel row is far from the row's label.
- **Keyboard and pointer are served**: visible focus, sensible tab order, and controls that do not need touch-sized spacing can sit closer.

## Limits

- Keep every capability at every size. If something truly cannot work on a phone, say so and ask before hiding it there.
- Do not change the look at the size that already worked unless a fix requires it, and list it if so.
- Native app screens follow the platform's own layout rules. If the project is native, say which of these checks you applied and which you left to the platform.

## Report

Follow the report shape in SKILL.md. "What happened" names the sizes that were broken and are now fixed. Then one line per size: fine already, fixed, or still has a problem. Under "Not checked", every size and device you could only emulate and not see on real hardware.
