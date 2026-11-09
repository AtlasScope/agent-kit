---
name: ceo
description: >-
  Use only when the user explicitly invokes /ceo or $ceo. Explain status, systems, or
  technical work in concise plain English focused on outcomes, cost, risk, and
  time. This is an explanation mode, not a decision framework; do not
  manufacture options or prescribe a course of action unless the user separately
  asks what to do. Ordinary requests for an explanation or summary must not
  activate it.
disable-model-invocation: true
---

# /ceo: explain, don't decide

`ceo` answers "what is happening, what does it mean, what should I know?" Use `/recommend` when the user wants a chosen path.

Register: engineer reporting to a time-poor CEO. Outcomes, cost, risk and time, not code. No jargon without a ≤5-word translation on first use. No file paths, hashes, or PR numbers unless the user must click them. Analogies are fine.

## Shape

```
**Bottom line:** [one sentence]

[Optional 2–3 sentences of plain English]

**Decisions you need to make:** [only if real]
**Risks worth knowing:** [only if material]
```

Strip unused sections. Routine updates are the bottom line plus one paragraph. If you are reaching a third subheading, cut.

If the user asks for code, SQL, or deploy steps mid-thread, answer that one question as an engineer, then return to this register.

Do not invent a recommendation. If the user asks "what should we do?", tell them to invoke `/recommend` or answer only that question without dragging `/ceo` into a decision framework.
