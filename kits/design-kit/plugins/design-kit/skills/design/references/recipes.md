# Recipes

Generated from `library/library.json` by `kits/design-kit/scripts/build_references.mjs`; do not edit by hand.

Named chains of skills. Run one step per turn and show the result before the next, unless the user says to run it through.

## New landing page

From blank to a shipped page that does not look templated.

1. `/impeccable init`: once per project, so later passes know the brand
2. `/hallmark <prompt>`: build the page in a chosen genre
3. `/break-ui`: stress the hero and cards with ugly data
4. `/web-design-guidelines <path>`: rule check before shipping
5. `/impeccable polish`: final spacing and detail pass

## New dashboard or tool

Product screens with a design system that stays consistent next session.

1. `/impeccable shape`: agree the screen's job and layout first
2. `/interface-design`: build it and save system.md
3. `/break-ui`: long names, zero rows, huge numbers
4. `/impeccable harden`: error, loading and empty states
5. `/interface-design:design-review`: strict approval pass

## This page kind of stinks

Find out why, then fix the worst of it. Stays inside your design system.

1. `/impeccable critique <page>`: scored review: what's wrong and what to fix first
2. `/impeccable typeset`: if the critique flagged hierarchy or type
3. `/impeccable layout`: if it flagged spacing or structure
4. `/impeccable colorize`: if it flagged flat or muddy color
5. `/impeccable polish`: tidy up after the bigger passes

## Rethink it, rules off

Let it suggest new fonts, colors and hierarchy even if that breaks the design system.

1. `/impeccable critique <page>, ignore DESIGN.md and suggest new fonts, colors and hierarchy`: a critique that isn't held to the current system
2. `/prototype <page> x3`: three different directions to look at side by side
3. `/impeccable bolder`: push the winner further
4. `/impeccable document`: save the new look as the design system

## It looks AI-generated

Rescue a bland or generic screen without starting over.

1. `/interface-design:design-deslop`: strip the generic tells
2. `/impeccable typeset`: real type hierarchy
3. `/impeccable bolder`: give it a point of view
4. `/impeccable polish`: tidy what the bigger passes left

## Motion done properly

Add animation where it helps and nowhere else.

1. `/find-animation-opportunities`: read-only list of where motion earns its place
2. `/animate`: build the chosen ones
3. `/review-animations`: check against the ten standards
4. `/animation-performance`: only if anything drops frames

## Pre-ship check

Catch problems before users do. The first three only report.

1. `/impeccable audit`: accessibility, performance, theming, scored
2. `/web-design-guidelines <path>`: file:line rule findings
3. `example-skills:webapp-testing`: click through the real flow in a browser
4. `/impeccable polish`: fix what the reports found

## Feels right on a phone

Make a web app feel like an installed app instead of a website.

1. `/impeccable adapt`: layout across screen sizes
2. `/mobile-native`: tap, notch, 100vh and input-zoom fixes
3. `/apple-design`: gestures, sheets and springs where it matters

## Explore before committing

See real options instead of arguing about one.

1. `/impeccable shape`: write the brief
2. `/prototype <component> x3`: three genuinely different versions
3. `/impeccable live`: refine the winner in the running app

## Clean up a repo's docs

Get a noisy first run of Vale (the prose checker) down to problems worth fixing.

1. `/vale:triage`: decide per rule: fix, downgrade or switch off
2. `/vale:vocab`: teach it your product names
3. `/vale:fix`: fix the error-level alerts that remain
4. `/humanizer`: rewrite the pages that still read as machine-made

## Write prose that doesn't sound like AI

Take one piece of writing from draft to ready to send.

1. `/stop-slop`: draft it with the anti-AI rules on
2. `/slop-guard`: get a score and the list of AI phrases
3. `/humanizer`: rewrite those phrases, facts unchanged
4. `/slop-guard`: score again; it should go up

## Type and color system from scratch

Fonts, a palette scale and dark mode, saved so every later pass uses them.

1. `/web-typography`: pick and pair the faces, set the type scale
2. `/oklch-skill`: palette scale, dark mode, contrast, Tailwind tokens
3. `/impeccable document`: save both as DESIGN.md
4. `/impeccable audit`: check contrast and theming held up

## Landing page that converts

From how you pitch the product to a page that's checked for turning visitors into sign-ups.

1. `/product-marketing`: once per product: audience, claims, voice
2. `/copywriting`: headline, value props, calls to action
3. `/hallmark <prompt>`: build the page around that copy
4. `/image`: a real hero image if the page needs one
5. `/cro`: what will stop people converting, in order
6. `/harsh-review`: the blunt pass before you share it

## Native iPhone screen

SwiftUI screens that someone who knows iPhones well would trust.

1. `/ios-hig-design`: the platform patterns this screen should use
2. `/impeccable shape`: agree the screen's job first
3. `/swiftui-pro`: review the SwiftUI against modern practice
4. `/impeccable audit`: native accessibility and platform rules

## Usability rescue

People get lost or make mistakes. Find out where, then fix it.

1. `/ux-heuristics`: usability audit by Nielsen's rules
2. `/design-everyday-things`: the why: affordances, feedback, mapping
3. `/impeccable distill`: cut what is in the way
4. `/ux-writing`: labels and errors that explain themselves

## Brutal pre-launch review

Every tough review angle at once, then the fixes. Only when you ask for it.

1. `/harsh-review`: blunt, evidence-backed, ships the small fixes
2. `/steve-jobs-design-review`: what to cut for focus
3. `/viewport-proof`: proof it works at every screen size
4. `/impeccable polish`: the last detail pass

## Dark mode done right

Colors that keep their contrast and character in both light and dark themes.

1. `/oklch-skill`: build the dark scale in OKLCH
2. `/impeccable colorize`: apply it with intent, not inversion
3. `/impeccable audit`: contrast and theming checks
4. `/viewport-proof`: screenshots of both themes at each size

## Interactions that feel alive

Feedback on every action, and motion only where it earns its place.

1. `/microinteractions`: design the trigger, rule and feedback
2. `/animate`: build the motion properly
3. `/review-animations`: check against the ten standards
4. `/animation-performance`: only if anything drops frames

## People sign up and drift away

Design how people get started and come back, instead of hoping they will.

1. `/improve-retention`: where the drop happens and why
2. `/impeccable onboard`: first run and empty states
3. `/ux-writing`: the words on those screens
4. `/hooked-ux`: a return habit, checked for manipulation

## Image-led hero

A page built around a real image instead of a gradient.

1. `/image`: make the image, sized for where it goes
2. `/impeccable shape`: plan the hero around it
3. `/hallmark redesign <path>`: rebuild the page to match
4. `/impeccable optimize`: keep the image from slowing the page

## Cinematic launch page

A memorable launch moment that still loads fast.

1. `/top-design`: scroll story, dramatic type, motion plan
2. `/image`: the key visuals
3. `/animate`: each motion built in the right order
4. `/animation-performance`: hold the frame rate
5. `/viewport-proof`: check it on a phone

## Hierarchy fix in an hour

The page works but looks amateur.

1. `/refactoring-ui`: hierarchy, spacing, color and depth
2. `/impeccable layout`: rhythm and structure
3. `/impeccable typeset`: type sizes and weights
4. `/impeccable polish`: tidy the details

## A motion system for the whole app

Decide once how the product moves, then bring the existing animation in line.

1. `/motion setup`: agree the durations, curves and springs; writes MOTION.md
2. `/motion review`: what to cut, fix and add, with frames as evidence
3. `/motion build`: fix the worst three, one at a time
4. `/motion review`: check the result against MOTION.md
