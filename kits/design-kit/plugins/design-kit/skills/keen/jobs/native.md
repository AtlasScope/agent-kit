# native

Makes a phone or tablet app behave the way its platform's own apps do, so people can use it without learning anything new.

Aggressive. Edits files. Works on one platform per run.

## The idea

People spend most of their phone time in other apps. They arrive already knowing how to go back, where the main sections are, how a sheet is dismissed and what a switch looks like. An app that follows those habits feels solid and trustworthy. One that ignores them, usually because it was designed as a website or built once for two platforms, feels slightly wrong in a way people cannot name. This job finds where the app departs from its platform and brings it back. The sources are the platform owners' own published guidance: Apple's Human Interface Guidelines and Google's Material Design.

This job is for apps installed on a device, built with the platform's own tools or with a cross-platform one. For a website on a phone, the job is `/keen adapt`.

## Steps

1. **Pick the platform**: iPhone and iPad, or Android. If the project ships both and the person did not say, ask which first. Do one, then offer the other as a next step.
2. **Run the app** in a simulator or emulator. Capture the screen in question in light and dark, at the default text size and at the largest, and on the smallest and largest device the app supports.
3. **Use it with one hand**, doing the screen's main job. Note every place you reached for something that was not where the platform puts it.
4. **Check each row** of the table below and fix what departs, using the platform's own controls before custom ones.
5. **Capture after**, the same set, and report on the Keen page.

## What the platform expects

| Area | iPhone and iPad | Android |
|---|---|---|
| Main sections | A tab bar at the bottom, two to five tabs, always visible | A navigation bar at the bottom for three to five places, or a rail or drawer on larger screens |
| Going back | A back control at the top left, and a swipe from the left edge that always works | The system back gesture or button always works and does what the person expects |
| Titles and actions | A title at the top, the screen's actions at the top right or in a toolbar | A top app bar with the title, and the main action as a prominent button |
| Temporary tasks | A sheet that slides up and can be pulled down to dismiss | A bottom sheet or a full-screen dialog |
| Choices and alerts | The system's own menus, action sheets and alerts | The system's own menus, dialogs and snackbars |
| Touch | Controls at least 44 by 44 points | Controls at least 48 by 48 density-independent pixels |
| Text | The system font, and text styles that grow with the person's text-size setting | The system or brand font, sized in units that grow with the person's setting |
| Screen edges | Content clears the notch, the rounded corners and the home indicator; scrolling content runs behind bars | Content draws edge to edge and clears the status and navigation areas |
| Lists | Swipe on a row for its actions, pull down to refresh | Swipe where expected, pull down to refresh |
| Light and dark | Follows the system setting, using the system's colours for backgrounds and text | Follows the system setting; can follow the person's own colour scheme |
| Feedback | A light tap of haptics for a confirmed action, never for decoration | Ripple on touch, haptics for confirmed actions |
| Keyboard | The right keyboard for each field, the screen moves so the field stays visible, a clear way to dismiss | The same |
| Accessibility | Every control has a label for VoiceOver; reduce-motion is respected | Every control has a label for TalkBack; reduce-motion is respected |

## Rules

- **The platform's control first.** If the system has a control for the job, use it. It already handles text size, dark mode, accessibility and future system updates. Build a custom one only when PRODUCT.md or DESIGN.md asks for it.
- **Brand lives in colour, type, pictures and words**, not in reinventing navigation.
- **Do not copy one platform onto the other.** A tab bar styled like an iPhone's looks wrong on Android, and the reverse.
- **Keep what the product decided.** If DESIGN.md records a deliberate departure from the platform, leave it and list it as a question.
- **Nothing a person can do is removed.** Moving an action to where the platform puts it is the job; say where each one went.

## Report

Follow the report shape in SKILL.md. In "What happened", say which platform and how many departures were fixed, naming the two or three a person would feel most ("swiping back now works on every screen"). Under Details, each fix with the guideline it follows. Under "Not checked", a real device, the other platform, haptics, and screen readers if you could not run them.
