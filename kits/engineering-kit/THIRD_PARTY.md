# Third-party skills

Every skill below was read in full before it was added (checked 2026-11-06): instructions read for hidden or risky directions, scripts checked for network calls and hooks. Each folder keeps its upstream LICENSE. Nothing here updates on its own.

| Skill | Source | Commit | License |
|---|---|---|---|
| `codebase-design` | [mattpocock/skills](https://github.com/mattpocock/skills) | `4ae2317ddb22` | MIT |
| `diagnosing-bugs` | [mattpocock/skills](https://github.com/mattpocock/skills) | `4ae2317ddb22` | MIT |
| `domain-modeling` | [mattpocock/skills](https://github.com/mattpocock/skills) | `4ae2317ddb22` | MIT |
| `grill-me` | [mattpocock/skills](https://github.com/mattpocock/skills) | `4ae2317ddb22` | MIT |
| `grill-with-docs` | [mattpocock/skills](https://github.com/mattpocock/skills) | `4ae2317ddb22` | MIT |
| `grilling` | [mattpocock/skills](https://github.com/mattpocock/skills) | `4ae2317ddb22` | MIT |
| `improve-codebase-architecture` | [mattpocock/skills](https://github.com/mattpocock/skills) | `4ae2317ddb22` | MIT |
| `research` | [mattpocock/skills](https://github.com/mattpocock/skills) | `4ae2317ddb22` | MIT |
| `retro` | [mattpocock/skills](https://github.com/mattpocock/skills) | `4ae2317ddb22` | MIT |
| `tdd` | [mattpocock/skills](https://github.com/mattpocock/skills) | `4ae2317ddb22` | MIT |
| `to-questionnaire` | [mattpocock/skills](https://github.com/mattpocock/skills) | `4ae2317ddb22` | MIT |
| `wait-what` | [mattpocock/skills](https://github.com/mattpocock/skills) | `4ae2317ddb22` | MIT |
| `wizard` | [mattpocock/skills](https://github.com/mattpocock/skills) | `4ae2317ddb22` | MIT |
| `writing-for-agents` | [mattpocock/skills](https://github.com/mattpocock/skills) | `4ae2317ddb22` | MIT |

## Changes from upstream

- `diagnosing-bugs`, `tdd`, `research` and `wizard` add `disable-model-invocation: true` (and `allow_implicit_invocation: false` for Codex), so they run only when typed.
- `grilling`, `codebase-design`, `domain-modeling` and `writing-for-agents` keep model invocation, because other skills here call them through the Skill tool. Their descriptions were rewritten to name the calling skills and to fire otherwise only on an explicit request.
- Nothing else in any folder was changed.

## Left out of mattpocock/skills, and why

- `code-review`, `pr`, `prototype`, `handoff`: overlap with Claude Code's own `/code-review`, existing PR rules, design-kit's `/prototype` and the private `/pre-compact`.
- `to-spec`, `to-tickets`, `triage`, `wayfinder`, `implement`, `implement-spec`, `setup-matt-pocock-skills`: built around his issue-tracker setup.
- `ask-matt`, `teach`, the `in-progress/` and `misc/` folders: routers, courses or experiments.

## Scripts that ship with a skill

`diagnosing-bugs/scripts/hitl-loop.template.sh` and `wizard/template.sh` are templates the agent copies and edits. Neither makes network calls. The wizard template opens URLs in your browser, reads secrets with hidden input, writes them to `.env` at mode 0600 and, when you run it, can set GitHub secrets through `gh`. `improve-codebase-architecture` writes its report to the OS temp folder and that page loads Tailwind and Mermaid from public CDNs.
