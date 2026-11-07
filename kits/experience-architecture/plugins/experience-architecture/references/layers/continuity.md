# Playbook: continuity and state

Loaded by Diagnose when Back, Forward, refresh, shared links, switching records, overlays or lost input are in question.

Read `${CLAUDE_PLUGIN_ROOT}/references/state-ownership.md` (how to decide where state belongs from what users expect) and `${CLAUDE_PLUGIN_ROOT}/references/evidence.md`.

## Procedure

1. **Locate the state.** Start from the `continuity` signals in the static map. For each screen in scope, build a state ledger by reading the code:

   | Screen | State | Owner today (path, query, component, layout, store, storage) | Should be | Push/replace today | Should be |
   |---|---|---|---|---|---|

   Look specifically at layouts and providers above dynamic segments (state persists across records), Next.js `template` files and components declared inside other components (state resets), global stores with record-specific fields, `router.push` for tab and filter changes, `replace` for opening overlays, in-app back buttons that push the parent, missing scroll restoration, and `key` props, or their absence, on record views.

2. **Model the journeys.** For the symptom the user described, plus the common loops (list → record → back, record → sibling record, tab → tab → back, open overlay → back, filter → refresh, deep link signed out → sign in), write the expected history stack and view at each step before running anything. The expectation comes from how users of this screen would expect it to behave, not from what the code does. When that expectation is genuinely open (should tabs add history entries here?), mark the step as a decision rather than a defect.

3. **Run them** with the Verify procedure (`${CLAUDE_PLUGIN_ROOT}/skills/verify/SKILL.md`): one journey spec, `ea journey <spec> --out <out>/journeys`. Use `label` and `sameAs` to assert "returns to the same view", and `coldOpen` to check that a shared link reproduces it. Without a running app, walk the code path for each step and label findings code-certain or likely.

4. **Explain the sequence.** For each anomaly, connect the observation to the owning code, such as "the filter is `useState` in `orders/page.jsx:7`; nothing writes it to the URL, so the remount on Back starts from the default". Then say what users experience, in task terms.

5. **Find the rule that is missing.** Many continuity bugs share one cause: no agreed rule for what goes in the URL, or overlays implemented three different ways. Recommend the rule (a short state-ownership table for this app, each row justified by the user expectation behind it) and the few shared primitives that would enforce it, such as a `useUrlState` hook, one overlay-route pattern, or keying record views by id. Prefer one shared mechanism over per-screen patches.

## Output

`<out>/continuity.md` holds the state ledger, the expected-versus-observed history table per journey, findings with repro records, the transition map (`transitions.mmd`), and the proposed state rules. Diagnose's report carries the defects reproduced, the root rule that is missing, and the smallest change that fixes the most.

Read-only playbook: it never edits the app.
