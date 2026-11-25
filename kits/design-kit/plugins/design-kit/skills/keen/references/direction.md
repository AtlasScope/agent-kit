# Direction: what may change and who decides

Before changing how a product looks, know which of four kinds each thing you might change belongs to. They carry different authority, and confusing them is how good work gets undone or bad work gets protected. This is a way of thinking, not paperwork: most jobs never write any of it down.

| Kind | What it is | Who can change it | Where it lives |
|---|---|---|---|
| **Invariant** | A truth about the product that no design decision overrides: who it is for, what it must never do, legal marks, accessibility floors, platform rules | Only the person, and only by changing the product | PRODUCT.md, the law, WCAG 2.2, platform guidelines |
| **Commitment** | An approved creative decision: the idea, the stance, the faces, the palette logic, the one loud thing, a signature detail | The person. Keen may propose a change and say why, never make it silently | DESIGN.md, `## Direction` |
| **History** | A decision someone made while building, written in code or notes, with no approval behind it as a creative choice: a radius, a grey, a card component, a layout that happened | Keen, freely, when it no longer serves a commitment. Say in one line what you replaced | The code, its comments, git log |
| **Opportunity** | An idea noticed and not yet tried | Anyone. It costs nothing until someone builds it | DESIGN.md, `## Direction`, under Open |

The common mistake is treating history as commitment ("the cards are rounded, so new cards are rounded") and so making every past accident permanent. The opposite mistake is treating a commitment as history and redesigning what the person chose. When you cannot tell which a decision is, it is history unless DESIGN.md or the person says otherwise, except for anything a person can see on the product's logo, name or main colour, which you treat as a commitment until asked.

The rule in SKILL.md still holds above all four: the person's request in this conversation outranks what is written.

## Reading a project

1. PRODUCT.md for invariants. If it is missing and the work is creative, the invariants are guessed: write the guesses down and say so.
2. DESIGN.md for commitments. A DESIGN.md without a `## Direction` section has token values and component rules but no recorded idea; treat its values as history with a strong presumption to keep them, and its stated principles as commitments.
3. The code and `git log --oneline -20` on the screen's files for history. A comment that says why ("kept flat because the chart sits on top") is stronger history than a bare value.
4. Earlier Keen pages and DESIGN.md's Open list for opportunities.

## The Direction section

Keen writes and updates this section of DESIGN.md. Write it only when work sets or changes a direction; routine jobs read it and leave it alone. Keep it under forty lines. A future runtime reads it by these exact headings, so keep them.

```markdown
## Direction

Idea: <one sentence: source world and structural move>
Stance: <refine | reinvent | experiment | restrain>, <why, one line>

### Commitments
- <decision>: <why it carries the idea> (approved | proposed YYYY-MM-DD)

### Invariants
- <truth>: <source: PRODUCT.md, WCAG 2.2 1.4.3, platform>

### Open
- <opportunity, one line>
```

- A commitment Keen wrote is `proposed` until the person approves it, in words or by asking for work that builds on it. Change `proposed` to `approved` then, with the date.
- Each commitment names its reason. A commitment that cannot say why it carries the idea is a preference; drop it.
- History is never copied here. It stays in the code where it can be replaced.
- When the idea itself changes (a reinvent the person approved), replace the section; the old idea goes into git, not into a list.
